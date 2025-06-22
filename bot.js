import { createWappy } from './src/client.js';
import qrcode from 'qrcode-terminal';

const client = await createWappy({
  sessionName: 'teste',
  qrCallback: (qr) => qrcode.generate(qr, { small: true }),
  Print: ({ remoteJid, text }) => {
    console.log(`[${remoteJid}] ${text}`);
  },
  fromMe:true,
  groupIgnore : true,
  
});

client.on('message', ({ text, targetJid }) => {
  console.log('Mensagem recebida de:', targetJid);
  console.log('Msg-->',text);
  if(text === "ping"){
    client.sendText(targetJid,"pong")
  }
});

client.start();
