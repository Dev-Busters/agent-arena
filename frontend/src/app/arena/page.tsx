'use client';

import { useState, useCallback } from 'react';
import { ArenaCanvas, GameHUD, GameStats, GameState } from '@/components/game';

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
    wave: 1,
    enemiesRemaining: 3,
    isPaused: false
  });

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

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
      <div className="relative border-2 border-purple-500/30 rounded-lg overflow-hidden shadow-2xl shadow-purple-500/20">
        <ArenaCanvas 
          width={1280} 
          height={720} 
          onGameStateChange={handleGameStateChange}
          isPaused={gameState.isPaused}
        />
        <GameHUD 
          gameState={gameState}
          onPause={handlePause}
          onResume={handleResume}
        />
      </div>
    </div>
  );
}
