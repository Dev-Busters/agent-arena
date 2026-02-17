'use client';

import { useState, useCallback } from 'react';
import { ArenaCanvas, GameHUD, GameStats, GameState, DamageEvent } from '@/components/game';
import DamageNumber from '@/components/game/DamageNumber';

interface DamageNumberData {
  id: string;
  damage: number;
  x: number;
  y: number;
  isCrit: boolean;
  isHeal: boolean;
}

/**
 * Arena Page - Playable PixiJS game with React HUD overlay
 * Route: /arena
 */
export default function ArenaPage() {
  const [gameState, setGameState] = useState<GameState>({
    playerHp: 100,
    playerMaxHp: 100,
    playerLevel: 1,
    playerXP: 0,
    playerXPToNext: 100,
    kills: 0,
    gold: 0,
    floor: 1,
    roomsCompleted: 0,
    enemiesRemaining: 0,
    abilities: {
      dash: { cooldown: 3000, lastUsed: 0 },
      blast: { cooldown: 6000, lastUsed: 0 },
      projectile: { cooldown: 5000, lastUsed: 0 },
      heal: { cooldown: 12000, lastUsed: 0 }
    },
    isPaused: false
  });
  
  const [damageNumbers, setDamageNumbers] = useState<DamageNumberData[]>([]);

  const handleGameStateChange = useCallback((stats: GameStats) => {
    setGameState(prev => ({
      ...prev,
      ...stats
    }));
  }, []);

  const handlePause = useCallback(() => {
    setGameState(prev => ({ ...prev, isPaused: true }));
  }, []);

  const handleResume = useCallback(() => {
    setGameState(prev => ({ ...prev, isPaused: false }));
  }, []);
  
  const handleDamage = useCallback((event: DamageEvent) => {
    const id = `dmg-${Date.now()}-${Math.random()}`;
    setDamageNumbers(prev => [...prev, {
      id,
      damage: event.damage,
      x: event.x,
      y: event.y,
      isCrit: event.isCrit,
      isHeal: false
    }]);
  }, []);
  
  const removeDamageNumber = useCallback((id: string) => {
    setDamageNumbers(prev => prev.filter(d => d.id !== id));
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center">
      <div className="relative border border-[#2a2a3d] rounded-lg overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
        <ArenaCanvas 
          width={1280} 
          height={720} 
          onGameStateChange={handleGameStateChange}
          onDamage={handleDamage}
          isPaused={gameState.isPaused}
        />
        <GameHUD 
          gameState={gameState}
          onPause={handlePause}
          onResume={handleResume}
        />
        
        {/* Damage numbers overlay */}
        {damageNumbers.map(dmg => (
          <DamageNumber
            key={dmg.id}
            damage={dmg.damage}
            x={dmg.x}
            y={dmg.y}
            isCrit={dmg.isCrit}
            isHeal={dmg.isHeal}
            onComplete={() => removeDamageNumber(dmg.id)}
          />
        ))}
      </div>
    </div>
  );
}
