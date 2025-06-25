# Pictionary – Full-Stack Demo  
**React + Tailwind (Web) | React Native + Expo (Mobile) | TypeScript Node (Server)**  

---
## Video Link for Repo/Project Walkthrough : https://share.zight.com/NQum6oXr

## ⚙️ Pre-requisites

| Tool | Min version | Install |
|------|-------------|---------|
| **Node 20 arm64** | 20.19 | `brew install nvm` →<br>`nvm install 20 --arch=arm64` |
| **pnpm** | 10.x | `npm i -g pnpm@latest` |
| **Xcode + iOS simulator** (macOS) | 15 | via App Store |
| **Watchman** (Metro reloads) | ⬆ | `brew install watchman` *(optional but recommended)* |

> **Apple Silicon note**  
> Make sure your terminal is **not** running under Rosetta.  
> `arch` should print `arm64`, and `node -p "process.arch"` should print `arm64`.

---

## 🚀 Quick start (local LAN)

```bash
# 1  Clone & install
git clone https://github.com/eyildirimdev/pictionary.git 
cd pictionary
pnpm install          # installs server + web + mobile

# 2  Edit the existing .env at repo root
# ──────────────────────────────────────────
# Change CLIENT_ORIGIN to match your LAN IP
#
#   CLIENT_ORIGIN=http://192.168.1.61:5173
#
# Leave other vars as-is.
```

**One-shot dev command (tab #1)**

```bash
pnpm dev
```

| App     | Port | What happens           | Where                      |
|---------|------|-----------------------|----------------------------|
| server  | 4000 | tsx watch auto-reload | same tab                   |
| web     | 5173 | Vite dev server       | same tab                   |
| (mobile not started here) | —    | —                     | —                          |

**Start the mobile app (tab #2)**

Metro/Expo CLI is interactive. Run it in its own terminal:

```bash
# new tab
pnpm --filter mobile exec expo start --clear
```

Then:
	•	Wait for "Metro waiting on exp://…:8081"
	•	Press i to launch the iOS simulator (or a for Android)

⸻

🗂️ Repo layout

```
.
├─ server/   # ts-node backend (socket.io)
│  └─ pnpm dev   → tsx watch src/index.ts
│
├─ web/      # React + Vite + Tailwind
│  └─ pnpm dev   → vite
│
└─ mobile/   # Expo SDK 50 (React Native)
   └─ pnpm dev   → expo start
```

⸻

🔧 Ports & quick fixes

| Port | Purpose         | If busy…                      |
|------|----------------|-------------------------------|
| 4000 | Socket.IO server| kill -9 $(lsof -ti:4000)      |
| 5173 | Vite web dev    | idem                          |
| 8081 | Metro Bundler   | npx kill-port 8081            |

⸻

📦 Production builds

**Web**

```bash
cd web
pnpm build          # static bundle → web/dist
```

Host web/dist behind any static server.

**Server**

```bash
cd server
pnpm build          # (optional) tsc --build
node dist/index.js
```

**Mobile (EAS optional)**

```bash
cd mobile
pnpm exec eas build --profile release --platform ios
```

Follow Expo EAS docs for certificates & store upload.

⸻

🧑‍🔧 Troubleshooting

| Symptom                        | Cause                  | Fix                                                        |
|-------------------------------|------------------------|------------------------------------------------------------|
| esbuild/rollup wrong arch      | Installed under Rosetta| Re-install Node arm64, then pnpm install                   |
| Metro "No apps connected"      | Simulator not attached | Press i in Expo CLI, or ensure LAN IP matches CLIENT_ORIGIN |
| Phone draws but web doesn't    | Old code               | Pull latest – both clients now send/scale normalised (0-1) coords |
| Port already in use            | Ghost process          | use the kill-port commands above                           |

⸻

❓ FAQ

<details>
<summary>Why not include Expo in <code>pnpm dev</code>?</summary>

expo start needs exclusive STDIN for shortcuts ( r reload, m menu, etc.).
Running it in a separate tab keeps those working and avoids log interleaving.

</details>

<details>
<summary>Can I change rooms to play multiple games?</summary>

Yes – edit roomId in web/src/App.tsx and mobile/App.tsx or wire them to URL params / deep links.

</details>

⸻

Happy drawing! 🖌️
