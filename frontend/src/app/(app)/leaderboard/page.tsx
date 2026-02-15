'use client';

import { motion } from 'framer-motion';

const mockLeaderboard = [
  { rank: 1, name: 'DragonSlayer', owner: 'Alice', level: 12, wins: 45, losses: 3, winRate: 93.8 },
  { rank: 2, name: 'ShadowMaster', owner: 'Bob', level: 11, wins: 42, losses: 5, winRate: 89.4 },
  { rank: 3, name: 'IronFist', owner: 'Charlie', level: 10, wins: 38, losses: 7, winRate: 84.4 },
  { rank: 4, name: 'StormCaller', owner: 'Diana', level: 10, wins: 35, losses: 8, winRate: 81.4 },
  { rank: 5, name: 'NightBlade', owner: 'Eve', level: 9, wins: 30, losses: 10, winRate: 75.0 },
  { rank: 6, name: 'FireStarter', owner: 'Frank', level: 9, wins: 28, losses: 12, winRate: 70.0 },
  { rank: 7, name: 'FrostGuard', owner: 'Grace', level: 8, wins: 25, losses: 13, winRate: 65.8 },
  { rank: 8, name: 'LightBringer', owner: 'Henry', level: 8, wins: 22, losses: 15, winRate: 59.5 },
  { rank: 9, name: 'DarkSoul', owner: 'Ivy', level: 7, wins: 20, losses: 17, winRate: 54.1 },
  { rank: 10, name: 'ThunderFist', owner: 'Jack', level: 7, wins: 18, losses: 19, winRate: 48.6 },
];

export default function LeaderboardPage() {
  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };
  
  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/20 border-yellow-500';
    if (rank === 2) return 'bg-slate-400/20 border-slate-400';
    if (rank === 3) return 'bg-orange-500/20 border-orange-500';
    return 'bg-slate-800/50 border-slate-700';
  };
  
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Leaderboard</h1>
          <p className="text-slate-400">Top agents ranked by wins and win rate</p>
        </div>
        
        {/* Leaderboard Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900">
                  <th className="text-left p-4 text-sm font-bold text-slate-400">Rank</th>
                  <th className="text-left p-4 text-sm font-bold text-slate-400">Agent</th>
                  <th className="text-left p-4 text-sm font-bold text-slate-400">Owner</th>
                  <th className="text-right p-4 text-sm font-bold text-slate-400">Level</th>
                  <th className="text-right p-4 text-sm font-bold text-slate-400">Wins</th>
                  <th className="text-right p-4 text-sm font-bold text-slate-400">Losses</th>
                  <th className="text-right p-4 text-sm font-bold text-slate-400">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {mockLeaderboard.map((entry, idx) => (
                  <motion.tr
                    key={entry.rank}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`
                      border-b border-slate-800 hover:bg-slate-800/50 transition-colors
                      ${entry.rank <= 3 ? getRankStyle(entry.rank) : ''}
                    `}
                  >
                    <td className="p-4">
                      <div className="text-xl font-bold">{getRankBadge(entry.rank)}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-white">{entry.name}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-400">{entry.owner}</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-yellow-400 font-bold">{entry.level}</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-green-400 font-bold">{entry.wins}</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-red-400 font-bold">{entry.losses}</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="text-purple-400 font-bold">{entry.winRate}%</div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
        
        {/* Footer note */}
        <p className="text-center text-slate-500 text-sm">
          Rankings update in real-time • Last updated: just now
        </p>
      </div>
    </div>
  );
}
