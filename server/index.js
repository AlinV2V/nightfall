const express = require('express');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const GameEngine = require('./gameEngine');

const app = express();
app.use(cors());

const clientDistPath = path.join(__dirname, '..', 'client', 'dist');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allows any origin, fine for MVP
    methods: ["GET", "POST"]
  }
});

const rooms = {}; // roomId -> GameEngine

// Simple sliding-window rate limiter per socket+event.
// Keeps a small ring of timestamps and rejects when a burst exceeds the cap.
const rateLimitState = new WeakMap();
function rateLimit(socket, eventKey, maxPerWindow, windowMs) {
  let perSocket = rateLimitState.get(socket);
  if (!perSocket) {
    perSocket = new Map();
    rateLimitState.set(socket, perSocket);
  }
  const now = Date.now();
  const stamps = perSocket.get(eventKey) || [];
  const fresh = stamps.filter(t => now - t < windowMs);
  if (fresh.length >= maxPerWindow) {
    perSocket.set(eventKey, fresh);
    return false;
  }
  fresh.push(now);
  perSocket.set(eventKey, fresh);
  return true;
}

function broadcastRoomsList() {
  const publicRooms = Object.values(rooms).map(game => ({
    id: game.roomId,
    players: game.players.length
  }));
  io.emit('roomsList', publicRooms);
}

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Send current rooms list immediately on connect
  const publicRooms = Object.values(rooms).map(game => ({
    id: game.roomId,
    players: game.players.length
  }));
  socket.emit('roomsList', publicRooms);

  socket.on('joinRoom', ({ roomId, name, playerId, sessionToken }) => {
    if (typeof roomId !== 'string' || !roomId) return;
    roomId = roomId.toUpperCase();
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = new GameEngine(roomId, io.to(roomId), io);
    }

    const game = rooms[roomId];
    const issuedToken = game.addPlayer(playerId, socket.id, name, sessionToken);

    if (issuedToken === null) {
      socket.leave(roomId);
      return;
    }

    socket.roomId = roomId;
    socket.playerId = playerId;
    socket.sessionToken = issuedToken;

    broadcastRoomsList();
  });

  socket.on('updateSettings', (settings) => {
    if (!rateLimit(socket, 'updateSettings', 30, 5000)) return;
    const game = rooms[socket.roomId];
    if (game) {
      game.updateSettings(socket.id, settings);
    }
  });

  socket.on('toggleLock', () => {
    const game = rooms[socket.roomId];
    if (game) {
      game.toggleLock(socket.id);
    }
  });

  socket.on('kickPlayer', (targetPlayerId) => {
    const game = rooms[socket.roomId];
    if (game) {
      game.kickPlayer(socket.id, targetPlayerId);
    }
  });

  socket.on('startGame', () => {
    const game = rooms[socket.roomId];
    if (game) {
      game.startGame(socket.id);
    }
  });

  socket.on('nightAction', (actionData) => {
    if (!rateLimit(socket, 'nightAction', 20, 5000)) return;
    const game = rooms[socket.roomId];
    if (game) {
      game.handleNightAction(socket.id, actionData);
    }
  });

  socket.on('submitVote', (targetId) => {
    if (!rateLimit(socket, 'submitVote', 10, 5000)) return;
    const game = rooms[socket.roomId];
    if (game) {
      game.handleVote(socket.id, targetId);
    }
  });

  socket.on('skipDay', () => {
    const game = rooms[socket.roomId];
    if (game) {
      game.skipDay(socket.id);
    }
  });

  socket.on('skipNight', () => {
    const game = rooms[socket.roomId];
    if (game) {
      game.skipNight(socket.id);
    }
  });

  socket.on('submitTrialVote', (choice) => {
    const game = rooms[socket.roomId];
    if (game) {
      game.handleTrialVote(socket.id, choice);
    }
  });

  socket.on('skipDefense', () => {
    const game = rooms[socket.roomId];
    if (game) {
      game.skipDefense(socket.id);
    }
  });

  socket.on('skipAccusation', () => {
    const game = rooms[socket.roomId];
    if (game) {
      game.skipAccusation(socket.id);
    }
  });

  socket.on('skipTrial', () => {
    const game = rooms[socket.roomId];
    if (game) {
      game.skipTrial(socket.id);
    }
  });

  socket.on('hunterRevenge', (targetId) => {
    if (!rateLimit(socket, 'hunterRevenge', 5, 5000)) return;
    const game = rooms[socket.roomId];
    if (game) {
      game.resolveHunterRevenge(socket.id, targetId);
    }
  });

  socket.on('moderatorExecute', (targetId) => {
    const game = rooms[socket.roomId];
    if (game) {
      game.moderatorExecute(socket.id, targetId);
    }
  });

  socket.on('dawnBringerDeclare', () => {
    if (!rateLimit(socket, 'dawnBringerDeclare', 2, 30000)) return;
    const game = rooms[socket.roomId];
    if (game) {
      game.handleDawnBringerDeclare(socket.id);
    }
  });

  socket.on('addBot', () => {
    const game = rooms[socket.roomId];
    if (game) {
      game.addBot(socket.id);
      broadcastRoomsList();
    }
  });

  socket.on('removeBot', (botId) => {
    const game = rooms[socket.roomId];
    if (game) {
      game.removeBot(socket.id, botId || null);
      broadcastRoomsList();
    }
  });

  socket.on('clearBotLog', () => {
    const game = rooms[socket.roomId];
    if (game) {
      game.clearBotDebugLog(socket.id);
    }
  });

  socket.on('wwMessage', (rawText) => {
      if (!rateLimit(socket, 'wwMessage', 8, 5000)) return;
      const game = rooms[socket.roomId];
      if (!game || !game.canUseWerewolfChat(socket.id)) return;
      const text = typeof rawText === 'string' ? rawText.trim().slice(0, 280) : '';
      if (!text) return;
      const pInfo = game.players.find(p => p.socketId === socket.id);
      if (!pInfo) return;
      const senderName = pInfo.name;
      game.getWerewolfChatPlayers().forEach(wp => {
          io.to(wp.socketId).emit('wwChatMessage', { sender: senderName, text });
      });
  });

  socket.on('jailerMessage', (rawText) => {
      if (!rateLimit(socket, 'jailerMessage', 15, 5000)) return;
      const game = rooms[socket.roomId];
      if (game) {
        game.handleJailerMessage(socket.id, rawText);
      }
  });

  socket.on('villagerMessage', (rawText) => {
      if (!rateLimit(socket, 'villagerMessage', 8, 5000)) return;
      const game = rooms[socket.roomId];
      if (!game || !game.canUseVillagerChat(socket.id)) return;
      let text = typeof rawText === 'string' ? rawText.trim().slice(0, 280) : '';
      if (!text) return;
      const pInfo = game.players.find(p => p.socketId === socket.id);
      if (!pInfo) return;

      // Cthulhu madness: if this player is crazed, they can only repeat their forced word
      const crazedWord = game.cthulhuCrazed ? game.cthulhuCrazed[pInfo.id] : null;
      if (crazedWord) {
        // Replace their message with the forced word regardless of what they typed
        text = crazedWord;
      }

      io.to(socket.roomId).emit('villagerChatMessage', {
          sender: pInfo.name,
          senderId: pInfo.id,
          text,
          ts: Date.now(),
          isCrazed: !!crazedWord,
      });
  });

  // Ghost chat: a lingering spirit leaves the village one letter per day. The
  // rule itself lives in the engine — this only carries the message across.
  socket.on('ghostMessage', (rawText) => {
      if (!rateLimit(socket, 'ghostMessage', 4, 5000)) return;
      const game = rooms[socket.roomId];
      if (!game) return;
      game.handleGhostMessage(socket.id, rawText);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    const game = rooms[socket.roomId];
    if (game) {
      // Read the grace before removePlayer, since a collapsing session can flip
      // the phase back to lobby and shorten it.
      const cleanupDelay = game.getReconnectGraceMs() + 10000;
      game.removePlayer(socket.id);
      // Always schedule cleanup. This catches host-leave resets where bots are
      // removed asynchronously after the reconnect grace window. The room must
      // outlive the reconnect window, or a mid-game refresh finds nothing left
      // to rejoin.
      setTimeout(() => {
        if (
          rooms[socket.roomId]
          && rooms[socket.roomId].players.filter(p => p.connected && !p.isBot).length === 0
        ) {
          rooms[socket.roomId].clearAllTimers();
          delete rooms[socket.roomId];
          broadcastRoomsList();
        }
      }, cleanupDelay);
      broadcastRoomsList();
    }
  });
});

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.send('Nightfall server is running. Build the client with npm --prefix client run build to serve the app from this process.');
  });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
