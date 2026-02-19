'use client';
import { motion } from 'framer-motion';
import { DoctrineAbility, DOCTRINE_COLORS } from './doctrineAbilities';

interface AbilityUnlockModalProps {
  doctrine: 'iron' | 'arc' | 'edge';
  level: number;
  options: [DoctrineAbility, DoctrineAbility];
  onUnlock: (abilityId: string) => void;
  onDismiss: () => void;
}

const DOCTRINE_NAMES = { iron: 'Iron', arc: 'Arc', edge: 'Edge' };

export default function AbilityUnlockModal({ doctrine, level, options, onUnlock, onDismiss }: AbilityUnlockModalProps) {
  const color = DOCTRINE_COLORS[doctrine];
  const name = DOCTRINE_NAMES[doctrine];

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/80" />
      <motion.div
        className="relative z-10 rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, rgba(16,14,22,0.99) 0%, rgba(10,10,18,0.99) 100%)',
          border: `1px solid ${color}44`,
          boxShadow: `0 0 60px ${color}22`,
          width: 520,
          maxWidth: 'calc(100% - 32px)',
        }}
        initial={{ scale: 0.85, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      >
        <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
        <div style={{ padding: '24px 28px' }}>
          {/* Header */}
          <div className="text-center mb-6">
            <div className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: `${color}cc` }}>
              {name} Doctrine — Level {level}
            </div>
            <h2 className="font-display text-2xl font-bold" style={{ color: '#f5f0e8' }}>
              New Ability Unlocked
            </h2>
            <p className="text-sm mt-1" style={{ color: '#8a8478' }}>Choose one ability to unlock</p>
          </div>

          {/* Two ability cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {options.map((ability) => (
              <motion.button
                key={ability.id}
                onClick={() => onUnlock(ability.id)}
                whileHover={{ scale: 1.03, boxShadow: `0 0 20px ${color}33` }}
                whileTap={{ scale: 0.97 }}
                className="relative text-left rounded-xl p-4 overflow-hidden"
                style={{
                  background: `rgba(${hexToRgb(color)}, 0.06)`,
                  border: `1px solid ${color}44`,
                  cursor: 'pointer',
                }}
              >
                {/* Doctrine color left border */}
                <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl" style={{ background: color }} />

                <div className="text-3xl mb-3">{ability.icon}</div>
                <div className="font-bold text-sm mb-1" style={{ color: '#f5f0e8' }}>{ability.name}</div>
                <div className="text-xs leading-relaxed mb-3" style={{ color: '#8a8478' }}>{ability.description}</div>

                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono" style={{ color: `${color}cc` }}>
                    {(ability.cooldownMs / 1000).toFixed(0)}s cooldown
                  </div>
                  <div className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: `${color}22`, color }}>
                    {ability.suggestedSlot}
                  </div>
                </div>

                <motion.div
                  className="absolute inset-0 rounded-xl opacity-0"
                  style={{ background: `radial-gradient(ellipse at center, ${color}20 0%, transparent 70%)` }}
                  whileHover={{ opacity: 1 }}
                />
              </motion.button>
            ))}
          </div>

          <button
            onClick={onDismiss}
            className="w-full text-center text-xs py-2 rounded-lg transition-colors"
            style={{ color: '#5c574e', background: 'rgba(255,255,255,0.02)', border: '1px solid #2a2a3d' }}
          >
            Decide later
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}
