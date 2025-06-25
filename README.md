# 🎨 Pictionary — Full-Stack Realtime Draw-and-Guess

Monorepo (pnpm workspaces)  
Node 20 + TypeScript • Vite React 18 • Expo SDK 50 • Socket.IO

---

## 0  Prerequisites

| What                | Why                    | Install                                                                 |
|---------------------|------------------------|-------------------------------------------------------------------------|
| Node 20 arm64 (Apple Silicon) | Server & tooling        | `brew install nvm` → `nvm install 20 --arch=arm64`                      |
| pnpm ≥ 8            | Workspace & lockfile   | `npm i -g pnpm`                                                        |
| Xcode + iOS Sim     | iOS emulation          | Xcode ▸ Settings ▸ Platforms                                            |
| Expo CLI (local)    | Native dev server      | auto-bundled in `node_modules/expo`                                    |
| Expo Go (phone)     | Test on real device    | App Store / Google Play                                                |

**Rosetta warning**  
Run your terminal without Rosetta (`arch` should print `arm64`). Mixed installs break native modules (esbuild, rollup-darwin-x64, …).

---

## 1  Clone & Install

```sh
git clone https://github.com/your-org/pictionary.git
cd pictionary
pnpm install            # installs root + server + web + mobile
```

---

## 2  Environment

Copy & edit:

```sh
cp .env.example .env
```

```env
# .env
PORT=4000                        # Express / Socket.IO
CLIENT_ORIGIN=http://localhost:5173
EXPO_PUBLIC_SERVER_URL=http://YOUR_LAN_IP:4000   # phone ↔ server
```

Use your laptop's LAN IPv4 so real phones can reach the server.

---

## 3  One-Shot Dev

```sh
pnpm dev
```

| Service      | Port | Notes                        |
|--------------|------|------------------------------|
| Web (Vite)   | 5173 | http://localhost:5173        |
| API / WS     | 4000 | logs in terminal             |
| Expo Dev     | 8081 | press i (iOS) or a (Android) |

The script auto-kills ports 4000/5173/8081 first.

<details><summary>Run individually</summary>

```sh
pnpm --filter server dev    # ts-node-dev
pnpm --filter web dev       # Vite HMR
pnpm --filter mobile dev    # Expo, then press i/a
```

</details>

---

## 4  Real Device Testing

1. Phone & laptop on same Wi-Fi.
2. Put laptop's IP in `.env` → `EXPO_PUBLIC_SERVER_URL`.
3. Restart `pnpm dev`.
4. Open Expo Go → scan QR in terminal.

---

## 5  Troubleshooting

| Symptom                                         | Fix                                                                 |
|-------------------------------------------------|---------------------------------------------------------------------|
| EADDRINUSE                                      | Another app on port → `lsof -i :4000` then `kill -9 <pid>`          |
| esbuild … needs @esbuild/darwin-arm64 but x64 found | Re-install outside Rosetta: `rm -rf node_modules pnpm-lock.yaml` → `pnpm i` |
| Expo "no apps connected"                        | Phone not on same LAN or firewall blocks 8081                       |

---

## 6  Production Builds

### Web (static)

```sh
pnpm --filter web build   # → web/dist
```

Deploy `web/dist` to Vercel / Netlify / S3 etc.

### Server (Node)

```sh
pnpm --filter server build   # tsc → server/dist
node server/dist/index.js    # or pm2 / docker
```

### Native apps

```sh
pnpm --filter mobile exec eas login          # once
pnpm --filter mobile exec eas build:configure
pnpm --filter mobile exec eas build --platform ios    # or android
```

---

## 7  Scripts Cheat-Sheet

| Command                  | Scope   | Description            |
|--------------------------|---------|------------------------|
| pnpm dev                 | root    | Run server + web + mobile concurrently |
| pnpm lint                | root    | ESLint all workspaces  |
| pnpm --filter web build  | web     | Production bundle      |
| pnpm --filter server dev | server  | Hot-reload API         |
| pnpm --filter mobile dev | mobile  | Expo CLI               |

---

## 8  Repo Layout

```
pictionary/
├─ server/   ← Express + Socket.IO
│  └─ src/index.ts
├─ web/      ← React 18 + Vite + Tailwind
│  └─ src/App.tsx
├─ mobile/   ← Expo SDK 50 (React Native)
│  └─ App.tsx
├─ .env
└─ pnpm-workspace.yaml
```

Happy drawing & guessing! 🖍️
