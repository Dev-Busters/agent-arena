'use client';

import { motion } from 'framer-motion';

interface DungeonCompleteProps {
  depth: number;
  rewards: {
    gold: number;
    xp: number;
  };
  onReturn: () => void;
}

export default function DungeonComplete({ depth, rewards, onReturn }: DungeonCompleteProps) {
  const dungeonNames = [
    'Goblin Caverns',
    'Skeletal Tombs',
    'Orc Stronghold',
    'Phantom Depths',
    "Dragon's Lair",
    'Cursed Crypt',
    'Shadowy Abyss',
    'Hellfire Pit',
    'The Forbidden Tower',
    "God's Tomb"
  ];

  const dungeonName = dungeonNames[Math.min(depth - 1, dungeonNames.length - 1)];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        {/* Victory Animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-8xl mb-6"
        >
          🏆
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-5xl font-bold text-white mb-4"
        >
          Dungeon Conquered!
        </motion.h1>

        {/* Dungeon Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-2xl text-purple-300 mb-8"
        >
          {dungeonName}
        </motion.p>

        {/* Stats Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 border-2 border-purple-500 rounded-lg p-8 mb-8"
        >
          {/* Floors */}
          <div className="mb-6 pb-6 border-b border-purple-500/30">
            <p className="text-purple-300 text-sm mb-2">Floors Cleared</p>
            <p className="text-4xl font-bold text-white">{depth} / 10</p>
          </div>

          {/* Rewards */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4"
            >
              <p className="text-yellow-300 text-sm mb-1">Gold Earned</p>
              <p className="text-2xl font-bold text-yellow-400">+{rewards.gold}</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4"
            >
              <p className="text-blue-300 text-sm mb-1">Experience</p>
              <p className="text-2xl font-bold text-blue-400">+{rewards.xp}</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="space-y-3 mb-8 text-left bg-slate-900/30 border border-slate-700 rounded-lg p-6"
        >
          <div className="flex justify-between">
            <span className="text-slate-300">Difficulty Bonus</span>
            <span className="text-white font-bold">+25%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-300">Speed Bonus</span>
            <span className="text-white font-bold">+10%</span>
          </div>
          <div className="flex justify-between border-t border-slate-700 pt-3">
            <span className="text-purple-300 font-bold">Total Rewards</span>
            <span className="text-white font-bold">
              {rewards.gold} 🪙 + {rewards.xp} 🌟
            </span>
          </div>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex gap-4"
        >
          <button
            onClick={onReturn}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all"
          >
            ← Return to Dashboard
          </button>
        </motion.div>

        {/* Footer Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="text-slate-400 text-sm mt-8"
        >
          💡 Come back for more adventures. Stronger dungeons await!
        </motion.p>
      </motion.div>
    </div>
  );
}
