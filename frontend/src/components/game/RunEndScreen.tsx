'use client';

import { motion } from 'framer-motion';

export interface RunStats {
  floorsReached: number;
  roomsCompleted: number;
  enemiesKilled: number;
  timeSeconds: number;
}

interface RunEndScreenProps {
  stats: RunStats;
  onReturnToWarRoom: () => void;
}

/**
 * RunEndScreen - Shows when the agent dies
 * Displays run statistics and return button
 */
export default function RunEndScreen({ stats, onReturnToWarRoom }: RunEndScreenProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="bg-slate-900/95 border-2 border-red-900/50 rounded-2xl p-12 max-w-lg w-full mx-4"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        {/* Title */}
        <div className="text-center mb-8">
          <motion.h1
            className="text-6xl font-bold text-red-500 mb-2"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            FALLEN
          </motion.h1>
          <motion.p
            className="text-slate-400 text-lg italic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            But legends never truly die...
          </motion.p>
        </div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-2 gap-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
            <div className="text-slate-400 text-sm uppercase tracking-wider mb-1">Floors Reached</div>
            <div className="text-3xl font-bold text-purple-400">{stats.floorsReached}</div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
            <div className="text-slate-400 text-sm uppercase tracking-wider mb-1">Rooms Cleared</div>
            <div className="text-3xl font-bold text-blue-400">{stats.roomsCompleted}</div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
            <div className="text-slate-400 text-sm uppercase tracking-wider mb-1">Enemies Slain</div>
            <div className="text-3xl font-bold text-red-400">{stats.enemiesKilled}</div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/30">
            <div className="text-slate-400 text-sm uppercase tracking-wider mb-1">Time Survived</div>
            <div className="text-3xl font-bold text-green-400">{formatTime(stats.timeSeconds)}</div>
          </div>
        </motion.div>

        {/* Return Button */}
        <motion.button
          onClick={onReturnToWarRoom}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 uppercase tracking-wider text-lg"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          Return to War Room
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
