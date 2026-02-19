'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface AbilityCooldownState {
  dash: { cooldown: number; lastUsed: number; };
  blast: { cooldown: number; lastUsed: number; };
  projectile: { cooldown: number; lastUsed: number; };
  heal: { cooldown: number; lastUsed: number; };
}

import type { SchoolConfig } from './schools';

export interface GameState {
  playerHp: number;
  playerMaxHp: number;
  playerLevel: number;
  playerXP: number;
  playerXPToNext: number;
  kills: number;
  gold: number;
  valor: number;
  floor: number;
  roomsCompleted: number;
  enemiesRemaining: number;
  abilities: AbilityCooldownState;
  isPaused: boolean;
  bossHp?: number;
  bossMaxHp?: number;
  school?: SchoolConfig;
  doctrineLevel?: { iron: number; arc: number; edge: number };
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
  const [showControls, setShowControls] = useState(true);

  // Auto-hide after 30 seconds of gameplay
  useEffect(() => {
    const timer = setTimeout(() => setShowControls(false), 30000);
    return () => clearTimeout(timer);
  }, []);

  // H key toggles controls hint
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'KeyH') setShowControls(v => !v);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  const { playerHp, playerMaxHp, playerLevel, playerXP, playerXPToNext, kills, gold, valor, floor, roomsCompleted, enemiesRemaining, abilities, isPaused, bossHp, bossMaxHp, school, doctrineLevel } = gameState;
  const abilityNames = school?.abilities ?? {
    Q: { name: 'Dash' }, E: { name: 'Blast' }, R: { name: 'Shot' }, F: { name: 'Heal' },
  };
  const isBossFight = bossHp !== undefined && bossMaxHp !== undefined && bossMaxHp > 0;
  const bossPct = isBossFight ? Math.max(0, (bossHp! / bossMaxHp!) * 100) : 0;
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
      {/* Boss HP bar — appears at top center during boss fights */}
      {isBossFight && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 w-[480px] mt-4 px-4 py-3
          bg-slate-900/90 backdrop-blur-sm border border-red-500/50 rounded-xl text-center">
          <div className="text-xs text-red-400 uppercase tracking-widest font-bold mb-2">
            ☠ The Warden
          </div>
          <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden border border-red-900/50">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-red-700 to-red-400"
              animate={{ width: `${bossPct}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="text-xs text-red-300 font-mono mt-1">{Math.max(0, bossHp!)} / {bossMaxHp}</div>
        </div>
      )}

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
            <span className="text-white font-mono text-sm">{Math.ceil(playerHp)}/{playerMaxHp}</span>
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
                <div className="text-xs text-slate-400 uppercase tracking-wider">Gold</div>
                <div className="text-xl font-bold text-yellow-400">{gold}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400 uppercase tracking-wider">⚡ Valor</div>
                <div className="text-xl font-bold" style={{ color: '#c0c0c0' }}>{valor}</div>
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
              <div className="text-[10px] text-slate-400">{abilityNames.Q.name}</div>
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
              <div className="text-[10px] text-slate-400">{abilityNames.E.name}</div>
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
              <div className="text-[10px] text-slate-400">{abilityNames.R.name}</div>
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
              <div className="text-[10px] text-slate-400">{abilityNames.F.name}</div>
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
      
      {/* Doctrine level indicators — bottom-left */}
      {doctrineLevel && (doctrineLevel.iron > 0 || doctrineLevel.arc > 0 || doctrineLevel.edge > 0) && (
        <div className="absolute bottom-24 left-4 flex flex-col gap-1 pointer-events-none">
          {doctrineLevel.iron > 0 && (
            <div className="flex items-center gap-2 rounded-full px-2 py-1" style={{ background: 'rgba(192,57,43,0.3)', border: '1px solid rgba(192,57,43,0.5)' }}>
              <span style={{ fontSize: 10, color: '#c0392b', fontWeight: 700 }}>🔴 Fe.{doctrineLevel.iron}</span>
            </div>
          )}
          {doctrineLevel.arc > 0 && (
            <div className="flex items-center gap-2 rounded-full px-2 py-1" style={{ background: 'rgba(46,134,222,0.3)', border: '1px solid rgba(46,134,222,0.5)' }}>
              <span style={{ fontSize: 10, color: '#2e86de', fontWeight: 700 }}>🔵 Ar.{doctrineLevel.arc}</span>
            </div>
          )}
          {doctrineLevel.edge > 0 && (
            <div className="flex items-center gap-2 rounded-full px-2 py-1" style={{ background: 'rgba(39,174,96,0.3)', border: '1px solid rgba(39,174,96,0.5)' }}>
              <span style={{ fontSize: 10, color: '#27ae60', fontWeight: 700 }}>🟢 Ed.{doctrineLevel.edge}</span>
            </div>
          )}
        </div>
      )}

      {/* Controls hint — press H to toggle, auto-hides after 30s */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute bottom-4 left-4 rounded px-3 py-2 pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5" style={{ fontSize: 10, color: '#5c574e' }}>
              <span><span style={{ color: '#8a8478' }}>WASD</span> — Move</span>
              <span><span style={{ color: '#8a8478' }}>Space / Click</span> — Attack</span>
              <span><span style={{ color: '#7eb8d4' }}>Q</span> — Dash</span>
              <span><span style={{ color: '#d4c67e' }}>E</span> — Blast</span>
              <span><span style={{ color: '#d4967e' }}>R</span> — Projectile</span>
              <span><span style={{ color: '#7ed48a' }}>F</span> — Heal</span>
            </div>
            <div style={{ fontSize: 9, color: '#3a3630', marginTop: 3 }}>H to hide</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
