'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StatsOverlayProps {
  playerStats: {
    hp: number;
    maxHp: number;
    level: number;
    attack?: number;
    defense?: number;
  };
  floor: number;
  maxFloor?: number;
  difficulty: string;
  roomsExplored: number;
  totalRooms: number;
  enemiesDefeated?: number;
  goldEarned?: number;
  xpEarned?: number;
  elapsedSeconds?: number;
  specialZone?: string | null;
  isInCombat?: boolean;
}

// Format time as MM:SS
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Get difficulty styling
function getDifficultyStyle(difficulty: string) {
  switch (difficulty) {
    case 'easy':
      return { color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/40', glow: 'shadow-green-500/10' };
    case 'normal':
      return { color: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/40', glow: 'shadow-blue-500/10' };
    case 'hard':
      return { color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/40', glow: 'shadow-orange-500/10' };
    case 'nightmare':
      return { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/40', glow: 'shadow-red-500/10' };
    default:
      return { color: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/40', glow: '' };
  }
}

// HP bar color based on percentage
function getHpColor(percent: number) {
  if (percent > 0.6) return 'from-emerald-500 to-green-400';
  if (percent > 0.3) return 'from-yellow-500 to-orange-400';
  return 'from-red-500 to-rose-400';
}

export default function StatsOverlay({
  playerStats,
  floor,
  maxFloor = 10,
  difficulty,
  roomsExplored,
  totalRooms,
  enemiesDefeated = 0,
  goldEarned = 0,
  xpEarned = 0,
  elapsedSeconds,
  specialZone = null,
  isInCombat = false,
}: StatsOverlayProps) {
  const [localElapsed, setLocalElapsed] = useState(elapsedSeconds ?? 0);
  const [prevHp, setPrevHp] = useState(playerStats.hp);
  const [hpFlash, setHpFlash] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Internal timer if no external elapsed provided
  useEffect(() => {
    if (elapsedSeconds !== undefined) {
      setLocalElapsed(elapsedSeconds);
      return;
    }
    timerRef.current = setInterval(() => {
      setLocalElapsed(prev => prev + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [elapsedSeconds]);

  // HP change flash effect
  useEffect(() => {
    if (playerStats.hp < prevHp) {
      setHpFlash(true);
      const timeout = setTimeout(() => setHpFlash(false), 500);
      return () => clearTimeout(timeout);
    }
    setPrevHp(playerStats.hp);
  }, [playerStats.hp, prevHp]);

  const hpPercent = playerStats.maxHp > 0 ? playerStats.hp / playerStats.maxHp : 0;
  const explorationPercent = totalRooms > 0 ? (roomsExplored / totalRooms) * 100 : 0;
  const floorProgress = ((floor - 1) / (maxFloor - 1)) * 100;
  const diffStyle = getDifficultyStyle(difficulty);

  const dungeonNames = [
    'Goblin Caverns', 'Skeletal Tombs', 'Orc Stronghold', 'Phantom Depths',
    "Dragon's Lair", 'Cursed Crypt', 'Shadowy Abyss', 'Hellfire Pit',
    'The Forbidden Tower', "God's Tomb"
  ];
  const dungeonName = dungeonNames[Math.min(floor - 1, dungeonNames.length - 1)];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-3"
    >
      {/* Main Stats Card */}
      <div className="backdrop-blur-xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-700/50 rounded-xl overflow-hidden shadow-xl">
        {/* Header - Dungeon Name + Timer */}
        <div className="px-4 py-2.5 border-b border-slate-700/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300 truncate max-w-[120px]">
              {dungeonName}
            </span>
            {specialZone && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/30 border border-purple-500/40 text-purple-300 font-mono">
                {specialZone.replace(/_/g, ' ')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {isInCombat && (
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="text-[9px] text-red-400 font-mono font-bold"
              >
                ⚔️ COMBAT
              </motion.span>
            )}
            <span className="text-[10px] text-slate-500 font-mono tabular-nums">
              ⏱ {formatTime(localElapsed)}
            </span>
          </div>
        </div>

        {/* HP Bar */}
        <div className={`px-4 py-3 transition-all duration-200 ${hpFlash ? 'bg-red-500/10' : ''}`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">HP</span>
            <span className="text-[11px] font-mono font-bold text-slate-300 tabular-nums">
              {playerStats.hp}
              <span className="text-slate-600"> / </span>
              {playerStats.maxHp}
            </span>
          </div>
          <div className="relative h-3 bg-slate-800/60 rounded-full border border-slate-700/40 overflow-hidden">
            <motion.div
              className={`h-full bg-gradient-to-r ${getHpColor(hpPercent)} rounded-full`}
              initial={false}
              animate={{ width: `${hpPercent * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
            {/* HP tick marks */}
            <div className="absolute inset-0 flex">
              {[0.25, 0.5, 0.75].map(tick => (
                <div
                  key={tick}
                  className="absolute h-full w-px bg-slate-700/50"
                  style={{ left: `${tick * 100}%` }}
                />
              ))}
            </div>
          </div>
          {hpPercent <= 0.25 && (
            <motion.p
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="text-[9px] text-red-400 font-mono mt-1"
            >
              ⚠ CRITICAL HP
            </motion.p>
          )}
        </div>

        {/* Core Stats Grid */}
        <div className="px-4 pb-3 grid grid-cols-2 gap-2">
          {/* Level */}
          <div className="bg-slate-800/30 rounded-lg px-3 py-2 border border-slate-700/20">
            <p className="text-[9px] text-yellow-400/60 font-mono uppercase tracking-widest">Level</p>
            <p className="text-lg font-black text-yellow-300 leading-tight">{playerStats.level}</p>
          </div>

          {/* Floor */}
          <div className="bg-slate-800/30 rounded-lg px-3 py-2 border border-slate-700/20">
            <p className="text-[9px] text-purple-400/60 font-mono uppercase tracking-widest">Floor</p>
            <div className="flex items-baseline gap-1">
              <p className="text-lg font-black text-purple-300 leading-tight">{floor}</p>
              <p className="text-[9px] text-slate-600 font-mono">/ {maxFloor}</p>
            </div>
          </div>

          {/* Difficulty */}
          <div className={`${diffStyle.bg} rounded-lg px-3 py-2 border ${diffStyle.border}`}>
            <p className="text-[9px] text-slate-400/60 font-mono uppercase tracking-widest">Difficulty</p>
            <p className={`text-xs font-bold ${diffStyle.color} uppercase`}>{difficulty}</p>
          </div>

          {/* Exploration */}
          <div className="bg-slate-800/30 rounded-lg px-3 py-2 border border-slate-700/20">
            <p className="text-[9px] text-cyan-400/60 font-mono uppercase tracking-widest">Explored</p>
            <div className="flex items-baseline gap-1">
              <p className="text-sm font-bold text-cyan-300 leading-tight">{roomsExplored}</p>
              <p className="text-[9px] text-slate-600 font-mono">/ {totalRooms}</p>
            </div>
          </div>
        </div>

        {/* Exploration Progress Bar */}
        <div className="px-4 pb-3">
          <div className="relative h-1.5 bg-slate-800/40 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
              initial={false}
              animate={{ width: `${explorationPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-[9px] text-slate-600 font-mono mt-1 text-right">
            {Math.round(explorationPercent)}% explored
          </p>
        </div>
      </div>

      {/* Loot & Combat Stats Card */}
      <div className="backdrop-blur-xl bg-gradient-to-br from-slate-900/90 to-slate-950/90 border border-slate-700/50 rounded-xl overflow-hidden shadow-xl">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full px-4 py-2 flex items-center justify-between hover:bg-slate-800/20 transition-colors"
        >
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
            Run Stats
          </span>
          <motion.span
            animate={{ rotate: showDetails ? 180 : 0 }}
            className="text-[10px] text-slate-600"
          >
            ▾
          </motion.span>
        </button>

        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 space-y-2">
                {/* Enemies Defeated */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                    <span className="text-xs">💀</span> Enemies
                  </span>
                  <span className="text-[11px] font-mono font-bold text-red-300 tabular-nums">
                    {enemiesDefeated}
                  </span>
                </div>

                {/* Gold */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                    <span className="text-xs">🪙</span> Gold
                  </span>
                  <motion.span
                    key={goldEarned}
                    initial={{ scale: 1.2, color: '#fbbf24' }}
                    animate={{ scale: 1, color: '#fcd34d' }}
                    className="text-[11px] font-mono font-bold text-yellow-300 tabular-nums"
                  >
                    {goldEarned.toLocaleString()}
                  </motion.span>
                </div>

                {/* XP */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                    <span className="text-xs">✨</span> XP
                  </span>
                  <motion.span
                    key={xpEarned}
                    initial={{ scale: 1.2, color: '#60a5fa' }}
                    animate={{ scale: 1, color: '#93c5fd' }}
                    className="text-[11px] font-mono font-bold text-blue-300 tabular-nums"
                  >
                    {xpEarned.toLocaleString()}
                  </motion.span>
                </div>

                {/* Floor Progress */}
                <div className="pt-1 border-t border-slate-700/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-slate-600 font-mono">Dungeon Progress</span>
                    <span className="text-[9px] text-slate-600 font-mono">{Math.round(floorProgress)}%</span>
                  </div>
                  <div className="h-1 bg-slate-800/40 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      initial={false}
                      animate={{ width: `${floorProgress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Attack/Defense if available */}
                {(playerStats.attack || playerStats.defense) && (
                  <div className="pt-1 border-t border-slate-700/30 grid grid-cols-2 gap-2">
                    {playerStats.attack && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-mono">⚡ ATK</span>
                        <span className="text-[10px] font-mono font-bold text-orange-300">{playerStats.attack}</span>
                      </div>
                    )}
                    {playerStats.defense && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-mono">🛡 DEF</span>
                        <span className="text-[10px] font-mono font-bold text-blue-300">{playerStats.defense}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick stats bar (always visible) */}
        {!showDetails && (
          <div className="px-4 pb-2.5 flex items-center gap-3 text-[10px] font-mono text-slate-500">
            <span>💀 {enemiesDefeated}</span>
            <span>🪙 {goldEarned.toLocaleString()}</span>
            <span>✨ {xpEarned.toLocaleString()}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
