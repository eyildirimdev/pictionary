# 🎨 Real‑time Pictionary – Starter Repo

> **Goal**: minimal but working monorepo (server + web + mobile) that satisfies the coding exercise.  
> **Time‑box**: designed so you can finish polishing in < 1 hour.

---

## Prerequisites

| Tool | Version (or higher) |
|------|---------------------|
| Node | 20.x |
| pnpm | 9.x |
| Expo CLI | `npm i -g expo` |
| Cursor or Windsurf | as IDE |

---

## 1 ‑ Clone & Install

```bash
pnpm install        # installs all workspace deps
cp .env.example .env
```

## 2 ‑ Run everything (dev)

```bash
pnpm dev            # parallel: server ◾ web ◾ mobile
```

- **Mobile**: press **`i`** (iOS) or **`a`** (Android) in the Expo CLI window,  
  or scan the QR code with Expo Go.
- **Web**: <http://localhost:5173>
- **Server**: <http://localhost:4000/health>

---

## 3 ‑ Scripts

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Concurrent dev servers (Socket.IO hub, Vite + Tailwind, Expo) |
| `pnpm build` | Type‑checks & builds each workspace |
| `pnpm lint` | ESLint + Prettier |

---

## 4 ‑ Environment

```dotenv
# .env.example
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
```

---

## 5 ‑ How it works (quick)

```
mobile      web
  │          │
  │socket.io │socket.io‑client
  ▼          ▼
        server
     (Express + Socket.IO)
```

- The **server** holds a tiny in‑memory map of rooms and the current word.
- **Clients** emit:
  - `stroke`  → everyone in the room draws the line
  - `guess`   → server checks; on correct guess → broadcasts `correctGuess` & new `word`
  - `clear`   → wipes the canvases

Feel free to swap the drawing libs (e.g. use `react-native-skia`) or extend the protocol. The important part is that everything runs locally following the README.

Happy hacking! ✨
