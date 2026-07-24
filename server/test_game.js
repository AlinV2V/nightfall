const { io } = require('socket.io-client');

const SERVER = 'http://localhost:3001';
const ROOM = 'TEST1';

// Create 3 bot sockets
const bots = [
  { name: 'Alice', pid: 'bot_alice_' + Date.now(), socket: null, state: null },
  { name: 'Bob',   pid: 'bot_bob_' + Date.now(),   socket: null, state: null },
  { name: 'Carol', pid: 'bot_carol_' + Date.now(), socket: null, state: null },
];

function log(msg) { console.log(`[${new Date().toLocaleTimeString()}] ${msg}`); }

function connect(bot) {
  return new Promise((resolve) => {
    bot.socket = io(SERVER);
    bot.socket.on('connect', () => {
      log(`${bot.name} connected (${bot.socket.id})`);
      bot.socket.emit('joinRoom', { roomId: ROOM, name: bot.name, playerId: bot.pid });
      resolve();
    });

    bot.socket.on('gameState', (state) => {
      const prev = bot.state?.phase;
      bot.state = state;
      if (prev !== state.phase) {
        log(`${bot.name} sees phase: ${state.phase} | role: ${state.myOriginalRole || '?'} | day: ${state.dayCount}`);
      }
      handlePhase(bot);
    });

    bot.socket.on('actionResult', (result) => {
      log(`${bot.name} got result: ${JSON.stringify(result)}`);
    });

    bot.socket.on('chatMessage', (msg) => {
      log(`[CHAT] ${msg.sender}: ${msg.text}`);
    });
  });
}

function handlePhase(bot) {
  const s = bot.state;
  if (!s) return;

  // Night phase - perform actions
  if (s.phase === 'night' && s.currentNightAction) {
    setTimeout(() => {
      const others = s.players.filter(p => p.id !== bot.pid && !p.isDead);
      
      if (s.currentNightAction === 'Werewolf') {
        const target = others[Math.floor(Math.random() * others.length)];
        log(`${bot.name} (Werewolf) voting to kill ${target.name}`);
        bot.socket.emit('nightAction', { type: 'kill', target1: target.id });
      }
      else if (s.currentNightAction === 'Seer') {
        const target = others[Math.floor(Math.random() * others.length)];
        log(`${bot.name} (Seer) viewing ${target.name}`);
        bot.socket.emit('nightAction', { type: 'player', target1: target.id });
      }
      else {
        // Any other role - just acknowledge
        log(`${bot.name} (${s.currentNightAction}) acknowledging`);
        bot.socket.emit('nightAction', { type: 'view' });
      }
    }, 1000);
  }

  // Vote phase
  if (s.phase === 'vote') {
    const me = s.players.find(p => p.id === bot.pid);
    if (me && !me.hasVoted && !me.isDead) {
      setTimeout(() => {
        const alive = s.players.filter(p => !p.isDead);
        // Seer tries to vote for werewolf, others vote randomly
        let target;
        if (s.myOriginalRole === 'Seer') {
          // Vote for someone who isn't self
          target = alive.filter(p => p.id !== bot.pid)[0];
        } else {
          target = alive[Math.floor(Math.random() * alive.length)];
        }
        log(`${bot.name} votes for ${target.name}`);
        bot.socket.emit('submitVote', target.id);
      }, 1500);
    }
  }

  // End phase
  if (s.phase === 'end') {
    log(`=== GAME OVER: ${s.winner || 'unknown'} ===`);
    log(`Final assignments:`);
    s.players.forEach(p => {
      log(`  ${p.name}: ${s.publicAssignments[p.id]} ${p.isDead ? '(DEAD)' : '(alive)'}`);
    });
    setTimeout(() => {
      log('Disconnecting all bots...');
      bots.forEach(b => b.socket.disconnect());
      process.exit(0);
    }, 2000);
  }
}

async function main() {
  log('=== Starting 3-bot test game ===');
  
  // Connect all bots
  for (const bot of bots) {
    await connect(bot);
    await new Promise(r => setTimeout(r, 500));
  }
  
  log('All 3 bots connected. Waiting for lobby state...');
  await new Promise(r => setTimeout(r, 1000));

  // Host (Alice) sets deck to: 1 WW, 1 Villager, 1 Seer (+ 3 center villagers)
  const host = bots[0];
  log('Alice (host) setting deck: Seer, Robber, Troublemaker (Testing Minimums)');
  host.socket.emit('updateSettings', {
    discussionLength: 5,  // 5 seconds for fast test
    nightActionTime: 10,
    deck: ['Seer', 'Robber', 'Troublemaker']
  });

  await new Promise(r => setTimeout(r, 1000));

  // Start game
  log('Alice starting game!');
  host.socket.emit('startGame');

  // Auto-skip day phase after a bit (host privilege)
  setTimeout(() => {
    if (host.state?.phase === 'day') {
      log('Alice skipping day discussion');
      host.socket.emit('skipDay');
    }
  }, 12000);

  // Safety timeout
  setTimeout(() => {
    log('Test timeout reached (60s). Exiting.');
    bots.forEach(b => b.socket?.disconnect());
    process.exit(1);
  }, 60000);
}

main().catch(err => { console.error(err); process.exit(1); });
