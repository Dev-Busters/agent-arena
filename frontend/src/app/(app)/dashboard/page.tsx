'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

// Mock data - will be replaced with real API data in Phase F
const mockAgent = {
  name: 'Shadow Striker',
  level: 5,
  class: 'Rogue',
  hp: 150,
  maxHp: 150,
  attack: 18,
  defense: 11,
  speed: 15,
  wins: 12,
  losses: 3,
};

const mockBattles = [
  { id: 1, opponent: 'Fire Mage', result: 'win', xp: 45, date: '2 hours ago' },
  { id: 2, opponent: 'Stone Golem', result: 'win', xp: 50, date: '5 hours ago' },
  { id: 3, opponent: 'Dark Knight', result: 'loss', xp: 15, date: '1 day ago' },
  { id: 4, opponent: 'Frost Archer', result: 'win', xp: 40, date: '1 day ago' },
  { id: 5, opponent: 'Lightning Sage', result: 'win', xp: 55, date: '2 days ago' },
];

export default function DashboardPage() {
  const winRate = ((mockAgent.wins / (mockAgent.wins + mockAgent.losses)) * 100).toFixed(0);
  
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Manage your agent and view your progress</p>
        </div>
        
        {/* Agent Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">{mockAgent.name}</h2>
              <p className="text-purple-400">Level {mockAgent.level} {mockAgent.class}</p>
            </div>
            <div className="text-6xl">🗡️</div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-500 uppercase mb-1">HP</div>
              <div className="text-lg font-bold text-green-400">{mockAgent.hp}/{mockAgent.maxHp}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-500 uppercase mb-1">Attack</div>
              <div className="text-lg font-bold text-red-400">{mockAgent.attack}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-500 uppercase mb-1">Defense</div>
              <div className="text-lg font-bold text-blue-400">{mockAgent.defense}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-500 uppercase mb-1">Speed</div>
              <div className="text-lg font-bold text-yellow-400">{mockAgent.speed}</div>
            </div>
          </div>
          
          {/* Win/Loss */}
          <div className="flex items-center gap-6 text-sm">
            <div>
              <span className="text-slate-500">Wins:</span>
              <span className="text-green-400 font-bold ml-2">{mockAgent.wins}</span>
            </div>
            <div>
              <span className="text-slate-500">Losses:</span>
              <span className="text-red-400 font-bold ml-2">{mockAgent.losses}</span>
            </div>
            <div>
              <span className="text-slate-500">Win Rate:</span>
              <span className="text-purple-400 font-bold ml-2">{winRate}%</span>
            </div>
          </div>
        </motion.div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/arena"
            className="group bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 hover:shadow-xl hover:shadow-purple-500/50 transition-all"
          >
            <div className="text-3xl mb-2">⚔️</div>
            <h3 className="text-xl font-bold text-white mb-1">Enter Arena</h3>
            <p className="text-purple-100 text-sm">Fight waves of enemies and level up</p>
          </Link>
          
          <Link
            href="/inventory"
            className="group bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl p-6 hover:shadow-xl hover:shadow-blue-500/50 transition-all"
          >
            <div className="text-3xl mb-2">📦</div>
            <h3 className="text-xl font-bold text-white mb-1">Manage Equipment</h3>
            <p className="text-blue-100 text-sm">Equip items and optimize your build</p>
          </Link>
        </div>
        
        {/* Recent Battles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">Recent Battles</h3>
          <div className="space-y-2">
            {mockBattles.map((battle) => (
              <div
                key={battle.id}
                className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3 hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-2 h-2 rounded-full ${battle.result === 'win' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <div className="text-white font-medium">vs {battle.opponent}</div>
                    <div className="text-xs text-slate-500">{battle.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-blue-400 text-sm">+{battle.xp} XP</div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    battle.result === 'win' 
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {battle.result.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
