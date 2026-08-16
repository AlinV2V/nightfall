const assert = require('node:assert/strict');
const GameEngine = require('./gameEngine');
const GOOD_POWER_ROLE_SET = new Set([
  'Seer',
  'Priest',
  'Bodyguard',
  'Hunter',
  'Apprentice Seer',
  'Mason',
  'Jailer',
  'Prince',
  'Aura Seer',
  'Private Investigator',
  'Mayor',
  'Dawn Bringer',
  'The Reflector',
  'Mad Bomber',
]);

function makeIo() {
  const events = [];
  return {
    events,
    roomIo: {
      emit(event, data) {
        events.push({ scope: 'room', event, data });
      },
    },
    rawIo: {
      to(target) {
        return {
          emit(event, data) {
            events.push({ scope: target, event, data });
          },
        };
      },
    },
  };
}

function makeGame() {
  const io = makeIo();
  const game = new GameEngine('TEST', io.roomIo, io.rawIo);
  game._events = io.events;
  return game;
}

function seatPlayers(game, roles) {
  game.players = roles.map((role, index) => ({
    id: `p${index + 1}`,
    socketId: `s${index + 1}`,
    name: `Player ${index + 1}`,
    isHost: index === 0,
    connected: true,
  }));

  game.assignments = {};
  roles.forEach((role, index) => {
    game.assignments[`p${index + 1}`] = {
      originalRole: role,
      currentRole: role,
      doppelgangerRole: null,
      doppelgangerTarget: null,
      piUsed: false,
      isDead: false,
      bodyguardLives: role === 'Bodyguard' ? 2 : 0,
    };
  });
  game.centerCards = ['Villager', 'Tanner', 'Villager'];
  game.roles = [...roles, ...game.centerCards];
}

function run(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

function countRoles(roles) {
  return roles.reduce((counts, role) => {
    counts[role] = (counts[role] || 0) + 1;
    return counts;
  }, {});
}

run('startGame uses exact custom deck and requires host', () => {
  const game = makeGame();
  game.addPlayer('p1', 's1', 'A');
  game.addPlayer('p2', 's2', 'B');
  game.addPlayer('p3', 's3', 'C');
  const customDeck = ['Werewolf', 'Robber', 'Troublemaker', 'Witch', 'Villager', 'Mason'];
  game.updateSettings('s1', { deck: customDeck });

  assert.equal(game.startGame('s2'), false);
  assert.equal(game.phase, 'lobby');

  assert.equal(game.startGame('s1'), true);
  game.clearAllTimers();

  assert.equal(game.roles.length, 6);
  assert.deepEqual([...game.roles].sort(), [...customDeck].sort());
});

run('unsupported role settings are filtered before the game starts', () => {
  const game = makeGame();
  game.addPlayer('p1', 's1', 'A');
  game.addPlayer('p2', 's2', 'B');
  game.addPlayer('p3', 's3', 'C');
  game.updateSettings('s1', { deck: ['Alien', 'Blob', 'Curator', 'Seer'] });

  assert.deepEqual(game.settings.deck, ['Curator', 'Seer']);
});

run('invalid custom deck refuses to start instead of filling random cards', () => {
  const game = makeGame();
  game.addPlayer('p1', 's1', 'A');
  game.addPlayer('p2', 's2', 'B');
  game.addPlayer('p3', 's3', 'C');
  game.updateSettings('s1', { deck: ['Seer', 'Robber'] });

  assert.equal(game.startGame('s1'), false);
  game.clearAllTimers();

  assert.equal(game.phase, 'lobby');
  assert.deepEqual(game.roles, []);
  assert.equal(game._events.some(e => e.scope === 's1' && e.event === 'privateNotice' && e.data.title === 'Custom Deck'), true);
});

run('custom deck with Lycan but no real werewolf refuses to start', () => {
  const game = makeGame();
  game.addPlayer('p1', 's1', 'A');
  game.addPlayer('p2', 's2', 'B');
  game.addPlayer('p3', 's3', 'C');
  game.addPlayer('p4', 's4', 'D');
  game.updateSettings('s1', {
    deck: ['Bodyguard', 'Seer', 'Villager', 'Lycan', 'Villager', 'Tanner', 'Robber'],
  });

  assert.equal(game.startGame('s1'), false);
  game.clearAllTimers();

  assert.equal(game.phase, 'lobby');
  assert.deepEqual(game.roles, []);
  assert.equal(
    game._events.some(e =>
      e.scope === 's1'
      && e.event === 'privateNotice'
      && e.data.message.includes('Lycan does not count')
    ),
    true
  );
});

run('custom deck swaps center werewolf into a player seat', () => {
  const game = makeGame();
  game.addPlayer('p1', 's1', 'A');
  game.addPlayer('p2', 's2', 'B');
  game.addPlayer('p3', 's3', 'C');
  game.addPlayer('p4', 's4', 'D');
  const customDeck = ['Bodyguard', 'Seer', 'Villager', 'Lycan', 'Werewolf', 'Villager', 'Tanner'];
  game.updateSettings('s1', { deck: customDeck });
  game.shuffle = () => {};

  assert.equal(game.startGame('s1'), true);
  game.clearAllTimers();

  const playerRoles = Object.values(game.assignments).map(a => a.originalRole);
  assert.equal(playerRoles.some(role => game.isWerewolfRole(role)), true);
  assert.deepEqual([...game.roles].sort(), [...customDeck].sort());
});

run('Alin preset is a five-player randomized recipe without Dream Wolf', () => {
  const game = makeGame();
  for (let i = 1; i <= 5; i++) {
    game.addPlayer(`p${i}`, `s${i}`, `Player ${i}`);
  }
  game.updateSettings('s1', { deckPreset: 'alin', deck: ['Werewolf', 'Villager'] });
  game.pickRandom = (arr) => arr[arr.length - 1];

  assert.equal(game.startGame('s1'), true);
  game.clearAllTimers();

  const playerRoles = Object.values(game.assignments).map(a => a.originalRole);
  const wolfRoles = ['Werewolf', 'Alpha Wolf', 'Mystic Wolf', 'Wolverine'];
  const detectionRoles = ['Seer', 'Aura Seer', 'Private Investigator', 'Apprentice Seer'];
  const powerRoles = ['Robber', 'Troublemaker', 'Witch', 'Drunk', 'Insomniac', 'Village Idiot', 'Revealer'];
  const wildRoles = ['Hunter', 'Mayor', 'Prince', 'Pacifist', 'Mason', 'Lycan', 'Villager'];

  assert.equal(game.roles.length, 8);
  assert.equal(game.settings.deck.length, 0);
  assert.equal(playerRoles.filter(role => wolfRoles.includes(role)).length, 1);
  assert.equal(playerRoles.includes('Dream Wolf'), false);
  assert.equal(playerRoles.filter(role => detectionRoles.includes(role)).length, 1);
  assert.equal(playerRoles.filter(role => powerRoles.includes(role)).length, 1);
  assert.equal(playerRoles.filter(role => role === 'Tanner').length, 1);
  assert.equal(playerRoles.filter(role => wildRoles.includes(role)).length, 1);
  assert.deepEqual(game.centerCards, ['Villager', 'Tanner', 'Villager']);
});

run('Alin preset refuses non-five-player rooms', () => {
  const game = makeGame();
  game.addPlayer('p1', 's1', 'A');
  game.addPlayer('p2', 's2', 'B');
  game.addPlayer('p3', 's3', 'C');
  game.addPlayer('p4', 's4', 'D');
  game.updateSettings('s1', { deckPreset: 'alin' });

  assert.equal(game.startGame('s1'), false);
  game.clearAllTimers();

  assert.equal(game.phase, 'lobby');
  assert.equal(game._events.some(e =>
    e.scope === 's1'
    && e.event === 'privateNotice'
    && e.data.message.includes('exactly 5 players')
  ), true);
});

run('empty role settings default 3 players to one werewolf, one detection, and one protector role', () => {
  const game = makeGame();
  game.addPlayer('p1', 's1', 'A');
  game.addPlayer('p2', 's2', 'B');
  game.addPlayer('p3', 's3', 'C');

  assert.equal(game.startGame('s1'), true);
  game.clearAllTimers();

  const playerRoles = Object.values(game.assignments).map(a => a.originalRole);
  assert.equal(playerRoles.length, 3);
  assert.equal(playerRoles.filter(role => ['Werewolf', 'Alpha Wolf', 'Mystic Wolf', 'Wolverine'].includes(role)).length, 1);
  assert.equal(playerRoles.filter(role => ['Seer', 'Aura Seer', 'Private Investigator', 'Apprentice Seer'].includes(role)).length, 1);
  assert.equal(playerRoles.filter(role => ['Bodyguard', 'Priest', 'Jailer'].includes(role)).length, 1);
  assert.equal(game.centerCards.length, 3);
  assert.equal(game.centerCards.includes('Villager'), false);
});

run('empty role settings default 4 players to one werewolf, one detection, one protector, and one passive role', () => {
  const game = makeGame();
  game.addPlayer('p1', 's1', 'A');
  game.addPlayer('p2', 's2', 'B');
  game.addPlayer('p3', 's3', 'C');
  game.addPlayer('p4', 's4', 'D');

  assert.equal(game.startGame('s1'), true);
  game.clearAllTimers();

  const playerRoles = Object.values(game.assignments).map(a => a.originalRole);
  assert.equal(playerRoles.length, 4);
  assert.equal(playerRoles.filter(role => ['Werewolf', 'Alpha Wolf', 'Mystic Wolf', 'Wolverine'].includes(role)).length, 1);
  assert.equal(playerRoles.filter(role => ['Seer', 'Aura Seer', 'Private Investigator', 'Apprentice Seer'].includes(role)).length, 1);
  assert.equal(playerRoles.filter(role => ['Bodyguard', 'Priest', 'Jailer'].includes(role)).length, 1);
  assert.equal(playerRoles.filter(role => ['Hunter', 'Mayor', 'Prince', 'Pacifist', 'Lycan', 'Cursed', 'Tough Guy', 'Mad Bomber'].includes(role)).length, 1);
});

run('empty role settings scale larger games with extra wolves and support roles', () => {
  const game = makeGame();
  for (let i = 1; i <= 8; i += 1) {
    game.addPlayer(`p${i}`, `s${i}`, `P${i}`);
  }

  assert.equal(game.startGame('s1'), true);
  game.clearAllTimers();

  const playerRoles = Object.values(game.assignments).map(a => a.originalRole);
  assert.equal(playerRoles.length, 8);
  assert.equal(playerRoles.filter(role => ['Werewolf', 'Alpha Wolf', 'Mystic Wolf', 'Wolverine'].includes(role)).length, 2);
  assert.equal(playerRoles.filter(role => ['Seer', 'Aura Seer', 'Private Investigator', 'Apprentice Seer'].includes(role)).length, 2);
  assert.equal(playerRoles.filter(role => ['Bodyguard', 'Priest', 'Jailer'].includes(role)).length, 1);

  const neutralCount = playerRoles.filter(role => ['Tanner', 'Disruptor', 'Old Hag', 'Spellcaster', 'Yandere', 'Cthulhu'].includes(role)).length;
  const soloCount = playerRoles.filter(role => ['Cult Leader', 'Vampire'].includes(role)).length;
  assert.equal(neutralCount, 1);
  assert.equal(soloCount, 1);
});

run('night queue is built from dealt cards, not the raw host deck', () => {
  const game = makeGame();
  seatPlayers(game, ['Werewolf', 'Villager', 'Villager']);
  game.startNight();
  game.clearAllTimers();

  assert.equal(game.currentNightAction, 'Werewolf');
  assert.deepEqual(game.getActiveActors('Werewolf'), ['p1']);
});

run('unsupported roles are not queued as generic no-op night actions', () => {
  const game = makeGame();
  seatPlayers(game, ['Alien', 'Blob', 'Super Hero']);
  game.startNight();
  game.clearAllTimers();

  assert.equal(game.phase, 'day');
  assert.equal(game.currentNightAction, null);
});

run('host can disable werewolf kills on the first night', () => {
  const game = makeGame();
  seatPlayers(game, ['Werewolf', 'Villager', 'Villager', 'Seer']);
  game.settings.firstNightKill = false;
  game.phase = 'night';
  game.dayCount = 1;
  game.currentNightAction = 'Werewolf';
  game.currentNightActors = ['p1'];

  game.handleNightAction('s1', { type: 'kill', target1: 'p2' });
  game.clearAllTimers();

  assert.equal(game.assignments.p2.isDead, false);
  assert.equal(game.pendingNightResultAcks.p1.type, 'wolfView');
  assert.equal(game._events.some(e => e.scope === 's1' && e.event === 'actionResult' && e.data.huntSkipped && e.data.requiresContinue), true);

  game.handleNightAction('s1', { type: 'continue' });
  game.clearAllTimers();

  assert.equal(game.nightActionsReceived.p1, true);
});

run('werewolves hunt on the first night when enabled', () => {
  const game = makeGame();
  seatPlayers(game, ['Werewolf', 'Villager', 'Villager', 'Seer']);
  game.settings.firstNightKill = true;
  game.phase = 'night';
  game.dayCount = 1;
  game.currentNightAction = 'Werewolf';

  game.handleNightAction('s1', { type: 'kill', target1: 'p2' });
  game.clearAllTimers();

  game.resolveDawnKills();
  assert.equal(game.assignments.p2.isDead, true);
});

run('host settings preserve first-night kill toggle', () => {
  const game = makeGame();
  game.addPlayer('p1', 's1', 'A');
  game.addPlayer('p2', 's2', 'B');
  game.addPlayer('p3', 's3', 'C');

  game.updateSettings('s1', { firstNightKill: false });
  assert.equal(game.settings.firstNightKill, false);

  game.updateSettings('s1', { firstNightKill: true });
  assert.equal(game.settings.firstNightKill, true);
});

run('Sentinel shield blocks card movement', () => {
  const game = makeGame();
  seatPlayers(game, ['Troublemaker', 'Villager', 'Werewolf']);
  game.phase = 'night';
  game.currentNightAction = 'Troublemaker';
  game.sentinelShielded = 'p2';

  game.handleNightAction('s1', { type: 'swap', target1: 'p2', target2: 'p3' });
  game.clearAllTimers();

  assert.equal(game.assignments.p2.currentRole, 'Villager');
  assert.equal(game.assignments.p3.currentRole, 'Werewolf');
});

run('Revealer successful reveal is public in sanitized state', () => {
  const game = makeGame();
  seatPlayers(game, ['Revealer', 'Villager', 'Werewolf']);
  game.phase = 'night';
  game.currentNightAction = 'Revealer';

  game.handleNightAction('s1', { type: 'player', target1: 'p2' });
  game.clearAllTimers();

  assert.equal(game.getSanitizedState('s2').players.find(p => p.id === 'p2').revealedRole, 'Villager');
});

run('later nights skip setup-only roles and keep recurring roles', () => {
  const game = makeGame();
  seatPlayers(game, ['Werewolf', 'Seer', 'Robber', 'Troublemaker']);
  game.dayCount = 2;
  game.startNight();
  game.clearAllTimers();

  assert.equal(game.currentNightAction, 'Werewolf');
  assert.deepEqual(game.nightQueue, ['Seer', 'Troublemaker']);
});

run('later nights use current role for recurring wake powers', () => {
  const game = makeGame();
  seatPlayers(game, ['Villager', 'Seer', 'Robber']);
  game.assignments.p1.currentRole = 'Werewolf';
  game.dayCount = 2;
  game.startNight();
  game.clearAllTimers();

  assert.equal(game.currentNightAction, 'Werewolf');
  assert.deepEqual(game.getActiveActors('Werewolf'), ['p1']);
});

run('skip vote counts as voted in accusation', () => {
  const game = makeGame();
  seatPlayers(game, ['Villager', 'Werewolf', 'Seer', 'Robber']);
  game.phase = 'accusation';

  game.handleAccusation('s1', '__SKIP_VOTE__');
  game.handleAccusation('s2', 'p3');
  game.clearAllTimers();

  assert.equal(game.getSanitizedState('s1').players.find(p => p.id === 'p1').hasVoted, true);
  assert.equal(game.getVoteCounts(game.accusationVotes).p3, 1);
});

run('accused player cannot save themselves during trial', () => {
  const game = makeGame();
  seatPlayers(game, ['Werewolf', 'Villager', 'Seer']);
  game.phase = 'trial';
  game.accusedId = 'p1';
  game.trialVotes = {};

  game.handleTrialVote('s1', 'save');

  assert.deepEqual(game.trialVotes, {});
  assert.equal(game.getSanitizedState('s1').voteProgress.total, 2);
  assert.equal(game.getSanitizedState('s1').myTrialVote, null);

  game.trialVotes = { p1: 'save', p2: 'eliminate' };
  game.resolveTrial();
  game.clearAllTimers();

  assert.equal(game.trialVotes.p1, undefined);
  assert.equal(game._events.some(e => e.scope === 'room' && e.event === 'executionScene'), true);
});

run('werewolves win once they equal or outnumber the village', () => {
  const game = makeGame();
  seatPlayers(game, ['Villager', 'Werewolf', 'Seer']);
  game.phase = 'trial';
  game.accusedId = 'p3';
  game.trialVotes = { p1: 'eliminate', p2: 'eliminate' };

  const originalSetTimeout = global.setTimeout;
  global.setTimeout = (fn) => { fn(); return 1; };

  game.resolveTrial();
  game.clearAllTimers();

  assert.equal(game.assignments.p3.isDead, true);
  assert.match(game.winner, /Werewolves/);

  global.setTimeout = originalSetTimeout;
});

run('Prince cannot be eliminated by village vote', () => {
  const game = makeGame();
  seatPlayers(game, ['Villager', 'Prince', 'Werewolf', 'Seer', 'Robber']);
  game.phase = 'trial';
  game.accusedId = 'p2'; // Prince
  game.trialVotes = { p1: 'eliminate', p3: 'eliminate', p4: 'eliminate', p5: 'eliminate' };

  game.resolveTrial();
  game.clearAllTimers();

  assert.equal(game.assignments.p2.isDead, false);
});

run('Hunter death also kills the Hunter vote target', () => {
  const game = makeGame();
  seatPlayers(game, ['Hunter', 'Werewolf', 'Seer']);
  game.phase = 'trial';
  game.accusedId = 'p1'; // Hunter
  game.trialVotes = { p2: 'eliminate', p3: 'eliminate' };

  // Collapse only the execution scene. The Hunter's own choice window must stay
  // open — it is now bounded, and firing it here would auto-pass the shot.
  const originalSetTimeout = global.setTimeout;
  let fired = 0;
  global.setTimeout = (fn) => { fired += 1; if (fired === 1) fn(); return fired; };

  game.resolveTrial();

  assert.equal(game.assignments.p1.isDead, true);
  assert.equal(game.pendingHunterRevenge, 'p1');

  game.resolveHunterRevenge('s1', 'p2');
  assert.equal(game.assignments.p2.isDead, true);
  assert.match(game.winner, /Village/);

  global.setTimeout = originalSetTimeout;
});

run('Mayor vote counts double and Pacifist is forced to save during trial', () => {
  const game = makeGame();
  seatPlayers(game, ['Mayor', 'Pacifist', 'Werewolf', 'Seer']);
  
  // Test Mayor weight in accusation
  game.phase = 'accusation';
  game.handleAccusation('s1', 'p3'); // Mayor votes p3
  assert.equal(game.getVoteCounts(game.accusationVotes).p3, 2);

  // Test Pacifist forced save in trial
  game.phase = 'trial';
  game.accusedId = 'p3';
  game.handleTrialVote('s2', 'eliminate'); // Pacifist tries to eliminate p3
  assert.equal(game.trialVotes.p2, 'save'); // Gets coerced to save
});

run('Aura Seer alignment: Lycan is Good, Werewolf is Evil, Tanner is Unknown', () => {
  const game = makeGame();
  seatPlayers(game, ['Aura Seer', 'Lycan', 'Werewolf', 'Tanner']);
  game.phase = 'night';
  game.currentNightAction = 'Aura Seer';

  game.handleNightAction('s1', { type: 'player', target1: 'p2' });
  game.clearAllTimers();

  const result = game._events.find(e => e.scope === 's1' && e.event === 'actionResult' && e.data.type === 'auraResult');
  assert.equal(result.data.alignment, 'Good');
  assert.equal(game.getAuraAlignment('p3'), 'Evil');
  assert.equal(game.getAuraAlignment('p4'), 'Unknown');
});

run('human reveal actions wait for Continue before night advances', () => {
  const game = makeGame();
  seatPlayers(game, ['Seer', 'Villager', 'Werewolf']);
  game.phase = 'night';
  game.currentNightAction = 'Seer';
  game.currentNightActors = ['p1'];

  game.handleNightAction('s1', { type: 'player', target1: 'p2' });
  game.clearAllTimers();

  const result = game._events.find(e => e.scope === 's1' && e.event === 'actionResult' && e.data.type === 'seerFactionResult');
  assert.equal(result.data.faction, 'Villager');
  assert.equal(result.data.requiresContinue, true);
  assert.equal(game.pendingNightResultAcks.p1.type, 'seerFactionResult');
  assert.equal(game.nightActionsReceived.p1, undefined);

  const state = game.getSanitizedState('s1');
  assert.equal(state.nightPendingContinue, true);
  assert.equal(state.currentNightAction, 'Seer');

  game.handleNightAction('s1', { type: 'continue' });
  game.clearAllTimers();

  assert.equal(game.pendingNightResultAcks.p1, undefined);
  assert.equal(game.nightActionsReceived.p1, true);
});

run('bot reveal actions schedule an automatic Continue', () => {
  const game = makeGame();
  seatPlayers(game, ['Seer', 'Villager', 'Werewolf']);
  game.players[0].isBot = true;
  game.players[0].socketId = 'bot:p1';
  game.phase = 'night';
  game.currentNightAction = 'Seer';
  game.currentNightActors = ['p1'];

  game.handleNightAction('bot:p1', { type: 'player', target1: 'p2' });

  const result = game._events.find(e => e.scope === 'bot:p1' && e.event === 'actionResult' && e.data.type === 'seerFactionResult');
  assert.equal(result.data.requiresContinue, true);
  assert.equal(game.pendingNightResultAcks.p1.type, 'seerFactionResult');
  assert.equal(game.botTimers.size, 1);
  game.clearAllTimers();
});

run('bot Seer decisions use the supported player faction action', () => {
  const game = makeGame();
  seatPlayers(game, ['Seer', 'Villager', 'Werewolf']);

  const decision = game.buildBotNightDecision('p1', 'Seer');

  assert.equal(decision.type, 'player');
  assert.equal(['p2', 'p3'].includes(decision.target1), true);
});

run('Private Investigator checks target and living neighbors once per game', () => {
  const game = makeGame();
  seatPlayers(game, ['Private Investigator', 'Villager', 'Werewolf', 'Villager']);
  game.phase = 'night';
  game.currentNightAction = 'Private Investigator';
  game.currentNightActors = ['p1'];

  game.handleNightAction('s1', { type: 'player', target1: 'p2' });
  game.clearAllTimers();

  const result = game._events.find(e => e.scope === 's1' && e.event === 'actionResult' && e.data.type === 'privateInvestigatorResult');
  assert.equal(result.data.hasWerewolf, true);
  assert.equal(result.data.requiresContinue, true);
  assert.equal(game.pendingNightResultAcks.p1.type, 'privateInvestigatorResult');

  game.handleNightAction('s1', { type: 'continue' });
  game.clearAllTimers();

  assert.equal(game.nightActionsReceived.p1, true);
  assert.equal(game.assignments.p1.piUsed, true);
  assert.deepEqual(game.getActiveActors('Private Investigator'), []);
});

run('Cthulhu can only afflict a player once per game', () => {
  const game = makeGame();
  seatPlayers(game, ['Cthulhu', 'Villager', 'Villager', 'Werewolf']);
  game.phase = 'night';
  game.dayCount = 1;
  game.currentNightAction = 'Cthulhu';
  game.currentNightActors = ['p1'];

  // First use lands and marks the flag.
  game.handleNightAction('s1', { type: 'player', target1: 'p2', target2: 'TENTACLE' });
  game.clearAllTimers();

  assert.equal(game.cthulhuCrazed.p2, 'TENTACLE');
  assert.equal(game.assignments.p1.cthulhuUsed, true);

  // Subsequent night: queue-filter must skip the Cthulhu actor entirely.
  game.dayCount = 2;
  game.cthulhuCrazed = {};
  game.nightActionsReceived = {};
  game.pendingNightResultAcks = {};
  assert.deepEqual(game.getActiveActors('Cthulhu'), []);

  // Even a force-fed packet is rejected silently — actorRole resolves to null.
  game.currentNightAction = 'Cthulhu';
  game.currentNightActors = ['p1'];
  game.handleNightAction('s1', { type: 'player', target1: 'p3', target2: 'AGAIN' });
  game.clearAllTimers();

  assert.equal(game.cthulhuCrazed.p3, undefined);
});

run('The Reflector bounces a Werewolf attack back onto the pack', () => {
  const game = makeGame();
  seatPlayers(game, ['The Reflector', 'Werewolf', 'Villager', 'Seer']);
  game.reflectorTarget = { p1: 'p3' };  // Reflector p1 mirrors Villager p3
  game.werewolfKillTarget = 'p3';

  game.resolveDawnKills();

  assert.equal(game.assignments.p3.isDead, false, 'mirrored target survives the wolf attack');
  assert.equal(game.assignments.p2.isDead, true,  'wolf is struck by the reflected fangs');
});

run('The Reflector bounces the Witch\'s kill potion onto the Witch', () => {
  const game = makeGame();
  seatPlayers(game, ['The Reflector', 'Witch', 'Villager', 'Werewolf']);
  game.reflectorTarget = { p1: 'p3' };  // Reflector p1 mirrors Villager p3
  game.witchKills = [{ attackerId: 'p2', targetId: 'p3' }];

  game.resolveDawnKills();

  assert.equal(game.assignments.p3.isDead, false, 'mirrored target survives the potion');
  assert.equal(game.assignments.p2.isDead, true,  'Witch drinks her own brew');
});

run('The Reflector bounces the Troublemaker\'s call onto the Troublemaker', () => {
  const game = makeGame();
  seatPlayers(game, ['The Reflector', 'Troublemaker', 'Villager', 'Werewolf']);
  game.reflectorTarget = { p1: 'p3' };
  game.troublemakerKills = [{ attackerId: 'p2', targetId: 'p3' }];

  game.resolveDawnKills();

  assert.equal(game.assignments.p3.isDead, false);
  assert.equal(game.assignments.p2.isDead, true, 'Troublemaker claimed by their own scheme');
});

run('Spellcaster emits a dawn-time silence notice when day begins', () => {
  const game = makeGame();
  seatPlayers(game, ['Spellcaster', 'Villager', 'Villager', 'Werewolf']);
  game.phase = 'night';
  game.dayCount = 1;
  game.silencedNextDay = new Set(['p2']);
  game.settings.discussionLength = 1; // shrink so the day-tick interval is cheap

  game.startDay();
  game.clearAllTimers();

  // The dawn-time toast must arrive at the silenced player.
  const dawn = game._events.find(e =>
    e.scope === 's2' && e.event === 'privateNotice' && e.data && e.data.type === 'spellcasterDawn');
  assert.ok(dawn, 'expected a spellcasterDawn private notice routed to s2');

  // And the persistent day-status flag still reads as silenced (drives the day-banner pill).
  assert.equal(game.silencedNextDay.has('p2'), true);
  assert.equal(game.getSanitizedState('s2').myDayStatus.silenced, true);
});

run('Dawn Bringer declaration skips the entire next night phase', () => {
  const game = makeGame();
  seatPlayers(game, ['Dawn Bringer', 'Werewolf', 'Villager', 'Seer']);
  game.phase = 'night';
  game.dayCount = 2;            // not the first night
  game.settings.discussionLength = 1;
  game.dawnBringerDeclared = true;

  game.startNight();
  game.clearAllTimers();

  // Night phase must not run — phase should be 'day' (startDay was called) and the
  // declaration flag must have been consumed.
  assert.equal(game.phase, 'day');
  assert.equal(game.dawnBringerDeclared, false);
  // No wolf vote, no kills.
  assert.equal(game.werewolfKillTarget, null);
  assert.equal(game.assignments.p3.isDead, false);
});

run('Disruptor nullifies the target\'s night action with a private notice', () => {
  const game = makeGame();
  seatPlayers(game, ['Disruptor', 'Seer', 'Villager', 'Werewolf']);
  game.phase = 'night';
  game.dayCount = 2;
  game.currentNightAction = 'Seer';
  game.currentNightActors = ['p2'];
  game.disruptorTarget = { p1: 'p2' }; // Disruptor targets the Seer

  game.handleNightAction('s2', { type: 'player', target1: 'p4' });
  game.clearAllTimers();

  // The Seer must get a 'disrupted' result + private notice, and no seerResult fires.
  const notice = game._events.find(e =>
    e.scope === 's2' && e.event === 'privateNotice' && e.data && e.data.type === 'disrupted');
  assert.ok(notice, 'expected a disrupted private notice to s2');
  const actionResult = game._events.find(e =>
    e.scope === 's2' && e.event === 'actionResult' && e.data && e.data.type === 'disrupted');
  assert.ok(actionResult, 'expected a disrupted actionResult to s2');
  const seerResult = game._events.find(e =>
    e.scope === 's2' && e.event === 'actionResult' && e.data && e.data.type === 'seerFactionResult');
  assert.equal(seerResult, undefined, 'Seer must not produce a normal result while disrupted');
});

run('Reflector bounces a Spellcaster silence back onto the Spellcaster', () => {
  const game = makeGame();
  seatPlayers(game, ['The Reflector', 'Spellcaster', 'Villager', 'Werewolf']);
  game.phase = 'night';
  game.dayCount = 2;
  game.currentNightAction = 'Spellcaster';
  game.currentNightActors = ['p2'];
  game.reflectorTarget = { p1: 'p3' }; // Reflector mirrors Villager p3

  game.handleNightAction('s2', { type: 'player', target1: 'p3' });
  game.clearAllTimers();

  // Spellcaster (p2) is silenced, not the mirrored Villager (p3).
  assert.equal(game.silencedNextDay.has('p2'), true);
  assert.equal(game.silencedNextDay.has('p3'), false);
});

run('Yandere shield blocks the wolf kill AND eliminates a wolf (attacker-bounce)', () => {
  const game = makeGame();
  seatPlayers(game, ['Yandere', 'Werewolf', 'Villager', 'Seer']);
  game.phase = 'day';
  game.dayCount = 2;
  game.yanderObs = { p1: 'p3' };          // Yandere obsessed over Villager p3
  game.yandereActiveShield = { p1: 'p3' }; // Shield active this night
  game.werewolfKillTarget = 'p3';

  game.resolveDawnKills();

  assert.equal(game.assignments.p3.isDead, false, 'obsession survives');
  assert.equal(game.assignments.p2.isDead, true,  'wolf was bounced and killed');
});

run('Yandere win banner appends when their obsession survives to game end', () => {
  const game = makeGame();
  seatPlayers(game, ['Yandere', 'Villager', 'Werewolf', 'Villager']);
  // Kill the wolf and one villager so only Yandere + their obsession remain.
  game.assignments.p3.isDead = true;
  game.yanderObs = { p1: 'p2' };

  const ended = game.checkWinConditions(['p3'], 'vote');

  assert.equal(ended, true);
  assert.ok(/Village Wins/.test(game.winner), 'village wins the round');
  assert.ok(/Yandere/.test(game.winner) && /obsession/i.test(game.winner),
    'expected the Yandere personal banner appended to the winner line');
});

run('Accusation resolves when a banished player would otherwise stall the vote', () => {
  const game = makeGame();
  seatPlayers(game, ['Villager', 'Villager', 'Werewolf', 'Seer']);
  game.phase = 'accusation';
  game.accusationVotes = {};
  game.banishedNextDay = new Set(['p2']); // Old Hag banished p2 — they cannot vote

  // Only the three non-banished alive players should appear as voters.
  assert.equal(game.getVotingPlayers().length, 3);

  game.handleAccusation('s1', 'p3');
  game.handleAccusation('s3', 'p1');
  game.handleAccusation('s4', 'p3');
  game.clearAllTimers();

  // Without the fix, accusation would still be waiting on p2. With it, the phase has
  // moved on (no longer 'accusation') because the three eligible voters all voted.
  assert.notEqual(game.phase, 'accusation', 'phase advanced past accusation');
});

run('Disruptor targeting a Reflector-mirrored player turns the distortion on themselves', () => {
  const game = makeGame();
  seatPlayers(game, ['Disruptor', 'The Reflector', 'Villager', 'Werewolf']);
  game.phase = 'night';
  game.dayCount = 2;
  game.currentNightAction = 'Disruptor';
  game.currentNightActors = ['p1'];
  game.reflectorTarget = { p2: 'p3' }; // Reflector p2 mirrors Villager p3

  game.handleNightAction('s1', { type: 'player', target1: 'p3' });
  game.clearAllTimers();

  // Disruptor self-disrupts via the mirror bounce.
  assert.equal(game.disruptorTarget.p1, 'p1', 'Disruptor self-targeted via the mirror');
  // No other player got distracted.
  assert.equal(game.isDisrupted('p3'), false);
  assert.equal(game.isDisrupted('p1'), true);
  // Bounce notice routed to the Disruptor.
  const notice = game._events.find(e =>
    e.scope === 's1' && e.event === 'privateNotice' && e.data && e.data.type === 'reflected');
  assert.ok(notice, 'expected a reflected privateNotice routed to the Disruptor');
});

run('Per-night Reflector/Disruptor/Yandere targets clear after dawn', () => {
  const game = makeGame();
  seatPlayers(game, ['The Reflector', 'Disruptor', 'Yandere', 'Werewolf']);
  game.reflectorTarget = { p1: 'p4' };
  game.disruptorTarget = { p2: 'p4' };
  game.yandereActiveShield = { p3: 'p4' };
  game.witchKills = [];
  game.troublemakerKills = [];

  game.resolveDawnKills();

  assert.deepEqual(game.reflectorTarget, {}, 'reflector cleared after dawn');
  assert.deepEqual(game.disruptorTarget, {}, 'disruptor cleared after dawn');
  assert.deepEqual(game.yandereActiveShield, {}, 'yandere shield cleared after dawn');
});

run('ghost chat is gated on lingering, not merely on dying', () => {
  const game = makeGame();
  seatPlayers(game, ['Villager', 'Werewolf', 'Seer', 'Hunter']);
  game.assignments.p1.isDead = true; // lingered
  game.assignments.p3.isDead = true; // did not
  game.ghosts = new Set(['p1']);

  game.phase = 'day';
  assert.equal(game.canUseGhostChat('s1'), true, 'the raised ghost may speak');
  assert.equal(game.canUseGhostChat('s3'), false, 'an ordinary corpse may not');
  assert.equal(game.canUseGhostChat('s2'), false, 'living Werewolf cannot letter-speak');
  assert.equal(game.canUseGhostChat('s4'), false, 'living Hunter cannot letter-speak');

  // Day-only by design.
  game.phase = 'night';
  assert.equal(game.canUseGhostChat('s1'), false, 'ghost-chat closed during night');

  // Letters are public, so the panel stays readable for everyone during the day.
  game.phase = 'day';
  const stateLive = game.getSanitizedState('s2');
  assert.ok(stateLive.ghostInfo && stateLive.ghostInfo.active === true,
    'ghost panel stays visible so the village can read the letters');
  assert.equal(stateLive.ghostInfo.canSpeak, false, 'living player cannot speak');

  const stateGhost = game.getSanitizedState('s1');
  assert.equal(stateGhost.ghostInfo.canSpeak, true, 'the ghost can speak');
});

run('After VI rotation, Night 2 sanitized state surfaces the new currentRole (day-vs-night mismatch fix)', () => {
  const game = makeGame();
  seatPlayers(game, ['Village Idiot', 'Seer', 'Werewolf', 'Villager']);
  game.phase = 'night';
  game.dayCount = 1;
  game.currentNightAction = 'Village Idiot';
  game.currentNightActors = ['p1'];

  // Snapshot original roles before rotation.
  const beforeRoles = ['p2', 'p3', 'p4'].map(id => game.assignments[id].currentRole);

  game.handleNightAction('s1', { type: 'left' });
  game.clearAllTimers();

  // Sanity: rotation actually happened
  const afterRoles = ['p2', 'p3', 'p4'].map(id => game.assignments[id].currentRole);
  assert.notDeepEqual(afterRoles, beforeRoles, 'roles must rotate');

  // ─── REGRESSION TEST FOR THE BUG ───
  // BEFORE the fix: on Night 2 (a real night, not a day phase) the server hid
  // myCurrentRole, so the client panel fell back to myOriginalRole. The wake
  // prompt used currentRole — producing "day shows one role, night shows another".
  game.phase = 'night';
  game.dayCount = 2;
  game.currentNightAction = 'Werewolf';

  // For each player that actually had their role rotated, the new currentRole
  // must now be exposed in the sanitized state.
  ['p2', 'p3', 'p4'].forEach((pid, idx) => {
    const sock = `s${pid.slice(1)}`;
    const state = game.getSanitizedState(sock);
    const expectedCurrent = afterRoles[idx];
    const expectedOriginal = beforeRoles[idx];
    assert.equal(state.myCurrentRole, expectedCurrent,
      `Night 2 must expose myCurrentRole (got ${state.myCurrentRole}, expected ${expectedCurrent})`);
    assert.equal(state.myOriginalRole, expectedOriginal,
      'myOriginalRole stays the dealt card');
  });

  // ─── Verify the original Night-1 secrecy is STILL intact ───
  // On Night 1 (the same night a role swap happens), myCurrentRole must remain
  // hidden so Robber/Drunk/etc. don't leak mid-night swaps.
  game.phase = 'night';
  game.dayCount = 1;
  const night1State = game.getSanitizedState('s2');
  assert.equal(night1State.myCurrentRole, null,
    'Night 1 still hides currentRole until dawn (Robber secrecy preserved)');
});

run('Village Idiot rotates roles only on Night 1 and notifies the swapped players', () => {
  const game = makeGame();
  seatPlayers(game, ['Village Idiot', 'Seer', 'Werewolf', 'Villager']);
  game.phase = 'night';
  game.dayCount = 1;
  game.currentNightAction = 'Village Idiot';
  game.currentNightActors = ['p1'];

  // Snapshot the roles before the rotation.
  const before = ['p2', 'p3', 'p4'].map(id => game.assignments[id].currentRole);

  game.handleNightAction('s1', { type: 'left' });
  game.clearAllTimers();

  // Roles rotated left — the last role wrapped to the front.
  const after = ['p2', 'p3', 'p4'].map(id => game.assignments[id].currentRole);
  assert.notDeepEqual(after, before, 'roles must have rotated');

  // Each affected player got a privateNotice telling them what they became.
  ['p2', 'p3', 'p4'].forEach((pid, idx) => {
    const sock = `s${pid.slice(1)}`;
    const notice = game._events.find(e =>
      e.scope === sock && e.event === 'privateNotice' && e.data && e.data.type === 'villageIdiotRotation');
    assert.ok(notice, `expected villageIdiotRotation notice routed to ${sock}`);
    assert.equal(notice.data.newRole, after[idx]);
  });

  // Now confirm the queue won't schedule the Village Idiot again on Night 2.
  // shouldWakeRole is what the night-queue builder consults — it must reject the
  // Village Idiot on subsequent nights (first-night-only restriction).
  game.dayCount = 2;
  assert.equal(game.shouldWakeRole('Village Idiot'), false,
    'Village Idiot must NOT wake on Night 2 (first-night-only)');
});

run('Yandere activation on a dead obsession returns a clear error', () => {
  const game = makeGame();
  seatPlayers(game, ['Yandere', 'Villager', 'Villager', 'Werewolf']);
  game.phase = 'night';
  game.dayCount = 2;
  game.currentNightAction = 'Yandere';
  game.currentNightActors = ['p1'];
  game.yanderObs = { p1: 'p2' };
  game.assignments.p2.isDead = true; // obsession is dead

  game.handleNightAction('s1', { type: 'player', target1: 'activate' });
  game.clearAllTimers();

  const err = game._events.find(e =>
    e.scope === 's1' && e.event === 'actionResult' && e.data && e.data.type === 'error');
  assert.ok(err, 'expected an actionError when the obsession is dead');
  assert.match(err.data.message, /already dead/, 'message should mention the obsession is dead');
  // Shield should not have been spent.
  assert.equal(game.yandereUsed.p1 || 0, 0);
});

run('Trial resolves when a banished player would otherwise stall the vote', () => {
  const game = makeGame();
  seatPlayers(game, ['Villager', 'Villager', 'Werewolf', 'Seer']);
  game.phase = 'trial';
  game.accusedId = 'p3';
  game.trialVotes = {};
  game.banishedNextDay = new Set(['p2']); // banished — cannot vote at trial either

  // p1, p4 are the only eligible voters now (p3 is accused, p2 is banished).
  assert.equal(game.getTrialVoters().length, 2);

  // Force the resolveTrial timeouts to fire synchronously.
  const originalSetTimeout = global.setTimeout;
  global.setTimeout = (fn) => { fn(); return 1; };

  game.handleTrialVote('s1', 'eliminate');
  game.handleTrialVote('s4', 'eliminate');
  game.clearAllTimers();
  global.setTimeout = originalSetTimeout;

  // Both eligible voters voted eliminate — the verdict landed and the phase moved on.
  assert.notEqual(game.phase, 'trial', 'trial resolved without waiting on banished p2');
});

run('Mad Bomber bomb still triggers after being converted to Werewolf', () => {
  const game = makeGame();
  seatPlayers(game, ['Mad Bomber', 'Villager', 'Villager', 'Werewolf']);
  // Cursed-style conversion — currentRole flips to Werewolf, originalRole stays Mad Bomber.
  game.assignments.p1.currentRole = 'Werewolf';

  const killed = new Set();
  game.markPlayerDead('p1', killed);

  assert.equal(game.assignments.p1.isDead, true);
  // Either left neighbor (p4, seat-wrap) or right neighbor (p2) — depends on seat order
  // produced by the filter; just confirm the blast caught the immediate neighbours.
  assert.ok(killed.has('p2') || killed.has('p4'), 'blast must catch a seat neighbour');
});

run('Doppelganger only changes role when the bound player dies', () => {
  const game = makeGame();
  seatPlayers(game, ['Doppelganger', 'Seer', 'Werewolf']);
  game.phase = 'night';
  game.currentNightAction = 'Doppelganger';

  game.handleNightAction('s1', { type: 'player', target1: 'p2' });
  game.clearAllTimers();
  assert.equal(game.assignments.p1.currentRole, 'Doppelganger');

  game.markPlayerDead('p2');

  assert.equal(game.assignments.p1.currentRole, 'Seer');
});

run('Wolverine is treated as a werewolf for night queue and win checks', () => {
  const game = makeGame();
  seatPlayers(game, ['Wolverine', 'Villager', 'Seer']);
  game.startNight();
  game.clearAllTimers();

  assert.equal(game.currentNightAction, 'Werewolf');
  assert.deepEqual(game.getActiveActors('Werewolf'), ['p1']);
  assert.equal(game.nightQueue.includes('Wolverine'), false);
  assert.equal(game.isWerewolfRole(game.assignments.p1.currentRole), true);
});

run('bot idle decisions complete instead of stalling the night', () => {
  const game = makeGame();
  seatPlayers(game, ['Villager', 'Villager', 'Werewolf']);
  game.players[0].isBot = true;
  game.players[0].socketId = 'bot:p1';
  game.phase = 'night';
  game.currentNightAction = 'Unsupported Test Role';
  game.nightActionsReceived = {};

  game.finishNightAction('p1');
  game.clearAllTimers();

  assert.equal(game.nightActionsReceived.p1, true);
});

run('host leaving ends the active session and removes bots', () => {
  const game = makeGame();
  seatPlayers(game, ['Werewolf', 'Villager', 'Seer']);
  game.players.push({
    id: 'bot1',
    socketId: 'bot:bot1',
    name: 'Bot 1',
    isHost: false,
    connected: true,
    isBot: true,
  });
  game.phase = 'night';
  game.currentNightAction = 'Werewolf';
  game.assignments.bot1 = {
    originalRole: 'Villager',
    currentRole: 'Villager',
    doppelgangerRole: null,
    doppelgangerTarget: null,
    piUsed: false,
    isDead: false,
    bodyguardLives: 0,
  };

  game.endSessionBecauseHostLeft('p1');
  game.clearAllTimers();

  assert.equal(game.phase, 'lobby');
  assert.equal(game.players.some(p => p.isBot), false);
  assert.equal(game.players.some(p => p.id === 'p1'), false);
  assert.equal(game.players.find(p => p.id === 'p2').isHost, true);
  assert.deepEqual(game.assignments, {});
  assert.equal(game.currentNightAction, null);
});

run('Cupid links two players and a wolf kill on one kills the other', () => {
  const game = makeGame();
  seatPlayers(game, ['Cupid', 'Villager', 'Werewolf', 'Villager']);
  game.phase = 'night';
  game.currentNightAction = 'Cupid';
  game.handleNightAction('s1', { type: 'link', target1: 'p2', target2: 'p4' });
  game.clearAllTimers();

  assert.equal(game.cupidLinks.p2, 'p4');
  assert.equal(game.cupidLinks.p4, 'p2');

  const killed = new Set();
  game.resolveWolfKillOnTarget('p2', killed);
  
  assert.equal(game.assignments.p2.isDead, true);
  assert.equal(game.assignments.p4.isDead, true);
  assert.equal(killed.has('p2'), true);
  assert.equal(killed.has('p4'), true);
});

run('Diseased enrages when killed by wolves and blocks next night kills', () => {
  const game = makeGame();
  seatPlayers(game, ['Diseased', 'Werewolf', 'Villager']);
  const killed = new Set();
  game.resolveWolfKillOnTarget('p1', killed);

  assert.equal(game.assignments.p1.isDead, true);
  assert.equal(game.wolvesSkipNextNight, true);
});

run('Spellcaster silences player from day chat', () => {
  const game = makeGame();
  seatPlayers(game, ['Spellcaster', 'Villager', 'Werewolf']);
  game.phase = 'night';
  game.currentNightAction = 'Spellcaster';
  game.handleNightAction('s1', { type: 'player', target1: 'p2' });
  game.clearAllTimers();

  assert.equal(game.silencedNextDay.has('p2'), true);
});

run('Cursed target joins the werewolf pack instead of dying', () => {
  const game = makeGame();
  seatPlayers(game, ['Cursed', 'Werewolf', 'Villager']);
  const killed = new Set();
  game.resolveWolfKillOnTarget('p1', killed);

  assert.equal(game.assignments.p1.isDead, false);
  assert.equal(game.assignments.p1.currentRole, 'Werewolf');
});

run('Prince stands trial, is spared, and role changes to Villager on first vote out', () => {
  const game = makeGame();
  seatPlayers(game, ['Prince', 'Villager', 'Villager']);
  
  // Test Prince is NOT immune to accusation now
  assert.equal(game.isVoteImmune('p1'), true);
  game.phase = 'accusation';
  game.accusationVotes = {
    p2: 'p1',
    p3: 'p1',
  };
  game.resolveAccusation();
  assert.equal(game.accusedId, 'p1');
  
  // Test sparing and role change on trial
  game.phase = 'trial';
  game.executeTrialElimination();
  assert.equal(game.assignments.p1.isDead, false);
  assert.equal(game.assignments.p1.currentRole, 'Villager');
  assert.equal(game.revealedCards.p1, 'Prince');
  assert.equal(game.isVoteImmune('p1'), false);
});

run('Drunk performs swap with a center card and gets the new role on Night 3', () => {
  const game = makeGame();
  seatPlayers(game, ['Drunk', 'Villager', 'Villager']);
  game.centerCards = ['Werewolf', 'Tanner', 'Villager'];
  
  game.phase = 'night';
  game.currentNightAction = 'Drunk';
  game.handleNightAction('s1', { type: 'view' });
  game.clearAllTimers();
  
  assert.equal(game.assignments.p1.drunkRevealed, true);
  assert.notEqual(game.assignments.p1.currentRole, 'Drunk');
  assert.equal(game.centerCards.includes('Drunk'), true);
});

run('Diseased skip reset works correctly after one night', () => {
  const game = makeGame();
  seatPlayers(game, ['Diseased', 'Werewolf', 'Villager']);
  const killed = new Set();
  game.resolveWolfKillOnTarget('p1', killed);
  
  assert.equal(game.wolvesSkipNextNight, true);
  
  // Start night should transfer it to wolvesSkippingThisNight and reset wolvesSkipNextNight
  game.startNight();
  game.clearAllTimers();
  
  assert.equal(game.wolvesSkippingThisNight, true);
  assert.equal(game.wolvesSkipNextNight, false);
  assert.equal(game.shouldWerewolvesHuntNow(), false);
  
  // Next night start should clear it
  game.startNight();
  game.clearAllTimers();
  
  assert.equal(game.wolvesSkippingThisNight, false);
  assert.equal(game.shouldWerewolvesHuntNow(), true);
});

run('Werewolves see other Werewolves and end phase reveals all roles', () => {
  const game = makeGame();
  seatPlayers(game, ['Werewolf', 'Werewolf', 'Villager']);
  
  // During night, s1 (player 1, Werewolf) should see player 2 is a Werewolf
  game.phase = 'night';
  const state1 = game.getSanitizedState('s1');
  assert.equal(state1.players[1].revealedRole, 'Werewolf');
  
  // s3 (player 3, Villager) should NOT see player 2 is a Werewolf
  const state3 = game.getSanitizedState('s3');
  assert.equal(state3.players[1].revealedRole, null);
  
  // After end game, everyone sees all cards (including s3)
  game.phase = 'end';
  const state3End = game.getSanitizedState('s3');
  assert.equal(state3End.players[0].revealedRole, 'Werewolf');
  assert.equal(state3End.players[1].revealedRole, 'Werewolf');
  assert.equal(state3End.players[2].revealedRole, 'Villager');
});

run('Alpha Wolf cannot convert Vampire, Cult Leader, or Cthulhu (but can convert Tanner & Villager)', () => {
  const game = makeGame();
  seatPlayers(game, ['Alpha Wolf', 'Vampire', 'Villager']);
  game.alphaWolfCard = 'Werewolf';
  game.phase = 'night';
  game.currentNightAction = 'Alpha Wolf';
  game.currentNightActors = ['p1'];
  
  // Try to convert Vampire (p2)
  game._events.length = 0; // Clear events before action
  game.handleNightAction('s1', { type: 'kill', target1: 'p2' });
  game.clearAllTimers();
  // Verify conversion failed: role remains Vampire, and alphaWolfCard is still 'Werewolf'
  assert.equal(game.assignments.p2.currentRole, 'Vampire');
  assert.equal(game.alphaWolfCard, 'Werewolf');
  assert.equal(game._events.some(e => e.scope === 's1' && e.event === 'actionResult' && e.data.type === 'alphaResult' && e.data.success === false), true);
  
  // Fresh game instance for susceptible conversion
  const game2 = makeGame();
  seatPlayers(game2, ['Alpha Wolf', 'Vampire', 'Villager']);
  game2.alphaWolfCard = 'Werewolf';
  game2.phase = 'night';
  game2.currentNightAction = 'Alpha Wolf';
  game2.currentNightActors = ['p1'];

  // Try to convert Villager (p3)
  game2._events.length = 0; // Clear events before action
  game2.handleNightAction('s1', { type: 'kill', target1: 'p3' });
  game2.clearAllTimers();
  // Verify conversion succeeded: role is now Werewolf, and alphaWolfCard became the target's old role ('Villager')
  assert.equal(game2.assignments.p3.currentRole, 'Werewolf');
  assert.equal(game2.alphaWolfCard, 'Villager');
  assert.equal(game2._events.some(e => e.scope === 's1' && e.event === 'actionResult' && e.data.type === 'alphaResult' && e.data.success === true), true);

  // Fresh game instance for Tanner conversion
  const game3 = makeGame();
  seatPlayers(game3, ['Alpha Wolf', 'Tanner', 'Villager']);
  game3.alphaWolfCard = 'Werewolf';
  game3.phase = 'night';
  game3.currentNightAction = 'Alpha Wolf';
  game3.currentNightActors = ['p1'];

  // Try to convert Tanner (p2)
  game3._events.length = 0; // Clear events before action
  game3.handleNightAction('s1', { type: 'kill', target1: 'p2' });
  game3.clearAllTimers();
  // Verify conversion succeeded: role is now Werewolf, and alphaWolfCard became the target's old role ('Tanner')
  assert.equal(game3.assignments.p2.currentRole, 'Werewolf');
  assert.equal(game3.alphaWolfCard, 'Tanner');
  assert.equal(game3._events.some(e => e.scope === 's1' && e.event === 'actionResult' && e.data.type === 'alphaResult' && e.data.success === true), true);
});

run('custom deck settings are preserved when play again (startGame) is clicked', () => {
  const game = makeGame();
  game.addPlayer('p1', 's1', 'A');
  game.addPlayer('p2', 's2', 'B');
  game.addPlayer('p3', 's3', 'C');
  const customDeck = ['Werewolf', 'Robber', 'Troublemaker', 'Witch', 'Villager', 'Mason'];
  game.updateSettings('s1', { deck: customDeck });
  
  // Start 1st game
  assert.equal(game.startGame('s1'), true);
  game.clearAllTimers();
  
  // End game
  game.phase = 'end';
  
  // Start 2nd game (Play again)
  assert.equal(game.startGame('s1'), true);
  game.clearAllTimers();
  
  assert.equal(game.roles.length, 6);
  assert.deepEqual([...game.roles].sort(), [...customDeck].sort());
});

run('Mystic Wolf is excluded from wolves pool under 7 players', () => {
  const game = makeGame();
  
  // Under 7 players
  const deck6 = game.getDefaultDeck(6);
  // It shouldn't contain Mystic Wolf
  assert.equal(deck6.includes('Mystic Wolf'), false);

  // 7 or more players
  // Let's check that Mystic Wolf can spawn if we run it multiple times to be sure
  let foundMystic = false;
  for (let i = 0; i < 100; i++) {
    const deck7 = game.getDefaultDeck(7);
    if (deck7.includes('Mystic Wolf')) {
      foundMystic = true;
      break;
    }
  }
  assert.equal(foundMystic, true);
});





// ── Night-phase liveness ──────────────────────────────────────────────
// A reveal result parks the night queue until the player clicks Continue. That
// wait must always be bounded; it used to clear the phase timer outright, so a
// closed tab or an AFK player froze the room in the night phase permanently.

run('a pending reveal always leaves a bounded timer armed', () => {
  const game = makeGame();
  seatPlayers(game, ['Seer', 'Villager', 'Werewolf']);
  game.phase = 'night';
  game.currentNightAction = 'Seer';
  game.currentNightActors = ['p1'];

  game.handleNightAction('s1', { type: 'player', target1: 'p2' });

  assert.equal(game.pendingNightResultAcks.p1.type, 'seerFactionResult');
  assert.notEqual(game.timer, null);
  assert.ok(game.phaseEndsAt > Date.now(), 'review window should carry a deadline');
  game.clearAllTimers();
});

run('the review window force-resolves instead of stalling the night', () => {
  const game = makeGame();
  seatPlayers(game, ['Seer', 'Villager', 'Werewolf']);
  game.phase = 'night';
  game.currentNightAction = 'Seer';
  game.currentNightActors = ['p1'];
  game.nightQueue = [];

  game.handleNightAction('s1', { type: 'player', target1: 'p2' });
  assert.equal(game.pendingNightResultAcks.p1 !== undefined, true);

  game.forceResolveNightReview();
  game.clearAllTimers();

  assert.equal(game.pendingNightResultAcks.p1, undefined);
  assert.equal(game.nightActionsReceived.p1, true);
  assert.equal(game.phase, 'day', 'an empty queue after review should break for dawn');
});

run('a player who leaves mid-reveal releases their hold on the night', () => {
  const game = makeGame();
  seatPlayers(game, ['Seer', 'Villager', 'Werewolf']);
  game.phase = 'night';
  game.currentNightAction = 'Seer';
  game.currentNightActors = ['p1'];

  game.handleNightAction('s1', { type: 'player', target1: 'p2' });
  assert.equal(game.hasPendingNightResultAck('p1'), true);

  game.players[0].connected = false;
  assert.equal(game.releaseNightHold('p1'), true);
  game.clearAllTimers();

  assert.equal(game.hasPendingNightResultAck('p1'), false);
  assert.equal(game.nightActionsReceived.p1, true);
});

run('disconnected actors do not hold the "everyone acted" check open', () => {
  const game = makeGame();
  seatPlayers(game, ['Werewolf', 'Werewolf', 'Villager', 'Villager']);
  game.phase = 'night';
  game.currentNightAction = 'Werewolf';
  game.currentNightActors = ['p1', 'p2'];

  // p2 drops after the actor list was snapshotted at wake time.
  game.players[1].connected = false;
  assert.deepEqual(game.getPendingNightActors(), ['p1']);

  game.nightActionsReceived.p1 = true;
  assert.deepEqual(game.getPendingNightActors(), []);
  game.clearAllTimers();
});

run('host can end the night early and the wake queue is abandoned', () => {
  const game = makeGame();
  seatPlayers(game, ['Seer', 'Villager', 'Werewolf']);
  game.phase = 'night';
  game.currentNightAction = 'Seer';
  game.currentNightActors = ['p1'];
  game.nightQueue = ['Werewolf'];
  game.pendingNightResultAcks = { p1: { role: 'Seer', type: 'seerFactionResult', ts: Date.now() } };

  // Non-hosts cannot force dawn.
  assert.equal(game.skipNight('s2'), false);
  assert.equal(game.phase, 'night');

  assert.equal(game.skipNight('s1'), true);
  game.clearAllTimers();

  assert.equal(game.phase, 'day');
  assert.deepEqual(game.nightQueue, []);
  assert.deepEqual(game.pendingNightResultAcks, {});
});

// ── State lifecycle ───────────────────────────────────────────────────
// Every per-game field is cleared in one place. This guards the drift that let
// newer role state survive a reset because only some of the paths knew about it.

function assertGameStateClean(game, label) {
  const emptyMaps = [
    'assignments', 'revealedCards', 'cupidLinks', 'vampireMarks', 'accusationCounts',
    'dawnBringerUsed', 'yanderObs', 'yandereUsed', 'disruptorTarget', 'reflectorTarget',
    'yandereActiveShield', 'cthulhuCrazed', 'wwKillVotes', 'nightActionsReceived',
    'pendingNightResultAcks', 'accusationVotes', 'trialVotes',
  ];
  const emptyLists = [
    'roles', 'centerCards', 'eventLog', 'nightQueue', 'protectedPlayers',
    'witchKills', 'troublemakerKills', 'currentNightActors', 'jailerChatMessages',
  ];
  const emptySets = [
    'cultMembers', 'toughGuyHit', 'silencedNextDay', 'banishedNextDay',
    'jailedTargets', 'witchProtectedTargets',
  ];
  const cleared = [
    'winner', 'accusedId', 'alphaWolfCard', 'cultLeaderId', 'werewolfKillTarget',
    'sentinelShielded', 'currentNightAction', 'jailedPlayerId', 'jailerActorId',
    'jailerTargetId', 'jailerChatTimer', 'jailerChatExpiresAt', 'phaseEndsAt',
  ];
  const flagsOff = [
    'jailerChatActive', 'dawnBringerDeclared', 'wolfCubExtraKill',
    'wolfCubPendingExtraKill', 'wolvesSkipNextNight', 'wolvesSkippingThisNight',
  ];

  emptyMaps.forEach(f => assert.deepEqual(game[f], {}, `${label}: ${f} should be empty`));
  emptyLists.forEach(f => assert.deepEqual(game[f], [], `${label}: ${f} should be empty`));
  emptySets.forEach(f => assert.equal(game[f].size, 0, `${label}: ${f} should be empty`));
  cleared.forEach(f => assert.equal(game[f], null, `${label}: ${f} should be null`));
  flagsOff.forEach(f => assert.equal(game[f], false, `${label}: ${f} should be false`));
  assert.equal(game.bodyguardGuards.size, 0, `${label}: bodyguardGuards should be empty`);
  assert.equal(game.dayCount, 1, `${label}: dayCount should be 1`);
}

function dirtyEveryStateField(game) {
  game.roles = ['Werewolf'];
  game.centerCards = ['Villager'];
  game.alphaWolfCard = 'Werewolf';
  game.revealedCards = { p1: 'Seer' };
  game.eventLog = ['something happened'];
  game.dayCount = 4;
  game.nightQueue = ['Seer'];
  game.winner = 'Village Wins!';
  game.phaseEndsAt = Date.now() + 1000;
  game.cupidLinks = { p1: 'p2' };
  game.cultMembers = new Set(['p1']);
  game.cultLeaderId = 'p1';
  game.vampireMarks = { p2: 'p1' };
  game.accusationCounts = { p1: 3 };
  game.toughGuyHit = new Set(['p2']);
  game.wolfCubExtraKill = true;
  game.wolfCubPendingExtraKill = true;
  game.wolvesSkipNextNight = true;
  game.wolvesSkippingThisNight = true;
  game.dawnBringerUsed = { p1: true };
  game.dawnBringerDeclared = true;
  game.yanderObs = { p1: 'p2' };
  game.yandereUsed = { p1: 2 };
  game.yandereActiveShield = { p1: 'p2' };
  game.disruptorTarget = { p1: 'p2' };
  game.reflectorTarget = { p1: 'p2' };
  game.cthulhuCrazed = { p2: 'fhtagn' };
  game.silencedNextDay = new Set(['p2']);
  game.banishedNextDay = new Set(['p3']);
  game.wwKillVotes = { p1: 'p2' };
  game.werewolfKillTarget = 'p2';
  game.protectedPlayers = ['p3'];
  game.bodyguardGuards = new Map([['p1', 'p2']]);
  game.jailedTargets = new Set(['p2']);
  game.jailedPlayerId = 'p2';
  game.jailerChatActive = true;
  game.jailerActorId = 'p1';
  game.jailerTargetId = 'p2';
  game.jailerChatMessages = [{ sender: 'p1', text: 'hi' }];
  game.jailerChatExpiresAt = Date.now() + 1000;
  game.sentinelShielded = 'p3';
  game.witchKills = ['p2'];
  game.witchProtectedTargets = new Set(['p3']);
  game.troublemakerKills = ['p2'];
  game.nightActionsReceived = { p1: true };
  game.pendingNightResultAcks = { p1: { type: 'seerFactionResult' } };
  game.currentNightAction = 'Seer';
  game.currentNightActors = ['p1'];
  game.accusationVotes = { p1: 'p2' };
  game.trialVotes = { p1: 'eliminate' };
  game.accusedId = 'p2';
}

run('a fresh engine starts with fully clean game state', () => {
  assertGameStateClean(makeGame(), 'constructor');
});

run('play again clears every field from the previous game', () => {
  const game = makeGame();
  game.addPlayer('p1', 's1', 'A');
  game.addPlayer('p2', 's2', 'B');
  game.addPlayer('p3', 's3', 'C');
  game.phase = 'end';
  dirtyEveryStateField(game);

  assert.equal(game.startGame('s1'), true);
  game.clearAllTimers();

  // Fields the new game legitimately populates are checked separately.
  assert.equal(game.dayCount, 1);
  assert.equal(game.winner, null);
  assert.equal(game.accusedId, null);
  assert.deepEqual(game.accusationVotes, {});
  assert.deepEqual(game.trialVotes, {});
  assert.deepEqual(game.cthulhuCrazed, {});
  assert.deepEqual(game.disruptorTarget, {});
  assert.deepEqual(game.reflectorTarget, {});
  assert.deepEqual(game.yanderObs, {});
  assert.deepEqual(game.dawnBringerUsed, {});
  assert.equal(game.dawnBringerDeclared, false);
  assert.equal(game.wolfCubExtraKill, false);
  assert.equal(game.wolvesSkipNextNight, false);
  assert.equal(game.jailerChatActive, false);
  assert.equal(game.jailedPlayerId, null);
  assert.equal(game.werewolfKillTarget, null);
  assert.equal(game.silencedNextDay.size, 0);
  assert.equal(game.banishedNextDay.size, 0);
  assert.equal(game.toughGuyHit.size, 0);
  assert.deepEqual(game.witchKills, []);
});

run('a collapsed session resets the same fields a fresh game does', () => {
  const game = makeGame();
  game.addPlayer('p1', 's1', 'Host');
  game.addPlayer('p2', 's2', 'B');
  dirtyEveryStateField(game);

  game.endSessionBecauseHostLeft('p1');
  game.clearAllTimers();

  assert.equal(game.phase, 'lobby');
  // The reset runs first, then the session-end notice is logged for the lobby.
  assert.equal(game.eventLog.length, 1);
  game.eventLog = [];
  assertGameStateClean(game, 'host-leave');
});

// ── Timers and state hygiene ──────────────────────────────────────────

run('phase timers are anchored to a wall-clock deadline', () => {
  const game = makeGame();
  seatPlayers(game, ['Seer', 'Villager', 'Werewolf']);
  game.phase = 'day';

  const before = Date.now();
  game.startPhaseTimer(30, () => {});
  assert.equal(game.timeLeft, 30);
  assert.ok(game.phaseEndsAt >= before + 30000, 'deadline should be 30s out');
  assert.ok(game.phaseEndsAt <= Date.now() + 30000);
  game.clearAllTimers();
});

run('accused id is withheld outside the phases where it applies', () => {
  const game = makeGame();
  seatPlayers(game, ['Seer', 'Villager', 'Werewolf']);
  game.accusedId = 'p2';

  game.phase = 'night';
  assert.equal(game.getSanitizedState('s1').accusedId, null);
  game.phase = 'day';
  assert.equal(game.getSanitizedState('s1').accusedId, null);

  game.phase = 'defense';
  assert.equal(game.getSanitizedState('s1').accusedId, 'p2');
  game.phase = 'trial';
  assert.equal(game.getSanitizedState('s1').accusedId, 'p2');
  game.clearAllTimers();
});

run('broadcast state does not leak socket handles', () => {
  const game = makeGame();
  seatPlayers(game, ['Seer', 'Villager', 'Werewolf']);
  game.phase = 'day';

  const state = game.getSanitizedState('s1');
  state.players.forEach((p) => {
    assert.equal('socketId' in p, false, 'player payload should not carry socketId');
  });
  game.clearAllTimers();
});

// ── Night clock secrecy ───────────────────────────────────────────────
// Wake phases are not all the same length — the hunt runs longer than the rest —
// so a room-wide countdown would tell sleeping players exactly which role is up.

run('night phase clocks are hidden from players who are not awake', () => {
  const game = makeGame();
  seatPlayers(game, ['Werewolf', 'Villager', 'Seer', 'Villager']);
  game.phase = 'night';
  game.currentNightAction = 'Werewolf';
  game.currentNightActors = ['p1'];
  game.phaseEndsAt = Date.now() + 25000;
  game.phaseDuration = 25;

  const wolf = game.getSanitizedState('s1');
  assert.equal(wolf.phaseDuration, 25);
  assert.ok(wolf.phaseEndsAt, 'the acting player should see their own clock');

  const asleep = game.getSanitizedState('s2');
  assert.equal(asleep.phaseEndsAt, null, 'a sleeping player must not see the deadline');
  assert.equal(asleep.phaseDuration, 0, 'a sleeping player must not see the wake length');
  game.clearAllTimers();
});

run('night ticks go only to the players who are awake', () => {
  const game = makeGame();
  seatPlayers(game, ['Werewolf', 'Villager', 'Seer']);
  game.phase = 'night';
  game.currentNightAction = 'Werewolf';
  game.currentNightActors = ['p1'];

  game._events.length = 0;
  game.emitTick();

  const ticks = game._events.filter(e => e.event === 'phaseTick');
  assert.deepEqual(ticks.map(e => e.scope), ['s1']);
  assert.equal(ticks.filter(e => e.scope === 'room').length, 0);
  game.clearAllTimers();
});

run('day phase ticks still reach the whole room', () => {
  const game = makeGame();
  seatPlayers(game, ['Werewolf', 'Villager', 'Seer']);
  game.phase = 'day';

  game._events.length = 0;
  game.emitTick();

  const ticks = game._events.filter(e => e.event === 'phaseTick');
  assert.deepEqual(ticks.map(e => e.scope), ['room']);
  game.clearAllTimers();
});

// ── Disconnect and reconnect ──────────────────────────────────────────
// A dropped connection used to be fatal: the host's socket going quiet for five
// seconds wiped an in-progress game for everyone. A seat now survives a drop,
// and host duty moves rather than the game ending.

run('host duty transfers immediately instead of ending the game', () => {
  const game = makeGame();
  game.addPlayer('p1', 's1', 'Host');
  game.addPlayer('p2', 's2', 'B');
  game.addPlayer('p3', 's3', 'C');
  game.startGame('s1');
  game.clearAllTimers();
  game.phase = 'night';
  game.dayCount = 3;

  game.removePlayer('s1');
  game.clearAllTimers();

  assert.equal(game.phase, 'night', 'the game must keep running');
  assert.equal(game.dayCount, 3, 'progress must survive a host drop');
  assert.equal(Object.keys(game.assignments).length, 3, 'roles must survive');
  assert.equal(game.players.find(p => p.id === 'p1').connected, false);
  assert.equal(game.players.find(p => p.id === 'p1').isHost, false);
  assert.equal(game.players.find(p => p.id === 'p2').isHost, true, 'host duty should move on');
});

run('a mid-game seat is held far longer than a lobby seat', () => {
  const game = makeGame();
  game.addPlayer('p1', 's1', 'Host');
  game.addPlayer('p2', 's2', 'B');
  game.addPlayer('p3', 's3', 'C');
  const lobbyGrace = game.getReconnectGraceMs();

  game.startGame('s1');
  game.clearAllTimers();
  game.phase = 'night';
  const gameGrace = game.getReconnectGraceMs();

  assert.ok(gameGrace > lobbyGrace * 10, 'mid-game grace should dwarf the lobby one');
  assert.ok(gameGrace >= 60000, 'a locked phone needs at least a minute');

  game.removePlayer('s2');
  game.clearAllTimers();
  const seat = game.players.find(p => p.id === 'p2');
  assert.ok(seat.reconnectDeadline > Date.now() + 60000, 'the seat should carry a deadline');
});

run('reconnecting restores the seat and clears the countdown', () => {
  const game = makeGame();
  const token = game.addPlayer('p1', 's1', 'Host');
  game.addPlayer('p2', 's2', 'B');
  game.addPlayer('p3', 's3', 'C');
  game.startGame('s1');
  game.clearAllTimers();
  game.phase = 'night';

  game.removePlayer('s1');
  game.clearAllTimers();
  assert.equal(game.players.find(p => p.id === 'p1').connected, false);

  // Same player id and token, new socket — a refreshed tab.
  game.addPlayer('p1', 's1-new', 'Host', token);
  game.clearAllTimers();

  const back = game.players.find(p => p.id === 'p1');
  assert.equal(back.connected, true);
  assert.equal(back.socketId, 's1-new');
  assert.equal(back.reconnectDeadline, null);
  assert.equal(back.disconnectedAt, null);
  assert.equal(game.phase, 'night', 'they should land back in the same game');
  assert.equal(game.assignments.p1.originalRole !== undefined, true, 'and keep their card');
});

run('the room only collapses once the last human is gone', () => {
  const game = makeGame();
  game.addPlayer('p1', 's1', 'Host');
  game.addPlayer('p2', 's2', 'B');
  game.addPlayer('p3', 's3', 'C');
  game.startGame('s1');
  game.clearAllTimers();
  game.phase = 'night';
  game.dayCount = 2;

  // Two of the three drop: the game carries on for whoever is left.
  game.players.find(p => p.id === 'p1').connected = false;
  game.players.find(p => p.id === 'p2').connected = false;
  game.retireSeat(game.players.find(p => p.id === 'p1'));
  game.clearAllTimers();
  assert.equal(game.phase, 'night');
  assert.equal(game.dayCount, 2);

  // The last one goes and there is no game left to hold open.
  game.players.find(p => p.id === 'p3').connected = false;
  game.retireSeat(game.players.find(p => p.id === 'p3'));
  game.clearAllTimers();
  assert.equal(game.phase, 'lobby');
});

run('the reconnect countdown is published to the table', () => {
  const game = makeGame();
  game.addPlayer('p1', 's1', 'Host');
  game.addPlayer('p2', 's2', 'B');
  game.addPlayer('p3', 's3', 'C');
  game.startGame('s1');
  game.clearAllTimers();
  game.phase = 'night';

  game.removePlayer('s2');
  game.clearAllTimers();

  const seen = game.getSanitizedState('s1').players.find(p => p.id === 'p2');
  assert.equal(seen.connected, false);
  assert.ok(seen.reconnectDeadline > Date.now(), 'the table should see time remaining');

  const host = game.getSanitizedState('s1').players.find(p => p.id === 'p1');
  assert.equal(host.reconnectDeadline, null, 'connected players carry no countdown');
});

// ── Chronicle ─────────────────────────────────────────────────────────
// A complete record of what actually happened, including everything hidden at
// the time. It is the end-screen payoff, so it must never leak mid-game.

run('the chronicle stays sealed until the game is over', () => {
  const game = makeGame();
  game.addPlayer('p1', 's1', 'Host');
  game.addPlayer('p2', 's2', 'B');
  game.addPlayer('p3', 's3', 'C');
  game.startGame('s1');
  game.clearAllTimers();

  assert.ok(game.chronicle.length > 0, 'the opening lineup should be recorded');
  game.phase = 'night';
  assert.deepEqual(game.getSanitizedState('s1').chronicle, [], 'sealed while playing');

  game.phase = 'end';
  assert.ok(game.getSanitizedState('s1').chronicle.length > 0, 'revealed at the end');
  game.clearAllTimers();
});

run('the chronicle records deaths with role and cause', () => {
  const game = makeGame();
  seatPlayers(game, ['Werewolf', 'Villager', 'Seer', 'Villager']);
  game.phase = 'night';
  game.chronicle = [];

  game.markPlayerDead('p2', new Set(), 'wolves');
  const death = game.chronicle.find(e => e.type === 'death');
  assert.equal(death.playerId, 'p2');
  assert.equal(death.role, 'Villager');
  assert.equal(death.cause, 'wolves');
  assert.equal(death.day, 1);
  assert.ok(death.text.includes('Villager'), 'the entry should name the role');
  game.clearAllTimers();
});

run('the chronicle records transformations', () => {
  const game = makeGame();
  seatPlayers(game, ['Cursed', 'Villager', 'Werewolf']);
  game.phase = 'night';
  game.chronicle = [];

  game.applyRoleChange('p1', 'Werewolf');
  const change = game.chronicle.find(e => e.type === 'transform');
  assert.equal(change.from, 'Cursed');
  assert.equal(change.to, 'Werewolf');

  // A no-op role change is not a story beat.
  const before = game.chronicle.length;
  game.applyRoleChange('p1', 'Werewolf');
  assert.equal(game.chronicle.length, before);
  game.clearAllTimers();
});

run('a full round writes an ordered story into the chronicle', () => {
  const game = makeGame();
  seatPlayers(game, ['Werewolf', 'Villager', 'Seer', 'Villager', 'Villager']);
  game.phase = 'accusation';
  game.dayCount = 2;
  game.chronicle = [];

  game.accusationVotes = { p1: 'p3', p2: 'p3', p3: 'p1' };
  game.resolveAccusation();
  game.clearAllTimers();

  const accusation = game.chronicle.find(e => e.type === 'accusation');
  assert.equal(accusation.playerId, 'p3');
  assert.equal(accusation.votes, 2);
  assert.equal(accusation.day, 2);

  game.phase = 'trial';
  game.accusedId = 'p3';
  game.trialVotes = { p1: 'eliminate', p2: 'eliminate', p4: 'save' };
  game.resolveTrial();
  game.clearAllTimers();

  const verdict = game.chronicle.find(e => e.type === 'verdict');
  assert.equal(verdict.eliminate, 2);
  assert.equal(verdict.save, 1);

  // Entries must come out in the order they happened.
  const order = game.chronicle.map(e => e.ts);
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
});

run('a second Force Verdict cannot cancel an execution already under way', () => {
  const game = makeGame();
  seatPlayers(game, ['Werewolf', 'Villager', 'Seer', 'Villager', 'Villager']);
  game.phase = 'trial';
  game.accusedId = 'p3';
  game.trialVotes = { p1: 'eliminate', p2: 'eliminate', p4: 'save' };

  game.resolveTrial();
  assert.equal(game.executionPending, true, 'the execution should latch');
  const pendingTimer = game.timer;
  assert.notEqual(pendingTimer, null, 'the kill is deferred behind the scene');

  // The host mashes the button while the animation plays.
  game.skipTrial('s1');
  game.skipTrial('s1');
  game.resolveTrial();

  assert.equal(game.executionPending, true);
  assert.equal(game.timer, pendingTimer, 'the pending kill must not be restarted');
  assert.equal(game.accusedId, 'p3', 'and the verdict must still stand');
  game.clearAllTimers();
});

run('host skips during the walk to nightfall cannot restart the trial', () => {
  const game = makeGame();
  seatPlayers(game, ['Werewolf', 'Villager', 'Seer', 'Villager', 'Villager']);
  game.phase = 'trial';
  game.accusedId = 'p3';
  game.trialVotes = { p1: 'eliminate', p2: 'eliminate', p4: 'save' };

  game.resolveTrial();
  // Run the deferred execution by hand, as the scene timer would.
  game.clearTimer();
  game.markPlayerDead('p3', new Set(), 'vote');
  game.accusedId = null;
  game.advanceToNight();
  const dayAfterOneTrial = game.dayCount;

  // The phase still reads 'trial' during the three-second walk to night, so a
  // host mashing Force Verdict here used to loop the day counter forever.
  game.skipTrial('s1');
  game.skipTrial('s1');
  game.skipTrial('s1');

  assert.equal(game.dayCount, dayAfterOneTrial, 'the day must only advance once');
  assert.equal(game.executionPending, true, 'the verdict stays latched until night');

  game.startNight();
  assert.equal(game.executionPending, false, 'and clears when the night begins');
  game.clearAllTimers();
});

run('dawn deaths are filed under the night that caused them', () => {
  const game = makeGame();
  seatPlayers(game, ['Werewolf', 'Villager', 'Seer', 'Villager']);
  game.phase = 'day';
  game.dayCount = 2;
  game.chronicle = [];

  // A body found at sunrise belongs to the night, not the morning.
  game.chronicleAct = 'night';
  game.markPlayerDead('p2', new Set(), 'wolves');
  game.chronicleAct = null;
  game.markPlayerDead('p4', new Set(), 'vote');

  const [nightDeath, dayDeath] = game.chronicle.filter(e => e.type === 'death');
  assert.equal(nightDeath.phase, 'night');
  assert.equal(dayDeath.phase, 'day');
  game.clearAllTimers();
});

// ── Wolf team cohesion ────────────────────────────────────────────────
// The pack chooses its victim before the Alpha Wolf wakes, so a conversion can
// land on the player already marked to die. The bite must not then kill the
// packmate the pack just recruited.

run('Alpha Wolf cannot convert someone already on the wolf team', () => {
  const game = makeGame();
  seatPlayers(game, ['Alpha Wolf', 'Werewolf', 'Minion', 'Villager', 'Seer']);
  game.phase = 'night';
  game.currentNightAction = 'Alpha Wolf';
  game.currentNightActors = ['p1'];
  game.alphaWolfCard = 'Werewolf';

  // A fellow wolf is refused.
  game.handleNightAction('s1', { type: 'convert', target1: 'p2' });
  assert.equal(game.assignments.p2.currentRole, 'Werewolf');
  assert.equal(game.nightActionsReceived.p1, undefined, 'the turn should not be consumed');

  // So is wolf support — handing them the card wastes it.
  game.handleNightAction('s1', { type: 'convert', target1: 'p3' });
  assert.equal(game.assignments.p3.currentRole, 'Minion');
  assert.equal(game.nightActionsReceived.p1, undefined);

  // Someone outside the pack works.
  game.handleNightAction('s1', { type: 'convert', target1: 'p4' });
  assert.equal(game.assignments.p4.currentRole, 'Werewolf');
  game.clearAllTimers();
});

run('the pack does not eat a player who joined it during the night', () => {
  const game = makeGame();
  seatPlayers(game, ['Alpha Wolf', 'Werewolf', 'Villager', 'Seer', 'Villager']);
  game.phase = 'night';

  // The hunt is locked in on p3 while they are still a villager.
  const killed = new Set();
  game.assignments.p3.currentRole = 'Werewolf'; // the Alpha converted them after
  const died = game.resolveWolfKillOnTarget('p3', killed);

  assert.equal(died, false, 'the bite must fizzle');
  assert.equal(game.assignments.p3.isDead, false);
  assert.equal(killed.size, 0);
  game.clearAllTimers();
});

run('a bot Alpha Wolf never picks a packmate to convert', () => {
  const game = makeGame();
  seatPlayers(game, ['Alpha Wolf', 'Werewolf', 'Minion', 'Villager', 'Seer']);
  game.phase = 'night';
  game.alphaWolfCard = 'Werewolf';

  for (let i = 0; i < 60; i++) {
    const decision = game.buildBotNightDecision('p1', 'Alpha Wolf');
    if (decision.type === 'view') continue;
    const role = game.assignments[decision.target1].currentRole;
    assert.equal(game.isWolfTeamRole(role), false, `bot picked packmate ${role}`);
  }
  game.clearAllTimers();
});

run('a bot wolf never bites wolf support either', () => {
  const game = makeGame();
  seatPlayers(game, ['Werewolf', 'Minion', 'Squire', 'Villager']);
  game.phase = 'night';
  game.dayCount = 2;

  for (let i = 0; i < 60; i++) {
    const decision = game.buildBotNightDecision('p1', 'Werewolf');
    if (decision.type !== 'kill') continue;
    const role = game.assignments[decision.target1].currentRole;
    assert.equal(game.isWolfTeamRole(role), false, `bot targeted teammate ${role}`);
  }
  game.clearAllTimers();
});

// ── Hunter revenge liveness ───────────────────────────────────────────
// The last shot halts the whole game on one click. A bot Hunter never clicked
// at all and a human who left hung the room permanently.

run('a bot Hunter takes its shot instead of hanging the game', () => {
  const game = makeGame();
  seatPlayers(game, ['Hunter', 'Werewolf', 'Seer', 'Villager']);
  game.players[0].isBot = true;
  game.phase = 'trial';

  const originalSetTimeout = global.setTimeout;
  const scheduled = [];
  global.setTimeout = (fn, delay) => { scheduled.push({ fn, delay }); return scheduled.length; };

  game.pendingHunterRevenge = 'p1';
  game.pendingHunterRevengeKills = [];
  game.assignments.p1.isDead = true;
  game.armHunterRevengeTimer('p1');

  // Bots answer fast; nobody waits the full human window on them.
  assert.ok(scheduled.length > 0, 'a window must be armed');
  assert.ok(scheduled[0].delay < 5000, `bot window should be short, got ${scheduled[0].delay}`);

  scheduled[0].fn();
  assert.equal(game.pendingHunterRevenge, null, 'the shot must resolve itself');

  global.setTimeout = originalSetTimeout;
  game.clearAllTimers();
});

run('an absent human Hunter passes rather than freezing the room', () => {
  const game = makeGame();
  seatPlayers(game, ['Hunter', 'Werewolf', 'Seer', 'Villager']);
  game.phase = 'trial';

  const originalSetTimeout = global.setTimeout;
  const scheduled = [];
  global.setTimeout = (fn, delay) => { scheduled.push({ fn, delay }); return scheduled.length; };

  game.pendingHunterRevenge = 'p1';
  game.pendingHunterRevengeKills = [];
  game.assignments.p1.isDead = true;
  game.armHunterRevengeTimer('p1');

  assert.ok(scheduled[0].delay >= 20000, 'a human deserves a generous window');
  scheduled[0].fn();

  assert.equal(game.pendingHunterRevenge, null);
  // Nobody else should be dragged down by a shot that was never taken.
  assert.equal(game.assignments.p2.isDead, false);
  assert.equal(game.assignments.p3.isDead, false);

  global.setTimeout = originalSetTimeout;
  game.clearAllTimers();
});

run('a bot Hunter on the wolf team does not shoot its own', () => {
  const game = makeGame();
  seatPlayers(game, ['Hunter', 'Werewolf', 'Minion', 'Villager']);
  game.players[0].isBot = true;
  game.assignments.p1.currentRole = 'Werewolf';
  game.phase = 'trial';

  const originalSetTimeout = global.setTimeout;
  for (let i = 0; i < 25; i++) {
    const scheduled = [];
    global.setTimeout = (fn) => { scheduled.push(fn); return scheduled.length; };
    game.assignments.p2.isDead = false;
    game.assignments.p3.isDead = false;
    game.assignments.p4.isDead = false;
    game.pendingHunterRevenge = 'p1';
    game.pendingHunterRevengeKills = [];
    game.armHunterRevengeTimer('p1');
    scheduled[0]();
    assert.equal(game.assignments.p2.isDead, false, 'shot a fellow wolf');
    assert.equal(game.assignments.p3.isDead, false, 'shot its own Minion');
  }
  global.setTimeout = originalSetTimeout;
  game.clearAllTimers();
});

run('protection lists do not keep hold of the dead', () => {
  const game = makeGame();
  seatPlayers(game, ['Bodyguard', 'Werewolf', 'Seer', 'Sentinel']);
  game.phase = 'night';
  game.protectedPlayers = ['p3'];
  game.jailedTargets = new Set(['p3']);
  game.sentinelShielded = 'p3';

  game.markPlayerDead('p3', new Set(), 'wolves');

  assert.equal(game.protectedPlayers.includes('p3'), false);
  assert.equal(game.jailedTargets.has('p3'), false);
  assert.equal(game.sentinelShielded, null);
  game.clearAllTimers();
});

// ── Ghosts ────────────────────────────────────────────────────────────
// Dying is a chance to linger, not a promise. A ghost gets one letter per day —
// previously every corpse could type freely, which made the channel a second
// town chat instead of a rare, weighty signal.

run('a ghost speaks once per day and no more', () => {
  const game = makeGame();
  seatPlayers(game, ['Werewolf', 'Villager', 'Seer', 'Villager']);
  game.phase = 'day';
  game.dayCount = 2;
  game.assignments.p2.isDead = true;
  game.ghosts = new Set(['p2']);

  assert.equal(game.handleGhostMessage('s2', 'R'), true);
  assert.equal(game.handleGhostMessage('s2', 'X'), false, 'a second letter the same day');
  assert.equal(game.handleGhostMessage('s2', 'Y'), false);

  // A new day restores the allowance.
  game.dayCount = 3;
  assert.equal(game.handleGhostMessage('s2', 'S'), true);
  assert.equal(game.handleGhostMessage('s2', 'T'), false);

  const letters = game._events.filter(e => e.event === 'ghostChatMessage').map(e => e.data.letter);
  assert.deepEqual(letters, ['R', 'S']);
  game.clearAllTimers();
});

run('only a raised ghost can whisper, not every corpse', () => {
  const game = makeGame();
  seatPlayers(game, ['Werewolf', 'Villager', 'Seer', 'Villager']);
  game.phase = 'day';
  game.assignments.p2.isDead = true;
  game.assignments.p3.isDead = true;
  game.ghosts = new Set(['p2']);

  assert.equal(game.handleGhostMessage('s2', 'A'), true, 'the ghost may speak');
  assert.equal(game.handleGhostMessage('s3', 'B'), false, 'an ordinary corpse may not');
  assert.equal(game.handleGhostMessage('s4', 'C'), false, 'and the living certainly may not');
  game.clearAllTimers();
});

run('ghosts stay silent outside the day phases', () => {
  const game = makeGame();
  seatPlayers(game, ['Werewolf', 'Villager', 'Seer']);
  game.assignments.p2.isDead = true;
  game.ghosts = new Set(['p2']);

  game.phase = 'night';
  assert.equal(game.handleGhostMessage('s2', 'A'), false);
  game.phase = 'trial';
  assert.equal(game.handleGhostMessage('s2', 'A'), true);
  game.clearAllTimers();
});

run('only the first character of a submission is carried', () => {
  const game = makeGame();
  seatPlayers(game, ['Werewolf', 'Villager', 'Seer']);
  game.phase = 'day';
  game.assignments.p2.isDead = true;
  game.ghosts = new Set(['p2']);

  assert.equal(game.handleGhostMessage('s2', 'WEREWOLF IS BOB'), true);
  const msg = game._events.filter(e => e.event === 'ghostChatMessage').pop();
  assert.equal(msg.data.letter, 'W');
  game.clearAllTimers();
});

run('deaths roll independently for the ghost chance', () => {
  const game = makeGame();
  seatPlayers(game, ['Werewolf', 'Villager', 'Seer', 'Villager']);
  game.phase = 'night';

  const original = Math.random;
  // A roll under the threshold raises a ghost; one over it does not.
  Math.random = () => 0.05;
  assert.equal(game.maybeRaiseGhost('p2'), true);
  Math.random = () => 0.5;
  assert.equal(game.maybeRaiseGhost('p3'), false);
  // The same player never raises twice.
  Math.random = () => 0.05;
  assert.equal(game.maybeRaiseGhost('p2'), false);
  Math.random = original;

  assert.deepEqual([...game.ghosts], ['p2']);
  game.clearAllTimers();
});

run('ghost state reaches the client without leaking the roll', () => {
  const game = makeGame();
  seatPlayers(game, ['Werewolf', 'Villager', 'Seer']);
  game.phase = 'day';
  game.assignments.p2.isDead = true;
  game.ghosts = new Set(['p2']);

  const ghost = game.getSanitizedState('s2').ghostInfo;
  assert.equal(ghost.isGhost, true);
  assert.equal(ghost.canSpeak, true);
  assert.equal(ghost.letterSpent, false);

  game.handleGhostMessage('s2', 'Z');
  const spent = game.getSanitizedState('s2').ghostInfo;
  assert.equal(spent.canSpeak, true, 'still a ghost');
  assert.equal(spent.letterSpent, true, 'but out of letters today');

  const living = game.getSanitizedState('s1').ghostInfo;
  assert.equal(living.isGhost, false);
  assert.equal(living.canSpeak, false);
  game.clearAllTimers();
});

// ── Role coverage ─────────────────────────────────────────────────────

run('the retired Ghost card cannot be dealt', () => {
  const game = makeGame();
  game.addPlayer('p1', 's1', 'A');
  game.addPlayer('p2', 's2', 'B');
  game.addPlayer('p3', 's3', 'C');

  // Lingering is rolled for on death, never dealt — a Ghost card would be art
  // and a name with no behaviour behind it.
  game.updateSettings('s1', { deck: ['Ghost', 'Werewolf', 'Seer'] });
  assert.equal(game.settings.deck.includes('Ghost'), false);
});

run('Wolf Cub and Lone Wolf hunt with the pack rather than waking alone', () => {
  const game = makeGame();
  seatPlayers(game, ['Wolf Cub', 'Lone Wolf', 'Villager', 'Seer', 'Villager']);
  game.dayCount = 2;
  game.startNight();
  game.clearAllTimers();

  // Neither gets a wake of its own; a separate phase only bought them an empty
  // turn on top of the hunt they already join.
  assert.equal(game.nightQueue.includes('Wolf Cub'), false);
  assert.equal(game.nightQueue.includes('Lone Wolf'), false);

  // But both are still woken by the Werewolf phase.
  assert.equal(game.getActorRoleFor('p1', 'Werewolf'), 'Werewolf');
  assert.equal(game.getActorRoleFor('p2', 'Werewolf'), 'Werewolf');
  game.clearAllTimers();
});

run('every waking role in the deck has real behaviour behind it', () => {
  // Roles falling through to the generic acknowledgement are the ones with a
  // card and a name but nothing to do.
  const wakers = ['Seer', 'Robber', 'Troublemaker', 'Witch', 'Priest', 'Bodyguard',
    'Jailer', 'Cupid', 'Spellcaster', 'Old Hag', 'Vampire', 'Cult Leader', 'Disruptor',
    'The Reflector', 'Yandere', 'Cthulhu', 'Alpha Wolf', 'Mystic Wolf',
    'Aura Seer', 'Private Investigator', 'Apprentice Seer', 'Revealer', 'Village Idiot',
    'Drunk', 'Insomniac', 'Sentinel', 'Curator', 'Sorceress', 'Minion', 'Squire', 'Mason',
    'Doppelganger', 'Paranormal Investigator'];
  const src = require('node:fs').readFileSync(`${__dirname}/gameEngine.js`, 'utf8');
  const start = src.indexOf('handleNightAction(socketId');
  const body = src.slice(start, src.indexOf('resolveDawnKills()', start));
  const handled = new Set([...body.matchAll(/case '([^']+)':/g)].map(m => m[1]));

  const orphans = wakers.filter(r => !handled.has(r));
  assert.deepEqual(orphans, [], `roles waking with no action: ${orphans.join(', ')}`);
});
