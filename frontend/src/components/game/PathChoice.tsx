'use client';

import { motion } from 'framer-motion';

export type PathType = 'combat' | 'elite' | 'treasure' | 'rest' | 'shop';

export interface PathOption {
  type: PathType;
  name: string;
  description: string;
  icon: string;
  risk: 'low' | 'medium' | 'high';
}

const PATH_OPTIONS: Record<PathType, PathOption> = {
  combat: {
    type: 'combat',
    name: 'Combat',
    description: 'Standard rooms with normal enemies',
    icon: '⚔️',
    risk: 'medium'
  },
  elite: {
    type: 'elite',
    name: 'Elite',
    description: 'Harder enemies, better rewards',
    icon: '👑',
    risk: 'high'
  },
  treasure: {
    type: 'treasure',
    name: 'Treasure',
    description: 'Guaranteed rare modifier',
    icon: '💎',
    risk: 'low'
  },
  rest: {
    type: 'rest',
    name: 'Rest',
    description: 'Heal 50% of max HP',
    icon: '🛡️',
    risk: 'low'
  },
  shop: {
    type: 'shop',
    name: 'Shop',
    description: 'Spend gold on modifiers',
    icon: '🏪',
    risk: 'low'
  }
};

interface PathChoiceProps {
  availablePaths: PathType[];
  onSelect: (path: PathType) => void;
  currentFloor: number;
}

/**
 * PathChoice - Choose next floor type after completing all rooms
 */
export default function PathChoice({ availablePaths, onSelect, currentFloor }: PathChoiceProps) {
  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case 'low': return 'from-green-500 to-emerald-500';
      case 'medium': return 'from-yellow-500 to-orange-500';
      case 'high': return 'from-red-500 to-rose-500';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 pointer-events-auto"
    >
      <div className="text-center">
        {/* Title */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <h2 className="text-5xl font-bold text-purple-400 mb-3 drop-shadow-[0_0_15px_rgba(192,132,252,0.9)]">
            Choose Your Path
          </h2>
          <p className="text-slate-300 text-lg">Floor {currentFloor} awaits</p>
        </motion.div>

        {/* Path options */}
        <div className="flex gap-6 justify-center">
          {availablePaths.map((pathType, index) => {
            const path = PATH_OPTIONS[pathType];
            return (
              <motion.button
                key={pathType}
                initial={{ scale: 0.7, opacity: 0, y: 60 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.15 }}
                whileHover={{ scale: 1.05, y: -12 }}
                onClick={() => onSelect(pathType)}
                className={`
                  relative w-56 h-72 bg-gradient-to-b from-slate-800 to-slate-900
                  border-2 border-slate-600 rounded-lg
                  overflow-hidden cursor-pointer transition-all
                  hover:border-purple-400 hover:shadow-[0_0_20px_rgba(192,132,252,0.5)]
                `}
              >
                {/* Risk indicator header */}
                <div className={`h-12 bg-gradient-to-r ${getRiskColor(path.risk)} flex items-center justify-center`}>
                  <span className="text-xs uppercase font-bold text-white tracking-wider">
                    {path.risk} Risk
                  </span>
                </div>

                {/* Icon */}
                <div className="py-6">
                  <span className="text-7xl">{path.icon}</span>
                </div>

                {/* Content */}
                <div className="px-4 text-center">
                  {/* Name */}
                  <h3 className="text-2xl font-bold text-white mb-3">{path.name}</h3>

                  {/* Description */}
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {path.description}
                  </p>
                </div>

                {/* Hover glow */}
                <div className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-10 transition-opacity">
                  <div className="absolute inset-0 bg-gradient-radial from-purple-400 to-transparent" />
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-8 text-slate-500 text-sm"
        >
          Choose wisely — each path offers different rewards
        </motion.p>
      </div>
    </motion.div>
  );
}
