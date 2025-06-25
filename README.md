# Pictionary – Full-Stack Demo  
**React + Tailwind (Web) | React Native + Expo (Mobile) | TypeScript Node (Server)**  

---

## 1. Quick start (local LAN)

> **Minimum versions**  
> • **macOS Apple Silicon** (Rosetta not recommended)  
> • **Node 20 arm64** — managed with [`nvm`](https://github.com/nvm-sh/nvm)  
> • **pnpm 10** – `npm i -g pnpm@latest`  
> • **Xcode 15 / iOS simulator** (for the mobile app)  

```bash
# 1  Clone and install
git clone https://github.com/your-org/pictionary.git
cd pictionary
pnpm install          # installs all 3 workspaces

# 2  Create .env at repo root (one line; replace with your LAN IP)
echo "CLIENT_ORIGIN=http://192.168.1.61:5173" > .env
```

**1-click dev workflow**

```bash
pnpm dev
```

| What it does         | Port | Terminal tab         |
|---------------------|------|----------------------|
| server   tsx watch  | 4000 | tab #1 (auto-restarted) |
| web      vite       | 5173 | tab #1               |
| mobile   not started| —    | —                    |

**Why the mobile app is separate**  
Metro/Expo CLI is interactive and hogs STDIN. Running it in the same concurrently group would block your keyboard shortcuts.
➜ Open a second terminal tab and run:

```bash
# tab #2
pnpm --filter mobile exec expo start --clear
```

- Wait for Metro to say Metro waiting on exp://…:8081
- Press i to launch the iOS simulator.

⸻

## 2. Workspace layout & scripts

```
.
├─ server/   # ts-node backend (socket.io)
│  └─ pnpm dev   →  tsx watch src/index.ts
│
├─ web/      # React + Vite + Tailwind
│  └─ pnpm dev   →  vite
│
└─ mobile/   # Expo SDK 50
   └─ pnpm dev   →  expo start
```

**Global root scripts:**

| Script      | What it does                                      |
|-------------|---------------------------------------------------|
| pnpm dev    | Kills residual ports → starts server + web concurrently. |
| pnpm lint   | ESLint across all workspaces.                     |

⸻

## 3. Ports & collision recovery

| Port | Purpose         | Fix if busy                        |
|------|----------------|------------------------------------|
| 4000 | Node/Socket.IO | kill -9 $(lsof -ti:4000)            |
| 5173 | Vite dev server| idem                               |
| 8081 | Metro Bundler  | npx kill-port 8081                  |

If you ever see "Port 8081 is running this app in another window"
press Ctrl-C in every Metro terminal, then run the Expo command again.

⸻

## 4. Building for production

### Web bundle

```bash
cd web
pnpm build          # vite → dist/
```

Serve web/dist from any static host or behind Nginx.

### Server

```bash
cd server
pnpm build          # (optional) tsc --build
node dist/index.js
```

### Mobile (EAS build optional)

For App Store / TestFlight you can run:

```bash
cd mobile
pnpm exec eas build --profile release --platform ios
```

Read the Expo EAS docs for certificates & store submission.

⸻

## 5. Troubleshooting

| Symptom                                 | Cause                        | Remedy                                                                 |
|-----------------------------------------|------------------------------|------------------------------------------------------------------------|
| Rollup or esbuild "wrong architecture"  | Installed under Rosetta x86  | Re-install Node arm64: nvm install 20 --arch=arm64 then pnpm install again. |
| Metro stuck on "No apps connected"      | Simulator not running or bad LAN IP | Press i in Expo CLI, ensure wifi network matches CLIENT_ORIGIN IP.     |
| Nothing draws on web when drawing on phone | Mismatched normalised coords | Ensure both platforms emit normalised (0-1) positions (already fixed in current code). |
| Same port already in use                | Previous run crashed         | pnpm run fix-ports if you make an alias, or kill as above.              |

⸻

## 6. FAQ

<details>
<summary>Why not run Expo inside <code>pnpm dev</code>?</summary>

expo start wants to read key-press shortcuts. If it shares STDIN with
concurrently it can freeze or swallow logs.
Running it in its own tab keeps shortcuts like r (reload) or m
(menu) working.

</details>

<details>
<summary>Can I change rooms?</summary>

Edit roomId in both web/src/App.tsx and mobile/App.tsx or read
it from URL / deep link.

</details>

⸻

Happy drawing! 🖌️
