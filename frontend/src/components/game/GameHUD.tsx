'use client';

import { motion } from 'framer-motion';

export interface AbilityCooldownState {
  dash: { cooldown: number; lastUsed: number; };
  blast: { cooldown: number; lastUsed: number; };
  projectile: { cooldown: number; lastUsed: number; };
  heal: { cooldown: number; lastUsed: number; };
}

export interface GameState {
  playerHp: number;
  playerMaxHp: number;
  playerLevel: number;
  playerXP: number;
  playerXPToNext: number;
  kills: number;
  floor: number;
  roomsCompleted: number;
  enemiesRemaining: number;
  abilities: AbilityCooldownState;
  isPaused: boolean;
}

interface GameHUDProps {
  gameState: GameState;
  onPause?: () => void;
  onResume?: () => void;
}

/**
 * GameHUD - React overlay for game stats
 * Renders on top of PixiJS canvas
 */
export default function GameHUD({ gameState, onPause, onResume }: GameHUDProps) {
  const { playerHp, playerMaxHp, playerLevel, playerXP, playerXPToNext, kills, floor, roomsCompleted, enemiesRemaining, abilities, isPaused } = gameState;
  const hpPercent = (playerHp / playerMaxHp) * 100;
  const hpColor = hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500';
  const xpPercent = (playerXP / playerXPToNext) * 100;
  
  // Calculate cooldown percentages for abilities (with safety check)
  const now = Date.now();
  const calculateCooldownPercent = (lastUsed: number, cooldown: number) => {
    const elapsed = now - lastUsed;
    if (elapsed >= cooldown) return 0; // Ready
    return ((cooldown - elapsed) / cooldown) * 100;
  };
  
  // Safety: Use default values if abilities is undefined
  const safeAbilities = abilities || {
    dash: { cooldown: 3000, lastUsed: 0 },
    blast: { cooldown: 6000, lastUsed: 0 },
    projectile: { cooldown: 5000, lastUsed: 0 },
    heal: { cooldown: 12000, lastUsed: 0 }
  };
  
  const dashCooldownPercent = calculateCooldownPercent(safeAbilities.dash.lastUsed, safeAbilities.dash.cooldown);
  const blastCooldownPercent = calculateCooldownPercent(safeAbilities.blast.lastUsed, safeAbilities.blast.cooldown);
  const projectileCooldownPercent = calculateCooldownPercent(safeAbilities.projectile.lastUsed, safeAbilities.projectile.cooldown);
  const healCooldownPercent = calculateCooldownPercent(safeAbilities.heal.lastUsed, safeAbilities.heal.cooldown);

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-auto">
        {/* Left: Player HP + XP + Level */}
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
          {/* Level badge */}
          <div className="text-xs text-yellow-400 uppercase tracking-wider mb-2 font-bold">
            Level {playerLevel}
          </div>
          
          {/* Health bar */}
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Health</div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-32 h-3 bg-slate-700 rounded-full overflow-hidden">
              <motion.div 
                className={`h-full ${hpColor} rounded-full`}
                initial={{ width: '100%' }}
                animate={{ width: `${hpPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-white font-mono text-sm">{playerHp}/{playerMaxHp}</span>
          </div>
          
          {/* XP bar */}
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Experience</div>
          <div className="flex items-center gap-3">
            <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-blue-300 font-mono text-xs">{playerXP}/{playerXPToNext}</span>
          </div>
        </div>

        {/* Center: Floor info */}
        <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg px-6 py-3 border border-purple-500/30">
          <div className="text-center">
            <div className="text-xs text-purple-400 uppercase tracking-wider">Floor {floor}</div>
            <div className="text-sm font-bold text-white">Room {roomsCompleted + 1}</div>
          </div>
        </div>

        {/* Right: Stats + Pause */}
        <div className="flex items-start gap-3">
          <div className="bg-slate-900/80 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50">
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-xs text-slate-400 uppercase tracking-wider">Kills</div>
                <div className="text-xl font-bold text-red-400">{kills}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400 uppercase tracking-wider">Enemies</div>
                <div className="text-xl font-bold text-orange-400">{enemiesRemaining}</div>
              </div>
            </div>
          </div>
          
          <button
            onClick={isPaused ? onResume : onPause}
            className="bg-slate-900/80 backdrop-blur-sm rounded-lg p-3 border border-slate-700/50 hover:bg-slate-800/80 transition-colors"
          >
            <span className="text-xl">{isPaused ? '▶️' : '⏸️'}</span>
          </button>
        </div>
      </div>

      {/* Pause overlay */}
      {isPaused && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-slate-950/80 flex items-center justify-center pointer-events-auto"
        >
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-4">⏸️ PAUSED</div>
            <button
              onClick={onResume}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-colors"
            >
              Resume Game
            </button>
          </div>
        </motion.div>
      )}

      {/* Ability Bar - Bottom Center */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-auto">
        <div className="flex gap-3">
          {/* Q - Dash */}
          <div className={`relative w-16 h-16 bg-slate-900/80 backdrop-blur-sm rounded-lg border ${dashCooldownPercent === 0 ? 'border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'border-slate-700/50'} overflow-hidden`}>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <div className="text-xs font-bold text-cyan-300">Q</div>
              <div className="text-[10px] text-slate-400">Dash</div>
            </div>
            {dashCooldownPercent > 0 && (
              <div 
                className="absolute inset-0 bg-black/70 transition-all duration-100"
                style={{ height: `${dashCooldownPercent}%`, top: 0 }}
              />
            )}
          </div>
          
          {/* E - Area Blast */}
          <div className={`relative w-16 h-16 bg-slate-900/80 backdrop-blur-sm rounded-lg border ${blastCooldownPercent === 0 ? 'border-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'border-slate-700/50'} overflow-hidden`}>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <div className="text-xs font-bold text-yellow-300">E</div>
              <div className="text-[10px] text-slate-400">Blast</div>
            </div>
            {blastCooldownPercent > 0 && (
              <div 
                className="absolute inset-0 bg-black/70 transition-all duration-100"
                style={{ height: `${blastCooldownPercent}%`, top: 0 }}
              />
            )}
          </div>
          
          {/* R - Projectile */}
          <div className={`relative w-16 h-16 bg-slate-900/80 backdrop-blur-sm rounded-lg border ${projectileCooldownPercent === 0 ? 'border-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.5)]' : 'border-slate-700/50'} overflow-hidden`}>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <div className="text-xs font-bold text-orange-300">R</div>
              <div className="text-[10px] text-slate-400">Projectile</div>
            </div>
            {projectileCooldownPercent > 0 && (
              <div 
                className="absolute inset-0 bg-black/70 transition-all duration-100"
                style={{ height: `${projectileCooldownPercent}%`, top: 0 }}
              />
            )}
          </div>
          
          {/* F - Heal */}
          <div className={`relative w-16 h-16 bg-slate-900/80 backdrop-blur-sm rounded-lg border ${healCooldownPercent === 0 ? 'border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'border-slate-700/50'} overflow-hidden`}>
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <div className="text-xs font-bold text-green-300">F</div>
              <div className="text-[10px] text-slate-400">Heal</div>
            </div>
            {healCooldownPercent > 0 && (
              <div 
                className="absolute inset-0 bg-black/70 transition-all duration-100"
                style={{ height: `${healCooldownPercent}%`, top: 0 }}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Controls hint */}
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-slate-900/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-slate-700/30">
        <div className="text-xs text-slate-500 text-center">
          <span className="text-cyan-300 font-semibold">Q</span> Dash • 
          <span className="text-yellow-300 font-semibold"> E</span> Blast • 
          <span className="text-orange-300 font-semibold"> R</span> Projectile • 
          <span className="text-green-300 font-semibold"> F</span> Heal
        </div>
      </div>
    </div>
  );
}
