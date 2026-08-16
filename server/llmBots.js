// ─────────────────────────────────────────────────────────────
// LLM-backed bots (DeepSeek)
//
// The whole design rests on one rule: a bot is handed exactly the payload a
// human sitting in that seat would receive — the output of getSanitizedState —
// and nothing else. It therefore cannot see a role it has not earned, cannot
// read the wolf chat it is not in, and cannot know who the Seer checked. The
// engine's existing information boundary is the bot's information boundary,
// which means no separate "don't cheat" logic has to be trusted.
//
// Everything here is best-effort. Any failure — no key, a timeout, malformed
// output, an answer naming a player who does not exist — returns null, and the
// caller falls back to the heuristic bot. A game must never stall or break
// because a third-party API had a bad minute.
// ─────────────────────────────────────────────────────────────

'use strict';

// `deepseek-chat` and `deepseek-reasoner` were retired on 2026-07-24; the
// current line is deepseek-v4-flash (fast, cheap) and deepseek-v4-pro.
const DEFAULT_MODEL = 'deepseek-v4-flash';
const DEFAULT_BASE_URL = 'https://api.deepseek.com';

// A night wake is only ~15s long, so a decision that takes longer than this is
// worthless even if it eventually arrives.
const REQUEST_TIMEOUT_MS = 6000;
const MAX_OUTPUT_TOKENS = 220;

// After repeated failures, stop paying the timeout on every single decision.
const BREAKER_THRESHOLD = 3;
const BREAKER_COOLDOWN_MS = 60000;

const PERSONAS = [
  'blunt and impatient, states conclusions as facts',
  'cautious and hedging, thinks out loud before committing',
  'warm and chatty, tries to build alliances',
  'quiet and analytical, speaks rarely but points at contradictions',
  'theatrical and suspicious of everyone, enjoys the drama',
  'folksy and disarming, hides sharp reasoning behind small talk',
];

function config() {
  return {
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    baseUrl: (process.env.DEEPSEEK_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, ''),
    model: process.env.NIGHTFALL_LLM_MODEL || DEFAULT_MODEL,
    // Chatter costs a call per bot per day, so it is opt-in separately.
    chatter: process.env.NIGHTFALL_LLM_CHATTER !== '0',
  };
}

function isEnabled() {
  return !!config().apiKey;
}

function personaFor(playerId) {
  let h = 0;
  for (let i = 0; i < String(playerId).length; i++) h = (h * 31 + String(playerId).charCodeAt(i)) >>> 0;
  return PERSONAS[h % PERSONAS.length];
}

// ── Circuit breaker ──────────────────────────────────────────
let consecutiveFailures = 0;
let breakerOpenUntil = 0;

function breakerOpen() {
  return Date.now() < breakerOpenUntil;
}
function noteFailure() {
  consecutiveFailures += 1;
  if (consecutiveFailures >= BREAKER_THRESHOLD) {
    breakerOpenUntil = Date.now() + BREAKER_COOLDOWN_MS;
    consecutiveFailures = 0;
  }
}
function noteSuccess() {
  consecutiveFailures = 0;
}

// Injectable so tests never touch the network.
let transport = defaultTransport;
function setTransport(fn) { transport = fn || defaultTransport; }

async function defaultTransport(body, { apiKey, baseUrl }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function ask(messages, { json = true } = {}) {
  const cfg = config();
  if (!cfg.apiKey || breakerOpen()) return null;

  const body = {
    model: cfg.model,
    messages,
    max_tokens: MAX_OUTPUT_TOKENS,
    temperature: 1.0,
  };
  if (json) body.response_format = { type: 'json_object' };

  const content = await transport(body, cfg);
  if (!content) { noteFailure(); return null; }
  noteSuccess();
  return content;
}

// ── Prompt construction ──────────────────────────────────────

// Renders the seat's own sanitized state as something readable. Only fields the
// player legitimately has are present, because that is all the state contains.
function describeView(view, selfName) {
  if (!view) return '';
  const living = (view.players || []).filter(p => !p.isDead).map(p => p.name);
  const dead = (view.players || []).filter(p => p.isDead)
    .map(p => `${p.name}${p.revealedRole ? ` (was ${p.revealedRole})` : ''}`);
  const known = (view.players || [])
    .filter(p => p.revealedRole && !p.isDead && p.name !== selfName)
    .map(p => `${p.name} is ${p.revealedRole}`);

  const lines = [
    `You are ${selfName}.`,
    `Your card: ${view.myCurrentRole || view.myOriginalRole || 'unknown'}.`,
    `It is day ${view.dayCount}, phase "${view.phase}".`,
    `Still alive: ${living.join(', ') || 'nobody'}.`,
    `Dead: ${dead.join(', ') || 'nobody yet'}.`,
  ];
  if (known.length) lines.push(`You know for certain: ${known.join('; ')}.`);
  if (view.accusedId) {
    const accused = (view.players || []).find(p => p.id === view.accusedId);
    if (accused) lines.push(`${accused.name} is on trial right now.`);
  }
  const crier = (view.eventLog || []).slice(-6).map(e => e.text).filter(Boolean);
  if (crier.length) lines.push(`Recent events:\n- ${crier.join('\n- ')}`);
  return lines.join('\n');
}

const RULES = `Nightfall is a social deduction game. Werewolves secretly kill one villager each night. During the day everyone argues and votes to hang someone. Villagers win by hanging every werewolf; werewolves win once they equal or outnumber everyone else. Lying is expected and encouraged if you are a werewolf.`;

function systemPrompt(persona) {
  return `You are playing a game of Nightfall as one of the players. ${RULES}

Your personality: ${persona}.

You only know what you are told. Never claim knowledge you were not given. Play to win for your own side. Keep reasoning to one short sentence.`;
}

// ── Decisions ────────────────────────────────────────────────

/**
 * Picks one option. Returns { target, reason } or null.
 * The returned target is always one of `options` — anything else is discarded,
 * so a confused or adversarial model can never move the game somewhere illegal.
 */
async function chooseTarget({ view, selfName, playerId, task, options }) {
  if (!options || options.length === 0) return null;

  const roster = options.map(o => `- ${o.id}: ${o.label}`).join('\n');
  const content = await ask([
    { role: 'system', content: systemPrompt(personaFor(playerId)) },
    {
      role: 'user',
      content: `${describeView(view, selfName)}

${task}

Choose exactly one of these, by id:
${roster}

Reply as JSON: {"id": "<one id from the list>", "reason": "<one short sentence>"}`,
    },
  ]);
  if (!content) return null;

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }
  const picked = options.find(o => o.id === parsed?.id);
  if (!picked) return null;
  return {
    target: picked.id,
    reason: typeof parsed.reason === 'string' ? parsed.reason.slice(0, 160) : '',
  };
}

/** One line of table talk. Returns a string or null. */
async function chooseChatLine({ view, selfName, playerId }) {
  if (!config().chatter) return null;
  const content = await ask([
    { role: 'system', content: systemPrompt(personaFor(playerId)) },
    {
      role: 'user',
      content: `${describeView(view, selfName)}

Say one thing to the village. Accuse someone, defend yourself, share a read, or ask a question. Stay in character. One or two sentences, no more than 180 characters. Do not use quotation marks or your own name.

Reply as JSON: {"say": "<your line>"}`,
    },
  ]);
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    const say = typeof parsed?.say === 'string' ? parsed.say.trim() : '';
    if (!say) return null;
    return say.replace(/^["']|["']$/g, '').slice(0, 180);
  } catch {
    return null;
  }
}

module.exports = {
  isEnabled,
  chooseTarget,
  chooseChatLine,
  personaFor,
  config,
  // Test seams.
  setTransport,
  describeView,
  _resetBreaker() { consecutiveFailures = 0; breakerOpenUntil = 0; },
  _breakerOpen: breakerOpen,
};
