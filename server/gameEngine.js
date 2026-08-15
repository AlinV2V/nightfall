const WAKE_ORDER = [
  'Doppelganger',
  'Sentinel',
  'Cupid',
  'Curator',
  'Yandere',        // First night: picks obsession; subsequent nights: activates shield
  'The Reflector',  // Wakes BEFORE Disruptor + wolves so the mirror catches every later action
  'Disruptor',      // Each night: nullifies a player's night action
  'Jailer',
  'Priest',
  'Bodyguard',
  'Cthulhu',        // Once per game: picks a player to become crazed
  'Werewolf',
  'Alpha Wolf',
  'Mystic Wolf',
  'Wolf Cub',
  'Lone Wolf',
  'Minion',
  'Sorceress',
  'Mason',
  'Seer',
  'Apprentice Seer',
  'Aura Seer',
  'Private Investigator',
  'Paranormal Investigator',
  'Witch',
  'Spellcaster',
  'Old Hag',
  'Vampire',
  'Cult Leader',
  'Robber',
  'Troublemaker',
  'Village Idiot',
  'Drunk',
  'Insomniac',
  'Revealer',
  'Squire',
];

const NO_WAKE_ROLES = new Set([
  'Villager',
  'Hunter',
  'Tanner',
  'Prince',
  'Dream Wolf',
  'Wolverine',
  'Cursed',
  'Diseased',
  'Tough Guy',
  // Ghost removed as a starting role — every dead player now becomes a ghost-chat
  // participant. See canUseGhostChat() for the new logic.
  'Family Man',
  'Windy Wendy',
  'Defender-er',
  'The Sponge',
  'Ricochet Rhino',
  'Innocent Bystander',
  'Mayor',
  'Pacifist',
  'Lycan',
  'Village Idiot',
  'Mad Bomber',      // Passive — triggers on death, no night wake
  'Dawn Bringer',    // Day ability — no night wake
]);

const FIRST_NIGHT_ONLY_WAKE_ROLES = new Set([
  'Doppelganger',
  'Sentinel',
  'Cupid',
  'Curator',
  'Alpha Wolf',
  'Minion',
  'Mason',
  'Mystic Wolf',
  'Paranormal Investigator',
  'Robber',
  'Insomniac',
  'Revealer',
  'Squire',
  'Village Idiot', // One-shot rotation on Night 1 only — otherwise the game becomes
                   // chaotic and roles never settle.
]);

const THIRD_NIGHT_ONLY_WAKE_ROLES = new Set(['Drunk']);

const WEREWOLF_ROLES = new Set(['Werewolf', 'Alpha Wolf', 'Mystic Wolf', 'Dream Wolf', 'Wolverine', 'Wolf Cub', 'Lone Wolf']);
const WEREWOLF_WAKE_ROLES = new Set(['Werewolf', 'Alpha Wolf', 'Mystic Wolf', 'Wolverine', 'Wolf Cub', 'Lone Wolf']);
const WOLF_SUPPORT_ROLES = new Set(['Minion', 'Squire', 'Sorceress']);
const SKIP_VOTE = '__SKIP_VOTE__';
const SERVER_DECK_PRESETS = new Set(['auto', 'alin', 'custom']);
const ALIN_WOLF_ROLES = ['Werewolf', 'Alpha Wolf', 'Mystic Wolf', 'Wolverine'];
const ALIN_DETECTION_ROLES = ['Seer', 'Aura Seer', 'Private Investigator', 'Apprentice Seer'];
const ALIN_VILLAGE_POWER_ROLES = ['Robber', 'Troublemaker', 'Witch', 'Drunk', 'Insomniac', 'Village Idiot', 'Revealer'];
const ALIN_VILLAGE_WILD_ROLES = ['Hunter', 'Mayor', 'Prince', 'Pacifist', 'Mason', 'Lycan', 'Villager'];
const ALIN_CENTER_CARDS = ['Villager', 'Tanner', 'Villager'];
const ALIN_NEUTRAL_ROLES = ['Tanner'];
const GOOD_POWER_ROLES = [
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
];
const NEUTRAL_ROLES = ['Tanner', 'Disruptor', 'Yandere', 'Cthulhu'];

// Reference table (actual distribution is driven by getDefaultDeck, not this constant)
const DEFAULT_PLAYER_ROLE_PRESETS = {
  //       wolves  det  prot  neutral  solo  passive/other
  3:  { wolves: 1, detection: 1, protector: 1, neutrals: 0, solos: 0 },
  4:  { wolves: 1, detection: 1, protector: 1, neutrals: 0, solos: 0 },
  5:  { wolves: 1, detection: 1, protector: 1, neutrals: 1, solos: 0 }, // 50% neutral or solo
  6:  { wolves: 1, detection: 1, protector: 1, neutrals: 1, solos: 1 },
  7:  { wolves: 2, detection: 1, protector: 1, neutrals: 1, solos: 1 },
  8:  { wolves: 2, detection: 2, protector: 1, neutrals: 1, solos: 1 },
  9:  { wolves: 2, detection: 2, protector: 2, neutrals: 1, solos: 1 },
  10: { wolves: 2, detection: 2, protector: 2, neutrals: 1, solos: 1 },
};

const DEFAULT_CENTER_CARDS = ['Villager', 'Tanner', 'Villager'];

const SUPPORTED_ROLES = new Set([
  'Doppelganger',
  'Werewolf',
  'Wolverine',
  'Minion',
  'Sorceress',
  'Mason',
  'Seer',
  'Aura Seer',
  'Private Investigator',
  'Robber',
  'Troublemaker',
  'Drunk',
  'Insomniac',
  'Villager',
  'Hunter',
  'Tanner',
  'Sentinel',
  'Alpha Wolf',
  'Mystic Wolf',
  'Apprentice Seer',
  'Paranormal Investigator',
  'Witch',
  'Village Idiot',
  'Revealer',
  'Bodyguard',
  'Dream Wolf',
  'Squire',
  'Priest',
  'Jailer',
  'Prince',
  'Mayor',
  'Pacifist',
  'Lycan',
  // GPT-Roles additions
  'Cupid',
  'Cursed',
  'Cult Leader',
  'Diseased',
  // 'Ghost' is no longer a deck role — the ghost-chat ability now triggers on death
  // for every player (see canUseGhostChat).
  'Lone Wolf',
  'Old Hag',
  'Spellcaster',
  'Tough Guy',
  'Vampire',
  'Wolf Cub',
  'Curator',
  // New roles from card images
  'Dawn Bringer',
  'Disruptor',
  'Mad Bomber',
  'The Reflector',
  'Yandere',
  'Cthulhu',
]);

const clampNumber = (value, fallback, min, max) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

// A player reading a reveal result holds the night queue open until they hit
// Continue. That wait is generous but must always be bounded — otherwise a
// closed tab or an AFK player freezes the whole room in the night phase.
const NIGHT_REVIEW_GRACE_MS = 25000;

// Phases in which an accusation is live. Outside these the accused id is stale
// bookkeeping and is withheld from the client.
const ACCUSED_VISIBLE_PHASES = new Set(['accusation', 'defense', 'trial', 'end']);

class GameEngine {
  constructor(roomId, roomIo, rawIo) {
    this.roomId = roomId;
    this.roomIo = roomIo;
    this.rawIo = rawIo;
    this.players = [];
    this.phase = 'lobby';

    this.settings = {
      enableVillagerChat: false,
      discussionLength: 300,
      nightActionTime: 15,
      accusationLength: 60,
      defenseLength: 60,
      trialLength: 30,
      firstNightKill: true,
      executionScenes: ['tentacles', 'cthulhu_abyss', 'thunder', 'void', 'bees', 'bees_v2'],
      deckPreset: 'auto',
      deck: [],
    };

    this.timer = null;
    this.dealTimer = null;
    this.locked = false;

    // ── Bot infrastructure (host-only test mode) ──
    this.botCounter = 0;
    this.botTimers = new Set();
    this.botDebugLog = []; // [{ time, bot, role, action, detail }]
    this.botDebugMax = 200;

    this.resetGameState();
  }

  // ──────────────────────────────────────────────────────────
  // STATE LIFECYCLE
  //
  // Every field scoped to a night, a day, or a game is declared and cleared in
  // exactly one place below. New roles add their field to the matching reset and
  // are then correct everywhere — the constructor, "play again", and a session
  // collapsing back to the lobby all funnel through these.
  // ──────────────────────────────────────────────────────────

  // Cleared at the start of every night.
  resetNightState() {
    this.currentNightAction = null;
    this.currentNightActors = [];
    this.nightActionsReceived = {};
    this.pendingNightResultAcks = {};
    this.wwKillVotes = {};
    this.werewolfKillTarget = null;
    this.protectedPlayers = [];
    this.bodyguardGuards = new Map();
    this.jailedTargets = new Set();
    this.sentinelShielded = null;
    this.witchKills = [];
    this.witchProtectedTargets = new Set();
    this.troublemakerKills = [];
    this.disruptorTarget = {};   // {pid: targetId} — per night Disruptor target
    this.reflectorTarget = {};   // {pid: targetId} — The Reflector mirror target
    this.yandereActiveShield = {}; // {pid: obsId} — active shield this night
    // Cthulhu madness carries night → day, then resets at the next nightfall.
    this.cthulhuCrazed = {};     // {targetId: word} — crazed players and their forced word

    // ── Jailer chat state ──
    this.jailerChatActive = false;
    this.jailerActorId = null;
    this.jailerTargetId = null;
    this.jailerChatMessages = [];
    this.jailerChatExpiresAt = null;
    this.jailedPlayerId = null;
    if (this.jailerChatTimer) {
      clearTimeout(this.jailerChatTimer);
    }
    this.jailerChatTimer = null;
  }

  // Day-long carry-overs. These are applied during the day they were set and
  // expire at the following nightfall, so they clear alongside the night reset.
  resetDayState() {
    this.silencedNextDay = new Set(); // Spellcaster targets — cannot speak day chat
    this.banishedNextDay = new Set(); // Old Hag targets — cannot speak or vote
  }

  // Vote bookkeeping for one day/trial cycle.
  resetVoteState() {
    this.accusationVotes = {};
    this.trialVotes = {};
    this.accusedId = null;
  }

  // Full per-game reset. Leaves identity, seating, settings and bot plumbing alone.
  resetGameState() {
    this.roles = [];
    this.assignments = {};
    this.centerCards = [];
    this.alphaWolfCard = null;
    this.revealedCards = {};
    this.eventLog = [];
    this.dayCount = 1;
    this.nightQueue = [];
    this.timeLeft = 0;
    this.phaseEndsAt = null;
    this.winner = null;

    this.cupidLinks = {};                 // {playerId -> partnerId}
    this.cultMembers = new Set();         // Cult Leader cult roster
    this.cultLeaderId = null;             // Tracked for cult-win check
    this.vampireMarks = {};               // {markedTargetId -> vampireId} (active mark)
    this.accusationCounts = {};           // {playerId -> total accusations received}
    this.toughGuyHit = new Set();         // Tough Guys who took a wolf hit (die next night)
    this.wolfCubExtraKill = false;        // Set when Wolf Cub eliminated; doubles next wolf kill
    this.wolfCubPendingExtraKill = false; // Set when Wolf Cub dies; promotes at next night start
    this.wolvesSkipNextNight = false;     // Set when Diseased dies to wolves
    this.wolvesSkippingThisNight = false; // Active wolves skip status for current night
    this.dawnBringerUsed = {};            // {pid: bool} — Dawn Bringer declaration used
    this.dawnBringerDeclared = false;     // True when Dawn Bringer cancelled next night
    this.yanderObs = {};                  // {pid: obsId} — Yandere obsession target
    this.yandereUsed = {};                // {pid: uses} — activations spent (max 3)
    // Ghost-chat is a death-conferred ability for any player — no per-deck flag.

    this.resetNightState();
    this.resetDayState();
    this.resetVoteState();
  }

  // ──────────────────────────────────────────────────────────
  // BOT INFRASTRUCTURE
  // ──────────────────────────────────────────────────────────

  isBotPlayer(player) {
    return !!(player && player.isBot);
  }

  isBotById(playerId) {
    const p = this.players.find(x => x.id === playerId);
    return this.isBotPlayer(p);
  }

  getBotSocketId(playerId) {
    return `bot:${playerId}`;
  }

  getHostSocketId() {
    const host = this.players.find(p => p.isHost && p.connected && !p.isBot);
    return host ? host.socketId : null;
  }

  hasBots() {
    return this.players.some(p => p.isBot);
  }

  countBots() {
    return this.players.filter(p => p.isBot).length;
  }

  logBotEvent(bot, role, action, detail) {
    this.botDebugLog.push({
      time: Date.now(),
      day: this.dayCount,
      phase: this.phase,
      bot,
      role: role || 'n/a',
      action,
      detail: detail || '',
    });
    if (this.botDebugLog.length > this.botDebugMax) {
      this.botDebugLog.splice(0, this.botDebugLog.length - this.botDebugMax);
    }
  }

  scheduleBotTimer(fn, delay) {
    const id = setTimeout(() => {
      this.botTimers.delete(id);
      try { fn(); } catch (err) { console.error('[bot]', err); }
    }, delay);
    this.botTimers.add(id);
    return id;
  }

  clearBotTimers() {
    for (const id of this.botTimers) clearTimeout(id);
    this.botTimers.clear();
  }

  addBot(socketId) {
    const requester = this.players.find(p => p.socketId === socketId);
    if (!requester || !requester.isHost || (this.phase !== 'lobby' && this.phase !== 'end')) return;
    if (this.players.length >= 12) return;
    this.botCounter += 1;
    const id = `bot-${this.roomId}-${this.botCounter}`;
    const name = `Bot ${this.botCounter}`;
    this.players.push({
      id,
      socketId: this.getBotSocketId(id),
      name,
      isHost: false,
      connected: true,
      isBot: true,
    });
    this.logBotEvent(name, null, 'spawn', 'Joined the room as a bot.');
    this.broadcastState();
  }

  removeBot(socketId, botId = null) {
    const requester = this.players.find(p => p.socketId === socketId);
    if (!requester || !requester.isHost || (this.phase !== 'lobby' && this.phase !== 'end')) return;
    let target;
    if (botId) {
      target = this.players.find(p => p.isBot && p.id === botId);
    } else {
      // Remove most recently added bot
      const bots = this.players.filter(p => p.isBot);
      target = bots[bots.length - 1];
    }
    if (!target) return;
    this.players = this.players.filter(p => p.id !== target.id);
    this.logBotEvent(target.name, null, 'remove', 'Removed by host.');
    this.broadcastState();
  }

  toggleLock(socketId) {
    const requester = this.players.find(p => p.socketId === socketId);
    if (!requester || !requester.isHost) return;
    this.locked = !this.locked;
    this.logEvent(`The lobby has been ${this.locked ? 'locked' : 'unlocked'} by the host.`);
    this.broadcastState();
  }

  kickPlayer(socketId, targetPlayerId) {
    const requester = this.players.find(p => p.socketId === socketId);
    if (!requester || !requester.isHost) return;

    const target = this.players.find(p => p.id === targetPlayerId);
    if (!target || target.isHost) return; // cannot kick host

    // Remove player
    this.players = this.players.filter(p => p.id !== targetPlayerId);

    // Send kicked event to the specific client
    this.emitTo(target.socketId, 'kicked');

    this.logEvent(`${target.name} was kicked by the host.`);
    this.logBotEvent(target.name, null, 'kick', 'Kicked by host.');
    this.broadcastState();
  }

  endSessionBecauseHostLeft(hostId = null) {
    const removedBots = this.players.filter(p => p.isBot).length;

    this.clearAllTimers();
    this.players = this.players.filter(p => !p.isBot && (!hostId || p.id !== hostId));
    this.players.forEach(p => { p.isHost = false; });
    const nextHost = this.players.find(p => p.connected && !p.isBot);
    if (nextHost) nextHost.isHost = true;

    this.phase = 'lobby';
    this.locked = false;
    this.botCounter = 0;
    this.resetGameState();

    this.logBotEvent('System', 'HostLeave', 'session_end',
      `Host left; removed ${removedBots} bot${removedBots === 1 ? '' : 's'} and reset to lobby.`);
    this.logEvent('The host left. The session ended and bots were removed.');
    this.broadcastState();
  }

  clearBotDebugLog(socketId) {
    const requester = this.players.find(p => p.socketId === socketId);
    if (!requester || !requester.isHost) return;
    this.botDebugLog = [];
    this.broadcastState();
  }

  pickRandom(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  pickRandomTwo(arr) {
    if (!arr || arr.length < 2) return [arr?.[0] || null, null];
    const copy = [...arr];
    const a = copy.splice(Math.floor(Math.random() * copy.length), 1)[0];
    const b = copy.splice(Math.floor(Math.random() * copy.length), 1)[0];
    return [a, b];
  }

  buildBotNightDecision(botId, role) {
    // Returns { type, target1?, target2? } or null when no action is needed.
    const livingOthers = this.players
      .filter(p => p.id !== botId && this.assignments[p.id] && !this.assignments[p.id].isDead)
      .map(p => p.id);
    const livingAll = this.players
      .filter(p => this.assignments[p.id] && !this.assignments[p.id].isDead)
      .map(p => p.id);

    switch (role) {
      case 'Werewolf':
      case 'Wolverine':
      case 'Alpha Wolf':
      case 'Mystic Wolf':
      case 'Dream Wolf':
      case 'Wolf Cub':
      case 'Lone Wolf': {
        if (!this.shouldWerewolvesHuntNow()) {
          return { type: 'view' };
        }
        const wolves = new Set(this.getNightWerewolfIds());
        const nonWolves = livingOthers.filter(id => !wolves.has(id));
        const target = this.pickRandom(nonWolves.length > 0 ? nonWolves : livingOthers);
        return target ? { type: 'kill', target1: target } : { type: 'view' };
      }
      case 'Sentinel':
      case 'Bodyguard': {
        const target = this.pickRandom(livingOthers);
        return target ? { type: 'protect', target1: target } : null;
      }
      case 'Priest': {
        const used = this.assignments[botId]?.priestUsed;
        if (used || Math.random() < 0.55) return { type: 'skip' };
        const target = this.pickRandom(livingAll);
        return target ? { type: 'protect', target1: target } : { type: 'skip' };
      }
      case 'Jailer': {
        const target = this.pickRandom(livingAll);
        return target ? { type: 'protect', target1: target } : null;
      }
      case 'Seer': {
        const target = this.pickRandom(livingOthers);
        return target ? { type: 'player', target1: target } : null;
      }
      case 'Aura Seer':
      case 'Private Investigator':
      case 'Sorceress': {
        const target = this.pickRandom(livingOthers);
        return target ? { type: 'player', target1: target } : null;
      }
      case 'Apprentice Seer': {
        const target = this.pickRandom(livingOthers);
        return target ? { type: 'player', target1: target } : null;
      }
      case 'Curator': {
        const target = this.pickRandom(livingAll);
        return target ? { type: 'player', target1: target } : null;
      }
      case 'Robber': {
        const target = this.pickRandom(livingOthers);
        return target ? { type: 'rob', target1: target } : { type: 'skip' };
      }
      case 'Troublemaker': {
        const used = this.assignments[botId]?.troublemakerUsed;
        if (used || Math.random() < 0.6) return { type: 'skip' };
        const target = this.pickRandom(livingOthers);
        return target ? { type: 'call', target1: target } : { type: 'skip' };
      }
      case 'Drunk': {
        return { type: 'reveal' };
      }
      case 'Insomniac':
      case 'Mason':
      case 'Minion':
      case 'Squire': {
        return { type: 'view' };
      }
      case 'Doppelganger': {
        const target = this.pickRandom(livingOthers);
        return target ? { type: 'doppel', target1: target } : null;
      }
      case 'Paranormal Investigator': {
        const target = this.pickRandom(livingOthers);
        return target ? { type: 'investigate', target1: target } : null;
      }
      case 'Witch': {
        const center = this.pickRandom([0, 1, 2]);
        const target = this.pickRandom(livingOthers);
        return target != null ? { type: 'center', target1: center, target2: target } : null;
      }
      case 'Village Idiot': {
        return { type: Math.random() < 0.5 ? 'left' : 'right' };
      }
      case 'Revealer': {
        const target = this.pickRandom(livingOthers);
        return target ? { type: 'reveal', target1: target } : null;
      }
      case 'Cupid': {
        const [a, b] = this.pickRandomTwo(livingOthers);
        return a && b ? { type: 'link', target1: a, target2: b } : null;
      }
      case 'Spellcaster':
      case 'Old Hag':
      case 'Vampire': {
        const target = this.pickRandom(livingOthers);
        return target ? { type: 'player', target1: target } : null;
      }
      case 'Cult Leader': {
        // Bias toward recruiting players not yet in the cult.
        const nonMembers = livingOthers.filter(id => !this.cultMembers.has(id));
        const target = this.pickRandom(nonMembers.length > 0 ? nonMembers : livingOthers);
        return target ? { type: 'recruit', target1: target } : null;
      }
      case 'Yandere': {
        if (this.dayCount === 1) {
          // Night 1: pick a random other living player as the obsession.
          const target = this.pickRandom(livingOthers);
          return target ? { type: 'player', target1: target } : null;
        }
        // Subsequent nights: 60% chance to activate the shield if obsession is alive.
        const obs = this.yanderObs[botId];
        const usesLeft = 3 - (this.yandereUsed[botId] || 0);
        if (obs && this.hasLiveAssignment(obs) && usesLeft > 0 && Math.random() < 0.6) {
          return { type: 'player', target1: 'activate' };
        }
        return { type: 'player', target1: 'pass' };
      }
      case 'Disruptor': {
        const target = this.pickRandom(livingOthers);
        return target ? { type: 'player', target1: target } : null;
      }
      case 'The Reflector': {
        const target = this.pickRandom(livingOthers);
        return target ? { type: 'player', target1: target } : null;
      }
      case 'Cthulhu': {
        // Once per game; if already used, the queue filter will skip — defensive idle here.
        if (this.assignments[botId]?.cthulhuUsed) return { type: 'skip' };
        const target = this.pickRandom(livingOthers);
        const words = ['CTHULHU', 'IA', 'RLYEH', 'TENTACLE', 'DOOM'];
        const word = words[Math.floor(Math.random() * words.length)];
        return target ? { type: 'player', target1: target, target2: word } : null;
      }
      case 'Dawn Bringer': {
        // No night action — Dawn Bringer's ability fires only during the day.
        return null;
      }
      case 'Mad Bomber': {
        // Passive — never wakes.
        return null;
      }
      default:
        return null;
    }
  }

  scheduleBotNightActions() {
    if (!this.currentNightAction) return;
    const role = this.currentNightAction;
    const actors = this.getActiveActors(role);
    const botActors = actors.filter(id => this.isBotById(id));
    if (botActors.length === 0) return;

    // Coordinate wolf-pack bots on a single shared target so the kill
    // actually lands instead of splitting across random victims.
    let packTarget = null;
    if (role === 'Werewolf' && this.shouldWerewolvesHuntNow()) {
      const wolves = new Set(this.getNightWerewolfIds());
      const livingNonWolves = this.players
        .filter(p => this.assignments[p.id]
          && !this.assignments[p.id].isDead
          && !wolves.has(p.id))
        .map(p => p.id);
      packTarget = this.pickRandom(livingNonWolves);
      if (packTarget && botActors.length > 0) {
        const targetName = this.getPlayerName(packTarget);
        this.logBotEvent('Pack', 'Werewolf', 'plan', `Wolves coordinated on ${targetName}.`);
      }
    }

    botActors.forEach((botId, idx) => {
      const baseDelay = 1200 + idx * 700 + Math.floor(Math.random() * 400);
      this.scheduleBotTimer(() => {
        if (this.phase !== 'night') return;
        if (this.currentNightAction !== role) return;
        if (this.nightActionsReceived[botId]) return;
        let decision;
        if (role === 'Werewolf' && packTarget && this.hasLiveAssignment(packTarget)) {
          decision = { type: 'kill', target1: packTarget };
        } else {
          decision = this.buildBotNightDecision(botId, role);
        }
        const bot = this.players.find(p => p.id === botId);
        if (!bot) return;
        if (!decision) {
          // Mark as completed without doing anything (shouldn't normally happen)
          const actorsNow = this.getActiveActors(role).map(id => this.getPlayerName(id)).join(', ') || 'none';
          this.logBotEvent(bot.name, role, 'idle-complete',
            `No valid decision available; auto-completed. Active actors now: [${actorsNow}].`);
          this.finishNightAction(botId);
          this.broadcastState();
          return;
        }
        const detail = this.describeBotDecision(decision);
        this.logBotEvent(bot.name, role, decision.type, detail);
        this.handleNightAction(bot.socketId, decision);
      }, baseDelay);
    });
  }

  describeBotDecision(decision) {
    if (!decision) return '';
    const targetName = (id) => this.getPlayerName(id) || id;
    const parts = [`type=${decision.type}`];
    if (decision.target1 != null && typeof decision.target1 === 'string') {
      parts.push(`target1=${targetName(decision.target1)}`);
    } else if (decision.target1 != null) {
      parts.push(`target1=center#${decision.target1}`);
    }
    if (decision.target2 != null && typeof decision.target2 === 'string') {
      parts.push(`target2=${targetName(decision.target2)}`);
    } else if (decision.target2 != null) {
      parts.push(`target2=center#${decision.target2}`);
    }
    return parts.join(' ');
  }

  // --- Helpers ---
  emitTo(socketId, event, data) {
    this.rawIo.to(socketId).emit(event, data);
  }

  nightResultNeedsContinue(payload) {
    if (!payload || payload.type === 'error') return false;
    return new Set([
      'wolfView',
      'masonView',
      'playerView',
      'seerFactionResult',
      'centerView',
      'auraResult',
      'privateInvestigatorResult',
      'sorceressResult',
      'robberResult',
      'insomniacResult',
      'revealerResult',
    ]).has(payload.type);
  }

  hasPendingNightResultAck(playerId) {
    return !!(playerId && this.pendingNightResultAcks[playerId]);
  }

  // A night actor can only be waited on while they are able to answer. Bots always
  // can; humans stop counting the moment they drop.
  isNightActorResponsive(playerId) {
    const p = this.players.find(x => x.id === playerId);
    return !!(p && (p.connected || p.isBot));
  }

  // The set of actors the current night phase is still legitimately waiting on.
  getPendingNightActors() {
    const actors = this.currentNightActors.length > 0
      ? this.currentNightActors
      : this.getActiveActors(this.currentNightAction);
    return actors.filter(id => !this.nightActionsReceived[id] && this.isNightActorResponsive(id));
  }

  // Bounded window for reviewing a reveal result before the night moves on itself.
  armNightReviewTimer() {
    this.clearTimer();
    if (this.phase !== 'night') return;
    this.timeLeft = Math.ceil(NIGHT_REVIEW_GRACE_MS / 1000);
    this.phaseEndsAt = Date.now() + NIGHT_REVIEW_GRACE_MS;
    this.timer = setTimeout(() => this.forceResolveNightReview(), NIGHT_REVIEW_GRACE_MS);
  }

  // Review window expired: auto-acknowledge everything still outstanding and advance.
  forceResolveNightReview() {
    if (this.phase !== 'night') return;
    Object.keys(this.pendingNightResultAcks).forEach((pid) => {
      delete this.pendingNightResultAcks[pid];
      this.nightActionsReceived[pid] = true;
      this.logBotEvent(this.getPlayerName(pid) || pid, this.currentNightAction, 'auto-continue',
        'Review window expired; the night advanced on its own.');
    });
    this.clearTimer();
    this.nextNightAction();
  }

  // A player left mid-review. Release the hold they have on the night queue so the
  // room keeps moving, and advance immediately if they were the last one pending.
  releaseNightHold(playerId) {
    if (this.phase !== 'night' || !this.hasPendingNightResultAck(playerId)) return false;
    delete this.pendingNightResultAcks[playerId];
    this.nightActionsReceived[playerId] = true;
    this.logBotEvent(this.getPlayerName(playerId) || playerId, this.currentNightAction,
      'released', 'Left while reviewing; night hold released.');
    if (this.getPendingNightActors().length === 0) {
      this.clearTimer();
      this.timer = setTimeout(() => this.nextNightAction(), 500);
    }
    return true;
  }

  shouldWaitForNightResultAck(actor, payload) {
    return !!(
      actor
      && this.phase === 'night'
      && this.currentNightAction
      && this.nightResultNeedsContinue(payload)
      && !this.nightActionsReceived[actor.id]
    );
  }

  scheduleBotNightResultAck(playerId) {
    const bot = this.players.find(p => p.id === playerId);
    if (!bot || !bot.isBot) return;
    this.scheduleBotTimer(() => {
      if (this.phase !== 'night') return;
      if (!this.hasPendingNightResultAck(playerId)) return;
      this.logBotEvent(bot.name, this.currentNightAction, 'continue', 'Auto-acknowledged night result.');
      this.acknowledgeNightResult(bot.socketId);
    }, 900 + Math.floor(Math.random() * 500));
  }

  emitActionResult(socketId, payload) {
    const actor = this.players.find(p => p.socketId === socketId);
    const requiresContinue = this.shouldWaitForNightResultAck(actor, payload);
    const outbound = requiresContinue
      ? { ...payload, requiresContinue: true }
      : payload;

    if (requiresContinue && actor) {
      this.pendingNightResultAcks[actor.id] = {
        role: this.currentNightAction,
        type: payload.type,
        ts: Date.now(),
      };
      // Swap the phase timer for a bounded review window rather than dropping the
      // timer entirely — the night must never depend solely on a click that may
      // never arrive.
      this.armNightReviewTimer();
      this.scheduleBotNightResultAck(actor.id);
    }

    this.emitTo(socketId, 'actionResult', outbound);
    // Also log the outcome for the host's debug console.
    if (!actor) return;
    const role = this.assignments[actor.id]?.currentRole || this.assignments[actor.id]?.originalRole || '?';
    const detail = this.summarizeActionResult(outbound);
    this.logBotEvent(actor.name, role, `result:${outbound.type}`, detail);
  }

  summarizeActionResult(r) {
    if (!r) return '';
    const playerName = (id) => this.getPlayerName(id) || id;
    switch (r.type) {
      case 'wolfView': {
        const list = (r.wolves || []).map(playerName).join(', ') || 'none';
        return `Saw werewolves: [${list}]${r.huntSkipped ? ' (hunt skipped)' : ''}`;
      }
      case 'masonView': {
        const list = (r.masons || []).map(playerName).join(', ') || 'none (alone)';
        return `Saw masons: [${list}]`;
      }
      case 'playerView':
        return `Saw ${playerName(r.target)} = ${r.role}`;
      case 'seerFactionResult':
        return `${playerName(r.target)} reads as ${r.faction}.`;
      case 'auraResult':
        return `${playerName(r.target)} is ${r.isSpecial ? 'a special role' : 'a basic Villager/Werewolf/Lycan result'}`;
      case 'privateInvestigatorResult':
        return `${playerName(r.target)} cluster ${r.hasWerewolf ? 'contains' : 'does not contain'} a werewolf result.`;
      case 'sorceressResult':
        return `${playerName(r.target)} is ${r.isSeer ? '' : 'not '}the Seer.`;
      case 'centerView':
        if (r.cards) {
          const labels = r.cards.map((card, i) => {
            const slot = Array.isArray(r.slots) && r.slots[i] != null ? r.slots[i] + 1 : i + 1;
            return `center#${slot}=${card}`;
          });
          return `Saw center cards: [${labels.join(', ')}]`;
        }
        return `Saw center#${r.slot != null ? r.slot + 1 : '?'}: ${r.card}`;
      case 'robberResult':
        return `Stole role; now ${r.newRole}`;
      case 'swapResult':
        return r.success ? 'Swapped two cards.' : 'Swap failed.';
      case 'protectResult':
        return r.jailed
          ? `Jailed ${playerName(r.target)} (no act/no kill).`
          : `Protected ${playerName(r.target)}${r.livesLeft != null ? ` (${r.livesLeft} bg lives)` : ''}.`;
      case 'drunkResult':
        return r.success ? 'Swapped own card with a center card (blind).' : 'Drunk swap failed.';
      case 'insomniacResult':
        return `Final role: ${r.role}`;
      case 'alphaResult':
        return r.success ? 'Alpha card placed (target turned wolf).' : 'Alpha could not place card.';
      case 'doppelgangerResult':
        return r.pending
          ? `Bound to ${playerName(r.target)}; role changes if they die.`
          : `Copied role: ${r.role}`;
      case 'bodyguardBlocked':
        return `Bodyguard intercepted an effect on ${playerName(r.target)}.`;
      case 'villageIdiotResult':
        return `Rotated cards ${r.direction}.`;
      case 'revealerResult':
        return r.blocked
          ? 'Revealer flipped a Werewolf/Tanner — card stayed hidden.'
          : `Revealed ${playerName(r.target)} = ${r.role}`;
      case 'shielded':
        return 'Action blocked by Sentinel shield.';
      case 'error':
        return `Error: ${r.message}`;
      case 'generic':
        return 'Action acknowledged.';
      default:
        return JSON.stringify(r);
    }
  }

  emitToRoom(event, data) {
    this.roomIo.emit(event, data);
  }

  emitTick() {
    this.emitToRoom('phaseTick', {
      phase: this.phase,
      timeLeft: this.timeLeft,
      phaseEndsAt: this.phaseEndsAt,
    });
  }

  // Phase countdowns are anchored to a wall-clock deadline rather than accumulated
  // from a per-second decrement, so a stalled event loop or a slow tick can't
  // silently stretch a phase past its configured length.
  startPhaseTimer(seconds, onExpire) {
    this.clearTimer();
    this.timeLeft = seconds;
    this.phaseEndsAt = Date.now() + seconds * 1000;
    this.timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((this.phaseEndsAt - Date.now()) / 1000));
      const changed = remaining !== this.timeLeft;
      this.timeLeft = remaining;
      if (changed) this.emitTick();
      if (remaining <= 0) {
        this.clearTimer();
        onExpire();
      }
    }, 250);
  }

  logEvent(text) {
    const message = { sender: 'System', text, ts: Date.now() };
    this.eventLog = [...this.eventLog, message].slice(-40);
    this.emitToRoom('chatMessage', message);
  }

  emitPrivateNotice(playerId, payload) {
    const socketId = this.getSocketId(playerId);
    if (!socketId) return;
    this.emitTo(socketId, 'privateNotice', {
      ts: Date.now(),
      ...payload,
    });
  }

  clearTimer() {
    if (this.timer) {
      clearTimeout(this.timer);
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  clearDealTimer() {
    if (this.dealTimer) {
      clearTimeout(this.dealTimer);
      this.dealTimer = null;
    }
  }

  clearAllTimers() {
    this.clearTimer();
    this.clearDealTimer();
    this.clearBotTimers();
    if (this.jailerChatTimer) {
      clearTimeout(this.jailerChatTimer);
      this.jailerChatTimer = null;
    }
  }

  getSocketId(playerId) {
    const p = this.players.find(x => x.id === playerId);
    return p ? p.socketId : null;
  }

  getPlayerName(playerId) {
    return this.players.find(p => p.id === playerId)?.name || 'Unknown';
  }

  isHostSocket(socketId) {
    return this.players.some(p => p.socketId === socketId && p.isHost && p.connected);
  }

  isWerewolfRole(role) {
    return WEREWOLF_ROLES.has(role);
  }

  isWolfSupportRole(role) {
    return WOLF_SUPPORT_ROLES.has(role);
  }

  isWolfTeamRole(role) {
    return this.isWerewolfRole(role) || this.isWolfSupportRole(role);
  }

  getVisibleRoleForInvestigation(playerId) {
    const role = this.assignments[playerId]?.currentRole;
    return role === 'Lycan' ? 'Werewolf' : role;
  }

  isWerewolfToInvestigators(playerId) {
    return this.isWerewolfRole(this.getVisibleRoleForInvestigation(playerId));
  }

  getAuraAlignment(playerId) {
    const role = this.assignments[playerId]?.currentRole;
    if (!role) return 'Unknown';

    if (role === 'Lycan') return 'Good';
    if (this.isWolfTeamRole(role)) return 'Evil';

    const neutralOrSolo = [
      'Tanner', 'Vampire', 'Cult Leader', 'Cthulhu', 'Disruptor', 'Yandere',
      'Old Hag', 'Spellcaster', 'Cupid', 'Doppelganger'
    ];
    if (neutralOrSolo.includes(role)) return 'Unknown';

    return 'Good';
  }

  getLivingSeatIds() {
    return this.players
      .filter(p => this.assignments[p.id] && !this.assignments[p.id].isDead)
      .map(p => p.id);
  }

  getNeighborIds(playerId) {
    const ids = this.getLivingSeatIds();
    const index = ids.indexOf(playerId);
    if (index === -1 || ids.length < 2) return [];
    if (ids.length === 2) return [ids[1 - index]];
    return [
      ids[(index - 1 + ids.length) % ids.length],
      ids[(index + 1) % ids.length],
    ];
  }

  isShielded(playerId) {
    return !!playerId && this.sentinelShielded === playerId;
  }

  isValidCenterIndex(index) {
    return Number.isInteger(index) && index >= 0 && index < this.centerCards.length;
  }

  hasLiveAssignment(playerId) {
    return !!this.assignments[playerId] && !this.assignments[playerId].isDead;
  }

  applyRoleChange(playerId, newRole) {
    const assignment = this.assignments[playerId];
    if (!assignment || !newRole) return;
    assignment.currentRole = newRole;
  }

  markPlayerDead(playerId, killedSet = null) {
    const assignment = this.assignments[playerId];
    if (!assignment || assignment.isDead) return false;
    assignment.isDead = true;
    this.revealedCards[playerId] = assignment.currentRole;
    if (killedSet) killedSet.add(playerId);
    this.resolveDoppelgangersForDeath(playerId);
    this.promoteApprenticeSeerOnSeerDeath(playerId);

    // Yandere obsession death: notify each Yandere whose obsession just fell.
    Object.entries(this.yanderObs || {}).forEach(([yandereId, obsId]) => {
      if (obsId !== playerId) return;
      if (yandereId === playerId) return; // Yandere themselves dying — no notice to a corpse
      if (!this.hasLiveAssignment(yandereId)) return;
      this.emitPrivateNotice(yandereId, {
        type: 'yandereObsessionLost',
        title: 'Your Obsession is Gone',
        message: `${this.getPlayerName(obsId)} has been taken from you. Your remaining shield activations will have no target.`,
      });
    });

    // Wolf Cub: wolves get a double kill the next night.
    if (assignment.currentRole === 'Wolf Cub') {
      this.wolfCubPendingExtraKill = true;
      this.logEvent('The fallen Wolf Cub enrages the pack. They will hunt twice the next night.');
    }

    // Mad Bomber: players to the left and right are also eliminated.
    // The bomb is wired into the body — even if the bomber was converted (e.g., Cursed → Werewolf,
    // or Robber swapped roles), their death still triggers the blast.
    if (assignment.originalRole === 'Mad Bomber' || assignment.currentRole === 'Mad Bomber') {
      const ids = this.players.filter(p => !this.assignments[p.id]?.isDead || p.id === playerId).map(p => p.id);
      const idx = ids.indexOf(playerId);
      if (idx !== -1) {
        const leftId = ids[(idx - 1 + ids.length) % ids.length];
        const rightId = ids[(idx + 1) % ids.length];
        this.logEvent(`The Mad Bomber's explosives go off! The blast catches those seated beside them.`);
        if (leftId && leftId !== playerId && this.hasLiveAssignment(leftId)) {
          this.markPlayerDead(leftId, killedSet);
          this.logEvent(`${this.getPlayerName(leftId)} was caught in the blast (left of Mad Bomber).`);
        }
        if (rightId && rightId !== playerId && rightId !== leftId && this.hasLiveAssignment(rightId)) {
          this.markPlayerDead(rightId, killedSet);
          this.logEvent(`${this.getPlayerName(rightId)} was caught in the blast (right of Mad Bomber).`);
        }
      }
    }

    // Cupid heartbreak death
    const partnerId = this.cupidLinks[playerId];
    if (partnerId && this.hasLiveAssignment(partnerId)) {
      this.markPlayerDead(partnerId, killedSet);
      this.logEvent(`${this.getPlayerName(partnerId)} died of heartbreak — they were linked by Cupid.`);
    }

    return true;
  }

  promoteApprenticeSeerOnSeerDeath(deadPlayerId) {
    const deadRole = this.assignments[deadPlayerId]?.currentRole;
    if (deadRole !== 'Seer') return;
    Object.entries(this.assignments).forEach(([playerId, assignment]) => {
      if (assignment.isDead) return;
      if (assignment.currentRole !== 'Apprentice Seer') return;
      this.applyRoleChange(playerId, 'Seer');
      this.logEvent(`The Apprentice Seer awakens — they have become the new Seer.`);
      this.emitPrivateNotice(playerId, {
        type: 'apprenticeSeer',
        title: 'You Are Now the Seer',
        message: `${this.getPlayerName(deadPlayerId)} (the Seer) has died. You inherit the Seer's gift.`,
      });
    });
  }

  resolveDoppelgangersForDeath(deadPlayerId) {
    const deadRole = this.assignments[deadPlayerId]?.currentRole;
    if (!deadRole) return;

    Object.entries(this.assignments).forEach(([playerId, assignment]) => {
      if (playerId === deadPlayerId) return;
      if (assignment.isDead) return;
      if (assignment.originalRole !== 'Doppelganger') return;
      if (assignment.doppelgangerTarget !== deadPlayerId) return;
      if (assignment.currentRole !== 'Doppelganger') return;

      this.applyRoleChange(playerId, deadRole);
      assignment.doppelgangerRole = deadRole;
      this.emitPrivateNotice(playerId, {
        type: 'doppelganger',
        title: 'Your Bond Awoke',
        message: `${this.getPlayerName(deadPlayerId)} died. You are now ${deadRole}.`,
      });
    });
  }

  // Bodyguard now uses the standard `protectedPlayers` list (cleared each
  // night). The 2-life absorption mechanic was removed to match the card text:
  // "Each night, choose a player who cannot be eliminated that night."
  absorbBodyguardLife() { return false; }
  absorbBodyguardGuard() { return false; }
  addBodyguardGuard() { /* no-op */ }

  blockProtectedEffect(socketId, ...targetIds) {
    for (const targetId of targetIds.filter(Boolean)) {
      if (this.isShielded(targetId)) {
        this.emitShielded(socketId);
        return true;
      }
      if (this.absorbBodyguardGuard(targetId, 'effect')) {
        this.emitActionResult(socketId, { type: 'bodyguardBlocked', target: targetId });
        return true;
      }
    }
    return false;
  }

  getSeatDistance(a, b) {
    const ids = this.getLivingSeatIds();
    const ai = ids.indexOf(a);
    const bi = ids.indexOf(b);
    if (ai === -1 || bi === -1) return Number.POSITIVE_INFINITY;
    const direct = Math.abs(ai - bi);
    return Math.min(direct, ids.length - direct);
  }

  maybeEmitWolverineWarning(targetId) {
    const wolves = this.getNightWerewolfIds();
    if (wolves.length === 0 || !targetId) return;
    let closest = null;
    let closestDistance = Number.POSITIVE_INFINITY;
    wolves.forEach((wolfId) => {
      const distance = this.getSeatDistance(wolfId, targetId);
      if (distance < closestDistance) {
        closest = wolfId;
        closestDistance = distance;
      }
    });

    const closestRole = this.assignments[closest]?.currentRole || this.assignments[closest]?.originalRole;
    if (closestRole !== 'Wolverine') return;

    const witnesses = this.getNeighborIds(targetId)
      .filter(id => this.hasLiveAssignment(id) && !this.isWolfTeamRole(this.assignments[id].currentRole));
    const recipient = witnesses[0] || (this.hasLiveAssignment(targetId) ? targetId : null);
    this.logEvent('A sharp metallic scrape echoed near the attack.');
    if (recipient) {
      this.emitPrivateNotice(recipient, {
        type: 'wolverine',
        title: 'Metallic Scrape',
        message: 'You heard a metallic scrape nearby during the attack.',
      });
    }
  }

  shouldWakeRole(role) {
    if (THIRD_NIGHT_ONLY_WAKE_ROLES.has(role)) return this.dayCount === 3;
    if (role === 'Apprentice Seer') {
      const seerAlive = this.players.some(p => {
        const a = this.assignments[p.id];
        return a && !a.isDead && a.currentRole === 'Seer';
      });
      return !seerAlive;
    }
    return this.dayCount === 1 || !FIRST_NIGHT_ONLY_WAKE_ROLES.has(role);
  }

  shouldWerewolvesHuntNow() {
    if (this.wolvesSkippingThisNight) return false;
    return this.dayCount > 1 || this.settings.firstNightKill;
  }

  // ── GPT-Roles helpers ──

  // Apply a wolf-kill to a single target, honoring Cursed/Tough Guy/Diseased/
  // Cupid-link/Bodyguard/protect/shield rules. Returns true if the target died
  // (so the caller can stop chaining), false otherwise. Outcomes are logged.
  resolveWolfKillOnTarget(targetId, killedSet) {
    if (!targetId || !this.hasLiveAssignment(targetId)) return false;
    const targetName = this.getPlayerName(targetId);
    const assignment = this.assignments[targetId];
    const role = assignment.currentRole;

    // The Reflector's mirror: any attacker targeting a mirrored player strikes themselves.
    // For the wolf pack — which has no single attacker — the bounce hits a random living wolf.
    if (this.isReflectorMirrored(targetId)) {
      const wolves = this.players
        .filter(p => p.id !== targetId
          && this.hasLiveAssignment(p.id)
          && this.isWerewolfWakeActor(this.assignments[p.id]))
        .map(p => p.id);
      const victim = this.pickRandom(wolves);
      if (victim) {
        const victimName = this.getPlayerName(victim);
        this.logEvent(`The Reflector's mirror flung the attack back — ${victimName} fell to the pack's own fangs.`);
        this.markPlayerDead(victim, killedSet);
      } else {
        this.logEvent(`The Reflector's mirror flashed — but the wolves vanished into the dark before it could strike them.`);
      }
      return false;
    }

    if (this.protectedPlayers.includes(targetId)) {
      this.logEvent(`The Werewolves attacked, but ${targetName} was protected.`);
      return false;
    }
    if (this.absorbBodyguardGuard(targetId, 'wolf')) return false;
    if (this.absorbBodyguardLife(targetId, 'wolf')) {
      this.maybeEmitWolverineWarning(targetId);
      return false;
    }

    // Cursed: instead of dying, becomes a Werewolf.
    if (role === 'Cursed') {
      this.applyRoleChange(targetId, 'Werewolf');
      this.logEvent(`The Werewolves bit ${targetName} — the Cursed has joined the pack.`);
      this.emitPrivateNotice(targetId, {
        type: 'cursed',
        title: 'The Curse Awoke',
        message: 'The wolves came for you. You are now a Werewolf.',
      });
      return false;
    }

    // Tough Guy: survives the first wolf attempt; dies the FOLLOWING night.
    if (role === 'Tough Guy' && !this.toughGuyHit.has(targetId)) {
      this.toughGuyHit.add(targetId);
      this.logEvent(`The Werewolves attacked ${targetName}, but the Tough Guy held on. They will fall the next night.`);
      this.emitPrivateNotice(targetId, {
        type: 'toughguy',
        title: 'You Held On',
        message: 'The wolves came for you, but you survived. You will die the following night.',
      });
      return false;
    }

    this.maybeEmitWolverineWarning(targetId);
    if (this.markPlayerDead(targetId, killedSet)) {
      this.logEvent(`${targetName} was killed during the night.`);

      // Diseased: wolves cannot kill the next night.
      if (role === 'Diseased') {
        this.wolvesSkipNextNight = true;
        this.logEvent('The Werewolves bit the Diseased — they are too sick to hunt the next night.');
      }
      return true;
    }
    return false;
  }

  // Apply Tough Guy's delayed death at the start of each new night.
  applyToughGuyDelayedDeaths() {
    if (this.toughGuyHit.size === 0) return [];
    const deadSet = new Set();
    [...this.toughGuyHit].forEach((id) => {
      this.toughGuyHit.delete(id);
      if (!this.hasLiveAssignment(id)) return;
      if (this.markPlayerDead(id, deadSet)) {
        this.logEvent(`${this.getPlayerName(id)} (the Tough Guy) finally fell from the wolf wound.`);
      }
    });
    return [...deadSet];
  }

  // Cult Leader win: every living player is in the cult.
  checkCultWin() {
    if (!this.cultLeaderId) return false;
    const leaderAssignment = this.assignments[this.cultLeaderId];
    if (!leaderAssignment || leaderAssignment.isDead) return false;
    const livingIds = this.getLivingSeatIds();
    if (livingIds.length === 0) return false;
    return livingIds.every((id) => this.cultMembers.has(id));
  }

  addPlayer(playerId, socketId, name, sessionToken = null) {
    let existing = this.players.find(p => p.id === playerId);
    if (existing) {
      // Authenticate rejoin: the session token must match the one issued at first join.
      if (existing.sessionToken && existing.sessionToken !== sessionToken) {
        // Reject impostor; do not mutate the existing seat.
        this.emitTo(socketId, 'joinRejected', {
          reason: 'A different session is already using this player id.',
        });
        return null;
      }
      existing.socketId = socketId;
      existing.connected = true;
      existing.name = name;
      this.emitTo(socketId, 'sessionToken', { token: existing.sessionToken });
      this.broadcastState();
      return existing.sessionToken;
    }

    if (this.locked) {
      this.emitTo(socketId, 'joinRejected', {
        reason: 'This room is locked by the host.',
      });
      return null;
    }

    const isHost = this.players.length === 0;
    const newToken = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 12)}`;
    this.players.push({
      id: playerId,
      socketId,
      name,
      isHost,
      connected: true,
      sessionToken: newToken,
    });
    this.emitTo(socketId, 'sessionToken', { token: newToken });
    this.broadcastState();
    return newToken;
  }

  removePlayer(socketId) {
    const p = this.players.find(x => x.socketId === socketId);
    if (p) {
      const wasHumanHost = p.isHost && !p.isBot;
      p.connected = false;
      this.broadcastState();

      setTimeout(() => {
        // Only process if the player hasn't reconnected
        if (!p.connected) {
          if (wasHumanHost) {
            this.endSessionBecauseHostLeft(p.id);
            return;
          }
          // Never let a departed player's unread reveal hold the night queue open.
          this.releaseNightHold(p.id);
          if (this.phase === 'lobby') {
            this.players = this.players.filter(x => x.id !== p.id);
          }
          if (this.players.length > 0 && !this.players.find(x => x.isHost && x.connected && !x.isBot)) {
            this.players.forEach(x => x.isHost = false);
            const first = this.players.find(x => x.connected && !x.isBot);
            if (first) first.isHost = true;
          }
          this.broadcastState();
        }
      }, 5000);
    }
  }

  updateSettings(socketId, newSettings) {
    const p = this.players.find(x => x.socketId === socketId);
    if (!p || !p.isHost || (this.phase !== 'lobby' && this.phase !== 'end')) return;

    const nextSettings = { ...this.settings, ...newSettings };
    nextSettings.discussionLength = clampNumber(nextSettings.discussionLength, this.settings.discussionLength, 5, 1800);
    nextSettings.nightActionTime = clampNumber(nextSettings.nightActionTime, this.settings.nightActionTime, 3, 180);
    nextSettings.accusationLength = clampNumber(nextSettings.accusationLength, this.settings.accusationLength, 10, 600);
    nextSettings.defenseLength = clampNumber(nextSettings.defenseLength, this.settings.defenseLength, 5, 600);
    nextSettings.trialLength = clampNumber(nextSettings.trialLength, this.settings.trialLength, 5, 300);
    nextSettings.firstNightKill = typeof nextSettings.firstNightKill === 'boolean'
      ? nextSettings.firstNightKill
      : this.settings.firstNightKill;
    nextSettings.enableVillagerChat = typeof nextSettings.enableVillagerChat === 'boolean'
      ? nextSettings.enableVillagerChat
      : this.settings.enableVillagerChat;
    const validScenes = ['tentacles', 'cthulhu_abyss', 'thunder', 'void', 'bees', 'bees_v2'];
    if (Array.isArray(nextSettings.executionScenes)) {
      const filtered = nextSettings.executionScenes.filter(s => validScenes.includes(s));
      nextSettings.executionScenes = filtered.length > 0 ? filtered : this.settings.executionScenes;
    } else {
      nextSettings.executionScenes = this.settings.executionScenes;
    }
    nextSettings.deckPreset = SERVER_DECK_PRESETS.has(nextSettings.deckPreset)
      ? nextSettings.deckPreset
      : this.settings.deckPreset;
    nextSettings.deck = Array.isArray(nextSettings.deck)
      ? nextSettings.deck
        .filter(role => typeof role === 'string' && SUPPORTED_ROLES.has(role.trim()))
        .map(role => role.trim())
      : this.settings.deck;
    if (Array.isArray(newSettings.deck) && !Object.prototype.hasOwnProperty.call(newSettings, 'deckPreset')) {
      nextSettings.deckPreset = nextSettings.deck.length > 0 ? 'custom' : 'auto';
    }
    if (nextSettings.deckPreset === 'auto' || nextSettings.deckPreset === 'alin') {
      nextSettings.deck = [];
    }

    this.settings = nextSettings;
    this.broadcastState();
  }

  broadcastState() {
    this.players.forEach(p => {
      if (p.connected) {
        this.emitTo(p.socketId, 'gameState', this.getSanitizedState(p.socketId));
      }
    });
  }

  getSanitizedState(socketId) {
    const isEnd = this.phase === 'end';
    const isPostNight = isEnd || this.phase === 'day'
      || this.phase === 'accusation' || this.phase === 'defense' || this.phase === 'trial';
    let myOriginalRole = null;
    let myRole = null;
    let myCurrentRole = null;
    let myActiveRole = null;
    let isDead = false;
    const center = isEnd ? this.centerCards : [null, null, null];
    const publicAssignments = {};
    const pInfo = this.players.find(p => p.socketId === socketId);
    const playerId = pInfo ? pInfo.id : null;

    if (playerId && this.assignments[playerId]) {
      const assignment = this.assignments[playerId];
      myOriginalRole = assignment.originalRole;
      myRole = isEnd ? assignment.currentRole : myOriginalRole;
      // Reveal currentRole once night is over (so role swaps show up next morning).
      // On Night 2+, also keep currentRole exposed: any role change from Night 1
      // (Robber, Village Idiot rotation, Doppelganger, Drunk, etc.) has already
      // been revealed at the previous dawn, so the role panel must match what the
      // player actually wakes as. Without this, the panel kept showing the OLD
      // dealt role while the wake prompt showed the NEW current role —
      // confusing the player and giving the appearance of "no action".
      myCurrentRole = (isPostNight || this.dayCount > 1)
        ? assignment.currentRole
        : null;
      myActiveRole = this.getActorRoleFor(playerId);
      if (!myActiveRole
          && this.phase === 'night'
          && this.currentNightAction
          && this.currentNightActors.includes(playerId)) {
        myActiveRole = this.currentNightAction;
      }
      isDead = assignment.isDead;
    }

    if (isEnd) {
      for (const pid of Object.keys(this.assignments)) {
        publicAssignments[pid] = this.assignments[pid].currentRole;
      }
    }

    const isWerewolfTurn = this.phase === 'night' && this.currentNightAction === 'Werewolf' && myActiveRole === 'Werewolf';
    const currentActors = this.phase === 'night' && this.currentNightAction
      ? (this.currentNightActors.length > 0 ? this.currentNightActors : this.getActiveActors(this.currentNightAction))
      : [];
    const nightProgress = this.phase === 'night' && this.currentNightAction
      ? {
        acted: currentActors.filter(id => this.nightActionsReceived[id]).length,
        total: currentActors.length,
      }
      : null;
    let aliveVoters = [];
    let voteProgress = null;
    if (this.phase === 'accusation') {
      aliveVoters = this.getVotingPlayers();
      voteProgress = {
        voted: aliveVoters.filter(p => Object.prototype.hasOwnProperty.call(this.accusationVotes, p.id)).length,
        total: aliveVoters.length,
      };
    } else if (this.phase === 'trial') {
      aliveVoters = this.getTrialVoters();
      voteProgress = {
        voted: aliveVoters.filter(p => Object.prototype.hasOwnProperty.call(this.trialVotes, p.id)).length,
        total: aliveVoters.length,
      };
    }
    const myAccusationVote = playerId
      ? (Object.prototype.hasOwnProperty.call(this.accusationVotes, playerId)
          ? this.accusationVotes[playerId]
          : null)
      : null;
    const myTrialVote = playerId
      ? (Object.prototype.hasOwnProperty.call(this.trialVotes, playerId)
          ? this.trialVotes[playerId]
          : null)
      : null;
    const trialTally = this.phase === 'trial' ? this.countTrialVotes() : null;

    const isHost = !!pInfo && pInfo.isHost;
    // Bot debug payload — host only. Includes roles + recent decision log.
    const botDebug = isHost && this.hasBots()
      ? {
        bots: this.players
          .filter(p => p.isBot)
          .map(p => {
            const a = this.assignments[p.id];
            return {
              id: p.id,
              name: p.name,
              originalRole: a?.originalRole || null,
              currentRole: a?.currentRole || null,
              isDead: a?.isDead || false,
            };
          }),
        log: this.botDebugLog.slice(-this.botDebugMax),
      }
      : null;

    const myDayStatus = playerId ? {
      silenced: this.silencedNextDay.has(playerId),
      banished: this.banishedNextDay.has(playerId),
      cupidPartner: this.cupidLinks[playerId] || null,
      inCult: this.cultMembers.has(playerId),
      isVampireMarked: !!this.vampireMarks[playerId],
      crazedWord: this.cthulhuCrazed[playerId] || null,
    } : null;
    // Check if this player is the Dawn Bringer and if they haven't used their ability yet
    const isDawnBringer = playerId && this.assignments[playerId]?.currentRole === 'Dawn Bringer';
    const dawnBringerAvailable = isDawnBringer && !this.dawnBringerUsed[playerId];
    // Ghost panel is always visible from day 1 onward, since any death now
    // confers ghost-chat. canSpeak is still gated per-player on isDead + day phase.
    const ghostDayPhases = ['day', 'accusation', 'defense', 'trial'];
    const ghostInfo = ghostDayPhases.includes(this.phase) ? {
      active: true,
      canSpeak: !!(playerId && this.canUseGhostChat(this.players.find(p => p.id === playerId)?.socketId)),
    } : null;

    const isJailerChatParticipant = !!(
      this.jailerChatActive &&
      playerId &&
      (playerId === this.jailerActorId || playerId === this.jailerTargetId)
    );

    const isJailer = !!(playerId && this.assignments[playerId]?.currentRole === 'Jailer');
    const isJailedPlayer = !!(playerId && playerId === this.jailedPlayerId);
    const exposeJailedPlayerId = isJailer || isJailedPlayer;

    return {
      roomId: this.roomId,
      phase: this.phase,
      dayCount: this.dayCount,
      locked: !!this.locked,
      myDayStatus,
      ghostInfo,
      jailerChatActive: this.jailerChatActive || false,
      jailerChatExpiresAt: this.jailerChatActive ? this.jailerChatExpiresAt : null,
      jailedPlayerId: (exposeJailedPlayerId && this.jailedPlayerId) || null,
      jailerChatMessages: isJailerChatParticipant ? this.jailerChatMessages : [],
      isJailerChatParticipant,
      players: this.players.map(p => ({
        id: p.id,
        // Deliberately no socketId — clients address each other by player id, and
        // broadcasting connection handles is needless surface.
        name: p.name,
        isHost: p.isHost,
        connected: p.connected,
        isBot: !!p.isBot,
        isDead: this.assignments[p.id]?.isDead || false,
        hasVoted: this.phase === 'accusation'
          ? Object.prototype.hasOwnProperty.call(this.accusationVotes, p.id)
          : this.phase === 'trial'
            ? Object.prototype.hasOwnProperty.call(this.trialVotes, p.id)
            : false,
        revealedRole: (() => {
          if (this.phase === 'end' || this.assignments[p.id]?.isDead) {
            return this.assignments[p.id]?.currentRole || null;
          }
          if (this.revealedCards[p.id]) {
            return this.revealedCards[p.id];
          }
          if (playerId && p.id !== playerId) {
            const viewerOriginal = this.assignments[playerId]?.originalRole;
            const viewerCurrent = this.assignments[playerId]?.currentRole;
            const targetOriginal = this.assignments[p.id]?.originalRole;
            const targetCurrent = this.assignments[p.id]?.currentRole;

            const viewerIsWolf = this.isWerewolfRole(viewerOriginal) || this.isWerewolfRole(viewerCurrent);
            const targetIsWolf = this.isWerewolfRole(targetOriginal) || this.isWerewolfRole(targetCurrent);

            if (viewerIsWolf && targetIsWolf) {
              return targetOriginal;
            }
            
            const viewerIsSupport = this.isWolfSupportRole(viewerOriginal) || this.isWolfSupportRole(viewerCurrent);
            if (viewerIsSupport && targetIsWolf) {
              return targetOriginal;
            }
          }
          return null;
        })(),
      })),
      botDebug,
      myOriginalRole,
      myRole,
      myCurrentRole,
      myActiveRole,
      isDead,
      witchSavePotion: playerId && this.assignments[playerId] ? this.assignments[playerId].witchSavePotion !== false : undefined,
      witchKillPotion: playerId && this.assignments[playerId] ? this.assignments[playerId].witchKillPotion !== false : undefined,
      troublemakerUsed: playerId && this.assignments[playerId] ? !!this.assignments[playerId].troublemakerUsed : undefined,
      priestUsed: playerId && this.assignments[playerId] ? !!this.assignments[playerId].priestUsed : undefined,
      cthulhuUsed: playerId && this.assignments[playerId] ? !!this.assignments[playerId].cthulhuUsed : undefined,
      yandereUsesLeft: (playerId && this.assignments[playerId]?.originalRole === 'Yandere')
        ? Math.max(0, 3 - (this.yandereUsed[playerId] || 0))
        : undefined,
      yandereObsession: (playerId && this.assignments[playerId]?.originalRole === 'Yandere')
        ? (this.yanderObs[playerId] || null)
        : undefined,
      centerCards: center,
      timeLeft: this.timeLeft,
      currentNightAction: myActiveRole ? this.currentNightAction : null,
      nightPendingContinue: !!(playerId && this.hasPendingNightResultAck(playerId)),
      publicAssignments,
      winner: this.winner,
      settings: this.settings,
      wwKillVotes: isWerewolfTurn ? this.wwKillVotes : {},
      nightProgress,
      voteProgress,
      // Only meaningful while someone is actually on trial; gating it keeps a
      // finished day's accusation from leaking into the next night's state.
      accusedId: ACCUSED_VISIBLE_PHASES.has(this.phase) ? this.accusedId : null,
      myAccusationVote,
      myTrialVote,
      trialTally,
      eventLog: this.eventLog,
      dawnBringerAvailable: dawnBringerAvailable || false,
    };
  }

  // Dawn Bringer: Declare during day/accusation phase to reveal and cancel next night's kills
  handleDawnBringerDeclare(socketId) {
    const pInfo = this.players.find(p => p.socketId === socketId);
    if (!pInfo) return;
    const pid = pInfo.id;
    const assignment = this.assignments[pid];
    if (!assignment || assignment.isDead) return;
    if (assignment.currentRole !== 'Dawn Bringer') return;
    if (this.dawnBringerUsed[pid]) return;
    if (this.phase !== 'day' && this.phase !== 'accusation') return;

    this.dawnBringerUsed[pid] = true;
    this.dawnBringerDeclared = true;
    this.revealedCards[pid] = 'Dawn Bringer';
    this.logEvent(`${pInfo.name} stands up and declares: "I AM THE DAWNBRINGER!" Their role is revealed. The coming night will be peaceful — no targeting abilities will take effect.`);
    this.broadcastState();
  }

  // --- Game Start ---
  pickRandomRoles(pool, count) {
    const shuffled = [...pool];
    this.shuffle(shuffled);
    return shuffled.slice(0, count);
  }

  getDefaultDeck(playerCount) {
    const wolvesCount = playerCount >= 7 ? 2 : 1;
    const detectionCount = playerCount >= 8 ? 2 : 1;
    const protectorCount = playerCount >= 9 ? 2 : 1;

    let neutralCount = 0;
    let soloCount = 0;
    if (playerCount === 5) {
      if (Math.random() < 0.5) {
        neutralCount = 1;
      } else {
        soloCount = 1;
      }
    } else if (playerCount >= 6) {
      neutralCount = 1;
      soloCount = 1;
    }

    const playerSeatsNeeded = playerCount - wolvesCount - detectionCount - protectorCount - neutralCount - soloCount;

    const wolvesPool = playerCount >= 7
      ? ['Werewolf', 'Alpha Wolf', 'Mystic Wolf', 'Wolverine']
      : ['Werewolf', 'Alpha Wolf', 'Wolverine'];
    const detectionPool = ['Seer', 'Aura Seer', 'Private Investigator', 'Apprentice Seer'];
    const protectorPool = ['Bodyguard', 'Priest', 'Jailer'];
    const neutralPool = ['Tanner', 'Disruptor', 'Old Hag', 'Spellcaster', 'Yandere', 'Cthulhu'];
    const soloPool = ['Cult Leader', 'Vampire'];
    const passivePool = ['Hunter', 'Mayor', 'Prince', 'Pacifist', 'Lycan', 'Cursed', 'Tough Guy', 'Mad Bomber'];
    const otherPool = ['Robber', 'Troublemaker', 'Witch', 'Drunk', 'Insomniac', 'Village Idiot', 'Revealer', 'Dawn Bringer', 'The Reflector'];

    const draw = (pool, n) => {
      const drawn = [];
      for (let i = 0; i < n; i++) {
        if (pool.length === 0) break;
        const idx = Math.floor(Math.random() * pool.length);
        drawn.push(pool.splice(idx, 1)[0]);
      }
      return drawn;
    };

    const playerCards = [];
    playerCards.push(...draw(wolvesPool, wolvesCount));
    playerCards.push(...draw(detectionPool, detectionCount));
    playerCards.push(...draw(protectorPool, protectorCount));
    playerCards.push(...draw(neutralPool, neutralCount));
    playerCards.push(...draw(soloPool, soloCount));

    if (playerSeatsNeeded > 0) {
      playerCards.push(...draw(passivePool, 1));
      const remainingNeeded = playerSeatsNeeded - 1;
      if (remainingNeeded > 0) {
        const otherDrawn = draw(otherPool, remainingNeeded);
        playerCards.push(...otherDrawn);
        if (otherDrawn.length < remainingNeeded) {
          playerCards.push(...draw(passivePool, remainingNeeded - otherDrawn.length));
        }
      }
    }

    // Shuffle only the player cards so they get random seats
    this.shuffle(playerCards);

    // Gather all remaining unselected roles for the center cards
    const leftoverPool = [
      ...wolvesPool,
      ...detectionPool,
      ...protectorPool,
      ...neutralPool,
      ...soloPool,
      ...passivePool,
      ...otherPool
    ];

    const centerCards = draw(leftoverPool, 3);
    while (centerCards.length < 3) {
      centerCards.push('Villager');
    }

    return [...playerCards, ...centerCards];
  }

  getAlinDeck(playerCount) {
    if (playerCount !== 5) return null;

    const playerCards = [
      this.pickRandom(ALIN_WOLF_ROLES),
      this.pickRandom(ALIN_DETECTION_ROLES),
      this.pickRandom(ALIN_VILLAGE_POWER_ROLES),
      this.pickRandom(ALIN_NEUTRAL_ROLES),
      this.pickRandom(ALIN_VILLAGE_WILD_ROLES),
    ];
    this.shuffle(playerCards);
    return [...playerCards, ...ALIN_CENTER_CARDS];
  }

  hasRealWerewolf(deck) {
    const killingWolves = ['Werewolf', 'Alpha Wolf', 'Wolverine', 'Wolf Cub', 'Lone Wolf'];
    return deck.some(role => killingWolves.includes(role));
  }

  ensurePlayerWerewolf(deck, playerCount) {
    const playerCards = deck.slice(0, playerCount);
    if (playerCards.some(role => this.isWerewolfRole(role))) {
      return deck;
    }

    const centerWolfIndex = deck.findIndex((role, index) =>
      index >= playerCount && this.isWerewolfRole(role)
    );
    if (centerWolfIndex === -1) {
      return deck;
    }

    const preferredSwapIndex = playerCards.findIndex(role => role === 'Villager' || role === 'Lycan');
    const playerIndex = preferredSwapIndex === -1 ? 0 : preferredSwapIndex;
    [deck[playerIndex], deck[centerWolfIndex]] = [deck[centerWolfIndex], deck[playerIndex]];
    return deck;
  }

  normalizeDeck(playerCount) {
    const targetSize = playerCount + 3;
    if (this.settings.deckPreset === 'alin') {
      return this.getAlinDeck(playerCount);
    }

    let deck = Array.isArray(this.settings.deck)
      ? this.settings.deck.filter(role => SUPPORTED_ROLES.has(role))
      : [];

    if (deck.length === 0) {
      return this.getDefaultDeck(playerCount);
    }

    if (deck.length !== targetSize) {
      return null;
    }

    if (!this.hasRealWerewolf(deck)) {
      return null;
    }

    this.shuffle(deck);
    this.ensurePlayerWerewolf(deck, playerCount);
    return deck;
  }

  shuffle(cards) {
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
  }

  startGame(socketId = null) {
    if (socketId && !this.isHostSocket(socketId)) return false;

    const seatedPlayers = this.players.filter(p => p.connected);
    if (seatedPlayers.length < 3) return false;

    this.clearAllTimers();
    this.players = seatedPlayers;
    const n = this.players.length;
    // Deck validation happens before the reset so a rejected start leaves the
    // previous game's end screen intact.
    const normalizedDeck = this.normalizeDeck(n);
    if (!normalizedDeck) {
      const message = this.settings.deckPreset === 'alin'
        ? 'Alin preset is built for exactly 5 players.'
        : `Select exactly ${n + 3} cards and include at least one real Werewolf card. Lycan does not count.`;
      this.emitPrivateNotice(this.players.find(p => p.socketId === socketId)?.id, {
        type: 'error',
        title: 'Custom Deck',
        message,
      });
      return false;
    }
    this.resetGameState();
    this.roles = normalizedDeck;

    for (let i = 0; i < n; i++) {
      const role = this.roles[i];
      this.assignments[this.players[i].id] = {
        originalRole: role,
        currentRole: role,
        doppelgangerRole: null,
        doppelgangerTarget: null,
        piUsed: false,
        isDead: false,
        witchSavePotion: role === 'Witch',
        witchKillPotion: role === 'Witch',
        priestUsed: false,
        troublemakerUsed: false,
        drunkRevealed: false,
        cthulhuUsed: false,
      };
    }

    this.centerCards = [this.roles[n], this.roles[n + 1], this.roles[n + 2]];
    this.alphaWolfCard = this.roles.includes('Alpha Wolf') ? 'Werewolf' : null;
    // The cult opens with its leader already inside it.
    this.cultLeaderId = this.players.find(p => this.assignments[p.id]?.originalRole === 'Cult Leader')?.id || null;
    if (this.cultLeaderId) this.cultMembers.add(this.cultLeaderId);

    this.phase = 'dealing';
    this.broadcastState();
    this.dealTimer = setTimeout(() => this.startNight(), 5000);
    return true;
  }

  // --- Night ---
  startNight() {
    this.clearAllTimers();
    this.phase = 'night';
    this.resetNightState();
    // Day-status carry-overs expire at nightfall (Spellcaster/Old Hag last one day).
    this.resetDayState();

    // Diseased skip reset
    this.wolvesSkippingThisNight = this.wolvesSkipNextNight;
    this.wolvesSkipNextNight = false;

    // Wolf Cub extra kill activation timing
    if (this.wolfCubPendingExtraKill) {
      this.wolfCubExtraKill = true;
      this.wolfCubPendingExtraKill = false;
    }

    // NOTE: dawnBringerDeclared is intentionally NOT cleared here \u2014 it must survive into
    // the dawn-bringer skip check below so the night can be cancelled. It is consumed by
    // the skip logic right after Tough Guy resolution.

    // Tough Guy delayed deaths trigger at the start of the night they were marked.
    // These trigger BEFORE the Dawn Bringer skip \u2014 the bite from a previous night
    // is not undone by the dawn light; only the upcoming night's actions are.
    if (this.dayCount > 1) {
      const delayedDead = this.applyToughGuyDelayedDeaths();
      if (delayedDead.length > 0) {
        if (this.checkWinConditions(delayedDead, 'night')) return;
      }
    }

    // Dawn Bringer: if declared on the previous day, the entire night phase is cancelled.
    // We've already reset per-night state above, so jumping directly to startDay is clean.
    if (this.dawnBringerDeclared) {
      this.dawnBringerDeclared = false;
      this.logEvent("The Dawnbringer's light shatters the dark. The night never arrives.");
      this.logBotEvent('System', 'DawnBringer', 'night-skipped',
        `Night ${this.dayCount} skipped via Dawn Bringer declaration.`);
      this.startDay();
      return;
    }

    // Phase boundary summary for the host debug console
    const aliveSummary = this.players
      .filter(p => this.assignments[p.id] && !this.assignments[p.id].isDead)
      .map(p => `${p.name}(${this.assignments[p.id].currentRole})`)
      .join(', ');
    this.logBotEvent('System', 'NightStart', `night#${this.dayCount}`,
      `Alive: [${aliveSummary || 'nobody'}]`);

    const rolesInGame = this.dayCount === 1
      ? new Set(this.roles)
      : new Set([
        ...Object.values(this.assignments).filter(a => !a.isDead).map(a => a.currentRole),
        ...this.centerCards,
      ]);
    if ([...rolesInGame].some(role => WEREWOLF_WAKE_ROLES.has(role))) {
      rolesInGame.add('Werewolf');
    }
    const ordered = WAKE_ORDER.filter(role => rolesInGame.has(role) && SUPPORTED_ROLES.has(role) && this.shouldWakeRole(role));
    const fallback = [...rolesInGame].filter(role => SUPPORTED_ROLES.has(role) && !WAKE_ORDER.includes(role) && !NO_WAKE_ROLES.has(role) && this.shouldWakeRole(role));
    this.nightQueue = [...new Set([...ordered, ...fallback])];
    this.nextNightAction();
  }

  getNightWerewolfIds() {
    return this.players
      .filter(p => this.assignments[p.id] && !this.assignments[p.id].isDead)
      .filter(p => this.isWerewolfRole(this.assignments[p.id].currentRole))
      .map(p => p.id);
  }

  isWerewolfWakeActor(assignment) {
    return WEREWOLF_WAKE_ROLES.has(assignment.originalRole) || WEREWOLF_WAKE_ROLES.has(assignment.currentRole);
  }

  // True when the given player is being mirrored by an active Reflector tonight.
  isReflectorMirrored(playerId) {
    if (!playerId || !this.reflectorTarget) return false;
    for (const tgt of Object.values(this.reflectorTarget)) {
      if (tgt === playerId) return true;
    }
    return false;
  }

  // True when the given player is being targeted by an active Disruptor tonight.
  isDisrupted(playerId) {
    if (!playerId || !this.disruptorTarget) return false;
    for (const tgt of Object.values(this.disruptorTarget)) {
      if (tgt === playerId) return true;
    }
    return false;
  }

  // True when the given player is being shielded by an active Yandere tonight.
  isYandereShielded(playerId) {
    if (!playerId || !this.yandereActiveShield) return false;
    for (const tgt of Object.values(this.yandereActiveShield)) {
      if (tgt === playerId) return true;
    }
    return false;
  }

  // Returns the socket id of the Yandere protecting this player tonight (if any).
  getYandereProtector(playerId) {
    if (!playerId || !this.yandereActiveShield) return null;
    for (const [yandereId, tgt] of Object.entries(this.yandereActiveShield)) {
      if (tgt === playerId) return yandereId;
    }
    return null;
  }

  getActorRoleFor(playerId, actionRole = this.currentNightAction) {
    const assignment = this.assignments[playerId];
    if (!assignment || assignment.isDead || !actionRole) return null;

    // Jailed players cannot perform night actions — including Werewolf hunts.
    // Jailer wakes before any other night actor, so by this point the jail set is final.
    // The Jailer step itself is exempt so the Jailer can still cast their lock.
    if (actionRole !== 'Jailer' && this.jailedTargets && this.jailedTargets.has(playerId)) {
      return null;
    }

    if (this.dayCount > 1) {
      if (actionRole === 'Private Investigator' && assignment.piUsed) return null;
      if (actionRole === 'Cthulhu' && assignment.cthulhuUsed) return null;
      if (actionRole === 'Werewolf' && WEREWOLF_WAKE_ROLES.has(assignment.currentRole)) return 'Werewolf';
      if (assignment.currentRole === actionRole) return actionRole;
      return null;
    }

    if (actionRole === 'Private Investigator' && assignment.piUsed) return null;
    if (actionRole === 'Cthulhu' && assignment.cthulhuUsed) return null;
    if (actionRole === 'Werewolf' && this.isWerewolfWakeActor(assignment)) return 'Werewolf';
    if (assignment.originalRole === actionRole) return actionRole;
    if (assignment.originalRole === 'Doppelganger' && assignment.currentRole === actionRole && actionRole !== 'Doppelganger') return actionRole;
    return null;
  }

  getActiveActors(role = this.currentNightAction) {
    if (!role) return [];
    return this.players
      .filter(p => p.connected && this.getActorRoleFor(p.id, role))
      .map(p => p.id);
  }

  nextNightAction() {
    this.clearTimer();

    while (this.nightQueue.length > 0) {
      this.currentNightAction = this.nightQueue.shift();
      this.nightActionsReceived = {};
      this.pendingNightResultAcks = {};
      this.currentNightActors = [];

      const actors = this.getActiveActors(this.currentNightAction);
      if (actors.length > 0) {
        this.currentNightActors = actors;
        const actorList = actors.map(id => this.getPlayerName(id)).join(', ');
        this.logBotEvent('System', this.currentNightAction, 'wake',
          `Active: [${actorList}]`);
        const killPhase = this.currentNightAction === 'Werewolf' && this.shouldWerewolvesHuntNow();
        const seconds = killPhase ? this.settings.nightActionTime + 10 : this.settings.nightActionTime;
        // Armed before the broadcast so the state players receive already carries
        // this wake's deadline.
        this.startPhaseTimer(seconds, () => {
          const waitingForReview = this.currentNightActors.some(id => this.hasPendingNightResultAck(id));
          if (waitingForReview) {
            // Give readers a bounded extension rather than cutting them off mid-result.
            this.armNightReviewTimer();
            return;
          }
          this.nextNightAction();
        });
        this.broadcastState();
        // Bots auto-act after a short, staggered delay so the host can see them on the log.
        this.scheduleBotNightActions();
        return;
      } else {
        this.logBotEvent('System', this.currentNightAction, 'skip',
          'No active actors (jailed/dead/not in play).');
      }
    }

    this.startDay();
  }

  finishNightAction(playerId) {
    this.nightActionsReceived[playerId] = true;
    delete this.pendingNightResultAcks[playerId];
    const actors = this.currentNightActors && this.currentNightActors.length > 0
      ? this.currentNightActors
      : this.getActiveActors(this.currentNightAction);
    // Actors are snapshotted when the phase wakes, so anyone who dropped since then
    // is skipped instead of holding the "everyone acted" check open.
    if (actors.length > 0 && this.getPendingNightActors().length === 0) {
      this.clearTimer();
      this.timer = setTimeout(() => this.nextNightAction(), 1000);
    }
  }

  acknowledgeNightResult(socketId) {
    const pInfo = this.players.find(p => p.socketId === socketId);
    if (!pInfo || this.phase !== 'night' || !this.hasPendingNightResultAck(pInfo.id)) return false;
    this.finishNightAction(pInfo.id);
    this.broadcastState();
    return true;
  }

  emitActionError(socketId, message) {
    this.emitActionResult(socketId,{ type: 'error', message });
  }

  emitShielded(socketId) {
    this.emitActionResult(socketId,{ type: 'shielded' });
  }

  handleNightAction(socketId, actionData = {}) {
    const pInfo = this.players.find(p => p.socketId === socketId);
    if (!pInfo) return;

    const pid = pInfo.id;
    const assignment = this.assignments[pid];
    const actorRole = this.getActorRoleFor(pid);
    const { type, target1, target2 } = actionData;

    if (this.jailerChatActive && (pid === this.jailerActorId || pid === this.jailerTargetId)) {
      if (type === 'jailerContinue' || type === 'continue' || type === 'ack') {
        this.endJailerInterrogation();
        return;
      }
    }

    if (this.hasPendingNightResultAck(pid)) {
      if (type === 'continue' || type === 'ack') {
        this.acknowledgeNightResult(socketId);
      }
      return;
    }

    if (!assignment || assignment.isDead || !actorRole) return;
    if (this.nightActionsReceived[pid]) return;

    // Disruptor: a player chosen by an active Disruptor tonight has their night
    // action nullified. They wake up, get a private notice, and the queue moves on.
    // The Disruptor themselves is exempt (the role wakes earlier and isn't a valid target).
    if (this.isDisrupted(pid) && actorRole !== 'Disruptor') {
      this.emitPrivateNotice(pid, {
        type: 'disrupted',
        title: 'Your Senses Reel',
        message: 'A Disruptor scrambled your senses. Your power had no effect tonight.',
      });
      this.emitActionResult(socketId, { type: 'disrupted' });
      this.logBotEvent('System', 'Disruptor', 'effect',
        `${pInfo.name} (${actorRole}) had their night action nullified by Disruption.`);
      this.finishNightAction(pid);
      this.broadcastState();
      return;
    }

    switch (actorRole) {
      case 'Werewolf': {
        if (!this.shouldWerewolvesHuntNow()) {
          const wolves = this.getNightWerewolfIds().filter(id => id !== pid);
          this.emitActionResult(socketId,{ type: 'wolfView', wolves, huntSkipped: true });
          if (this.hasPendingNightResultAck(pid)) {
            this.broadcastState();
            return;
          }
          this.finishNightAction(pid);
          this.broadcastState();
          return;
        }

        if (!target1 || !this.hasLiveAssignment(target1) || target1 === pid) {
          this.emitActionError(socketId, 'Choose a living player to hunt.');
          return;
        }

        this.wwKillVotes[pid] = target1;
        this.finishNightAction(pid);
        this.broadcastState();

        const aliveWolves = this.getActiveActors('Werewolf');
        if (aliveWolves.every(id => this.wwKillVotes[id])) {
          const tally = Object.entries(this.wwKillVotes)
            .map(([wid, tid]) => `${this.getPlayerName(wid)}→${this.getPlayerName(tid)}`)
            .join(', ');
          this.logBotEvent('Pack', 'Werewolf', 'tally', tally || 'no votes');

          // Primary target = single top vote-getter.
          const primary = this.resolveSingleVoteWinner(this.wwKillVotes);
          if (primary) {
            this.werewolfKillTarget = primary;
            this.logBotEvent('Pack', 'Werewolf', 'target_chosen', `Target set: ${this.getPlayerName(primary)}`);
          } else {
            this.werewolfKillTarget = null;
            this.logEvent('The Werewolves could not agree on a target.');
            this.logBotEvent('Pack', 'Werewolf', 'kill_split', 'Tied vote — no target.');
          }

          this.clearTimer();
          this.timer = setTimeout(() => this.nextNightAction(), 1500);
        }
        return;
      }

      case 'Sentinel':
        if (!target1 || !this.hasLiveAssignment(target1) || target1 === pid) {
          this.emitActionError(socketId, 'Choose another living player to shield.');
          return;
        }
        this.sentinelShielded = target1;
        this.emitActionResult(socketId,{ type: 'protectResult', target: target1 });
        break;

      case 'Jailer': {
        if (!target1 || !this.hasLiveAssignment(target1)) {
          this.emitActionError(socketId, 'Choose a living player to jail.');
          return;
        }
        this.protectedPlayers.push(target1);
        this.jailedTargets.add(target1);
        this.jailedPlayerId = target1;

        const actorPlayer = this.players.find(p => p.id === pid);
        const targetPlayer = this.players.find(p => p.id === target1);
        const bothHuman = actorPlayer && !actorPlayer.isBot && targetPlayer && !targetPlayer.isBot;

        if (bothHuman) {
          this.clearTimer();
          this.jailerChatActive = true;
          this.jailerActorId = pid;
          this.jailerTargetId = target1;
          this.jailerChatMessages = [
            {
              sender: 'System',
              text: 'Interrogation started. You have 60 seconds to speak. Click Continue to skip.',
              ts: Date.now()
            }
          ];
          this.jailerChatExpiresAt = Date.now() + 60000;
          this.jailerChatTimer = setTimeout(() => {
            this.endJailerInterrogation();
          }, 60000);

          this.emitActionResult(socketId, { type: 'protectResult', target: target1, jailed: true });
          this.broadcastState();
        } else {
          this.emitActionResult(socketId, { type: 'protectResult', target: target1, jailed: true });
          this.finishNightAction(pid);
        }
        break;
      }

      case 'Priest': {
        const priestAssignment = this.assignments[pid];
        if (type === 'skip') {
          this.emitActionResult(socketId, { type: 'protectResult', action: 'skip' });
          break;
        }
        if (priestAssignment.priestUsed) {
          this.emitActionError(socketId, 'You have already used your one-per-game blessing.');
          return;
        }
        if (!target1 || !this.hasLiveAssignment(target1)) {
          this.emitActionError(socketId, 'Choose a living player to protect.');
          return;
        }
        priestAssignment.priestUsed = true;
        this.protectedPlayers.push(target1);
        this.emitActionResult(socketId, { type: 'protectResult', target: target1 });
        break;
      }

      case 'Bodyguard': {
        if (!target1 || !this.hasLiveAssignment(target1) || target1 === pid) {
          this.emitActionError(socketId, 'Choose another living player to guard.');
          return;
        }
        this.protectedPlayers.push(target1);
        this.emitActionResult(socketId, { type: 'protectResult', target: target1 });
        break;
      }

      case 'Alpha Wolf':
        if (!target1 || !this.hasLiveAssignment(target1) || target1 === pid) {
          this.emitActionError(socketId, 'Choose another living player.');
          return;
        }
        if (this.blockProtectedEffect(socketId, target1)) {
          break;
        }
        const targetRole = this.assignments[target1].currentRole;
        const isImmune = ['Vampire', 'Cult Leader', 'Cthulhu'].includes(targetRole);
        if (this.alphaWolfCard && !this.isWerewolfRole(targetRole) && !isImmune) {
          const oldRole = targetRole;
          this.applyRoleChange(target1, this.alphaWolfCard);
          this.alphaWolfCard = oldRole;
          this.emitActionResult(socketId,{ type: 'alphaResult', success: true });
        } else {
          this.emitActionResult(socketId,{ type: 'alphaResult', success: false });
        }
        break;

      case 'Mystic Wolf':
        if (!target1 || !this.hasLiveAssignment(target1) || target1 === pid) {
          this.emitActionError(socketId, 'Choose another living player to view.');
          return;
        }
        if (this.isShielded(target1)) {
          this.emitShielded(socketId);
          break;
        }
        this.emitActionResult(socketId,{ type: 'playerView', role: this.getVisibleRoleForInvestigation(target1), target: target1 });
        break;

      case 'Minion':
      case 'Squire': {
        const wolves = this.getNightWerewolfIds().filter(id => id !== pid);
        this.emitActionResult(socketId,{ type: 'wolfView', wolves });
        break;
      }

      case 'Mason': {
        const masons = this.getActiveActors('Mason').filter(id => id !== pid);
        this.emitActionResult(socketId,{ type: 'masonView', masons });
        break;
      }

      case 'Seer': {
        if (!target1 || !this.hasLiveAssignment(target1) || target1 === pid) {
          this.emitActionError(socketId, 'Choose another living player to view.');
          return;
        }
        if (this.isShielded(target1)) {
          this.emitShielded(socketId);
          break;
        }
        const seenRole = this.getVisibleRoleForInvestigation(target1);
        const isWolf = this.isWerewolfRole(seenRole);
        this.emitActionResult(socketId, {
          type: 'seerFactionResult',
          target: target1,
          faction: isWolf ? 'Werewolf' : 'Villager',
        });
        break;
      }

      case 'Apprentice Seer': {
        // Once the Seer dies the Apprentice Seer transforms into the Seer.
        // The first wake as Seer happens via the normal Seer handler — this branch
        // exists only as a safety net if the queue ever schedules it directly.
        if (!target1 || !this.hasLiveAssignment(target1) || target1 === pid) {
          this.emitActionError(socketId, 'Choose another living player to view.');
          return;
        }
        if (this.isShielded(target1)) {
          this.emitShielded(socketId);
          break;
        }
        const seen = this.getVisibleRoleForInvestigation(target1);
        const isWolf = this.isWerewolfRole(seen);
        this.emitActionResult(socketId, {
          type: 'seerFactionResult',
          target: target1,
          faction: isWolf ? 'Werewolf' : 'Villager',
        });
        break;
      }

      case 'Aura Seer':
        if (!target1 || !this.hasLiveAssignment(target1) || target1 === pid) {
          this.emitActionError(socketId, 'Choose another living player to read.');
          return;
        }
        if (this.isShielded(target1)) {
          this.emitShielded(socketId);
          break;
        }
        this.emitActionResult(socketId,{
          type: 'auraResult',
          target: target1,
          alignment: this.getAuraAlignment(target1),
        });
        break;

      case 'Private Investigator':
        if (!target1 || !this.hasLiveAssignment(target1) || target1 === pid) {
          this.emitActionError(socketId, 'Choose another living player to investigate.');
          return;
        }
        if (this.isShielded(target1)) {
          this.emitShielded(socketId);
          break;
        }
        {
          const cluster = [target1, ...this.getNeighborIds(target1)];
          const hasWerewolf = cluster.some(id => this.isWerewolfToInvestigators(id));
          this.assignments[pid].piUsed = true;
          this.emitActionResult(socketId,{
            type: 'privateInvestigatorResult',
            target: target1,
            neighbors: cluster.filter(id => id !== target1),
            hasWerewolf,
          });
        }
        break;

      case 'Sorceress':
        if (!target1 || !this.hasLiveAssignment(target1) || target1 === pid) {
          this.emitActionError(socketId, 'Choose another living player to search.');
          return;
        }
        if (this.isShielded(target1)) {
          this.emitShielded(socketId);
          break;
        }
        this.emitActionResult(socketId,{
          type: 'sorceressResult',
          target: target1,
          isSeer: this.assignments[target1].currentRole === 'Seer',
          wolves: this.getNightWerewolfIds().filter(id => id !== pid),
        });
        break;

      case 'Paranormal Investigator':
        if (!target1 || !this.hasLiveAssignment(target1) || target1 === pid) {
          this.emitActionError(socketId, 'Choose another living player to inspect.');
          return;
        }
        if (this.isShielded(target1)) {
          this.emitShielded(socketId);
          break;
        }
        {
          const seen = this.getVisibleRoleForInvestigation(target1);
          this.emitActionResult(socketId,{ type: 'playerView', role: seen, target: target1 });
          if (this.isWerewolfRole(seen)) {
            this.applyRoleChange(pid, 'Werewolf');
          } else if (seen === 'Tanner') {
            this.applyRoleChange(pid, 'Tanner');
          }
        }
        break;

      case 'Witch': {
        if (type === 'skip') {
          this.emitActionResult(socketId, { type: 'witchResult', action: 'skip' });
          break;
        }
        if (type !== 'save' && type !== 'kill') {
          this.emitActionError(socketId, 'Choose Save, Kill, or Skip.');
          return;
        }
        if (!target1 || !this.hasLiveAssignment(target1)) {
          this.emitActionError(socketId, 'Choose a living player.');
          return;
        }
        const witch = this.assignments[pid];
        if (type === 'save') {
          if (!witch.witchSavePotion) {
            this.emitActionError(socketId, 'You have already used your save potion.');
            return;
          }
          witch.witchSavePotion = false;
          this.protectedPlayers.push(target1);
          this.witchProtectedTargets = this.witchProtectedTargets || new Set();
          this.witchProtectedTargets.add(target1);
          this.emitActionResult(socketId, { type: 'witchResult', action: 'save', target: target1 });
        } else {
          if (!witch.witchKillPotion) {
            this.emitActionError(socketId, 'You have already used your kill potion.');
            return;
          }
          witch.witchKillPotion = false;
          this.witchKills = this.witchKills || [];
          this.witchKills.push({ attackerId: pid, targetId: target1 });
          this.emitActionResult(socketId, { type: 'witchResult', action: 'kill', target: target1 });
        }
        break;
      }

      case 'Robber':
        if (!target1 || !this.hasLiveAssignment(target1) || target1 === pid) {
          this.emitActionError(socketId, 'Choose another living player to rob.');
          return;
        }
        if (this.blockProtectedEffect(socketId, target1)) {
          break;
        }
        {
          const my = this.assignments[pid].currentRole;
          const their = this.assignments[target1].currentRole;
          this.applyRoleChange(pid, their);
          this.applyRoleChange(target1, my);
          this.emitActionResult(socketId,{ type: 'robberResult', newRole: their });
        }
        break;

      case 'Troublemaker': {
        const troublemakerAssignment = this.assignments[pid];
        if (type === 'skip') {
          this.emitActionResult(socketId, { type: 'troublemakerResult', action: 'skip' });
          break;
        }
        if (troublemakerAssignment.troublemakerUsed) {
          this.emitActionError(socketId, 'You have already used your one-per-game ability.');
          return;
        }
        const targetsRaw = Array.isArray(actionData.targets) ? actionData.targets : [target1, target2];
        const targets = [...new Set(targetsRaw.filter(Boolean))]
          .filter(id => id !== pid && this.hasLiveAssignment(id));
        if (targets.length === 0) {
          this.emitActionError(socketId, 'Choose at least one other living player.');
          return;
        }
        troublemakerAssignment.troublemakerUsed = true;
        this.troublemakerKills = this.troublemakerKills || [];
        targets.forEach(id => this.troublemakerKills.push({ attackerId: pid, targetId: id }));
        this.emitActionResult(socketId, { type: 'troublemakerResult', action: 'call', targets });
        break;
      }

      case 'Village Idiot':
        if (type !== 'left' && type !== 'right') {
          this.emitActionError(socketId, 'Choose a rotation direction.');
          return;
        }
        {
          const otherIds = this.players
            .filter(p => p.id !== pid && this.hasLiveAssignment(p.id) && !this.isShielded(p.id))
            .map(p => p.id);
          const guardedTarget = otherIds.find(id => this.bodyguardGuards.has(id));
          if (guardedTarget && this.absorbBodyguardGuard(guardedTarget, 'effect')) {
            this.emitActionResult(socketId, { type: 'bodyguardBlocked', target: guardedTarget });
            break;
          }
          if (otherIds.length > 1) {
            // Remember each player's previous role so we can tell them what changed.
            const prevRoles = otherIds.map(id => this.assignments[id].currentRole);
            const newRoles = [...prevRoles];
            if (type === 'left') newRoles.unshift(newRoles.pop());
            else newRoles.push(newRoles.shift());
            otherIds.forEach((id, i) => {
              const oldRole = prevRoles[i];
              const newRole = newRoles[i];
              if (oldRole === newRole) return; // self-loop (only one rotation participant)
              this.applyRoleChange(id, newRole);
              // Private notice so the player isn't blindsided at dawn — the new role
              // is revealed to them privately, matching how other role-change roles
              // (Cursed, Robber-target, etc.) telegraph the change.
              this.emitPrivateNotice(id, {
                type: 'villageIdiotRotation',
                title: 'Your Role Was Scrambled',
                message: `The Village Idiot rotated the village's roles. You are now ${newRole}.`,
                newRole,
              });
            });
            this.logBotEvent('System', 'Village Idiot', 'rotate',
              `Rotation ${type}: ${otherIds.map((id, i) => `${this.getPlayerName(id)} ${prevRoles[i]} → ${newRoles[i]}`).join(', ')}`);
          }
          this.emitActionResult(socketId,{ type: 'villageIdiotResult', direction: type });
        }
        break;

      case 'Drunk': {
        const drunkAssignment = this.assignments[pid];
        drunkAssignment.drunkRevealed = true;
        
        const centerIndex = Math.floor(Math.random() * 3);
        const oldRole = drunkAssignment.currentRole;
        const newRole = this.centerCards[centerIndex];
        
        this.centerCards[centerIndex] = oldRole;
        this.applyRoleChange(pid, newRole);
        
        this.emitActionResult(socketId, {
          type: 'drunkResult',
          success: true,
          revealedRole: newRole,
        });
        break;
      }

      case 'Insomniac':
        this.emitActionResult(socketId,{ type: 'insomniacResult', role: this.assignments[pid].currentRole });
        break;

      case 'Revealer':
        if (!target1 || !this.hasLiveAssignment(target1) || target1 === pid) {
          this.emitActionError(socketId, 'Choose another living player to reveal.');
          return;
        }
        if (this.blockProtectedEffect(socketId, target1)) {
          break;
        }
        {
          const role = this.assignments[target1].currentRole;
          if (this.isWerewolfRole(role) || role === 'Tanner') {
            this.emitActionResult(socketId,{ type: 'revealerResult', blocked: true });
          } else {
            this.revealedCards[target1] = role;
            this.emitActionResult(socketId,{ type: 'revealerResult', role, target: target1 });
            this.broadcastState();
          }
        }
        break;

      case 'Doppelganger':
        if (!target1 || !this.hasLiveAssignment(target1) || target1 === pid) {
          this.emitActionError(socketId, 'Choose another living player to bind to.');
          return;
        }
        {
          this.assignments[pid].doppelgangerTarget = target1;
          this.assignments[pid].doppelgangerRole = null;
          this.emitActionResult(socketId,{ type: 'doppelgangerResult', target: target1, pending: true });
        }
        break;

      case 'Cupid': {
        if (!target1 || !target2 || target1 === target2 || !this.hasLiveAssignment(target1) || !this.hasLiveAssignment(target2)) {
          this.emitActionError(socketId, 'Choose two different living players to link.');
          return;
        }
        this.cupidLinks[target1] = target2;
        this.cupidLinks[target2] = target1;
        this.emitActionResult(socketId, { type: 'cupidResult', target1, target2 });
        this.emitPrivateNotice(target1, {
          type: 'cupid',
          title: 'Cupid Linked You',
          message: `Your fate is now tied to ${this.getPlayerName(target2)}.`,
        });
        this.emitPrivateNotice(target2, {
          type: 'cupid',
          title: 'Cupid Linked You',
          message: `Your fate is now tied to ${this.getPlayerName(target1)}.`,
        });
        break;
      }

      case 'Spellcaster': {
        if (!target1 || !this.hasLiveAssignment(target1) || target1 === pid) {
          this.emitActionError(socketId, 'Choose another living player to silence.');
          return;
        }
        // Reflector bounce: silencing a mirrored player silences the Spellcaster instead.
        if (this.isReflectorMirrored(target1)) {
          this.silencedNextDay.add(pid);
          this.logBotEvent('System', 'The Reflector', 'bounced-silence',
            `Spellcaster ${pInfo.name} bounced — silenced themselves via the mirror on ${this.getPlayerName(target1)}.`);
          this.emitActionResult(socketId, { type: 'silencedResult', target: pid, bounced: true });
          this.emitPrivateNotice(pid, {
            type: 'reflected',
            title: 'Your Spell Rebounded',
            message: 'A Reflector mirrored your target. Your spell turned on you — tomorrow you cannot speak.',
          });
          break;
        }
        // Yandere shield: blocked entirely, no silence applied.
        if (this.isYandereShielded(target1)) {
          this.emitShielded(socketId);
          break;
        }
        if (this.blockProtectedEffect(socketId, target1)) break;
        this.silencedNextDay.add(target1);
        this.emitActionResult(socketId, { type: 'silencedResult', target: target1 });
        this.emitPrivateNotice(target1, {
          type: 'spellcaster',
          title: 'A Spell Falls Over You',
          message: 'You cannot speak in the day chat tomorrow.',
        });
        break;
      }

      case 'Old Hag': {
        if (!target1 || !this.hasLiveAssignment(target1) || target1 === pid) {
          this.emitActionError(socketId, 'Choose another living player to banish.');
          return;
        }
        // Reflector bounce: banishing a mirrored player banishes the Old Hag instead.
        if (this.isReflectorMirrored(target1)) {
          this.banishedNextDay.add(pid);
          this.logBotEvent('System', 'The Reflector', 'bounced-banish',
            `Old Hag ${pInfo.name} bounced — banished themselves via the mirror on ${this.getPlayerName(target1)}.`);
          this.emitActionResult(socketId, { type: 'banishResult', target: pid, bounced: true });
          this.emitPrivateNotice(pid, {
            type: 'reflected',
            title: 'Your Banish Rebounded',
            message: 'A Reflector mirrored your target. Your hex turned on you — tomorrow you cannot speak or vote.',
          });
          break;
        }
        // Yandere shield: blocked entirely.
        if (this.isYandereShielded(target1)) {
          this.emitShielded(socketId);
          break;
        }
        if (this.blockProtectedEffect(socketId, target1)) break;
        this.banishedNextDay.add(target1);
        this.emitActionResult(socketId, { type: 'banishResult', target: target1 });
        this.emitPrivateNotice(target1, {
          type: 'oldhag',
          title: 'Banished',
          message: 'The Old Hag drove you from the village. You cannot speak or vote tomorrow.',
        });
        break;
      }

      case 'Vampire': {
        if (!target1 || !this.hasLiveAssignment(target1) || target1 === pid) {
          this.emitActionError(socketId, 'Choose another living player to mark.');
          return;
        }
        // Reflector bounce: marking a mirrored player marks the Vampire instead.
        if (this.isReflectorMirrored(target1)) {
          this.vampireMarks[pid] = pid;
          this.logBotEvent('System', 'The Reflector', 'bounced-mark',
            `Vampire ${pInfo.name} bounced — marked themselves via the mirror on ${this.getPlayerName(target1)}.`);
          this.emitActionResult(socketId, { type: 'vampireResult', target: pid, bounced: true });
          this.emitPrivateNotice(pid, {
            type: 'reflected',
            title: 'Your Mark Rebounded',
            message: 'A Reflector mirrored your target. Your fangs found your own throat.',
          });
          break;
        }
        // Yandere shield: blocked.
        if (this.isYandereShielded(target1)) {
          this.emitShielded(socketId);
          break;
        }
        if (this.blockProtectedEffect(socketId, target1)) break;
        // Accumulate marks under this.vampireMarks
        this.vampireMarks[target1] = pid;
        this.emitActionResult(socketId, { type: 'vampireResult', target: target1 });
        break;
      }

      case 'Curator': {
        if (!target1 || !this.hasLiveAssignment(target1)) {
          this.emitActionError(socketId, 'Choose a living player to give an artifact.');
          return;
        }
        if (this.blockProtectedEffect(socketId, target1)) break;
        this.emitActionResult(socketId, { type: 'curatorResult', target: target1 });
        break;
      }

      case 'Cult Leader': {
        if (!target1 || !this.hasLiveAssignment(target1)) {
          this.emitActionError(socketId, 'Choose a living player to recruit.');
          return;
        }
        if (this.blockProtectedEffect(socketId, target1)) break;
        this.cultMembers.add(pid);     // Leader is always in their own cult
        this.cultMembers.add(target1);
        this.cultLeaderId = pid;
        this.emitActionResult(socketId, { type: 'cultResult', target: target1, cultSize: this.cultMembers.size });
        this.emitPrivateNotice(target1, {
          type: 'cult',
          title: 'You Joined the Cult',
          message: 'A whispered ritual brought you into the Cult Leader\'s circle.',
        });
        break;
      }

      case 'Disruptor': {
        // Each night: choose a player whose ability will be nullified this night.
        if (!target1 || !this.hasLiveAssignment(target1) || target1 === pid) {
          this.emitActionError(socketId, 'Choose a living player to disrupt.');
          return;
        }
        // Reflector bounce: distorting a mirrored player turns the distortion on the Disruptor.
        if (this.isReflectorMirrored(target1)) {
          this.disruptorTarget[pid] = pid; // self-disrupt
          this.logBotEvent('System', 'The Reflector', 'bounced-disruption',
            `Disruptor ${pInfo.name} bounced — distorted themselves via the mirror on ${this.getPlayerName(target1)}.`);
          this.emitActionResult(socketId, { type: 'disruptorResult', target: pid, bounced: true });
          this.emitPrivateNotice(pid, {
            type: 'reflected',
            title: 'Your Distortion Rebounded',
            message: 'A Reflector mirrored your target. Your distortion turned on you tonight.',
          });
          break;
        }
        this.disruptorTarget[pid] = target1;
        this.logBotEvent('System', 'Disruptor', 'focused',
          `${pInfo.name} focused distortion on ${this.getPlayerName(target1)}.`);
        this.emitActionResult(socketId, { type: 'disruptorResult', target: target1 });
        break;
      }

      case 'The Reflector': {
        // Each night: choose a player. Anyone else who targets them this night
        // gets their effect bounced back onto themselves.
        if (!target1 || !this.hasLiveAssignment(target1) || target1 === pid) {
          this.emitActionError(socketId, 'Choose a living player to mirror.');
          return;
        }
        this.reflectorTarget[pid] = target1;
        // Host-only debug; the Reflector's identity and target stay private.
        this.logBotEvent('System', 'The Reflector', 'mirrored',
          `${pInfo.name} mirrored ${this.getPlayerName(target1)}.`);
        this.emitActionResult(socketId, { type: 'reflectorResult', target: target1 });
        break;
      }

      case 'Yandere': {
        // Night 1: pick the obsession target. Subsequent nights: optionally activate the shield.
        if (this.dayCount === 1) {
          if (!target1 || !this.hasLiveAssignment(target1)) {
            this.emitActionError(socketId, 'Choose a living player as your obsession.');
            return;
          }
          this.yanderObs[pid] = target1;
          this.emitActionResult(socketId, { type: 'yandereObsSet', target: target1, name: this.getPlayerName(target1) });
          this.logBotEvent('System', 'Yandere', 'obsession',
            `${pInfo.name} obsessed over ${this.getPlayerName(target1)}.`);
        } else {
          const obsTarget = this.yanderObs[pid];
          const usesLeft = 3 - (this.yandereUsed[pid] || 0);
          if (target1 === 'activate') {
            // Explicit failure modes so the player knows WHY the shield didn't fire.
            if (!obsTarget) {
              this.emitActionError(socketId, 'You never set an obsession — the shield has no anchor.');
              return;
            }
            if (!this.hasLiveAssignment(obsTarget)) {
              this.emitActionError(socketId, `${this.getPlayerName(obsTarget)} is already dead — there is no one to shield.`);
              return;
            }
            if (usesLeft <= 0) {
              this.emitActionError(socketId, 'You have already burned all three shield activations.');
              return;
            }
            this.yandereActiveShield[pid] = obsTarget;
            this.yandereUsed[pid] = (this.yandereUsed[pid] || 0) + 1;
            const remaining = 3 - this.yandereUsed[pid];
            this.emitActionResult(socketId, { type: 'yandereActivated', remaining });
            this.logBotEvent('System', 'Yandere', 'shield',
              `${pInfo.name} activated obsession shield on ${this.getPlayerName(obsTarget)}. ${remaining} use${remaining !== 1 ? 's' : ''} left.`);
          } else {
            this.emitActionResult(socketId, { type: 'yanderePass' });
          }
        }
        break;
      }

      case 'Cthulhu': {
        // Once per game: choose a player and a word — they become crazed the following day.
        const cthulhuAssignment = this.assignments[pid];
        if (cthulhuAssignment && cthulhuAssignment.cthulhuUsed) {
          this.emitActionError(socketId, 'Cthulhu has already cast their curse this game.');
          return;
        }
        if (!target1 || !this.hasLiveAssignment(target1)) {
          this.emitActionError(socketId, 'Choose a living player to afflict.');
          return;
        }
        const crazyWord = typeof target2 === 'string' ? target2.trim().slice(0, 30) : 'CTHULHU';
        const safeWord = crazyWord || 'CTHULHU';
        this.cthulhuCrazed[target1] = safeWord;
        if (cthulhuAssignment) cthulhuAssignment.cthulhuUsed = true;
        // Send a private notice to the target
        this.emitPrivateNotice(target1, {
          type: 'cthulhuCursed',
          title: 'A Supreme Being Visits You',
          message: `You feel your mind unraveling... When dawn comes, you will only be able to say: "${safeWord}"`,
          word: safeWord,
        });
        this.logBotEvent('System', 'Cthulhu', 'madness', `Cthulhu targeted ${this.getPlayerName(target1)} with word: "${safeWord}"`);
        this.emitActionResult(socketId, { type: 'cthulhuResult', target: target1, word: safeWord });
        break;
      }

      default:
        this.emitActionResult(socketId,{ type: 'generic', success: true });
        break;
    }

    if (this.hasPendingNightResultAck(pid)) {
      this.broadcastState();
      return;
    }

    if (this.jailerChatActive && pid === this.jailerActorId) {
      return;
    }

    this.finishNightAction(pid);
    this.broadcastState();
  }

  // --- Day ---
  resolveDawnKills() {
    const killed = new Set();

    // Dawn Bringer: if declared this night, all kill targeting is cancelled.
    if (this.dawnBringerDeclared) {
      this.logEvent('The Dawnbringer\'s light fills the sky — the night passes without any kills.');
      this.dawnBringerDeclared = false;
      this.werewolfKillTarget = null;
      this.witchKills = [];
      this.troublemakerKills = [];
      return [...killed];
    }

    // Yandere: build a set of protected targets this dawn (obsession shields activated)
    const yandereProtected = new Set(Object.values(this.yandereActiveShield));

    // Werewolf kill: resolve the deferred hunt target
    if (this.werewolfKillTarget) {
      const targetId = this.werewolfKillTarget;
      this.werewolfKillTarget = null; // reset

      // Yandere obsession shield: deflects the attack AND kills a random living wolf
      // ("the nearest player targeting them is eliminated instead", per the UI promise).
      if (yandereProtected.has(targetId)) {
        const wolfIds = this.players
          .filter(p => p.id !== targetId
            && this.hasLiveAssignment(p.id)
            && this.isWerewolfWakeActor(this.assignments[p.id]))
          .map(p => p.id);
        const slainWolf = this.pickRandom(wolfIds);
        if (slainWolf) {
          this.logEvent(`The Yandere's obsession shield blazes — the attack on ${this.getPlayerName(targetId)} rebounds, and ${this.getPlayerName(slainWolf)} fell to the pack's own fangs.`);
          this.markPlayerDead(slainWolf, killed);
        } else {
          this.logEvent(`The Yandere's obsession shield deflects the attack on ${this.getPlayerName(targetId)} — the wolves howl in frustration.`);
        }
      } else {
        this.resolveWolfKillOnTarget(targetId, killed);
      }

      // Wolf Cub double-kill bonus: pick a second non-wolf living target at random
      if (this.wolfCubExtraKill) {
        this.wolfCubExtraKill = false;
        const wolves = new Set(this.getNightWerewolfIds());
        const candidates = this.players
          .filter(p => this.hasLiveAssignment(p.id) && !wolves.has(p.id) && !killed.has(p.id))
          .map(p => p.id);
        const secondary = this.pickRandom(candidates);
        if (secondary) {
          this.logEvent('Enraged by the lost Wolf Cub, the pack strikes a second time.');
          // Honor the same protections (Reflector / Yandere / Bodyguard) for the bonus kill.
          if (yandereProtected.has(secondary)) {
            this.logEvent(`The Yandere's obsession shield deflects the bonus attack on ${this.getPlayerName(secondary)}.`);
          } else {
            this.resolveWolfKillOnTarget(secondary, killed);
          }
        }
      }
    }

    // Normalize legacy entries (plain string targetId) into the new {attackerId, targetId} shape.
    const normalizeKill = (entry) => (
      typeof entry === 'string' ? { attackerId: null, targetId: entry } : entry
    );

    // Witch kill potion: a target chosen at night dies at dawn unless protected.
    // Reflector bounce: if the target is mirrored, the Witch poisons themselves.
    // Yandere shield: blocks + kills the Witch (attacker-bounce, per the UI promise).
    const witchKills = Array.isArray(this.witchKills) ? this.witchKills.map(normalizeKill) : [];
    this.witchKills = [];
    witchKills.forEach(({ attackerId, targetId }) => {
      if (!this.hasLiveAssignment(targetId)) return;
      if (this.isReflectorMirrored(targetId) && attackerId && this.hasLiveAssignment(attackerId)) {
        if (this.markPlayerDead(attackerId, killed)) {
          this.logEvent(`The Reflector's mirror sent the Witch's potion back — ${this.getPlayerName(attackerId)} drank their own brew.`);
        }
        return;
      }
      if (yandereProtected.has(targetId)) {
        if (attackerId && this.hasLiveAssignment(attackerId)) {
          if (this.markPlayerDead(attackerId, killed)) {
            this.logEvent(`The Yandere's obsession shield blazes — the Witch's potion turned back on ${this.getPlayerName(attackerId)}.`);
          }
        } else {
          this.logEvent(`The Yandere's obsession shield deflects the Witch's potion on ${this.getPlayerName(targetId)}.`);
        }
        return;
      }
      if (this.protectedPlayers.includes(targetId)) {
        this.logEvent(`The Witch's potion was thwarted — ${this.getPlayerName(targetId)} was protected.`);
        return;
      }
      if (this.markPlayerDead(targetId, killed)) {
        this.logEvent(`${this.getPlayerName(targetId)} was poisoned by the Witch.`);
      }
    });

    // Troublemaker call: targets chosen during the night are eliminated at dawn.
    // Reflector bounce: if the target is mirrored, the Troublemaker dies instead.
    // Yandere shield: blocks + kills the Troublemaker (attacker-bounce).
    const troublemakerKills = Array.isArray(this.troublemakerKills) ? this.troublemakerKills.map(normalizeKill) : [];
    this.troublemakerKills = [];
    troublemakerKills.forEach(({ attackerId, targetId }) => {
      if (!this.hasLiveAssignment(targetId)) return;
      if (this.isReflectorMirrored(targetId) && attackerId && this.hasLiveAssignment(attackerId)) {
        if (this.markPlayerDead(attackerId, killed)) {
          this.logEvent(`The Reflector's mirror sent the Troublemaker's call back — ${this.getPlayerName(attackerId)} was claimed by their own scheme.`);
        }
        return;
      }
      if (yandereProtected.has(targetId)) {
        if (attackerId && this.hasLiveAssignment(attackerId)) {
          if (this.markPlayerDead(attackerId, killed)) {
            this.logEvent(`The Yandere's obsession shield blazes — the Troublemaker's call rebounded onto ${this.getPlayerName(attackerId)}.`);
          }
        } else {
          this.logEvent(`The Yandere's obsession shield deflects the Troublemaker's call on ${this.getPlayerName(targetId)}.`);
        }
        return;
      }
      if (this.protectedPlayers.includes(targetId)) {
        this.logEvent(`The Troublemaker's call was thwarted — ${this.getPlayerName(targetId)} was protected.`);
        return;
      }
      if (this.markPlayerDead(targetId, killed)) {
        this.logEvent(`${this.getPlayerName(targetId)} was eliminated at dawn by the Troublemaker's call.`);
      }
    });

    // Hygiene: dawn has consumed all per-night targeting effects, so clear them now
    // instead of waiting for the next startNight. Prevents stale data from being read
    // by any day-time mechanic that might check (Hunter revenge, Mad Bomber blast, etc.).
    this.reflectorTarget = {};
    this.disruptorTarget = {};
    this.yandereActiveShield = {};

    return [...killed];
  }

  startDay() {
    this.clearTimer();
    this.phase = 'day';
    this.currentNightAction = null;
    this.currentNightActors = [];
    this.pendingNightResultAcks = {};

    const dawnDead = this.resolveDawnKills();
    if (dawnDead.length > 0) {
      if (this.checkWinConditions(dawnDead, 'night')) return;
    }

    this.timeLeft = this.settings.discussionLength;

    // Phase boundary summary
    const aliveSummary = this.players
      .filter(p => this.assignments[p.id] && !this.assignments[p.id].isDead)
      .map(p => `${p.name}(${this.assignments[p.id].currentRole})`)
      .join(', ');
    const deadSummary = this.players
      .filter(p => this.assignments[p.id] && this.assignments[p.id].isDead)
      .map(p => `${p.name}(${this.assignments[p.id].currentRole})`)
      .join(', ') || 'none';
    this.logBotEvent('System', 'DayStart', `day#${this.dayCount}`,
      `Alive: [${aliveSummary || 'nobody'}] | Dead: [${deadSummary}]`);

    // Dawn-time reminders: the night-time toast notice has already expired by now,
    // so re-emit a fresh private notice to anyone whose day chat is locked.
    // This is the moment the player is actually looking at day-chat UI.
    this.silencedNextDay.forEach((silencedId) => {
      if (!this.hasLiveAssignment(silencedId)) return;
      this.emitPrivateNotice(silencedId, {
        type: 'spellcasterDawn',
        title: 'Your Tongue Is Bound',
        message: 'A Spellcaster silenced you. You cannot speak in town chat today.',
      });
    });
    this.banishedNextDay.forEach((banishedId) => {
      if (!this.hasLiveAssignment(banishedId)) return;
      this.emitPrivateNotice(banishedId, {
        type: 'oldHagDawn',
        title: 'You Have Been Banished',
        message: 'The Old Hag drove you from the village. You cannot speak or vote today.',
      });
    });

    this.broadcastState();

    this.startPhaseTimer(this.settings.discussionLength, () => this.startAccusation());
  }

  skipDay(socketId) {
    const p = this.players.find(x => x.socketId === socketId);
    if (p && p.isHost && this.phase === 'day') {
      this.clearTimer();
      this.startAccusation();
    }
  }

  // Host escape hatch for the night, matching the skip controls the day phases
  // already have. Abandons the rest of the wake queue and breaks for dawn.
  skipNight(socketId) {
    const p = this.players.find(x => x.socketId === socketId);
    if (!p || !p.isHost || this.phase !== 'night') return false;
    this.clearTimer();
    this.pendingNightResultAcks = {};
    this.nightQueue = [];
    this.logEvent('The host hastened the dawn.');
    this.logBotEvent('System', 'Night', 'host-skip',
      `Host ended night ${this.dayCount} early.`);
    this.startDay();
    return true;
  }

  // === Phase: accusation ===
  // Players each cast one accusation vote (or skip). The single top-vote-getter
  // becomes the accused and is moved to the defense phase. Ties or no votes
  // mean no one is accused — night begins.
  startAccusation() {
    this.clearTimer();
    this.phase = 'accusation';
    this.accusationVotes = {};
    this.trialVotes = {};
    this.accusedId = null;
    this.timeLeft = this.settings.accusationLength;
    this.logBotEvent('System', 'Accusation', 'start',
      `D${this.dayCount} | duration: ${this.timeLeft}s`);
    this.broadcastState();
    this.scheduleBotAccusations();

    this.startPhaseTimer(this.settings.accusationLength, () => this.resolveAccusation());
  }

  handleVote(socketId, targetId) {
    if (this.phase === 'accusation') return this.handleAccusation(socketId, targetId);
  }

  getVotingPlayers() {
    // Banished players (Old Hag) cannot vote during the day, so they must NOT count
    // toward the "everyone has voted" early-resolve check — otherwise the accusation
    // phase waits forever for a vote that will never come.
    return this.players.filter(p =>
      p.connected
      && !this.assignments[p.id]?.isDead
      && !this.banishedNextDay.has(p.id));
  }

  handleAccusation(socketId, targetId) {
    const pInfo = this.players.find(p => p.socketId === socketId);
    if (!pInfo) return;

    const pid = pInfo.id;
    if (this.phase !== 'accusation' || this.assignments[pid]?.isDead) return;
    if (Object.prototype.hasOwnProperty.call(this.accusationVotes, pid)) return;
    // Banished (Old Hag) and silenced (Spellcaster) players cannot accuse.
    if (this.banishedNextDay.has(pid)) return;

    const submittedTarget = targetId;
    const isSkipVote = submittedTarget === SKIP_VOTE;
    if (!submittedTarget || (!isSkipVote && !this.hasLiveAssignment(submittedTarget))) return;
    if (!isSkipVote && submittedTarget === pid) return; // can't accuse self

    this.accusationVotes[pid] = isSkipVote ? SKIP_VOTE : submittedTarget;

    // Track cumulative accusations against each target across days. When a
    // Vampire-marked player crosses into a 2nd accusation total, they die.
    if (!isSkipVote) {
      this.accusationCounts[submittedTarget] = (this.accusationCounts[submittedTarget] || 0) + 1;
      if (this.vampireMarks[submittedTarget] && this.accusationCounts[submittedTarget] >= 2) {
        const vampireId = this.vampireMarks[submittedTarget];
        delete this.vampireMarks[submittedTarget];
        if (this.hasLiveAssignment(submittedTarget)) {
          const killed = new Set();
          if (this.markPlayerDead(submittedTarget, killed)) {
            this.logEvent(`The Vampire's mark consumed ${this.getPlayerName(submittedTarget)} as the second accusation fell.`);
            this.logBotEvent('System', 'Vampire', 'mark_kill',
              `${this.getPlayerName(submittedTarget)} died on 2nd accusation; vampire=${this.getPlayerName(vampireId)}`);
            if (this.checkWinConditions([...killed], 'vampire')) return;
          }
        }
      }
    }

    this.broadcastState();

    const aliveVoters = this.getVotingPlayers();
    if (aliveVoters.every(p => Object.prototype.hasOwnProperty.call(this.accusationVotes, p.id))) {
      this.clearTimer();
      this.resolveAccusation();
    }
  }

  scheduleBotAccusations() {
    const voters = this.getVotingPlayers().filter(p => this.isBotPlayer(p));
    if (voters.length === 0) return;
    voters.forEach((voter, idx) => {
      const delay = 2000 + idx * 800 + Math.floor(Math.random() * 600);
      this.scheduleBotTimer(() => {
        if (this.phase !== 'accusation') return;
        if (Object.prototype.hasOwnProperty.call(this.accusationVotes, voter.id)) return;
        const candidates = this.getVotingPlayers()
          .filter(p => p.id !== voter.id && !this.isVoteImmune(p.id))
          .map(p => p.id);
        let target;
        const myAssignment = this.assignments[voter.id];
        const myRole = myAssignment ? myAssignment.currentRole : null;
        if (this.isWerewolfRole(myRole)) {
          const wolves = new Set(this.getNightWerewolfIds());
          const nonWolves = candidates.filter(id => !wolves.has(id));
          target = this.pickRandom(nonWolves.length > 0 ? nonWolves : candidates);
        } else {
          target = this.pickRandom(candidates);
        }
        if (!target) target = SKIP_VOTE;
        this.logBotEvent(voter.name, myRole || '?', 'accuse',
          target === SKIP_VOTE ? 'skipped' : `accused ${this.getPlayerName(target)}`);
        this.handleAccusation(voter.socketId, target);
      }, delay);
    });
  }

  resolveAccusation() {
    this.clearTimer();
    const counts = this.getVoteCounts(this.accusationVotes);
    const tally = Object.entries(counts)
      .map(([id, c]) => `${this.getPlayerName(id)}=${c}`)
      .join(', ') || 'no votes received';
    const skipCount = Object.values(this.accusationVotes).filter(v => v === SKIP_VOTE).length;

    let topId = null;
    let topVotes = 0;
    let tied = false;
    for (const [id, c] of Object.entries(counts)) {
      if (c > topVotes) { topId = id; topVotes = c; tied = false; }
      else if (c === topVotes && c > 0) { tied = true; }
    }

    this.logBotEvent('System', 'Accusation', 'tally',
      `D${this.dayCount} | counts: ${tally} | skips: ${skipCount} | accused: ${topId && !tied ? this.getPlayerName(topId) : 'none'}`);

    if (!topId || tied || topVotes <= 0) {
      this.logEvent('No one was accused. Night falls.');
      this.advanceToNight();
      return;
    }

    this.accusedId = topId;
    this.startDefense();
  }

  // === Phase: defense ===
  // The accused player has the floor — host can skip if they finish quickly.
  startDefense() {
    this.clearTimer();
    this.phase = 'defense';
    this.timeLeft = this.settings.defenseLength;
    const name = this.getPlayerName(this.accusedId);
    this.logEvent(`${name} stands accused and may now defend themselves.`);
    this.logBotEvent('System', 'Defense', 'start',
      `Accused: ${name} | duration: ${this.timeLeft}s`);
    this.broadcastState();

    this.startPhaseTimer(this.settings.defenseLength, () => this.startTrial());
  }

  skipDefense(socketId) {
    const p = this.players.find(x => x.socketId === socketId);
    if (p && p.isHost && this.phase === 'defense') {
      this.clearTimer();
      this.logBotEvent('System', 'Defense', 'skipped', 'Host advanced to trial.');
      this.startTrial();
    }
  }

  skipAccusation(socketId) {
    const p = this.players.find(x => x.socketId === socketId);
    if (p && p.isHost && this.phase === 'accusation') {
      this.clearTimer();
      this.logBotEvent('System', 'Accusation', 'skipped', 'Host force-tallied accusations.');
      this.resolveAccusation();
    }
  }

  skipTrial(socketId) {
    const p = this.players.find(x => x.socketId === socketId);
    if (p && p.isHost && this.phase === 'trial') {
      this.clearTimer();
      this.logBotEvent('System', 'Trial', 'skipped', 'Host force-tallied the trial.');
      this.resolveTrial();
    }
  }

  // === Phase: trial ===
  // Living players (except the accused) vote Eliminate or Save.
  startTrial() {
    this.clearTimer();
    this.phase = 'trial';
    this.trialVotes = {};
    this.timeLeft = this.settings.trialLength;
    const name = this.getPlayerName(this.accusedId);
    this.logBotEvent('System', 'Trial', 'start',
      `Voting on ${name} | duration: ${this.timeLeft}s`);
    this.broadcastState();
    this.scheduleBotTrialVotes();

    this.startPhaseTimer(this.settings.trialLength, () => this.resolveTrial());
  }

  getTrialVoters() {
    return this.players.filter(p => this.isEligibleTrialVoter(p.id));
  }

  isEligibleTrialVoter(playerId) {
    const player = this.players.find(p => p.id === playerId);
    return !!(
      player
      && player.connected
      && this.hasLiveAssignment(playerId)
      && playerId !== this.accusedId
      // Banished players (Old Hag) cannot vote at trial either — skip them so the
      // "everyone has voted" check resolves without their input.
      && !this.banishedNextDay.has(playerId)
    );
  }

  sanitizeTrialVotes() {
    Object.keys(this.trialVotes).forEach((voterId) => {
      if (!this.isEligibleTrialVoter(voterId)) {
        delete this.trialVotes[voterId];
      }
    });
  }

  countTrialVotes() {
    this.sanitizeTrialVotes();
    let eliminate = 0;
    let save = 0;
    Object.entries(this.trialVotes).forEach(([voterId, choice]) => {
      if (!this.isEligibleTrialVoter(voterId)) return;
      const weight = this.assignments[voterId]?.currentRole === 'Mayor' ? 2 : 1;
      if (choice === 'eliminate') eliminate += weight;
      else if (choice === 'save') save += weight;
    });
    return { eliminate, save };
  }

  handleTrialVote(socketId, choice) {
    const pInfo = this.players.find(p => p.socketId === socketId);
    if (!pInfo) return;
    const pid = pInfo.id;
    if (this.phase !== 'trial' || !this.isEligibleTrialVoter(pid)) return;
    if (Object.prototype.hasOwnProperty.call(this.trialVotes, pid)) return;
    if (choice !== 'eliminate' && choice !== 'save') return;
    // Banished players (Old Hag) cannot vote.
    if (this.banishedNextDay.has(pid)) return;

    const role = this.assignments[pid]?.currentRole;
    // Pacifist is forced to Save. Village Idiot is forced to Eliminate.
    let finalChoice = choice;
    if (role === 'Pacifist') finalChoice = 'save';
    else if (role === 'Village Idiot') finalChoice = 'eliminate';
    this.trialVotes[pid] = finalChoice;
    this.broadcastState();

    const voters = this.getTrialVoters();
    if (voters.every(p => Object.prototype.hasOwnProperty.call(this.trialVotes, p.id))) {
      this.clearTimer();
      this.resolveTrial();
    }
  }

  scheduleBotTrialVotes() {
    const voters = this.getTrialVoters().filter(p => this.isBotPlayer(p));
    if (voters.length === 0) return;
    const accusedRole = this.assignments[this.accusedId]?.currentRole;
    voters.forEach((voter, idx) => {
      const delay = 1500 + idx * 700 + Math.floor(Math.random() * 500);
      this.scheduleBotTimer(() => {
        if (this.phase !== 'trial') return;
        if (Object.prototype.hasOwnProperty.call(this.trialVotes, voter.id)) return;
        const myRole = this.assignments[voter.id]?.currentRole;
        let choice;
        if (this.isVoteImmune(this.accusedId)) {
          choice = 'save';
        } else if (myRole === 'Pacifist') {
          choice = 'save';
        } else if (this.isWerewolfRole(myRole)) {
          choice = this.isWolfTeamRole(accusedRole) ? 'save' : 'eliminate';
        } else {
          // Villagers / neutrals lean toward eliminating someone the village suspects.
          choice = Math.random() < 0.65 ? 'eliminate' : 'save';
        }
        this.logBotEvent(voter.name, myRole || '?', 'trial', `voted ${choice}`);
        this.handleTrialVote(voter.socketId, choice);
      }, delay);
    });
  }

  resolveTrial() {
    this.clearTimer();
    const { eliminate, save } = this.countTrialVotes();
    const accusedName = this.getPlayerName(this.accusedId);
    this.logBotEvent('System', 'Trial', 'tally',
      `Eliminate: ${eliminate} | Save: ${save} | Accused: ${accusedName}`);

    if (eliminate > save) {
      this.executeTrialElimination();
    } else {
      this.logEvent(`The village voted to spare ${accusedName}.`);
      this.logBotEvent('System', 'Trial', 'spared', `${accusedName} was saved.`);
      this.accusedId = null;
      this.advanceToNight();
    }
  }

  pickExecutionScene() {
    const enabled = Array.isArray(this.settings.executionScenes) && this.settings.executionScenes.length > 0
      ? this.settings.executionScenes
      : ['tentacles', 'cthulhu_abyss', 'thunder', 'void', 'bees', 'bees_v2'];
    return enabled[Math.floor(Math.random() * enabled.length)];
  }

  getExecutionSceneDuration(sceneType) {
    // Cinematic-length scenes get a longer window for their full choreography.
    if (sceneType === 'cthulhu_abyss') return 16000; // 16s mapped to the 8s-24s window of cthulhu-custom.mp3
    if (sceneType === 'bees_v2') return 14000;       // 14s "poke the hive" sequence
    return 4500;
  }

  executeTrialElimination() {
    const killed = new Set();
    const targetId = this.accusedId;
    const targetName = this.getPlayerName(targetId);
    const targetRole = this.assignments[targetId]?.currentRole || '?';

    if (this.isVoteImmune(targetId)) {
      this.logEvent(`Votes against the Prince do not eliminate the Prince. ${targetName}'s role is revealed.`);
      this.revealedCards[targetId] = 'Prince';
      this.applyRoleChange(targetId, 'Villager'); // Sparing Prince becomes a Villager (so 2nd time kills them)
      this.accusedId = null;
      if (!this.checkWinConditions([...killed], 'vote')) this.advanceToNight();
      return;
    }
    if (this.absorbBodyguardLife(targetId, 'vote')) {
      this.logBotEvent('System', 'Trial', 'absorbed',
        `Bodyguard armor on ${targetName} (${targetRole}) absorbed the vote.`);
      this.accusedId = null;
      if (!this.checkWinConditions([...killed], 'vote')) this.advanceToNight();
      return;
    }

    const sceneType = this.pickExecutionScene();
    const sceneDuration = this.getExecutionSceneDuration(sceneType);
    try {
      this.roomIo.emit('executionScene', {
        type: sceneType,
        accusedId: targetId,
        victimName: targetName,
        duration: sceneDuration,
      });
    } catch { /* noop */ }

    this.clearTimer();
    this.timer = setTimeout(() => {
      const eliminatedRole = this.assignments[targetId]?.currentRole;
      if (this.markPlayerDead(targetId, killed)) {
        this.logEvent(`The village eliminated ${targetName}.`);
        this.logBotEvent('System', 'Trial', 'eliminated',
          `${targetName} (${targetRole}) was eliminated via ${sceneType}.`);

        if (eliminatedRole === 'Hunter') {
          this.pendingHunterRevenge = targetId;
          this.pendingHunterRevengeKills = [...killed];
          this.accusedId = null;
          this.logEvent(`${targetName} was the Hunter — they may immediately take another player down.`);
          this.emitPrivateNotice(targetId, {
            type: 'hunterRevenge',
            title: 'Final Shot',
            message: 'You were eliminated. Choose a player to take with you, or pass.',
          });
          this.broadcastState();
          return;
        }
      }
      this.accusedId = null;
      if (!this.checkWinConditions([...killed], 'vote')) {
        this.advanceToNight();
      }
    }, sceneDuration);

    this.broadcastState();
  }

  moderatorExecute(socketId, targetId) {
    if (!this.isHostSocket(socketId)) return;
    if (this.phase === 'lobby' || this.phase === 'end') return;
    if (!this.hasLiveAssignment(targetId)) return;

    const targetName = this.getPlayerName(targetId);
    const targetRole = this.assignments[targetId]?.currentRole || '?';
    const killed = new Set();

    this.clearTimer();

    const sceneDuration = this.getExecutionSceneDuration('cthulhu_abyss');
    try {
      this.roomIo.emit('executionScene', {
        type: 'cthulhu_abyss',
        accusedId: targetId,
        victimName: targetName,
        duration: sceneDuration,
      });
    } catch { /* noop */ }

    this.accusedId = targetId;
    this.broadcastState();

    this.timer = setTimeout(() => {
      const eliminatedRole = this.assignments[targetId]?.currentRole;
      if (this.markPlayerDead(targetId, killed)) {
        this.logEvent(`[Moderator Action] ${targetName} was executed by the moderator.`);
        this.logBotEvent('System', 'ModeratorAction', 'executed',
          `${targetName} (${targetRole}) was executed via cthulhu_abyss.`);

        if (eliminatedRole === 'Hunter') {
          this.pendingHunterRevenge = targetId;
          this.pendingHunterRevengeKills = [...killed];
          this.accusedId = null;
          this.logEvent(`${targetName} was the Hunter — they may immediately take another player down.`);
          this.emitPrivateNotice(targetId, {
            type: 'hunterRevenge',
            title: 'Final Shot',
            message: 'You were eliminated. Choose a player to take with you, or pass.',
          });
          this.broadcastState();
          return;
        }
      }
      
      this.accusedId = null;
      if (!this.checkWinConditions([...killed], 'vote')) {
        this.advanceToNight();
      }
    }, sceneDuration);

    this.broadcastState();
  }

  resolveHunterRevenge(socketId, targetId) {
    const hunterId = this.pendingHunterRevenge;
    if (!hunterId) return;
    const pInfo = this.players.find(p => p.socketId === socketId);
    if (!pInfo || pInfo.id !== hunterId) return;

    const killed = new Set(this.pendingHunterRevengeKills || []);
    this.pendingHunterRevenge = null;
    this.pendingHunterRevengeKills = null;

    if (targetId && targetId !== SKIP_VOTE && this.hasLiveAssignment(targetId)) {
      if (this.markPlayerDead(targetId, killed)) {
        this.logEvent(`The Hunter's final shot killed ${this.getPlayerName(targetId)}.`);
      }
    } else {
      this.logEvent('The Hunter chose not to take anyone with them.');
    }

    if (!this.checkWinConditions([...killed], 'vote')) {
      this.advanceToNight();
    }
  }

  // Shared transition used by accusation/trial paths when no execution occurs
  // or when the trial result didn't end the game.
  advanceToNight() {
    this.dayCount += 1;
    this.logEvent(`Night ${this.dayCount} falls.`);
    this.clearTimer();
    this.timer = setTimeout(() => this.startNight(), 3000);
    this.broadcastState();
  }

  getVoteCounts(voteMap = this.accusationVotes) {
    const counts = {};
    Object.entries(voteMap).forEach(([voterId, targetId]) => {
      if (targetId === SKIP_VOTE) return;
      if (this.hasLiveAssignment(targetId)) {
        const weight = this.assignments[voterId]?.currentRole === 'Mayor' ? 2 : 1;
        counts[targetId] = (counts[targetId] || 0) + weight;
      }
    });
    return counts;
  }

  resolveSingleVoteWinner(voteMap) {
    const counts = this.getVoteCounts(voteMap);
    let max = 0;
    let top = [];

    for (const [id, count] of Object.entries(counts)) {
      if (count > max) {
        max = count;
        top = [id];
      } else if (count === max) {
        top.push(id);
      }
    }

    return top.length === 1 ? top[0] : null;
  }

  isVoteImmune(playerId) {
    return this.assignments[playerId]?.currentRole === 'Prince';
  }

  checkWinConditions(killedIds = [], source = 'vote') {
    const killed = new Set(Array.isArray(killedIds) ? killedIds : [killedIds].filter(Boolean));
    const alivePlayers = this.players.filter(p => this.assignments[p.id] && !this.assignments[p.id].isDead);
    const aliveWerewolves = alivePlayers.filter(p => this.isWerewolfRole(this.assignments[p.id].currentRole));
    const aliveWolfTeam = alivePlayers.filter(p => this.isWolfTeamRole(this.assignments[p.id].currentRole));
    const aliveNonWerewolves = alivePlayers.filter(p => !this.isWolfTeamRole(this.assignments[p.id].currentRole));
    // Tanner only wins when eliminated by the village vote.
    // Being killed at night by werewolves does NOT count as a Tanner victory.
    const tannerKilled = source === 'vote'
      && [...killed].some(id => this.assignments[id]?.currentRole === 'Tanner');

    // Lone Wolf wins only as the last living player (overrides standard wolf win).
    const aliveLoneWolves = alivePlayers.filter(p => this.assignments[p.id]?.currentRole === 'Lone Wolf');
    if (aliveLoneWolves.length === 1 && alivePlayers.length === 1) {
      this.winner = `Lone Wolf Wins! ${aliveLoneWolves[0].name} was the last one standing.`;
    } else if (this.checkCultWin()) {
      this.winner = `Cult Wins! ${this.getPlayerName(this.cultLeaderId)}'s cult absorbed the village.`;
    } else if (tannerKilled && aliveWerewolves.length === 0) {
      this.winner = 'Tanner and Village Win! The Tanner died, and all Werewolves were eliminated.';
    } else if (tannerKilled) {
      this.winner = 'Tanner Wins! The Tanner was successfully eliminated.';
    } else if (aliveWerewolves.length === 0) {
      this.winner = 'Village Wins! All Werewolves were eliminated.';
    } else if (aliveWerewolves.length > 0 && aliveWolfTeam.length >= aliveNonWerewolves.length) {
      // If only a Lone Wolf remains on the wolf side, fall through — Lone Wolf
      // doesn't share a win with the rest of the pack.
      if (aliveLoneWolves.length === aliveWerewolves.length && alivePlayers.length > 1) {
        return false;
      }
      this.winner = 'Werewolves Win! They equal or outnumber the village.';
    } else {
      return false;
    }

    // Yandere personal-win check: if the Yandere is alive at game end AND their
    // obsession is also alive, they piggyback on the win with a personal banner.
    // (The faction win line is preserved above; this only appends a second sentence.)
    const yandereVictors = this.players.filter(p =>
      !this.assignments[p.id]?.isDead
      && this.assignments[p.id]?.originalRole === 'Yandere'
      && this.yanderObs[p.id]
      && this.hasLiveAssignment(this.yanderObs[p.id])
    );
    if (yandereVictors.length > 0) {
      const banners = yandereVictors.map(y => {
        const obsName = this.getPlayerName(this.yanderObs[y.id]);
        return `${y.name} (Yandere) keeps their obsession ${obsName} alive`;
      });
      this.winner = `${this.winner} • ${banners.join(' • ')}.`;
    }

    // Detailed end-of-game snapshot for the host debug console.
    const fmt = (p) => `${p.name}(${this.assignments[p.id]?.currentRole || '?'})`;
    const aliveList = alivePlayers.map(fmt).join(', ') || 'none';
    const deadList = this.players
      .filter(p => this.assignments[p.id]?.isDead)
      .map(fmt)
      .join(', ') || 'none';
    const killList = [...killed]
      .map(id => `${this.getPlayerName(id)}(${this.assignments[id]?.currentRole || '?'})`)
      .join(', ') || 'none';
    this.logBotEvent('System', 'WinCheck', `win:${source}`,
      `Reason: ${this.winner} | killedByThisStep: ${killList} | aliveWolves: ${aliveWerewolves.length} | aliveNonWolves: ${aliveNonWerewolves.length} | alive: [${aliveList}] | dead: [${deadList}]`);

    this.phase = 'end';
    this.currentNightAction = null;
    this.currentNightActors = [];
    this.pendingNightResultAcks = {};
    this.clearAllTimers();
    this.broadcastState();
    return true;
  }

  canUseWerewolfChat(socketId) {
    const player = this.players.find(p => p.socketId === socketId);
    return !!player
      && this.phase === 'night'
      && this.currentNightAction === 'Werewolf'
      && this.getActorRoleFor(player.id, 'Werewolf') === 'Werewolf';
  }

  getWerewolfChatPlayers() {
    return this.players.filter(p => p.connected && this.getActorRoleFor(p.id, 'Werewolf') === 'Werewolf');
  }

  canUseVillagerChat(socketId) {
    if (!this.settings.enableVillagerChat) return false;
    const player = this.players.find(p => p.socketId === socketId);
    if (!player) return false;
    const dayPhases = ['day', 'accusation', 'defense', 'trial'];
    if (!dayPhases.includes(this.phase)) return false;
    const assignment = this.assignments[player.id];
    if (assignment && assignment.isDead) return false;
    // Spellcaster silence + Old Hag banish both mute the day chat.
    if (this.silencedNextDay.has(player.id)) return false;
    if (this.banishedNextDay.has(player.id)) return false;
    return true;
  }

  // ── Ghost chat: every player who has died gains the ghost-chat ability.
  // They may post a single letter at a time, visible to the whole room, during
  // any of the day phases. (Pre-overhaul: only a dead Ghost-original-role could
  // speak. Now: ghost is conferred-by-death, not a deck role.)
  canUseGhostChat(socketId) {
    const player = this.players.find(p => p.socketId === socketId);
    if (!player) return false;
    const dayPhases = ['day', 'accusation', 'defense', 'trial'];
    if (!dayPhases.includes(this.phase)) return false;
    const assignment = this.assignments[player.id];
    if (!assignment) return false;
    if (!assignment.isDead) return false;
    return true;
  }

  // ── Jailer Interrogation Chat ──
  handleJailerMessage(socketId, rawText) {
    const pInfo = this.players.find(p => p.socketId === socketId);
    if (!pInfo) return;
    const pid = pInfo.id;
    
    if (!this.jailerChatActive) return;
    if (pid !== this.jailerActorId && pid !== this.jailerTargetId) return;
    
    const text = typeof rawText === 'string' ? rawText.trim().slice(0, 280) : '';
    if (!text) return;
    
    const sender = (pid === this.jailerActorId) ? 'Jailer' : pInfo.name;
    
    this.jailerChatMessages.push({
      sender,
      text,
      ts: Date.now()
    });
    
    this.broadcastState();
  }

  endJailerInterrogation() {
    if (!this.jailerChatActive) return;
    
    if (this.jailerChatTimer) {
      clearTimeout(this.jailerChatTimer);
      this.jailerChatTimer = null;
    }
    
    this.jailerChatActive = false;
    const jailerId = this.jailerActorId;
    this.jailerActorId = null;
    this.jailerTargetId = null;
    this.jailerChatMessages = [];
    this.jailerChatExpiresAt = null;
    
    if (jailerId) {
      this.finishNightAction(jailerId);
    }
    this.broadcastState();
  }
}

module.exports = GameEngine;
