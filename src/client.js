import * as baileys from '@whiskeysockets/baileys';
import P from 'pino';
import * as fs from 'fs';
import * as path from 'path';


const { makeWASocket, useMultiFileAuthState, DisconnectReason } = baileys;

import express from 'express';
const app = express();
import cors from 'cors';

let latestQrCode = null;
let connectionQr = false;

export async function startServe(port) {
  app.listen(port, () =>
    console.log(`🚀 Server --> qrCode http://localhost:${port}/qr-connection\n📢 Status  --> connection http://localhost:${port}/status-connection`)
  );
}

export async function createServer(qr) {
  app.use(cors());
  app.use(express.json());
  latestQrCode = qr
  app.get('/qr-connection', (_, res) => {
    res.json({ qrCode: latestQrCode });
  });
  app.get('/status-connection', (_, res) => {
    res.json({ connection: connectionQr });
  });
} 

export async function createWappy(options) {
  const {
    sessionName = 'default',
    qrCallback = (qr) => console.log('🆗 QR Code:', qr),
    logger = P({ level: 'silent' }),
    fromMe = false,
    all = false,
    groupIgnore = false,
    viewLog = false,
  } = options;

  const { state, saveCreds } = await useMultiFileAuthState(`auth/${sessionName}`);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger,
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, qr, lastDisconnect } = update;

    if (qr && qrCallback) {
        
      qrCallback(qr);
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut);
      console.log('⬆️ Conexão fechada. Reconectando?', shouldReconnect);
      if (shouldReconnect) createWappy(options);
    } else if (connection === 'open') {
      connectionQr = true;
      console.log('✅ Conectado com sucesso.');
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

          // 🔒 Ignora mensagens de grupos, se ativado
          if (groupIgnore && remoteJid.endsWith('@g.us')) return;
          
          // 🎯 Regras de prioridade
          if (fromMe) {
            // Só responde mensagens do próprio dono
            if (!isFromMe) return;
          } else {
            if (all) {
              // Responde todas — nada a filtrar
            } else {
              // all === false → responde só usuários externos
              if (isFromMe) return;
            }
          }
          
          const text =
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            msg.message?.imageMessage?.caption ||
            msg.message?.videoMessage?.caption;

          if (!text) return;
          let targetJid = remoteJid;
          if (!remoteJid.includes('@lid')) {
            try {
              const [waInfo] = await sock.onWhatsApp(remoteJid);
              if (waInfo?.jid) {
                targetJid = waInfo.jid;
              }
            } catch (e) {
              console.warn('Erro ao buscar jid real:', e.message);
            }
          }

          if (viewLog){
            console.log(`📩 Mensagem de ${remoteJid} \n⚡ Texto: ${text}`);
          }
          callback({
            msg,
            text,
            remoteJid,
            targetJid,
          });
        });
      }
    },

    sendText: async (jid, text) => {
      return await sock.sendMessage(jid, { text });
    },

    replay: async (jid, ReplayText, quotedMsg) => {
        return await sock.sendMessage(
          jid,
          { text: ReplayText },
          { quoted: quotedMsg }
        );
    },

    sendDocument: async (jid, filePath, options = {}) => {
        const fileBuffer = fs.readFileSync(filePath);
        return await sock.sendMessage(jid, {
          document: fileBuffer,
          mimetype: options.mimetype || 'application/octet-stream',
          fileName: options.fileName || path.basename(filePath)
        });
      }
    ,      

    start: async () => {
      console.log('🟢 Wappy iniciado...');
    }
  };
}