'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tenet, TENETS } from './tenets';
import { TENET_UNLOCK_CONDITIONS } from '@/stores/agentLoadout';

interface TenetSelectionProps {
  onConfirm: (tenets: Tenet[]) => void;
  /** IDs of unlocked tenets. Undefined = all unlocked. */
  unlockedTenetIds?: string[];
  /** Max selectable slots (progressive unlock). Default 4. */
  maxSlots?: number;
  /** Pre-selected tenets for War Room editing */
  preSelected?: Tenet[];
  /** Close without saving (War Room modal) */
  onClose?: () => void;
}

const MAX_SLOTS = 4;

const STAT_LABELS: Record<string, (v: number) => string> = {
  hpBonus:            v => `+${v} Max HP`,
  hpMult:             v => `${Math.round(v * 100)}% Max HP`,
  damageMult:         v => `${v >= 1 ? '+' : ''}${Math.round((v - 1) * 100)}% Damage`,
  speedMult:          v => `${v >= 1 ? '+' : ''}${Math.round((v - 1) * 100)}% Speed`,
  critBonus:          v => `+${v}% Crit`,
  blastRadiusMult:    v => `+${Math.round((v - 1) * 100)}% Blast`,
  attackCooldownMult: v => v < 1 ? `+${Math.round((1 - v) * 100)}% Atk Speed` : `-${Math.round((v - 1) * 100)}% Atk Speed`,
  damageTakenMult:    v => v < 1 ? `-${Math.round((1 - v) * 100)}% Dmg Taken` : `+${Math.round((v - 1) * 100)}% Dmg Taken`,
};

function EffectLine({ effectKey, value }: { effectKey: string; value: number }) {
  const label = STAT_LABELS[effectKey]?.(value) ?? `${effectKey}: ${value}`;
  const isNeg = label.startsWith('-') || (effectKey === 'hpMult' && value < 1) || (effectKey === 'damageTakenMult' && value > 1);
  return (
    <div className="text-[10px]" style={{ color: isNeg ? '#d44040' : '#3dba6f' }}>
      {isNeg ? '▼' : '▲'} {label}
    </div>
  );
}

export default function TenetSelection({ onConfirm, unlockedTenetIds, maxSlots = MAX_SLOTS, preSelected, onClose }: TenetSelectionProps) {
  const [selected, setSelected] = useState<Tenet[]>(preSelected ?? []);
  const allUnlocked = !unlockedTenetIds;
  const effectiveMax = maxSlots;

  const toggle = (tenet: Tenet) => {
    setSelected(prev => {
      if (prev.find(t => t.id === tenet.id)) return prev.filter(t => t.id !== tenet.id);
      if (prev.length >= effectiveMax) return prev;
      return [...prev, tenet];
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-auto overflow-y-auto"
      style={{ background: '#0a0a0f' }}
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(20,60,40,0.08) 0%, transparent 60%)' }} />

      {/* Title */}
      <motion.div
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
        className="text-center mb-5 z-10 flex-shrink-0 pt-6"
      >
        <p className="text-[10px] uppercase tracking-[0.45em] mb-1" style={{ color: '#8a6d2b' }}>⚖️ Doctrine</p>
        <h1 className="font-display text-4xl font-bold tracking-wider" style={{ color: '#e8e6e3' }}>Equip Your Tenets</h1>
        <p className="text-sm mt-2" style={{ color: '#8a8478' }}>Tenets shape your agent's instincts. Choose up to 4.</p>
      </motion.div>

      {/* Slot indicators */}
      <div className="flex gap-3 mb-5 z-10 flex-shrink-0">
        {Array.from({ length: effectiveMax }).map((_, i) => (
          <div key={i} className="w-32 h-10 rounded-lg flex items-center justify-center text-xs transition-all duration-200"
            style={{
              border: selected[i] ? '1px solid #8a6d2b' : '1px dashed #2a2a3d',
              background: selected[i] ? 'rgba(138,109,43,0.1)' : 'rgba(10,10,20,0.5)',
              color: selected[i] ? '#d4a843' : '#5c574e',
            }}
          >
            {selected[i]
              ? <span>{selected[i].icon} {selected[i].name}</span>
              : <span className="uppercase tracking-wider" style={{ fontSize: 10 }}>Slot {i + 1}</span>
            }
          </div>
        ))}
      </div>

      {/* Tenet grid — 4-col, scrollable */}
      <div className="grid grid-cols-4 gap-3 z-10 mb-5 px-8 flex-shrink-0" style={{ maxHeight: 360, overflowY: 'auto' }}>
        {TENETS.map((tenet, i) => {
          const isSelected = !!selected.find(t => t.id === tenet.id);
          const isFull = selected.length >= effectiveMax && !isSelected;
          const locked = !allUnlocked && !unlockedTenetIds!.includes(tenet.id);
          const unlockInfo = locked ? TENET_UNLOCK_CONDITIONS[tenet.id] : null;

          return (
            <motion.div
              key={tenet.id}
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: locked ? 0.4 : isFull ? 0.38 : 1 }}
              transition={{ delay: 0.2 + i * 0.04 }}
              whileHover={!isFull && !locked ? { y: -3, scale: 1.02 } : {}}
              onClick={() => !isFull && !locked && toggle(tenet)}
              className="relative rounded-xl flex flex-col overflow-hidden"
              style={{
                padding: '12px',
                background: 'linear-gradient(135deg, rgba(26,26,40,0.97) 0%, rgba(14,14,22,0.99) 100%)',
                border: isSelected ? '1px solid #8a6d2b' : '1px solid #2a2a3d',
                boxShadow: isSelected ? '0 4px 16px rgba(212,168,67,0.1)' : 'none',
                cursor: locked || isFull ? 'not-allowed' : 'pointer',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            >
              {/* Gold shimmer top */}
              {isSelected && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, #92600a, transparent)' }} />
              )}
              {/* Lock overlay */}
              {locked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none rounded-xl" style={{ background: 'rgba(6,6,11,0.72)' }}>
                  <span style={{ fontSize: 16, marginBottom: 4 }}>🔒</span>
                  <span style={{ color: '#8a8478', fontSize: 9, textAlign: 'center', maxWidth: 100 }}>{unlockInfo?.label}</span>
                </div>
              )}
              <div className="flex items-start justify-between mb-1.5">
                <span style={{ fontSize: 20 }}>{tenet.icon}</span>
                {isSelected && <span style={{ color: '#fbbf24', fontSize: 11, fontWeight: 'bold' }}>✓</span>}
              </div>
              <h3 className="text-sm font-bold mb-0.5" style={{ color: '#e8e6e3' }}>{tenet.name}</h3>
              <p className="mb-1.5" style={{ color: '#8a6d2b', fontSize: 10 }}>{tenet.tagline}</p>
              <p className="leading-relaxed flex-1" style={{ color: '#8a8478', fontSize: 10 }}>{tenet.description}</p>

              <div className="mt-2 space-y-0.5">
                {Object.entries(tenet.effects)
                  .filter(([k]) => k !== 'targeting' && k !== 'berserker' && k !== 'executioner')
                  .map(([key, val]) => (
                    <EffectLine key={key} effectKey={key} value={val as number} />
                  ))}
                {tenet.effects.targeting && (
                  <div style={{ fontSize: 10, color: '#4da8da' }}>▶ Target: {tenet.effects.targeting.replace('-', ' ')}</div>
                )}
                {tenet.effects.berserker && (
                  <div style={{ fontSize: 10, color: '#e8722a' }}>▶ Damage scales with missing HP</div>
                )}
                {tenet.effects.executioner && (
                  <div style={{ fontSize: 10, color: '#d44040' }}>▶ +50% dmg vs &lt;30% HP enemies</div>
                )}
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
          className="px-6 py-3 rounded-xl text-sm font-medium uppercase tracking-wider"
          style={{ border: '1px solid #2a2a3d', color: '#8a8478', background: 'transparent' }}
        >
          {onClose ? 'Cancel' : 'Skip'}
        </motion.button>
        <motion.button
          whileHover={selected.length > 0 ? { scale: 1.04 } : {}}
          whileTap={selected.length > 0 ? { scale: 0.97 } : {}}
          onClick={() => selected.length > 0 && onConfirm(selected)}
          className="px-10 py-3 rounded-xl font-bold text-sm uppercase tracking-wider"
          style={selected.length > 0
            ? { background: 'linear-gradient(135deg, rgba(212,168,67,0.2), rgba(212,168,67,0.06))', border: '1px solid #8a6d2b', color: '#fbbf24' }
            : { background: 'rgba(30,30,40,0.6)', border: '1px solid #2a2a3d', color: '#5c574e', cursor: 'not-allowed' }
          }
        >
          {selected.length === 0
            ? 'Select a Tenet'
            : `Enter Crucible — ${selected.length} Tenet${selected.length > 1 ? 's' : ''} →`}
        </motion.button>
      </div>
    </motion.div>
  );
}
