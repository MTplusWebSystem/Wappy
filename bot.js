import { createWappy } from './src/client.js';
import qrcode from 'qrcode-terminal';

const client = await createWappy({
  sessionName: 'wappy-bot',
  qrCallback: (qr) => qrcode.generate(qr, { small: true }),
  viewLog: true,
  all: true,
  groupIgnore: true
});

client.on('message', async ({ text, targetJid, msg }) => {
  if (text.toLowerCase() === '/apk') {
    const filePath = './storage/RVX_19.16.39.apk';

    await client.sendDocument(targetJid, filePath, {
      mimetype: 'application/vnd.android.package-archive',
      fileName: 'youtubeMod.apk'
    });

    await client.replay(
      targetJid,
      "Seu apk foi enviado com sucesso...\nAgora logue com suas informações de teste.",
      msg
    );
  }
});

client.start();
