'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Discipline, DISCIPLINES } from './disciplines';
import { getDisciplineUnlockCondition } from '@/stores/agentLoadout';
import { SchoolConfig } from './schools';

interface DisciplineSelectionProps {
  school: SchoolConfig;
  onConfirm: (disciplines: Discipline[]) => void;
  /** IDs of unlocked disciplines. Undefined = all unlocked (new run flow). */
  unlockedDisciplineIds?: string[];
  /** How many runs completed with this school (for unlock progress display) */
  runsWithSchool?: number;
  /** Pre-selected disciplines (War Room editing) */
  preSelected?: Discipline[];
  /** Close without saving (War Room modal) */
  onClose?: () => void;
}

const MAX_SLOTS = 2;

const EFFECT_LABELS: Record<string, (v: number) => string> = {
  hpBonus:            v => `+${v} Max HP`,
  damageMult:         v => `${v >= 1 ? '+' : ''}${Math.round((v - 1) * 100)}% Damage`,
  speedMult:          v => `${v >= 1 ? '+' : ''}${Math.round((v - 1) * 100)}% Speed`,
  critBonus:          v => `+${v}% Crit Chance`,
  blastRadiusMult:    v => `+${Math.round((v - 1) * 100)}% Blast Radius`,
  attackCooldownMult: v => v < 1 ? `+${Math.round((1 - v) * 100)}% Attack Speed` : `-${Math.round((v - 1) * 100)}% Attack Speed`,
  dashCooldownMult:   v => v < 1 ? `+${Math.round((1 - v) * 100)}% Dash Speed` : `-${Math.round((v - 1) * 100)}% Dash Speed`,
  damageTakenMult:    v => `-${Math.round((1 - v) * 100)}% Damage Taken`,
};

function EffectRow({ effectKey, value }: { effectKey: string; value: number }) {
  const label = EFFECT_LABELS[effectKey]?.(value) ?? `${effectKey}: ${value}`;
  const isPositive = !label.startsWith('-');
  return (
    <div className="flex items-center gap-1.5 text-[11px]" style={{ color: isPositive ? '#3dba6f' : '#d44040' }}>
      <span style={{ fontSize: 9 }}>{isPositive ? '▲' : '▼'}</span>
      <span>{label}</span>
    </div>
  );
}

export default function DisciplineSelection({ school, onConfirm, unlockedDisciplineIds, runsWithSchool = 0, preSelected, onClose }: DisciplineSelectionProps) {
  const [selected, setSelected] = useState<Discipline[]>(preSelected ?? []);
  const disciplines = DISCIPLINES[school.id] ?? [];
  const allUnlocked = !unlockedDisciplineIds;

  const toggle = (disc: Discipline) => {
    setSelected(prev => {
      if (prev.find(d => d.id === disc.id)) return prev.filter(d => d.id !== disc.id);
      if (prev.length >= MAX_SLOTS) return prev;
      return [...prev, disc];
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-auto overflow-y-auto"
      style={{ background: '#0a0a0f' }}
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(40,20,80,0.1) 0%, transparent 60%)' }} />

      {/* Title */}
      <motion.div
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
        className="text-center mb-6 z-10 flex-shrink-0 pt-6"
      >
        <p className={`text-[10px] uppercase tracking-[0.4em] mb-1 ${school.uiColor}`}>{school.icon} {school.name}</p>
        <h1 className="font-display text-4xl font-bold tracking-wider" style={{ color: '#e8e6e3' }}>Choose 2 Disciplines</h1>
        <p className="text-sm mt-2" style={{ color: '#8a8478' }}>Disciplines refine your school into a specialized fighting style</p>
      </motion.div>

      {/* Slot indicators */}
      <div className="flex gap-4 mb-6 z-10 flex-shrink-0">
        {[0, 1].map(i => (
          <div key={i} className="w-44 h-11 rounded-xl flex items-center justify-center text-sm transition-all duration-200"
            style={{
              border: selected[i] ? `1px solid #92600a` : '1px dashed #2a2a3d',
              background: selected[i] ? 'rgba(138,109,43,0.12)' : 'rgba(10,10,20,0.6)',
            }}
          >
            {selected[i]
              ? <span className="text-sm font-medium" style={{ color: '#d4a843' }}>{selected[i].icon} {selected[i].name}</span>
              : <span className="text-xs uppercase tracking-wider" style={{ color: '#5c574e' }}>Slot {i + 1}</span>
            }
          </div>
        ))}
      </div>

      {/* Discipline cards */}
      <div className="flex gap-5 z-10 mb-6 flex-shrink-0 px-6">
        {disciplines.map((disc, i) => {
          const isSelected = !!selected.find(d => d.id === disc.id);
          const isFull = selected.length >= MAX_SLOTS && !isSelected;
          const locked = !allUnlocked && !unlockedDisciplineIds!.includes(disc.id);
          const unlockCond = locked ? getDisciplineUnlockCondition(i as 0|1|2, school.id) : null;
          return (
            <motion.div
              key={disc.id}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: locked ? 0.45 : isFull ? 0.4 : 1 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              whileHover={!isFull && !locked ? { y: -5, scale: 1.02 } : {}}
              onClick={() => !isFull && !locked && toggle(disc)}
              className="relative w-72 rounded-2xl flex flex-col overflow-hidden"
              style={{
                maxHeight: 420,
                background: 'linear-gradient(135deg, rgba(26,26,40,0.97) 0%, rgba(14,14,22,0.99) 100%)',
                border: `1px solid ${isSelected ? '#92600a' : '#2a2a3d'}`,
                boxShadow: isSelected ? '0 8px 28px rgba(245,158,11,0.12)' : '0 4px 16px rgba(0,0,0,0.4)',
                cursor: locked || isFull ? 'not-allowed' : 'pointer',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            >
              {locked && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none rounded-2xl" style={{ background: 'rgba(6,6,11,0.72)', backdropFilter: 'blur(1px)' }}>
                  <span style={{ fontSize: 22, marginBottom: 6 }}>🔒</span>
                  <span className="text-xs text-center" style={{ color: '#8a8478', maxWidth: 180 }}>{unlockCond}</span>
                  {runsWithSchool > 0 && i === 0 && runsWithSchool < 3 && (
                    <span className="text-[10px] mt-1" style={{ color: '#8a6d2b' }}>{runsWithSchool}/3 {school.name} runs</span>
                  )}
                </div>
              )}
              {/* Gold shimmer top edge */}
              <div style={{ height: 1, flexShrink: 0, background: 'linear-gradient(90deg, transparent, #92600a, transparent)' }} />

              {/* Header — flex-shrink-0 */}
              <div className="p-5 pb-3 flex-shrink-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-2xl mb-1">{disc.icon}</div>
                    <h3 className="font-display text-lg font-bold tracking-wide" style={{ color: '#e8e6e3' }}>{disc.name}</h3>
                    <p className={`text-[11px] ${school.uiColor} italic`}>{disc.tagline}</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                      style={{ background: '#92600a', border: '1px solid #d4a843' }}>
                      <span className="text-xs font-bold" style={{ color: '#fbbf24' }}>✓</span>
                    </div>
                  )}
                </div>
                <p className="text-xs mt-2.5 leading-relaxed" style={{ color: '#8a8478' }}>{disc.description}</p>
              </div>

              <div style={{ height: 1, flexShrink: 0, margin: '0 20px', background: 'linear-gradient(90deg, transparent, rgba(138,109,43,0.35), transparent)' }} />

              {/* Effects — flex-1 overflow-y-auto min-h-0 */}
              <div className="px-5 py-3 flex-1 min-h-0 overflow-y-auto">
                <p className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: '#5c574e' }}>Effects</p>
                <div className="space-y-1.5">
                  {Object.entries(disc.effects).map(([key, val]) => (
                    <EffectRow key={key} effectKey={key} value={val as number} />
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="flex gap-4 z-10 pb-7 flex-shrink-0">
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          onClick={() => onClose ? onClose() : onConfirm([])}
          className="px-6 py-3 rounded-xl text-sm font-medium uppercase tracking-wider transition-all"
          style={{ border: '1px solid #2a2a3d', color: '#8a8478', background: 'transparent' }}
        >
          {onClose ? 'Cancel' : 'Skip'}
        </motion.button>
        <motion.button
          whileHover={selected.length > 0 ? { scale: 1.04 } : {}}
          whileTap={selected.length > 0 ? { scale: 0.97 } : {}}
          onClick={() => selected.length > 0 && onConfirm(selected)}
          className="px-10 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all"
          style={selected.length > 0
            ? { background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.08))', border: '1px solid #92600a', color: '#fbbf24' }
            : { background: 'rgba(30,30,40,0.6)', border: '1px solid #2a2a3d', color: '#5c574e', cursor: 'not-allowed' }
          }
        >
          {selected.length === 0
            ? 'Select at least 1'
            : `Confirm ${selected.length} Discipline${selected.length > 1 ? 's' : ''} →`}
        </motion.button>
      </div>
    </motion.div>
  );
}
