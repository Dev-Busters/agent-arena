'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { SchoolId, SchoolConfig, SCHOOLS } from './schools';
import { SCHOOL_UNLOCK_CONDITIONS } from '@/stores/agentLoadout';

interface SchoolSelectionProps {
  onSelect: (school: SchoolConfig) => void;
  /** IDs of unlocked schools. If undefined, all schools are unlocked (legacy/arena use). */
  unlockedSchoolIds?: string[];
  /** Called when overlay is closed without selection (War Room modal) */
  onClose?: () => void;
}

// Renamed per Visual Design Bible: Vitality/Might/Agility/Crit
const STAT_ROWS = [
  { label: 'VITALITY', key: 'hp',   getValue: (s: SchoolConfig) => 100 + s.stats.hpBonus,                       max: 130, suffix: '',  color: '#3dba6f' },
  { label: 'MIGHT',    key: 'dmg',  getValue: (s: SchoolConfig) => Math.round(s.stats.damageMultiplier * 100), max: 130, suffix: '%', color: '#e8722a' },
  { label: 'AGILITY',  key: 'spd',  getValue: (s: SchoolConfig) => Math.round(s.stats.speedMultiplier * 100),  max: 125, suffix: '%', color: '#4da8da' },
  { label: 'CRIT',     key: 'crit', getValue: (s: SchoolConfig) => 10 + s.stats.critBonus,                      max: 25,  suffix: '%', color: '#d4a843' },
];

// Per Visual Design Bible: school inner glow colors (thematic, not sprite colors)
const SCHOOL_GLOW: Record<string, string> = {
  vanguard: 'rgba(232,114,42,0.18)',  // fire orange — frontline warrior warmth
  invoker:  'rgba(155,93,229,0.15)',  // arcane purple — magical energy
  phantom:  'rgba(61,186,111,0.12)',  // venom green — shadow/stealth
};

function Keycap({ k }: { k: string }) {
  return (
    <span style={{
      display: 'inline-flex', width: 22, height: 22, alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(180deg, #3a3a4a 0%, #2a2a3a 100%)',
      border: '1px solid #4a4a5a', borderRadius: 4, flexShrink: 0,
      fontFamily: 'monospace', fontWeight: 'bold', fontSize: 11,
      color: '#fbbf24', boxShadow: '0 2px 0 #1a1a2a',
    }}>{k}</span>
  );
}

function GoldLine() {
  return <div style={{ height: 1, flexShrink: 0, background: 'linear-gradient(90deg, transparent, rgba(138,109,43,0.45), transparent)' }} />;
}

export default function SchoolSelection({ onSelect, unlockedSchoolIds, onClose }: SchoolSelectionProps) {
  const [hovered, setHovered] = useState<SchoolId | null>(null);
  const schools = Object.values(SCHOOLS);
  const allUnlocked = !unlockedSchoolIds;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center pointer-events-auto overflow-y-auto"
      style={{ background: '#0a0a0f' }}
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(80,40,120,0.07) 0%, transparent 60%)' }} />

      {/* Title — Cinzel display font */}
      <motion.div
        initial={{ y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
        className="text-center mb-7 z-10 pt-6 flex-shrink-0"
      >
        <p className="text-[10px] uppercase tracking-[0.45em] mb-2" style={{ color: '#8a6d2b' }}>⚔ Entering The Crucible</p>
        <h1 className="font-display text-4xl font-bold tracking-wider" style={{ color: '#e8e6e3' }}>
          Choose Your Combat School
        </h1>
        <p className="text-sm mt-2" style={{ color: '#8a8478' }}>Your school defines your agent's fighting style</p>
      </motion.div>

      {/* Cards */}
      <div className="flex gap-5 z-10 px-6 pb-8 flex-shrink-0">
        {schools.map((school, i) => {
          const locked = !allUnlocked && !unlockedSchoolIds!.includes(school.id);
          return (
            <SchoolCard key={school.id} school={school} index={i}
              isHovered={hovered === school.id} locked={locked}
              onHover={setHovered} onSelect={locked ? () => {} : onSelect}
            />
          );
        })}
      </div>
      {onClose && (
        <button onClick={onClose} style={{ color: '#5c574e', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
          ✕ Cancel
        </button>
      )}
    </motion.div>
  );
}

function SchoolCard({ school, index, isHovered, onHover, onSelect, locked = false }: {
  school: SchoolConfig; index: number; isHovered: boolean; locked?: boolean;
  onHover: (id: SchoolId | null) => void; onSelect: (s: SchoolConfig) => void;
}) {
  const glow = SCHOOL_GLOW[school.id] ?? 'rgba(100,100,150,0.1)';

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: locked ? 0.5 : 1 }}
      transition={{ delay: 0.3 + index * 0.1, duration: 0.45 }}
      whileHover={!locked ? { y: -6, scale: 1.02 } : {}}
      onHoverStart={() => !locked && onHover(school.id)} onHoverEnd={() => onHover(null)}
      onClick={() => onSelect(school)}
      className="relative w-72 rounded-2xl flex flex-col overflow-hidden"
      style={{
        maxHeight: 530,
        background: 'linear-gradient(135deg, rgba(26,26,40,0.97) 0%, rgba(14,14,22,0.99) 100%)',
        border: `1px solid ${locked ? '#1a1a2a' : isHovered ? '#92600a' : '#2a2a3d'}`,
        boxShadow: isHovered && !locked ? '0 8px 32px rgba(245,158,11,0.12)' : '0 4px 20px rgba(0,0,0,0.5)',
        cursor: locked ? 'not-allowed' : 'pointer',
        transition: 'border-color 0.25s, box-shadow 0.25s',
      }}
    >
      {/* Lock overlay */}
      {locked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none rounded-2xl"
          style={{ background: 'rgba(6,6,11,0.65)', backdropFilter: 'blur(1px)' }}>
          <span style={{ fontSize: 28, marginBottom: 8 }}>🔒</span>
          <span className="text-xs text-center font-medium" style={{ color: '#8a8478', maxWidth: 160 }}>
            {SCHOOL_UNLOCK_CONDITIONS[school.id]?.label ?? 'Locked'}
          </span>
        </div>
      )}
      {/* Gold shimmer top edge */}
      <div style={{ height: 1, flexShrink: 0, background: 'linear-gradient(90deg, transparent, #92600a, transparent)' }} />

      {/* Header — school name, tagline, description */}
      <div className="p-5 pb-3 flex-shrink-0 relative">
        {/* School-specific inner glow at top */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% -10%, ${glow} 0%, transparent 70%)` }} />
        <div className="text-3xl mb-2 relative">{school.icon}</div>
        <h2 className="font-display text-xl font-bold tracking-wide relative" style={{ color: '#e8e6e3' }}>{school.name}</h2>
        <p className={`text-xs ${school.uiColor} italic mt-0.5 relative`}>{school.tagline}</p>
        <p className="text-xs mt-2 leading-relaxed relative" style={{ color: '#8a8478' }}>{school.description}</p>
      </div>

      <GoldLine />

      {/* Stats — VITALITY / MIGHT / AGILITY / CRIT */}
      <div className="px-5 py-3 flex-shrink-0">
        <p className="text-[10px] uppercase tracking-[0.3em] mb-2.5" style={{ color: '#5c574e' }}>Stats</p>
        {STAT_ROWS.map(row => {
          const val = row.getValue(school);
          const pct = Math.min(100, (val / row.max) * 100);
          return (
            <div key={row.key} className="mb-2">
              <div className="flex justify-between text-[10px] mb-1">
                <span className="uppercase tracking-wider" style={{ color: '#8a8478' }}>{row.label}</span>
                <span className="font-mono" style={{ color: '#d4a843' }}>{val}{row.suffix}</span>
              </div>
              <div className="relative rounded-full overflow-hidden" style={{ height: 5, background: 'rgba(0,0,0,0.55)', border: '1px solid #2a2a3d' }}>
                <motion.div className="h-full rounded-full" style={{ background: row.color }}
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
                />
                <div className="absolute inset-x-0 top-0 rounded-full" style={{ height: 2, background: 'linear-gradient(to bottom, rgba(255,255,255,0.18), transparent)' }} />
              </div>
            </div>
          );
        })}
      </div>

      <GoldLine />

      {/* Abilities — flex-1 min-h-0 overflow-y-auto so it scrolls if card is too tall */}
      <div className="px-5 py-3 flex-1 min-h-0 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-[0.3em] mb-2.5" style={{ color: '#5c574e' }}>Abilities</p>
        {Object.values(school.abilities).map(ability => (
          <div key={ability.key} className="flex gap-2 mb-2 items-start">
            <Keycap k={ability.key} />
            <div>
              <span className="text-xs font-semibold" style={{ color: '#d4cfc5' }}>{ability.name}</span>
              <span className="text-xs" style={{ color: '#8a8478' }}> — {ability.description}</span>
            </div>
          </div>
        ))}
      </div>

      {/* SELECT button — pinned at bottom */}
      <motion.div
        animate={{ opacity: isHovered ? 1 : 0.6 }}
        className="text-center py-2.5 text-xs font-bold uppercase tracking-[0.14em] flex-shrink-0"
        style={{
          background: isHovered ? 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.06))' : 'transparent',
          borderTop: `1px solid ${isHovered ? '#92600a' : '#2a2a3d'}`,
          color: isHovered ? '#fbbf24' : '#8a8478',
          transition: 'all 0.2s',
        }}
      >
        SELECT
      </motion.div>
    </motion.div>
  );
}
