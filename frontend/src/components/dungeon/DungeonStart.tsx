'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';

interface DungeonStartProps {
  onStart: (dungeonId: string, difficulty: string, playerStats: any) => void;
}

export default function DungeonStart({ onStart }: DungeonStartProps) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch available agents
    const fetchAgents = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/agents/me/current`);
        if (response.data) {
          setAgents([response.data]);
          setSelectedAgent(response.data.id);
        }
      } catch (error) {
        console.error('Failed to fetch agents:', error);
      }
    };

    if (user) {
      fetchAgents();
    }
  }, [user]);

  const handleStartDungeon = () => {
    if (!selectedAgent || !socket || !user) return;

    setLoading(true);

    socket.emit('start_dungeon', {
      userId: user.id,
      agentId: selectedAgent
    });

    socket.on('dungeon_started', (data: any) => {
      setLoading(false);
      onStart(data.dungeonId, data.difficulty, data.playerStats);
    });

    socket.on('dungeon_error', (data: any) => {
      setLoading(false);
      alert(data.message);
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-bold text-white mb-4"
          >
            🏰 Descend into Darkness
          </motion.h1>
          <p className="text-purple-300 text-lg">
            Begin your journey into the depths of the dungeon
          </p>
        </div>

        {/* Agent Selection */}
        {agents.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8 p-6 rounded-lg bg-purple-900/20 border border-purple-500/30"
          >
            <h2 className="text-xl font-bold text-white mb-4">Selected Agent</h2>
            <div className="flex items-center gap-4">
              <div className="text-4xl">{agents[0]?.class === 'warrior' ? '⚔️' : '✨'}</div>
              <div>
                <p className="text-white font-bold text-lg">{agents[0]?.name}</p>
                <p className="text-purple-300">Level {agents[0]?.level} {agents[0]?.class}</p>
                <p className="text-purple-400 text-sm">HP: {agents[0]?.current_hp}/{agents[0]?.max_hp}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={handleStartDungeon}
            disabled={!selectedAgent || loading}
            className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${loading
                ? 'bg-purple-600/50 text-purple-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/50'
              }`}
          >
            {loading ? '🌀 Descending...' : '⚔️ Descend into the Depths'}
          </button>
        </motion.div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 p-4 rounded-lg bg-slate-900/50 border border-slate-700"
        >
          <p className="text-slate-300 text-sm mb-2">
            💡 <strong>How Depths Work:</strong>
          </p>
          <ul className="text-slate-400 text-sm space-y-1">
            <li>• Start at Floor 1 (Easy) and progress deeper</li>
            <li>• Difficulty auto-scales: Each floor gets harder and grants more rewards</li>
            <li>• From Floor 5 onwards, discover branching paths to special zones</li>
            <li>• Special zones offer rare enemies, legendary materials, and unique rewards</li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
}
