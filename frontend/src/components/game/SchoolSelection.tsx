'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SchoolId, SchoolConfig, SCHOOLS } from './schools';

interface SchoolSelectionProps {
  onSelect: (school: SchoolConfig) => void;
}

const STAT_ROWS = [
  { label: 'Health',   getValue: (s: SchoolConfig) => 100 + s.stats.hpBonus, suffix: 'HP', max: 130 },
  { label: 'Damage',   getValue: (s: SchoolConfig) => Math.round(s.stats.damageMultiplier * 100), suffix: '%', max: 130 },
  { label: 'Speed',    getValue: (s: SchoolConfig) => Math.round(s.stats.speedMultiplier * 100), suffix: '%', max: 125 },
  { label: 'Crit',     getValue: (s: SchoolConfig) => 10 + s.stats.critBonus, suffix: '%', max: 25 },
];

export default function SchoolSelection({ onSelect }: SchoolSelectionProps) {
  const [hovered, setHovered] = useState<SchoolId | null>(null);
  const schools = Object.values(SCHOOLS);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 bg-slate-950/98 z-50 flex flex-col items-center justify-center pointer-events-auto"
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(80,40,120,0.15) 0%, transparent 70%)' }}
      />

      {/* Title */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-10 z-10"
      >
        <p className="text-slate-500 text-xs uppercase tracking-[0.4em] mb-2">Entering The Crucible</p>
        <h1 className="text-5xl font-black text-white">Choose Your Combat School</h1>
        <p className="text-slate-400 text-sm mt-3">Your school defines your agent's fighting style</p>
      </motion.div>

      {/* School cards */}
      <div className="flex gap-6 z-10 px-8">
        {schools.map((school, i) => (
          <SchoolCard
            key={school.id}
            school={school}
            index={i}
            isHovered={hovered === school.id}
            onHover={setHovered}
            onSelect={onSelect}
          />
        ))}
      </div>
    </motion.div>
  );
}

function SchoolCard({ school, index, isHovered, onHover, onSelect }: {
  school: SchoolConfig;
  index: number;
  isHovered: boolean;
  onHover: (id: SchoolId | null) => void;
  onSelect: (s: SchoolConfig) => void;
}) {
  const stats = STAT_ROWS;

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
      whileHover={{ y: -8, scale: 1.02 }}
      onHoverStart={() => onHover(school.id)}
      onHoverEnd={() => onHover(null)}
      onClick={() => onSelect(school)}
      className={`w-72 rounded-2xl border-2 ${school.borderColor} bg-gradient-to-b ${school.gradient}
        cursor-pointer flex flex-col overflow-hidden
        ${isHovered ? 'shadow-lg shadow-black/50' : ''}
        transition-shadow duration-200`}
    >
      {/* Card header */}
      <div className="p-6 pb-4 border-b border-white/10">
        <div className="text-4xl mb-3">{school.icon}</div>
        <h2 className={`text-2xl font-bold text-white`}>{school.name}</h2>
        <p className={`text-sm ${school.uiColor} font-medium mt-0.5`}>{school.tagline}</p>
        <p className="text-slate-400 text-xs mt-3 leading-relaxed">{school.description}</p>
      </div>

      {/* Stats */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Stats</div>
        {stats.map(row => {
          const val = row.getValue(school);
          const pct = Math.min(100, (val / row.max) * 100);
          return (
            <div key={row.label} className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">{row.label}</span>
                <span className="text-white font-mono">{val}{row.suffix}</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${school.uiColor.replace('text-', 'bg-')}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Abilities */}
      <div className="px-6 py-4 flex-1">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Abilities</div>
        {Object.values(school.abilities).map(ability => (
          <div key={ability.key} className="flex gap-2 mb-2 items-start">
            <span className={`text-xs font-bold font-mono ${school.uiColor} w-4 flex-shrink-0 mt-0.5`}>
              {ability.key}
            </span>
            <div>
              <span className="text-white text-xs font-medium">{ability.name}</span>
              <span className="text-slate-500 text-xs"> — {ability.description}</span>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <motion.div
        animate={{ opacity: isHovered ? 1 : 0.6 }}
        className={`text-center py-3 text-sm font-bold ${school.uiColor} border-t border-white/10`}
      >
        {isHovered ? `Deploy as ${school.name} →` : 'Click to Select'}
      </motion.div>
    </motion.div>
  );
}
