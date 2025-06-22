
# Wappy · 💬

**Wappy** é sua ponte entre ideias e mensagens.  
Uma biblioteca simples e poderosa para criar bots, integrações e automações no WhatsApp usando a engine [Baileys](https://github.com/WhiskeySockets/Baileys).

> Desenvolvido por [@MTplusWebSystem](https://github.com/MTplusWebSystem)

---

## 🚀 Instalação

```bash
npm install @mtplusdev/wappy qrcode-terminal
````

> A `qrcode-terminal` é usada para exibir o QR Code no terminal.
> Instale junto ao `wappy` no seu projeto.

---

## ⚡ Exemplo rápido (1 arquivo)

```js
// main.mjs
import { createWappy } from '@mtplusdev/wappy';
import qrcode from 'qrcode-terminal';

const client = await createWappy({
  sessionName: 'teste',
  qrCallback: (qr) => qrcode.generate(qr, { small: true }),
  Print: ({ remoteJid, text }) => {
    console.log(`📩 ${remoteJid}: ${text}`);
  }
});

client.on('message', ({ text, targetJid }) => {
  if (text.toLowerCase() === 'ping') {
    client.sendText(targetJid, '🏓 pong!');
  }
});

client.start();
```

> 💡 Esse código pode ser executado diretamente com `node main.mjs` se seu `package.json` tiver `"type": "module"`.

---

## 🧱 Estrutura modular para projetos grandes

Se quiser criar uma aplicação mais robusta, modular e organizada, siga este modelo básico:

```
/seu-projeto
├── main.mjs           # ponto de entrada
├── handler.js         # lida com mensagens
├── package.json
└── auth/              # sessão (gerada automaticamente)
```

### `main.mjs`

```js
import { createWappy } from '@mtplusdev/wappy';
import qrcode from 'qrcode-terminal';
import { handleMessage } from './handler.js';

const client = await createWappy({
  sessionName: 'meu-bot',
  qrCallback: (qr) => qrcode.generate(qr, { small: true }),
  Print: ({ remoteJid, text }) => {
    console.log(`📩 ${remoteJid}: ${text}`);
  }
});

client.on('message', handleMessage(client));
client.start();
```

### `handler.js`

```js
export function handleMessage(client) {
  return async ({ text, targetJid }) => {
    if (!text) return;

    if (text.toLowerCase() === 'ping') {
      await client.sendText(targetJid, '🏓 pong!');
    }
  };
}
```

---

## 📂 Sessão e autenticação

Por padrão, o Wappy salva a autenticação em:

```
auth/<sessionName>/
```

Você pode deletar esse diretório para forçar novo login via QR Code.

---

## 🛠️ Recursos disponíveis

* 📡 Conexão automática via QR Code
* 🔄 Reconexão automática
* 💬 Escuta de mensagens com `text`
* 🚀 Resposta programada (`sendText`)
* ✅ Filtro automático para mensagens `notify` e chats privados

---

## 📄 Licença

MIT

