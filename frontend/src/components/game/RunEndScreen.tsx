'use client';

import { motion } from 'framer-motion';
import { SCHOOLS } from './schools';
import { TENETS } from './tenets';

export interface RunStats {
  floorsReached: number;
  roomsCompleted: number;
  enemiesKilled: number;
  timeSeconds: number;
  goldEarned: number;
  accountXPEarned: number;
  newAccountLevel: number;
  newUnlocks: string[]; // e.g. ['SCHOOL:invoker', 'TENET:glass-cannon']
  nearestUnlockLabel?: string;
  nearestUnlockProgress?: string;
}

interface RunEndScreenProps {
  stats: RunStats;
  onReturnToWarRoom: () => void;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

function unlockLabel(token: string): { icon: string; title: string; subtitle: string; accentColor: string } {
  const [kind, id] = token.split(':');
  if (kind === 'SCHOOL') {
    const school = Object.values(SCHOOLS).find(s => s.id === id);
    return {
      icon: school?.icon ?? '⚔️',
      title: `NEW SCHOOL: ${school?.name?.toUpperCase() ?? id.toUpperCase()}`,
      subtitle: school ? school.tagline : '',
      accentColor: '#f97316', // fire-orange for school unlocks
    };
  }
  if (kind === 'TENET') {
    const tenet = TENETS.find(t => t.id === id);
    return {
      icon: tenet?.icon ?? '⚖️',
      title: `NEW TENET: ${tenet?.name?.toUpperCase() ?? id.toUpperCase()}`,
      subtitle: tenet?.tagline ?? '',
      accentColor: '#3dba6f', // venom-green for tenet unlocks
    };
  }
  return { icon: '🔓', title: token, subtitle: '', accentColor: '#4da8da' };
}

export default function RunEndScreen({ stats, onReturnToWarRoom }: RunEndScreenProps) {
  const hasUnlocks = stats.newUnlocks.length > 0;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      style={{ background: 'rgba(6,6,11,0.92)', backdropFilter: 'blur(4px)', zIndex: 60 }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
    >
      <motion.div
        className="relative rounded-2xl"
        style={{
          background: 'linear-gradient(160deg, rgba(22,18,14,0.98) 0%, rgba(10,10,16,0.99) 100%)',
          border: '1px solid #2a2a3d',
          maxWidth: 500,
          width: 'calc(100% - 32px)',
          // Fit within the 720px canvas with 20px top+bottom margin
          maxHeight: 'calc(100% - 40px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          // Thin warm scrollbar for overflow edge cases
          scrollbarWidth: 'thin' as const,
          scrollbarColor: '#92600a transparent',
        }}
        initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.35 }}
      >
        {/* Top gold edge */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #92600a, transparent)', flexShrink: 0 }} />

        <div style={{ padding: '24px 32px 20px' }}>

          {/* Red vignette glow behind FALLEN */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 140,
            background: 'radial-gradient(ellipse 60% 80px at 50% 0, rgba(180,30,30,0.18) 0%, transparent 100%)',
            pointerEvents: 'none',
          }} />

          {/* FALLEN title */}
          <div className="text-center" style={{ marginBottom: 16, position: 'relative' }}>
            <motion.h1
              className="font-display"
              style={{
                fontSize: '2.8rem', fontWeight: 700, color: '#d44040', letterSpacing: '0.06em',
                textShadow: '0 0 24px rgba(212,64,64,0.5), 0 2px 8px rgba(0,0,0,0.8)',
              }}
              initial={{ y: -14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
            >
              FALLEN
            </motion.h1>
            <motion.p
              className="italic text-sm" style={{ color: '#8a8478', marginTop: 3 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            >
              But legends never truly die...
            </motion.p>
            {/* Divider */}
            <motion.div
              style={{
                height: 1, width: '60%', margin: '10px auto 0',
                background: 'linear-gradient(90deg, transparent, rgba(212,64,64,0.3), transparent)',
              }}
              initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            />
          </div>

          {/* Stats grid — compact padding, label dim/small, value big/bold */}
          <motion.div
            className="grid grid-cols-2 gap-2.5"
            style={{ marginBottom: 16 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          >
            {[
              { label: 'ROOMS CLEARED', value: stats.roomsCompleted, color: '#4da8da' },
              { label: 'ENEMIES SLAIN', value: stats.enemiesKilled, color: '#d44040' },
              { label: 'FLOORS REACHED', value: stats.floorsReached, color: '#9b5de5' },
              { label: 'TIME SURVIVED',  value: formatTime(stats.timeSeconds), color: '#3dba6f' },
            ].map(s => (
              <div key={s.label} className="rounded-xl" style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid #2a2a3d', padding: '10px 12px',
              }}>
                <div className="uppercase tracking-widest" style={{ fontSize: '9px', color: '#4a4540', marginBottom: 3 }}>
                  {s.label}
                </div>
                <div className="font-mono font-bold" style={{ fontSize: '1.5rem', color: s.color, lineHeight: 1.1 }}>
                  {s.value}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Rewards section — subtle gold shimmer overlay */}
          <motion.div
            style={{ marginBottom: hasUnlocks ? 14 : 16 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}
          >
            <div className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: '#8a6d2b' }}>⚡ Rewards</div>
            <div className="relative rounded-xl overflow-hidden" style={{
              background: 'rgba(212,168,67,0.05)', border: '1px solid rgba(212,168,67,0.12)', padding: '10px 14px',
            }}>
              {/* Diagonal shimmer sweep */}
              <motion.div
                style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none',
                  background: 'linear-gradient(120deg, transparent 20%, rgba(212,168,67,0.07) 50%, transparent 80%)',
                  backgroundSize: '200% 100%',
                }}
                animate={{ backgroundPositionX: ['200%', '-200%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
              />
              <div className="flex justify-between font-mono text-sm" style={{ marginBottom: 5 }}>
                <span style={{ color: '#8a8478' }}>💰 Gold Earned</span>
                <span style={{
                  color: '#d4a843', fontWeight: 700,
                  textShadow: '0 0 10px rgba(212,168,67,0.4)',
                }}>+{stats.goldEarned}</span>
              </div>
              <div className="flex justify-between font-mono text-sm" style={{ marginBottom: stats.newAccountLevel > 0 ? 5 : 0 }}>
                <span style={{ color: '#8a8478' }}>⭐ Account XP</span>
                <span style={{ color: '#fbbf24', fontWeight: 600 }}>+{stats.accountXPEarned}</span>
              </div>
              {stats.newAccountLevel > 0 && (
                <div className="flex justify-between font-mono text-sm">
                  <span style={{ color: '#8a8478' }}>🏆 Account Level</span>
                  <span style={{ color: '#f0c654', fontWeight: 700 }}>Level {stats.newAccountLevel}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Unlock reveals */}
          {hasUnlocks && (
            <motion.div
              style={{ marginBottom: 14 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}
            >
              <div className="text-[10px] uppercase tracking-[0.3em] mb-1.5" style={{ color: '#3dba6f' }}>🔓 Unlocked</div>
              <div className="space-y-1.5">
                {stats.newUnlocks.map((token, i) => {
                  const info = unlockLabel(token);
                  return (
                    <motion.div key={token}
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.1 + i * 0.12 }}
                      className="rounded-xl flex items-center gap-3"
                      style={{
                        background: `rgba(${info.accentColor === '#f97316' ? '249,115,22' : info.accentColor === '#3dba6f' ? '61,186,111' : '77,168,218'},0.07)`,
                        border: `1px solid ${info.accentColor}33`,
                        padding: '8px 12px',
                        // Left accent bar
                        borderLeft: `3px solid ${info.accentColor}`,
                      }}
                    >
                      {/* Icon with entrance flash */}
                      <motion.span
                        style={{ fontSize: 18, display: 'inline-block', flexShrink: 0 }}
                        initial={{ scale: 0.7 }} animate={{ scale: [0.7, 1.15, 1.0] }}
                        transition={{ delay: 1.15 + i * 0.12, type: 'spring', stiffness: 400 }}
                      >
                        {info.icon}
                      </motion.span>
                      <div style={{ minWidth: 0 }}>
                        <div className="font-mono font-bold" style={{ fontSize: '11px', color: info.accentColor }}>
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
            </motion.div>
          )}

          {/* Progress toward next unlock */}
          {stats.nearestUnlockLabel && (
            <motion.div
              style={{ marginBottom: 14 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.25 }}
            >
              <div className="text-[10px] uppercase tracking-[0.3em] mb-1.5" style={{ color: '#5c574e' }}>Progress</div>
              <div className="font-mono text-xs" style={{ color: '#8a8478' }}>
                <span style={{ color: '#d4cfc5' }}>{stats.nearestUnlockLabel}</span>
                {stats.nearestUnlockProgress && (
                  <span style={{ color: '#8a6d2b', marginLeft: 8 }}>{stats.nearestUnlockProgress}</span>
                )}
              </div>
            </motion.div>
          )}

          {/* Return button — "WAR ROOM" with pulsing gold glow */}
          <motion.button
            onClick={onReturnToWarRoom}
            className="w-full rounded-xl font-bold uppercase tracking-widest text-sm py-3"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.06))',
              border: '1px solid #92600a', color: '#fbbf24', position: 'relative',
            }}
            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(245,158,11,0.2)' }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
          >
            {/* Pulsing gold border glow — starts after animations settle */}
            <motion.span
              style={{
                position: 'absolute', inset: -1, borderRadius: 12, pointerEvents: 'none',
                boxShadow: '0 0 0px rgba(245,158,11,0)',
              }}
              animate={{ boxShadow: ['0 0 4px rgba(245,158,11,0.3)', '0 0 14px rgba(245,158,11,0.6)', '0 0 4px rgba(245,158,11,0.3)'] }}
              transition={{ delay: 2, duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            WAR ROOM
          </motion.button>

        </div>
      </motion.div>
    </motion.div>
  );
}
