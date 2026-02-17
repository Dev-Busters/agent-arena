'use client';

import { motion } from 'framer-motion';
import { Modifier, ModifierCategory } from './Modifier';

interface ModifierSelectionProps {
  modifiers: Modifier[];
  onSelect: (modifier: Modifier) => void;
}

// Category configs — accent color + icon + label
const CATEGORY_CONFIG: Record<ModifierCategory, { color: string; rgb: string; icon: string; label: string }> = {
  amplifier:  { color: '#e8722a', rgb: '232,114,42',  icon: '⚔️', label: 'AMPLIFIER'  },
  trigger:    { color: '#9b5de5', rgb: '155,93,229',  icon: '⚡', label: 'TRIGGER'    },
  transmuter: { color: '#4da8da', rgb: '77,168,218',  icon: '🔮', label: 'TRANSMUTER' },
};

// Rarity border, label color, shimmer class
const RARITY_CONFIG: Record<string, { border: string; label: string; labelColor: string; shimmer?: string }> = {
  common:  { border: '#2a2a3d',          label: 'COMMON',  labelColor: '#8a8478' },
  rare:    { border: '#4da8da',          label: 'RARE',    labelColor: '#4da8da', shimmer: 'shimmer-card-rare' },
  epic:    { border: '#9b5de5',          label: 'EPIC',    labelColor: '#9b5de5', shimmer: 'shimmer-card-epic' },
  boss:    { border: '#e8722a',          label: 'BOSS',    labelColor: '#e8722a', shimmer: 'shimmer-card-epic' },
};

export default function ModifierSelection({ modifiers, onSelect }: ModifierSelectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto"
      style={{ background: 'rgba(10,10,15,0.96)' }}
    >
      <div className="text-center">
        {/* Title */}
        <motion.div
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <p className="text-[10px] uppercase tracking-[0.45em] mb-2" style={{ color: '#8a6d2b' }}>Room Cleared</p>
          <h2 className="font-display text-4xl font-bold tracking-wider" style={{
            background: 'linear-gradient(135deg, #d4a843, #f0c654, #d4a843)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>
            Choose Your Modifier
          </h2>
          <p className="text-sm mt-2" style={{ color: '#8a8478' }}>Select one to enhance your agent</p>
        </motion.div>

        {/* Cards */}
        <div className="flex gap-5 justify-center">
          {modifiers.map((mod, index) => {
            const cat = CATEGORY_CONFIG[mod.category] ?? CATEGORY_CONFIG.amplifier;
            const rar = RARITY_CONFIG[mod.rarity] ?? RARITY_CONFIG.common;
            return (
              <motion.button
                key={mod.id}
                initial={{ scale: 0.85, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1, type: 'spring', stiffness: 280, damping: 22 }}
                whileHover={{ scale: 1.04, y: -8 }}
                onClick={() => onSelect(mod)}
                className="relative w-64 rounded-2xl flex flex-col overflow-hidden text-left cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, rgba(22,22,34,0.98) 0%, rgba(12,12,20,0.99) 100%)',
                  border: `1px solid ${rar.border}`,
                  boxShadow: mod.rarity !== 'common'
                    ? `0 0 20px rgba(${cat.rgb},0.12), 0 8px 32px rgba(0,0,0,0.5)`
                    : '0 4px 20px rgba(0,0,0,0.5)',
                  minHeight: 300,
                }}
              >
                {/* Gold shimmer top edge */}
                <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #92600a, transparent)', flexShrink: 0 }} />

                {/* Shimmer overlay for rare/epic */}
                {rar.shimmer && (
                  <div className={`absolute inset-0 pointer-events-none ${rar.shimmer}`} />
                )}

                {/* Rarity badge — top right */}
                <div className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                  style={{
                    color: rar.labelColor,
                    background: `rgba(${rar.labelColor.replace('#', '').match(/.{2}/g)?.map(h => parseInt(h, 16)).join(',') ?? '138,132,120'},0.12)`,
                    border: `1px solid ${rar.labelColor}40`,
                  }}
                >
                  {rar.label}
                </div>

                {/* Category accent — subtle gradient fading down, not solid band */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '35%', pointerEvents: 'none',
                  background: `linear-gradient(to bottom, rgba(${cat.rgb},0.18) 0%, transparent 100%)`,
                }} />

                {/* Icon + category label */}
                <div className="px-5 pt-5 pb-3 flex-shrink-0 relative">
                  <div className="flex items-center gap-3 mb-1">
                    <span style={{ fontSize: 28, filter: `drop-shadow(0 0 8px rgba(${cat.rgb},0.6))` }}>
                      {cat.icon}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold" style={{ color: cat.color }}>
                      {cat.label}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-bold tracking-wide" style={{ color: '#e8e6e3' }}>{mod.name}</h3>
                </div>

                <div style={{ height: 1, margin: '0 20px', background: 'linear-gradient(90deg, transparent, rgba(138,109,43,0.3), transparent)', flexShrink: 0 }} />

                {/* Description */}
                <div className="px-5 py-3 flex-1">
                  <p className="text-sm leading-relaxed" style={{ color: '#d4cfc5' }}>{mod.description}</p>
                  {mod.stackable && (
                    <div className="mt-3 flex items-center gap-1.5 text-[11px]" style={{ color: '#4da8da' }}>
                      <span>⬆</span>
                      <span>Stackable — max {mod.maxStacks ?? 1}</span>
                    </div>
                  )}
                </div>

                {/* SELECT footer */}
                <div className="text-center py-2.5 text-xs font-bold uppercase tracking-[0.14em] flex-shrink-0"
                  style={{
                    borderTop: '1px solid #2a2a3d',
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.06), rgba(245,158,11,0.02))',
                    color: '#8a6d2b',
                  }}
                >
                  SELECT
                </div>
              </motion.button>
            );
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="mt-5 text-xs" style={{ color: '#5c574e' }}
        >
          Click a card to claim this modifier
        </motion.p>
      </div>
    </motion.div>
  );
}
