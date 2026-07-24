# 🐺 Nightfall

> A real-time, web-based multiplayer social deduction browser game powered by **React**, **Node.js / Express**, and **Socket.io**.

![Nightfall Banner](client/public/background.png)

---

## 🌟 Overview

**Nightfall** is an interactive one-night social deduction game designed for browser-based multiplayer sessions. Players take on hidden roles—from cunning Werewolves to sharp Seers, protective Bodyguards, chaotic Tanner, and mysterious Cthulhu.

During the Night phase, secret role powers wake in sequence to manipulate cards, protect allies, or gather intelligence. When dawn arrives, the village holds a debate and votes to eliminate suspected wolves!

---

## ✨ Features

- **🎮 Real-Time Multiplayer**: Instant room creation, join codes, and dynamic room listing via Socket.io.
- **🤖 Built-in AI Bot Testing**: Add or remove AI bots dynamically to test game loops or play solo.
- **🎭 50+ Unique Roles**: Includes classic roles (Werewolf, Seer, Robber, Troublemaker, Tanner, Drunk) plus custom roles (Cthulhu, Yandere, Disruptor, Reflector, Dawn Bringer).
- **🛠️ Custom Deck Editor**: Hosts can customize card decks, toggle first-night wolf kills, and tweak phase timers.
- **🧪 Verified Engine**: 63+ automated test suites covering role mechanics, night priority queues, win conditions, and edge cases.
- **🎵 Atmospheric UI & Audio**: Custom dark fantasy visual theme, role artwork, and ambient audio cues.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (Node 20 recommended)
- **npm** 9+

### 1. Clone the repository

```bash
git clone https://github.com/your-username/nightfall.git
cd nightfall
```

### 2. Install dependencies

```bash
# Install root dependencies
npm install

# Install frontend client dependencies
npm run client:install
```

### 3. Build the client

```bash
npm run build
```

### 4. Run the engine tests

```bash
npm run test:engine
```

### 5. Start the server

```bash
# Start server (serves the built client at http://localhost:3001)
npm start
```

Open your browser to `http://localhost:3001` to play!

---

## 🛠️ Development Setup

For active client & server development with Hot Module Replacement (HMR):

1. **Start the backend server**:
   ```bash
   npm start
   # Server runs at http://localhost:3001
   ```

2. **Start the Vite frontend dev server** (in a separate terminal):
   ```bash
   cd client
   npm run dev
   # Vite dev server runs at http://localhost:5173
   ```

---

## 📁 Repository Structure

```
nightfall/
├── client/              # React + Vite Frontend Application
│   ├── public/          # Audio clips, icons, and role card artwork
│   └── src/             # App components, styles, and Socket listeners
├── server/              # Express + Socket.io Server & Engine
│   ├── gameEngine.js    # Core state machine, role resolution & win checks
│   ├── index.js         # Socket.io event handlers & static file server
│   └── logic_check.js   # Engine test suite runner (63 tests)
├── DEPLOYMENT.md        # Single-VPS deployment & Nginx configuration guide
├── LOGIC_AUDIT.md       # Game mechanics audit & role edge-case documentation
├── LICENSE              # Open-source license
└── package.json         # Root scripts & dependency manifest
```

---

## ☁️ Deployment

For single-VPS deployment guides using **Nginx**, **PM2**, and **Certbot (SSL)**, see [DEPLOYMENT.md](DEPLOYMENT.md).

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Run engine tests (`npm run test:engine`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

---

## 📜 License

Distributed under the **ISC License**. See [LICENSE](LICENSE) for more information.
