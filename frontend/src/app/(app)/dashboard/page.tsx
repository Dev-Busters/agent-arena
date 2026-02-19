'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAgentLoadout, xpToLevel, xpForNextLevel, getTenetSlots, SCHOOL_UNLOCK_CONDITIONS, TENET_UNLOCK_CONDITIONS } from '@/stores/agentLoadout';
import { SCHOOLS, SchoolConfig, DEFAULT_SCHOOL } from '@/components/game/schools';
import { DISCIPLINES } from '@/components/game/disciplines';
import { TENETS } from '@/components/game/tenets';
import SchoolSelection from '@/components/game/SchoolSelection';
import DisciplineSelection from '@/components/game/DisciplineSelection';
import TenetSelection from '@/components/game/TenetSelection';
import SkillTreeRenderer from '@/components/game/SkillTreeRenderer';
import AbilityUnlockModal from '@/components/game/AbilityUnlockModal';
import { DOCTRINE_TREES, DoctrineKey } from '@/components/game/doctrineTrees';
import { DOCTRINE_ABILITIES, DOCTRINE_COLORS, getAbilityById } from '@/components/game/doctrineAbilities';

// ── Helpers ──────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, suffix, labelColor, borderColor, gradientFrom }: {
  icon: string; label: string; value: string | number; suffix?: string;
  labelColor: string; borderColor: string; gradientFrom: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl" style={{ background: `linear-gradient(135deg, ${gradientFrom} 0%, rgba(12,12,18,0.8) 100%)`, padding: '10px 12px' }}>
      <div className="absolute left-0 top-0 bottom-0" style={{ width: 2, background: borderColor, borderRadius: 1 }} />
      <div className="font-mono flex items-center" style={{ fontSize: '0.58rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3, gap: 4, color: labelColor }}>
        {icon} {label}
      </div>
      <div className="font-mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f5f0e8', lineHeight: 1.1 }}>
        {value}{suffix && <span style={{ color: '#5c574e', fontSize: '0.9rem' }}>{suffix}</span>}
      </div>
    </div>
  );
}

// ── Doctrine Trees Panel ───────────────────────────────────────────────────────
function DoctrineTreesPanel() {
  const loadout = useAgentLoadout();
  const [activeDoc, setActiveDoc] = useState<DoctrineKey>('iron');
  const tree = DOCTRINE_TREES[activeDoc];
  const points = loadout.doctrinePoints[activeDoc];
  const level = loadout.doctrineLevel[activeDoc];

  const tabs: { key: DoctrineKey; label: string }[] = [
    { key: 'iron', label: '🔴 Iron' },
    { key: 'arc',  label: '🔵 Arc' },
    { key: 'edge', label: '🟢 Edge' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
      className="relative overflow-hidden rounded-2xl mb-4"
      style={{ background: 'linear-gradient(160deg, rgba(18,18,28,0.8) 0%, rgba(10,10,16,0.9) 100%)', border: '1px solid #2a2a3d', padding: '20px 24px' }}>
      <div className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: '#8a6d2b' }}>⬡ Doctrine Trees</div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveDoc(t.key)}
            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: activeDoc === t.key ? `${DOCTRINE_COLORS[t.key]}22` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${activeDoc === t.key ? DOCTRINE_COLORS[t.key] : '#2a2a3d'}`,
              color: activeDoc === t.key ? DOCTRINE_COLORS[t.key] : '#8a8478',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Level + points */}
      <div className="flex items-center gap-4 mb-3 font-mono text-xs">
        <span style={{ color: DOCTRINE_COLORS[activeDoc] }}>Level {level}</span>
        <span style={{ color: '#5c574e' }}>·</span>
        <span style={{ color: points > 0 ? '#d4a843' : '#5c574e' }}>
          {points > 0 ? `${points} point${points !== 1 ? 's' : ''} available` : 'No points available'}
        </span>
        {level === 0 && <span className="italic" style={{ color: '#5c574e' }}>— earn XP through Crucible runs</span>}
      </div>

      {/* Renderer */}
      <div className="overflow-auto">
        <SkillTreeRenderer
          tree={tree}
          investedRanks={loadout.doctrineInvestedRanks}
          availablePoints={points}
          onInvest={(nodeId) => loadout.investDoctrineNode(nodeId, activeDoc)}
        />
      </div>
    </motion.div>
  );
}

// ── Ability Loadout Panel ──────────────────────────────────────────────────────
function AbilityLoadoutPanel() {
  const loadout = useAgentLoadout();
  const [pickerSlot, setPickerSlot] = useState<'Q'|'E'|'R'|'F'|null>(null);
  const pending = loadout.pendingAbilityUnlock;
  const slots: ('Q'|'E'|'R'|'F')[] = ['Q','E','R','F'];

  const pendingAbilities = pending
    ? [getAbilityById(pending.options[0])!, getAbilityById(pending.options[1])!].filter(Boolean) as [typeof DOCTRINE_ABILITIES[0], typeof DOCTRINE_ABILITIES[0]]
    : null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
      className="relative overflow-hidden rounded-2xl mb-4"
      style={{ background: 'linear-gradient(160deg, rgba(18,18,28,0.8) 0%, rgba(10,10,16,0.9) 100%)', border: '1px solid #2a2a3d', padding: '20px 24px' }}>
      <div className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: '#8a6d2b' }}>⚔ Abilities</div>

      {/* Pending unlock banner */}
      {pending && (
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
          className="rounded-xl px-4 py-3 mb-4 flex items-center justify-between"
          style={{ background: `${DOCTRINE_COLORS[pending.doctrine]}18`, border: `1px solid ${DOCTRINE_COLORS[pending.doctrine]}44` }}>
          <div>
            <span className="text-xs font-bold" style={{ color: DOCTRINE_COLORS[pending.doctrine] }}>
              🔓 New Ability Available — {pending.doctrine.charAt(0).toUpperCase()+pending.doctrine.slice(1)} Level {pending.level}
            </span>
            <p className="text-xs mt-0.5" style={{ color: '#8a8478' }}>Choose one ability to unlock</p>
          </div>
        </motion.div>
      )}

      {/* Slots */}
      <div className="grid grid-cols-4 gap-3">
        {slots.map(slot => {
          const abilityId = loadout.equippedAbilities[slot];
          const ability = abilityId ? getAbilityById(abilityId) : null;
          return (
            <div key={slot} className="relative">
              <button onClick={() => setPickerSlot(slot)}
                className="w-full rounded-xl p-3 text-left transition-all"
                style={{
                  background: ability ? `${DOCTRINE_COLORS[ability.doctrine]}11` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${ability ? DOCTRINE_COLORS[ability.doctrine]+'44' : '#2a2a3d'}`,
                  minHeight: 80,
                }}>
                <div className="font-mono text-xs font-bold mb-1" style={{ color: ability ? DOCTRINE_COLORS[ability.doctrine] : '#5c574e' }}>{slot}</div>
                {ability ? (
                  <>
                    <div className="text-lg mb-1">{ability.icon}</div>
                    <div className="text-xs font-bold truncate" style={{ color: '#e8e6f0' }}>{ability.name}</div>
                    <div className="text-[10px]" style={{ color: '#8a8478' }}>{(ability.cooldownMs/1000).toFixed(0)}s CD</div>
                  </>
                ) : (
                  <div className="text-xs italic" style={{ color: '#5c574e' }}>— Empty</div>
                )}
              </button>
              {ability && (
                <button onClick={() => loadout.equipAbility(slot, null)}
                  className="absolute top-1 right-1 text-[10px] rounded px-1"
                  style={{ color: '#5c574e', background: 'rgba(0,0,0,0.4)' }}>✕</button>
              )}
            </div>
          );
        })}
      </div>

      {loadout.unlockedAbilities.length === 0 && !pending && (
        <p className="text-xs italic mt-3 text-center" style={{ color: '#5c574e' }}>
          Complete Crucible runs to unlock abilities through Doctrine leveling
        </p>
      )}

      {/* Slot picker modal */}
      <AnimatePresence>
        {pickerSlot && (
          <motion.div className="absolute inset-0 rounded-2xl flex items-center justify-center z-10"
            style={{ background: 'rgba(10,10,18,0.96)', backdropFilter: 'blur(4px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="w-full px-6">
              <div className="text-xs font-bold mb-3" style={{ color: '#d4a843' }}>Equip ability in slot {pickerSlot}</div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {loadout.unlockedAbilities.length === 0 ? (
                  <p className="text-xs italic" style={{ color: '#5c574e' }}>No abilities unlocked yet</p>
                ) : (
                  loadout.unlockedAbilities.map(id => {
                    const ab = getAbilityById(id);
                    if (!ab) return null;
                    return (
                      <button key={id} onClick={() => { loadout.equipAbility(pickerSlot, id); setPickerSlot(null); }}
                        className="w-full text-left flex items-center gap-3 rounded-lg px-3 py-2 transition-all"
                        style={{ background: `${DOCTRINE_COLORS[ab.doctrine]}11`, border: `1px solid ${DOCTRINE_COLORS[ab.doctrine]}33` }}>
                        <span>{ab.icon}</span>
                        <div>
                          <div className="text-xs font-bold" style={{ color: DOCTRINE_COLORS[ab.doctrine] }}>{ab.name}</div>
                          <div className="text-[10px]" style={{ color: '#8a8478' }}>{ab.description}</div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
              <button onClick={() => setPickerSlot(null)} className="mt-3 w-full text-xs py-2 rounded-lg" style={{ color: '#5c574e', border: '1px solid #2a2a3d' }}>Cancel</button>
            </div>
          </motion.div>
        )}

        {/* Ability unlock modal */}
        {pending && pendingAbilities && pendingAbilities.length === 2 && (
          <AbilityUnlockModal
            doctrine={pending.doctrine}
            level={pending.level}
            options={pendingAbilities as [typeof pendingAbilities[0], typeof pendingAbilities[0]]}
            onUnlock={(id) => { loadout.unlockAbility(id); loadout.setPendingAbilityUnlock(null); }}
            onDismiss={() => loadout.setPendingAbilityUnlock(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const loadout = useAgentLoadout();
  const [modal, setModal] = useState<'school' | 'discipline' | 'tenet' | null>(null);

  const school = loadout.school ?? DEFAULT_SCHOOL;
  const level = loadout.accountLevel;
  const nextLevelXP = xpForNextLevel(level);
  const xpPct = nextLevelXP > 0 ? Math.min(100, (loadout.accountXP / nextLevelXP) * 100) : 100;
  const tenetSlots = getTenetSlots(level);

  // Compute effective stats from school + disciplines + tenets
  const hpBonus = loadout.disciplines.reduce((a, d) => a + (d.effects.hpBonus ?? 0), 0);
  const effectiveHP = Math.round((school.stats.hpBonus + 100 + hpBonus) * (loadout.tenets.reduce((a, t) => a * (t.effects.hpMult ?? 1), 1)));
  const mightPct = Math.round(school.stats.damageMultiplier * loadout.disciplines.reduce((a, d) => a * (d.effects.damageMult ?? 1), 1) * loadout.tenets.reduce((a, t) => a * (t.effects.damageMult ?? 1), 1) * 100);
  const agilityPct = Math.round(school.stats.speedMultiplier * loadout.disciplines.reduce((a, d) => a * (d.effects.speedMult ?? 1), 1) * 100);
  const critBonus = school.stats.critBonus + loadout.disciplines.reduce((a, d) => a + (d.effects.critBonus ?? 0), 0) + loadout.tenets.reduce((a, t) => a + (t.effects.critBonus ?? 0), 0);

  const stats = [
    { icon: '❤', label: 'Vitality',  value: effectiveHP, suffix: ' HP',  labelColor: 'rgba(212,64,64,0.7)',   borderColor: 'rgba(212,64,64,0.5)',   gradientFrom: 'rgba(212,64,64,0.1)' },
    { icon: '🔥', label: 'Might',    value: `${mightPct}%`,              labelColor: 'rgba(232,114,42,0.7)',  borderColor: 'rgba(232,114,42,0.5)',  gradientFrom: 'rgba(232,114,42,0.08)' },
    { icon: '⚡', label: 'Agility',  value: `${agilityPct}%`,            labelColor: 'rgba(212,168,67,0.6)',  borderColor: 'rgba(212,168,67,0.4)',  gradientFrom: 'rgba(212,168,67,0.07)' },
    { icon: '✦', label: 'Crit',      value: `${10 + critBonus}%`,        labelColor: 'rgba(155,93,229,0.7)',  borderColor: 'rgba(155,93,229,0.4)',  gradientFrom: 'rgba(155,93,229,0.08)' },
    { icon: '◇', label: 'Fortitude', value: '—',                         labelColor: 'rgba(77,168,218,0.7)',  borderColor: 'rgba(77,168,218,0.4)',  gradientFrom: 'rgba(77,168,218,0.07)' },
  ];

  const closeModal = () => setModal(null);

  return (
    <div style={{ padding: '40px 48px', maxWidth: 1200 }}>
      {/* Page Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <h1 className="font-display" style={{ fontSize: '2.8rem', fontWeight: 700, letterSpacing: '0.03em', lineHeight: 1.1, background: 'linear-gradient(180deg, #f5e6b8 0%, #d4a843 40%, #a67c2e 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          War Room
        </h1>
        <p className="font-display" style={{ fontSize: '0.8rem', fontWeight: 400, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8a6d2b', marginTop: 8 }}>
          Your champion awaits orders
        </p>
        <div style={{ marginTop: 12, width: 50, height: 1, background: 'linear-gradient(90deg, transparent, #8a6d2b, transparent)' }} />
      </motion.div>

      {/* Agent Hero Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, rgba(24,22,18,0.9) 0%, rgba(12,12,18,0.95) 100%)', boxShadow: '0 4px 30px rgba(0,0,0,0.3)', borderRadius: 16, padding: '28px 32px 24px', marginBottom: 16, border: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="absolute top-0 left-[10%] right-[10%]" style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,168,67,0.25), transparent)' }} />
        <div className="flex justify-between items-start relative z-10" style={{ marginBottom: 20 }}>
          <div className="flex-1">
            <div className="inline-flex items-center font-mono" style={{ gap: 5, fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5c574e', background: 'rgba(255,255,255,0.04)', padding: '3px 10px', borderRadius: 4, marginBottom: 8 }}>
              {school.icon} {school.name}
            </div>
            <h2 className="font-display" style={{ fontSize: '2rem', fontWeight: 700, color: '#f5f0e8', lineHeight: 1.1, marginBottom: 4 }}>Your Champion</h2>
            <div className="font-mono flex items-center" style={{ fontSize: '0.78rem', color: '#5c574e', gap: 8 }}>
              <span style={{ color: '#d4a843', fontWeight: 600 }}>Level {Math.max(1, level)}</span>
              <span>·</span>
              <span>{loadout.totalRuns} runs · {loadout.totalKills} kills · Floor {loadout.deepestFloor} best</span>
            </div>
          </div>
          <motion.div className="rounded-full flex items-center justify-center flex-shrink-0"
            animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 80, height: 80, background: `radial-gradient(circle, rgba(212,168,67,0.15) 0%, transparent 70%)`, border: '1.5px solid rgba(212,168,67,0.3)', fontSize: 32 }}>
            {school.icon}
          </motion.div>
        </div>
        <div className="relative z-10" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 16 }}>
          {stats.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.06 }}>
              <StatCard {...s} value={s.value} suffix={undefined} />
            </motion.div>
          ))}
        </div>
        {/* XP bar */}
        <div className="relative z-10">
          <div className="flex justify-between font-mono text-[10px] mb-1.5" style={{ color: '#5c574e', letterSpacing: '0.06em' }}>
            <span>ACCOUNT LEVEL {Math.max(1, level)}</span>
            <span style={{ color: '#8a6d2b' }}>{loadout.accountXP} / {nextLevelXP} XP</span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 4, background: 'rgba(0,0,0,0.4)', border: '1px solid #2a2a3d' }}>
            <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #8a6d2b, #d4a843)' }}
              initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ delay: 0.5, duration: 0.8 }} />
          </div>
        </div>
      </motion.div>

      {/* Loadout Panel */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, rgba(18,18,28,0.8) 0%, rgba(10,10,16,0.9) 100%)', border: '1px solid #2a2a3d', borderRadius: 16, padding: '20px 24px', marginBottom: 16 }}>
        <div className="absolute top-0 left-[10%] right-[10%]" style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(138,109,43,0.3), transparent)' }} />
        <div className="text-[10px] uppercase tracking-[0.3em] mb-4 relative z-10" style={{ color: '#8a6d2b' }}>⚔ Your Loadout</div>
        <div className="grid relative z-10" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>

          {/* School */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #2a2a3d' }}>
            <div className="text-[10px] uppercase tracking-wider mb-3" style={{ color: '#5c574e' }}>School</div>
            <div className="flex items-center gap-2 mb-3">
              <span style={{ fontSize: 22 }}>{school.icon}</span>
              <div>
                <div className="font-display text-sm font-bold" style={{ color: '#e8e6e3' }}>{school.name}</div>
                <div className={`text-[10px] italic ${school.uiColor}`}>{school.tagline}</div>
              </div>
            </div>
            <button onClick={() => setModal('school')} className="text-[10px] uppercase tracking-wider font-bold transition-colors" style={{ color: '#8a6d2b', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
              Change ›
            </button>
          </div>

          {/* Disciplines */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #2a2a3d' }}>
            <div className="text-[10px] uppercase tracking-wider mb-3" style={{ color: '#5c574e' }}>Disciplines</div>
            <div className="space-y-2 mb-3">
              {[0, 1].map(i => {
                const disc = loadout.disciplines[i];
                return (
                  <div key={i} className="flex items-center gap-2 text-xs rounded-lg px-3 py-1.5" style={{ background: disc ? 'rgba(138,109,43,0.1)' : 'rgba(255,255,255,0.02)', border: `1px solid ${disc ? '#8a6d2b' : '#2a2a3d'}` }}>
                    {disc ? (
                      <><span>{disc.icon}</span><span style={{ color: '#d4cfc5', fontWeight: 500 }}>{disc.name}</span></>
                    ) : (
                      <span style={{ color: '#5c574e' }}>— Empty slot</span>
                    )}
                  </div>
                );
              })}
            </div>
            <button onClick={() => setModal('discipline')} className="text-[10px] uppercase tracking-wider font-bold" style={{ color: '#8a6d2b', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
              Change ›
            </button>
          </div>

          {/* Tenets */}
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #2a2a3d' }}>
            <div className="text-[10px] uppercase tracking-wider mb-3" style={{ color: '#5c574e' }}>Tenets ({tenetSlots === 0 ? 'unlocks after 1st run' : `${tenetSlots} slots`})</div>
            <div className="space-y-1.5 mb-3">
              {Array.from({ length: Math.max(tenetSlots, 1) }).map((_, i) => {
                const tenet = loadout.tenets[i];
                return (
                  <div key={i} className="flex items-center gap-2 text-xs rounded-lg px-3 py-1.5" style={{ background: tenet ? 'rgba(138,109,43,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${tenet ? '#8a6d2b' : '#2a2a3d'}` }}>
                    {tenet ? (
                      <><span>{tenet.icon}</span><span style={{ color: '#d4cfc5', fontWeight: 500 }}>{tenet.name}</span></>
                    ) : tenetSlots === 0 ? (
                      <span style={{ color: '#5c574e', fontSize: 10 }}>🔒 Complete your first run</span>
                    ) : (
                      <span style={{ color: '#5c574e' }}>— Empty slot</span>
                    )}
                  </div>
                );
              })}
            </div>
            {tenetSlots > 0 && (
              <button onClick={() => setModal('tenet')} className="text-[10px] uppercase tracking-wider font-bold" style={{ color: '#8a6d2b', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
                Manage ›
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Link href="/arena" className="group relative overflow-hidden flex items-center transition-all duration-300 no-underline" style={{ background: 'linear-gradient(135deg, rgba(28,18,12,0.9) 0%, rgba(14,12,10,0.95) 100%)', borderRadius: 14, padding: '18px 22px', gap: 16 }}>
            <div className="absolute pointer-events-none" style={{ top: -20, left: -20, width: 100, height: 100, background: 'radial-gradient(circle, rgba(232,114,42,0.12) 0%, transparent 70%)' }} />
            <div className="flex items-center justify-center flex-shrink-0 relative z-10" style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(232,114,42,0.12)', color: '#e8722a', fontSize: 20 }}>⚔️</div>
            <div className="flex-1 relative z-10">
              <h3 className="font-body" style={{ fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#f5f0e8', marginBottom: 1 }}>Enter the Depths</h3>
              <p style={{ fontSize: '0.72rem', color: '#5c574e', margin: 0 }}>Descend into the arena. Fight. Survive.</p>
            </div>
            <span className="relative z-10 group-hover:translate-x-[3px] transition-transform" style={{ color: '#5c574e', fontSize: 14 }}>›</span>
          </Link>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
          <Link href="/inventory" className="group relative overflow-hidden flex items-center transition-all duration-300 no-underline" style={{ background: 'linear-gradient(135deg, rgba(24,22,14,0.9) 0%, rgba(14,13,10,0.95) 100%)', borderRadius: 14, padding: '18px 22px', gap: 16 }}>
            <div className="absolute pointer-events-none" style={{ top: -20, left: -20, width: 100, height: 100, background: 'radial-gradient(circle, rgba(212,168,67,0.1) 0%, transparent 70%)' }} />
            <div className="flex items-center justify-center flex-shrink-0 relative z-10" style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(212,168,67,0.12)', color: '#d4a843', fontSize: 20 }}>🛡️</div>
            <div className="flex-1 relative z-10">
              <h3 className="font-body" style={{ fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#f5f0e8', marginBottom: 1 }}>Visit the Armory</h3>
              <p style={{ fontSize: '0.72rem', color: '#5c574e', margin: 0 }}>Forge your legend. Wield ancient relics.</p>
            </div>
            <span className="relative z-10 group-hover:translate-x-[3px] transition-transform" style={{ color: '#5c574e', fontSize: 14 }}>›</span>
          </Link>
        </motion.div>
      </div>

      {/* Progression Summary */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="rounded-xl" style={{ background: 'linear-gradient(180deg, rgba(18,18,28,0.6) 0%, rgba(10,10,16,0.8) 100%)', border: '1px solid #2a2a3d', padding: '16px 20px' }}>
        <div className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: '#8a6d2b' }}>⚡ Progression</div>
        <div className="grid grid-cols-3 gap-4 font-mono text-center">
          {[
            { label: 'DEEPEST FLOOR', value: loadout.deepestFloor || '—', color: '#9b5de5' },
            { label: 'TOTAL KILLS',   value: loadout.totalKills,           color: '#d44040' },
            { label: 'GOLD HELD',     value: `${loadout.gold}g`,           color: '#d4a843' },
          ].map(p => (
            <div key={p.label}>
              <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: '#5c574e' }}>{p.label}</div>
              <div className="text-xl font-bold" style={{ color: p.color }}>{p.value}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Doctrine Trees ── */}
      <DoctrineTreesPanel />

      {/* ── Ability Loadout ── */}
      <AbilityLoadoutPanel />

      {/* Modals */}
      <AnimatePresence>
        {modal === 'school' && (
          <SchoolSelection
            unlockedSchoolIds={loadout.unlocks.schools}
            onSelect={s => { loadout.setSchool(s); closeModal(); }}
            onClose={closeModal}
          />
        )}
        {modal === 'discipline' && (
          <DisciplineSelection
            school={school}
            unlockedDisciplineIds={loadout.unlocks.disciplines}
            runsWithSchool={loadout.runsPerSchool[school.id] ?? 0}
            preSelected={loadout.disciplines}
            onConfirm={d => { loadout.setDisciplines(d); closeModal(); }}
          />
        )}
        {modal === 'tenet' && (
          <TenetSelection
            unlockedTenetIds={loadout.unlocks.tenets}
            maxSlots={tenetSlots}
            preSelected={loadout.tenets}
            onConfirm={t => { loadout.setTenets(t.slice(0, tenetSlots)); closeModal(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
