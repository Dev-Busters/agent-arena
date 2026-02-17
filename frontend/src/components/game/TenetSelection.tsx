'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tenet, TENETS } from './tenets';

interface TenetSelectionProps {
  onConfirm: (tenets: Tenet[]) => void;
}

const MAX_SLOTS = 4;

export default function TenetSelection({ onConfirm }: TenetSelectionProps) {
  const [selected, setSelected] = useState<Tenet[]>([]);

  const toggle = (tenet: Tenet) => {
    setSelected(prev => {
      if (prev.find(t => t.id === tenet.id)) return prev.filter(t => t.id !== tenet.id);
      if (prev.length >= MAX_SLOTS) return prev;
      return [...prev, tenet];
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      className="absolute inset-0 bg-slate-950/98 z-50 flex flex-col items-center justify-center pointer-events-auto"
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(20,60,40,0.15) 0%, transparent 70%)' }}
      />

      {/* Title */}
      <motion.div
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
        className="text-center mb-6 z-10"
      >
        <p className="text-xs uppercase tracking-[0.4em] mb-1 text-yellow-500">⚖️ Doctrine</p>
        <h1 className="text-4xl font-black text-white">Equip Your Tenets</h1>
        <p className="text-slate-500 text-sm mt-2">Tenets shape your agent's instincts. Choose up to 4.</p>
      </motion.div>

      {/* Slot indicators */}
      <div className="flex gap-3 mb-6 z-10">
        {[0, 1, 2, 3].map(i => (
          <div key={i}
            className={`w-32 h-10 rounded-lg border flex items-center justify-center text-xs transition-all duration-200
              ${selected[i]
                ? 'border-yellow-500/60 bg-yellow-950/40 text-white'
                : 'border-slate-700 border-dashed text-slate-600'
              }`}
          >
            {selected[i]
              ? <span>{selected[i].icon} {selected[i].name}</span>
              : <span className="uppercase tracking-wider">Slot {i + 1}</span>
            }
          </div>
        ))}
      </div>

      {/* Tenet grid — 4 columns × 2 rows */}
      <div className="grid grid-cols-4 gap-4 z-10 mb-6 px-8">
        {TENETS.map((tenet, i) => {
          const isSelected = !!selected.find(t => t.id === tenet.id);
          const isFull = selected.length >= MAX_SLOTS && !isSelected;

          return (
            <motion.div
              key={tenet.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: isFull ? 0.4 : 1 }}
              transition={{ delay: 0.2 + i * 0.04 }}
              whileHover={!isFull ? { y: -4, scale: 1.02 } : {}}
              onClick={() => !isFull && toggle(tenet)}
              className={`rounded-xl border p-4 flex flex-col cursor-pointer transition-all duration-150
                ${isSelected
                  ? 'border-yellow-500 bg-yellow-950/30 shadow-md shadow-yellow-900/30'
                  : isFull
                    ? 'border-slate-800 bg-slate-900/40 cursor-not-allowed'
                    : 'border-slate-700 bg-slate-900/60 hover:border-slate-500'
                }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{tenet.icon}</span>
                {isSelected && <span className="text-yellow-400 text-xs font-bold">✓</span>}
              </div>
              <h3 className="text-sm font-bold text-white mb-0.5">{tenet.name}</h3>
              <p className="text-yellow-500/70 text-[10px] mb-2">{tenet.tagline}</p>
              <p className="text-slate-500 text-[10px] leading-relaxed flex-1">{tenet.description}</p>

              {/* Effects */}
              <div className="mt-2 space-y-0.5">
                {Object.entries(tenet.effects)
                  .filter(([k]) => k !== 'targeting' && k !== 'berserker' && k !== 'executioner')
                  .map(([key, val]) => (
                    <TenetEffectLine key={key} effectKey={key} value={val as number} />
                  ))}
                {tenet.effects.targeting && (
                  <div className="text-[10px] text-cyan-400">▶ Target: {tenet.effects.targeting.replace('-', ' ')}</div>
                )}
                {tenet.effects.berserker && (
                  <div className="text-[10px] text-orange-400">▶ Damage scales with missing HP</div>
                )}
                {tenet.effects.executioner && (
                  <div className="text-[10px] text-red-400">▶ +50% dmg vs &lt;30% HP enemies</div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="flex gap-4 z-10">
        <motion.button
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          onClick={() => onConfirm([])}
          className="px-6 py-3 rounded-xl border border-slate-700 text-slate-400 text-sm hover:border-slate-500 transition-colors"
        >
          Skip tenets
        </motion.button>
        <motion.button
          whileHover={selected.length > 0 ? { scale: 1.04 } : {}}
          whileTap={selected.length > 0 ? { scale: 0.97 } : {}}
          onClick={() => selected.length > 0 && onConfirm(selected)}
          className={`px-10 py-3 rounded-xl font-bold text-sm transition-all duration-200
            ${selected.length > 0
              ? 'bg-gradient-to-r from-yellow-600 to-amber-700 text-white shadow-lg'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
        >
          {selected.length === 0
            ? 'Select a tenet'
            : `Enter Crucible (${selected.length} tenet${selected.length > 1 ? 's' : ''}) →`}
        </motion.button>
      </div>
    </motion.div>
  );
}

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

function TenetEffectLine({ effectKey, value }: { effectKey: string; value: number }) {
  const label = STAT_LABELS[effectKey]?.(value) ?? `${effectKey}: ${value}`;
  const isNeg = label.startsWith('-') || (effectKey === 'hpMult' && value < 1) || (effectKey === 'damageTakenMult' && value > 1);
  return (
    <div className={`text-[10px] ${isNeg ? 'text-red-400' : 'text-green-400'}`}>
      {isNeg ? '▼' : '▲'} {label}
    </div>
  );
}
