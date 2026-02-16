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

const typeConfig: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  warrior: { icon: '⚔️', color: '#f97316', bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.4)' },
  rogue:   { icon: '🗡️', color: '#22c55e', bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.4)' },
  mage:    { icon: '✦',  color: '#38bdf8', bg: 'rgba(56,189,248,0.15)', border: 'rgba(56,189,248,0.4)' },
  tank:    { icon: '🛡️', color: '#a855f7', bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.4)' },
};

function AgentIcon({ type, size = 56 }: { type: string; size?: number }) {
  const c = typeConfig[type];
  return (
    <div
      className="rounded-full flex items-center justify-center"
      style={{
        width: size, height: size,
        background: c.bg,
        border: `2px solid ${c.border}`,
        boxShadow: `inset 0 0 ${size/3}px ${c.bg}, 0 0 ${size/2}px ${c.bg}`,
        fontSize: size * 0.4,
      }}
    >
      {c.icon}
    </div>
  );
}

function PodiumCard({ entry, position }: { entry: typeof mockLeaderboard[0]; position: 'first' | 'second' | 'third' }) {
  const isFirst = position === 'first';
  const badge = position === 'first' ? '👑' : position === 'second' ? '🥈' : '🥉';
  const iconSize = isFirst ? 80 : 56;
  const eloSize = isFirst ? 'text-[2.75rem]' : 'text-[2rem]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: position === 'first' ? 0.1 : position === 'second' ? 0.2 : 0.3 }}
      className={`
        ${isFirst ? 'game-card-gold' : 'game-card'} 
        rounded-2xl text-center flex flex-col items-center
        ${isFirst ? 'py-6 px-5 -mt-6 z-10 relative' : 'py-5 px-4 opacity-85'}
      `}
    >
      <span className={isFirst ? 'text-3xl mb-2' : 'text-2xl mb-1'}>{badge}</span>
      <AgentIcon type={entry.type} size={iconSize} />
      <h3 className={`font-display font-bold text-[#e8e6e3] mt-2 ${isFirst ? 'text-xl' : 'text-base'}`}>{entry.name}</h3>
      <p className="text-[#6b7280] text-xs">{entry.owner}</p>
      <div className={`font-mono font-bold text-gold-bright mt-2 ${eloSize}`}>{entry.elo.toLocaleString()}</div>
      <div className="flex items-center gap-3 text-xs font-mono mt-1 text-[#6b7280]">
        <span>Lv.{entry.level}</span>
        <span className="text-venom">{entry.wins}W</span>
        <span className="text-blood">{entry.losses}L</span>
      </div>
    </motion.div>
  );
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('elo');
  const top3 = mockLeaderboard.slice(0, 3);
  const rest = mockLeaderboard.slice(3);
  
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-1"
        >
          <span className="text-5xl">🏆</span>
          <h1 className="font-display text-[2.75rem] font-bold text-[#e8e6e3] tracking-wide leading-tight">
            Hall of Champions
          </h1>
          <p className="text-[#92600a] italic font-display text-sm tracking-wide">
            The greatest warriors to descend into the depths
          </p>
          <div className="divider-gold max-w-xs mx-auto mt-3" />
        </motion.div>
        
        {/* Sort Tabs */}
        <div className="flex justify-center gap-1.5">
          {sortTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                  ${isActive 
                    ? 'bg-gold/10 text-gold border border-gold/20' 
                    : 'text-[#6b7280] hover:text-[#e8e6e3] hover:bg-white/[0.03] border border-transparent'
                  }
                `}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
        
        {/* Filters + Search */}
        <div className="flex justify-center items-center gap-3">
          <div className="flex gap-1.5">
            {Object.entries(typeConfig).map(([type, config]) => (
              <button
                key={type}
                className="w-9 h-9 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-gold-dim/40 flex items-center justify-center text-base transition-all hover:bg-white/[0.04]"
                title={type.charAt(0).toUpperCase() + type.slice(1)}
              >
                {config.icon}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
            <input
              type="text"
              placeholder="Search champions..."
              className="pl-8 pr-3 py-1.5 bg-white/[0.02] border border-white/[0.04] rounded-lg text-xs text-[#e8e6e3] placeholder-[#6b7280] focus:border-gold-dim/40 focus:outline-none transition-colors w-48"
            />
          </div>
        </div>
        
        {/* TOP 3 PODIUM — center card larger */}
        <div className="grid gap-4 items-end max-w-4xl mx-auto" style={{ gridTemplateColumns: '1fr 1.3fr 1fr' }}>
          <PodiumCard entry={top3[1]} position="second" />
          <PodiumCard entry={top3[0]} position="first" />
          <PodiumCard entry={top3[2]} position="third" />
        </div>
        
        {/* Divider */}
        <div className="divider-gold" />
        
        {/* Rankings Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <table className="w-full border-separate" style={{ borderSpacing: '0 3px' }}>
            <thead>
              <tr>
                {['Rank', 'Champion', 'Commander', 'ELO', 'Level', 'Record', 'Win Rate'].map((h, i) => (
                  <th key={h} className={`${i >= 3 ? 'text-right' : 'text-left'} px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.12em] text-[#6b7280] font-semibold`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rest.map((entry, idx) => {
                const config = typeConfig[entry.type];
                return (
                  <motion.tr
                    key={entry.rank}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.04 }}
                    className="group cursor-pointer transition-all duration-200"
                    style={{ background: 'rgba(255,255,255,0.02)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  >
                    <td className="px-3 py-2.5 rounded-l-lg">
                      <span className="text-[#6b7280] font-mono font-bold text-sm">#{entry.rank}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <AgentIcon type={entry.type} size={28} />
                        <span className="font-display font-semibold text-sm text-[#e8e6e3] group-hover:text-gold transition-colors">
                          {entry.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-[#6b7280] text-sm">{entry.owner}</td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="font-mono font-bold text-gold-bright text-sm">{entry.elo.toLocaleString()}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-[#9ca3af] text-sm">{entry.level}</td>
                    <td className="px-3 py-2.5 text-right text-sm">
                      <span className="text-venom font-bold font-mono">{entry.wins}</span>
                      <span className="text-[#6b7280] mx-0.5">/</span>
                      <span className="text-blood font-bold font-mono">{entry.losses}</span>
                    </td>
                    <td className="px-3 py-2.5 rounded-r-lg text-right">
                      <span className={`font-mono font-bold text-sm ${entry.winRate >= 60 ? 'text-venom' : entry.winRate >= 50 ? 'text-gold' : 'text-blood'}`}>
                        {entry.winRate}%
                      </span>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
        
        <p className="text-center text-[#6b7280] text-xs italic">
          Rankings forged in the heat of battle • Updated each dawn
        </p>
      </div>
    </div>
  );
}
