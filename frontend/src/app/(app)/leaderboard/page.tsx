'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Swords, Mountain, Coins, Search } from 'lucide-react';

const mockLeaderboard = [
  { rank: 1, name: 'DragonSlayer', owner: '@alice', level: 12, elo: 2847, wins: 45, losses: 3, winRate: 93.8, type: 'warrior' },
  { rank: 2, name: 'ShadowMaster', owner: '@bob', level: 11, elo: 2691, wins: 42, losses: 5, winRate: 89.4, type: 'rogue' },
  { rank: 3, name: 'IronFist', owner: '@charlie', level: 10, elo: 2534, wins: 38, losses: 7, winRate: 84.4, type: 'tank' },
  { rank: 4, name: 'StormCaller', owner: '@diana', level: 10, elo: 2412, wins: 35, losses: 8, winRate: 81.4, type: 'mage' },
  { rank: 5, name: 'NightBlade', owner: '@eve', level: 9, elo: 2287, wins: 30, losses: 10, winRate: 75.0, type: 'rogue' },
  { rank: 6, name: 'FireStarter', owner: '@frank', level: 9, elo: 2156, wins: 28, losses: 12, winRate: 70.0, type: 'mage' },
  { rank: 7, name: 'FrostGuard', owner: '@grace', level: 8, elo: 2034, wins: 25, losses: 13, winRate: 65.8, type: 'tank' },
  { rank: 8, name: 'LightBringer', owner: '@henry', level: 8, elo: 1923, wins: 22, losses: 15, winRate: 59.5, type: 'warrior' },
  { rank: 9, name: 'DarkSoul', owner: '@ivy', level: 7, elo: 1845, wins: 20, losses: 17, winRate: 54.1, type: 'rogue' },
  { rank: 10, name: 'ThunderFist', owner: '@jack', level: 7, elo: 1756, wins: 18, losses: 19, winRate: 48.6, type: 'warrior' },
];

const sortTabs = [
  { id: 'elo', label: 'ELO Rating', icon: Trophy },
  { id: 'wins', label: 'Total Wins', icon: Swords },
  { id: 'floor', label: 'Deepest Floor', icon: Mountain },
  { id: 'gold', label: 'Gold Earned', icon: Coins },
];

const typeConfig: Record<string, { icon: string; color: string }> = {
  warrior: { icon: '⚔️', color: 'text-fire' },
  rogue: { icon: '🗡️', color: 'text-venom' },
  mage: { icon: '✦', color: 'text-ice' },
  tank: { icon: '🛡️', color: 'text-arcane' },
};

function PodiumCard({ entry, position }: { entry: typeof mockLeaderboard[0]; position: 'first' | 'second' | 'third' }) {
  const config = typeConfig[entry.type];
  const isFirst = position === 'first';
  
  const borderColor = position === 'first' ? 'border-gold' 
    : position === 'second' ? 'border-[#9ca3af]' 
    : 'border-fire';
  
  const glowColor = position === 'first' ? 'shadow-gold/20' 
    : position === 'second' ? 'shadow-white/10' 
    : 'shadow-fire/15';
  
  const badge = position === 'first' ? '👑' 
    : position === 'second' ? '🥈' 
    : '🥉';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: position === 'first' ? 0.1 : position === 'second' ? 0.2 : 0.3 }}
      className={`
        game-card p-6 text-center flex flex-col items-center gap-3
        border ${borderColor} shadow-lg ${glowColor}
        ${isFirst ? 'scale-105 -mt-4' : ''}
      `}
    >
      {/* Badge */}
      <span className="text-3xl">{badge}</span>
      
      {/* Agent icon */}
      <div className={`w-16 h-16 rounded-full bg-arena-elevated border-2 ${borderColor} flex items-center justify-center`}>
        <span className={`text-2xl ${config.color}`}>{config.icon}</span>
      </div>
      
      {/* Name */}
      <div>
        <h3 className="font-display text-xl font-bold text-[#e8e6e3]">{entry.name}</h3>
        <p className="text-[#6b7280] text-sm">{entry.owner}</p>
      </div>
      
      {/* ELO — big gold number */}
      <div className="font-mono text-3xl font-bold text-gold-bright">{entry.elo.toLocaleString()}</div>
      
      {/* Stats row */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-[#9ca3af]">Lv.{entry.level}</span>
        <span className="text-venom font-bold">{entry.wins}W</span>
        <span className="text-blood font-bold">{entry.losses}L</span>
        <span className="text-gold">{entry.winRate}%</span>
      </div>
    </motion.div>
  );
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('elo');
  const top3 = mockLeaderboard.slice(0, 3);
  const rest = mockLeaderboard.slice(3);
  
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <span className="text-6xl">🏆</span>
          <h1 className="font-display text-5xl font-bold text-[#e8e6e3] tracking-wide">
            Hall of Champions
          </h1>
          <p className="text-[#9ca3af] italic text-lg">
            The greatest warriors to descend into the depths
          </p>
          <div className="divider-gold max-w-xs mx-auto mt-4" />
        </motion.div>
        
        {/* Sort Tabs */}
        <div className="flex justify-center gap-2">
          {sortTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-gold/10 text-gold border border-gold/30' 
                    : 'text-[#6b7280] hover:text-[#e8e6e3] hover:bg-arena-elevated border border-transparent'
                  }
                `}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
        
        {/* Agent Type Filters + Search */}
        <div className="flex justify-center items-center gap-4">
          <div className="flex gap-2">
            {Object.entries(typeConfig).map(([type, config]) => (
              <button
                key={type}
                className="w-10 h-10 rounded-lg bg-arena-card border border-border-warm hover:border-gold-dim flex items-center justify-center text-lg transition-all hover:bg-arena-elevated"
                title={type.charAt(0).toUpperCase() + type.slice(1)}
              >
                {config.icon}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
            <input
              type="text"
              placeholder="Search champions..."
              className="pl-9 pr-4 py-2 bg-arena-card border border-border-warm rounded-lg text-sm text-[#e8e6e3] placeholder-[#6b7280] focus:border-gold-dim focus:outline-none transition-colors w-56"
            />
          </div>
        </div>
        
        {/* TOP 3 PODIUM */}
        <div className="grid grid-cols-3 gap-6 items-end">
          {/* #2 — Left */}
          <PodiumCard entry={top3[1]} position="second" />
          
          {/* #1 — Center (elevated) */}
          <PodiumCard entry={top3[0]} position="first" />
          
          {/* #3 — Right */}
          <PodiumCard entry={top3[2]} position="third" />
        </div>
        
        {/* Divider */}
        <div className="divider-gold" />
        
        {/* Full Rankings Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <table className="w-full border-separate" style={{ borderSpacing: '0 4px' }}>
            <thead>
              <tr>
                <th className="text-left px-4 py-2 text-xs uppercase tracking-widest text-[#6b7280] font-body">Rank</th>
                <th className="text-left px-4 py-2 text-xs uppercase tracking-widest text-[#6b7280] font-body">Champion</th>
                <th className="text-left px-4 py-2 text-xs uppercase tracking-widest text-[#6b7280] font-body">Commander</th>
                <th className="text-right px-4 py-2 text-xs uppercase tracking-widest text-[#6b7280] font-body">ELO</th>
                <th className="text-right px-4 py-2 text-xs uppercase tracking-widest text-[#6b7280] font-body">Level</th>
                <th className="text-right px-4 py-2 text-xs uppercase tracking-widest text-[#6b7280] font-body">Record</th>
                <th className="text-right px-4 py-2 text-xs uppercase tracking-widest text-[#6b7280] font-body">Win Rate</th>
              </tr>
            </thead>
            <tbody className="stagger-children">
              {rest.map((entry, idx) => {
                const config = typeConfig[entry.type];
                return (
                  <motion.tr
                    key={entry.rank}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.05 }}
                    className="bg-arena-card hover:bg-arena-elevated transition-all duration-200 group cursor-pointer"
                  >
                    <td className="px-4 py-3 rounded-l-lg">
                      <span className="text-[#6b7280] font-mono font-bold">#{entry.rank}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`${config.color} text-lg`}>{config.icon}</span>
                        <span className="font-display font-semibold text-[#e8e6e3] group-hover:text-gold transition-colors">
                          {entry.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#6b7280]">{entry.owner}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono font-bold text-gold-bright">{entry.elo.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-[#9ca3af]">{entry.level}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-venom font-bold">{entry.wins}</span>
                      <span className="text-[#6b7280] mx-1">/</span>
                      <span className="text-blood font-bold">{entry.losses}</span>
                    </td>
                    <td className="px-4 py-3 rounded-r-lg text-right">
                      <span className={`font-mono font-bold ${entry.winRate >= 60 ? 'text-venom' : entry.winRate >= 50 ? 'text-gold' : 'text-blood'}`}>
                        {entry.winRate}%
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
        
        {/* Footer */}
        <p className="text-center text-[#6b7280] text-sm italic">
          Rankings forged in the heat of battle • Updated each dawn
        </p>
      </div>
    </div>
  );
}
