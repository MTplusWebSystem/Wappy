import * as baileys from '@whiskeysockets/baileys';
import P from 'pino';
import * as fs from 'fs';
import * as path from 'path';


const { makeWASocket, useMultiFileAuthState, DisconnectReason } = baileys;

import express from 'express';
const app = express();

export function createApp() {
  const app = express();
  return app;
}

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
    fulLog = false,
  } = options;

  const { state, saveCreds } = await useMultiFileAuthState(`auth/${sessionName}`);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger,
  });

    // ----- Helpers para logging seguro e sumarização de mensagens -----
    function safeStringify(obj, space = 2) {
      const seen = new WeakSet();
      return JSON.stringify(obj, function (key, val) {
        // detectar TypedArrays / Buffers
        if (val && (val instanceof Uint8Array || ArrayBuffer.isView(val))) {
          return `[Uint8Array len=${val.byteLength || val.length}]`;
        }
        if (typeof val === 'function') return `[Function ${val.name || 'anonymous'}]`;
        if (val instanceof Error) return { message: val.message, stack: val.stack };
        if (typeof val === 'bigint') return val.toString() + 'n';
        if (val && typeof val === 'object') {
          if (seen.has(val)) return '[Circular]';
          seen.add(val);
        }
        return val;
      }, space);
    }
  
    function safeLog(label, obj) {
      try {
        console.log(`🔍 ${label}:`, safeStringify(obj));
      } catch (e) {
        console.log(`🔍 ${label}: [erro ao serializar]`, e);
      }
    }
  
    function summarizeMessage(msg) {
      const messageObj = msg?.message || {};
      const ext = messageObj?.extendedTextMessage || {};
      const text =
        messageObj?.conversation ||
        ext?.text ||
        messageObj?.imageMessage?.caption ||
        messageObj?.videoMessage?.caption ||
        messageObj?.documentMessage?.fileName ||
        messageObj?.audioMessage?.fileName ||
        null;
  
      const quotedInfo = ext?.contextInfo?.quotedMessage
        ? {
            stanzaId: ext.contextInfo.stanzaId || null,
            participant: ext.contextInfo.participant || null,
            quotedText:
              ext.contextInfo.quotedMessage?.conversation ||
              ext.contextInfo.quotedMessage?.imageMessage?.caption ||
              ext.contextInfo.quotedMessage?.videoMessage?.caption ||
              null,
          }
        : null;
  
      return {
        id: msg?.key?.id || null,
        remoteJid: msg?.key?.remoteJid || null,
        fromMe: !!msg?.key?.fromMe,
        pushName: msg?.pushName || null,
        timestamp:
          msg?.messageTimestamp ||
          msg?.message?.timestamp ||
          msg?.key?.t ||
          (msg?.messageTimestamp && Number(msg.messageTimestamp)) ||
          null,
        messageTypes: Object.keys(messageObj),
        text,
        hasMedia: !!(
          messageObj?.imageMessage ||
          messageObj?.videoMessage ||
          messageObj?.documentMessage ||
          messageObj?.audioMessage
        ),
        mediaInfo: {
          image: !!messageObj?.imageMessage,
          video: !!messageObj?.videoMessage,
          document: !!messageObj?.documentMessage,
          audio: !!messageObj?.audioMessage,
        },
        quoted: quotedInfo,
      };
    }
  
    // ----- Full log de eventos (inclui mensagens com resumo) -----
    if (fulLog) {
      // eventos de mensagens
      sock.ev.on('messages.upsert', (m) => {
        safeLog('messages.upsert (raw)', m);
        try {
          const msgs = m?.messages || [];
          for (const msg of msgs) {
            const sum = summarizeMessage(msg);
            console.log('✉️ messages.upsert (summary):', safeStringify(sum, 2));
          }
        } catch (e) {
          console.warn('Erro ao resumir messages.upsert:', e);
        }
      });
  
      sock.ev.on('messages.update', (m) => {
        safeLog('messages.update', m);
      });
  
      sock.ev.on('messages.delete', (m) => {
        safeLog('messages.delete', m);
      });
  
      // reações (se houver no baileys que você usa)
      sock.ev.on('messages.reaction', (m) => {
        safeLog('messages.reaction', m);
      });
  
      // outros eventos úteis
      sock.ev.on('connection.update', (c) => safeLog('connection.update', c));
      sock.ev.on('creds.update', (c) => safeLog('creds.update', c));
      sock.ev.on('contacts.upsert', (c) => safeLog('contacts.upsert', c));
      sock.ev.on('chats.upsert', (c) => safeLog('chats.upsert', c));
      sock.ev.on('chats.update', (c) => safeLog('chats.update', c));
      sock.ev.on('chats.delete', (c) => safeLog('chats.delete', c));
      sock.ev.on('groups.update', (g) => safeLog('groups.update', g));
      sock.ev.on('group-participants.update', (g) => safeLog('group-participants.update', g));
    }
  
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

          if (viewLog) {
            console.log(
              `📩 Mensagem de ${remoteJid} (${msg.pushName || "Sem nome"})\n⚡ Texto: ${text}`
            );
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

export async function SendText(JID, message) {
  try {
    // Verifica se o socket está inicializado
    if (!sock) {
      throw new Error('WhatsApp socket não está inicializado. Certifique-se de que a conexão foi estabelecida.');
    }

    // Formata o número de telefone (adiciona @s.whatsapp.net para o JID)
    const jid = JID;

    // Envia a mensagem de texto
    await sock.sendMessage(jid, { text: message });

    console.log(`Mensagem enviada para ${phoneNumber}: ${message}`);
    return { success: true, message: `Mensagem enviada com sucesso para ${phoneNumber}` };
  } catch (error) {
    console.error(`Erro ao enviar mensagem para ${phoneNumber}:`, error);
    return { success: false, error: `Falha ao enviar mensagem: ${error.message}` };
  }
}