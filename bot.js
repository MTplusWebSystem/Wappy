import { createWappy } from './src/client.js';
import qrcode from 'qrcode-terminal';

const client = await createWappy({
  sessionName: 'wappy-bot',
  qrCallback: (qr) => qrcode.generate(qr, { small: true }),
  viewLog: true,
  fromMe: false // CORRIGIDO
});

client.on('message', async ({ text, targetJid, msg }) => {
  // Mensagem de comando
  if (text === "/start") {
    await client.sendText(targetJid, "Olá 👋 Estou pronto para receber arquivos!");
    return;
  }

  // Tenta salvar a mídia, se houver
  const savedPath = await client.saveMediaToFile(msg, "./storage");

  if (savedPath) {
    await client.sendText(targetJid, `✅ Arquivo salvo com sucesso: ${savedPath}`);
  } else {
    await client.sendText(targetJid, `⚠️ Nenhum arquivo foi detectado na mensagem.`);
  }
});

client.start();
