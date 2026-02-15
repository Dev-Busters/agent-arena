'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';

interface StatusEffectDisplay {
  type: string;
  duration: number;
  stacks: number;
  icon: string;
  color: string;
  description: string;
  preventsAction: boolean;
}

interface Enemy {
  id: string;
  name: string;
  type?: string;
  hp: number;
  maxHp: number;
  effects?: StatusEffectDisplay[];
}

interface EffectEvent {
  type: string;
  target: string;
  message: string;
}

interface DungeonEncounterProps {
  dungeonId: string;
  playerStats: any;
  onWin: () => void;
  onFlee: () => void;
}

const EFFECT_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  poison: { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-300', glow: 'shadow-green-500/30' },
  stun: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-300', glow: 'shadow-yellow-500/30' },
  bleed: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-300', glow: 'shadow-red-500/30' },
  burn: { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-300', glow: 'shadow-orange-500/30' },
  weakness: { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-300', glow: 'shadow-purple-500/30' },
  slow: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-300', glow: 'shadow-cyan-500/30' },
  defend: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-300', glow: 'shadow-blue-500/30' },
};

function StatusEffectBadge({ effect }: { effect: StatusEffectDisplay }) {
  const colors = EFFECT_COLORS[effect.type] || EFFECT_COLORS.poison;
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono ${colors.bg} ${colors.border} border ${colors.text} shadow-md ${colors.glow} cursor-help`}
      title={`${effect.description}\n${effect.stacks} stack(s), ${effect.duration} turn(s) left`}
    >
      <span>{effect.icon}</span>
      {effect.stacks > 1 && <span className="font-bold">×{effect.stacks}</span>}
      <span className="opacity-70">{effect.duration}t</span>
    </motion.div>
  );
}

function CombatLog({ messages }: { messages: string[] }) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 backdrop-blur-xl bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 max-h-48 overflow-y-auto"
      ref={logRef}
    >
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">⚔️ Combat Log</h3>
      <div className="space-y-1">
        {messages.slice(-20).map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.02 }}
            className="text-xs text-slate-300/80 font-mono leading-relaxed"
          >
            {msg}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
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
  const [playerEffects, setPlayerEffects] = useState<StatusEffectDisplay[]>([]);
  const [isAttacking, setIsAttacking] = useState(false);
  const [damages, setDamages] = useState<Array<{ id: string; damage: number; type?: string }>>([]);
  const [inCombat, setInCombat] = useState(true);
  const [combatPhase, setCombatPhase] = useState<'approach' | 'combat' | 'victory'>('combat');
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [turnNumber, setTurnNumber] = useState(0);
  const [effectFlashes, setEffectFlashes] = useState<Array<{ id: string; type: string }>>([]);

  useEffect(() => {
    if (!socket) return;

    const handleEncounterStarted = (data: any) => {
      setEnemies(data.enemies || []);
      setPlayerEffects([]);
      setCombatLog(['⚔️ Battle begins!']);
      setTurnNumber(0);
      if (data.enemies?.length > 0) {
        setSelectedEnemy(data.enemies[0].id);
      }
    };

    const handleTurnResult = (data: any) => {
      // Update enemies with effects
      setEnemies(data.enemies || []);

      // Update player state
      if (data.playerHp !== undefined) setPlayerHp(data.playerHp);
      if (data.playerEffects) setPlayerEffects(data.playerEffects);
      if (data.turnNumber) setTurnNumber(data.turnNumber);

      // Show damage numbers
      if (data.playerDamage > 0 && data.enemies?.[0]) {
        const targetId = data.enemies[0].id;
        setDamages(prev => [...prev, { id: targetId, damage: data.playerDamage, type: data.playerCritical ? 'crit' : undefined }]);
        setTimeout(() => {
          setDamages(prev => prev.filter(d => d.id !== targetId));
        }, 1200);
      }

      // Show enemy damage to player
      if (data.enemyActions) {
        for (const ea of data.enemyActions) {
          if (ea.damage > 0) {
            setDamages(prev => [...prev, { id: 'player', damage: ea.damage }]);
            setTimeout(() => {
              setDamages(prev => prev.filter(d => d.id !== 'player'));
            }, 1200);
          }
        }
      }

      // Effect flashes (visual indicators for new effects)
      if (data.effectEvents) {
        for (const ev of data.effectEvents as EffectEvent[]) {
          setEffectFlashes(prev => [...prev, { id: ev.target, type: ev.type }]);
          setTimeout(() => {
            setEffectFlashes(prev => prev.filter(f => !(f.id === ev.target && f.type === ev.type)));
          }, 800);
        }
      }

      // Update combat log
      if (data.turnMessages) {
        setCombatLog(prev => [...prev, `── Turn ${data.turnNumber || '?'} ──`, ...data.turnMessages]);
      }

      setIsAttacking(false);
    };

    const handleEncounterWon = (data: any) => {
      setInCombat(false);
      setCombatPhase('victory');
      if (data.turnMessages) {
        setCombatLog(prev => [...prev, ...data.turnMessages, '✨ Victory!']);
      }
      setTimeout(() => onWin(), 1500);
    };

    const handleEncounterLost = (data: any) => {
      setInCombat(false);
      if (data.turnMessages) {
        setCombatLog(prev => [...prev, ...data.turnMessages, '💀 Defeated!']);
      }
    };

    socket.on('encounter_started', handleEncounterStarted);
    socket.on('turn_result', handleTurnResult);
    socket.on('encounter_won', handleEncounterWon);
    socket.on('encounter_lost', handleEncounterLost);

    return () => {
      socket.off('encounter_started', handleEncounterStarted);
      socket.off('turn_result', handleTurnResult);
      socket.off('encounter_won', handleEncounterWon);
      socket.off('encounter_lost', handleEncounterLost);
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

  const handleDefend = () => {
    if (!inCombat || isAttacking) return;
    setIsAttacking(true);

    socket?.emit('dungeon_action', {
      dungeonId,
      action: 'defend',
    });
  };

  const isPlayerStunned = playerEffects.some(e => e.type === 'stun');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 p-6">
      {/* Animated background effect */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        {/* Effect-based ambient lighting */}
        {playerEffects.some(e => e.type === 'poison') && (
          <div className="absolute inset-0 bg-green-500/5 animate-pulse transition-opacity duration-1000" />
        )}
        {playerEffects.some(e => e.type === 'burn') && (
          <div className="absolute inset-0 bg-orange-500/5 animate-pulse transition-opacity duration-1000" />
        )}
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* TODO: Add 2D PixiJS combat scene here in Phase B */}

        {/* Combat UI */}
        <AnimatePresence>
          {combatPhase !== 'approach' && (
            <>
              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
              >
                <motion.div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 mb-2">
                  ⚔️ COMBAT
                </motion.div>
                <div className="flex items-center justify-center gap-4">
                  <p className="text-purple-300/60 font-mono text-sm">Battle System Engaged</p>
                  {turnNumber > 0 && (
                    <span className="text-xs font-mono text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full">
                      Turn {turnNumber}
                    </span>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Combat Arena */}
        {combatPhase !== 'approach' && (
        <div className="grid grid-cols-5 gap-6 mb-4">
          {/* Player Card - Left */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className={`col-span-1 backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border rounded-2xl p-6 shadow-2xl transition-all duration-300 ${
              isPlayerStunned ? 'border-yellow-500/50 ring-2 ring-yellow-500/20' : 'border-cyan-500/30'
            }`}
          >
            <h2 className="text-sm font-bold text-cyan-300 uppercase tracking-widest mb-4">Your Character</h2>
            
            {/* Avatar */}
            <div className="text-5xl text-center mb-4 relative">
              {playerStats.class === 'warrior' ? '⚔️' : playerStats.class === 'mage' ? '✨' : playerStats.class === 'rogue' ? '🗡️' : '🛡️'}
              {/* Stunned overlay */}
              {isPlayerStunned && (
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="absolute -top-2 -right-2 text-2xl"
                >
                  💫
                </motion.div>
              )}
              {/* Damage flash on player */}
              <AnimatePresence>
                {damages.filter(d => d.id === 'player').map((d, i) => (
                  <motion.div
                    key={`player-dmg-${i}`}
                    initial={{ opacity: 1, y: 0, scale: 1 }}
                    animate={{ opacity: 0, y: -30, scale: 1.3 }}
                    transition={{ duration: 0.8 }}
                    className="absolute -top-4 left-1/2 transform -translate-x-1/2 pointer-events-none"
                  >
                    <div className="text-2xl font-black text-red-400 drop-shadow-lg">-{d.damage}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Health Bar */}
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-xs text-cyan-300/70 uppercase tracking-wide">HP</span>
                <span className="text-xs font-mono text-cyan-200">{playerHp}/{playerStats.maxHp}</span>
              </div>
              <div className="relative h-6 bg-slate-900/50 rounded-full border border-cyan-500/30 overflow-hidden shadow-inner">
                <motion.div
                  className={`h-full rounded-full shadow-lg ${
                    playerHp / playerStats.maxHp > 0.5
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-cyan-500/50'
                      : playerHp / playerStats.maxHp > 0.25
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 shadow-yellow-500/50'
                        : 'bg-gradient-to-r from-red-600 to-red-500 shadow-red-500/50'
                  }`}
                  initial={{ width: '100%' }}
                  animate={{ width: `${(playerHp / playerStats.maxHp) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            {/* Active Status Effects */}
            <AnimatePresence>
              {playerEffects.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4"
                >
                  <div className="text-xs text-slate-400 uppercase tracking-widest mb-2">Effects</div>
                  <div className="flex flex-wrap gap-1.5">
                    {playerEffects.filter(e => e.type !== 'defend').map((effect, i) => (
                      <StatusEffectBadge key={`${effect.type}-${i}`} effect={effect} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
                const hasEffectFlash = effectFlashes.some(f => f.id === enemy.id);
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
                    } ${hasEffectFlash ? 'ring-2 ring-white/30' : ''}`}
                  >
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-orange-600/10 to-red-600/20 group-hover:from-red-600/30 group-hover:via-orange-600/20 group-hover:to-red-600/30 transition-all duration-300" />
                    <div className="absolute inset-0 backdrop-blur-xl bg-slate-900/40" />

                    {/* Border */}
                    <div className="absolute inset-0 border border-red-500/30 rounded-2xl group-hover:border-red-500/50 transition-all" />

                    {/* DoT ambient effects */}
                    {enemy.effects?.some(e => e.type === 'poison') && (
                      <div className="absolute inset-0 bg-green-500/5 animate-pulse rounded-2xl" />
                    )}
                    {enemy.effects?.some(e => e.type === 'burn') && (
                      <div className="absolute inset-0 bg-orange-500/5 animate-pulse rounded-2xl" />
                    )}
                    {enemy.effects?.some(e => e.type === 'bleed') && (
                      <div className="absolute inset-0 bg-red-500/5 animate-pulse rounded-2xl" />
                    )}

                    {/* Content */}
                    <div className="relative p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="text-4xl relative">
                            👹
                            {enemy.effects?.some(e => e.type === 'stun') && (
                              <motion.div
                                animate={{ rotate: [0, 15, -15, 0] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className="absolute -top-2 -right-2 text-xl"
                              >
                                💫
                              </motion.div>
                            )}
                          </div>
                          <div className="text-left">
                            <h3 className="text-lg font-bold text-red-200">{enemy.name}</h3>
                            <p className="text-xs text-red-300/60">{enemy.type || 'Unknown'}</p>
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

                      {/* Enemy Status Effects */}
                      <AnimatePresence>
                        {enemy.effects && enemy.effects.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 flex flex-wrap gap-1.5"
                          >
                            {enemy.effects.filter(e => e.type !== 'defend').map((effect, i) => (
                              <StatusEffectBadge key={`${effect.type}-${i}`} effect={effect} />
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
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
                          <div className={`text-3xl font-black drop-shadow-lg ${
                            damage.type === 'crit' ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            -{damage.damage}{damage.type === 'crit' ? '!' : ''}
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
              {/* Attack Button */}
              <motion.button
                whileHover={{ scale: inCombat && !isAttacking && !isPlayerStunned ? 1.05 : 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAttack}
                disabled={!inCombat || isAttacking || isPlayerStunned}
                className="w-full relative group overflow-hidden rounded-xl py-4 px-4 font-bold text-white uppercase tracking-wide text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 group-hover:from-red-500 group-hover:to-orange-500 transition-all" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/10 transition-all" />
                <div className="relative flex items-center justify-center gap-2">
                  {isPlayerStunned ? '💫 Stunned!' : isAttacking ? '⚡ Attacking...' : '⚡ Attack'}
                </div>
              </motion.button>

              {/* Defend Button */}
              <motion.button
                whileHover={{ scale: inCombat && !isAttacking && !isPlayerStunned ? 1.05 : 1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDefend}
                disabled={!inCombat || isAttacking || isPlayerStunned}
                className="w-full relative group overflow-hidden rounded-xl py-4 px-4 font-bold text-white uppercase tracking-wide text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 group-hover:from-blue-500 group-hover:to-cyan-500 transition-all" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/10 transition-all" />
                <div className="relative">🛡️ Defend</div>
              </motion.button>

              {/* Flee Button */}
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
              className="text-center mt-4"
            >
              {inCombat ? (
                <div className={`inline-block px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide ${
                  isPlayerStunned
                    ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-300'
                    : 'bg-red-500/20 border border-red-500/50 text-red-300'
                }`}>
                  {isPlayerStunned ? '💫 STUNNED' : '⚔️ IN COMBAT'}
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

        {/* Combat Log */}
        {combatPhase !== 'approach' && combatLog.length > 0 && (
          <CombatLog messages={combatLog} />
        )}
      </div>
    </div>
  );
}
