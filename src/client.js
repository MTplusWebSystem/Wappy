import * as baileys from '@whiskeysockets/baileys';
import P from 'pino';

const { makeWASocket, useMultiFileAuthState, DisconnectReason } = baileys;

export async function createWappy(options) {
  const {
    sessionName = 'default',
    qrCallback = (qr) => console.log('🆗 QR Code:', qr),
    logger = P({ level: 'silent' }),
    fromMe = false,
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

          // Ignora mensagens de grupo se configurado para isso
          if (groupIgnore && remoteJid.endsWith('@g.us')) return;

          // Filtra mensagens com base no fromMe
          if (fromMe) {
            if (!msg.key.fromMe) return;
          } else {
            if (msg.key.fromMe) return;
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
            console.log(```📩 Mensagem de ${remoteJid} \n⚡ Texto: ${text}```);
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

    start: async () => {
      console.log('🟢 Wappy iniciado...');
    }
  };
}
