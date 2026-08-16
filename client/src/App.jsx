import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  BadgeQuestionMark,
  BedDouble,
  Beer,
  BookOpen,
  Bot,
  Terminal,
  Trash2,
  X,
  Castle,
  Church,
  CircleDot,
  Compass,
  Copy,
  Crosshair,
  Crown,
  Eye,
  FastForward,
  Gem,
  Globe,
  Hammer,
  Hand,
  HandCoins,
  Lock,
  Unlock,
  LogOut,
  Moon,
  PawPrint,
  Play,
  Repeat,
  Rocket,
  ScrollText,
  Send,
  Settings,
  ShieldCheck,
  Shuffle,
  Skull,
  Sparkles,
  Stars,
  Sun,
  Swords,
  Target,
  Telescope,
  Users,
  UtensilsCrossed,
  VenetianMask,
  Volume2,
  VolumeX,
  Vote,
  WandSparkles,
  Wheat,
} from 'lucide-react';

const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.DEV ? 'http://localhost:3001' : undefined);
const socket = io(socketUrl);
const SKIP_VOTE = '__SKIP_VOTE__';

const getStoredValue = (key) => {
  if (typeof localStorage === 'undefined') return '';
  return localStorage.getItem(key) || '';
};

const getOrCreatePlayerId = () => {
  if (typeof localStorage === 'undefined') return Math.random().toString(36).substring(2, 15);

  let storedPlayerId = localStorage.getItem('ww_playerId');
  if (!storedPlayerId) {
    storedPlayerId = Math.random().toString(36).substring(2, 15);
    localStorage.setItem('ww_playerId', storedPlayerId);
  }
  return storedPlayerId;
};

/* Pre-computed ember field — generated once at module load for stable positions */
const EMBER_FIELD = Array.from({ length: 22 }).map(() => ({
  x: `${Math.random() * 100}%`,
  delay: `${(Math.random() * 14).toFixed(2)}s`,
  dur: `${(10 + Math.random() * 12).toFixed(2)}s`,
  drift: `${(Math.random() * 80 - 40).toFixed(0)}px`,
  size: 3 + Math.random() * 3,
}));

/* ─── Atmospheric particle field ─── */
const AmbientEmbers = () => (
  <>
    <div className="ambient-mist" aria-hidden="true" />
    <div className="ambient-embers" aria-hidden="true">
      {EMBER_FIELD.map((e, i) => (
        <span
          key={i}
          style={{
            '--x': e.x,
            '--delay': e.delay,
            '--dur': e.dur,
            '--drift': e.drift,
            width: `${e.size}px`,
            height: `${e.size}px`,
          }}
        />
      ))}
    </div>
  </>
);

/* ─── Candles flanking the table ─── */
const Candles = () => {
  const positions = [
    { top: '6%', left: '6%' },
    { top: '6%', right: '6%' },
    { bottom: '6%', left: '6%' },
    { bottom: '6%', right: '6%' },
  ];
  return (
    <div className="candles" aria-hidden="true">
      {positions.map((p, i) => (
        <div className="candle" key={i} style={p}>
          <div className="candle-flame" />
          <div className="candle-base" />
        </div>
      ))}
    </div>
  );
};

/* ─── Circular seat layout around the round table ─── */
const RoundTable =({ players, playerId, phase, isMyTurn, accusedId, tableOverlay, isHost, onKick, jailedPlayerId, executionScene, children }) => {
  const N = Math.max(players.length, 1);
  const radius = 37;
  const tiltMax = 90;

  return (
    <div className={`round-table-wrap phase-${phase}`}>
      <div className="round-table">
        <Candles />
        {tableOverlay && (
          <div className="table-effects-layer">
            {tableOverlay}
          </div>
        )}
        <div className="seat-orbit">
          {players.map((p, i) => {
            const angle = (i / N) * 2 * Math.PI - Math.PI / 2;
            const x = 50 + radius * Math.cos(angle);
            const y = 50 + radius * Math.sin(angle);
            const rotateDeg = -Math.cos(angle) * tiltMax;
            const role = p.isDead
              ? 'dead'
              : !p.connected
                ? 'disconnected'
                : p.isHost
                  ? 'host'
                  : 'connected';
            const isSelf = p.id === playerId;
            const showTurn = isSelf && isMyTurn && phase === 'night';
            const visibleRole = p.revealedRole || null;

            return (
              <div
                key={p.id}
                className="seat-anchor"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: `translate(-50%, -50%) rotate(${rotateDeg}deg)`,
                }}
              >
                <div
                  className={`player-seat ${role} ${isSelf ? 'self' : ''} ${
                    showTurn ? 'active-turn' : ''
                  }`}
                >
                  {isHost && !isSelf && phase === 'lobby' && (
                    <button
                      className="seat-kick-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onKick(p.id);
                      }}
                      title={`Kick ${p.name}`}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        background: '#ef4444',
                        border: 'none',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        zIndex: 10,
                        pointerEvents: 'auto',
                      }}
                    >
                      <X size={10} strokeWidth={3} />
                    </button>
                  )}
                  {isHost && !p.isDead && phase !== 'lobby' && phase !== 'end' && phase !== 'dealing' && (
                    <button
                      className="seat-execute-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Are you sure you want to execute ${p.name} with the custom Cthulhu Abyss animation?`)) {
                          socket.emit('moderatorExecute', p.id);
                        }
                      }}
                      title={`Moderator Execute ${p.name}`}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        background: '#7c3aed',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                        zIndex: 10,
                        pointerEvents: 'auto',
                      }}
                    >
                      <Skull size={11} strokeWidth={2.5} />
                    </button>
                  )}
                  <div
                    className={`seat-avatar-plate ${visibleRole ? 'role-revealed' : ''}`}
                    style={{
                      backgroundImage: visibleRole && getRoleImage(visibleRole)
                        ? `url(${getRoleImage(visibleRole)})`
                        : `url('/card_back.png')`,
                    }}
                  >
                    {jailedPlayerId === p.id && (
                      <div className="seat-cage-overlay">
                        <div className="cage-bar"></div>
                        <div className="cage-bar"></div>
                        <div className="cage-bar"></div>
                        <div className="cage-bar"></div>
                        <div className="cage-bar"></div>
                      </div>
                    )}
                  </div>
                  <div className="seat-plate-footer">
                    <div className="seat-name">
                      <span>{p.name}</span>
                      {p.isHost && (
                        <Crown size={11} className="seat-host-icon" aria-label="Host" />
                      )}
                    </div>
                    <div className="seat-badges">
                      {isSelf && <span className="player-badge you-badge">You</span>}
                      {p.isHost && !isSelf && (
                        <span className="player-badge host-badge">Host</span>
                      )}
                      {!p.connected && <ReconnectBadge deadline={p.reconnectDeadline} />}
                      {(phase === 'vote' || phase === 'accusation' || phase === 'trial') && p.hasVoted && (
                        <span className="player-badge voted-badge">Voted</span>
                      )}
                      {(phase === 'defense' || phase === 'trial') && accusedId === p.id && (
                        <span className="player-badge accused-badge">Accused</span>
                      )}
                    </div>
                  </div>
                  {visibleRole && phase !== 'end' && (
                    <div className="revealed-role-badge">{visibleRole}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="table-center">
          {executionScene ? (
            <div
              className={`jail-stage jail-stage-trial ${
                executionScene.type === 'tentacles' ? 'jail-dragged-tentacles' : ''
              } ${executionScene.type === 'bees' ? 'jail-lifted-bees' : ''} ${
                executionScene.type === 'bees_v2' ? 'jail-swarmed-bees_v2' : ''
              } ${executionScene.type === 'void' ? 'jail-sucked-void' : ''
              } ${executionScene.type === 'thunder' ? 'jail-shattered-thunder' : ''} ${
                executionScene.type === 'cthulhu_abyss' ? 'jail-dragged-cthulhu_abyss' : ''
              }`}
              style={{ '--exec-duration': `${executionScene.duration}ms` }}
            >
              <JailCage name={executionScene.victimName} label="EXECUTED" verdict="doom" />
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Center deck (three fanned card backs, revealed at game end) ─── */
const CenterDeck = ({ centerCards }) => (
  <div className="center-deck" aria-hidden="true">
    {centerCards && centerCards[0] ? (
      <div className="center-card cc-1 revealed" style={{ backgroundImage: `url(${getRoleImage(centerCards[0])})` }}>
        <div className="center-card-label">{centerCards[0]}</div>
      </div>
    ) : (
      <div className="center-card cc-1" />
    )}
    {centerCards && centerCards[1] ? (
      <div className="center-card cc-2 revealed" style={{ backgroundImage: `url(${getRoleImage(centerCards[1])})` }}>
        <div className="center-card-label">{centerCards[1]}</div>
      </div>
    ) : (
      <div className="center-card cc-2" />
    )}
    {centerCards && centerCards[2] ? (
      <div className="center-card cc-3 revealed" style={{ backgroundImage: `url(${getRoleImage(centerCards[2])})` }}>
        <div className="center-card-label">{centerCards[2]}</div>
      </div>
    ) : (
      <div className="center-card cc-3" />
    )}
  </div>
);

const JailCage = ({ name, label = 'ACCUSED', verdict = null }) => {
  const verdictClass = verdict ? `verdict-${verdict}` : '';
  return (
    <div className={`jail-cage ${verdictClass}`} aria-hidden="true">
      <div className="jail-torch jail-torch-left">
        <div className="jail-torch-flame" />
      </div>
      <div className="jail-torch jail-torch-right">
        <div className="jail-torch-flame" />
      </div>
      <svg
        className="jail-svg"
        viewBox="0 0 220 280"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="jailIron" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5a4a3a" />
            <stop offset="50%" stopColor="#2a221c" />
            <stop offset="100%" stopColor="#0e0a08" />
          </linearGradient>
          <linearGradient id="jailBarGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="25%" stopColor="#475569" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="75%" stopColor="#475569" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <radialGradient id="jailBackGrad" cx="0.5" cy="0.5" r="0.7">
            <stop offset="0%" stopColor="rgba(24, 16, 12, 0.95)" />
            <stop offset="70%" stopColor="rgba(12, 8, 6, 0.98)" />
            <stop offset="100%" stopColor="rgba(4, 2, 2, 1)" />
          </radialGradient>
          <linearGradient id="jailIronEdge" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8c878" />
            <stop offset="60%" stopColor="#a08252" />
            <stop offset="100%" stopColor="#5a4422" />
          </linearGradient>
          <linearGradient id="jailWood" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3d2917" />
            <stop offset="100%" stopColor="#1a1009" />
          </linearGradient>
          <radialGradient id="jailGlow" cx="0.5" cy="0.4" r="0.6">
            <stop offset="0%" stopColor="rgba(255,200,120,0.35)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <filter id="jailShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000" floodOpacity="0.7" />
          </filter>
          <pattern id="jailRust" x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="transparent" />
            <circle cx="1" cy="2" r="0.6" fill="rgba(120,60,30,0.55)" />
            <circle cx="4" cy="4" r="0.4" fill="rgba(80,40,20,0.45)" />
          </pattern>
        </defs>

        <rect x="10" y="240" width="200" height="30" rx="3" fill="url(#jailWood)" stroke="url(#jailIronEdge)" strokeWidth="1.5" />
        <rect x="10" y="240" width="200" height="4" fill="rgba(0,0,0,0.55)" />
        <rect x="10" y="266" width="200" height="4" fill="rgba(0,0,0,0.55)" />
        <circle cx="20" cy="255" r="2" fill="url(#jailIronEdge)" />
        <circle cx="200" cy="255" r="2" fill="url(#jailIronEdge)" />

        <ellipse cx="110" cy="160" rx="80" ry="70" fill="url(#jailGlow)" className="jail-inner-glow" />

        <g className="jail-bars-group" filter="url(#jailShadow)">
          <path
            d="M 20 70 Q 110 10 200 70 L 200 245 L 20 245 Z"
            fill="url(#jailBackGrad)"
            stroke="url(#jailIronEdge)"
            strokeWidth="3"
          />
          <path
            d="M 20 70 Q 110 10 200 70"
            fill="none"
            stroke="url(#jailIronEdge)"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Bar shadows cast on the backing */}
          <g stroke="rgba(0, 0, 0, 0.65)" strokeWidth="6" strokeLinecap="round" transform="translate(3, 3)">
            <line x1="42" y1="62" x2="42" y2="245" />
            <line x1="65" y1="50" x2="65" y2="245" />
            <line x1="88" y1="42" x2="88" y2="245" />
            <line x1="110" y1="38" x2="110" y2="245" />
            <line x1="132" y1="42" x2="132" y2="245" />
            <line x1="155" y1="50" x2="155" y2="155" />
            <line x1="155" y1="195" x2="155" y2="245" />
            <line x1="178" y1="62" x2="178" y2="245" />
            <line x1="20" y1="135" x2="200" y2="135" />
            <line x1="20" y1="195" x2="200" y2="195" />
          </g>

          {/* 3D Metallic Bars */}
          <g stroke="url(#jailBarGrad)" strokeWidth="5" strokeLinecap="round">
            <line x1="42" y1="62" x2="42" y2="245" />
            <line x1="65" y1="50" x2="65" y2="245" />
            <line x1="88" y1="42" x2="88" y2="245" />
            <line x1="110" y1="38" x2="110" y2="245" />
            <line x1="132" y1="42" x2="132" y2="245" />
            <line x1="155" y1="50" x2="155" y2="155" />
            <line x1="155" y1="195" x2="155" y2="245" />
            <line x1="178" y1="62" x2="178" y2="245" />
          </g>

          {/* Highlight shine on bars */}
          <g stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1" strokeLinecap="round" transform="translate(-1, 0)">
            <line x1="42" y1="62" x2="42" y2="245" />
            <line x1="65" y1="50" x2="65" y2="245" />
            <line x1="88" y1="42" x2="88" y2="245" />
            <line x1="110" y1="38" x2="110" y2="245" />
            <line x1="132" y1="42" x2="132" y2="245" />
            <line x1="155" y1="50" x2="155" y2="155" />
            <line x1="155" y1="195" x2="155" y2="245" />
            <line x1="178" y1="62" x2="178" y2="245" />
          </g>

          <g stroke="url(#jailBarGrad)" strokeWidth="3" strokeLinecap="round">
            <line x1="20" y1="135" x2="200" y2="135" />
            <line x1="20" y1="195" x2="200" y2="195" />
          </g>

          {/* Highlight shine on horizontal bars */}
          <g stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.8" strokeLinecap="round" transform="translate(0, -0.8)">
            <line x1="20" y1="135" x2="200" y2="135" />
            <line x1="20" y1="195" x2="200" y2="195" />
          </g>

          <rect x="20" y="68" width="180" height="180" fill="url(#jailRust)" opacity="0.3" />

          <g className="jail-door">
            <line x1="155" y1="155" x2="155" y2="195" stroke="url(#jailIronEdge)" strokeWidth="3" />
            <circle cx="160" cy="175" r="3" fill="#7a6240" />
          </g>
        </g>

        <g className="jail-padlock" transform="translate(110 245)">
          <path
            d="M -8 -10 Q -8 -22 0 -22 Q 8 -22 8 -10"
            fill="none"
            stroke="#a78a52"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <rect x="-12" y="-10" width="24" height="20" rx="3" fill="#7a6240" stroke="#3a2e1e" strokeWidth="1.5" />
          <rect x="-12" y="-10" width="24" height="4" fill="rgba(255,255,255,0.15)" rx="2" />
          <circle cx="0" cy="0" r="2" fill="#1a1109" />
          <line x1="0" y1="2" x2="0" y2="6" stroke="#1a1109" strokeWidth="1.5" strokeLinecap="round" />
        </g>

        <g className="jail-chain" stroke="#5a4a32" strokeWidth="2" fill="none">
          <ellipse cx="55" cy="20" rx="3" ry="5" />
          <ellipse cx="55" cy="28" rx="3" ry="5" />
          <ellipse cx="55" cy="36" rx="3" ry="5" />
        </g>
      </svg>

      <div className="jail-occupant">
        <div className="jail-occupant-name">{name}</div>
        <div className={`jail-occupant-label ${verdictClass}`}>{label}</div>
      </div>

      <div className="jail-dust">
        <span /><span /><span /><span /><span /><span />
      </div>
    </div>
  );
};

const ExecutionOverlay = ({ scene }) => {
  if (!scene) return null;
  const { type, victimName, duration } = scene;
  const sceneClass = `exec-scene exec-${type}`;
  const tagline = {
    tentacles: 'Devoured by the Deep',
    thunder: 'Struck Down From Above',
    void: 'Lost to the Void',
    bees: 'Carried Away by the Swarm',
    bees_v2: 'They Poked the Hive',
    cthulhu_abyss: 'Dragged Into the Abyss',
  }[type] || 'Executed';

  return (
    <div className={sceneClass} style={{ '--exec-duration': `${duration}ms` }} aria-hidden="true">
      <div className="exec-vignette" />
      {type === 'tentacles' && (
        <div className="exec-tentacles-stage">
          <svg className="exec-tentacles-svg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="tentacleGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4aa84a" />
                <stop offset="55%" stopColor="#1f5a25" />
                <stop offset="100%" stopColor="#0a2010" />
              </linearGradient>
              <radialGradient id="suckerGrad" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="#d4ff7a" />
                <stop offset="60%" stopColor="#5a8a3a" />
                <stop offset="100%" stopColor="#1a3010" />
              </radialGradient>
              <filter id="tentacleGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <g className="exec-tentacle-pack" filter="url(#tentacleGlow)">
              <path className="exec-tentacle rim t1" d="M 70 840 C 180 850 225 725 335 610 C 410 532 455 520 500 500" stroke="url(#tentacleGrad)" strokeWidth="60" strokeLinecap="round" fill="none" />
              <path className="exec-tentacle rim t2" d="M 930 840 C 820 850 775 725 665 610 C 590 532 545 520 500 500" stroke="url(#tentacleGrad)" strokeWidth="64" strokeLinecap="round" fill="none" />
              <path className="exec-tentacle rim t3" d="M 34 505 C 160 410 275 430 378 488 C 430 518 470 520 500 505" stroke="url(#tentacleGrad)" strokeWidth="50" strokeLinecap="round" fill="none" />
              <path className="exec-tentacle rim t4" d="M 966 505 C 840 410 725 430 622 488 C 570 518 530 520 500 505" stroke="url(#tentacleGrad)" strokeWidth="52" strokeLinecap="round" fill="none" />
              <path className="exec-tentacle rim t5" d="M 230 88 C 238 220 325 310 404 390 C 452 438 472 478 500 500" stroke="url(#tentacleGrad)" strokeWidth="46" strokeLinecap="round" fill="none" />
              <path className="exec-tentacle rim t6" d="M 770 88 C 762 220 675 310 596 390 C 548 438 528 478 500 500" stroke="url(#tentacleGrad)" strokeWidth="48" strokeLinecap="round" fill="none" />
              <path className="exec-tentacle rim t7" d="M 500 965 C 530 820 395 760 420 640 C 438 555 478 530 500 500" stroke="url(#tentacleGrad)" strokeWidth="54" strokeLinecap="round" fill="none" />
              <path className="exec-tentacle rim t8" d="M 500 35 C 470 180 605 240 580 360 C 562 445 522 470 500 500" stroke="url(#tentacleGrad)" strokeWidth="46" strokeLinecap="round" fill="none" />
              <path className="exec-tentacle wrap w1" d="M 284 520 C 338 395 660 390 716 518 C 646 642 356 648 284 520" stroke="url(#tentacleGrad)" strokeWidth="26" strokeLinecap="round" fill="none" />
              <path className="exec-tentacle wrap w2" d="M 326 585 C 388 470 612 468 674 585 C 610 700 392 700 326 585" stroke="url(#tentacleGrad)" strokeWidth="20" strokeLinecap="round" fill="none" />
            </g>
            <g className="exec-suckers" filter="url(#tentacleGlow)">
              {[
                { x: 150, y: 870, s: 0 }, { x: 200, y: 800, s: 1 }, { x: 260, y: 730, s: 2 }, { x: 320, y: 670, s: 3 }, { x: 380, y: 600, s: 4 },
                { x: 850, y: 870, s: 1 }, { x: 800, y: 800, s: 2 }, { x: 740, y: 730, s: 3 }, { x: 680, y: 670, s: 4 }, { x: 620, y: 600, s: 0 },
                { x: 130, y: 460, s: 2 }, { x: 220, y: 450, s: 3 }, { x: 310, y: 470, s: 4 }, { x: 400, y: 490, s: 0 },
                { x: 870, y: 460, s: 3 }, { x: 780, y: 450, s: 4 }, { x: 690, y: 470, s: 0 }, { x: 600, y: 490, s: 1 },
                { x: 220, y: 200, s: 1 }, { x: 270, y: 270, s: 2 }, { x: 320, y: 340, s: 3 },
                { x: 780, y: 200, s: 2 }, { x: 730, y: 270, s: 3 }, { x: 680, y: 340, s: 4 },
                { x: 430, y: 665, s: 1 }, { x: 500, y: 690, s: 2 }, { x: 570, y: 665, s: 3 },
                { x: 410, y: 430, s: 2 }, { x: 500, y: 405, s: 3 }, { x: 590, y: 430, s: 4 },
              ].map((sk, i) => (
                <circle key={i} cx={sk.x} cy={sk.y} r={5 + (i % 3)} fill="url(#suckerGrad)" className={`sucker s${sk.s}`} />
              ))}
            </g>
          </svg>
          <div className="exec-eye">
            <div className="exec-eye-iris" />
            <div className="exec-eye-pupil" />
          </div>
          <div className="exec-drag-mass">
            <div className="exec-drag-cage" />
          </div>
        </div>
      )}
      {type === 'cthulhu_abyss' && (
        <div className="exec-cthulhu_abyss-stage">
          <div className="exec-cthulhu-ocean-bg" />
          <div className="exec-cthulhu-vignette" />
          <svg className="exec-cthulhu-svg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="cthulhuBodyGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#020a04" />
                <stop offset="28%" stopColor="#0c2014" />
                <stop offset="62%" stopColor="#1f5a25" />
                <stop offset="100%" stopColor="#4aa84a" />
              </linearGradient>
              <linearGradient id="cthulhuTentacleGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#5ec850" />
                <stop offset="45%" stopColor="#2a8838" />
                <stop offset="100%" stopColor="#0a2010" />
              </linearGradient>
              <linearGradient id="cthulhuRidgeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9aff7a" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#2a7028" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="cthulhuFaceTentacleGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3a9038" />
                <stop offset="60%" stopColor="#1f5a25" />
                <stop offset="100%" stopColor="#050a02" />
              </linearGradient>
              <linearGradient id="cthulhuWingGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#1a4a28" stopOpacity="0.78" />
                <stop offset="55%" stopColor="#0a2010" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#020a04" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="cthulhuSuckerGrad" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="#e6ff8a" />
                <stop offset="55%" stopColor="#7acc4a" />
                <stop offset="100%" stopColor="#1a4015" />
              </radialGradient>
              <radialGradient id="cthulhuEyeGrad" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="#ffff66" />
                <stop offset="38%" stopColor="#ff6a00" />
                <stop offset="82%" stopColor="#a31010" />
                <stop offset="100%" stopColor="#2a0606" />
              </radialGradient>
              <radialGradient id="cthulhuBubbleGrad" cx="0.35" cy="0.35" r="0.6">
                <stop offset="0%" stopColor="#e6ffd0" stopOpacity="0.85" />
                <stop offset="45%" stopColor="#a4e898" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#1f5a25" stopOpacity="0" />
              </radialGradient>
              <filter id="cthulhuGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="12" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="cthulhuWater" x="-10%" y="-10%" width="120%" height="120%">
                <feTurbulence type="fractalNoise" baseFrequency="0.018 0.05" numOctaves="2" seed="3">
                  <animate attributeName="baseFrequency" values="0.014 0.04;0.022 0.07;0.014 0.04" dur="7s" repeatCount="indefinite" />
                </feTurbulence>
                <feDisplacementMap in="SourceGraphic" scale="9" />
              </filter>
              <filter id="cthulhuSigilGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Bat-like wings flared behind the head — fade in late, slow flap */}
            <g className="cthulhu-wings" filter="url(#cthulhuGlow)">
              <path className="cthulhu-wing left-wing"
                    d="M 340 690 Q 200 540 70 470 Q 50 540 120 640 Q 200 740 340 740 Z"
                    fill="url(#cthulhuWingGrad)" />
              <path className="cthulhu-wing right-wing"
                    d="M 660 690 Q 800 540 930 470 Q 950 540 880 640 Q 800 740 660 740 Z"
                    fill="url(#cthulhuWingGrad)" />
              <path className="cthulhu-wing-vein lwv1" d="M 340 700 Q 240 620 110 520" stroke="#1f5a25" strokeWidth="2.4" fill="none" opacity="0.6" />
              <path className="cthulhu-wing-vein lwv2" d="M 340 720 Q 230 660 130 600" stroke="#1f5a25" strokeWidth="2" fill="none" opacity="0.55" />
              <path className="cthulhu-wing-vein rwv1" d="M 660 700 Q 760 620 890 520" stroke="#1f5a25" strokeWidth="2.4" fill="none" opacity="0.6" />
              <path className="cthulhu-wing-vein rwv2" d="M 660 720 Q 770 660 870 600" stroke="#1f5a25" strokeWidth="2" fill="none" opacity="0.55" />
            </g>

            {/* Anthropoid body + head — main mass */}
            <g className="cthulhu-head-group" filter="url(#cthulhuGlow)">
              {/* Body silhouette (humanoid torso, mostly underwater) */}
              <path className="cthulhu-body"
                    d="M 320 1000 C 320 920 340 870 380 850 C 390 840 400 820 410 800 L 590 800 C 600 820 610 840 620 850 C 660 870 680 920 680 1000 Z"
                    fill="url(#cthulhuBodyGrad)" opacity="0.92" />
              {/* Shoulder bulges */}
              <ellipse className="cthulhu-shoulder left" cx="380" cy="810" rx="48" ry="32" fill="#0c2014" opacity="0.72" />
              <ellipse className="cthulhu-shoulder right" cx="620" cy="810" rx="48" ry="32" fill="#0c2014" opacity="0.72" />
              {/* Squid-like head (egg-shaped, narrower than before, more recognizable) */}
              <path className="cthulhu-head"
                    d="M 300 820 C 300 690 360 580 500 580 C 640 580 700 690 700 820 C 700 855 620 870 500 870 C 380 870 300 855 300 820 Z"
                    fill="url(#cthulhuBodyGrad)" />
              {/* Scale crescents (rubbery scale texture) — two staggered rows */}
              <g className="cthulhu-scales" opacity="0.55">
                <path d="M 360 680 Q 380 670 400 680" stroke="#3a9038" strokeWidth="1.8" fill="none" />
                <path d="M 410 678 Q 430 668 450 678" stroke="#3a9038" strokeWidth="1.8" fill="none" />
                <path d="M 460 676 Q 480 666 500 676" stroke="#3a9038" strokeWidth="1.8" fill="none" />
                <path d="M 510 676 Q 530 666 550 676" stroke="#3a9038" strokeWidth="1.8" fill="none" />
                <path d="M 560 678 Q 580 668 600 678" stroke="#3a9038" strokeWidth="1.8" fill="none" />
                <path d="M 610 680 Q 630 670 650 680" stroke="#3a9038" strokeWidth="1.8" fill="none" />
                <path d="M 380 720 Q 400 710 420 720" stroke="#3a9038" strokeWidth="1.6" fill="none" />
                <path d="M 430 718 Q 450 708 470 718" stroke="#3a9038" strokeWidth="1.6" fill="none" />
                <path d="M 480 716 Q 500 706 520 716" stroke="#3a9038" strokeWidth="1.6" fill="none" />
                <path d="M 530 716 Q 550 706 570 716" stroke="#3a9038" strokeWidth="1.6" fill="none" />
                <path d="M 580 718 Q 600 708 620 718" stroke="#3a9038" strokeWidth="1.6" fill="none" />
              </g>
              {/* Head ridge highlight */}
              <path className="cthulhu-head-ridge" d="M 340 860 C 360 720 410 620 500 600 C 590 620 640 720 660 860" stroke="url(#cthulhuRidgeGrad)" strokeWidth="6" fill="none" opacity="0.5" />
              {/* Heavy brow */}
              <path className="cthulhu-brow" d="M 360 700 C 420 670 580 670 640 700" stroke="#0a2010" strokeWidth="16" fill="none" strokeLinecap="round" opacity="0.65" />
            </g>

            {/* Face-tentacle beard — 10 short tentacles dangling from the lower face */}
            <g className="cthulhu-face-tentacles" filter="url(#cthulhuGlow)">
              <path className="face-tentacle ft1" d="M 350 805 Q 330 875 300 935" stroke="url(#cthulhuFaceTentacleGrad)" strokeWidth="14" strokeLinecap="round" fill="none" />
              <path className="face-tentacle ft2" d="M 390 838 Q 380 905 360 970" stroke="url(#cthulhuFaceTentacleGrad)" strokeWidth="13" strokeLinecap="round" fill="none" />
              <path className="face-tentacle ft3" d="M 430 855 Q 425 920 420 985" stroke="url(#cthulhuFaceTentacleGrad)" strokeWidth="14" strokeLinecap="round" fill="none" />
              <path className="face-tentacle ft4" d="M 470 865 Q 470 930 478 1000" stroke="url(#cthulhuFaceTentacleGrad)" strokeWidth="15" strokeLinecap="round" fill="none" />
              <path className="face-tentacle ft5" d="M 500 868 Q 500 935 502 1000" stroke="url(#cthulhuFaceTentacleGrad)" strokeWidth="17" strokeLinecap="round" fill="none" />
              <path className="face-tentacle ft6" d="M 530 865 Q 530 930 522 1000" stroke="url(#cthulhuFaceTentacleGrad)" strokeWidth="15" strokeLinecap="round" fill="none" />
              <path className="face-tentacle ft7" d="M 570 855 Q 575 920 580 985" stroke="url(#cthulhuFaceTentacleGrad)" strokeWidth="14" strokeLinecap="round" fill="none" />
              <path className="face-tentacle ft8" d="M 610 838 Q 620 905 640 970" stroke="url(#cthulhuFaceTentacleGrad)" strokeWidth="13" strokeLinecap="round" fill="none" />
              <path className="face-tentacle ft9" d="M 650 805 Q 670 875 700 935" stroke="url(#cthulhuFaceTentacleGrad)" strokeWidth="14" strokeLinecap="round" fill="none" />
              <path className="face-tentacle ft10" d="M 410 818 Q 405 880 408 950" stroke="url(#cthulhuFaceTentacleGrad)" strokeWidth="11" strokeLinecap="round" fill="none" />
              <path className="face-tentacle ft11" d="M 590 818 Q 595 880 592 950" stroke="url(#cthulhuFaceTentacleGrad)" strokeWidth="11" strokeLinecap="round" fill="none" />
            </g>

            {/* Eyes — three malevolent suns */}
            <g className="cthulhu-eyes" filter="url(#cthulhuGlow)">
              <circle className="cthulhu-eye main-eye" cx="500" cy="735" r="52" fill="url(#cthulhuEyeGrad)" />
              <ellipse className="cthulhu-pupil main-pupil" cx="500" cy="735" rx="9" ry="38" fill="#000" />
              <circle className="cthulhu-eye side-eye left-eye" cx="408" cy="760" r="22" fill="url(#cthulhuEyeGrad)" />
              <ellipse className="cthulhu-pupil side-pupil left-pupil" cx="408" cy="760" rx="4" ry="14" fill="#000" />
              <circle className="cthulhu-eye side-eye right-eye" cx="592" cy="760" r="22" fill="url(#cthulhuEyeGrad)" />
              <ellipse className="cthulhu-pupil side-pupil right-pupil" cx="592" cy="760" rx="4" ry="14" fill="#000" />
            </g>

            {/* Outer / body tentacles emerging from the abyss */}
            <g className="cthulhu-tentacles" filter="url(#cthulhuGlow)">
              <path className="cthulhu-tentacle t-l1" d="M 60 1000 C 40 720 200 480 410 440" stroke="url(#cthulhuTentacleGrad)" strokeWidth="62" strokeLinecap="round" fill="none" />
              <path className="cthulhu-tentacle t-r1" d="M 940 1000 C 960 720 800 480 590 440" stroke="url(#cthulhuTentacleGrad)" strokeWidth="62" strokeLinecap="round" fill="none" />
              <path className="cthulhu-tentacle t-l2" d="M 210 1000 C 160 660 270 380 460 400" stroke="url(#cthulhuTentacleGrad)" strokeWidth="48" strokeLinecap="round" fill="none" />
              <path className="cthulhu-tentacle t-r2" d="M 790 1000 C 840 660 730 380 540 400" stroke="url(#cthulhuTentacleGrad)" strokeWidth="48" strokeLinecap="round" fill="none" />
              <path className="cthulhu-tentacle t-l3" d="M 360 1000 C 300 760 340 540 470 500" stroke="url(#cthulhuTentacleGrad)" strokeWidth="36" strokeLinecap="round" fill="none" />
              <path className="cthulhu-tentacle t-r3" d="M 640 1000 C 700 760 660 540 530 500" stroke="url(#cthulhuTentacleGrad)" strokeWidth="36" strokeLinecap="round" fill="none" />
              <path className="cthulhu-tentacle t-wrap1" d="M 290 460 C 380 320 620 320 710 460 C 620 620 380 620 290 460" stroke="url(#cthulhuTentacleGrad)" strokeWidth="28" strokeLinecap="round" fill="none" />
              <path className="cthulhu-tentacle t-wrap2" d="M 330 530 C 410 410 590 410 670 530 C 590 660 410 660 330 530" stroke="url(#cthulhuTentacleGrad)" strokeWidth="22" strokeLinecap="round" fill="none" />
              <path className="cthulhu-tentacle t-wrap3" d="M 370 600 C 430 510 570 510 630 600 C 570 690 430 690 370 600" stroke="url(#cthulhuTentacleGrad)" strokeWidth="18" strokeLinecap="round" fill="none" />
            </g>

            {/* Suckers along the tentacles */}
            <g className="cthulhu-suckers" filter="url(#cthulhuGlow)">
              {[
                { x: 100, y: 880, s: 0 }, { x: 150, y: 780, s: 1 }, { x: 210, y: 680, s: 2 }, { x: 280, y: 580, s: 3 }, { x: 360, y: 490, s: 4 },
                { x: 900, y: 880, s: 1 }, { x: 850, y: 780, s: 2 }, { x: 790, y: 680, s: 3 }, { x: 720, y: 580, s: 4 }, { x: 640, y: 490, s: 0 },
                { x: 230, y: 830, s: 2 }, { x: 260, y: 720, s: 3 }, { x: 320, y: 600, s: 4 }, { x: 400, y: 510, s: 0 },
                { x: 770, y: 830, s: 3 }, { x: 740, y: 720, s: 4 }, { x: 680, y: 600, s: 0 }, { x: 600, y: 510, s: 1 },
                { x: 380, y: 870, s: 1 }, { x: 360, y: 760, s: 2 }, { x: 390, y: 640, s: 3 },
                { x: 620, y: 870, s: 2 }, { x: 640, y: 760, s: 3 }, { x: 610, y: 640, s: 4 },
                { x: 420, y: 590, s: 1 }, { x: 500, y: 615, s: 2 }, { x: 580, y: 590, s: 3 },
                { x: 400, y: 440, s: 2 }, { x: 500, y: 420, s: 3 }, { x: 600, y: 440, s: 4 },
                { x: 460, y: 360, s: 0 }, { x: 540, y: 360, s: 1 }
              ].map((sk, i) => (
                <circle key={i} cx={sk.x} cy={sk.y} r={7 + (i % 3)} fill="url(#cthulhuSuckerGrad)" className={`cth-sucker s${sk.s}`} />
              ))}
            </g>

            {/* Bubble plume rising from the abyss — purely decorative, continuous */}
            <g className="cthulhu-bubbles" filter="url(#cthulhuWater)">
              {Array.from({ length: 36 }).map((_, i) => (
                <circle
                  key={i}
                  className={`cthulhu-bubble b${i % 6}`}
                  cx={40 + (i * 137) % 940}
                  cy={1020 + (i * 17) % 80}
                  r={3 + (i % 5)}
                  fill="url(#cthulhuBubbleGrad)"
                  style={{ '--bubble-delay': `${(i * 0.18) % 5}s`, '--bubble-drift': `${((i * 73) % 60) - 30}px` }}
                />
              ))}
            </g>

            {/* Elder Sign sigil — pulses briefly behind the main eye at the peak */}
            <g className="cthulhu-sigil" filter="url(#cthulhuSigilGlow)">
              <circle cx="500" cy="735" r="120" stroke="#9aff7a" strokeWidth="1.6" fill="none" opacity="0.7" />
              <path d="M 500 615 L 565 700 L 500 855 L 435 700 Z" stroke="#9aff7a" strokeWidth="1.5" fill="none" opacity="0.8" />
              <path d="M 500 615 L 500 855 M 380 735 L 620 735" stroke="#9aff7a" strokeWidth="1" fill="none" opacity="0.6" />
              <circle cx="500" cy="735" r="14" stroke="#9aff7a" strokeWidth="1.5" fill="none" opacity="0.9" />
            </g>
          </svg>
          <div className="cthulhu-drag-mass">
            <div className="cthulhu-drag-cage" />
          </div>
        </div>
      )}
      {type === 'thunder' && (
        <div className="exec-thunder-stage">
          <div className="exec-flash" />
          <div className="exec-flash exec-flash-2" />
          <div className="exec-flash exec-flash-3" />
          <svg className="exec-bolt" viewBox="0 0 200 800" preserveAspectRatio="xMidYMid meet">
            <defs>
              <filter id="boltGlow">
                <feGaussianBlur stdDeviation="4" />
                <feComposite in="SourceGraphic" />
              </filter>
            </defs>
            <path className="exec-bolt-path"
              d="M 100 0 L 80 200 L 120 220 L 70 480 L 130 500 L 60 800"
              stroke="#ffffff"
              strokeWidth="6"
              fill="none"
              filter="url(#boltGlow)"
            />
            <path className="exec-bolt-core"
              d="M 100 0 L 80 200 L 120 220 L 70 480 L 130 500 L 60 800"
              stroke="#fff8c8"
              strokeWidth="2"
              fill="none"
            />
          </svg>
          <div className="exec-shards">
            {[...Array(14)].map((_, i) => (
              <span key={i} className={`exec-shard sh${i % 7}`} style={{ '--i': i }} />
            ))}
          </div>
        </div>
      )}
      {type === 'void' && (
        <div className="exec-void-stage">
          <div className="exec-void-portal">
            <div className="exec-void-ring r1" />
            <div className="exec-void-ring r2" />
            <div className="exec-void-ring r3" />
            <div className="exec-void-core" />
          </div>
          <div className="exec-void-particles">
            {[...Array(24)].map((_, i) => (
              <span key={i} className="exec-void-spark" style={{ '--i': i, '--delay': `${(i * 80) % 1200}ms` }} />
            ))}
          </div>
        </div>
      )}
      {type === 'bees' && (
        <div className="exec-bees-stage">
          <div className="exec-bee-cloud">
            {[...Array(40)].map((_, i) => (
              <span key={i} className="exec-bee" style={{
                '--i': i,
                '--bx': `${(Math.sin(i * 1.7) * 140)}px`,
                '--by': `${(Math.cos(i * 2.3) * 110)}px`,
                '--delay': `${(i * 35) % 800}ms`,
              }} />
            ))}
          </div>
        </div>
      )}
      {type === 'bees_v2' && (
        <div className="exec-bees_v2-stage">
          <div className="exec-bees_v2-meadow-bg" />
          <div className="exec-bees_v2-sky-bg" />
          <svg className="exec-bees_v2-svg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="bv2SkyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5a8aaf" />
                <stop offset="60%" stopColor="#9ec0d4" />
                <stop offset="100%" stopColor="#d8c890" />
              </linearGradient>
              <linearGradient id="bv2MeadowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4a8a3a" />
                <stop offset="100%" stopColor="#1a3a18" />
              </linearGradient>
              <linearGradient id="bv2TrunkGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2a1808" />
                <stop offset="40%" stopColor="#5a3818" />
                <stop offset="65%" stopColor="#6a4520" />
                <stop offset="100%" stopColor="#1a0e04" />
              </linearGradient>
              <radialGradient id="bv2LeavesGrad" cx="0.45" cy="0.45" r="0.6">
                <stop offset="0%" stopColor="#6abc4a" />
                <stop offset="60%" stopColor="#2a7028" />
                <stop offset="100%" stopColor="#0c2010" />
              </radialGradient>
              <linearGradient id="bv2HiveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d09040" />
                <stop offset="45%" stopColor="#a87224" />
                <stop offset="100%" stopColor="#4a2a08" />
              </linearGradient>
              <radialGradient id="bv2HiveGlowGrad" cx="0.5" cy="0.5" r="0.55">
                <stop offset="0%" stopColor="#ffe060" stopOpacity="0.95" />
                <stop offset="55%" stopColor="#e09020" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#a04010" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="bv2BeeBody" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0%" stopColor="#fff080" />
                <stop offset="55%" stopColor="#d8a020" />
                <stop offset="100%" stopColor="#5a3010" />
              </radialGradient>
              <linearGradient id="bv2StickGrad" x1="0" y1="0" x2="1" y2="0.6">
                <stop offset="0%" stopColor="#6a4520" />
                <stop offset="50%" stopColor="#8a5e2a" />
                <stop offset="100%" stopColor="#3a2210" />
              </linearGradient>
              <filter id="bv2SwarmGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="bv2HiveShake" x="-15%" y="-15%" width="130%" height="130%">
                <feGaussianBlur stdDeviation="1.2" />
              </filter>
            </defs>

            {/* Sky-to-meadow background (the day quickly darkens as the swarm builds) */}
            <rect className="bv2-sky" x="0" y="0" width="1000" height="700" fill="url(#bv2SkyGrad)" />
            <rect className="bv2-meadow" x="0" y="700" width="1000" height="300" fill="url(#bv2MeadowGrad)" />
            <g className="bv2-grass">
              {Array.from({ length: 26 }).map((_, i) => (
                <path key={i} d={`M ${20 + i * 38} 1000 Q ${22 + i * 38} ${975 + (i % 3) * 5} ${24 + i * 38} 1000`}
                      stroke="#1a4a18" strokeWidth="3" fill="none" opacity="0.7" />
              ))}
            </g>

            {/* Old gnarled tree (left side) */}
            <g className="bv2-tree">
              {/* Trunk */}
              <path className="bv2-trunk"
                    d="M 140 1000 L 150 380 Q 150 200 175 95 Q 195 95 210 200 L 215 380 L 230 1000 Z"
                    fill="url(#bv2TrunkGrad)" />
              {/* Bark lines */}
              <path d="M 165 950 L 175 480 Q 180 250 190 130" stroke="#1a0a02" strokeWidth="2" fill="none" opacity="0.45" />
              <path d="M 200 950 L 205 500 Q 210 280 215 140" stroke="#1a0a02" strokeWidth="2" fill="none" opacity="0.4" />
              {/* Branches */}
              <path className="bv2-branch b1" d="M 195 320 Q 270 290 360 305 Q 380 308 390 318" stroke="#2a1808" strokeWidth="14" strokeLinecap="round" fill="none" />
              <path className="bv2-branch b2" d="M 160 240 Q 95 230 35 250" stroke="#2a1808" strokeWidth="11" strokeLinecap="round" fill="none" />
              <path className="bv2-branch b3" d="M 210 200 Q 260 170 320 175" stroke="#2a1808" strokeWidth="9" strokeLinecap="round" fill="none" />
              {/* Canopy — layered leafy ellipses */}
              <ellipse className="bv2-leaves l1" cx="180" cy="170" rx="135" ry="115" fill="url(#bv2LeavesGrad)" opacity="0.92" />
              <ellipse className="bv2-leaves l2" cx="80" cy="220" rx="100" ry="90" fill="url(#bv2LeavesGrad)" opacity="0.85" />
              <ellipse className="bv2-leaves l3" cx="280" cy="190" rx="110" ry="100" fill="url(#bv2LeavesGrad)" opacity="0.9" />
              <ellipse className="bv2-leaves l4" cx="185" cy="80" rx="105" ry="80" fill="url(#bv2LeavesGrad)" opacity="0.94" />
              <ellipse className="bv2-leaves l5" cx="320" cy="270" rx="65" ry="55" fill="url(#bv2LeavesGrad)" opacity="0.85" />
            </g>

            {/* Hive hanging from the right-side branch */}
            <g className="bv2-hive-group">
              {/* Rope from branch to hive */}
              <path className="bv2-hive-rope" d="M 372 318 L 380 372" stroke="#2a1808" strokeWidth="3" />
              {/* Hive body */}
              <g className="bv2-hive">
                <ellipse className="bv2-hive-shadow" cx="385" cy="448" rx="58" ry="72" fill="#3a1e02" opacity="0.6" />
                <ellipse cx="380" cy="446" rx="55" ry="70" fill="url(#bv2HiveGrad)" />
                {/* Honeycomb layered lines */}
                <path d="M 330 410 Q 380 422 430 410" stroke="#3a2008" strokeWidth="2.2" fill="none" opacity="0.75" />
                <path d="M 326 440 Q 380 452 434 440" stroke="#3a2008" strokeWidth="2.2" fill="none" opacity="0.75" />
                <path d="M 330 470 Q 380 482 430 470" stroke="#3a2008" strokeWidth="2.2" fill="none" opacity="0.75" />
                <path d="M 336 498 Q 380 508 424 498" stroke="#3a2008" strokeWidth="2" fill="none" opacity="0.7" />
                {/* Entrance hole */}
                <ellipse className="bv2-hive-hole" cx="380" cy="480" rx="11" ry="6" fill="#0a0500" />
                {/* Angry hive glow */}
                <ellipse className="bv2-hive-glow" cx="380" cy="446" rx="100" ry="115" fill="url(#bv2HiveGlowGrad)" opacity="0" />
              </g>
            </g>

            {/* "Pokers" — two villagers' sticks jabbing from the right side */}
            <g className="bv2-pokers">
              <path className="bv2-stick s1" d="M 860 560 L 460 470" stroke="url(#bv2StickGrad)" strokeWidth="9" strokeLinecap="round" />
              <path className="bv2-stick s2" d="M 880 640 L 460 510" stroke="url(#bv2StickGrad)" strokeWidth="8" strokeLinecap="round" />
            </g>

            {/* Bee swarm — 64 bees, deterministic positions */}
            <g className="bv2-swarm" filter="url(#bv2SwarmGlow)">
              {Array.from({ length: 64 }).map((_, i) => {
                const ang = i * 0.61803398875; // golden-angle scatter
                const r = 28 + (i % 6) * 6;
                const ox = Math.cos(ang * Math.PI * 2) * r;
                const oy = Math.sin(ang * Math.PI * 2) * r;
                // target inside the cage area (roughly center of viewport)
                const tx = 200 + ((i * 53) % 220);
                const ty = -40 + ((i * 71) % 200);
                const wob = 30 + (i % 5) * 12;
                return (
                  <g key={i} className={`bv2-bee b${i % 8}`}
                     style={{
                       '--bee-ox': `${ox}px`,
                       '--bee-oy': `${oy}px`,
                       '--bee-tx': `${tx}px`,
                       '--bee-ty': `${ty}px`,
                       '--bee-wobble': `${wob}px`,
                       '--bee-delay': `${(i * 0.045) % 1.6}s`,
                       transform: `translate(380px, 480px)`,
                     }}>
                    <ellipse className="bv2-bee-body" cx="0" cy="0" rx="4.5" ry="3" fill="url(#bv2BeeBody)" />
                    <rect className="bv2-bee-stripe" x="-2.5" y="-0.8" width="1.4" height="1.8" fill="#1a0a02" />
                    <rect className="bv2-bee-stripe" x="1.1" y="-0.8" width="1.4" height="1.8" fill="#1a0a02" />
                    <ellipse className="bv2-bee-wing" cx="0" cy="-3" rx="3.2" ry="1.6" fill="rgba(240, 255, 220, 0.75)" />
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      )}
      <div className="exec-banner">
        <div className="exec-tagline">{tagline}</div>
        <div className="exec-victim">{victimName}</div>
      </div>
    </div>
  );
};

const PhaseBanner = ({ icon, kicker, title, accent }) => (
  <div className="phase-banner" style={accent ? { borderColor: accent } : {}}>
    <div className="phase-banner-kicker">
      {icon} {kicker}
    </div>
    <div className="phase-banner-title">{title}</div>
  </div>
);

const ROLE_IMAGES = {
  'Alpha Wolf': '/roles/alphawolf.png',
  'Apprentice Seer': '/roles/apprenticeseer.png',
  'Aura Seer': '/roles/auraseer.png',
  Bodyguard: '/roles/bodyguard.png',
  'Cult Leader': '/roles/cultleader.png',
  Cupid: '/roles/cupid.png',
  Cursed: '/roles/cursed.png',
  Diseased: '/roles/diseased.png',
  Doppelganger: '/roles/doppelganger.png',
  'Dream Wolf': '/roles/dreamwolf.png',
  Drunk: '/roles/drunk.png',
  Ghost: '/roles/ghost.png',
  Hunter: '/roles/hunter.png',
  Jailer: '/roles/jailer.png',
  'Lone Wolf': '/roles/lonewolf.png',
  Lycan: '/roles/lycan.png',
  Mayor: '/roles/mayor.png',
  Minion: '/roles/minion.png',
  Moderator: '/roles/moderator.jpg',
  'Old Hag': '/roles/oldhag.png',
  Pacifist: '/roles/pacifist.png',
  Priest: '/roles/priest.png',
  Prince: '/roles/prince.png',
  'Private Investigator': '/roles/privateinvestigator.png',
  Revealer: '/roles/revealer.png',
  Robber: '/roles/robber.png',
  Seer: '/roles/seer.png',
  Sentinel: '/roles/sentinel.png',
  Sorceress: '/roles/sorceress.png',
  Spellcaster: '/roles/spellcaster.png',
  Squire: '/roles/squire.png',
  Tanner: '/roles/tanner.png',
  'Tough Guy': '/roles/toughguy.png',
  Troublemaker: '/roles/troublemaker.png',
  Vampire: '/roles/vampire.png',
  Villager: '/roles/villager.png',
  'Village Idiot': '/roles/villageidiot.png',
  Werewolf: '/roles/werewolf.png',
  Witch: '/roles/witch.png',
  'Wolf Cub': '/roles/wolfcub.png',
  Wolverine: '/roles/wolverine.png',
  // New role images
  'Dawn Bringer': '/roles/dawnbringer.png',
  Disruptor: '/roles/disruptor.png',
  'Mad Bomber': '/roles/madboomer.png',
  'The Reflector': '/roles/reflector.png',
  Yandere: '/roles/yandere.png',
  Cthulhu: '/roles/cthulhu.png',
};


const getRoleImage = (role) => ROLE_IMAGES[role] || null;

const ROLE_COLORS = {
  Werewolf: '#ef4444',
  Wolverine: '#f97316',
  'Alpha Wolf': '#dc2626',
  'Mystic Wolf': '#b91c1c',
  'Dream Wolf': '#991b1b',
  Minion: '#f87171',
  Squire: '#fca5a5',
  Sorceress: '#fb7185',
  Seer: '#8b5cf6',
  'Aura Seer': '#d946ef',
  'Private Investigator': '#38bdf8',
  'Apprentice Seer': '#a78bfa',
  Robber: '#3b82f6',
  Troublemaker: '#ec4899',
  Villager: '#f59e0b',
  Mayor: '#fbbf24',
  Pacifist: '#86efac',
  Lycan: '#a3a3a3',
  Priest: '#10b981',
  Jailer: '#64748b',
  Bodyguard: '#0ea5e9',
  Mason: '#14b8a6',
  Drunk: '#d97706',
  Insomniac: '#06b6d4',
  Hunter: '#ea580c',
  Tanner: '#78716c',
  Sentinel: '#6366f1',
  Doppelganger: '#e879f9',
  'Paranormal Investigator': '#c084fc',
  Witch: '#a855f7',
  'Village Idiot': '#fbbf24',
  Revealer: '#2dd4bf',
  Curator: '#818cf8',
  Prince: '#fbbf24',
  Vampire: '#7f1d1d',
  'The Master': '#450a0a',
  'The Count': '#581c87',
  Alien: '#22d3ee',
  Blob: '#4ade80',
  Mortician: '#737373',
  // GPT-Roles additions
  'Cult Leader': '#c026d3',
  Spellcaster: '#7c3aed',
  Cupid: '#f472b6',
  Cursed: '#9f1239',
  Diseased: '#65a30d',
  Ghost: '#94a3b8',
  'Lone Wolf': '#7f1d1d',
  'Old Hag': '#6b7280',
  'Tough Guy': '#2563eb',
  'Wolf Cub': '#b91c1c',
  // New roles
  'Dawn Bringer': '#fef3c7',
  Disruptor: '#818cf8',
  'Mad Bomber': '#ef4444',
  'The Reflector': '#7dd3fc',
  Yandere: '#f472b6',
  Cthulhu: '#4ade80',
};

const ROLE_SUBTITLES = {
  Werewolf: 'Wake with other Werewolves. Hunt together.',
  Wolverine: 'A Werewolf whose attacks can leave a metallic clue.',
  'Alpha Wolf': 'Swap an extra Werewolf card with a player.',
  'Mystic Wolf': "Look at one player's card after wolf phase.",
  'Dream Wolf': 'You are a Werewolf but do not wake with them.',
  Minion: 'See the Werewolves. They do not know you.',
  Squire: 'See the Werewolves. Allied to their team.',
  Sorceress: 'Wolf-side support. Search for the Seer each night.',
  Seer: 'Each night, choose a player to learn if they are a Villager or a Werewolf.',
  'Aura Seer': 'Choose a player each night to reveal their aura (Good, Evil or Unknown).',
  'Private Investigator': 'Once per game, inspect a player and their neighbors for wolf signs.',
  'Apprentice Seer': 'If the Seer is eliminated, you become the Seer.',
  Robber: "Swap your card with another player's.",
  Troublemaker: 'Once per game, call for players to be eliminated the following day.',
  Drunk: 'You are a Villager until the 3rd night, when you sober up and learn your real role.',
  Insomniac: 'Check your own card at end of night.',
  Mason: 'See the other Masons.',
  Hunter: 'If you are voted out, you may immediately eliminate another player.',
  Tanner: 'You win only if the village votes you out.',
  Mayor: 'Your vote counts as two votes.',
  Pacifist: 'You must always vote to save players on trial.',
  Lycan: 'You are a Villager, but appear to the Seer as a Werewolf.',
  Sentinel: "Shield another player's card from being touched.",
  Doppelganger: 'On the first night, choose a player. When they die, you become their role.',
  'Paranormal Investigator': 'Look at players; become wolf/tanner if seen.',
  Witch: 'You may save or eliminate a player at night, once each per game.',
  'Village Idiot': 'On Night 1 only, rotate every other player\'s role L/R. Forced to vote Eliminate at trial.',
  Revealer: "Flip one player's card face up.",
  Curator: 'Place an artifact token on a player.',
  Bodyguard: 'Each night, choose a player who cannot be eliminated that night.',
  Priest: 'Once per game, choose a player to be protected from elimination at night.',
  Jailer: 'Jail someone to protect them from kills.',
  Prince: 'If you are voted to be eliminated, your role is revealed and you stay.',
  Villager: 'Find the Werewolves and eliminate them.',
  // GPT-Roles additions
  'Cult Leader': 'Each night, recruit a player into your cult. Win when all living players are in the cult.',
  Spellcaster: 'Each night, choose a player who cannot speak the next day.',
  Cupid: 'On the first night, link two players. If one dies, the other dies too.',
  Cursed: 'Village team — but if Werewolves target you, you become a Werewolf.',
  Diseased: 'If Werewolves eliminate you, they cannot kill the next night.',
  // 'Ghost' subtitle removed — Ghost is no longer a deck role. Every dead player
  // gains ghost-chat (one letter at a time, visible to everyone) on death.
  'Lone Wolf': 'You wake with the wolves but only win if you are the last player alive.',
  'Old Hag': 'Each night, banish a player from the next day — they cannot speak or vote.',
  'Tough Guy': 'A wolf attack does not kill you immediately — you fall the following night.',
  'Wolf Cub': 'Wake with the wolves. If you die, the wolves kill twice the next night.',
  Vampire: 'Each night, mark a player. They die when they receive their second accusation vote.',
  // New roles
  'Dawn Bringer': 'Once per game, declare yourself during the day to cancel the next night.',
  Disruptor: 'Each night, choose a player — their night action is scrambled and has no effect.',
  'Mad Bomber': 'If you die, the players seated left and right die with you.',
  'The Reflector': 'Each night, pick a player — anyone who targets them instead targets themselves.',
  Yandere: 'Obsess over a target. Shield them 3× from any night effect — kills cost the attacker their life.',
  Cthulhu: 'Each night, whisper a word and curse a player to repeat it all day.',
};

const ROLE_DETAILS = {
  Werewolf:
    'Each hunt night, choose a living player with the pack. Protected targets survive. The host can disable the first-night kill.',
  Wolverine:
    'You hunt with the Werewolves. If you are the closest wolf to the victim, a nearby player may hear a metallic scrape.',
  'Alpha Wolf':
    'You count as a Werewolf. On the first night, your special power can turn another player into a Werewolf.',
  'Mystic Wolf':
    'You count as a Werewolf. On the first night, inspect one other player.',
  'Dream Wolf':
    'You are on the Wolf Team, but you do not wake with the other wolves.',
  Minion:
    'You are not a Werewolf, but you win with the wolves. Your job is to protect them in discussion.',
  Squire:
    'You help the wolves and can learn who they are. You win with the Wolf Team.',
  Sorceress:
    'You win with the wolves. Each night, see who the wolves are and choose a player to learn whether they are the Seer.',
  Seer:
    'Each night, choose a player. You learn whether that player is a Villager (any non-wolf role) or a Werewolf.',
  'Aura Seer':
    'Pick a player each night. A positive result means they are neither a basic Villager nor a Werewolf — they hold a special role.',
  'Private Investigator':
    'Once per game, pick a player. You learn whether that player or either living neighbor appears to be a Werewolf.',
  'Apprentice Seer':
    'You have no night action while the Seer lives. The moment the Seer is eliminated, you become the Seer and wake each night to inspect a player.',
  Robber:
    'Swap your card with another player and learn the card you took. Your team may change.',
  Troublemaker:
    'Once per game, choose any number of players to be eliminated the following day. They are auto-eliminated at dawn. You may skip on any night and use this later.',
  Drunk:
    'You are a regular Villager for the first two nights. On the third night, you sober up and learn your true role — that role activates from then on.',
  Insomniac:
    'At the end of the night, check your own card to see what you became.',
  Mason:
    'Wake to find other Masons. If no one appears, you are the only Mason.',
  Hunter:
    'You have no night action. If you are eliminated by the village vote, you choose any living player to immediately eliminate. Wolf kills, Witch potions, heartbreak and other deaths do not trigger this.',
  Tanner:
    'You are alone. You only win if the village votes you out. Wolf kills do not count.',
  Mayor:
    'You do not wake at night. During voting, your submitted vote is worth two.',
  Pacifist:
    'You do not wake at night. During trial, your vote is forced to Save. Your accusation vote is free.',
  Lycan:
    'You are on the village team, but Seer-style investigations see you as a Werewolf.',
  'Cult Leader':
    'Each night, choose a living player to join your cult. You win the moment every living player (including you) is in the cult.',
  Spellcaster:
    'Each night, choose a player. They cannot speak in the day chat tomorrow.',
  Cupid:
    'On the first night, link two players. If either is eliminated, the other dies of heartbreak immediately.',
  Cursed:
    'You are on the Village team. The first time the Werewolves target you for a kill, you join the pack as a Werewolf instead of dying.',
  Diseased:
    'You have no night action. If the Werewolves kill you, they cannot eliminate anyone the following night.',
  // Ghost role removed — see comment in ROLE_SUBTITLES. Ghost-chat is conferred
  // to all players on death; no longer a deck role.
  'Lone Wolf':
    'You wake with the Werewolves and count as a wolf. You only win if you are the last living player at the end of the game.',
  'Old Hag':
    'Each night, choose a player. They are banished from the next day — no day chat, no accusation, no trial vote.',
  'Tough Guy':
    'You have no night action. If the Werewolves attack you, you survive that night and die at the start of the next night.',
  'Wolf Cub':
    'You wake and hunt with the Werewolves. If you are killed, the wolves get to eliminate two players on the following night.',
  Vampire:
    'Each night, mark one player. They die the moment they receive their second accusation vote — across any day.',
  Sentinel:
    'Shield another player so their card cannot be viewed or moved that night.',
  Doppelganger:
    'On the first night, choose a player. If that player dies later, you immediately become their role.',
  'Paranormal Investigator':
    'Inspect carefully. If you see a Werewolf or Tanner, your role changes to match that team.',
  Witch:
    'You hold two potions: one save and one kill, each usable once per game. Each night you may use either potion on a living player or skip to save them for later. You may save the same target you also kill on a different night.',
  'Village Idiot':
    'On the FIRST NIGHT ONLY, choose Left or Right to rotate the roles of every other living player one seat in that direction. Each affected player receives a private notice telling them what they became. You do not wake on later nights. During trial, your vote is forced to Eliminate, and your accusation vote is forced to a real player (no skip).',
  Revealer:
    'Reveal a player if allowed. Werewolf and Tanner cards stay hidden.',
  Curator:
    'Place an artifact on a player. Artifacts can change final powers or teams.',
  Bodyguard:
    'Each night, choose one living player. They cannot be eliminated that night. You may not protect yourself.',
  Priest:
    'Once per game, choose a living player. They cannot be eliminated at night. You may skip on any night and use this later.',
  Jailer:
    'Jail one living player to protect them from night kills.',
  Prince:
    'You do not wake at night. The first time the village votes to eliminate you, your role is revealed and the elimination is canceled. A second vote will eliminate you normally.',
  Villager:
    'You have no night action. Watch behavior, compare claims, and find the Werewolves.',
  // New role descriptions
  'Dawn Bringer':
    'You have no night action. Once per game, during the day or accusation phase, you may declare “I AM THE DAWNBRINGER!” — your role is revealed to all and the coming night passes without any kills or targeting effects.',
  Disruptor:
    'Each night, choose a player. That player wakes and picks a target as normal, but their power is scrambled — the action has no effect. They receive a private notice the next dawn. The Disruptor themselves cannot be scrambled.',
  'Mad Bomber':
    'You have no night action. If you are eliminated by any means, the players immediately seated to your left and right are also eliminated in the explosion.',
  'The Reflector':
    'Each night, choose a player. If any other player targets that same player later in the night, their action is reflected — they affect themselves instead of the intended target.',
  Yandere:
    'On the first night, choose a player as your obsession. Up to 3 times on subsequent nights, you may activate their shield — they become immune to all night-targeted effects (wolf bite, witch potion, troublemaker call, vampire mark, spellcaster silence, old hag banish). For kill attempts, the attacker dies in your obsession\'s place. You win as a side-bonus whenever your obsession is alive at game end.',
  Cthulhu:
    'Each night, choose a player and type a word. That player becomes crazed the following day — they may only say that specific word in the town chat. The word is delivered to them as a private message.',
};

const ROLE_ICONS = {
  Werewolf: PawPrint,
  Wolverine: PawPrint,
  'Alpha Wolf': Crown,
  'Mystic Wolf': Eye,
  'Dream Wolf': Moon,
  Minion: VenetianMask,
  Squire: Hammer,
  Sorceress: VenetianMask,
  Seer: Globe,
  'Aura Seer': Eye,
  'Private Investigator': Compass,
  'Apprentice Seer': Telescope,
  Robber: HandCoins,
  Troublemaker: Repeat,
  Drunk: Beer,
  Insomniac: BedDouble,
  Mason: Users,
  Hunter: Crosshair,
  Tanner: Skull,
  Mayor: Crown,
  Pacifist: Hand,
  Lycan: PawPrint,
  Sentinel: ShieldCheck,
  Doppelganger: Copy,
  'Paranormal Investigator': Compass,
  Witch: WandSparkles,
  'Village Idiot': Sparkles,
  Revealer: Sun,
  Curator: Gem,
  Bodyguard: ShieldCheck,
  Priest: Church,
  Jailer: Lock,
  Prince: Crown,
  Villager: Wheat,
  // GPT-Roles
  'Cult Leader': Crown,
  Spellcaster: WandSparkles,
  Cupid: Sparkles,
  Cursed: Skull,
  Diseased: Skull,
  Ghost: Skull,
  'Lone Wolf': PawPrint,
  'Old Hag': VenetianMask,
  'Tough Guy': ShieldCheck,
  'Wolf Cub': PawPrint,
  Vampire: VenetianMask,
  Alien: Rocket,
  Blob: CircleDot,
  Mortician: ScrollText,
  Oracle: Eye,
  Marksman: Target,
  Empath: Hand,
  Psychic: Stars,
  Leader: Crown,
  Rascal: Shuffle,
  Exposer: Sun,
  Nostradamus: Stars,
  'Body Snatcher': Copy,
  'The Count': Castle,
  'Synthetic Alien': Rocket,
  Cow: UtensilsCrossed,
  Groob: CircleDot,
  Zerb: CircleDot,
  Gremlin: Skull,
  Pickpocket: HandCoins,
  Renfield: VenetianMask,
  Instigator: Vote,
  Assassin: Swords,
  'Apprentice Assassin': Swords,
  'Thing (that goes bump in the night)': Skull,
};

const ROLE_FACTIONS = {
  Werewolf: 'Wolf Team',
  Wolverine: 'Wolf Team',
  'Alpha Wolf': 'Wolf Team',
  'Mystic Wolf': 'Wolf Team',
  'Dream Wolf': 'Wolf Team',
  'Wolf Cub': 'Wolf Team',
  Minion: 'Wolf Ally',
  Squire: 'Wolf Ally',
  Sorceress: 'Wolf Ally',
  Tanner: 'Solo',
  Lycan: 'Village',
  Cursed: 'Village',
  Diseased: 'Village',
  'Tough Guy': 'Village',
  Ghost: 'Village',
  'Old Hag': 'Village',
  Spellcaster: 'Village',
  Cupid: 'Village',
  'Cult Leader': 'Solo',
  'Lone Wolf': 'Solo',
  Vampire: 'Solo',
  // New roles
  'Dawn Bringer': 'Village',
  Disruptor: 'Neutral',
  'Mad Bomber': 'Village',
  'The Reflector': 'Village',
  Yandere: 'Neutral',
  Cthulhu: 'Evil',
  'The Master': 'Vampire',
  'The Count': 'Vampire',
  Alien: 'Alien',
  Blob: 'Solo',
};

const REAL_WOLF_ROLES = new Set(['Werewolf', 'Alpha Wolf', 'Wolverine', 'Wolf Cub', 'Lone Wolf']);
const ALIN_PRESET_SUMMARY = '1 WW variant / 1 Detection / 1 Power / 1 Neutral / 1 Village';

const getSubtitle = (role) => ROLE_SUBTITLES[role] || 'No special night power.';
const getRoleDetail = (role) =>
  ROLE_DETAILS[role] || 'Follow the prompt when your turn appears. Your card stays visible through the night.';

const buildScaledDeck = (playerCount, style = 'balanced') => {
  const wolvesCount = playerCount >= 7 ? 2 : 1;
  const detectionCount = playerCount >= 8 ? 2 : 1;
  const protectorCount = playerCount >= 9 ? 2 : 1;

  let neutralCount = 0;
  let soloCount = 0;
  if (playerCount === 5) {
    neutralCount = 1;
  } else if (playerCount >= 6) {
    neutralCount = 1;
    soloCount = 1;
  }

  const playerSeatsNeeded = playerCount - wolvesCount - detectionCount - protectorCount - neutralCount - soloCount;

  let wolvesPool = ['Werewolf', 'Alpha Wolf', 'Mystic Wolf', 'Wolverine'];
  if (playerCount < 7) {
    wolvesPool = wolvesPool.filter((role) => role !== 'Mystic Wolf');
  }
  let detectionPool = ['Seer', 'Aura Seer', 'Private Investigator', 'Apprentice Seer'];
  let protectorPool = ['Bodyguard', 'Priest', 'Jailer'];
  let neutralPool = ['Tanner', 'Disruptor', 'Old Hag', 'Spellcaster', 'Yandere', 'Cthulhu'];
  let soloPool = ['Cult Leader', 'Vampire'];
  let passivePool = ['Hunter', 'Mayor', 'Prince', 'Pacifist', 'Lycan', 'Cursed', 'Tough Guy', 'Mad Bomber'];
  let otherPool = ['Robber', 'Troublemaker', 'Witch', 'Drunk', 'Insomniac', 'Village Idiot', 'Revealer', 'Dawn Bringer', 'The Reflector'];

  if (style === 'gentle') {
    wolvesPool = ['Werewolf', 'Dream Wolf'];
    detectionPool = ['Seer', 'Apprentice Seer', 'Aura Seer'];
    protectorPool = ['Bodyguard', 'Priest', 'Jailer'];
    neutralPool = ['Tanner'];
    passivePool = ['Prince', 'Mayor', 'Pacifist', 'Tough Guy'];
    otherPool = ['Insomniac', 'Mason', 'Robber'];
  } else if (style === 'chaos') {
    wolvesPool = ['Alpha Wolf', 'Mystic Wolf', 'Wolverine'];
    if (playerCount < 7) {
      wolvesPool = wolvesPool.filter((role) => role !== 'Mystic Wolf');
    }
    detectionPool = ['Private Investigator', 'Aura Seer'];
    protectorPool = ['Yandere', 'Jailer'];
    neutralPool = ['Disruptor', 'Cthulhu', 'Spellcaster', 'Old Hag'];
    passivePool = ['Mad Bomber', 'Cursed', 'Lycan'];
    otherPool = ['The Reflector', 'Witch', 'Troublemaker', 'Drunk', 'Village Idiot'];
  }

  const draw = (pool, n) => {
    return pool.slice(0, n);
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
      playerCards.push(...draw(otherPool, remainingNeeded));
    }
  }

  const selected = new Set(playerCards);
  const allPoolOrdered = [
    ...wolvesPool,
    ...detectionPool,
    ...protectorPool,
    ...neutralPool,
    ...soloPool,
    ...passivePool,
    ...otherPool
  ];
  const leftovers = allPoolOrdered.filter(role => !selected.has(role));
  const centerCards = leftovers.slice(0, 3);
  while (centerCards.length < 3) {
    centerCards.push('Villager');
  }

  return [...playerCards, ...centerCards];
};

const summarizeDeckShape = (playerCount) => {
  const wolves = playerCount >= 7 ? 2 : 1;
  const detection = playerCount >= 8 ? 2 : 1;
  const protector = playerCount >= 9 ? 2 : 1;

  let neutrals = 0;
  let solos = 0;
  if (playerCount === 5) {
    neutrals = 1;
  } else if (playerCount >= 6) {
    neutrals = 1;
    solos = 1;
  }

  const passives = playerCount - wolves - detection - protector - neutrals - solos;
  const parts = [
    `${wolves} WW`,
    `${detection} Det`,
    `${protector} Prot`
  ];
  if (neutrals > 0) parts.push(`${neutrals} Neut`);
  if (solos > 0) parts.push(`${solos} Solo`);
  if (passives > 0) parts.push(`${passives} Pass`);

  return parts.join(' / ');
};

const GameHeader = ({
  roomId,
  dayCount,
  onLeave,
  onOpenRuleBook,
  muted,
  volume,
  onToggleMute,
  onVolumeChange,
  onOpenBotConsole,
  botCount,
}) => (
  <div className="game-header">
    <h2>
      <Moon size={20} color="var(--amber-glow)" /> Nightfall
    </h2>
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <div className="status-badge">
        {roomId} · Day {dayCount}
      </div>
      {onOpenRuleBook && (
        <button
          className="btn-secondary rule-book-btn"
          onClick={onOpenRuleBook}
          aria-label="Open rule book"
          title="Rule Book"
        >
          <BookOpen size={15} />
          <span>Rule Book</span>
        </button>
      )}
      {onOpenBotConsole && botCount > 0 && (
        <button
          className="btn-secondary rule-book-btn bot-console-btn"
          onClick={onOpenBotConsole}
          aria-label="Open bot debug console"
          title={`Bot debug console — ${botCount} bot${botCount === 1 ? '' : 's'}`}
        >
          <Terminal size={15} />
          <span>Bots ({botCount})</span>
        </button>
      )}
      {onToggleMute && (
        <div className="volume-control">
          <button
            className="btn-secondary volume-btn"
            onClick={onToggleMute}
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          {onVolumeChange && (
            <input
              type="range"
              className="volume-slider"
              min="0"
              max="1"
              step="0.05"
              value={muted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              aria-label="Volume"
              style={{ '--vol': `${(muted ? 0 : volume) * 100}%` }}
            />
          )}
        </div>
      )}
      <button
        className="btn-secondary"
        style={{ padding: '6px 10px' }}
        onClick={onLeave}
        aria-label="Leave room"
      >
        <LogOut size={14} />
      </button>
    </div>
  </div>
);

const RoleCard = ({ role, subtitle, detail }) => {
  const RoleIcon = ROLE_ICONS[role] || BadgeQuestionMark;
  const color = ROLE_COLORS[role] || 'var(--accent)';
  const faction = ROLE_FACTIONS[role] || 'Village';
  const image = getRoleImage(role);

  if (image) {
    return (
      <div className="role-card-wrap">
        <div
          className="role-card-graphic has-art"
          style={{ '--role-color': color }}
        >
          <img className="role-card-art" src={image} alt={`${role} card`} />
        </div>
        <div className="role-card-note">
          <strong>{role}</strong>
          <em>{faction}</em>
          {subtitle && <span>{subtitle}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="role-card-wrap">
      <div className="role-card-graphic" style={{ '--role-color': color }}>
        <span className="role-card-corner tl">✦</span>
        <span className="role-card-corner tr">✦</span>
        <span className="role-card-corner-fleur bl">❦</span>
        <span className="role-card-corner-fleur br">❦</span>
        <div className="role-card-sigil">
          <RoleIcon size={52} strokeWidth={1.6} />
        </div>
        <div className="role-card-inner">
          <h2>{role}</h2>
          {subtitle && <p className="role-subtitle">{subtitle}</p>}
          {detail && <p className="role-detail">{detail}</p>}
        </div>
      </div>
      <div className="role-card-note role-card-note-compact">
        <em>{faction}</em>
      </div>
    </div>
  );
};

const ProgressMeter = ({ progress, label }) => {
  if (!progress || !progress.total) return null;
  const current = progress.acted ?? progress.voted ?? 0;
  const pct = Math.min(100, Math.max(0, (current / progress.total) * 100));

  return (
    <div className="progress-meter">
      <div className="progress-meter-copy">
        <span>{label}</span>
        <strong>
          {current}/{progress.total}
        </strong>
      </div>
      <div className="progress-meter-track">
        <div className="progress-meter-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const PhaseCommandPanel = ({ icon, kicker, title, status, progress, progressLabel, actions, children }) => (
  <div className="phase-command-panel">
    <div className="phase-command-header">
      <div>
        <div className="command-kicker">
          {icon} {kicker}
        </div>
        <h3 className="command-title">{title}</h3>
      </div>
      <div className="phase-command-side">
        {status && <span className="command-status">{status}</span>}
        {actions && <div className="phase-command-actions">{actions}</div>}
      </div>
    </div>
    <ProgressMeter progress={progress} label={progressLabel} />
    <div className="phase-command-body">{children}</div>
  </div>
);

const EventLogPanel = ({ events = [] }) => (
  <div className="event-log">
    <h4>
      <ScrollText size={14} />
      Town Crier
    </h4>
    <div className="event-log-list">
      {events.length === 0 ? (
        <p className="event-log-empty">No public events yet.</p>
      ) : (
        events.slice(-8).map((msg, i) => (
          <p key={`${msg.ts || i}-${i}`}>
            <strong>{msg.sender}:</strong> {msg.text}
          </p>
        ))
      )}
    </div>
  </div>
);

const NoticeStack = ({ notices = [] }) => {
  if (!notices.length) return null;
  return (
    <div className="notice-stack">
      {notices.slice(-3).map((notice) => (
        <div key={notice.id || notice.ts} className={`private-notice ${notice.type || ''}`}>
          <strong>{notice.title || 'Notice'}</strong>
          <span>{notice.message}</span>
        </div>
      ))}
    </div>
  );
};

const RoleHelpModal = ({ role, onClose }) => {
  if (!role) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content role-help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="role-help-grid">
          <RoleCard role={role} subtitle={getSubtitle(role)} detail={getRoleDetail(role)} />
          <div className="role-help-copy">
            <div className="command-kicker">
              <BookOpen size={14} /> Role Guide
            </div>
            <h2>{role}</h2>
            <p>{getSubtitle(role)}</p>
            <p>{getRoleDetail(role)}</p>
            <button className="btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* All roles surfaced in the rule book, grouped by faction */
const RULE_BOOK_GROUPS = [
  {
    name: 'Werewolves',
    blurb: 'Wake together. Hunt at night. Win when they reach parity with the village.',
    color: '#ef4444',
    roles: ['Werewolf', 'Wolverine', 'Alpha Wolf', 'Mystic Wolf', 'Dream Wolf', 'Wolf Cub'],
  },
  {
    name: 'Wolf Allies',
    blurb: 'Help the wolves win — but they are not wolves themselves.',
    color: '#f87171',
    roles: ['Minion', 'Squire', 'Sorceress'],
  },
  {
    name: 'Village — Power Roles',
    blurb: 'Unique night abilities to gather information or reshape the deck.',
    color: '#8b5cf6',
    roles: [
      'Seer', 'Apprentice Seer', 'Robber', 'Troublemaker', 'Drunk', 'Insomniac',
      'Aura Seer', 'Private Investigator', 'Witch', 'Doppelganger',
      'Paranormal Investigator', 'Village Idiot', 'Revealer', 'Mason',
      'Spellcaster', 'Old Hag', 'Cupid',
    ],
  },
  {
    name: 'Village — Protectors',
    blurb: 'Defend the village from the darker forces of the night.',
    color: '#10b981',
    roles: ['Bodyguard', 'Priest', 'Jailer', 'Sentinel', 'Hunter', 'Prince', 'Mayor', 'Pacifist', 'Lycan', 'Tough Guy', 'Diseased'],
  },
  {
    name: 'Villagers',
    blurb: 'No special power. Watch, deduce, debate, and vote.',
    color: '#f59e0b',
    roles: ['Villager', 'Cursed'],
  },
  {
    name: 'Solo Win Conditions',
    blurb: 'Independent factions. They play for themselves.',
    color: '#a855f7',
    roles: ['Tanner', 'Lone Wolf', 'Cult Leader', 'Vampire'],
  },
  {
    name: 'Special & Neutral',
    blurb: 'Unique mechanics that twist the game for everyone at the table.',
    color: '#818cf8',
    roles: ['Dawn Bringer', 'Mad Bomber', 'The Reflector', 'Disruptor', 'Yandere', 'Cthulhu'],
  },
];


const RULE_BOOK_PHASES = [
  {
    icon: 'Moon',
    title: 'Night',
    body: 'Each role wakes in the order printed on this page. The current actor sees a private prompt and a brief result; the table stays in night view until everyone has acted.',
  },
  {
    icon: 'Sun',
    title: 'Day',
    body: 'The town wakes, the dead are revealed, and the discussion timer runs. Use Town Chat (if enabled) and any private clues to make your case.',
  },
  {
    icon: 'Vote',
    title: 'Accusation',
    body: 'Every living player casts one accusation vote (or skips). The single highest vote becomes the accused. Ties or no-votes mean nobody is accused — night falls again.',
  },
  {
    icon: 'BookOpen',
    title: 'Defense & Trial',
    body: 'The accused gets the floor to defend themselves, then the village votes Eliminate or Save. Mayor counts double. Pacifist always votes Save.',
  },
];

const RULE_BOOK_WINS = [
  { who: 'Village', text: 'All werewolves are eliminated and no solo role has triggered a win.' },
  { who: 'Wolves', text: 'Living wolves equal or outnumber living non-wolves (Lone Wolves do not count toward this).' },
  { who: 'Tanner', text: 'The Tanner is eliminated by the village vote (not by a wolf kill).' },
  { who: 'Lone Wolf', text: 'The Lone Wolf is the last living player at the table.' },
  { who: 'Cult Leader', text: 'Every living player has been recruited into the Cult Leader\'s cult.' },
  { who: 'Vampire', text: 'Survives long enough to keep marking the right targets — wins with whichever side they are still on at game end.' },
];

const PHASE_ICON_MAP = { Moon, Sun, Vote, BookOpen };

const HunterRevengeModal = ({ open, players, playerId, onConfirm, onPass }) => {
  const [target, setTarget] = useState(null);
  useEffect(() => {
    if (open) return undefined;
    const reset = setTimeout(() => setTarget(null), 0);
    return () => clearTimeout(reset);
  }, [open]);
  if (!open) return null;
  const eligible = (players || []).filter((p) => !p.isDead && p.id !== playerId);
  return (
    <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
      <div className="modal-content" style={{ maxWidth: 520 }}>
        <h2 style={{ marginTop: 0 }}>Final Shot</h2>
        <p style={{ color: 'var(--text-soft)', fontStyle: 'italic' }}>
          The village voted you out. Choose any living player to take down with you, or pass.
        </p>
        <div className="players-list" style={{ marginTop: '0.8rem' }}>
          {eligible.map((p) => (
            <div
              key={p.id}
              className={`player-card selectable ${target === p.id ? 'selected' : ''}`}
              onClick={() => setTarget(p.id)}
            >
              {p.name}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: '0.8rem' }}>
          <button className="btn-secondary" onClick={onPass}>Pass</button>
          <button
            className="btn-primary"
            disabled={!target}
            onClick={() => onConfirm(target)}
          >
            Take Them Down
          </button>
        </div>
      </div>
    </div>
  );
};

const WAKE_ORDER = [
  'Doppelganger',
  'Sentinel',
  'Cupid',
  'Curator',
  'Yandere',
  'The Reflector',
  'Disruptor',
  'Jailer',
  'Priest',
  'Bodyguard',
  'Cthulhu',
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
  'Yandere', // Yandere also wakes Night 1 for obsession pick, then every night after
]);

const THIRD_NIGHT_ONLY_WAKE_ROLES = new Set(['Drunk']);


const RuleBookModal = ({ open, onClose, currentRole }) => {
  const [page, setPage] = useState('roles'); // 'roles' or 'rules'
  const [selectedRole, setSelectedRole] = useState(null);
  const [factionFilter, setFactionFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileView, setMobileView] = useState('list'); // 'list' or 'detail'
  const scrollRef = useRef(null);

  useEffect(() => {
    if (open) {
      setSelectedRole(currentRole || 'Werewolf');
      setPage(currentRole ? 'roles' : 'rules');
      setMobileView(currentRole ? 'detail' : 'list');
    }
  }, [open, currentRole]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [page, factionFilter, selectedRole]);

  const scrollToSection = (id) => {
    const node = scrollRef.current?.querySelector(`[data-section="${id}"]`);
    if (node && scrollRef.current) {
      scrollRef.current.scrollTo({ top: node.offsetTop - 8, behavior: 'smooth' });
    }
  };

  if (!open) return null;

  // Filter roles based on search and faction
  const filteredRoles = [];
  RULE_BOOK_GROUPS.forEach(g => {
    if (factionFilter === 'All' || g.name === factionFilter) {
      g.roles.forEach(r => {
        if (r.toLowerCase().includes(searchQuery.toLowerCase())) {
          if (!filteredRoles.includes(r)) {
            filteredRoles.push(r);
          }
        }
      });
    }
  });

  const renderRolesList = () => {
    return (
      <div className="sidebar-list">
        {filteredRoles.map(role => {
          const isSelected = selectedRole === role;
          const image = getRoleImage(role);
          const faction = ROLE_FACTIONS[role] || 'Village';
          const color = ROLE_COLORS[role] || 'var(--accent)';
          const RoleIcon = ROLE_ICONS[role] || BadgeQuestionMark;
          
          return (
            <button
              key={role}
              className={`rule-book-list-item ${isSelected ? 'is-selected' : ''}`}
              style={{ '--role-color': color }}
              onClick={() => {
                setSelectedRole(role);
                setMobileView('detail');
              }}
            >
              <div className="list-item-sigil">
                {image ? (
                  <img src={image} alt="" />
                ) : (
                  <RoleIcon size={20} strokeWidth={1.5} />
                )}
              </div>
              <div className="list-item-body">
                <span className="list-item-name">{role}</span>
                <span className="list-item-faction">{faction}</span>
              </div>
              {currentRole === role && <span className="list-item-badge">Yours</span>}
            </button>
          );
        })}
        {filteredRoles.length === 0 && (
          <div style={{ color: 'var(--text-faded)', fontStyle: 'italic', padding: '16px', textAlign: 'center', fontSize: '0.86rem' }}>
            No matching roles found
          </div>
        )}
      </div>
    );
  };

  const renderRulesToc = () => {
    return (
      <div className="sidebar-list" style={{ gap: '8px', paddingTop: '8px' }}>
        <button className="sidebar-rule-item" onClick={() => scrollToSection('flow')}>
          <span>How a Round Flows</span>
        </button>
        <button className="sidebar-rule-item" onClick={() => scrollToSection('wins')}>
          <span>Win Conditions</span>
        </button>
        <button className="sidebar-rule-item" onClick={() => scrollToSection('house')}>
          <span>House Rules</span>
        </button>
      </div>
    );
  };

  const renderRulesContent = () => (
    <div className="rule-book-rules">
      <section className="rule-book-illum" data-section="flow">
        <header><h3>How a Round Flows</h3></header>
        <ol className="rule-book-phases">
          {RULE_BOOK_PHASES.map((phase) => {
            const Icon = PHASE_ICON_MAP[phase.icon] || BookOpen;
            return (
              <li key={phase.title}>
                <span className="rule-book-phase-icon"><Icon size={16} /></span>
                <div>
                  <h4>{phase.title}</h4>
                  <p>{phase.body}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="rule-book-illum" data-section="wins">
        <header><h3>Win Conditions</h3></header>
        <ul className="rule-book-wins">
          {RULE_BOOK_WINS.map((w) => (
            <li key={w.who}>
              <strong>{w.who}.</strong> <span>{w.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rule-book-illum" data-section="house">
        <header><h3>House Rules</h3></header>
        <ul className="rule-book-fineprint">
          <li><strong>Bodyguard armor.</strong> Two lives — absorbs the first wolf bite or trial vote against the Bodyguard or their guarded target.</li>
          <li><strong>Sentinel shield.</strong> The shielded card cannot be viewed or moved that night.</li>
          <li><strong>Jailed players.</strong> Cannot be killed at night and cannot perform their own action.</li>
          <li><strong>Cupid link.</strong> If either linked player dies for any reason, their partner dies of heartbreak.</li>
          <li><strong>Tough Guy delay.</strong> Survives the first wolf attack but dies at the start of the following night.</li>
          <li><strong>Wolf Cub rage.</strong> When the Wolf Cub is killed, the pack gets a second random kill the next night.</li>
          <li><strong>Diseased bite.</strong> If the wolves kill the Diseased, they cannot kill anyone the next night.</li>
          <li><strong>Vampire mark.</strong> The marked player dies the moment they receive their second accusation across the game.</li>
        </ul>
      </section>
    </div>
  );

  const renderRoleDetail = (role) => {
    if (!role) return <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '24px', textAlign: 'center' }}>Select a role from the index to view details.</div>;
    
    const image = getRoleImage(role);
    const color = ROLE_COLORS[role] || 'var(--accent)';
    const faction = ROLE_FACTIONS[role] || 'Village';
    const RoleIcon = ROLE_ICONS[role] || BadgeQuestionMark;
    
    return (
      <div className="role-detail-layout" style={{ '--role-color': color }}>
        <div className="role-detail-card-side">
          <div className="role-card-wrap" style={{ margin: '0 auto 12px' }}>
            <div className={`role-card-graphic ${image ? 'has-art' : ''}`} style={{ '--role-color': color }}>
              {image ? (
                <img src={image} alt={role} className="role-card-art" />
              ) : (
                <>
                  <div className="role-card-corner tl">{role[0]}</div>
                  <div className="role-card-corner tr">{role[0]}</div>
                  <div className="role-card-sigil">
                    <RoleIcon size={46} strokeWidth={1.5} />
                  </div>
                  <div className="role-card-inner">
                    <span className="role-kicker">{faction}</span>
                    <h2>{role}</h2>
                    <p className="role-subtitle">{ROLE_SUBTITLES[role] || 'No special night power.'}</p>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="role-detail-meta-list" style={{ width: '100%', maxWidth: 240 }}>
            <div className="role-detail-meta-item">
              <span>Faction</span>
              <strong style={{ color }}>{faction}</strong>
            </div>
            <div className="role-detail-meta-item">
              <span>Night Action</span>
              <strong>{WAKE_ORDER.includes(role) ? 'Wakes Nightly' : FIRST_NIGHT_ONLY_WAKE_ROLES.has(role) ? 'First Night Only' : THIRD_NIGHT_ONLY_WAKE_ROLES.has(role) ? 'Night 3 Only' : 'Passive / No Wake'}</strong>
            </div>
          </div>
        </div>
        
        <div className="role-detail-text-side">
          <div className="role-detail-header">
            <h3 className="role-detail-name">{role}</h3>
            <span className="role-detail-badge" style={{ backgroundColor: color }}>{faction}</span>
          </div>
          
          <p className="role-detail-subtitle">{ROLE_SUBTITLES[role] || 'No special night power.'}</p>
          
          <div className="role-detail-section">
            <h4>Abilities & Rules</h4>
            <p>{ROLE_DETAILS[role] || 'Follow the prompt when your turn appears. Your card stays visible through the night.'}</p>
          </div>
          
          {WAKE_ORDER.includes(role) && (
            <div className="role-detail-section">
              <h4>Wake Queue Position</h4>
              <p>Wakes at position {WAKE_ORDER.indexOf(role) + 1} of {WAKE_ORDER.length} during the night phase.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleBackToSidebar = () => {
    setMobileView('list');
  };

  return (
    <div className="modal-overlay rule-book-overlay" onClick={onClose}>
      <div 
        className="rule-book-dashboard" 
        onClick={(e) => e.stopPropagation()}
        style={{
          '--sidebar-display': mobileView === 'list' ? 'flex' : 'none',
          '--content-display': mobileView === 'detail' || page === 'rules' ? 'flex' : 'none',
        }}
      >
        <div className="rule-book-sidebar">
          <div className="sidebar-tabs">
            <button 
              className={`sidebar-tab ${page === 'rules' ? 'is-active' : ''}`}
              onClick={() => setPage('rules')}
            >
              <BookOpen size={14} /> Rules
            </button>
            <button 
              className={`sidebar-tab ${page === 'roles' ? 'is-active' : ''}`}
              onClick={() => {
                setPage('roles');
                setMobileView('list');
              }}
            >
              <VenetianMask size={14} /> Roles
            </button>
          </div>

          {page === 'roles' && (
            <div className="sidebar-search-wrap">
              <input 
                type="text"
                className="sidebar-search-input"
                placeholder="Search roles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="sidebar-faction-chips">
                <button 
                  className={`sidebar-faction-chip ${factionFilter === 'All' ? 'is-active' : ''}`}
                  onClick={() => setFactionFilter('All')}
                >
                  All
                </button>
                {RULE_BOOK_GROUPS.map((g) => (
                  <button 
                    key={g.name}
                    className={`sidebar-faction-chip ${factionFilter === g.name ? 'is-active' : ''}`}
                    style={{ '--chip-color': g.color }}
                    onClick={() => setFactionFilter(g.name)}
                  >
                    <span className="sidebar-faction-dot" />
                    {g.name === 'Solo Win Conditions' ? 'Solo' : g.name.replace('Village – ', '')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {page === 'roles' ? renderRolesList() : renderRulesToc()}

          {currentRole && (
            <div 
              className="rule-book-bookmark-modern" 
              onClick={() => {
                setPage('roles');
                setSelectedRole(currentRole);
                setMobileView('detail');
              }}
            >
              <div className="bookmark-icon-wrap">
                <VenetianMask size={14} />
              </div>
              <div className="bookmark-copy">
                <span>Your Active Role</span>
                <strong>{currentRole}</strong>
              </div>
            </div>
          )}
        </div>

        <div className="rule-book-content">
          <div className="rule-book-content-head">
            <div className="content-head-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {mobileView === 'detail' && page === 'roles' && (
                <button 
                  className="btn-secondary" 
                  onClick={handleBackToSidebar}
                  style={{ display: 'inline-flex', padding: '6px 12px', minHeight: 32, fontSize: '0.85rem' }}
                >
                  ← Index
                </button>
              )}
              <div>
                <h2>{page === 'rules' ? 'The Game Codex' : 'Tome of Roles'}</h2>
                <p>
                  {page === 'rules' 
                    ? 'Phases, win conditions, and the small print that governs every game.' 
                    : `Viewing information for ${selectedRole}`}
                </p>
              </div>
            </div>
            <button className="rule-book-close-btn" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>

          <div className="rule-book-content-scroll" ref={scrollRef}>
            {page === 'rules' ? renderRulesContent() : renderRoleDetail(selectedRole)}
          </div>
        </div>
      </div>
    </div>
  );
};

const VillageProfileCard = ({ playerName }) => (
  <div className="village-profile-card">
    <div className="profile-moon" aria-hidden="true" />
    <div className="profile-avatar">
      {playerName?.[0]?.toUpperCase() || '?'}
    </div>
    <div className="profile-copy">
      <span>Seated Villager</span>
      <strong>{playerName || 'Player'}</strong>
    </div>
  </div>
);

const DealingAnimation = ({ playerName }) => (
  <div className="dealing-board" aria-hidden="true">
    <div className="dealer-stack">
      <span />
      <span />
      <span />
    </div>
    <div className="deal-flight-card flight-one" />
    <div className="deal-flight-card flight-two" />
    <VillageProfileCard playerName={playerName} />
  </div>
);

const BotDebugConsole = ({ open, onClose, botDebug, onClear }) => {
  if (!open) return null;
  const bots = botDebug?.bots || [];
  const log = botDebug?.log || [];
  return (
    <div className="bot-console-overlay" onClick={onClose}>
      <div
        className="bot-console-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Bot debug console"
      >
        <header className="bot-console-head">
          <div className="bot-console-title">
            <Terminal size={16} />
            <h2>Bot Debug Console</h2>
            <span className="bot-console-pin">Host only</span>
          </div>
          <div className="bot-console-actions">
            <button
              className="btn-secondary"
              onClick={onClear}
              title="Clear log"
              aria-label="Clear log"
            >
              <Trash2 size={14} /> Clear
            </button>
            <button
              className="btn-secondary"
              onClick={onClose}
              aria-label="Close"
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
        </header>
        <section className="bot-console-bots">
          <h3>Live Bot Roles</h3>
          {bots.length === 0 ? (
            <p className="bot-console-empty">No bots in this room.</p>
          ) : (
            <div className="bot-role-grid">
              {bots.map((b) => (
                <div key={b.id} className={`bot-role-card ${b.isDead ? 'dead' : ''}`}>
                  <div className="bot-role-name">
                    <Bot size={13} /> {b.name}
                    {b.isDead && <span className="bot-role-dead">†</span>}
                  </div>
                  <div className="bot-role-meta">
                    <span className="bot-role-tag">Dealt</span>
                    <strong>{b.originalRole || '—'}</strong>
                  </div>
                  {b.currentRole && b.currentRole !== b.originalRole && (
                    <div className="bot-role-meta">
                      <span className="bot-role-tag">Now</span>
                      <strong style={{ color: 'var(--amber-glow)' }}>{b.currentRole}</strong>
                    </div>
                  )}
                  {b.bodyguardLives != null && (
                    <div className="bot-role-meta">
                      <span className="bot-role-tag">BG</span>
                      <strong>{b.bodyguardLives} lives</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="bot-console-log">
          <h3>Decision Stream ({log.length})</h3>
          {log.length === 0 ? (
            <p className="bot-console-empty">No bot decisions logged yet.</p>
          ) : (
            <ol className="bot-log-list">
              {[...log].reverse().map((entry, i) => {
                const stamp = new Date(entry.time).toLocaleTimeString();
                const isSystem = entry.bot === 'System' || entry.bot === 'Pack';
                const isWin = entry.action?.startsWith('win:');
                const isError = entry.action?.startsWith('result:error');
                const rowClass = [
                  'bot-log-row',
                  isWin && 'win-row',
                  isError && 'error-row',
                  !isWin && !isError && isSystem && 'system-row',
                ].filter(Boolean).join(' ');
                return (
                  <li key={`${entry.time}-${i}`} className={rowClass}>
                    <span className="bot-log-time">{stamp}</span>
                    <span className="bot-log-phase">{entry.phase}/D{entry.day}</span>
                    <span className="bot-log-bot">{entry.bot}</span>
                    <span className="bot-log-role">{entry.role}</span>
                    <span className="bot-log-action">{entry.action}</span>
                    <span className="bot-log-detail">{entry.detail}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
};

/* ─── Phase countdown ───
   Driven by the server's wall-clock deadline instead of by tick arrival, so a
   late or dropped tick can't freeze or desync the clock on screen. Falls back
   to the plain second count if a phase reports no deadline. */
const prefersReducedMotion = () =>
  typeof window !== 'undefined'
  && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const usePhaseCountdown = (phaseEndsAt, fallbackSeconds = 0) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!phaseEndsAt) return undefined;
    // Sync once on the next tick so a phase starting after an idle stretch isn't
    // measured against a stale clock, then keep pace four times a second.
    const sync = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => {
      clearTimeout(sync);
      clearInterval(id);
    };
  }, [phaseEndsAt]);

  if (!phaseEndsAt) return Math.max(0, Math.floor(fallbackSeconds) || 0);
  return Math.max(0, Math.ceil((phaseEndsAt - now) / 1000));
};

const pad2 = (n) => String(n).padStart(2, '0');
const formatClock = (seconds) => `${pad2(Math.floor(seconds / 60))}:${pad2(seconds % 60)}`;

/* Isolated for the same reason as PhaseTimer: a clock that re-renders its own
   handful of characters, not the board behind it. */
const ClockText = ({ endsAt, fallback }) => formatClock(usePhaseCountdown(endsAt, fallback));

/* ─── Phase timer ───
   The countdown ring drains as the phase burns down and shifts through calm →
   urgent → critical, so time pressure is legible at a glance instead of
   requiring players to read digits. */
const TIMER_RADIUS = 32;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS;

const PhaseTimer = ({ endsAt, fallback, total, label }) => {
  // The countdown lives here rather than in App. Hoisted, its 4Hz tick
  // re-rendered the whole board — twelve seats, every panel — four times a
  // second. Owning it locally keeps each tick to this dial.
  const seconds = usePhaseCountdown(endsAt, fallback);
  const span = total > 0 ? total : Math.max(seconds, 1);
  const remaining = Math.max(0, Math.min(1, seconds / span));
  const urgency = seconds <= 5 ? 'critical' : seconds <= 15 ? 'urgent' : 'calm';
  const minutes = Math.floor(seconds / 60);

  return (
    <div
      className={`center-timer phase-timer is-${urgency}`}
      role="timer"
      aria-live={urgency === 'critical' ? 'assertive' : 'off'}
      aria-label={`${seconds} seconds remaining`}
    >
      <svg className="phase-timer-ring" viewBox="0 0 72 72" aria-hidden="true">
        <circle className="phase-timer-track" cx="36" cy="36" r={TIMER_RADIUS} />
        <circle
          className="phase-timer-sweep"
          cx="36"
          cy="36"
          r={TIMER_RADIUS}
          strokeDasharray={TIMER_CIRCUMFERENCE}
          strokeDashoffset={TIMER_CIRCUMFERENCE * (1 - remaining)}
        />
      </svg>
      <span className="phase-timer-face">
        <span className="phase-timer-digits">
          {pad2(minutes)}:{pad2(seconds % 60)}
        </span>
        {label && <span className="phase-timer-label">{label}</span>}
      </span>
    </div>
  );
};

/* ─── Phase cinematics ───
   A short sweep between phases so the change of act registers before the new
   board does. Purely decorative: never blocks input, and is skipped outright
   when the player asks for reduced motion. */
const PHASE_CINEMATICS = {
  night: {
    tone: 'night',
    kicker: 'Nightfall',
    title: 'The Village Sleeps',
    line: 'Doors bolt. Lanterns die. Something is awake.',
    duration: 2000,
  },
  day: {
    tone: 'dawn',
    kicker: 'Daybreak',
    title: 'The Village Wakes',
    line: 'Count the living. Name the missing.',
    duration: 2000,
  },
  accusation: {
    tone: 'accusation',
    kicker: 'The Reckoning',
    title: 'Point a Finger',
    line: 'Suspicion hardens into a name.',
    duration: 1500,
  },
  defense: {
    tone: 'defense',
    kicker: 'The Defence',
    title: 'Speak, Accused',
    line: 'One voice against the crowd.',
    duration: 1500,
  },
  trial: {
    tone: 'trial',
    kicker: 'The Verdict',
    title: 'Judgement Falls',
    line: 'Mercy or the rope. Decide.',
    duration: 1500,
  },
};

const PhaseCinematic = ({ scene }) => {
  if (!scene) return null;
  return (
    <div
      key={scene.id}
      className={`phase-cinematic tone-${scene.tone}`}
      style={{ '--cinematic-duration': `${scene.duration}ms` }}
      aria-hidden="true"
    >
      <div className="phase-cinematic-veil" />
      <div className="phase-cinematic-rays" />
      <div className="phase-cinematic-copy">
        <span className="phase-cinematic-kicker">{scene.kicker}</span>
        <strong className="phase-cinematic-title">{scene.title}</strong>
        <span className="phase-cinematic-line">{scene.line}</span>
      </div>
      <div className="phase-cinematic-rule" />
    </div>
  );
};

/* ─── Chronicle ───
   The payoff of a social deduction game is the story you only learn at the end:
   who the Seer checked, who the Bodyguard saved, that the village lynched the
   Tanner on night two. The engine records every beat as it happens and seals it
   until the game is over; this lays the whole thing out as a timeline. */
const CHRONICLE_META = {
  open: { Icon: Users, tone: 'neutral' },
  death: { Icon: Skull, tone: 'blood' },
  transform: { Icon: Sparkles, tone: 'magic' },
  accusation: { Icon: Vote, tone: 'amber' },
  verdict: { Icon: Swords, tone: 'amber' },
  spared: { Icon: ShieldCheck, tone: 'green' },
  vote: { Icon: Vote, tone: 'neutral' },
  end: { Icon: Crown, tone: 'gold' },
};

const CAUSE_LABELS = {
  wolves: 'taken by the pack',
  vote: 'condemned by the village',
  bomber: "caught in the bomber's blast",
  heartbreak: 'died of a broken heart',
  wounds: 'succumbed to their wounds',
  night: 'lost in the night',
};

/* Fold the flat entry list into acts — one per night and per day — so the
   timeline reads as chapters rather than a stream. */
const groupChronicle = (entries) => {
  const acts = [];
  entries.forEach((entry) => {
    const isNight = entry.phase === 'night' || entry.phase === 'dealing';
    const key = entry.type === 'open' ? 'open'
      : entry.type === 'end' ? 'end'
        : `${isNight ? 'night' : 'day'}-${entry.day}`;
    const label = entry.type === 'open' ? 'The Table'
      : entry.type === 'end' ? 'The Reckoning'
        : `${isNight ? 'Night' : 'Day'} ${entry.day}`;
    let act = acts[acts.length - 1];
    if (!act || act.key !== key) {
      act = { key, label, isNight, entries: [] };
      acts.push(act);
    }
    act.entries.push(entry);
  });
  return acts;
};

const ChronicleTimeline = ({ entries = [] }) => {
  if (!entries.length) return null;
  const acts = groupChronicle(entries);

  return (
    <div className="chronicle">
      <h4 className="chronicle-heading">
        <ScrollText size={14} />
        The Chronicle
      </h4>
      <p className="chronicle-sub">Everything that happened, including what you weren&apos;t told.</p>

      <ol className="chronicle-acts">
        {acts.map((act) => (
          <li key={act.key} className={`chronicle-act ${act.isNight ? 'is-night' : 'is-day'}`}>
            <div className="chronicle-act-head">
              {act.isNight ? <Moon size={12} /> : <Sun size={12} />}
              <span>{act.label}</span>
            </div>
            <ul className="chronicle-entries">
              {act.entries.map((entry, i) => {
                const meta = CHRONICLE_META[entry.type] || CHRONICLE_META.vote;
                const { Icon } = meta;
                return (
                  <li key={`${entry.ts}-${i}`} className={`chronicle-entry tone-${meta.tone}`}>
                    <span className="chronicle-entry-icon"><Icon size={13} /></span>
                    <div className="chronicle-entry-body">
                      <span className="chronicle-entry-text">{entry.text}</span>
                      {entry.cause && CAUSE_LABELS[entry.cause] && (
                        <span className="chronicle-entry-note">{CAUSE_LABELS[entry.cause]}</span>
                      )}
                      {entry.lineup && (
                        <span className="chronicle-lineup">
                          {entry.lineup.map((seat) => (
                            <span key={seat.playerId} className="chronicle-seat">
                              {seat.name}
                              <strong style={{ color: ROLE_COLORS[seat.role] || 'var(--amber-glow)' }}>
                                {seat.role}
                              </strong>
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
};

/* ─── Quick guide ───
   Nightfall deals from a pool of fifty-odd roles, and a first-timer landing in
   a lobby has no idea what a wake queue is or why nothing is happening. Five
   cards covering the actual loop, shown once, skippable at any point, and
   reopenable from the lobby afterwards. */
const QUICK_GUIDE_KEY = 'ww_guide_seen';

const QUICK_GUIDE_STEPS = [
  {
    Icon: VenetianMask,
    tone: 'violet',
    kicker: 'Step one',
    title: 'You are dealt a secret',
    body: 'Your card decides what you can do at night and which side you win with. Nobody else sees it. Some cards can change hands while you sleep.',
  },
  {
    Icon: Moon,
    tone: 'moon',
    kicker: 'Step two',
    title: 'Night falls',
    body: 'Roles wake one at a time. The wolves choose someone to kill. Others look, protect, swap or meddle. You only ever see your own turn.',
  },
  {
    Icon: Sun,
    tone: 'amber',
    kicker: 'Step three',
    title: 'Day breaks',
    body: 'The village learns who died — and nothing else. Now everybody talks, and some of them lie. This is where the game is actually played.',
  },
  {
    Icon: Vote,
    tone: 'crimson',
    kicker: 'Step four',
    title: 'Someone hangs',
    body: 'Accuse a player, hear them defend themselves, then vote to condemn or spare. Guess wrong and you have handed the wolves a free night.',
  },
  {
    Icon: Crown,
    tone: 'gold',
    kicker: 'How it ends',
    title: 'Last side standing',
    body: 'The village wins when every werewolf is gone. The wolves win the moment they match or outnumber everyone else. A few odd cards want something else entirely.',
  },
];

const QuickGuide = ({ open, onClose }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setStep((s) => Math.min(s + 1, QUICK_GUIDE_STEPS.length - 1));
      if (e.key === 'ArrowLeft') setStep((s) => Math.max(s - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const current = QUICK_GUIDE_STEPS[step];
  const { Icon } = current;
  const isLast = step === QUICK_GUIDE_STEPS.length - 1;

  return (
    <div className="guide-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Quick guide">
      <div className={`guide-card tone-${current.tone}`} onClick={(e) => e.stopPropagation()}>
        <button className="guide-skip" onClick={onClose}>Skip</button>

        <div className="guide-icon"><Icon size={26} /></div>
        <span className="guide-kicker">{current.kicker}</span>
        <h3 className="guide-title">{current.title}</h3>
        <p className="guide-body">{current.body}</p>

        <div className="guide-dots" aria-hidden="true">
          {QUICK_GUIDE_STEPS.map((s, i) => (
            <span key={s.title} className={`guide-dot ${i === step ? 'is-current' : ''}`} />
          ))}
        </div>

        <div className="guide-actions">
          <button
            className="btn-secondary"
            onClick={() => setStep((s) => Math.max(s - 1, 0))}
            disabled={step === 0}
          >
            Back
          </button>
          {isLast ? (
            <button className="btn-primary" onClick={onClose}>Let me play</button>
          ) : (
            <button className="btn-primary" onClick={() => setStep((s) => s + 1)}>Next</button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Reconnect badge ───
   A dropped player is usually on their way back — a locked phone, a refreshed
   tab, a tunnel. Showing their seat counting down tells the table to wait
   instead of reading the silence as a quit. */
const ReconnectBadge = ({ deadline }) => {
  const secondsLeft = usePhaseCountdown(deadline, 0);
  if (!deadline || secondsLeft <= 0) {
    return <span className="player-badge muted-badge">Offline</span>;
  }
  return (
    <span className="player-badge reconnect-badge" title="Holding their seat">
      <span className="reconnect-pip" aria-hidden="true" />
      Back in {secondsLeft}s
    </span>
  );
};

/* Ambient layers every scene shares, plus whatever cinematic is mid-flight. */
const SceneAtmosphere = ({ cinematic = null }) => (
  <>
    <AmbientEmbers />
    <PhaseCinematic scene={cinematic} />
  </>
);

function App() {
  const [inRoom, setInRoom] = useState(
    () => !!(getStoredValue('ww_roomId') && getStoredValue('ww_name'))
  );
  const [roomId, setRoomId] = useState(() => getStoredValue('ww_roomId'));
  const [name, setName] = useState(() => getStoredValue('ww_name'));
  const [playerId] = useState(getOrCreatePlayerId);
  const [gameState, setGameState] = useState(null);

  const [roomsList, setRoomsList] = useState([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCustomDeck, setShowCustomDeck] = useState(false);
  const [roleHelpRole, setRoleHelpRole] = useState(null);
  const [showRuleBook, setShowRuleBook] = useState(false);
  // Shown once on a player's first lobby, and reopenable from there afterwards.
  const [showQuickGuide, setShowQuickGuide] = useState(
    () => getStoredValue(QUICK_GUIDE_KEY) !== '1'
  );
  const dismissQuickGuide = () => {
    setShowQuickGuide(false);
    try { localStorage.setItem(QUICK_GUIDE_KEY, '1'); } catch { /* noop */ }
  };
  const [showBotConsole, setShowBotConsole] = useState(false);
  const [muted, setMuted] = useState(() => {
    const stored = getStoredValue('ww_muted');
    return stored === '1';
  });
  const [volume, setVolume] = useState(() => {
    const stored = parseFloat(getStoredValue('ww_volume'));
    return Number.isFinite(stored) ? Math.min(Math.max(stored, 0), 1) : 0.6;
  });
  const [lobbyMusicMuted, setLobbyMusicMuted] = useState(() => {
    const stored = getStoredValue('ww_lobby_music_muted');
    return stored === '1';
  });
  const [lobbyMusicVolume, setLobbyMusicVolume] = useState(() => {
    const stored = parseFloat(getStoredValue('ww_lobby_music_volume'));
    const quietDefaultApplied = getStoredValue('ww_lobby_music_quiet_default') === '1';
    if (Number.isFinite(stored)) {
      return quietDefaultApplied ? Math.min(Math.max(stored, 0), 1) : Math.min(Math.max(stored, 0), 0.15);
    }
    return 0.12;
  });
  const wolfAudioRef = useRef(null);
  const morningAudioRef = useRef(null);
  const lobbyAudioRef = useRef(null);
  const lastPhaseRef = useRef(null);
  const audioUnlockedRef = useRef(false);
  const executionAudioRef = useRef({});
  const cthulhuProcRef = useRef({ ctx: null, stop: null });
  const beesV2ProcRef = useRef({ ctx: null, stop: null });
  const mutedRef = useRef(muted);
  const volumeRef = useRef(volume);
  const lobbyMusicMutedRef = useRef(lobbyMusicMuted);
  const lobbyMusicVolumeRef = useRef(lobbyMusicVolume);
  const isLobbyView = !inRoom || !gameState;
  const isLobbyViewRef = useRef(isLobbyView);
  const [executionScene, setExecutionScene] = useState(null);
  const [phaseCinematic, setPhaseCinematic] = useState(null);
  const lastCinematicPhase = useRef(null);

  // Play a short sweep whenever the act changes. The very first state we receive
  // is skipped — arriving mid-game shouldn't trigger a transition for a phase the
  // player was never in.
  useEffect(() => {
    const phase = gameState?.phase;
    if (!phase) return undefined;
    if (lastCinematicPhase.current === null) {
      lastCinematicPhase.current = phase;
      return undefined;
    }
    if (lastCinematicPhase.current === phase) return undefined;
    lastCinematicPhase.current = phase;

    const spec = PHASE_CINEMATICS[phase];
    if (!spec || prefersReducedMotion()) return undefined;

    // Deferred a frame so the incoming phase paints before the sweep starts.
    const start = setTimeout(() => setPhaseCinematic({ ...spec, id: `${phase}-${Date.now()}` }), 0);
    const clear = setTimeout(() => setPhaseCinematic(null), spec.duration);
    return () => {
      clearTimeout(start);
      clearTimeout(clear);
    };
  }, [gameState?.phase]);


  useEffect(() => {
    mutedRef.current = muted;
    volumeRef.current = volume;
    lobbyMusicMutedRef.current = lobbyMusicMuted;
    lobbyMusicVolumeRef.current = lobbyMusicVolume;
    isLobbyViewRef.current = isLobbyView;
  }, [muted, volume, lobbyMusicMuted, lobbyMusicVolume, isLobbyView]);

  useEffect(() => {
    if (typeof Audio === 'undefined') return;
    if (!wolfAudioRef.current) {
      wolfAudioRef.current = new Audio('/wolf.mp3');
      wolfAudioRef.current.preload = 'auto';
    }
    if (!morningAudioRef.current) {
      morningAudioRef.current = new Audio('/morning.mp3');
      morningAudioRef.current.preload = 'auto';
    }
    if (!lobbyAudioRef.current) {
      lobbyAudioRef.current = new Audio('/Nightfall.mp3');
      lobbyAudioRef.current.preload = 'auto';
      lobbyAudioRef.current.loop = true;
    }
    const execTypes = ['tentacles', 'thunder', 'void', 'bees', 'bees_v2', 'cthulhu_abyss'];
    const execAudioUrl = (t) => {
      if (t === 'cthulhu_abyss') return '/cthulhu-custom.mp3';
      if (t === 'bees_v2') return '/exec-bees.mp3'; // share the buzz track with bees v1
      return `/exec-${t}.mp3`;
    };
    execTypes.forEach((t) => {
      if (!executionAudioRef.current[t]) {
        const a = new Audio(execAudioUrl(t));
        a.preload = 'auto';
        executionAudioRef.current[t] = a;
      }
    });
    const unlock = () => {
      if (audioUnlockedRef.current) return;
      audioUnlockedRef.current = true;
      const tryUnlock = (a) => {
        if (!a) return;
        try {
          a.muted = true;
          const p = a.play();
          if (p && typeof p.then === 'function') {
            p.then(() => { a.pause(); a.currentTime = 0; a.muted = mutedRef.current; }).catch(() => {});
          }
        } catch { /* noop */ }
      };
      tryUnlock(wolfAudioRef.current);
      tryUnlock(morningAudioRef.current);
      const lobbyAudio = lobbyAudioRef.current;
      if (lobbyAudio && isLobbyViewRef.current && !lobbyMusicMutedRef.current) {
        try {
          lobbyAudio.muted = false;
          lobbyAudio.volume = Math.min(Math.max(lobbyMusicVolumeRef.current, 0), 1);
          const p = lobbyAudio.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        } catch { /* noop */ }
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  useEffect(() => {
    const clamp = (v) => Math.min(Math.max(v, 0), 1);
    const audio = lobbyAudioRef.current;
    if (!audio) return;
    audio.loop = true;
    audio.muted = lobbyMusicMuted || lobbyMusicVolume <= 0;
    audio.volume = clamp(lobbyMusicVolume);
    try {
      localStorage.setItem('ww_lobby_music_muted', lobbyMusicMuted ? '1' : '0');
      localStorage.setItem('ww_lobby_music_volume', String(lobbyMusicVolume));
      localStorage.setItem('ww_lobby_music_quiet_default', '1');
    } catch { /* noop */ }

    if (isLobbyView && !lobbyMusicMuted && lobbyMusicVolume > 0) {
      try {
        const p = audio.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch { /* noop */ }
    } else {
      try {
        audio.pause();
        if (!isLobbyView) audio.currentTime = 0;
      } catch { /* noop */ }
    }
  }, [isLobbyView, lobbyMusicMuted, lobbyMusicVolume]);

  const volumePreviewMountRef = useRef(true);
  useEffect(() => {
    const clamp = (v) => Math.min(Math.max(v, 0), 1);
    if (wolfAudioRef.current) {
      wolfAudioRef.current.muted = muted;
      wolfAudioRef.current.volume = clamp(volume * 1.0);
    }
    if (morningAudioRef.current) {
      morningAudioRef.current.muted = muted;
      morningAudioRef.current.volume = clamp(volume * 0.85);
    }
    try {
      localStorage.setItem('ww_muted', muted ? '1' : '0');
      localStorage.setItem('ww_volume', String(volume));
    } catch { /* noop */ }
    if (volumePreviewMountRef.current) {
      volumePreviewMountRef.current = false;
      return;
    }
    if (muted || !audioUnlockedRef.current) return;
    const a = morningAudioRef.current;
    if (!a) return;
    try {
      a.pause();
      a.currentTime = 0;
      const p = a.play();
      if (p && typeof p.then === 'function') p.catch(() => {});
      const t = setTimeout(() => { try { a.pause(); a.currentTime = 0; } catch { /* noop */ } }, 450);
      return () => clearTimeout(t);
    } catch { /* noop */ }
  }, [muted, volume]);

  useEffect(() => {
    const phase = gameState?.phase;
    const prev = lastPhaseRef.current;
    if (phase && phase !== prev) {
      const playSound = (audio) => {
        if (!audio || muted) return;
        try {
          audio.currentTime = 0;
          const p = audio.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
        } catch { /* noop */ }
      };
      if (phase === 'night' && prev !== 'night') playSound(wolfAudioRef.current);
      if (phase === 'day' && prev !== 'day' && prev !== null) playSound(morningAudioRef.current);
      lastPhaseRef.current = phase;
    }
  }, [gameState?.phase, muted]);

  const [selectedTarget1, setSelectedTarget1] = useState(null);
  const [selectedTarget2, setSelectedTarget2] = useState(null);
  const [troublemakerTargets, setTroublemakerTargets] = useState([]);
  const [hunterRevengePrompt, setHunterRevengePrompt] = useState(false);
  const [actionResult, setActionResult] = useState(null);
  const [privateNotices, setPrivateNotices] = useState([]);

  const [wwChat, setWwChat] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [globalChat, setGlobalChat] = useState([]);
  const [villagerChat, setVillagerChat] = useState([]);
  const [villagerChatInput, setVillagerChatInput] = useState('');
  const [ghostChat, setGhostChat] = useState([]);
  const [ghostChatInput, setGhostChatInput] = useState('');
  const chatEndRef = useRef(null);
  const villagerChatEndRef = useRef(null);
  const ghostChatEndRef = useRef(null);
  const jailerChatEndRef = useRef(null);

  const [jailerChatInput, setJailerChatInput] = useState('');
  const [jailerChatSecondsLeft, setJailerChatSecondsLeft] = useState(60);

  useEffect(() => {
    if (gameState?.jailerChatActive && gameState?.jailerChatExpiresAt) {
      const updateCountdown = () => {
        const diff = Math.max(0, Math.ceil((gameState.jailerChatExpiresAt - Date.now()) / 1000));
        setJailerChatSecondsLeft(diff);
      };
      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState?.jailerChatActive, gameState?.jailerChatExpiresAt]);

  useEffect(() => {
    if (gameState?.jailerChatMessages?.length > 0) {
      jailerChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameState?.jailerChatMessages]);

  const sendJailerMessage = (e) => {
    e.preventDefault();
    if (!jailerChatInput.trim()) return;
    socket.emit('jailerMessage', jailerChatInput);
    setJailerChatInput('');
  };

  const lastActionContextRef = useRef(null);
  const lastPhaseContextRef = useRef(null);

  useEffect(() => {
    const handleConnect = () => {
      const storedRoom = localStorage.getItem('ww_roomId');
      const storedName = localStorage.getItem('ww_name');
      const storedToken = localStorage.getItem('nightfall_session_token') || null;
      if (storedRoom && storedName) {
        socket.emit('joinRoom', { roomId: storedRoom, name: storedName, playerId, sessionToken: storedToken });
      }
    };

    const handleGameState = (state) => {
      setGameState(state);
      if (Array.isArray(state.eventLog)) setGlobalChat(state.eventLog);
      const selectionContext = [
        state.phase,
        state.dayCount,
        state.currentNightAction || '',
        state.myActiveRole || '',
      ].join(':');
      if (lastActionContextRef.current !== selectionContext) {
        setSelectedTarget1(null);
        setSelectedTarget2(null);
        if (state.currentNightAction && state.myActiveRole) setActionResult(null);
        lastActionContextRef.current = selectionContext;
      }
      // Only clear the action result when the phase or night flips —
      // detection results (Seer/Mason/etc) must remain readable for the rest of the night.
      const phaseContext = `${state.phase}:${state.dayCount}`;
      if (lastPhaseContextRef.current !== phaseContext) {
        setActionResult(null);
        lastPhaseContextRef.current = phaseContext;
      }
    };

    const handleActionResult = (result) => {
      setActionResult(result);
      // Errors should not pin to screen — auto-clear after a short window
      // so the player can retry their action.
      if (result?.type === 'error') {
        setTimeout(() => {
          setActionResult((current) =>
            current && current.type === 'error' && current.message === result.message
              ? null
              : current
          );
        }, 4000);
      }
    };
    const handleRoomsList = (rooms) => setRoomsList(rooms);
    const handlePrivateNotice = (notice) => {
      const item = { id: `${notice.ts || Date.now()}-${Math.random()}`, ...notice };
      setPrivateNotices((prev) => [...prev.slice(-2), item]);
      setTimeout(() => {
        setPrivateNotices((prev) => prev.filter((n) => n.id !== item.id));
      }, 7000);
      if (notice && notice.type === 'hunterRevenge') {
        setHunterRevengePrompt(true);
      }
    };
    const handleWwChatMessage = (msg) => {
      setWwChat((prev) => [...prev, msg]);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };
    const handleChatMessage = (msg) => setGlobalChat((prev) => [...prev, msg]);
    const handleVillagerChatMessage = (msg) => {
      setVillagerChat((prev) => [...prev, msg]);
      setTimeout(() => villagerChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };
    const handleGhostChatMessage = (msg) => {
      setGhostChat((prev) => [...prev, msg]);
      setTimeout(() => ghostChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    socket.on('connect', handleConnect);
    socket.on('gameState', handleGameState);
    socket.on('actionResult', handleActionResult);
    socket.on('privateNotice', handlePrivateNotice);
    socket.on('roomsList', handleRoomsList);
    socket.on('wwChatMessage', handleWwChatMessage);
    socket.on('chatMessage', handleChatMessage);
    socket.on('villagerChatMessage', handleVillagerChatMessage);
    socket.on('ghostChatMessage', handleGhostChatMessage);
    // Procedural underbed for the cthulhu_abyss scene: subharmonic drone + brown-noise abyssal
    // pressure + a scheduled "wet grab" envelope at the wrap-landing moment + sparse bubble pops.
    // Plays alongside the cthulhu-custom.mp3 track, gated by the master mute/volume controls.
    const startCthulhuProcedural = (durationMs, masterVolume) => {
      try {
        let ctx = cthulhuProcRef.current.ctx;
        if (!ctx) {
          const Ctx = window.AudioContext || window.webkitAudioContext;
          if (!Ctx) return;
          ctx = new Ctx();
          cthulhuProcRef.current.ctx = ctx;
        }
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        const now = ctx.currentTime;
        const durSec = durationMs / 1000;
        const procVol = Math.min(0.45, Math.max(masterVolume, 0) * 0.55);
        const out = ctx.createGain();
        out.gain.setValueAtTime(0, now);
        out.gain.linearRampToValueAtTime(procVol, now + 0.7);
        out.gain.setValueAtTime(procVol, now + Math.max(durSec - 1.4, 0.8));
        out.gain.linearRampToValueAtTime(0, now + durSec);
        out.connect(ctx.destination);
        const nodes = [out];

        // 1) Subharmonic drone (~38 Hz) with slow LFO wobble
        const sub = ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(38, now);
        const subGain = ctx.createGain();
        subGain.gain.setValueAtTime(0.9, now);
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.7, now);
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 4;
        lfo.connect(lfoGain).connect(sub.frequency);
        sub.connect(subGain).connect(out);
        sub.start(now);
        lfo.start(now);
        sub.stop(now + durSec + 0.2);
        lfo.stop(now + durSec + 0.2);
        nodes.push(sub, subGain, lfo, lfoGain);

        // 2) Brown-noise bed filtered low — "abyssal pressure"
        const noiseLen = 2 * ctx.sampleRate;
        const buf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
        const arr = buf.getChannelData(0);
        let last = 0;
        for (let i = 0; i < noiseLen; i++) {
          const white = Math.random() * 2 - 1;
          last = (last + 0.02 * white) / 1.02;
          arr[i] = last * 3.4;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        noise.loop = true;
        const bp = ctx.createBiquadFilter();
        bp.type = 'lowpass';
        bp.frequency.setValueAtTime(220, now);
        bp.frequency.linearRampToValueAtTime(420, now + durSec * 0.55);
        bp.frequency.linearRampToValueAtTime(160, now + durSec);
        bp.Q.value = 0.7;
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(0.16, now);
        nGain.gain.linearRampToValueAtTime(0.32, now + durSec * 0.6);
        nGain.gain.linearRampToValueAtTime(0.05, now + durSec);
        noise.connect(bp).connect(nGain).connect(out);
        noise.start(now);
        noise.stop(now + durSec + 0.2);
        nodes.push(noise, bp, nGain);

        // 3) "Wet grab" envelope at the wrap-landing moment (~55% of the scene)
        const grabAt = now + Math.min(durSec * 0.55, durSec - 1);
        const grabLen = Math.floor(0.55 * ctx.sampleRate);
        const grabBuf = ctx.createBuffer(1, grabLen, ctx.sampleRate);
        const grabData = grabBuf.getChannelData(0);
        for (let i = 0; i < grabLen; i++) {
          const tt = i / ctx.sampleRate;
          const env = Math.exp(-tt * 6);
          grabData[i] = (Math.random() * 2 - 1) * env;
        }
        const grab = ctx.createBufferSource();
        grab.buffer = grabBuf;
        const grabBP = ctx.createBiquadFilter();
        grabBP.type = 'bandpass';
        grabBP.frequency.value = 560;
        grabBP.Q.value = 1.5;
        const grabGain = ctx.createGain();
        grabGain.gain.value = 0.65;
        grab.connect(grabBP).connect(grabGain).connect(out);
        grab.start(grabAt);
        nodes.push(grab, grabBP, grabGain);

        // 4) Sparse bubble pops scattered through the scene
        for (let i = 0; i < 14; i++) {
          const t = now + 1.2 + Math.random() * (durSec - 2.4);
          const popLen = Math.floor(0.18 * ctx.sampleRate);
          const popBuf = ctx.createBuffer(1, popLen, ctx.sampleRate);
          const popData = popBuf.getChannelData(0);
          const freq = 1100 + Math.random() * 700;
          for (let j = 0; j < popLen; j++) {
            const tt = j / ctx.sampleRate;
            const env = Math.exp(-tt * 28);
            popData[j] = Math.sin(tt * 2 * Math.PI * freq) * env * 0.55;
          }
          const pop = ctx.createBufferSource();
          pop.buffer = popBuf;
          const popGain = ctx.createGain();
          popGain.gain.value = 0.07 + Math.random() * 0.06;
          pop.connect(popGain).connect(out);
          pop.start(t);
          nodes.push(pop, popGain);
        }

        const stop = () => {
          try {
            const t = ctx.currentTime;
            out.gain.cancelScheduledValues(t);
            out.gain.setValueAtTime(out.gain.value, t);
            out.gain.linearRampToValueAtTime(0, t + 0.12);
            setTimeout(() => {
              nodes.forEach((n) => {
                try { if (typeof n.stop === 'function') n.stop(); } catch { /* noop */ }
                try { n.disconnect(); } catch { /* noop */ }
              });
            }, 200);
          } catch { /* noop */ }
        };
        cthulhuProcRef.current.stop = stop;
      } catch { /* noop */ }
    };

    const stopCthulhuProcedural = () => {
      const fn = cthulhuProcRef.current.stop;
      cthulhuProcRef.current.stop = null;
      if (typeof fn === 'function') fn();
    };

    // Procedural buzz layer for the bees_v2 scene: 6 detuned FM-modulated sawtooths
    // make the swarm tone, a brown-noise wood thud lands at the poke moment, and
    // a master gain envelope tracks the bee emergence curve (quiet → angry → fade).
    const startBeesV2Procedural = (durationMs, masterVolume) => {
      try {
        let ctx = beesV2ProcRef.current.ctx;
        if (!ctx) {
          const Ctx = window.AudioContext || window.webkitAudioContext;
          if (!Ctx) return;
          ctx = new Ctx();
          beesV2ProcRef.current.ctx = ctx;
        }
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});

        const now = ctx.currentTime;
        const durSec = durationMs / 1000;
        const procVol = Math.min(0.4, Math.max(masterVolume, 0) * 0.5);
        const out = ctx.createGain();
        // Envelope tracks the bee emergence curve:
        //   silent until ~2.2s, scout fades in by ~3.5s, swarm peaks at ~7s,
        //   sustains while engulfing the cage, then drops as it's carried off.
        out.gain.setValueAtTime(0, now);
        out.gain.setValueAtTime(0, now + 2.2);
        out.gain.linearRampToValueAtTime(procVol * 0.25, now + 3.5);
        out.gain.linearRampToValueAtTime(procVol * 0.85, now + 5.2);
        out.gain.linearRampToValueAtTime(procVol, now + 7);
        out.gain.setValueAtTime(procVol, now + Math.min(durSec - 3, 11));
        out.gain.linearRampToValueAtTime(procVol * 0.25, now + Math.min(durSec - 0.4, 13.6));
        out.gain.linearRampToValueAtTime(0, now + durSec);
        out.connect(ctx.destination);
        const nodes = [out];

        // Six detuned sawtooth voices form the swarm tone.
        const baseFreq = 235;
        const detunes = [-22, -10, -3, 4, 12, 24];
        detunes.forEach((d) => {
          const osc = ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(baseFreq, now);
          osc.detune.setValueAtTime(d * 100, now);
          // FM wobble — gives the buzz its characteristic vibrato
          const fm = ctx.createOscillator();
          fm.frequency.setValueAtTime(16 + Math.random() * 8, now);
          const fmGain = ctx.createGain();
          fmGain.gain.value = 12 + Math.random() * 8;
          fm.connect(fmGain).connect(osc.frequency);
          const lp = ctx.createBiquadFilter();
          lp.type = 'lowpass';
          lp.frequency.setValueAtTime(620, now);
          lp.frequency.linearRampToValueAtTime(1900, now + 7);
          lp.frequency.linearRampToValueAtTime(900, now + durSec);
          lp.Q.value = 1.6;
          const oscGain = ctx.createGain();
          oscGain.gain.value = 0.14;
          osc.connect(lp).connect(oscGain).connect(out);
          osc.start(now);
          fm.start(now);
          osc.stop(now + durSec + 0.2);
          fm.stop(now + durSec + 0.2);
          nodes.push(osc, fm, fmGain, lp, oscGain);
        });

        // Wood thud at the poke moment (~3.2s into the scene).
        const thudAt = now + 3.2;
        const thudLen = Math.floor(0.32 * ctx.sampleRate);
        const thudBuf = ctx.createBuffer(1, thudLen, ctx.sampleRate);
        const thudData = thudBuf.getChannelData(0);
        for (let i = 0; i < thudLen; i++) {
          const t = i / ctx.sampleRate;
          const env = Math.exp(-t * 14);
          // Mix sub-thump (40 Hz sine) with filtered noise for "wooden" tonality
          const sub = Math.sin(t * 2 * Math.PI * 40) * env;
          const noise = (Math.random() * 2 - 1) * env * 0.4;
          thudData[i] = (sub * 0.7 + noise) * 0.85;
        }
        const thud = ctx.createBufferSource();
        thud.buffer = thudBuf;
        const thudFilter = ctx.createBiquadFilter();
        thudFilter.type = 'lowpass';
        thudFilter.frequency.value = 320;
        const thudGain = ctx.createGain();
        thudGain.gain.value = 0.65;
        thud.connect(thudFilter).connect(thudGain).connect(ctx.destination);
        thud.start(thudAt);
        nodes.push(thud, thudFilter, thudGain);

        // Second thud slightly later — the other poker jabs the hive
        const thud2 = ctx.createBufferSource();
        thud2.buffer = thudBuf;
        const thud2Filter = ctx.createBiquadFilter();
        thud2Filter.type = 'lowpass';
        thud2Filter.frequency.value = 280;
        const thud2Gain = ctx.createGain();
        thud2Gain.gain.value = 0.55;
        thud2.connect(thud2Filter).connect(thud2Gain).connect(ctx.destination);
        thud2.start(thudAt + 0.5);
        nodes.push(thud2, thud2Filter, thud2Gain);

        const stop = () => {
          try {
            const t = ctx.currentTime;
            out.gain.cancelScheduledValues(t);
            out.gain.setValueAtTime(out.gain.value, t);
            out.gain.linearRampToValueAtTime(0, t + 0.12);
            setTimeout(() => {
              nodes.forEach((n) => {
                try { if (typeof n.stop === 'function') n.stop(); } catch { /* noop */ }
                try { n.disconnect(); } catch { /* noop */ }
              });
            }, 200);
          } catch { /* noop */ }
        };
        beesV2ProcRef.current.stop = stop;
      } catch { /* noop */ }
    };

    const stopBeesV2Procedural = () => {
      const fn = beesV2ProcRef.current.stop;
      beesV2ProcRef.current.stop = null;
      if (typeof fn === 'function') fn();
    };

    const handleExecutionScene = (payload) => {
      if (!payload || !payload.type) return;
      // Cinema-length scenes get a longer client clamp so the choreography survives.
      let duration;
      if (payload.type === 'cthulhu_abyss') {
        // Cthulhu v2: 16s mapped to the 8s-24s window of the custom track.
        duration = Math.max(8000, Math.min(payload.duration || 16000, 16000));
      } else if (payload.type === 'bees_v2') {
        // Bees v2 "poke the hive" sequence: 14s.
        duration = Math.max(8000, Math.min(payload.duration || 14000, 14000));
      } else {
        duration = Math.max(1500, Math.min(payload.duration || 4500, 12000));
      }
      const startedAt = Date.now();
      setExecutionScene({
        type: payload.type,
        victimName: payload.victimName || '',
        accusedId: payload.accusedId,
        startedAt,
        duration,
      });
      const audio = executionAudioRef.current[payload.type];
      let cthulhuAudioWatcher = null;
      if (audio && !mutedRef.current) {
        try {
          audio.muted = false;
          audio.volume = Math.min(Math.max(volumeRef.current, 0), 1);
          audio.currentTime = payload.type === 'cthulhu_abyss' ? 8 : 0;
          const p = audio.play();
          if (p && typeof p.catch === 'function') p.catch(() => {});
          if (payload.type === 'cthulhu_abyss') {
            // Hard-stop at exactly the 24-second mark of the source track.
            cthulhuAudioWatcher = () => {
              if (audio.currentTime >= 24) {
                try { audio.pause(); audio.currentTime = 0; } catch { /* noop */ }
                audio.removeEventListener('timeupdate', cthulhuAudioWatcher);
              }
            };
            audio.addEventListener('timeupdate', cthulhuAudioWatcher);
            // Layer the procedural underbed alongside the song.
            startCthulhuProcedural(duration, volumeRef.current);
          }
          if (payload.type === 'bees_v2') {
            startBeesV2Procedural(duration, volumeRef.current);
          }
        } catch { /* noop */ }
      }
      setTimeout(() => {
        setExecutionScene((cur) => {
          if (cur && cur.startedAt === startedAt) {
            const a = executionAudioRef.current[payload.type];
            if (a) {
              try {
                if (cthulhuAudioWatcher) a.removeEventListener('timeupdate', cthulhuAudioWatcher);
                a.pause();
                a.currentTime = 0;
              } catch { /* noop */ }
            }
            if (payload.type === 'cthulhu_abyss') stopCthulhuProcedural();
            if (payload.type === 'bees_v2') stopBeesV2Procedural();
            return null;
          }
          return cur;
        });
      }, duration + 100);
    };
    socket.on('executionScene', handleExecutionScene);

    const handlePhaseTick = ({ phase, timeLeft, phaseEndsAt, phaseDuration }) => {
      setGameState((current) => {
        if (!current) return current;
        if (phase && current.phase !== phase) return current;
        if (current.timeLeft === timeLeft && current.phaseEndsAt === phaseEndsAt) return current;
        return { ...current, timeLeft, phaseEndsAt, phaseDuration };
      });
    };
    socket.on('phaseTick', handlePhaseTick);

    const handleSessionToken = ({ token }) => {
      try {
        if (token) localStorage.setItem('nightfall_session_token', token);
      } catch { /* noop */ }
    };
    socket.on('sessionToken', handleSessionToken);

    const handleJoinRejected = ({ reason }) => {
      try {
        localStorage.removeItem('nightfall_session_token');
        localStorage.removeItem('ww_roomId');
      } catch { /* noop */ }
      setInRoom(false);
      setGameState(null);
      alert(reason || 'Failed to join the room.');
    };
    socket.on('joinRejected', handleJoinRejected);

    const handleKicked = () => {
      try {
        localStorage.removeItem('nightfall_session_token');
        localStorage.removeItem('ww_roomId');
      } catch { /* noop */ }
      setInRoom(false);
      setGameState(null);
      alert('You have been kicked from the room by the host.');
    };
    socket.on('kicked', handleKicked);

    // Initial connection in case it's already connected before the listener was attached
    if (socket.connected) {
      handleConnect();
    }

      return () => {
        socket.off('connect', handleConnect);
        socket.off('gameState', handleGameState);
        socket.off('actionResult', handleActionResult);
        socket.off('privateNotice', handlePrivateNotice);
        socket.off('roomsList', handleRoomsList);
        socket.off('wwChatMessage', handleWwChatMessage);
        socket.off('chatMessage', handleChatMessage);
        socket.off('villagerChatMessage', handleVillagerChatMessage);
        socket.off('ghostChatMessage', handleGhostChatMessage);
        socket.off('executionScene', handleExecutionScene);
        socket.off('phaseTick', handlePhaseTick);
        socket.off('sessionToken', handleSessionToken);
        socket.off('joinRejected', handleJoinRejected);
        socket.off('kicked', handleKicked);

        // Pause all running execution audio upon unmount
        Object.values(executionAudioRef.current).forEach((audio) => {
          try {
            audio.pause();
            audio.currentTime = 0;
          } catch { /* noop */ }
        });
        stopCthulhuProcedural();
        stopBeesV2Procedural();
      };
  }, [playerId]);

  const handleJoin = (e, targetRoomId) => {
    if (e) e.preventDefault();
    const idToJoin = targetRoomId || roomId;
    if (!idToJoin || !name) return;

    localStorage.setItem('ww_roomId', idToJoin.toUpperCase());
    localStorage.setItem('ww_name', name);

    socket.emit('joinRoom', { roomId: idToJoin, name, playerId });
    setInRoom(true);
  };

  const handleLeave = () => {
    localStorage.removeItem('ww_roomId');
    window.location.reload();
  };

  const startGame = () => socket.emit('startGame');
  const submitNightAction = (type, t1, t2) =>
    socket.emit('nightAction', { type, target1: t1, target2: t2 });
  // Note the send, but leave the button's visibility to the server. Clearing
  // requiresContinue locally used to hide the only way forward if the emit was
  // dropped — including by the client's own rate limiter.
  const continueNightResult = () => {
    setActionResult((current) => (current ? { ...current, continued: true } : current));
    socket.emit('nightAction', { type: 'continue' });
  };
  const submitVote = (targetId) => socket.emit('submitVote', targetId);
  const submitTrialVote = (choice) => socket.emit('submitTrialVote', choice);
  const skipDay = () => socket.emit('skipDay');
  const skipNight = () => socket.emit('skipNight');
  const skipDefense = () => socket.emit('skipDefense');
  const skipAccusation = () => socket.emit('skipAccusation');
  const skipTrial = () => socket.emit('skipTrial');
  const addBot = () => socket.emit('addBot');
  const removeBot = (botId = null) => socket.emit('removeBot', botId);
  const clearBotLog = () => socket.emit('clearBotLog');

  const updateSettings = (key, val) => {
    if (!gameState || !gameState.settings) return;
    socket.emit('updateSettings', { ...gameState.settings, [key]: val });
  };

  const updateDeck = (role, delta) => {
    if (!gameState || !gameState.settings) return;
    const currentDeck = [...gameState.settings.deck];
    if (delta > 0) {
      currentDeck.push(role);
    } else {
      const index = currentDeck.indexOf(role);
      if (index > -1) currentDeck.splice(index, 1);
    }
    socket.emit('updateSettings', { ...gameState.settings, deckPreset: currentDeck.length > 0 ? 'custom' : 'auto', deck: currentDeck });
  };

  const sendWwMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socket.emit('wwMessage', chatInput.trim());
    setChatInput('');
  };

  const sendVillagerMessage = (e) => {
    e.preventDefault();
    if (!villagerChatInput.trim()) return;
    socket.emit('villagerMessage', villagerChatInput.trim());
    setVillagerChatInput('');
  };

  const sendGhostMessage = (e) => {
    e.preventDefault();
    const value = (ghostChatInput || '').trim();
    if (!value) return;
    // The server only accepts a single character per emission; take the first.
    const letter = [...value][0] || '';
    if (!letter) return;
    socket.emit('ghostMessage', letter);
    setGhostChatInput('');
  };

  const generateRoomCode = () => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i += 1) {
      code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return code;
  };

  const handleCreateRoom = (e) => {
    if (e) e.preventDefault();
    if (!name) return;
    const newRoomId = generateRoomCode();
    setRoomId(newRoomId);
    localStorage.setItem('ww_roomId', newRoomId);
    localStorage.setItem('ww_name', name);
    socket.emit('joinRoom', { roomId: newRoomId, name, playerId });
    setInRoom(true);
  };

  const me = gameState?.players?.find((p) => p.id === playerId);
  const isDead = !!me?.isDead;
  const eventLog = gameState?.eventLog?.length ? gameState.eventLog : globalChat;
  const openRoleHelp = (role = gameState?.myOriginalRole) => setRoleHelpRole(role);

  const myDayStatus = gameState?.myDayStatus || null;
  const dayStatusBadges = [];
  if (myDayStatus?.silenced) {
    dayStatusBadges.push({ key: 'silenced', label: 'Silenced — you cannot speak in town chat today.', tone: 'warn' });
  }
  if (myDayStatus?.banished) {
    dayStatusBadges.push({ key: 'banished', label: 'Banished by the Old Hag — no chat, no votes today.', tone: 'danger' });
  }
  if (myDayStatus?.cupidPartner) {
    const partnerName = gameState?.players?.find((p) => p.id === myDayStatus.cupidPartner)?.name;
    dayStatusBadges.push({ key: 'cupid', label: `Cupid linked you to ${partnerName || 'another player'} — if they die, you die too.`, tone: 'info' });
  }
  if (myDayStatus?.inCult && gameState?.myOriginalRole !== 'Cult Leader') {
    dayStatusBadges.push({ key: 'cult', label: 'You are in the Cult — the Cult Leader wins if everyone joins.', tone: 'info' });
  }
  if (myDayStatus?.isVampireMarked) {
    dayStatusBadges.push({ key: 'vampire', label: 'You are marked by a Vampire — your second accusation will kill you.', tone: 'danger' });
  }
  if (myDayStatus?.crazedWord) {
    dayStatusBadges.push({ key: 'crazed', label: `🌀 You have been visited by Cthulhu. Today you can only say: "${myDayStatus.crazedWord}"`, tone: 'danger' });
  }
  const dayStatusBanner = dayStatusBadges.length > 0 ? (
    <div className="day-status-banner">
      {dayStatusBadges.map((b) => (
        <div key={b.key} className={`day-status-pill day-status-${b.tone}`}>
          {b.label}
        </div>
      ))}
    </div>
  ) : null;


  const ghostInfo = gameState?.ghostInfo || null;
  const ghostChatPanel = ghostInfo?.active ? (
    <div className="town-chat ghost-chat">
      <h4>
        <Skull size={13} /> Ghost Whispers
      </h4>
      <div className="town-chat-log">
        {ghostChat.length === 0 ? (
          <p>The dead have yet to speak…</p>
        ) : (
          ghostChat.map((msg, i) => (
            <div key={i} style={{ marginBottom: 3 }}>
              <strong>{msg.sender}:</strong>{' '}
              <span style={{ fontSize: '1.05rem', letterSpacing: '0.18em' }}>{msg.letter}</span>
            </div>
          ))
        )}
        <div ref={ghostChatEndRef} />
      </div>
      {ghostInfo.canSpeak ? (
        <>
          <form onSubmit={sendGhostMessage} className="town-chat-form">
            <input
              className="town-chat-input"
              value={ghostChatInput}
              onChange={(e) => setGhostChatInput(e.target.value.slice(0, 1))}
              placeholder="One letter…"
              maxLength={1}
            />
            <button
              type="submit"
              className="btn-secondary"
              style={{ padding: '6px 12px', minHeight: 36 }}
            >
              <Send size={14} />
            </button>
          </form>
          <p className="ghost-chat-note">One letter, once today. Spend it well.</p>
        </>
      ) : ghostInfo.letterSpent ? (
        <p className="town-chat-dead">You have spent your letter today. The dark takes the rest.</p>
      ) : ghostInfo.isGhost ? (
        <p className="town-chat-dead">Your voice only carries in daylight.</p>
      ) : (
        <p className="town-chat-dead">
          {ghostInfo.ghostCount > 0
            ? 'Something lingers and may leave a letter. Watch for it.'
            : 'Nothing has lingered. Not every death leaves a ghost behind.'}
        </p>
      )}
    </div>
  ) : null;

  const villagerChatEnabled = !!gameState?.settings?.enableVillagerChat;
  const villagerChatPanel = villagerChatEnabled ? (
    <div className="town-chat">
      <h4>
        <Sun size={13} /> Town Chat
      </h4>
      <div className="town-chat-log">
        {villagerChat.length === 0 ? (
          <p>No one has spoken yet…</p>
        ) : (
          villagerChat.map((msg, i) => (
            <div key={i} style={{ marginBottom: 3 }}>
              <strong>{msg.sender}:</strong>{' '}
              {msg.isCrazed ? (
                <span style={{ color: '#4ade80', fontWeight: 700, letterSpacing: '0.1em' }}>
                  🌀 {msg.text}
                </span>
              ) : (
                msg.text
              )}
            </div>
          ))
        )}
        <div ref={villagerChatEndRef} />
      </div>
      {!isDead ? (
        <form onSubmit={sendVillagerMessage} className="town-chat-form">
          <input
            className="town-chat-input"
            value={myDayStatus?.crazedWord ? myDayStatus.crazedWord : villagerChatInput}
            onChange={(e) => {
              if (!myDayStatus?.crazedWord) setVillagerChatInput(e.target.value);
            }}
            placeholder={myDayStatus?.crazedWord ? `You can only say: "${myDayStatus.crazedWord}"` : 'Speak to the town…'}
            maxLength={280}
            readOnly={!!myDayStatus?.crazedWord}
            style={myDayStatus?.crazedWord ? { color: '#4ade80', fontWeight: 700, cursor: 'not-allowed' } : {}}
          />
          <button
            type="submit"
            className="btn-secondary"
            style={{ padding: '6px 12px', minHeight: 36, ...(myDayStatus?.crazedWord ? { background: '#052e16', borderColor: '#4ade80' } : {}) }}
          >
            <Send size={14} />
          </button>
        </form>
      ) : (

        <p className="town-chat-dead">The dead may listen but not speak.</p>
      )}
    </div>
  ) : null;

  /* ============================================================
     LOBBY ENTRY
     ============================================================ */
  if (!inRoom || !gameState) {
    return (
      <div className="lobby-screen">
        <div className="lobby-music-control" aria-label="Lobby music controls">
          <button
            type="button"
            className="btn-secondary volume-btn lobby-music-btn"
            onClick={() => setLobbyMusicMuted((m) => !m)}
            aria-label={lobbyMusicMuted ? 'Unmute lobby music' : 'Mute lobby music'}
            title={lobbyMusicMuted ? 'Unmute music' : 'Mute music'}
          >
            {lobbyMusicMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
          <input
            type="range"
            className="volume-slider lobby-volume-slider"
            min="0"
            max="1"
            step="0.05"
            value={lobbyMusicMuted ? 0 : lobbyMusicVolume}
            onChange={(e) => {
              const next = parseFloat(e.target.value);
              setLobbyMusicVolume(next);
              if (next > 0 && lobbyMusicMuted) setLobbyMusicMuted(false);
            }}
            aria-label="Lobby music volume"
            style={{ '--vol': `${(lobbyMusicMuted ? 0 : lobbyMusicVolume) * 100}%` }}
          />
        </div>
        <SceneAtmosphere cinematic={phaseCinematic} />
        <NoticeStack notices={privateNotices} />
        <div className="lobby-card">
          <h1 className="title">Nightfall</h1>
          <p className="lobby-subtitle">
            A game of deception under moonlight
          </p>
          <div className="ornament-divider">
            <span>Take Your Seat</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1.4rem' }}>
            <button
              className="btn-secondary"
              onClick={() => setShowTutorial(true)}
              style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <BookOpen size={16} />
              Read the Rules
            </button>
          </div>
          <form onSubmit={(e) => handleJoin(e, roomId)}>
            <input
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={15}
              required
            />
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                placeholder="Room Code"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                maxLength={6}
                style={{ marginBottom: 0, flex: 1, minWidth: 0 }}
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={!name || !roomId}
                style={{ whiteSpace: 'nowrap', flexShrink: 0, padding: '0 18px' }}
              >
                Join Lobby
              </button>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCreateRoom}
              disabled={!name}
              style={{ width: '100%', whiteSpace: 'nowrap' }}
            >
              Create Room
            </button>
          </form>
          {roomsList.length > 0 && (
            <div
              style={{
                marginTop: '1.6rem',
                borderTop: '1px solid var(--border)',
                paddingTop: '1.1rem',
              }}
            >
              <h4
                style={{
                  color: 'var(--accent)',
                  marginBottom: '10px',
                  letterSpacing: '0.1em',
                  fontSize: '0.9rem',
                }}
              >
                <Stars size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Open Tables
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {roomsList.map((r) => (
                  <div key={r.id} className="room-item">
                    <span style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.1em' }}>
                      {r.id}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {r.players} seated
                    </span>
                    <button
                      className="btn-primary"
                      onClick={() => handleJoin(null, r.id)}
                      disabled={!name}
                      style={{ padding: '6px 14px', fontSize: '0.78rem', minHeight: 32 }}
                    >
                      Sit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {showTutorial && (
          <div className="modal-overlay" onClick={() => setShowTutorial(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>How to Play</h2>
              <div
                style={{
                  textAlign: 'left',
                  lineHeight: '1.7',
                  marginTop: '1rem',
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '1.08rem',
                }}
              >
                <p>
                  <strong>1.</strong> Everyone gets a secret role card. Three cards go to the
                  center of the table.
                </p>
                <p>
                  <strong>2.</strong> During the <strong>Night</strong>, special roles wake up
                  and perform actions.
                </p>
                <p>
                  <strong>3.</strong> During the <strong>Day</strong>, discuss and deduce who
                  the werewolves are.
                </p>
                <p>
                  <strong>4.</strong> <strong>Vote</strong> to eliminate a suspect. If neither
                  side has won, night falls again.
                </p>
                <p style={{ marginTop: '1rem', color: 'var(--amber-glow)' }}>
                  <strong>Village wins</strong> when all Werewolves are gone.{' '}
                  <strong>Werewolves win</strong> when they equal or outnumber the village.
                </p>
              </div>
              <button
                className="btn-primary"
                onClick={() => setShowTutorial(false)}
                style={{ width: '100%', marginTop: '1.5rem' }}
              >
                Close
              </button>
            </div>
          </div>
        )}
        <footer className="lobby-footer" aria-label="Credits">
          <div className="lobby-footer-line">
            <span className="lobby-footer-mark">
              <Moon size={12} color="var(--amber-glow)" />
              Nightfall
            </span>
            <span className="lobby-footer-sep">·</span>
            <span>
              Crafted by <strong>Alin</strong>
            </span>
            <span className="lobby-footer-sep">·</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved</span>
          </div>
          <div className="lobby-footer-sub">
            A social deduction game of moonlit deception.
          </div>
        </footer>
      </div>
    );
  }

  const ALL_ROLES = [
    'Doppelganger', 'Werewolf', 'Wolverine', 'Minion', 'Sorceress', 'Mason', 'Seer', 'Aura Seer',
    'Private Investigator', 'Robber', 'Troublemaker', 'Drunk',
    'Insomniac', 'Villager', 'Hunter', 'Tanner', 'Sentinel', 'Alpha Wolf', 'Mystic Wolf',
    'Apprentice Seer', 'Paranormal Investigator', 'Witch', 'Village Idiot', 'Revealer',
    'Bodyguard', 'Dream Wolf', 'Priest', 'Jailer', 'Prince', 'Squire', 'Mayor', 'Pacifist', 'Lycan',
    'Cupid', 'Cursed', 'Cult Leader', 'Diseased', 'Lone Wolf', 'Old Hag', 'Spellcaster', 'Tough Guy', 'Vampire', 'Wolf Cub',
    'Dawn Bringer', 'Disruptor', 'Mad Bomber', 'The Reflector', 'Yandere', 'Cthulhu',
  ];
  const presetPlayerCount = Math.max(3, gameState.players.length);
  const DECK_PRESETS = [
    {
      id: 'auto',
      name: `${presetPlayerCount}P Auto`,
      hint: 'Random balanced power roles. Best for quick rooms.',
      preview: summarizeDeckShape(presetPlayerCount),
      serverPreset: 'auto',
      deck: [],
    },
    {
      id: 'alin',
      name: '5P Alin',
      hint: 'Random wolf variant, detection, non-protector power, neutral, and village wild card.',
      preview: ALIN_PRESET_SUMMARY,
      serverPreset: 'alin',
      deck: [],
      disabled: gameState.players.length !== 5,
      disabledHint: 'Alin preset needs exactly 5 seated players.',
    },
    {
      id: 'gentle',
      name: `${presetPlayerCount}P Gentle`,
      hint: 'Seer/Priest/Bodyguard style powers for newer players.',
      preview: summarizeDeckShape(presetPlayerCount),
      deck: buildScaledDeck(presetPlayerCount, 'gentle'),
    },
    {
      id: 'balanced',
      name: `${presetPlayerCount}P Balanced`,
      hint: 'Classic hunt pressure with protection and a little bite.',
      preview: summarizeDeckShape(presetPlayerCount),
      deck: buildScaledDeck(presetPlayerCount, 'balanced'),
    },
    {
      id: 'chaos',
      name: `${presetPlayerCount}P Chaos`,
      hint: 'Adds role movement and suspicious claims.',
      preview: summarizeDeckShape(presetPlayerCount),
      deck: buildScaledDeck(presetPlayerCount, 'chaos'),
    },
  ];
  const activeDeck = gameState.settings.deck || [];
  const activeDeckPreset = gameState.settings.deckPreset || (activeDeck.length > 0 ? 'custom' : 'auto');
  const customDeckTarget = gameState.players.length + 3;
  const isUsingAlinPreset = activeDeckPreset === 'alin';
  const isUsingCustomDeck = activeDeckPreset === 'custom' || activeDeck.length > 0;
  const hasCustomWerewolf = activeDeck.some((role) => REAL_WOLF_ROLES.has(role));
  const isCustomDeckCountReady = !isUsingCustomDeck || activeDeck.length === customDeckTarget;
  const isCustomDeckReady = !isUsingCustomDeck || (isCustomDeckCountReady && hasCustomWerewolf);
  const isAlinPresetReady = !isUsingAlinPreset || gameState.players.length === 5;
  const isDeckReady = isCustomDeckReady && isAlinPresetReady;
  const canBeginGame = gameState.players.length >= 3 && isDeckReady;
  const deckWarning = isUsingAlinPreset && !isAlinPresetReady
    ? 'Alin preset is built for exactly 5 seated players.'
    : !isUsingCustomDeck
    ? ''
    : !isCustomDeckCountReady
      ? `Select exactly ${customDeckTarget} cards. The game will only use the cards you choose.`
      : !hasCustomWerewolf
        ? 'Add at least one real Werewolf card. Lycan is village-aligned and only appears wolf-like to investigations.'
        : '';
  const applyDeckPreset = (preset) => {
    if (!gameState || !gameState.settings || preset.disabled) return;
    socket.emit('updateSettings', {
      ...gameState.settings,
      deckPreset: preset.serverPreset || 'custom',
      deck: preset.serverPreset ? [] : preset.deck,
    });
  };
  const isPresetActive = (preset) => {
    if (preset.serverPreset) return activeDeckPreset === preset.serverPreset && activeDeck.length === 0;
    return activeDeckPreset === 'custom'
      && preset.deck.length === activeDeck.length
      && preset.deck.every((role, index) => activeDeck[index] === role);
  };

  const renderHostSettingsPanel = () => (
    <div className="game-panel host-settings-panel" style={{ textAlign: 'left' }}>
      <h3
        style={{
          color: 'var(--amber-glow)',
          marginBottom: '12px',
          letterSpacing: '0.1em',
        }}
      >
        <Settings size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
        Game Settings
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Enable Villager Chat (for non-voice players)</span>
          <input
            type="checkbox"
            checked={!!gameState.settings.enableVillagerChat}
            onChange={(e) => updateSettings('enableVillagerChat', e.target.checked)}
            style={{ width: 18, height: 18 }}
          />
        </label>
        <label
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Discussion (sec)</span>
          <input
            type="number"
            value={gameState.settings.discussionLength}
            onChange={(e) => updateSettings('discussionLength', parseInt(e.target.value))}
            style={{
              width: 70,
              padding: '6px 10px',
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              color: 'var(--text-main)',
            }}
          />
        </label>
        <label
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Night Action (sec)</span>
          <input
            type="number"
            value={gameState.settings.nightActionTime}
            onChange={(e) => updateSettings('nightActionTime', parseInt(e.target.value))}
            style={{
              width: 70,
              padding: '6px 10px',
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              color: 'var(--text-main)',
            }}
          />
        </label>
        <label className="settings-toggle">
          <span>
            <strong>First-night hunt</strong>
            <small>Allow Werewolves to kill on Night 1.</small>
          </span>
          <input
            type="checkbox"
            checked={!!gameState.settings.firstNightKill}
            onChange={(e) => updateSettings('firstNightKill', e.target.checked)}
          />
        </label>
        <div className="exec-scenes-picker">
          <div className="exec-scenes-head">
            <strong>Execution scenes</strong>
            <small>Cinematic deaths shown when a player is voted out at trial.</small>
          </div>
          <div className="exec-scenes-grid">
            {[
              { id: 'tentacles', label: 'Cthulhu', emoji: '🐙' },
              { id: 'cthulhu_abyss', label: 'Chutulu v2', emoji: '🦑' },
              { id: 'thunder', label: 'Thunder', emoji: '⚡' },
              { id: 'void', label: 'Void', emoji: '🌀' },
              { id: 'bees', label: 'Bees', emoji: '🐝' },
              { id: 'bees_v2', label: 'Bees v2 (Hive)', emoji: '🍯' },
            ].map((scene) => {
              const enabledList = Array.isArray(gameState.settings.executionScenes)
                ? gameState.settings.executionScenes
                : ['tentacles', 'cthulhu_abyss', 'thunder', 'void', 'bees', 'bees_v2'];
              const isOn = enabledList.includes(scene.id);
              const toggle = () => {
                let next = isOn
                  ? enabledList.filter((s) => s !== scene.id)
                  : [...enabledList, scene.id];
                if (next.length === 0) next = [scene.id];
                updateSettings('executionScenes', next);
              };
              return (
                <button
                  key={scene.id}
                  type="button"
                  className={`exec-scene-chip ${isOn ? 'on' : 'off'}`}
                  onClick={toggle}
                >
                  <span className="exec-scene-emoji">{scene.emoji}</span>
                  <span className="exec-scene-label">{scene.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="bot-controls">
          <div className="bot-controls-head">
            <strong>
              <Bot size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Test Bots
            </strong>
            <small>Auto-playing bots for solo testing. Host-only.</small>
          </div>
          <div className="bot-controls-row">
            <span className="bot-count-pill">
              {gameState.players.filter((p) => p.isBot).length} bot
              {gameState.players.filter((p) => p.isBot).length === 1 ? '' : 's'}
            </span>
            <button
              className="btn-secondary"
              onClick={addBot}
              disabled={gameState.players.length >= 12}
              style={{ flex: 1 }}
            >
              + Add Bot
            </button>
            <button
              className="btn-secondary"
              onClick={() => removeBot()}
              disabled={!gameState.players.some((p) => p.isBot)}
              style={{ flex: 1 }}
            >
              − Remove Bot
            </button>
          </div>
          {gameState.players.some((p) => p.isBot) && (
            <button
              className="btn-secondary bot-console-open"
              onClick={() => setShowBotConsole(true)}
              style={{ width: '100%', marginTop: 6 }}
            >
              <Terminal size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Open Bot Debug Console
            </button>
          )}
        </div>
        <h4
          style={{
            color: 'var(--accent)',
            marginTop: '8px',
            letterSpacing: '0.1em',
          }}
        >
          Deck
        </h4>
        <div className={`deck-status ${isDeckReady ? 'ready' : 'invalid'}`}>
          <strong>{isUsingAlinPreset ? 'Alin preset' : isUsingCustomDeck ? 'Custom deck' : 'Auto deck'}</strong>
          <span>
            {isUsingAlinPreset
              ? 'Rolls 5 player cards + 3 center cards (8 total)'
              : isUsingCustomDeck
              ? `${activeDeck.length} / ${customDeckTarget} cards selected`
              : `Auto will build ${gameState.players.length} player cards + 3 center cards (${customDeckTarget} total)`}
          </span>
          {deckWarning && <em>{deckWarning}</em>}
        </div>
        <div className="preset-grid">
          {DECK_PRESETS.map((preset) => (
            <button
              key={preset.id}
              className={`preset-card ${isPresetActive(preset) ? 'active' : ''}`}
              onClick={() => applyDeckPreset(preset)}
              disabled={preset.disabled}
              title={preset.disabled ? preset.disabledHint : undefined}
            >
              <strong>{preset.name}</strong>
              <span>{preset.hint}</span>
              <em>{preset.preview}</em>
            </button>
          ))}
        </div>
        <button
          className="btn-secondary"
          onClick={() => setShowCustomDeck((value) => !value)}
          style={{ width: '100%', marginTop: '4px' }}
        >
          {showCustomDeck ? 'Hide Custom Deck' : 'Customize Deck'}
        </button>
        {isUsingCustomDeck && (
          <button
            className="btn-secondary"
            onClick={() => socket.emit('updateSettings', { ...gameState.settings, deckPreset: 'auto', deck: [] })}
            style={{ width: '100%', marginTop: '-4px' }}
          >
            Use Auto Deck
          </button>
        )}
        {showCustomDeck && (
          <div
            style={{
              maxHeight: 240,
              overflowY: 'auto',
              padding: '4px 8px 4px 0',
            }}
          >
            {ALL_ROLES.map((role) => {
              const c = gameState.settings.deck.filter((r) => r === role).length;
              return (
                <div
                  key={role}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 0',
                    borderBottom: '1px dashed rgba(216,168,79,0.08)',
                  }}
                >
                  <span style={{ fontSize: '0.86rem', fontFamily: 'Cinzel, serif' }}>
                    {role}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      className="btn-secondary"
                      style={{ padding: '2px 8px', minHeight: 24, fontSize: '0.85rem' }}
                      onClick={() => updateDeck(role, -1)}
                      disabled={c === 0}
                    >
                      −
                    </button>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 22,
                        textAlign: 'center',
                        fontSize: '0.9rem',
                        color: c > 0 ? 'var(--amber-glow)' : 'var(--text-faded)',
                        fontFamily: 'Cinzel, serif',
                        fontWeight: 700,
                      }}
                    >
                      {c}
                    </span>
                    <button
                      className="btn-secondary"
                      style={{ padding: '2px 8px', minHeight: 24, fontSize: '0.85rem' }}
                      onClick={() => updateDeck(role, 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  /* ============================================================
     LOBBY (in-room)
     ============================================================ */
  if (gameState.phase === 'lobby') {
    return (
      <div className="table-scene">
        <SceneAtmosphere cinematic={phaseCinematic} />
        <QuickGuide open={showQuickGuide} onClose={dismissQuickGuide} />
        <NoticeStack notices={privateNotices} />
        <GameHeader
          roomId={gameState.roomId}
          dayCount={gameState.dayCount}
          onLeave={handleLeave}
          onOpenRuleBook={() => setShowRuleBook(true)}
          muted={muted}
          volume={volume}
          onToggleMute={() => setMuted((m) => !m)}
          onVolumeChange={(v) => { setVolume(v); if (v > 0 && muted) setMuted(false); }}
          botCount={me?.isHost ? (gameState?.players?.filter((p) => p.isBot).length || 0) : 0}
          onOpenBotConsole={me?.isHost ? () => setShowBotConsole(true) : undefined}
        />
        <RoundTable
          players={gameState.players}
          playerId={playerId}
          phase="lobby"
          isHost={me?.isHost}
          onKick={(targetId) => socket.emit('kickPlayer', targetId)}
        >
          <CenterDeck centerCards={gameState.centerCards} />
          <PhaseBanner
            icon={gameState.locked ? <Lock size={14} color="#ef4444" /> : <Users size={14} />}
            kicker={gameState.locked ? "Lobby (Locked)" : "Lobby"}
            title={`${gameState.players.length} / 10 Seated`}
          />
          {me?.isHost ? (
            <>
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  marginTop: '14px',
                  justifyContent: 'center',
                  pointerEvents: 'auto',
                }}
              >
                <button
                  className="btn-secondary"
                  onClick={() => setShowQuickGuide(true)}
                  style={{ padding: '8px 12px', fontSize: '0.78rem', minHeight: 40 }}
                  title="How to play"
                >
                  <BadgeQuestionMark size={14} />
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setShowSettings(!showSettings)}
                  style={{ padding: '8px 12px', fontSize: '0.78rem', minHeight: 40 }}
                  title="Configure Settings"
                >
                  <Settings size={14} />
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => socket.emit('toggleLock')}
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.78rem',
                    minHeight: 36,
                    color: gameState.locked ? '#ef4444' : 'inherit',
                  }}
                  title={gameState.locked ? 'Unlock Lobby' : 'Lock Lobby'}
                >
                  {gameState.locked ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
                <button
                  className={`btn-primary ${canBeginGame ? 'pulse' : ''}`}
                  onClick={startGame}
                  disabled={!canBeginGame}
                  title={deckWarning || undefined}
                  style={{
                    padding: '8px 18px',
                    fontSize: '0.82rem',
                    minHeight: 36,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Play size={14} />
                  Begin
                </button>
              </div>
              {deckWarning && (
                <p className="deck-start-warning">
                  {deckWarning}
                </p>
              )}
            </>
          ) : (
            <>
            <div style={{ marginTop: '12px', pointerEvents: 'auto' }}>
              <button
                className="btn-secondary"
                onClick={() => setShowQuickGuide(true)}
                style={{ padding: '8px 14px', fontSize: '0.78rem', minHeight: 40 }}
              >
                <BadgeQuestionMark size={14} />
                {' '}How to play
              </button>
            </div>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                marginTop: '12px',
                fontFamily: 'Cormorant Garamond, serif',
                fontStyle: 'italic',
              }}
            >
              Awaiting the host…
            </p>
            </>
          )}
        </RoundTable>
        {me?.isHost && showSettings && renderHostSettingsPanel()}
      </div>
    );
  }

  /* ============================================================
     DEALING — show your role with a flourish
     ============================================================ */
  if (gameState.phase === 'dealing') {
    return (
      <div className="table-scene">
        <SceneAtmosphere cinematic={phaseCinematic} />
        <NoticeStack notices={privateNotices} />
        <GameHeader
          roomId={gameState.roomId}
          dayCount={gameState.dayCount}
          onLeave={handleLeave}
          onOpenRuleBook={() => setShowRuleBook(true)}
          muted={muted}
          volume={volume}
          onToggleMute={() => setMuted((m) => !m)}
          onVolumeChange={(v) => { setVolume(v); if (v > 0 && muted) setMuted(false); }}
          botCount={me?.isHost ? (gameState?.players?.filter((p) => p.isBot).length || 0) : 0}
          onOpenBotConsole={me?.isHost ? () => setShowBotConsole(true) : undefined}
        />
        <RoundTable players={gameState.players} playerId={playerId} phase="dealing">
          <CenterDeck centerCards={gameState.centerCards} />
          <PhaseBanner
            icon={<Sparkles size={14} />}
            kicker="The Cards Are Dealt"
            title="Take Your Role"
          />
        </RoundTable>
        <div className="game-panel" style={{ textAlign: 'center' }}>
          <div className="deal-stage">
            <h3>Your Role</h3>
            <DealingAnimation playerName={me?.name || name} />
            <div className="deal-reveal-card">
              <RoleCard
                role={gameState.myOriginalRole}
                subtitle={getSubtitle(gameState.myOriginalRole)}
                detail={getRoleDetail(gameState.myOriginalRole)}
              />
            </div>
            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.92rem',
                fontFamily: 'Cormorant Garamond, serif',
                fontStyle: 'italic',
              }}
            >
              Memorize your role. Night is falling…
            </p>
            <button
              className="btn-secondary role-help-trigger"
              onClick={() => openRoleHelp(gameState.myOriginalRole)}
            >
              <BookOpen size={14} />
              Role Guide
            </button>
          </div>
        </div>
        <RoleHelpModal role={roleHelpRole} onClose={() => setRoleHelpRole(null)} />
        <RuleBookModal
          open={showRuleBook}
          onClose={() => setShowRuleBook(false)}
          currentRole={gameState?.myCurrentRole || gameState?.myOriginalRole}
        />
        <HunterRevengeModal
          open={hunterRevengePrompt}
          players={gameState?.players || []}
          playerId={playerId}
          onConfirm={(targetId) => {
            socket.emit('hunterRevenge', targetId);
            setHunterRevengePrompt(false);
          }}
          onPass={() => {
            socket.emit('hunterRevenge', null);
            setHunterRevengePrompt(false);
          }}
        />
        {me?.isHost && (
          <BotDebugConsole
            open={showBotConsole}
            onClose={() => setShowBotConsole(false)}
            botDebug={gameState?.botDebug}
            onClear={clearBotLog}
          />
        )}
      </div>
    );
  }

  /* ============================================================
     NIGHT
     ============================================================ */
  if (gameState.phase === 'night') {
    const activeRole = isDead ? null : (gameState.myActiveRole || gameState.myOriginalRole);
    const isMyTurn = !!gameState.currentNightAction;
    const otherPlayers = gameState.players.filter((p) => p.id !== playerId && !p.isDead);
    const nightPlayerName = (id, fallback = 'That player') =>
      gameState.players.find((p) => p.id === id)?.name || fallback;

    const renderActionUI = () => {
      if (isDead) {
        return (
          <div className="action-prompt dead-watch-prompt">
            <h3>
              <Skull size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Watching the Night
            </h3>
            <p>You are dead. You can watch the game unfold, but you cannot act.</p>
          </div>
        );
      }

      if (gameState.isJailerChatParticipant) {
        return (
          <div className="action-prompt jailer-interrogation-prompt">
            <div className="jailer-interrogation-head">
              <h3>
                <Lock size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Jailer Interrogation
              </h3>
              <div className="jailer-interrogation-timer">
                <span>Interrogating...</span>
                <strong className="timer-countdown">{jailerChatSecondsLeft}s</strong>
              </div>
            </div>
            
            <div className="jailer-chat-log">
              {gameState.jailerChatMessages?.map((msg, i) => (
                <div key={i} className={`jailer-chat-msg ${msg.sender === 'Jailer' ? 'msg-jailer' : 'msg-prisoner'}`}>
                  <strong>{msg.sender}:</strong> {msg.text}
                </div>
              ))}
              <div ref={jailerChatEndRef} />
            </div>
            
            <form onSubmit={sendJailerMessage} className="jailer-chat-form">
              <input
                className="chat-input jailer-chat-input"
                value={jailerChatInput}
                onChange={(e) => setJailerChatInput(e.target.value)}
                placeholder="Type your message..."
                maxLength={280}
              />
              <button type="submit" className="btn-danger jailer-send-btn">
                <Send size={14} />
              </button>
            </form>
            
            <div className="jailer-chat-footer">
              <p className="jailer-chat-desc">
                {activeRole === 'Jailer' 
                  ? 'You are interrogating the prisoner. Your identity is hidden.' 
                  : 'You have been jailed! The Jailer is interrogating you.'}
              </p>
              <button 
                type="button" 
                className="btn-primary continue-btn"
                onClick={() => socket.emit('nightAction', { type: 'continue' })}
              >
                Continue
              </button>
            </div>
          </div>
        );
      }

      if (actionResult) {
        // Keep the detection/action result on screen for the rest of the night
        // even after the server moves on to the next role's turn.
      } else if (!isMyTurn) {
        return (
          <div className="action-prompt">
            <h3>
              <Moon size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              Sleep
            </h3>
            <p>Close your eyes. The night is not yet yours.</p>
          </div>
        );
      }

      if (actionResult && actionResult.type !== 'error') {
        const r = actionResult;
        // Server truth only — it knows whether the acknowledgement landed.
        const pendingContinue = !!gameState.nightPendingContinue;
        return (
          <div className="action-prompt action-result-prompt">
            <div className="action-result-head">
              <h3>{pendingContinue ? 'Review Your Result' : 'Action Complete'}</h3>
              <span className="action-result-pin">
                {pendingContinue ? 'Waiting for you' : 'Stays until dawn'}
              </span>
            </div>
            {r.type === 'wolfView' && (
              <p>
                {r.huntSkipped && 'First-night hunt is disabled. '}
                Werewolves:{' '}
                {r.wolves
                  .map((id) => gameState.players.find((p) => p.id === id)?.name)
                  .join(', ') || 'None (You are alone)'}
              </p>
            )}
            {r.type === 'masonView' && (
              <p>
                Other Masons:{' '}
                {r.masons
                  .map((id) => gameState.players.find((p) => p.id === id)?.name)
                  .join(', ') || 'None'}
              </p>
            )}
            {r.type === 'playerView' && (
              <p>
                {nightPlayerName(r.target)} is: <strong>{r.role}</strong>
              </p>
            )}
            {r.type === 'seerFactionResult' && (
              <p>
                {nightPlayerName(r.target)} reads as: <strong>{r.faction}</strong>
              </p>
            )}
            {r.type === 'auraResult' && (
              <p>
                {nightPlayerName(r.target)} has a{' '}
                <strong style={{ color: r.alignment === 'Good' ? '#10b981' : r.alignment === 'Evil' ? '#ef4444' : '#6b7280' }}>
                  {r.alignment} aura
                </strong>.
              </p>
            )}
            {r.type === 'privateInvestigatorResult' && (
              <p>
                {nightPlayerName(r.target)} or one of their living neighbors{' '}
                <strong>{r.hasWerewolf ? 'appears to include a Werewolf' : 'does not appear to include a Werewolf'}</strong>.
              </p>
            )}
            {r.type === 'sorceressResult' && (
              <>
                <p>
                  {nightPlayerName(r.target)} is <strong>{r.isSeer ? 'the Seer' : 'not the Seer'}</strong>.
                </p>
                {Array.isArray(r.wolves) && r.wolves.length > 0 && (
                  <p>
                    Wolves you can see: <strong>{r.wolves.map(nightPlayerName).join(', ')}</strong>.
                  </p>
                )}
                {Array.isArray(r.wolves) && r.wolves.length === 0 && (
                  <p>You see no other wolves yet.</p>
                )}
              </>
            )}
            {r.type === 'centerView' && (
              <p>
                Center:{' '}
                {r.cards
                  ? r.cards.map((card, i) => {
                    const slot = Array.isArray(r.slots) && r.slots[i] != null ? r.slots[i] + 1 : i + 1;
                    return `Center ${slot}: ${card}`;
                  }).join(', ')
                  : `Center ${r.slot != null ? r.slot + 1 : '?'}: ${r.card}`}
              </p>
            )}
            {r.type === 'robberResult' && (
              <p>
                You are now a <strong>{r.newRole}</strong>!
              </p>
            )}
            {r.type === 'swapResult' && <p>Cards swapped successfully!</p>}
            {r.type === 'protectResult' && (
              <p>
                {r.livesLeft != null
                  ? `${nightPlayerName(r.target)} guarded. Bodyguard lives remaining: ${r.livesLeft}.`
                  : r.jailed
                  ? `${nightPlayerName(r.target)} jailed! They cannot act, hunt, or be killed tonight.`
                  : `${nightPlayerName(r.target)} protected!`}
              </p>
            )}
            {r.type === 'drunkResult' && <p>You swapped your card with a center card (blind).</p>}
            {r.type === 'insomniacResult' && (
              <p>
                Your card is now: <strong>{r.role}</strong>
              </p>
            )}
            {r.type === 'alphaResult' && <p>Center Werewolf card placed on target.</p>}
            {r.type === 'doppelgangerResult' && (
              <p>
                {r.pending ? (
                  <>You are bound to that player. If they die, you become their role.</>
                ) : (
                  <>
                    You copied: <strong>{r.role}</strong>
                  </>
                )}
              </p>
            )}
            {r.type === 'bodyguardBlocked' && <p>A Bodyguard intercepted that effect.</p>}
            {r.type === 'villageIdiotResult' && <p>Cards rotated {r.direction}!</p>}
            {r.type === 'revealerResult' &&
              (r.blocked ? (
                <p>Card was Werewolf/Tanner; flipped back.</p>
              ) : (
                <p>
                  Revealed {nightPlayerName(r.target)}: <strong>{r.role}</strong>
                </p>
              ))}
            {r.type === 'curatorResult' && <p>Artifact placed.</p>}
            {r.type === 'silencedResult' && (
              <p>
                {nightPlayerName(r.target)} cannot speak in the day chat tomorrow.
              </p>
            )}
            {r.type === 'banishResult' && (
              <p>
                {nightPlayerName(r.target)} is banished from tomorrow — no chat, no votes.
              </p>
            )}
            {r.type === 'cupidResult' && (
              <p>
                You linked <strong>{nightPlayerName(r.target1)}</strong> and{' '}
                <strong>{nightPlayerName(r.target2)}</strong>. Their fates are bound.
              </p>
            )}
            {r.type === 'vampireResult' && (
              <p>
                You marked <strong>{nightPlayerName(r.target)}</strong>. They die on their second accusation.
              </p>
            )}
            {r.type === 'cultResult' && (
              <p>
                <strong>{nightPlayerName(r.target)}</strong> joined your cult.
                Cult size: <strong>{r.cultSize}</strong>.
              </p>
            )}
            {r.type === 'shielded' && <p>That player was shielded by the Sentinel!</p>}
            {r.type === 'error' && <p>{r.message}</p>}
            {r.type === 'generic' && <p>Action acknowledged.</p>}
            {pendingContinue && (
              <div className="action-result-actions">
                <button className="btn-primary" onClick={continueNightResult}>
                  Continue
                </button>
              </div>
            )}
            {r.continued && (
              <p className="action-result-note">Result saved. The night is moving on.</p>
            )}
          </div>
        );
      }

      if (activeRole === 'Werewolf') {
        if (gameState.dayCount === 1 && !gameState.settings.firstNightKill) {
          return (
            <div className="action-prompt">
              <h3>Pack Wakes</h3>
              <p>First-night hunting is disabled for this room. See your pack, then acknowledge.</p>
              <button className="btn-primary" onClick={() => submitNightAction('view')}>
                Acknowledge
              </button>
            </div>
          );
        }

        return (
          <div className="action-prompt">
            <h3>Hunt</h3>
            <p>Choose a living player to eliminate. Protected targets survive.</p>
            <div className="players-list">
              {otherPlayers
                .filter((p) => p.isDead === false)
                .map((p) => {
                  const isTarget = selectedTarget1 === p.id;
                  const totalVotes = Object.values(gameState.wwKillVotes).filter(
                    (id) => id === p.id
                  ).length;
                  return (
                    <div
                      key={p.id}
                      className={`player-card selectable ${isTarget ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedTarget1(p.id);
                        submitNightAction('kill', p.id);
                      }}
                    >
                      {p.name}{' '}
                      {totalVotes > 0 ? (
                        <span style={{ color: 'var(--danger)' }}>({totalVotes})</span>
                      ) : (
                        ''
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        );
      }

      if (activeRole === 'Seer' || activeRole === 'Apprentice Seer') {
        return (
          <div className="action-prompt">
            <h3>{activeRole}, Wake Up</h3>
            <p>Choose a player. You will learn whether they are a Villager or a Werewolf.</p>
            <div className="players-list">
              {otherPlayers.map((p) => (
                <div
                  key={p.id}
                  className={`player-card selectable ${
                    selectedTarget1 === p.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedTarget1(p.id)}
                >
                  {p.name}
                </div>
              ))}
            </div>
            <button
              className="btn-primary"
              disabled={!selectedTarget1}
              onClick={() => submitNightAction('player', selectedTarget1)}
            >
              Confirm
            </button>
          </div>
        );
      }

      if (['Priest', 'Jailer', 'Sentinel', 'Bodyguard'].includes(activeRole)) {
        const isBodyguard = activeRole === 'Bodyguard';
        const isPriest = activeRole === 'Priest';
        // Bodyguard cannot guard themselves; everyone else can include themselves.
        const eligible = gameState.players.filter(
          (p) => !p.isDead && (!isBodyguard || p.id !== playerId)
        );
        const promptCopy = {
          Bodyguard: 'Choose a player. They cannot be eliminated tonight.',
          Priest: 'Choose a player to protect from elimination tonight. You may skip and save this for a later night.',
          Sentinel: "Shield another player's card from being viewed or moved.",
          Jailer: 'Jail a player to keep them safe from night kills.',
        };
        return (
          <div className="action-prompt">
            <h3>{activeRole}, Wake Up</h3>
            <p>{promptCopy[activeRole] || 'Choose a player to protect.'}</p>
            <div className="players-list">
              {eligible.map((p) => (
                <div
                  key={p.id}
                  className={`player-card selectable ${
                    selectedTarget1 === p.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedTarget1(p.id)}
                >
                  {p.name} {p.id === playerId ? '(You)' : ''}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '0.6rem', flexWrap: 'wrap' }}>
              <button
                className="btn-primary"
                onClick={() => submitNightAction('protect', selectedTarget1)}
                disabled={!selectedTarget1}
              >
                Confirm
              </button>
              {isPriest && (
                <button
                  className="btn-secondary"
                  onClick={() => submitNightAction('skip')}
                >
                  Skip Tonight
                </button>
              )}
            </div>
          </div>
        );
      }
      if (activeRole === 'Robber' && gameState.dayCount === 1) {
        return (
          <div className="action-prompt">
            <h3>Robber, Wake Up</h3>
            <p>Swap your card with another player's.</p>
            <div className="players-list">
              {otherPlayers.map((p) => (
                <div
                  key={p.id}
                  className={`player-card selectable ${
                    selectedTarget1 === p.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedTarget1(p.id)}
                >
                  {p.name}
                </div>
              ))}
            </div>
            <button
              className="btn-primary"
              onClick={() => submitNightAction('swap', selectedTarget1)}
            >
              Confirm
            </button>
          </div>
        );
      }
      if (activeRole === 'Troublemaker') {
        const used = gameState.troublemakerUsed === true;
        const targets = troublemakerTargets || [];
        const toggle = (id) => {
          setTroublemakerTargets((prev) => {
            const arr = prev || [];
            return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
          });
        };
        return (
          <div className="action-prompt">
            <h3>Troublemaker, Wake Up</h3>
            <p>
              {used
                ? 'You have already used your one-shot call. Skip to end your turn.'
                : 'Once per game, mark any number of players to be eliminated at dawn. Skip to save this power for another night.'}
            </p>
            {!used && (
              <div className="players-list">
                {otherPlayers.map((p) => (
                  <div
                    key={p.id}
                    className={`player-card selectable ${
                      targets.includes(p.id) ? 'selected' : ''
                    }`}
                    onClick={() => toggle(p.id)}
                  >
                    {p.name}
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '0.6rem', flexWrap: 'wrap' }}>
              {!used && (
                <button
                  className="btn-primary"
                  disabled={targets.length === 0}
                  onClick={() => {
                    submitNightAction('call', targets);
                    setTroublemakerTargets([]);
                  }}
                >
                  Call for Elimination ({targets.length})
                </button>
              )}
              <button
                className="btn-secondary"
                onClick={() => submitNightAction('skip')}
              >
                Skip Tonight
              </button>
            </div>
          </div>
        );
      }
      if (['Minion', 'Squire'].includes(activeRole)) {
        return (
          <div className="action-prompt">
            <h3>{activeRole}, Wake Up</h3>
            <p>Open your eyes to see the Werewolves.</p>
            <button className="btn-primary" onClick={() => submitNightAction('view')}>
              Acknowledge
            </button>
          </div>
        );
      }
      if (activeRole === 'Mason') {
        return (
          <div className="action-prompt">
            <h3>Mason, Wake Up</h3>
            <p>See the other Masons.</p>
            <button className="btn-primary" onClick={() => submitNightAction('view')}>
              Acknowledge
            </button>
          </div>
        );
      }
      if (activeRole === 'Drunk') {
        return (
          <div className="action-prompt">
            <h3>You sober up...</h3>
            <p>
              Two nights of beer have passed. Your true role is{' '}
              <strong>{gameState.myCurrentRole || gameState.myOriginalRole}</strong>.
              From this night on, you wake and act as that role.
            </p>
            <button className="btn-primary" onClick={() => submitNightAction('view')}>
              I understand
            </button>
          </div>
        );
      }
      if (activeRole === 'Village Idiot') {
        return (
          <div className="action-prompt">
            <h3>Village Idiot, Wake Up</h3>
            <p>One-time ability: choose Left or Right to rotate every other player's role one seat. This is your only night — you won't wake again.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '0.8rem' }}>
              <button
                className="btn-primary"
                onClick={() => submitNightAction('left')}
              >
                Rotate Left
              </button>
              <button
                className="btn-primary"
                onClick={() => submitNightAction('right')}
              >
                Rotate Right
              </button>
            </div>
          </div>
        );
      }
      if (activeRole === 'Insomniac' && gameState.dayCount === 1) {
        return (
          <div className="action-prompt">
            <h3>Insomniac, Wake Up</h3>
            <p>Check your card.</p>
            <button className="btn-primary" onClick={() => submitNightAction('view')}>
              Check
            </button>
          </div>
        );
      }
      if (
        ['Doppelganger', 'Mystic Wolf', 'Paranormal Investigator', 'Revealer', 'Alpha Wolf', 'Aura Seer', 'Private Investigator', 'Sorceress'].includes(
          activeRole
        )
      ) {
        const promptCopy = {
          Doppelganger: 'Choose the player you are bound to. If they die, you become their role.',
          'Aura Seer': 'Choose a player each night to reveal their aura (Good, Evil or Unknown).',
          'Private Investigator': 'Choose a player. You will learn whether they or either living neighbor appears wolf-aligned.',
          Sorceress: 'Choose a player to learn whether they are the Seer.',
          'Alpha Wolf': 'Choose a player to receive the extra Werewolf card.',
          'Mystic Wolf': "Choose a player whose card you want to inspect.",
          'Paranormal Investigator': 'Choose a player to inspect. Seeing a Werewolf or Tanner can change your team.',
          Revealer: 'Choose a player to reveal, unless their card must remain hidden.',
        };
        return (
          <div className="action-prompt">
            <h3>{activeRole}, Wake Up</h3>
            <p>{promptCopy[activeRole] || 'Choose a player.'}</p>
            <div className="players-list">
              {otherPlayers.map((p) => (
                <div
                  key={p.id}
                  className={`player-card selectable ${
                    selectedTarget1 === p.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedTarget1(p.id)}
                >
                  {p.name}
                </div>
              ))}
            </div>
            <button
              className="btn-primary"
              onClick={() => submitNightAction('player', selectedTarget1)}
            >
              Confirm
            </button>
          </div>
        );
      }
      if (activeRole === 'Witch') {
        const eligible = gameState.players.filter((p) => !p.isDead);
        const hasSave = gameState.witchSavePotion !== false;
        const hasKill = gameState.witchKillPotion !== false;
        return (
          <div className="action-prompt">
            <h3>Witch, Wake Up</h3>
            <p>
              Save potion: {hasSave ? 'available' : 'used'} · Kill potion: {hasKill ? 'available' : 'used'}.
              Choose a player and a potion, or skip to save them for another night.
            </p>
            <div className="players-list">
              {eligible.map((p) => (
                <div
                  key={p.id}
                  className={`player-card selectable ${
                    selectedTarget1 === p.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedTarget1(p.id)}
                >
                  {p.name} {p.id === playerId ? '(You)' : ''}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '0.8rem', flexWrap: 'wrap' }}>
              <button
                className="btn-primary"
                disabled={!hasSave || !selectedTarget1}
                onClick={() => submitNightAction('save', selectedTarget1)}
              >
                Save Potion
              </button>
              <button
                className="btn-primary"
                disabled={!hasKill || !selectedTarget1}
                onClick={() => submitNightAction('kill', selectedTarget1)}
              >
                Kill Potion
              </button>
              <button
                className="btn-secondary"
                onClick={() => submitNightAction('skip')}
              >
                Skip Tonight
              </button>
            </div>
          </div>
        );
      }
      if (activeRole === 'Cupid' && gameState.dayCount === 1) {
        const eligible = gameState.players.filter((p) => !p.isDead);
        return (
          <div className="action-prompt">
            <h3>Cupid, Wake Up</h3>
            <p>Choose two players to bind together. If one dies, the other dies too.</p>
            <div className="players-list">
              {eligible.map((p) => (
                <div
                  key={p.id}
                  className={`player-card selectable ${
                    selectedTarget1 === p.id || selectedTarget2 === p.id ? 'selected' : ''
                  }`}
                  onClick={() => {
                    if (selectedTarget1 === p.id) setSelectedTarget1(null);
                    else if (selectedTarget2 === p.id) setSelectedTarget2(null);
                    else if (!selectedTarget1) setSelectedTarget1(p.id);
                    else if (!selectedTarget2) setSelectedTarget2(p.id);
                  }}
                >
                  {p.name} {p.id === playerId ? '(You)' : ''}
                </div>
              ))}
            </div>
            <button
              className="btn-primary"
              onClick={() => submitNightAction('link', selectedTarget1, selectedTarget2)}
              disabled={!selectedTarget1 || !selectedTarget2}
            >
              Confirm Link
            </button>
          </div>
        );
      }
      if (['Spellcaster', 'Old Hag', 'Vampire', 'Cult Leader', 'Curator'].includes(activeRole)) {
        const promptCopy = {
          Spellcaster: 'Choose a player. They cannot speak in the day chat tomorrow.',
          'Old Hag': 'Choose a player to banish from the next day — no chat, no votes.',
          Vampire: 'Mark a player. They die when they receive their second accusation vote.',
          'Cult Leader': 'Choose a player to join your cult. Win when every living player is in the cult.',
          Curator: 'Choose a player to place an artifact token on.',
        };
        const buttonCopy = {
          Spellcaster: 'Silence',
          'Old Hag': 'Banish',
          Vampire: 'Mark',
          'Cult Leader': 'Recruit',
          Curator: 'Place Artifact',
        };
        const actionType = activeRole === 'Cult Leader' ? 'recruit' : 'player';
        const eligible = ['Cult Leader', 'Curator'].includes(activeRole)
          ? gameState.players.filter((p) => !p.isDead)
          : otherPlayers;
        return (
          <div className="action-prompt">
            <h3>{activeRole}, Wake Up</h3>
            <p>{promptCopy[activeRole]}</p>
            <div className="players-list">
              {eligible.map((p) => (
                <div
                  key={p.id}
                  className={`player-card selectable ${
                    selectedTarget1 === p.id ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedTarget1(p.id)}
                >
                  {p.name} {p.id === playerId ? '(You)' : ''}
                </div>
              ))}
            </div>
            <button
              className="btn-primary"
              onClick={() => submitNightAction(actionType, selectedTarget1)}
              disabled={!selectedTarget1}
            >
              {buttonCopy[activeRole]}
            </button>
          </div>
        );
      }
      if (activeRole === 'Disruptor') {
        return (
          <div className="action-prompt">
            <h3>Disruptor, Wake Up</h3>
            <p>Choose a player. Their night action will be scrambled — they wake, pick a target, but their power has no effect tonight.</p>
            <div className="players-list">
              {otherPlayers.map((p) => (
                <div
                  key={p.id}
                  className={`player-card selectable ${selectedTarget1 === p.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTarget1(p.id)}
                >
                  {p.name}
                </div>
              ))}
            </div>
            <button
              className="btn-primary"
              disabled={!selectedTarget1}
              onClick={() => submitNightAction('player', selectedTarget1)}
            >
              Distort
            </button>
          </div>
        );
      }
      if (activeRole === 'The Reflector') {
        return (
          <div className="action-prompt">
            <h3>The Reflector, Wake Up</h3>
            <p>Choose a player. Anyone else who targets that same player tonight will instead affect themselves.</p>
            <div className="players-list">
              {otherPlayers.map((p) => (
                <div
                  key={p.id}
                  className={`player-card selectable ${selectedTarget1 === p.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTarget1(p.id)}
                >
                  {p.name}
                </div>
              ))}
            </div>
            <button
              className="btn-primary"
              disabled={!selectedTarget1}
              onClick={() => submitNightAction('player', selectedTarget1)}
            >
              Set Mirror
            </button>
          </div>
        );
      }
      if (activeRole === 'Yandere') {
        const yandereUsesLeft = gameState.yandereUsesLeft != null ? gameState.yandereUsesLeft : 3;
        if (gameState.dayCount === 1) {
          return (
            <div className="action-prompt">
              <h3>Yandere, Wake Up</h3>
              <p>Choose your obsession — the player you will protect with your life. You may shield them up to <strong>3 times</strong> on future nights.</p>
              <div className="players-list">
                {otherPlayers.map((p) => (
                  <div
                    key={p.id}
                    className={`player-card selectable ${selectedTarget1 === p.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTarget1(p.id)}
                  >
                    {p.name}
                  </div>
                ))}
              </div>
              <button
                className="btn-primary"
                disabled={!selectedTarget1}
                onClick={() => submitNightAction('player', selectedTarget1)}
              >
                Obsess
              </button>
            </div>
          );
        }
        return (
          <div className="action-prompt">
            <h3>Yandere, Wake Up</h3>
            <p>
              Activations remaining: <strong style={{ color: '#f472b6' }}>{yandereUsesLeft}</strong>
              <br />
              Activate your obsession shield to protect them — this eliminates the nearest attacker targeting them.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '0.8rem' }}>
              <button
                className="btn-primary"
                disabled={yandereUsesLeft <= 0}
                onClick={() => submitNightAction('player', 'activate')}
                style={{ background: 'linear-gradient(135deg, #be185d, #9d174d)', borderColor: '#f472b6' }}
              >
                ♥ Activate Shield
              </button>
              <button
                className="btn-secondary"
                onClick={() => submitNightAction('player', 'pass')}
              >
                Pass This Night
              </button>
            </div>
          </div>
        );
      }
      if (activeRole === 'Cthulhu') {
        return (
          <div className="action-prompt">
            <h3>Cthulhu, Wake Up</h3>
            <p>Choose a player and whisper a word. Tomorrow, they can <em>only</em> repeat that word in the town chat.</p>
            <div className="players-list">
              {otherPlayers.map((p) => (
                <div
                  key={p.id}
                  className={`player-card selectable ${selectedTarget1 === p.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTarget1(p.id)}
                >
                  {p.name}
                </div>
              ))}
            </div>
            <input
              className="town-chat-input"
              value={selectedTarget2 || ''}
              onChange={(e) => setSelectedTarget2(e.target.value.slice(0, 30))}
              placeholder="Type a word to curse them with…"
              maxLength={30}
              style={{ marginTop: '0.6rem', marginBottom: '0.4rem', width: '100%', textAlign: 'center', letterSpacing: '0.06em' }}
            />
            <button
              className="btn-primary"
              disabled={!selectedTarget1 || !(selectedTarget2 || '').trim()}
              onClick={() => submitNightAction('player', selectedTarget1, (selectedTarget2 || '').trim())}
              style={{ background: 'linear-gradient(135deg, #052e16, #14532d)', borderColor: '#4ade80' }}
            >
              Curse
            </button>
          </div>
        );
      }
      return (
        <div className="action-prompt">
          <h3>{activeRole}, Wake Up</h3>
          <p>Perform your action.</p>
          <button className="btn-primary" onClick={() => submitNightAction('view')}>
            Acknowledge
          </button>
        </div>
      );
    };

    const nightStatus = isDead
      ? 'Watching'
      : gameState.nightPendingContinue
        ? 'Review result'
      : isMyTurn
        ? 'Your turn'
        : gameState.currentNightAction
          ? `${gameState.currentNightAction} acting`
          : 'Night resolving';

    return (
      <div className="table-scene">
        <SceneAtmosphere cinematic={phaseCinematic} />
        <NoticeStack notices={privateNotices} />
        <GameHeader
          roomId={gameState.roomId}
          dayCount={gameState.dayCount}
          onLeave={handleLeave}
          onOpenRuleBook={() => setShowRuleBook(true)}
          muted={muted}
          volume={volume}
          onToggleMute={() => setMuted((m) => !m)}
          onVolumeChange={(v) => { setVolume(v); if (v > 0 && muted) setMuted(false); }}
          botCount={me?.isHost ? (gameState?.players?.filter((p) => p.isBot).length || 0) : 0}
          onOpenBotConsole={me?.isHost ? () => setShowBotConsole(true) : undefined}
        />
        <RoundTable
          players={gameState.players}
          playerId={playerId}
          phase="night"
          isMyTurn={isMyTurn}
          tableOverlay={executionScene ? <ExecutionOverlay scene={executionScene} /> : null}
          jailedPlayerId={gameState.jailedPlayerId}
          isHost={me?.isHost}
          executionScene={executionScene}
        >
          <CenterDeck centerCards={gameState.centerCards} />
          <PhaseBanner
            icon={<Moon size={14} />}
            kicker={`Night ${gameState.dayCount}`}
            title="The Wolves Stir"
          />
          {gameState.currentNightAction && gameState.phaseEndsAt && (
            <PhaseTimer
              endsAt={gameState.phaseEndsAt}
              fallback={gameState.timeLeft}
              total={gameState.phaseDuration}
              label={gameState.nightPendingContinue ? 'Review' : 'Act'}
            />
          )}
        </RoundTable>
        <div className="game-panel night-panel">
          <PhaseCommandPanel
            icon={<Moon size={15} />}
            kicker={`Night ${gameState.dayCount}`}
            title="Resolve the Night"
            status={nightStatus}
            progress={gameState.nightProgress}
            progressLabel="Night actions"
            actions={(
              <>
                <button
                  className="btn-secondary role-help-trigger"
                  onClick={() => openRoleHelp(gameState.myOriginalRole)}
                >
                  <BookOpen size={14} />
                  Role Guide
                </button>
                {me?.isHost && (
                  <button className="btn-secondary" onClick={skipNight}>
                    <Sun size={14} />
                    Break for Dawn
                  </button>
                )}
              </>
            )}
          >
          <div className="night-role-strip">
            <div className="night-role-copy">
              <h3>Your Dealt Card</h3>
              <p>
                Visible all night. Your final role can still change if another role swaps cards.
              </p>
              {gameState.myCurrentRole &&
                gameState.myCurrentRole !== gameState.myOriginalRole && (
                  <div className="current-role-chip">
                    <Sparkles size={13} />
                    <span>You are currently a</span>
                    <strong style={{ color: ROLE_COLORS[gameState.myCurrentRole] || 'var(--amber-glow)' }}>
                      {gameState.myCurrentRole}
                    </strong>
                  </div>
                )}
              {gameState.myBodyguardLives != null &&
                gameState.myCurrentRole === 'Bodyguard' && (
                  <p style={{ fontSize: '0.86rem', color: '#bceee8', marginTop: 6 }}>
                    Bodyguard armor: {gameState.myBodyguardLives} life
                    {gameState.myBodyguardLives === 1 ? '' : 's'} remaining.
                  </p>
                )}
            </div>
            <RoleCard
              role={gameState.myCurrentRole || gameState.myOriginalRole}
              subtitle={getSubtitle(gameState.myCurrentRole || gameState.myOriginalRole)}
              detail={getRoleDetail(gameState.myCurrentRole || gameState.myOriginalRole)}
            />
          </div>
          {actionResult?.type === 'error' && (
            <div className="action-prompt action-error-prompt">
              <div className="action-result-head">
                <h3>Try Again</h3>
                <span className="action-error-pin">Auto-clears</span>
              </div>
              <p>{actionResult.message}</p>
            </div>
          )}
          {renderActionUI()}
          {activeRole === 'Werewolf' && (
            <div className="pack-chat">
              <h4>
                <Swords size={13} /> Pack Whispers
              </h4>
              <div className="pack-chat-log">
                {wwChat.length === 0 ? (
                  <p>The pack is silent…</p>
                ) : (
                  wwChat.map((msg, i) => (
                    <div key={i} style={{ marginBottom: 3 }}>
                      <strong>{msg.sender}:</strong> {msg.text}
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={sendWwMessage} style={{ display: 'flex', gap: '6px' }}>
                <input
                  className="chat-input"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Whisper to the pack…"
                />
                <button
                  type="submit"
                  className="btn-danger"
                  style={{ padding: '6px 12px', minHeight: 36 }}
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          )}
          <EventLogPanel events={eventLog} />
          </PhaseCommandPanel>
        </div>
        <RoleHelpModal role={roleHelpRole} onClose={() => setRoleHelpRole(null)} />
        <RuleBookModal
          open={showRuleBook}
          onClose={() => setShowRuleBook(false)}
          currentRole={gameState?.myCurrentRole || gameState?.myOriginalRole}
        />
        <HunterRevengeModal
          open={hunterRevengePrompt}
          players={gameState?.players || []}
          playerId={playerId}
          onConfirm={(targetId) => {
            socket.emit('hunterRevenge', targetId);
            setHunterRevengePrompt(false);
          }}
          onPass={() => {
            socket.emit('hunterRevenge', null);
            setHunterRevengePrompt(false);
          }}
        />
        {me?.isHost && (
          <BotDebugConsole
            open={showBotConsole}
            onClose={() => setShowBotConsole(false)}
            botDebug={gameState?.botDebug}
            onClear={clearBotLog}
          />
        )}
      </div>
    );
  }

  /* ============================================================
     DAY
     ============================================================ */
  if (gameState.phase === 'day') {
    return (
      <div className="table-scene">
        <SceneAtmosphere cinematic={phaseCinematic} />
        <NoticeStack notices={privateNotices} />
        <GameHeader
          roomId={gameState.roomId}
          dayCount={gameState.dayCount}
          onLeave={handleLeave}
          onOpenRuleBook={() => setShowRuleBook(true)}
          muted={muted}
          volume={volume}
          onToggleMute={() => setMuted((m) => !m)}
          onVolumeChange={(v) => { setVolume(v); if (v > 0 && muted) setMuted(false); }}
          botCount={me?.isHost ? (gameState?.players?.filter((p) => p.isBot).length || 0) : 0}
          onOpenBotConsole={me?.isHost ? () => setShowBotConsole(true) : undefined}
        />
        <RoundTable
          players={gameState.players}
          playerId={playerId}
          phase="day"
          isHost={me?.isHost}
          executionScene={executionScene}
          tableOverlay={executionScene ? <ExecutionOverlay scene={executionScene} /> : null}
        >
          <CenterDeck centerCards={gameState.centerCards} />
          <PhaseBanner
            icon={<Sun size={14} />}
            kicker={`Day ${gameState.dayCount}`}
            title="The Town Speaks"
          />
          <PhaseTimer
            endsAt={gameState.phaseEndsAt}
            fallback={gameState.timeLeft}
            total={gameState.phaseDuration}
            label="Debate"
          />
        </RoundTable>
        <div className="game-panel" style={{ textAlign: 'center' }}>
          <PhaseCommandPanel
            icon={<Sun size={15} />}
            kicker={`Day ${gameState.dayCount}`}
            title="Discuss and Decide"
            status={<ClockText endsAt={gameState.phaseEndsAt} fallback={gameState.timeLeft} />}
            actions={(
              <>
                <button
                  className="btn-secondary role-help-trigger"
                  onClick={() => openRoleHelp(gameState.myCurrentRole || gameState.myOriginalRole)}
                >
                  <BookOpen size={14} />
                  Role Guide
                </button>
                {gameState.dawnBringerAvailable && !isDead && (
                  <button
                    className="btn-primary"
                    onClick={() => socket.emit('dawnBringerDeclare')}
                    style={{
                      background: 'linear-gradient(135deg, #78350f, #92400e)',
                      borderColor: '#fef3c7',
                      color: '#fef3c7',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      animation: 'pulse-glow 2s infinite',
                    }}
                  >
                    ☀️ I AM THE DAWNBRINGER!
                  </button>
                )}
                {me?.isHost && (
                  <button className="btn-danger role-help-trigger" onClick={skipDay}>
                    <FastForward size={14} />
                    Skip
                  </button>
                )}
              </>
            )}
          >

          <p
            style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: '1.05rem',
              fontStyle: 'italic',
              color: 'var(--text-soft)',
            }}
          >
            Discuss. Accuse. Discover the wolves among you.
          </p>
          <div
            className="action-prompt"
            style={{
              borderLeftColor: '#fbbf24',
              background:
                'linear-gradient(180deg, rgba(60, 42, 12, 0.4), rgba(20, 14, 8, 0.6))',
              marginTop: '1rem',
            }}
          >
            <h4 style={{ fontSize: '0.92rem', color: '#fde68a' }}>
              Your dealt role: {gameState.myOriginalRole}
            </h4>
            {gameState.myCurrentRole &&
              gameState.myCurrentRole !== gameState.myOriginalRole && (
                <div className="current-role-chip">
                  <Sparkles size={13} />
                  <span>By dawn you woke as a</span>
                  <strong style={{ color: ROLE_COLORS[gameState.myCurrentRole] || 'var(--amber-glow)' }}>
                    {gameState.myCurrentRole}
                  </strong>
                </div>
              )}
            {gameState.myCurrentRole &&
              gameState.myCurrentRole === gameState.myOriginalRole && (
                <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                  Your card was not swapped during the night.
                </p>
              )}
            {gameState.myBodyguardLives != null &&
              gameState.myCurrentRole === 'Bodyguard' && (
                <p style={{ fontSize: '0.86rem', color: '#bceee8' }}>
                  Bodyguard armor: {gameState.myBodyguardLives} life
                  {gameState.myBodyguardLives === 1 ? '' : 's'} remaining.
                </p>
              )}
            <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
              Be wary — others may have been swapped too.
            </p>
          </div>
          {dayStatusBanner}
          {villagerChatPanel}
          {ghostChatPanel}
          <EventLogPanel events={eventLog} />
          </PhaseCommandPanel>
        </div>
        <RoleHelpModal role={roleHelpRole} onClose={() => setRoleHelpRole(null)} />
        <RuleBookModal
          open={showRuleBook}
          onClose={() => setShowRuleBook(false)}
          currentRole={gameState?.myCurrentRole || gameState?.myOriginalRole}
        />
        <HunterRevengeModal
          open={hunterRevengePrompt}
          players={gameState?.players || []}
          playerId={playerId}
          onConfirm={(targetId) => {
            socket.emit('hunterRevenge', targetId);
            setHunterRevengePrompt(false);
          }}
          onPass={() => {
            socket.emit('hunterRevenge', null);
            setHunterRevengePrompt(false);
          }}
        />
        {me?.isHost && (
          <BotDebugConsole
            open={showBotConsole}
            onClose={() => setShowBotConsole(false)}
            botDebug={gameState?.botDebug}
            onClear={clearBotLog}
          />
        )}
      </div>
    );
  }

  /* ============================================================
     ACCUSATION
     ============================================================ */
  if (gameState.phase === 'accusation') {
    const currentVoteRole = gameState.myCurrentRole || gameState.myOriginalRole;
    const isPacifistVote = currentVoteRole === 'Pacifist';
    const voteStatus = isDead
      ? 'Watching'
      : me?.hasVoted
        ? 'Accusation submitted'
        : isPacifistVote
          ? 'Must skip'
          : 'Choose or skip';
    return (
      <div className="table-scene">
        <SceneAtmosphere cinematic={phaseCinematic} />
        <NoticeStack notices={privateNotices} />
        <GameHeader
          roomId={gameState.roomId}
          dayCount={gameState.dayCount}
          onLeave={handleLeave}
          onOpenRuleBook={() => setShowRuleBook(true)}
          muted={muted}
          volume={volume}
          onToggleMute={() => setMuted((m) => !m)}
          onVolumeChange={(v) => { setVolume(v); if (v > 0 && muted) setMuted(false); }}
          botCount={me?.isHost ? (gameState?.players?.filter((p) => p.isBot).length || 0) : 0}
          onOpenBotConsole={me?.isHost ? () => setShowBotConsole(true) : undefined}
        />
        <RoundTable
          players={gameState.players}
          playerId={playerId}
          phase="accusation"
          isHost={me?.isHost}
          executionScene={executionScene}
          tableOverlay={executionScene ? <ExecutionOverlay scene={executionScene} /> : null}
        >
          <CenterDeck centerCards={gameState.centerCards} />
          <PhaseBanner
            icon={<Vote size={14} />}
            kicker="Accusation"
            title="Point a Finger"
          />
          <PhaseTimer
            endsAt={gameState.phaseEndsAt}
            fallback={gameState.timeLeft}
            total={gameState.phaseDuration}
            label="Accuse"
          />
        </RoundTable>
        <div className="game-panel" style={{ textAlign: 'center' }}>
          <PhaseCommandPanel
            icon={<Vote size={15} />}
            kicker="Accusation"
            title="Who do you accuse?"
            status={voteStatus}
            progress={gameState.voteProgress}
            progressLabel="Accusations submitted"
            actions={(
              <>
                <button
                  className="btn-secondary role-help-trigger"
                  onClick={() => openRoleHelp(gameState.myCurrentRole || gameState.myOriginalRole)}
                >
                  <BookOpen size={14} />
                  Role Guide
                </button>
                {me?.isHost && (
                  <button className="btn-danger role-help-trigger" onClick={skipAccusation}>
                    <FastForward size={14} />
                    Force Tally
                  </button>
                )}
              </>
            )}
          >
          {gameState.myOriginalRole && (
            <div className="role-status-block">
              <h4 style={{ fontSize: '0.92rem', color: '#fde68a' }}>
                Your dealt role: {gameState.myOriginalRole}
              </h4>
              {gameState.myCurrentRole &&
                gameState.myCurrentRole !== gameState.myOriginalRole && (
                  <div className="current-role-chip">
                    <Sparkles size={13} />
                    <span>You are currently a</span>
                    <strong style={{ color: ROLE_COLORS[gameState.myCurrentRole] || 'var(--amber-glow)' }}>
                      {gameState.myCurrentRole}
                    </strong>
                  </div>
                )}
              {gameState.myBodyguardLives != null &&
                gameState.myCurrentRole === 'Bodyguard' && (
                  <p style={{ fontSize: '0.86rem', color: '#bceee8' }}>
                    Bodyguard armor: {gameState.myBodyguardLives} life
                    {gameState.myBodyguardLives === 1 ? '' : 's'} remaining.
                  </p>
                )}
            </div>
          )}
          {isDead ? (
            <div className="action-prompt dead-watch-prompt">
              <h3>
                <Skull size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                Watching the Accusation
              </h3>
              <p>You are dead. The living players will decide whom to put on trial.</p>
            </div>
          ) : !me?.hasVoted && isPacifistVote ? (
            <div className="action-prompt">
              <h3>Pacifist Vote</h3>
              <p>Your role cannot accuse anyone. Submit a skip.</p>
              <button className="btn-secondary" onClick={() => submitVote(SKIP_VOTE)}>
                Skip Accusation
              </button>
            </div>
          ) : !me?.hasVoted ? (
            <>
              <div className="players-list">
                {gameState.players
                  .filter((p) => !p.isDead && p.id !== playerId)
                  .map((p) => (
                    <div
                      key={p.id}
                      className={`player-card selectable ${
                        selectedTarget1 === p.id ? 'selected' : ''
                      }`}
                      onClick={() => setSelectedTarget1(p.id)}
                    >
                      {p.name}
                    </div>
                  ))}
              </div>
              <div className="vote-actions">
                <button
                  className="btn-danger"
                  onClick={() => submitVote(selectedTarget1)}
                  disabled={!selectedTarget1}
                >
                  Accuse
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => submitVote(SKIP_VOTE)}
                >
                  Skip Accusation
                </button>
              </div>
            </>
          ) : (
            <p
              className="glow"
              style={{
                marginTop: '1rem',
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1.1rem',
                fontStyle: 'italic',
              }}
            >
              Awaiting the others...
            </p>
          )}
          {dayStatusBanner}
          {villagerChatPanel}
          {ghostChatPanel}
          <EventLogPanel events={eventLog} />
          </PhaseCommandPanel>
        </div>
        <RoleHelpModal role={roleHelpRole} onClose={() => setRoleHelpRole(null)} />
        <RuleBookModal
          open={showRuleBook}
          onClose={() => setShowRuleBook(false)}
          currentRole={gameState?.myCurrentRole || gameState?.myOriginalRole}
        />
        <HunterRevengeModal
          open={hunterRevengePrompt}
          players={gameState?.players || []}
          playerId={playerId}
          onConfirm={(targetId) => {
            socket.emit('hunterRevenge', targetId);
            setHunterRevengePrompt(false);
          }}
          onPass={() => {
            socket.emit('hunterRevenge', null);
            setHunterRevengePrompt(false);
          }}
        />
        {me?.isHost && (
          <BotDebugConsole
            open={showBotConsole}
            onClose={() => setShowBotConsole(false)}
            botDebug={gameState?.botDebug}
            onClear={clearBotLog}
          />
        )}
      </div>
    );
  }

  /* ============================================================
     DEFENSE
     ============================================================ */
  if (gameState.phase === 'defense') {
    const accused = gameState.players.find((p) => p.id === gameState.accusedId);
    const accusedName = accused ? accused.name : 'The accused';
    return (
      <div className="table-scene">
        <SceneAtmosphere cinematic={phaseCinematic} />
        <NoticeStack notices={privateNotices} />
        <GameHeader
          roomId={gameState.roomId}
          dayCount={gameState.dayCount}
          onLeave={handleLeave}
          onOpenRuleBook={() => setShowRuleBook(true)}
          muted={muted}
          volume={volume}
          onToggleMute={() => setMuted((m) => !m)}
          onVolumeChange={(v) => { setVolume(v); if (v > 0 && muted) setMuted(false); }}
          botCount={me?.isHost ? (gameState?.players?.filter((p) => p.isBot).length || 0) : 0}
          onOpenBotConsole={me?.isHost ? () => setShowBotConsole(true) : undefined}
        />
        <RoundTable
          players={gameState.players}
          playerId={playerId}
          phase="defense"
          accusedId={gameState.accusedId}
          isHost={me?.isHost}
          executionScene={executionScene}
          tableOverlay={executionScene ? <ExecutionOverlay scene={executionScene} /> : null}
        >
          {gameState.accusedId && (
            <div className="jail-stage jail-stage-defense">
              <JailCage name={accusedName} label="ACCUSED" />
              <PhaseBanner
                icon={<Vote size={14} />}
                kicker="Defense"
                title="State Your Innocence"
              />
              <PhaseTimer
                endsAt={gameState.phaseEndsAt}
                fallback={gameState.timeLeft}
                total={gameState.phaseDuration}
                label="Defence"
              />
            </div>
          )}
        </RoundTable>
        <div className="game-panel" style={{ textAlign: 'center' }}>
          <PhaseCommandPanel
            icon={<Vote size={15} />}
            kicker="Defense"
            title={`${accusedName} is on trial`}
            status={<ClockText endsAt={gameState.phaseEndsAt} fallback={gameState.timeLeft} />}
            actions={(
              <>
                <button
                  className="btn-secondary role-help-trigger"
                  onClick={() => openRoleHelp(gameState.myCurrentRole || gameState.myOriginalRole)}
                >
                  <BookOpen size={14} />
                  Role Guide
                </button>
                {me?.isHost && (
                  <button className="btn-danger role-help-trigger" onClick={skipDefense}>
                    <FastForward size={14} />
                    Continue to Trial
                  </button>
                )}
              </>
            )}
          >
            {gameState.accusedId === playerId ? (
              <div className="action-prompt" style={{ borderLeftColor: '#fbbf24' }}>
                <h3>You stand accused</h3>
                <p>Speak now in your defense. The village will then vote to eliminate or save you.</p>
              </div>
            ) : (
              <div className="action-prompt">
                <h3>The Accused Speaks</h3>
                <p>Listen carefully. {accusedName} has the floor to argue their innocence before the trial vote.</p>
              </div>
            )}
            {dayStatusBanner}
            {villagerChatPanel}
            {ghostChatPanel}
            <EventLogPanel events={eventLog} />
          </PhaseCommandPanel>
        </div>
        <RoleHelpModal role={roleHelpRole} onClose={() => setRoleHelpRole(null)} />
        <RuleBookModal
          open={showRuleBook}
          onClose={() => setShowRuleBook(false)}
          currentRole={gameState?.myCurrentRole || gameState?.myOriginalRole}
        />
        <HunterRevengeModal
          open={hunterRevengePrompt}
          players={gameState?.players || []}
          playerId={playerId}
          onConfirm={(targetId) => {
            socket.emit('hunterRevenge', targetId);
            setHunterRevengePrompt(false);
          }}
          onPass={() => {
            socket.emit('hunterRevenge', null);
            setHunterRevengePrompt(false);
          }}
        />
        {me?.isHost && (
          <BotDebugConsole
            open={showBotConsole}
            onClose={() => setShowBotConsole(false)}
            botDebug={gameState?.botDebug}
            onClear={clearBotLog}
          />
        )}
      </div>
    );
  }

  /* ============================================================
     TRIAL
     ============================================================ */
  if (gameState.phase === 'trial') {
    const accused = gameState.players.find((p) => p.id === gameState.accusedId);
    const accusedName = accused ? accused.name : 'The accused';
    const isAccused = gameState.accusedId === playerId;
    const myTrialVote = gameState.myTrialVote;
    const currentTrialRole = gameState.myCurrentRole || gameState.myOriginalRole;
    const isPacifistTrial = currentTrialRole === 'Pacifist';
    const trialStatus = isDead
      ? 'Watching'
      : isAccused
        ? 'On trial'
        : myTrialVote
          ? `Voted ${myTrialVote}`
          : isPacifistTrial
            ? 'Must save'
            : 'Eliminate or Save';
    return (
      <div className="table-scene">
        <SceneAtmosphere cinematic={phaseCinematic} />
        <NoticeStack notices={privateNotices} />
        <GameHeader
          roomId={gameState.roomId}
          dayCount={gameState.dayCount}
          onLeave={handleLeave}
          onOpenRuleBook={() => setShowRuleBook(true)}
          muted={muted}
          volume={volume}
          onToggleMute={() => setMuted((m) => !m)}
          onVolumeChange={(v) => { setVolume(v); if (v > 0 && muted) setMuted(false); }}
          botCount={me?.isHost ? (gameState?.players?.filter((p) => p.isBot).length || 0) : 0}
          onOpenBotConsole={me?.isHost ? () => setShowBotConsole(true) : undefined}
        />
        <RoundTable
          players={gameState.players}
          playerId={playerId}
          phase="trial"
          accusedId={gameState.accusedId}
          tableOverlay={executionScene ? <ExecutionOverlay scene={executionScene} /> : null}
          isHost={me?.isHost}
          executionScene={executionScene}
        >
          {gameState.accusedId && (
            <div
              className={`jail-stage jail-stage-trial ${executionScene && executionScene.type === 'tentacles' ? 'jail-dragged-tentacles' : ''} ${executionScene && executionScene.type === 'bees' ? 'jail-lifted-bees' : ''} ${executionScene && executionScene.type === 'bees_v2' ? 'jail-swarmed-bees_v2' : ''} ${executionScene && executionScene.type === 'void' ? 'jail-sucked-void' : ''} ${executionScene && executionScene.type === 'thunder' ? 'jail-shattered-thunder' : ''} ${executionScene && executionScene.type === 'cthulhu_abyss' ? 'jail-dragged-cthulhu_abyss' : ''}`}
              style={executionScene ? { '--exec-duration': `${executionScene.duration}ms` } : undefined}
            >
              <JailCage name={accusedName} label="ON TRIAL" verdict={gameState.trialTally && gameState.trialTally.eliminate > gameState.trialTally.save ? 'doom' : null} />
              <PhaseBanner
                icon={<Vote size={14} />}
                kicker="Trial"
                title="Verdict"
              />
              <PhaseTimer
                endsAt={gameState.phaseEndsAt}
                fallback={gameState.timeLeft}
                total={gameState.phaseDuration}
                label="Verdict"
              />
            </div>
          )}
        </RoundTable>
        <div className="game-panel" style={{ textAlign: 'center' }}>
          <PhaseCommandPanel
            icon={<Vote size={15} />}
            kicker="Trial"
            title={`Eliminate or save ${accusedName}?`}
            status={trialStatus}
            progress={gameState.voteProgress}
            progressLabel="Verdicts cast"
            actions={(
              <>
                <button
                  className="btn-secondary role-help-trigger"
                  onClick={() => openRoleHelp(gameState.myCurrentRole || gameState.myOriginalRole)}
                >
                  <BookOpen size={14} />
                  Role Guide
                </button>
                {me?.isHost && (
                  <button className="btn-danger role-help-trigger" onClick={skipTrial}>
                    <FastForward size={14} />
                    Force Verdict
                  </button>
                )}
              </>
            )}
          >
            {isDead ? (
              <div className="action-prompt dead-watch-prompt">
                <h3>
                  <Skull size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  Watching the Trial
                </h3>
                <p>You are dead. The living players decide the verdict.</p>
              </div>
            ) : isAccused ? (
              <div className="action-prompt" style={{ borderLeftColor: '#dc2626' }}>
                <h3>You are the accused</h3>
                <p>You may not vote on your own trial. The village will decide your fate.</p>
              </div>
            ) : isPacifistTrial && !myTrialVote ? (
              <div className="action-prompt">
                <h3>Pacifist Vote</h3>
                <p>Your role cannot vote to eliminate. Cast a Save vote.</p>
                <button className="btn-success" onClick={() => submitTrialVote('save')}>
                  Save
                </button>
              </div>
            ) : !myTrialVote ? (
              <div className="trial-actions">
                <p style={{ color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
                  Cast your verdict on <strong>{accusedName}</strong>.
                </p>
                <div className="vote-actions trial-vote-actions">
                  <button
                    className="btn-danger trial-eliminate-btn"
                    onClick={() => submitTrialVote('eliminate')}
                  >
                    <Skull size={14} />
                    Eliminate
                  </button>
                  <button
                    className="btn-success trial-save-btn"
                    onClick={() => submitTrialVote('save')}
                  >
                    <Sparkles size={14} />
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p
                className="glow"
                style={{
                  marginTop: '1rem',
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '1.1rem',
                  fontStyle: 'italic',
                }}
              >
                Verdict cast — {myTrialVote}. Awaiting the others...
              </p>
            )}
            {gameState.trialTally && (
              <div className="trial-tally">
                <span className="trial-tally-eliminate">Eliminate: {gameState.trialTally.eliminate}</span>
                <span className="trial-tally-divider">·</span>
                <span className="trial-tally-save">Save: {gameState.trialTally.save}</span>
              </div>
            )}
            {dayStatusBanner}
            {villagerChatPanel}
            {ghostChatPanel}
            <EventLogPanel events={eventLog} />
          </PhaseCommandPanel>
        </div>
        <RoleHelpModal role={roleHelpRole} onClose={() => setRoleHelpRole(null)} />
        <RuleBookModal
          open={showRuleBook}
          onClose={() => setShowRuleBook(false)}
          currentRole={gameState?.myCurrentRole || gameState?.myOriginalRole}
        />
        <HunterRevengeModal
          open={hunterRevengePrompt}
          players={gameState?.players || []}
          playerId={playerId}
          onConfirm={(targetId) => {
            socket.emit('hunterRevenge', targetId);
            setHunterRevengePrompt(false);
          }}
          onPass={() => {
            socket.emit('hunterRevenge', null);
            setHunterRevengePrompt(false);
          }}
        />
        {me?.isHost && (
          <BotDebugConsole
            open={showBotConsole}
            onClose={() => setShowBotConsole(false)}
            botDebug={gameState?.botDebug}
            onClear={clearBotLog}
          />
        )}
      </div>
    );
  }

  /* ============================================================
     END
     ============================================================ */
  if (gameState.phase === 'end') {
    const w = gameState.winner || '';
    const title = w.includes('Village')
      ? 'Village Wins'
      : w.includes('Tanner')
        ? 'Tanner Wins'
        : w.includes('Nobody')
          ? 'Nobody Wins'
          : 'Werewolves Win';
    const isWolf = title === 'Werewolves Win';

    return (
      <div className="table-scene">
        <SceneAtmosphere cinematic={phaseCinematic} />
        <NoticeStack notices={privateNotices} />
        <GameHeader
          roomId={gameState.roomId}
          dayCount={gameState.dayCount}
          onLeave={handleLeave}
          onOpenRuleBook={() => setShowRuleBook(true)}
          muted={muted}
          volume={volume}
          onToggleMute={() => setMuted((m) => !m)}
          onVolumeChange={(v) => { setVolume(v); if (v > 0 && muted) setMuted(false); }}
          botCount={me?.isHost ? (gameState?.players?.filter((p) => p.isBot).length || 0) : 0}
          onOpenBotConsole={me?.isHost ? () => setShowBotConsole(true) : undefined}
        />
        <RoundTable players={gameState.players} playerId={playerId} phase="end">
          <CenterDeck centerCards={gameState.centerCards} />
          <PhaseBanner
            icon={isWolf ? <Swords size={14} /> : <Crown size={14} />}
            kicker="Resolution"
            title={title}
          />
        </RoundTable>
        <div className="side-panel-stack end-side-panel">
          <div className="game-panel" style={{ textAlign: 'center' }}>
            <div className={`victory-banner ${isWolf ? 'wolf' : ''}`}>
            <h2>{title}</h2>
            <p
              style={{
                color: 'var(--text-soft)',
                fontFamily: 'Cormorant Garamond, serif',
                fontStyle: 'italic',
              }}
            >
              {w}
            </p>
          </div>
          <h4
            style={{
              color: 'var(--amber-glow)',
              marginBottom: '10px',
              letterSpacing: '0.1em',
            }}
          >
            Final Roles
          </h4>
          <div className="end-grid">
            {gameState.players.map((p) => {
              const role = gameState.publicAssignments[p.id];
              const faction = ROLE_FACTIONS[role] || '';
              const isWolfRole = faction === 'Wolf Team' || faction === 'Wolf Ally';
              return (
                <div
                  key={p.id}
                  className={`end-card ${p.isDead ? 'dead' : ''} ${
                    isWolfRole ? 'wolf' : ''
                  }`}
                >
                  <div className="end-card-name">
                    {p.name}
                    {p.isDead ? ' †' : ''}
                  </div>
                  <div
                    className="end-card-role"
                    style={{ color: ROLE_COLORS[role] || 'var(--accent)' }}
                  >
                    {role}
                  </div>
                </div>
              );
            })}
          </div>
          <ChronicleTimeline entries={gameState.chronicle} />
          {me?.isHost && (
            <div style={{ marginTop: '1.4rem', textAlign: 'center' }}>
              {deckWarning && (
                <div style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '10px', fontStyle: 'italic' }}>
                  ⚠️ {deckWarning}
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  className="btn-secondary"
                  onClick={() => setShowSettings((v) => !v)}
                  style={{
                    padding: '10px 14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  aria-label="Toggle game settings"
                  title={showSettings ? 'Hide Settings' : 'Configure Game'}
                >
                  <Settings size={14} />
                  {showSettings ? 'Hide Settings' : 'Configure'}
                </button>
                <button
                  className={`btn-primary ${canBeginGame ? 'pulse' : ''}`}
                  onClick={startGame}
                  disabled={!canBeginGame}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Play size={14} />
                  Play Again
                </button>
              </div>
            </div>
          )}
          </div>
          {me?.isHost && showSettings && renderHostSettingsPanel()}
        </div>
        <RuleBookModal
          open={showRuleBook}
          onClose={() => setShowRuleBook(false)}
          currentRole={gameState?.myCurrentRole || gameState?.myOriginalRole}
        />
        {me?.isHost && (
          <BotDebugConsole
            open={showBotConsole}
            onClose={() => setShowBotConsole(false)}
            botDebug={gameState?.botDebug}
            onClear={clearBotLog}
          />
        )}
      </div>
    );
  }

  return null;
}

export default App;
