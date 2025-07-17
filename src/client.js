// src/client.js
import * as baileys from '@whiskeysockets/baileys';
import express from 'express';
import P from 'pino';
import fs from 'fs';
import path from 'path';

const { makeWASocket, useMultiFileAuthState, DisconnectReason } = baileys;
const app = express();

export async function createWappy(options) {
  const {
    sessionName = 'default',
    connectionNumber = null,
    printQRInTerminal = false,
    qrCallback,
    logger = P({ level: 'silent' }),
    fromMe = false,
    all = false,
    groupIgnore = false,
    viewLog = false,
    server = { status: false, serverPort: 3000 },
  } = options;

  const finalQrCallback =
    qrCallback || (printQRInTerminal ? (qr) => console.log('🆗 QR Code:', qr) : () => {});

  const { state, saveCreds } = await useMultiFileAuthState(`auth/${sessionName}`);
  const sock = makeWASocket({ auth: state, printQRInTerminal: false, logger });

  let latestQrCode = null;
  let latestPairCode = null;
  let pairingRequested = false;

  if (server.status) {
    app.use(express.json());
    app.get('/data', (_, res) => {
      res.json({ qrCode: latestQrCode, pairCode: latestPairCode });
    });
    app.listen(server.serverPort, () =>
      console.log(`🚀 Server --> http://localhost:${server.serverPort}/data`)
    );
  }

  sock.ev.on('connection.update', async (update) => {
    const { connection, qr, lastDisconnect } = update;
  
    if (connection === 'open') {
      console.log('✅ Conectado com sucesso!');
  
      // Se ainda não foi pareado e temos número, tente gerar código
      if (connectionNumber && !pairingRequested && !sock.authState.creds?.registered) {
        pairingRequested = true;
  
        try {
          const code = await sock.requestPairingCode(connectionNumber);
          latestPairCode = code;
          console.log('📥 Pairing Code:', code);
        } catch (err) {
          console.error('❌ Erro ao gerar Pairing Code:', err);
        }
      }
    }
  
    if (qr) {
      latestQrCode = qr;
      finalQrCallback(qr);
    }
  
    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('⬆️ Conexão fechada. Reconectar?', shouldReconnect);
      if (shouldReconnect) await createWappy(options);
    }
  });
  

  sock.ev.on('creds.update', saveCreds);

  return {
    on: (event, callback) => {
      if (event === 'message') {
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
          if (type !== 'notify') return;
          const msg = messages[0];
          if (!msg?.message) return;

          const { remoteJid } = msg.key || {};
          if (!remoteJid) return;
          const isFromMe = !!msg.key.fromMe;

          if (groupIgnore && remoteJid.endsWith('@g.us')) return;
          if (fromMe && !isFromMe) return;
          if (!fromMe && !all && isFromMe) return;

          const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            msg.message.videoMessage?.caption;
          if (!text) return;

          let targetJid = remoteJid;
          if (!remoteJid.includes('@')) {
            try {
              const [waInfo] = await sock.onWhatsApp(remoteJid);
              if (waInfo?.jid) targetJid = waInfo.jid;
            } catch {}
          }

          if (viewLog) console.log(`📩 ${remoteJid}: ${text}`);
          callback({ msg, text, remoteJid, targetJid });
        });
      }
    },

    sendText: async (jid, text) => sock.sendMessage(jid, { text }),
    replay: async (jid, ReplayText, quotedMsg) =>
      sock.sendMessage(jid, { text: ReplayText }, { quoted: quotedMsg }),

    sendDocument: async (jid, filePath, options = {}) => {
      const buf = fs.readFileSync(filePath);
      return sock.sendMessage(jid, {
        document: buf,
        mimetype: options.mimetype || 'application/octet-stream',
        fileName: options.fileName || path.basename(filePath),
      });
    },

    start: async () => {
      console.log('🟢 Wappy iniciado...');
    },
  };
}
