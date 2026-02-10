'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import dynamic from 'next/dynamic';

const DungeonScene3D = dynamic(() => import('./DungeonScene3D'), { ssr: false });

interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
}

interface DungeonEncounterProps {
  dungeonId: string;
  playerStats: any;
  onWin: () => void;
  onFlee: () => void;
}

export default function DungeonEncounter({
  dungeonId,
  playerStats,
  onWin,
  onFlee
}: DungeonEncounterProps) {
  const { socket } = useSocket();
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [selectedEnemy, setSelectedEnemy] = useState<string | null>(null);
  const [playerHp, setPlayerHp] = useState(playerStats.hp);
  const [isAttacking, setIsAttacking] = useState(false);
  const [damages, setDamages] = useState<Array<{ id: string; damage: number }>>([]);
  const [inCombat, setInCombat] = useState(true);
  const [combatPhase, setCombatPhase] = useState<'approach' | 'combat' | 'victory'>('approach');

  useEffect(() => {
    if (!socket) return;

    const handleEncounterStarted = (data: any) => {
      setEnemies(data.enemies || []);
      if (data.enemies?.length > 0) {
        setSelectedEnemy(data.enemies[0].id);
      }
    };

    const handleTurnResult = (data: any) => {
      setEnemies(prev => prev.map(e => 
        e.id === data.enemies[0]?.id 
          ? { ...e, hp: Math.max(0, data.enemies[0].hp) }
          : e
      ));

      if (data.playerDamage > 0) {
        setDamages(prev => [...prev, { id: selectedEnemy!, damage: data.playerDamage }]);
        setTimeout(() => {
          setDamages(prev => prev.filter(d => d.id !== selectedEnemy));
        }, 1000);
      }
      
      setIsAttacking(false);
    };

    const handleEncounterWon = (data: any) => {
      setInCombat(false);
      setCombatPhase('victory');
      setTimeout(() => onWin(), 1500);
    };

    socket.on('encounter_started', handleEncounterStarted);
    socket.on('turn_result', handleTurnResult);
    socket.on('encounter_won', handleEncounterWon);

    return () => {
      socket.off('encounter_started', handleEncounterStarted);
      socket.off('turn_result', handleTurnResult);
      socket.off('encounter_won', handleEncounterWon);
    };
  }, [socket, selectedEnemy, onWin]);

  const handleAttack = () => {
    if (!selectedEnemy || !inCombat || isAttacking) return;
    setIsAttacking(true);

    socket?.emit('dungeon_action', {
      dungeonId,
      action: 'attack',
      targetId: selectedEnemy
    });
  };

  const handleAgentReachedEnemy = () => {
    setCombatPhase('combat');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 p-6">
      {/* Animated background effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Approach Phase: Show 3D dungeon scene */}
        <AnimatePresence>
          {combatPhase === 'approach' && enemies.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mb-8"
            >
              <DungeonScene3D
                playerStats={playerStats}
                enemyData={enemies[0]}
                onReachEnemy={handleAgentReachedEnemy}
              />
            </motion.div>
          )}
        </AnimatePresence>
        {/* Combat UI - only show after approach phase */}
        <AnimatePresence>
          {combatPhase !== 'approach' && (
            <>
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
              >
                <motion.div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 mb-2">
                  ⚔️ COMBAT
                </motion.div>
                <p className="text-purple-300/60 font-mono text-sm">Battle System Engaged</p>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Combat Arena - only show during combat */}
        {combatPhase !== 'approach' && (
        <div className="grid grid-cols-5 gap-6 mb-8">
          {/* Player Card - Left */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-1 backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl"
          >
            <h2 className="text-sm font-bold text-cyan-300 uppercase tracking-widest mb-6">Your Character</h2>
            
            {/* Avatar */}
            <div className="text-5xl text-center mb-4">
              {playerStats.class === 'warrior' ? '⚔️' : playerStats.class === 'mage' ? '✨' : '🗡️'}
            </div>

            {/* Health Bar */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-cyan-300/70 uppercase tracking-wide">HP</span>
                <span className="text-xs font-mono text-cyan-200">{playerHp}/{playerStats.maxHp}</span>
              </div>
              <div className="relative h-6 bg-slate-900/50 rounded-full border border-cyan-500/30 overflow-hidden shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-lg shadow-cyan-500/50"
                  initial={{ width: '100%' }}
                  animate={{ width: `${(playerHp / playerStats.maxHp) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-cyan-300/70">
                <span>Level</span>
                <span className="font-bold text-cyan-300">{playerStats.level}</span>
              </div>
              <div className="flex justify-between text-cyan-300/70">
                <span>⚡ Attack</span>
                <span className="font-bold text-cyan-300">15</span>
              </div>
              <div className="flex justify-between text-cyan-300/70">
                <span>🛡️ Defense</span>
                <span className="font-bold text-cyan-300">8</span>
              </div>
            </div>
          </motion.div>

          {/* Enemies - Center */}
          <div className="col-span-3 space-y-4">
            <AnimatePresence>
              {enemies.map((enemy, idx) => {
                const damage = damages.find(d => d.id === enemy.id);
                return (
                  <motion.button
                    key={enemy.id}
                    onClick={() => inCombat && setSelectedEnemy(enemy.id)}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`w-full group relative overflow-hidden rounded-2xl transition-all duration-300 ${
                      selectedEnemy === enemy.id
                        ? 'ring-2 ring-red-500/50'
                        : 'hover:ring-2 hover:ring-red-500/30'
                    }`}
                  >
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-orange-600/10 to-red-600/20 group-hover:from-red-600/30 group-hover:via-orange-600/20 group-hover:to-red-600/30 transition-all duration-300" />
                    <div className="absolute inset-0 backdrop-blur-xl bg-slate-900/40" />

                    {/* Border */}
                    <div className="absolute inset-0 border border-red-500/30 rounded-2xl group-hover:border-red-500/50 transition-all" />

                    {/* Content */}
                    <div className="relative p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-4xl">👹</div>
                        <div className="text-left">
                          <h3 className="text-lg font-bold text-red-200">{enemy.name}</h3>
                          <p className="text-xs text-red-300/60">Level {Math.ceil(enemies.length + Math.random() * 3)}</p>
                        </div>
                      </div>

                      {/* Health Info */}
                      <div className="text-right">
                        <div className="text-xs text-red-300/70 mb-2 font-mono">
                          {Math.max(0, enemy.hp)} / {enemy.maxHp}
                        </div>
                        <div className="w-32 h-3 bg-slate-900/50 rounded-full border border-red-500/30 overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full shadow-lg shadow-red-500/50"
                            initial={{ width: '100%' }}
                            animate={{ width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Damage Popup */}
                    <AnimatePresence>
                      {damage && (
                        <motion.div
                          initial={{ opacity: 1, y: 0, scale: 1 }}
                          animate={{ opacity: 0, y: -40, scale: 1.2 }}
                          transition={{ duration: 0.8 }}
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                        >
                          <div className="text-3xl font-black text-red-400 drop-shadow-lg">
                            -{damage.damage}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Actions - Right */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="col-span-1 backdrop-blur-xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/30 rounded-2xl p-6 shadow-2xl flex flex-col justify-between"
          >
            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: inCombat && !isAttacking ? 1.05 : 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAttack}
                disabled={!inCombat || isAttacking}
                className="w-full relative group overflow-hidden rounded-xl py-4 px-4 font-bold text-white uppercase tracking-wide text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 group-hover:from-red-500 group-hover:to-orange-500 transition-all" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/10 transition-all" />
                <div className="relative flex items-center justify-center gap-2">
                  {isAttacking ? '⚡ Attacking...' : '⚡ Attack'}
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: inCombat ? 1.05 : 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { onFlee(); setInCombat(false); }}
                disabled={!inCombat}
                className="w-full relative group overflow-hidden rounded-xl py-4 px-4 font-bold text-white uppercase tracking-wide text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 group-hover:from-purple-500 group-hover:to-indigo-500 transition-all" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/10 transition-all" />
                <div className="relative">🏃 Flee</div>
              </motion.button>
            </div>

            {/* Status Badge */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="text-center"
            >
              {inCombat ? (
                <div className="inline-block px-4 py-2 rounded-full bg-red-500/20 border border-red-500/50 text-red-300 text-xs font-bold uppercase tracking-wide">
                  ⚔️ IN COMBAT
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-block px-4 py-2 rounded-full bg-green-500/20 border border-green-500/50 text-green-300 text-xs font-bold uppercase tracking-wide"
                >
                  ✨ VICTORY!
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </div>
        )}
      </div>
    </div>
  );
}
