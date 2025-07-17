

# 🌐 Wappy · 💬🤖

![Logo](https://em-content.zobj.net/source/microsoft-teams/337/speech-balloon_1f4ac.png)
**Wappy** é sua ponte entre ideias e mensagens.

Uma biblioteca simples e poderosa para criar bots, integrações e automações no WhatsApp usando a engine [Baileys](https://github.com/WhiskeySockets/Baileys).

> Desenvolvido com 💚 por [@MTplusWebSystem](https://github.com/MTplusWebSystem)

---

## 🚀 Instalação

```bash
npm install @mtplusdev/wappy qrcode-terminal express cors
```

> A `qrcode-terminal` exibe o QR Code diretamente no terminal.
> Instale junto ao `wappy` no seu projeto.
> Server fornece a payload para conversão em qr-code
---

## ⚡ Exemplo rápido qr-terminal

```js
// main.js
import { createWappy } from '@mtplusdev/wappy';
import qrcode from 'qrcode-terminal';

const client = await createWappy({
  sessionName: 'teste',
  printQRInTerminal: true,
  qrCallback: (qr) => qrcode.generate(qr, { small: true }),
  all: true, // ✅ Permite ou ignora mensagens enviadas por todos
  viewLog: true, // ✅ Mostra logs básicos
  fromMe: false, // ✅ Permite ou ignora mensagens enviadas por você mesmo
  groupIgnore: true, // ✅ Ignora mensagens de grupos
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
```

> 💡 Execute com `node main.mjs` se seu `package.json` tiver `"type": "module"`.

---
## ⚡ Exemplo rápido qr-server

```js
// main.js
import { createWappy } from '@mtplusdev/wappy';
import qrcode from 'qrcode-terminal';

const client = await createWappy({
  sessionName: 'teste',
  printQRInTerminal: true,
  qrCallback: (qr) => qrcode.generate(qr, { small: true }),
  all: true, // ✅ Permite ou ignora mensagens enviadas por todos
  viewLog: true, // ✅ Mostra logs básicos
  fromMe: false, // ✅ Permite ou ignora mensagens enviadas por você mesmo
  groupIgnore: true, // ✅ Ignora mensagens de grupos
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
```

> 💡 Execute com `node main.mjs` se seu `package.json` tiver `"type": "module"`.

---

## ✨ Novidades

###  `🚀 Server` 

```js
const client = await createWappy({
  sessionName: 'wappy-bot',
  viewLog: true,
  all: true,
  groupIgnore: true,
  server: { status: true, serverPort: 4000 },
});
```
retorno no /data

ex: 
```json
{
	"qrCode": "2@B9K5q7U7VrKG4ZgmE8XAW5osqzOIVgeA/YxQvlwbvhI52S6kbw6ehQMw+8KBRKRfl4vr6QLrpxur77DShXqS6Rltl4y97zABq8A=,lwL8/4vwgvKOvD6njZ/Da4i6EDZPLZIoBtndFa+Y6C0=,d9VzKcnYTMWJ4ki4tJ2VRT2nAKmoZXdYU4/Ozm/SKG8=,wnRChE2+ZXzbd4E0S0wwczJYnqrwywlhciYwfUsa/U4=",
	"pairCode": null
}
```

### 🔁 `replay(jid, text, quotedMsg)`
### 🔁 `sendDocument(jid, text, quotedMsg)`


Agora é possível responder mensagens com citação, como no WhatsApp tradicional e enviar arquivos.

```js
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
```


### ⚙️ Novos parâmetros na criação:

| Parâmetro     | Descrição                                                              |
| ------------- | ---------------------------------------------------------------------- |
| `fromMe`      | Aceita ou ignora mensagens enviadas por você mesmo (`true` ou `false`) |
| `all`         | Aceita ou ignora mensagens enviadas por todos (`true` ou `false`)      |
| `groupIgnore` | Ignora mensagens de grupos (`true`)                                    |
| `viewLog`     | Mostra log básico de mensagens recebidas no terminal (`true`)          |

---

## 🧱 Estrutura modular para projetos grandes

Se quiser criar uma aplicação robusta e escalável:

```
/seu-projeto
├── main.js           # ponto de entrada
├── handler.js        # manipulador de mensagens
├── package.json
└── auth/             # sessões geradas automaticamente
```

### `main.js`

```js
import { createWappy } from '@mtplusdev/wappy';
import qrcode from 'qrcode-terminal';
import { handleMessage } from './handler.js';

const client = await createWappy({
  sessionName: 'meu-bot',
  qrCallback: (qr) => qrcode.generate(qr, { small: true }),
  viewLog: true
});

client.on('message', handleMessage(client));
client.start();
```

### `handler.js`

```js
export function handleMessage(client) {
  return async ({ text, targetJid, msg }) => {
    if (!text) return;

    if (text.toLowerCase() === 'ping') {
      await client.sendText(targetJid, '🏓 pong!');
    }

    if (text.toLowerCase() === 'responder') {
      await client.replay(targetJid, '🔁 Resposta com citação!', msg);
    }
  };
}
```

---

## 📂 Sessão e autenticação

O Wappy salva sua sessão automaticamente em:

```
auth/<sessionName>/
```

Para forçar um novo login, basta apagar essa pasta.

---

## ✅ Recursos

* 📡 Conexão com QR Code
* 🔄 Reconexão automática
* 💬 Escuta de mensagens com filtro
* ✉️ Envio de mensagens (`sendText`)
* 🔁 Resposta com citação (`replay`)
* 🎯 Filtros para grupos e mensagens do próprio bot

---

## 📄 Licença

MIT

---

