'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import BattleScene3D from '@/components/Battle/BattleScene3D';

interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
}

interface LootItem {
  id: string;
  name: string;
  type: string;
  rarity: string;
  stats: any;
}

interface LootMaterial {
  materialId: string;
  quantity: number;
}

interface DungeonEncounterProps {
  dungeonId: string;
  playerStats: any;
  onWin: () => void;
  onFlee: () => void;
}

const ENEMY_ICONS: Record<string, string> = {
  goblin: '👹',
  skeleton: '💀',
  orc: '🗡️',
  wraith: '👻',
  boss_skeleton: '☠️',
  boss_dragon: '🐉',
  boss_lich: '🧙'
};

export default function DungeonEncounter({
  dungeonId,
  playerStats,
  onWin,
  onFlee
}: DungeonEncounterProps) {
  const { socket } = useSocket();
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [playerHp, setPlayerHp] = useState(playerStats.hp);
  const [loading, setLoading] = useState(false);
  const [battleLog, setBattleLog] = useState<string[]>(['Battle started!']);
  const [combatOver, setCombatOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [rewards, setRewards] = useState<{ gold: number; xp: number; items: LootItem[]; materials: LootMaterial[]; levelUp: boolean; newLevel: number } | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('encounter_started', (data: any) => {
      setEnemies(data.enemies);
      if (data.enemies.length > 0) {
        setSelectedTarget(data.enemies[0].id);
      }
    });

    socket.on('turn_result', (data: any) => {
      setBattleLog(prev => [
        ...prev,
        `You dealt ${data.playerDamage} damage!`
      ]);
      setEnemies(data.enemies);
      setLoading(false);
    });

    socket.on('encounter_won', (data: any) => {
      setBattleLog(prev => [...prev, '🎉 Victory! You defeated all enemies!']);
      setRewards({
        gold: data.gold,
        xp: data.xp,
        items: data.items || [],
        materials: data.materials || [],
        levelUp: data.levelUp,
        newLevel: data.newLevel
      });
      setVictory(true);
      setCombatOver(true);
    });

    socket.on('fled_successfully', () => {
      setBattleLog(prev => [...prev, '🏃 You fled successfully!']);
      setCombatOver(true);
    });

    socket.on('fled_failed', () => {
      setBattleLog(prev => [...prev, '❌ Flee failed! Enemies blocked your escape!']);
      setLoading(false);
    });

    socket.on('dungeon_error', (data: any) => {
      alert(data.message);
      setLoading(false);
    });

    return () => {
      socket.off('encounter_started');
      socket.off('turn_result');
      socket.off('encounter_won');
      socket.off('fled_successfully');
      socket.off('fled_failed');
      socket.off('dungeon_error');
    };
  }, [socket]);

  const handleAction = (action: string) => {
    if (!selectedTarget || loading) return;

    setLoading(true);
    socket?.emit('dungeon_action', {
      dungeonId,
      action,
      targetId: selectedTarget
    });
  };

  const handleFlee = () => {
    setLoading(true);
    socket?.emit('flee_encounter');
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-4xl font-bold text-white mb-6"
        >
          ⚔️ Battle!
        </motion.h1>

        {/* 3D Battle Scene */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6"
        >
          <BattleScene3D enemies={enemies} />
        </motion.div>

        {/* Enemies */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8 grid grid-cols-2 gap-4"
        >
          {enemies.map((enemy) => (
            <motion.button
              key={enemy.id}
              onClick={() => setSelectedTarget(enemy.id)}
              whileHover={{ scale: 1.05 }}
              className={`p-6 rounded-lg border-2 transition-all ${
                selectedTarget === enemy.id
                  ? 'border-red-500 bg-red-500/20'
                  : 'border-purple-500/30 bg-purple-900/10 hover:border-purple-400'
              }`}
            >
              <div className="text-5xl mb-2">{ENEMY_ICONS[enemy.name.toLowerCase()] || '👹'}</div>
              <p className="text-white font-bold text-lg">{enemy.name}</p>
              <div className="w-full h-3 bg-slate-800 rounded overflow-hidden border border-red-500/30 mt-2">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-orange-600 transition-all"
                  style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                />
              </div>
              <p className="text-red-300 text-xs mt-1">{enemy.hp} / {enemy.maxHp} HP</p>
            </motion.button>
          ))}
        </motion.div>

        {/* Player Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6 mb-8"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Your Health</h2>
            <p className="text-purple-300">{playerHp} / {playerStats.maxHp}</p>
          </div>
          <div className="w-full h-6 bg-slate-800 rounded overflow-hidden border border-purple-500/30">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
              style={{ width: `${(playerHp / playerStats.maxHp) * 100}%` }}
            />
          </div>
        </motion.div>

        {/* Battle Log */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 mb-8 max-h-48 overflow-y-auto"
        >
          <h3 className="text-lg font-bold text-white mb-2">Battle Log</h3>
          <div className="space-y-1">
            {battleLog.map((log, idx) => (
              <motion.p
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-slate-300 text-sm"
              >
                → {log}
              </motion.p>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        {!combatOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-4 gap-3"
          >
            <button
              onClick={() => handleAction('attack')}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-bold py-4 px-6 rounded-lg transition-all"
            >
              ⚔️ Attack
            </button>
            <button
              onClick={() => handleAction('defend')}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-bold py-4 px-6 rounded-lg transition-all"
            >
              🛡️ Defend
            </button>
            <button
              onClick={() => handleAction('ability')}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white font-bold py-4 px-6 rounded-lg transition-all"
            >
              ✨ Ability
            </button>
            <button
              onClick={handleFlee}
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-600/50 text-white font-bold py-4 px-6 rounded-lg transition-all"
            >
              🏃 Flee
            </button>
          </motion.div>
        )}

        {/* Battle Over */}
        {combatOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-8 rounded-lg border-2 ${
              victory
                ? 'bg-green-500/20 border-green-500'
                : 'bg-amber-500/20 border-amber-500'
            }`}
          >
            <p className="text-3xl font-bold text-white mb-6 text-center">
              {victory ? '🎉 Victory!' : '✨ Escaped!'}
            </p>

            {/* Rewards */}
            {rewards && (
              <div className="space-y-4 mb-6">
                {/* Gold & XP */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4"
                  >
                    <p className="text-yellow-300 text-sm mb-1">Gold</p>
                    <p className="text-2xl font-bold text-yellow-400">+{rewards.gold}</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-blue-500/20 border border-blue-500 rounded-lg p-4"
                  >
                    <p className="text-blue-300 text-sm mb-1">Experience</p>
                    <p className="text-2xl font-bold text-blue-400">+{rewards.xp}</p>
                  </motion.div>
                </div>

                {/* Level Up */}
                {rewards.levelUp && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-purple-500/30 border-2 border-purple-400 rounded-lg p-4 text-center"
                  >
                    <p className="text-purple-300 text-sm mb-1">⭐ LEVEL UP!</p>
                    <p className="text-3xl font-bold text-purple-400">Level {rewards.newLevel}</p>
                  </motion.div>
                )}

                {/* Items */}
                {rewards.items.length > 0 && (
                  <div>
                    <p className="text-purple-300 text-sm mb-2 font-bold">Items Dropped:</p>
                    <div className="space-y-2">
                      {rewards.items.map((item, idx) => {
                        const rarityColors: Record<string, string> = {
                          common: 'border-gray-500 bg-gray-500/10',
                          uncommon: 'border-green-500 bg-green-500/10',
                          rare: 'border-blue-500 bg-blue-500/10',
                          epic: 'border-purple-500 bg-purple-500/10',
                          legendary: 'border-yellow-500 bg-yellow-500/10'
                        };
                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + idx * 0.1 }}
                            className={`border rounded-lg p-3 ${rarityColors[item.rarity] || rarityColors.common}`}
                          >
                            <p className="text-white font-bold">{item.name}</p>
                            <p className="text-xs text-slate-300 capitalize">{item.type}</p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Materials */}
                {rewards.materials.length > 0 && (
                  <div>
                    <p className="text-orange-300 text-sm mb-2 font-bold">Materials Collected:</p>
                    <div className="space-y-2">
                      {rewards.materials.map((mat, idx) => (
                        <motion.div
                          key={mat.materialId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + idx * 0.1 }}
                          className="border border-orange-500 bg-orange-500/10 rounded-lg p-3"
                        >
                          <p className="text-white font-bold text-sm">{mat.materialId}</p>
                          <p className="text-xs text-orange-300">x{mat.quantity}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={victory ? onWin : onFlee}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-8 rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all"
            >
              Continue Exploring
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
