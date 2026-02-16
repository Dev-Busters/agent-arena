'use client';

import { motion } from 'framer-motion';
import { Modifier, ModifierCategory } from './Modifier';

interface ModifierSelectionProps {
  modifiers: Modifier[];
  onSelect: (modifier: Modifier) => void;
}

/**
 * ModifierSelection - Hades-style modifier choice overlay
 * Shows 3 cards, player picks one
 */
export default function ModifierSelection({ modifiers, onSelect }: ModifierSelectionProps) {
  const getCategoryColor = (category: ModifierCategory): string => {
    switch (category) {
      case 'amplifier': return 'from-red-500 to-orange-500';
      case 'trigger': return 'from-purple-500 to-pink-500';
      case 'transmuter': return 'from-blue-500 to-cyan-500';
      default: return 'from-slate-500 to-slate-600';
    }
  };
  
  const getCategoryIcon = (category: ModifierCategory): string => {
    switch (category) {
      case 'amplifier': return '⚔️';
      case 'trigger': return '⚡';
      case 'transmuter': return '🔮';
      default: return '✨';
    }
  };
  
  const getRarityBorder = (rarity: string): string => {
    switch (rarity) {
      case 'common': return 'border-slate-500';
      case 'rare': return 'border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.5)]';
      case 'epic': return 'border-purple-400 shadow-[0_0_20px_rgba(192,132,252,0.6)]';
      case 'boss': return 'border-orange-400 shadow-[0_0_25px_rgba(251,146,60,0.7)]';
      default: return 'border-slate-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 pointer-events-auto"
    >
      <div className="text-center">
        {/* Title */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-4xl font-bold text-yellow-400 mb-2 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]">
            Choose Your Modifier
          </h2>
          <p className="text-slate-400 text-sm">Select one to enhance your agent</p>
        </motion.div>

        {/* Cards */}
        <div className="flex gap-6 justify-center">
          {modifiers.map((modifier, index) => (
            <motion.button
              key={modifier.id}
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -10 }}
              onClick={() => onSelect(modifier)}
              className={`
                relative w-64 h-80 bg-gradient-to-b from-slate-800 to-slate-900
                border-2 ${getRarityBorder(modifier.rarity)} rounded-lg
                overflow-hidden cursor-pointer transition-all
                hover:border-yellow-400
              `}
            >
              {/* Category gradient header */}
              <div className={`h-16 bg-gradient-to-r ${getCategoryColor(modifier.category)} flex items-center justify-center`}>
                <span className="text-3xl">{getCategoryIcon(modifier.category)}</span>
              </div>
              
              {/* Content */}
              <div className="p-4 text-left">
                {/* Name */}
                <h3 className="text-xl font-bold text-white mb-2">{modifier.name}</h3>
                
                {/* Category badge */}
                <div className="inline-block px-2 py-1 bg-slate-700 rounded text-xs text-slate-300 uppercase mb-3">
                  {modifier.category}
                </div>
                
                {/* Description */}
                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                  {modifier.description}
                </p>
                
                {/* Stackable indicator */}
                {modifier.stackable && (
                  <div className="text-xs text-cyan-400">
                    ⬆️ Stackable (max {modifier.maxStacks || 1})
                  </div>
                )}
              </div>
              
              {/* Rarity glow */}
              {modifier.rarity !== 'common' && (
                <div className="absolute inset-0 pointer-events-none opacity-20">
                  <div className={`absolute inset-0 bg-gradient-radial ${
                    modifier.rarity === 'rare' ? 'from-blue-400' :
                    modifier.rarity === 'epic' ? 'from-purple-400' :
                    'from-orange-400'
                  } to-transparent`} />
                </div>
              )}
            </motion.button>
          ))}
        </div>

        {/* Hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 text-slate-500 text-sm"
        >
          Click a card to select
        </motion.p>
      </div>
    </motion.div>
  );
}
