'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Discipline, DISCIPLINES } from './disciplines';
import { SchoolConfig } from './schools';

interface DisciplineSelectionProps {
  school: SchoolConfig;
  onConfirm: (disciplines: Discipline[]) => void;
}

const MAX_SLOTS = 2;

export default function DisciplineSelection({ school, onConfirm }: DisciplineSelectionProps) {
  const [selected, setSelected] = useState<Discipline[]>([]);
  const disciplines = DISCIPLINES[school.id] ?? [];

  const toggle = (disc: Discipline) => {
    setSelected(prev => {
      if (prev.find(d => d.id === disc.id)) return prev.filter(d => d.id !== disc.id);
      if (prev.length >= MAX_SLOTS) return prev;
      return [...prev, disc];
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      // fixed + z-[100] covers the HUD which is a sibling of ArenaCanvas in page.tsx
      className="fixed inset-0 bg-slate-950 z-[100] flex flex-col items-center justify-center pointer-events-auto overflow-y-auto"
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(40,20,80,0.2) 0%, transparent 70%)' }}
      />

      {/* Title */}
      <motion.div
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
        className="text-center mb-6 z-10 flex-shrink-0 pt-6"
      >
        <p className={`text-xs uppercase tracking-[0.4em] mb-1 ${school.uiColor}`}>
          {school.icon} {school.name}
        </p>
        <h1 className="text-4xl font-black text-white">Choose 2 Disciplines</h1>
        <p className="text-slate-500 text-sm mt-2">
          Disciplines refine your school into a specialized fighting style
        </p>
      </motion.div>

      {/* Slot indicators */}
      <div className="flex gap-4 mb-6 z-10 flex-shrink-0">
        {[0, 1].map(i => (
          <div key={i}
            className={`w-40 h-12 rounded-xl border-2 flex items-center justify-center text-sm transition-all duration-200
              ${selected[i]
                ? `${school.borderColor} bg-slate-800/80`
                : 'border-slate-700 border-dashed bg-slate-900/40'
              }`}
          >
            {selected[i] ? (
              <span className="text-white font-medium">
                {selected[i].icon} {selected[i].name}
              </span>
            ) : (
              <span className="text-slate-600 text-xs uppercase tracking-wider">Slot {i + 1}</span>
            )}
          </div>
        ))}
      </div>

      {/* Discipline cards */}
      <div className="flex gap-5 z-10 mb-6 flex-shrink-0 px-6">
        {disciplines.map((disc, i) => {
          const isSelected = !!selected.find(d => d.id === disc.id);
          const isFull = selected.length >= MAX_SLOTS && !isSelected;

          return (
            <motion.div
              key={disc.id}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: isFull ? 0.45 : 1 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              whileHover={!isFull ? { y: -6, scale: 1.02 } : {}}
              onClick={() => !isFull && toggle(disc)}
              // max-h + overflow-y-auto: effects section scrolls if too tall
              className={`w-72 rounded-2xl border-2 p-5 flex flex-col max-h-[380px] overflow-y-auto
                bg-gradient-to-b ${school.gradient} transition-all duration-200
                ${isSelected ? `${school.borderColor} shadow-lg shadow-black/40` : 'border-slate-700'}
                ${isFull ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3 flex-shrink-0">
                <div>
                  <div className="text-2xl mb-1">{disc.icon}</div>
                  <h3 className="text-lg font-bold text-white">{disc.name}</h3>
                  <p className={`text-xs ${school.uiColor} font-medium`}>{disc.tagline}</p>
                </div>
                {isSelected && (
                  <div className={`w-6 h-6 rounded-full ${school.borderColor.replace('border-', 'bg-')}
                    flex items-center justify-center flex-shrink-0 mt-1`}>
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                )}
              </div>

              <p className="text-slate-400 text-xs leading-relaxed mb-3 flex-shrink-0">{disc.description}</p>

              {/* Effects */}
              <div className="mt-auto space-y-1 flex-shrink-0">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">Effects</div>
                {Object.entries(disc.effects).map(([key, val]) => (
                  <EffectRow key={key} effectKey={key} value={val as number} uiColor={school.uiColor} />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="flex gap-4 z-10 pb-6 flex-shrink-0">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onConfirm([])}
          className="px-6 py-3 rounded-xl border border-slate-700 text-slate-400 text-sm hover:border-slate-500 transition-colors"
        >
          Skip (no disciplines)
        </motion.button>
        <motion.button
          whileHover={selected.length > 0 ? { scale: 1.05 } : {}}
          whileTap={selected.length > 0 ? { scale: 0.97 } : {}}
          onClick={() => selected.length > 0 && onConfirm(selected)}
          className={`px-10 py-3 rounded-xl font-bold text-sm transition-all duration-200
            ${selected.length > 0
              ? `bg-gradient-to-r from-purple-600 to-purple-800 text-white shadow-lg`
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
            }`}
        >
          {selected.length === 0
            ? 'Select at least 1'
            : `Enter Dungeon with ${selected.length} Discipline${selected.length > 1 ? 's' : ''} →`}
        </motion.button>
      </div>
    </motion.div>
  );
}

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

function EffectRow({ effectKey, value, uiColor }: { effectKey: string; value: number; uiColor: string }) {
  const label = EFFECT_LABELS[effectKey]?.(value) ?? `${effectKey}: ${value}`;
  const isPositive = !label.startsWith('-');
  return (
    <div className={`text-xs flex items-center gap-1.5 ${isPositive ? uiColor : 'text-red-400'}`}>
      <span>{isPositive ? '▲' : '▼'}</span>
      <span>{label}</span>
    </div>
  );
}
