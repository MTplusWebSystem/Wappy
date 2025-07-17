// bot.js
import qrcode from 'qrcode-terminal';
import { createWappy } from './src/client.js';

const client = await createWappy({
  sessionName: 'wappy-bot',
  printQRInTerminal: true,
  qrCallback: (qr) => qrcode.generate(qr, { small: true }),
  viewLog: true,
  all: true,
  groupIgnore: true,
  connectionNumber: '67996520842', // Ativa login via número
  server: { status: true, serverPort: 4000 },
});
''
client.on('message', async ({ text, targetJid, msg }) => {
  if (text.toLowerCase() === '/apk') {
    await client.sendDocument(targetJid, './storage/RVX_19.16.39.apk', {
      mimetype: 'application/vnd.android.package-archive',
      fileName: 'youtubeMod.apk',
    });
    await client.replay(
      targetJid,
      'Seu APK foi enviado com sucesso...',
      msg
    );
  }
});

await client.start();
