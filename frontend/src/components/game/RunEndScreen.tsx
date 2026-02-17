'use client';

import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SCHOOLS } from './schools';
import { TENETS } from './tenets';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface RunStats {
  floorsReached: number;
  roomsCompleted: number;
  enemiesKilled: number;
  timeSeconds: number;
  goldEarned: number;
  accountXPEarned: number;
  newAccountLevel: number;
  newUnlocks: string[];
  nearestUnlockLabel?: string;
  nearestUnlockProgress?: string; // e.g. "3 / 5"
  nearestUnlockHint?: string;     // e.g. "Reach Floor 5 to unlock"
}

interface RunEndScreenProps {
  stats: RunStats;
  onReturnToWarRoom: () => void;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

function unlockInfo(token: string): { icon: string; title: string; subtitle: string; accent: string } {
  const [kind, id] = token.split(':');
  if (kind === 'SCHOOL') {
    const school = Object.values(SCHOOLS).find(s => s.id === id);
    return {
      icon: school?.icon ?? '⚔️',
      title: `NEW SCHOOL: ${(school?.name ?? id).toUpperCase()}`,
      subtitle: school?.tagline ?? '',
      accent: '#f97316',
    };
  }
  if (kind === 'TENET') {
    const tenet = TENETS.find(t => t.id === id);
    return {
      icon: tenet?.icon ?? '⚖️',
      title: `NEW TENET: ${(tenet?.name ?? id).toUpperCase()}`,
      subtitle: tenet?.tagline ?? '',
      accent: '#3dba6f',
    };
  }
  return { icon: '🔓', title: token, subtitle: '', accent: '#4da8da' };
}

// Parse progress fraction from "3 / 5" → { current, total }
function parseProgress(s: string): { current: number; total: number } | null {
  const m = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!m) return null;
  return { current: parseInt(m[1]), total: parseInt(m[2]) };
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

const RUNE_CHARS = 'ᚠᚢᚦᚨᚱᛃᛈᛇᛉᛊᛏᛒᛗᛚᛞᛟ';

/** Full-screen death wash — cracks + runes, auto-fades after ~1.4s */
function DeathWash() {
  const cracks = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    id: i,
    // radiate in random directions from center
    angle: (i / 10) * 360 + (Math.random() - 0.5) * 30,
    length: 120 + Math.random() * 200,
    delay: Math.random() * 0.3,
    thickness: 1 + Math.random() * 1.5,
  })), []);

  const runes = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i,
    char: RUNE_CHARS[Math.floor(Math.random() * RUNE_CHARS.length)],
    x: `${5 + Math.random() * 90}%`,
    y: `${5 + Math.random() * 90}%`,
    size: 10 + Math.floor(Math.random() * 14),
    maxOpacity: 0.06 + Math.random() * 0.12,
    delay: 0.3 + Math.random() * 0.5,
  })), []);

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 5 }}
      animate={{ opacity: [1, 1, 0] }}
      transition={{ duration: 1.6, times: [0, 0.7, 1], ease: 'easeIn' }}
    >
      {/* Crack lines — SVG radiating from center */}
      <svg className="absolute inset-0 w-full h-full" style={{ overflow: 'visible' }}>
        {cracks.map(c => {
          const rad = (c.angle * Math.PI) / 180;
          const x2 = 50 + Math.cos(rad) * c.length;
          const y2 = 50 + Math.sin(rad) * c.length * 1.3; // stretch vertically
          return (
            <motion.line
              key={c.id}
              x1="50%" y1="50%"
              x2={`${x2}%`} y2={`${y2}%`}
              stroke="#d44040"
              strokeWidth={c.thickness}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: [0, 1, 0.8], opacity: [0, 0.28, 0.1] }}
              transition={{ duration: 0.9, delay: c.delay, ease: 'easeOut' }}
            />
          );
        })}
      </svg>

      {/* Rune glyphs scattered across screen */}
      {runes.map(r => (
        <motion.span
          key={r.id}
          className="absolute font-mono select-none"
          style={{ left: r.x, top: r.y, color: '#d44040', fontSize: r.size }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, r.maxOpacity, 0] }}
          transition={{ duration: 1.1, delay: r.delay, ease: 'easeInOut' }}
        >
          {r.char}
        </motion.span>
      ))}

      {/* Central red flash */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(180,20,20,0.18) 0%, transparent 70%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.8, delay: 0.1 }}
      />
    </motion.div>
  );
}

/** Animated XP counter — counts up from 0 to target */
function AnimatedNumber({ target, delay, prefix = '+' }: { target: number; delay: number; prefix?: string }) {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      const start = Date.now();
      const duration = 800;
      const tick = () => {
        const p = Math.min((Date.now() - start) / duration, 1);
        setCurrent(Math.floor(p * target));
        if (p < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }, delay * 1000);
    return () => {
      clearTimeout(t);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, delay]);
  return <span>{prefix}{current}</span>;
}

/** Background floating ember dots — behind the card */
function EmberParticles() {
  const embers = useMemo(() => Array.from({ length: 5 }, (_, i) => ({
    id: i,
    x: 8 + Math.random() * 84,
    size: 2 + Math.random() * 2,
    duration: 6 + Math.random() * 4,
    delay: Math.random() * 4,
    opacity: 0.05 + Math.random() * 0.07,
  })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {embers.map(e => (
        <motion.div
          key={e.id}
          className="absolute rounded-full"
          style={{
            left: `${e.x}%`,
            bottom: '-8px',
            width: e.size,
            height: e.size,
            background: '#d44040',
          }}
          animate={{ y: [0, -700], opacity: [0, e.opacity, e.opacity, 0] }}
          transition={{
            duration: e.duration,
            delay: e.delay,
            repeat: Infinity,
            ease: 'linear',
            times: [0, 0.1, 0.85, 1],
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export default function RunEndScreen({ stats, onReturnToWarRoom }: RunEndScreenProps) {
  const hasUnlocks = stats.newUnlocks.length > 0;
  const fallenLetters = 'FALLEN'.split('');

  // Parse nearest unlock progress fraction
  const progressFrac = stats.nearestUnlockProgress ? parseProgress(stats.nearestUnlockProgress) : null;
  const progressPct = progressFrac ? (progressFrac.current / progressFrac.total) * 100 : 0;

  // Timing constants (seconds)
  const T = {
    cardIn:    1.4,  // card starts appearing
    fallen:    1.2,  // FALLEN letters start
    subtitle:  1.8,  // subtitle fades in
    glowPulse: 1.75, // FALLEN glow pulse
    stats:     2.0,  // stats grid
    rewards:   2.2,  // rewards section
    unlockBase:2.5,  // first unlock card
    unlockStep:0.25, // stagger between unlock cards
    progress:  3.0 + (hasUnlocks ? stats.newUnlocks.length * 0.25 : 0),
    button:    3.2 + (hasUnlocks ? stats.newUnlocks.length * 0.25 : 0),
  };

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      style={{ zIndex: 60 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Dark overlay — builds up in stages */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'rgba(4,4,8,0.0)' }}
        animate={{ background: ['rgba(4,4,8,0.0)', 'rgba(4,4,8,0.94)'] }}
        transition={{ duration: 0.9, ease: 'easeIn' }}
      />

      {/* Ember particles float behind the card */}
      <EmberParticles />

      {/* Death wash — cracks + runes, auto-fades */}
      <DeathWash />

      {/* Main content card */}
      <motion.div
        className="relative rounded-2xl"
        style={{
          background: 'linear-gradient(160deg, rgba(22,18,14,0.98) 0%, rgba(10,10,16,0.99) 100%)',
          border: '1px solid #2a2a3d',
          maxWidth: 500,
          width: 'calc(100% - 32px)',
          maxHeight: 'calc(100% - 40px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'thin' as const,
          scrollbarColor: '#92600a transparent',
          zIndex: 10,
        }}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: T.cardIn, duration: 0.4, ease: 'easeOut' }}
      >
        {/* Top gold edge */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #92600a, transparent)', flexShrink: 0 }} />

        {/* Red vignette at top of card */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 130, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 70% 90px at 50% 0, rgba(180,20,20,0.2) 0%, transparent 100%)',
        }} />

        <div style={{ padding: '22px 28px 18px' }}>

          {/* ── FALLEN title ── */}
          <div className="text-center" style={{ marginBottom: 14 }}>
            {/* Letter-by-letter entrance then collective glow pulse */}
            <div style={{ display: 'inline-flex', letterSpacing: '0.12em' }}>
              {fallenLetters.map((ch, i) => (
                <motion.span
                  key={i}
                  className="font-display"
                  style={{ fontSize: '3.2rem', fontWeight: 700, color: '#d44040', display: 'inline-block' }}
                  initial={{ opacity: 0, scale: 1.3, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: T.fallen + i * 0.08, duration: 0.28, type: 'spring', stiffness: 220, damping: 14 }}
                >
                  {ch}
                </motion.span>
              ))}
            </div>
            {/* Glow pulse after all letters land */}
            <motion.div
              style={{ position: 'absolute', left: 0, right: 0, top: 14, pointerEvents: 'none' }}
              animate={{
                textShadow: [
                  '0 0 0px rgba(212,64,64,0)',
                  '0 0 40px rgba(212,64,64,0.7), 0 0 80px rgba(212,64,64,0.3)',
                  '0 0 20px rgba(212,64,64,0.35)',
                ],
              }}
              transition={{ delay: T.glowPulse, duration: 1.0, ease: 'easeOut' }}
            >
              {/* invisible spacer — just for the glow, the real text is above */}
              <span className="font-display" style={{ fontSize: '3.2rem', fontWeight: 700, color: 'transparent', letterSpacing: '0.12em' }}>
                FALLEN
              </span>
            </motion.div>

            {/* Ember sparks from FALLEN text */}
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: `${38 + i * 12}%`,
                  top: '18px',
                  width: 3,
                  height: 3,
                  background: '#d44040',
                  pointerEvents: 'none',
                }}
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: [0, 0.7, 0], y: -40 - i * 10, x: (i - 1) * 12 }}
                transition={{ delay: T.glowPulse + 0.1 + i * 0.12, duration: 0.9, ease: 'easeOut' }}
              />
            ))}

            {/* Subtitle */}
            <motion.p
              className="italic text-sm"
              style={{ color: '#8a8478', marginTop: 4 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: T.subtitle, duration: 0.4 }}
            >
              But legends never truly die...
            </motion.p>

            {/* Divider */}
            <motion.div
              style={{ height: 1, width: '60%', margin: '10px auto 0', background: 'linear-gradient(90deg, transparent, rgba(212,64,64,0.3), transparent)' }}
              initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
              transition={{ delay: T.subtitle + 0.1, duration: 0.4 }}
            />
          </div>

          {/* ── Summary pill (no-wrap) ── */}
          <motion.div
            className="flex justify-center"
            style={{ marginBottom: 14 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: T.stats - 0.1 }}
          >
            <div
              className="font-mono text-xs whitespace-nowrap rounded-full py-1.5 px-5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a3d', color: '#8a8478', letterSpacing: '0.06em' }}
            >
              Floor {stats.floorsReached} · {stats.enemiesKilled} Kills · {formatTime(stats.timeSeconds)}
            </div>
          </motion.div>

          {/* ── Stats grid ── */}
          <motion.div
            className="grid grid-cols-2 gap-2"
            style={{ marginBottom: 14 }}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: T.stats, duration: 0.35 }}
          >
            {[
              { label: 'ROOMS CLEARED', value: stats.roomsCompleted, color: '#4da8da' },
              { label: 'ENEMIES SLAIN',  value: stats.enemiesKilled,  color: '#d44040' },
              { label: 'FLOORS REACHED', value: stats.floorsReached,  color: '#9b5de5' },
              { label: 'TIME SURVIVED',  value: formatTime(stats.timeSeconds), color: '#3dba6f' },
            ].map(s => (
              <div key={s.label} className="rounded-xl" style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid #2a2a3d', padding: '9px 11px',
              }}>
                <div style={{ fontSize: '9px', color: '#4a4540', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 2 }}>
                  {s.label}
                </div>
                <div className="font-mono font-bold" style={{ fontSize: '1.4rem', color: s.color, lineHeight: 1.1 }}>
                  {s.value}
                </div>
              </div>
            ))}
          </motion.div>

          {/* ── Rewards ── */}
          <motion.div
            style={{ marginBottom: hasUnlocks ? 12 : 14 }}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: T.rewards, duration: 0.35 }}
          >
            <div style={{ fontSize: '10px', color: '#8a6d2b', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 7 }}>
              ⚡ Rewards
            </div>
            <div className="relative rounded-xl overflow-hidden" style={{
              background: 'rgba(212,168,67,0.05)', border: '1px solid rgba(212,168,67,0.12)', padding: '10px 14px',
            }}>
              {/* Diagonal shimmer */}
              <motion.div
                style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none',
                  background: 'linear-gradient(120deg, transparent 20%, rgba(212,168,67,0.07) 50%, transparent 80%)',
                  backgroundSize: '200% 100%',
                }}
                animate={{ backgroundPositionX: ['200%', '-200%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
              />

              {/* Gold */}
              <div className="flex justify-between items-center font-mono text-sm" style={{ marginBottom: 6 }}>
                <span style={{ color: '#8a8478' }}>💰 Gold Earned</span>
                <span style={{ color: '#d4a843', fontWeight: 700, textShadow: '0 0 10px rgba(212,168,67,0.5)' }}>
                  +{stats.goldEarned}
                </span>
              </div>

              {/* XP — animated counter */}
              <div
                className="flex justify-between items-center font-mono text-sm"
                style={{ marginBottom: stats.newAccountLevel > 0 ? 0 : 0 }}
              >
                <span style={{ color: '#8a8478' }}>✦ Account XP</span>
                <span style={{ color: '#a855f7', fontWeight: 600 }}>
                  <AnimatedNumber target={stats.accountXPEarned} delay={T.rewards + 0.2} />
                </span>
              </div>

              {/* Level up — full-width banner inside rewards box */}
              {stats.newAccountLevel > 0 && (
                <motion.div
                  className="rounded-lg font-mono font-bold text-sm flex items-center justify-center gap-2"
                  style={{
                    marginTop: 8,
                    background: 'linear-gradient(90deg, rgba(245,158,11,0.12), rgba(245,158,11,0.06))',
                    border: '1px solid rgba(245,158,11,0.25)',
                    padding: '6px 10px',
                    color: '#fbbf24',
                    letterSpacing: '0.06em',
                  }}
                  initial={{ opacity: 0, scaleX: 0.9 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: T.rewards + 0.5, type: 'spring', stiffness: 200 }}
                >
                  <motion.span
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ delay: T.rewards + 0.7, duration: 0.6, repeat: 2 }}
                  >
                    ⬆
                  </motion.span>
                  LEVEL UP — Level {stats.newAccountLevel}
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* ── Unlock reveals ── */}
          {hasUnlocks && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: '10px', color: '#3dba6f', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 7 }}>
                🔓 Unlocked
              </div>
              <div className="space-y-2">
                {stats.newUnlocks.map((token, i) => {
                  const info = unlockInfo(token);
                  const accentRgb = info.accent === '#f97316' ? '249,115,22'
                    : info.accent === '#3dba6f' ? '61,186,111' : '77,168,218';
                  return (
                    <motion.div
                      key={token}
                      className="relative rounded-xl flex items-center gap-3 overflow-hidden"
                      style={{
                        background: `rgba(${accentRgb},0.07)`,
                        border: `1px solid ${info.accent}33`,
                        borderLeft: `3px solid ${info.accent}`,
                        padding: '8px 12px',
                      }}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: T.unlockBase + i * T.unlockStep, type: 'spring', stiffness: 180, damping: 18 }}
                    >
                      {/* Golden flash across card on entrance */}
                      <motion.div
                        style={{
                          position: 'absolute', inset: 0, pointerEvents: 'none',
                          background: `linear-gradient(90deg, transparent, rgba(${accentRgb},0.18), transparent)`,
                          backgroundSize: '200% 100%',
                        }}
                        initial={{ backgroundPositionX: '200%' }}
                        animate={{ backgroundPositionX: '-200%' }}
                        transition={{ delay: T.unlockBase + i * T.unlockStep + 0.05, duration: 0.5, ease: 'easeOut' }}
                      />

                      {/* Icon with bounce */}
                      <motion.span
                        style={{ fontSize: 18, flexShrink: 0, display: 'inline-block', position: 'relative', zIndex: 1 }}
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.25, 1.0] }}
                        transition={{ delay: T.unlockBase + i * T.unlockStep + 0.08, type: 'spring', stiffness: 380, damping: 12 }}
                      >
                        {info.icon}
                      </motion.span>

                      {/* Sparkle near icon */}
                      <motion.span
                        style={{ position: 'absolute', left: 22, top: 4, fontSize: 10, color: info.accent, pointerEvents: 'none' }}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5], y: -8 }}
                        transition={{ delay: T.unlockBase + i * T.unlockStep + 0.15, duration: 0.6 }}
                      >
                        ✧
                      </motion.span>

                      <div style={{ minWidth: 0, position: 'relative', zIndex: 1 }}>
                        <div className="font-mono font-bold" style={{ fontSize: '11px', color: info.accent }}>
                          {info.title}
                        </div>
                        {info.subtitle && (
                          <div className="text-[10px] italic truncate" style={{ color: '#8a8478' }}>
                            {info.subtitle}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Progress bar ── */}
          {stats.nearestUnlockLabel && (
            <motion.div
              style={{ marginBottom: 12 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: T.progress }}
            >
              <div style={{ fontSize: '10px', color: '#5c574e', letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 7 }}>
                Next Unlock
              </div>
              <div className="rounded-xl" style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid #2a2a3d', padding: '9px 12px',
              }}>
                <div className="flex justify-between items-center" style={{ marginBottom: 6 }}>
                  <span className="font-mono text-xs font-bold" style={{ color: '#d4cfc5' }}>
                    {stats.nearestUnlockLabel}
                  </span>
                  {progressFrac && (
                    <span className="font-mono text-xs" style={{ color: '#8a6d2b' }}>
                      {progressFrac.current} / {progressFrac.total}
                    </span>
                  )}
                </div>
                {/* Progress bar */}
                <div className="rounded-full overflow-hidden" style={{ height: 4, background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #8a6d2b, #d4a843)', transformOrigin: 'left' }}
                    initial={{ scaleX: 0 }} animate={{ scaleX: progressPct / 100 }}
                    transition={{ delay: T.progress + 0.15, duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
                {stats.nearestUnlockHint && (
                  <div className="text-[10px] italic" style={{ color: '#5c574e', marginTop: 5 }}>
                    {stats.nearestUnlockHint}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ── WAR ROOM button ── */}
          <motion.button
            onClick={onReturnToWarRoom}
            className="relative w-full rounded-xl font-bold uppercase tracking-widest text-sm py-3 overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.06))',
              border: '1px solid #92600a',
              color: '#fbbf24',
            }}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: T.button, duration: 0.35 }}
            whileHover={{ scale: 1.02, boxShadow: '0 0 22px rgba(245,158,11,0.22)' }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Pulsing border glow — starts after card settles */}
            <motion.span
              style={{ position: 'absolute', inset: -1, borderRadius: 12, pointerEvents: 'none' }}
              animate={{ boxShadow: ['0 0 3px rgba(245,158,11,0.3)', '0 0 12px rgba(245,158,11,0.6)', '0 0 3px rgba(245,158,11,0.3)'] }}
              transition={{ delay: T.button + 0.5, duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            WAR ROOM
          </motion.button>

        </div>
      </motion.div>
    </motion.div>
  );
}
