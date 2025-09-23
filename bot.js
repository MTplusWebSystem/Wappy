import app, { createWappy,createServer,startServe} from './src/client.js';

const client = await createWappy({
  sessionName: 'teste',
  qrCallback: (qr) => {
    createServer(qr)
    return qr;
  },
  all: true, // ✅ Permite ou ignora mensagens enviadas por todos
  viewLog: true, // ✅ Mostra logs básicos
  fromMe: false, // ✅ Permite ou ignora mensagens enviadas por você mesmo
  groupIgnore: true, // ✅ Ignora mensagens de grupos
});

startServe("4000")


app.get('/', (req, res) => {
  res.send('Olá, mundo!');
});


client.on('message', async ({ text, targetJid, msg }) => {
  if (text.toLowerCase() === 'ping') {
    await client.sendText(targetJid, '🏓 pong!');
  }

  if (text.toLowerCase() === 'replay') {
    await client.replay(targetJid, '🔁 Isso é uma resposta com citação!', msg);
  }
});

client.start();