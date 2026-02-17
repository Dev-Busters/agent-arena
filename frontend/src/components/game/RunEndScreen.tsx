'use client';

import { motion } from 'framer-motion';
import { SCHOOLS } from './schools';
import { TENETS } from './tenets';

export interface RunStats {
  floorsReached: number;
  roomsCompleted: number;
  enemiesKilled: number;
  timeSeconds: number;
  // Rewards (computed by ArenaCanvas before showing this screen)
  goldEarned: number;
  accountXPEarned: number;
  newAccountLevel: number;
  // Unlocks triggered this run
  newUnlocks: string[]; // e.g. ['SCHOOL:invoker', 'TENET:glass-cannon']
  // Progress toward nearest unlock (shown at bottom)
  nearestUnlockLabel?: string;
  nearestUnlockProgress?: string; // e.g. "12 / 50 kills"
}

interface RunEndScreenProps {
  stats: RunStats;
  onReturnToWarRoom: () => void;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

// Pretty label for a new unlock token like 'SCHOOL:invoker' or 'TENET:glass-cannon'
function unlockLabel(token: string): { icon: string; title: string; subtitle: string } {
  const [kind, id] = token.split(':');
  if (kind === 'SCHOOL') {
    const school = Object.values(SCHOOLS).find(s => s.id === id);
    return {
      icon: school?.icon ?? '⚔️',
      title: `NEW SCHOOL: ${school?.name?.toUpperCase() ?? id.toUpperCase()}`,
      subtitle: school ? `${school.tagline}` : '',
    };
  }
  if (kind === 'TENET') {
    const tenet = TENETS.find(t => t.id === id);
    return {
      icon: tenet?.icon ?? '⚖️',
      title: `NEW TENET: ${tenet?.name?.toUpperCase() ?? id.toUpperCase()}`,
      subtitle: tenet?.tagline ?? '',
    };
  }
  return { icon: '🔓', title: token, subtitle: '' };
}

export default function RunEndScreen({ stats, onReturnToWarRoom }: RunEndScreenProps) {
  const hasUnlocks = stats.newUnlocks.length > 0;

  return (
    <motion.div
      className="absolute inset-0 backdrop-blur-sm flex items-center justify-center"
      style={{ background: 'rgba(6,6,11,0.92)', zIndex: 60 }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
    >
      <motion.div
        className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, rgba(22,18,14,0.98) 0%, rgba(10,10,16,0.99) 100%)',
          border: '1px solid #2a2a3d',
          maxWidth: 520, width: '100%', margin: '0 16px',
        }}
        initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.35 }}
      >
        {/* Top gold edge */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #92600a, transparent)' }} />

        <div style={{ padding: '36px 40px 32px' }}>
          {/* FALLEN title */}
          <div className="text-center" style={{ marginBottom: 24 }}>
            <motion.h1
              className="font-display"
              style={{ fontSize: '3.5rem', fontWeight: 700, color: '#d44040', letterSpacing: '0.06em',
                textShadow: '0 0 30px rgba(212,64,64,0.4)' }}
              initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }}
            >
              FALLEN
            </motion.h1>
            <motion.p
              className="italic text-sm" style={{ color: '#8a8478', marginTop: 4 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
            >
              But legends never truly die...
            </motion.p>
          </div>

          {/* Run summary pill */}
          <motion.div
            className="text-center font-mono text-xs rounded-full py-2 px-5 mx-auto"
            style={{
              display: 'inline-block', marginBottom: 24, marginLeft: '50%', transform: 'translateX(-50%)',
              background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a3d',
              color: '#8a8478', letterSpacing: '0.08em',
            }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
          >
            Floor {stats.floorsReached} · {stats.enemiesKilled} Kills · {formatTime(stats.timeSeconds)}
          </motion.div>

          {/* Stats grid */}
          <motion.div
            className="grid grid-cols-2 gap-3"
            style={{ marginBottom: 20 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75 }}
          >
            {[
              { label: 'ROOMS CLEARED', value: stats.roomsCompleted, color: '#4da8da' },
              { label: 'ENEMIES SLAIN', value: stats.enemiesKilled, color: '#d44040' },
              { label: 'FLOORS REACHED', value: stats.floorsReached, color: '#9b5de5' },
              { label: 'TIME SURVIVED', value: formatTime(stats.timeSeconds), color: '#3dba6f' },
            ].map(s => (
              <div key={s.label} className="rounded-xl" style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid #2a2a3d', padding: '12px 14px',
              }}>
                <div className="text-[10px] uppercase tracking-widest" style={{ color: '#5c574e', marginBottom: 4 }}>{s.label}</div>
                <div className="font-mono text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </motion.div>

          {/* Rewards section */}
          <motion.div
            style={{ marginBottom: hasUnlocks ? 16 : 20 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          >
            <div className="text-[10px] uppercase tracking-[0.3em] mb-2.5" style={{ color: '#8a6d2b' }}>⚡ Rewards</div>
            <div className="rounded-xl" style={{ background: 'rgba(212,168,67,0.05)', border: '1px solid rgba(212,168,67,0.12)', padding: '12px 16px' }}>
              <div className="flex justify-between font-mono text-sm" style={{ marginBottom: 6 }}>
                <span style={{ color: '#8a8478' }}>💰 Gold Earned</span>
                <span style={{ color: '#d4a843', fontWeight: 600 }}>+{stats.goldEarned}</span>
              </div>
              <div className="flex justify-between font-mono text-sm" style={{ marginBottom: stats.newAccountLevel > 0 ? 6 : 0 }}>
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
              style={{ marginBottom: 20 }}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
            >
              <div className="text-[10px] uppercase tracking-[0.3em] mb-2.5" style={{ color: '#3dba6f' }}>🔓 Unlocked</div>
              <div className="space-y-2">
                {stats.newUnlocks.map((token, i) => {
                  const info = unlockLabel(token);
                  return (
                    <motion.div key={token}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.2 + i * 0.15 }}
                      className="rounded-xl flex items-center gap-3"
                      style={{ background: 'rgba(61,186,111,0.07)', border: '1px solid rgba(61,186,111,0.2)', padding: '10px 14px' }}
                    >
                      <span style={{ fontSize: 20 }}>{info.icon}</span>
                      <div>
                        <div className="font-mono text-xs font-bold" style={{ color: '#3dba6f' }}>{info.title}</div>
                        {info.subtitle && <div className="text-[10px] italic" style={{ color: '#8a8478' }}>{info.subtitle}</div>}
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
              style={{ marginBottom: 20 }}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}
            >
              <div className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: '#5c574e' }}>Progress</div>
              <div className="font-mono text-xs" style={{ color: '#8a8478' }}>
                <span style={{ color: '#d4cfc5' }}>{stats.nearestUnlockLabel}</span>
                {stats.nearestUnlockProgress && (
                  <span style={{ color: '#8a6d2b', marginLeft: 8 }}>{stats.nearestUnlockProgress}</span>
                )}
              </div>
            </motion.div>
          )}

          {/* Return button */}
          <motion.button
            onClick={onReturnToWarRoom}
            className="w-full rounded-xl font-bold uppercase tracking-widest text-sm py-4"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.06))',
              border: '1px solid #92600a', color: '#fbbf24',
            }}
            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(245,158,11,0.15)' }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4 }}
          >
            Return to War Room
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
