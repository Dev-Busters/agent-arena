'use client';

import { motion } from 'framer-motion';
import { Scroll, Trophy, Swords, Clock, Star } from 'lucide-react';

const mockProfile = {
  username: 'TheHarrowed',
  title: 'Depth Walker',
  joinDate: 'January 2026',
  totalBattles: 47,
  totalWins: 35,
  totalLosses: 12,
  deepestFloor: 14,
  goldEarned: 12450,
  agentsCreated: 3,
  achievements: [
    { id: 1, name: 'First Blood', desc: 'Win your first battle', icon: '⚔️', earned: true },
    { id: 2, name: 'Depth Diver', desc: 'Reach floor 10', icon: '🕳️', earned: true },
    { id: 3, name: 'Champion', desc: 'Reach top 10 on leaderboard', icon: '🏆', earned: true },
    { id: 4, name: 'Legendary Find', desc: 'Obtain a legendary item', icon: '✦', earned: false },
    { id: 5, name: 'Unbreakable', desc: 'Win 10 battles in a row', icon: '🔥', earned: false },
    { id: 6, name: 'Collector', desc: 'Own 50 unique items', icon: '💎', earned: false },
  ],
};

export default function ProfilePage() {
  const winRate = ((mockProfile.totalWins / mockProfile.totalBattles) * 100).toFixed(0);
  
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-5xl font-bold text-[#e8e6e3] tracking-wide">
            Chronicle
          </h1>
          <p className="text-[#9ca3af] italic mt-2">Your saga unfolds</p>
          <div className="divider-gold max-w-xs mt-4" />
        </motion.div>
        
        {/* Profile Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="game-card p-8"
        >
          <div className="flex items-center gap-6 mb-6">
            <div className="w-20 h-20 rounded-full bg-arena-elevated border-2 border-gold-dim flex items-center justify-center shadow-lg shadow-gold/10">
              <Scroll size={36} className="text-gold" />
            </div>
            <div>
              <h2 className="font-display text-3xl font-bold text-[#e8e6e3]">{mockProfile.username}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Star size={14} className="text-gold" />
                <span className="text-gold text-sm font-medium italic">{mockProfile.title}</span>
              </div>
              <span className="text-[#6b7280] text-xs">Champion since {mockProfile.joinDate}</span>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Battles', value: mockProfile.totalBattles, icon: Swords, color: 'text-[#e8e6e3]' },
              { label: 'Victories', value: mockProfile.totalWins, icon: Trophy, color: 'text-venom' },
              { label: 'Win Rate', value: `${winRate}%`, icon: Star, color: 'text-gold' },
              { label: 'Deepest Floor', value: mockProfile.deepestFloor, icon: Clock, color: 'text-arcane' },
              { label: 'Gold Earned', value: mockProfile.goldEarned.toLocaleString(), icon: Star, color: 'text-gold-bright' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="bg-arena-elevated/50 rounded-lg p-3 border border-border-warm">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon size={12} className="text-[#6b7280]" />
                    <span className="text-[10px] uppercase tracking-widest text-[#6b7280] font-bold">{stat.label}</span>
                  </div>
                  <div className={`font-mono text-xl font-bold ${stat.color}`}>{stat.value}</div>
                </div>
              );
            })}
          </div>
        </motion.div>
        
        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="game-card p-6"
        >
          <h3 className="font-display text-lg font-semibold text-gold uppercase tracking-wider mb-4">
            Feats of Glory
          </h3>
          <div className="divider-gold mb-4" />
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {mockProfile.achievements.map((ach, idx) => (
              <motion.div
                key={ach.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 + idx * 0.05 }}
                className={`
                  rounded-lg p-4 border transition-all
                  ${ach.earned
                    ? 'bg-gold/5 border-gold-dim/30 hover:border-gold-dim'
                    : 'bg-arena-elevated/30 border-border-warm opacity-50'
                  }
                `}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{ach.icon}</span>
                  <span className={`font-bold text-sm ${ach.earned ? 'text-[#e8e6e3]' : 'text-[#6b7280]'}`}>
                    {ach.name}
                  </span>
                </div>
                <p className="text-xs text-[#6b7280]">{ach.desc}</p>
                {ach.earned && (
                  <div className="mt-2 text-[10px] text-gold font-bold uppercase tracking-wider">✦ Earned</div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
        
      </div>
    </div>
  );
}
