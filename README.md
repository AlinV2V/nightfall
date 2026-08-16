# Nightfall

A real-time multiplayer social deduction browser game built with React, Node.js, Express, and Socket.io.

## Overview

Nightfall is a browser-based social deduction game. Players receive secret roles such as Werewolf, Seer, Bodyguard, Tanner, and Cthulhu. During the Night phase, role powers activate in order to gather information or manipulate cards. During the Day phase, players debate and vote on who to eliminate.

## Features

- Real-Time Multiplayer: Room management and socket communication using Socket.io.
- Bot Support: Add AI bots to test game logic or fill player seats.
- 50+ Roles: Includes standard social deduction roles and custom additions (Cthulhu, Yandere, Disruptor, Reflector, Dawn Bringer).
- Custom Decks: Deck customization, configurable night kills, and phase timers.
- Tested Engine: 63 automated tests for role mechanics, turn queues, and win resolution.

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Installation and Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/AlinV2V/nightfall.git
   cd nightfall
   ```

2. Install dependencies:
   ```bash
   npm install
   npm run client:install
   ```

3. Build the client:
   ```bash
   npm run build
   ```

4. Run tests:
   ```bash
   npm run test:engine
   ```

5. Start the server:
   ```bash
   npm start
   ```

Access the app in your browser at `http://localhost:3001`.

## Development Setup

To run client and server independently during development:

1. Start the server:
   ```bash
   npm start
   ```

2. In a separate terminal, start the Vite dev server:
   ```bash
   cd client
   npm run dev
   ```

## Repository Structure

```
nightfall/
├── client/              # React + Vite frontend
│   ├── public/          # Assets, audio, and role card artwork
│   └── src/             # Frontend source code and socket handlers
├── server/              # Express + Socket.io server
│   ├── gameEngine.js    # Game loop, turn queues, and win resolution
│   ├── index.js         # Socket event router and static file server
│   └── logic_check.js   # Engine test suite runner
├── extras/              # Standalone pieces, not wired into the game
├── DEPLOYMENT.md        # Single-VPS deployment guide
├── LOGIC_AUDIT.md       # Mechanics audit and role reference
├── LICENSE              # License file
└── package.json         # Project scripts and dependencies
```

## Deployment

For production deployment instructions using Nginx, PM2, and SSL, see [DEPLOYMENT.md](DEPLOYMENT.md).

## License

Distributed under the ISC License. See [LICENSE](LICENSE) for details.
