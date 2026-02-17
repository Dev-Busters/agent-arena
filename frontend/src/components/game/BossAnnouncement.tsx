'use client';

import { motion } from 'framer-motion';
import { useEffect } from 'react';

interface BossAnnouncementProps {
  bossName: string;
  onDismiss: () => void;
}

/**
 * BossAnnouncement — Dramatic screen before a boss fight
 * Auto-dismisses after 3 seconds
 */
export default function BossAnnouncement({ bossName, onDismiss }: BossAnnouncementProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center pointer-events-auto"
      onClick={onDismiss}
    >
      {/* Red vignette */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(180,0,0,0.4) 100%)' }}
      />

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6, type: 'spring', stiffness: 80 }}
        className="text-center z-10"
      >
        {/* Label */}
        <div className="text-red-500 text-lg uppercase tracking-[0.4em] mb-4 font-bold">
          ⚠ Boss Encounter ⚠
        </div>

        {/* Boss name */}
        <h1 className="text-7xl font-black text-white mb-6 drop-shadow-[0_0_40px_rgba(220,0,0,0.9)]"
          style={{ textShadow: '0 0 60px rgba(220,0,0,0.7), 0 0 20px rgba(255,100,100,0.5)' }}
        >
          {bossName}
        </h1>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="w-96 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent mx-auto mb-6"
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-slate-400 text-sm uppercase tracking-wider"
        >
          Prepare your agent
        </motion.p>
      </motion.div>

      {/* Skip hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 text-slate-600 text-xs"
      >
        Click to skip
      </motion.p>
    </motion.div>
  );
}
