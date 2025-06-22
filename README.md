
````md
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
> É recomendável instalar junto ao `wappy`.

---

## ⚡ Exemplo Rápido

```js
import { createWappy } from '@mtplusdev/wappy';
import qrcode from 'qrcode-terminal';

const client = await createWappy({
  sessionName: 'teste',
  qrCallback: (qr) => qrcode.generate(qr, { small: true }),
  Print: ({ remoteJid, text }) => {
    console.log(`📩 Mensagem de ${remoteJid}: ${text}`);
  }
});

client.on('message', ({ text, targetJid }) => {
  if (text.toLowerCase() === 'ping') {
    client.sendText(targetJid, '🏓 pong!');
  }
});

client.start();
```

---

## 📂 Sessões e autenticação

Por padrão, o Wappy salva os dados da sessão no diretório:

```
auth/<sessionName>/
```

Você pode deletar esse diretório para forçar novo login (novo QR Code).

---

## 🛠️ Recursos disponíveis

* 📡 Conexão automática via QR Code
* 🔄 Reconexão automática
* 💬 Escuta de mensagens com `text`
* 🚀 Resposta programada (`sendText`)
* ✅ Filtro automático para mensagens do tipo `notify` e chats privados

---

## 📄 Licença

MIT

---
