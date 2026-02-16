'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Flame, Shield, Zap, Brain, Heart, Swords, ChevronRight } from 'lucide-react';

const mockAgent = {
  name: 'Shadow Striker',
  level: 5,
  class: 'Rogue',
  type: 'rogue',
  hp: 150,
  maxHp: 150,
  might: 18,
  fortitude: 11,
  agility: 15,
  arcana: 8,
  wins: 12,
  losses: 3,
  elo: 1847,
};

const mockBattles = [
  { id: 1, opponent: 'Fire Mage', result: 'win', xp: 45, gold: 120, date: '2 hours ago' },
  { id: 2, opponent: 'Stone Golem', result: 'win', xp: 50, gold: 95, date: '5 hours ago' },
  { id: 3, opponent: 'Dark Knight', result: 'loss', xp: 15, gold: 30, date: '1 day ago' },
  { id: 4, opponent: 'Frost Archer', result: 'win', xp: 40, gold: 110, date: '1 day ago' },
  { id: 5, opponent: 'Lightning Sage', result: 'win', xp: 55, gold: 140, date: '2 days ago' },
];

const typeConfig: Record<string, { icon: string; color: string }> = {
  warrior: { icon: '⚔️', color: 'text-fire' },
  rogue: { icon: '🗡️', color: 'text-venom' },
  mage: { icon: '✦', color: 'text-ice' },
  tank: { icon: '🛡️', color: 'text-arcane' },
};

const stats = [
  { label: 'VITALITY', value: `${mockAgent.hp}/${mockAgent.maxHp}`, icon: Heart, color: 'text-venom', bgColor: 'bg-venom/10', borderColor: 'border-venom/20' },
  { label: 'MIGHT', value: mockAgent.might, icon: Flame, color: 'text-fire', bgColor: 'bg-fire/10', borderColor: 'border-fire/20' },
  { label: 'FORTITUDE', value: mockAgent.fortitude, icon: Shield, color: 'text-ice', bgColor: 'bg-ice/10', borderColor: 'border-ice/20' },
  { label: 'AGILITY', value: mockAgent.agility, icon: Zap, color: 'text-gold', bgColor: 'bg-gold/10', borderColor: 'border-gold/20' },
  { label: 'ARCANA', value: mockAgent.arcana, icon: Brain, color: 'text-arcane', bgColor: 'bg-arcane/10', borderColor: 'border-arcane/20' },
];

export default function DashboardPage() {
  const winRate = ((mockAgent.wins / (mockAgent.wins + mockAgent.losses)) * 100).toFixed(0);
  const config = typeConfig[mockAgent.type];
  
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-5xl font-bold text-[#e8e6e3] tracking-wide">
            War Room
          </h1>
          <p className="text-[#9ca3af] italic mt-2">Your champion awaits orders</p>
          <div className="divider-gold max-w-xs mt-4" />
        </motion.div>
        
        {/* Agent Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="game-card p-8"
        >
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className={`text-2xl ${config.color}`}>{config.icon}</span>
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-arena-elevated text-[#9ca3af] border border-border-warm">
                  {mockAgent.class}
                </span>
              </div>
              <h2 className="font-display text-3xl font-bold text-[#e8e6e3]">{mockAgent.name}</h2>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-gold-bright font-bold">Level {mockAgent.level}</span>
                <span className="text-[#6b7280]">•</span>
                <span className="font-mono text-sm text-gold">{mockAgent.elo} ELO</span>
              </div>
            </div>
            
            {/* Agent visual */}
            <div className="w-24 h-24 rounded-full bg-arena-elevated border-2 border-gold-dim flex items-center justify-center shadow-lg shadow-gold/10">
              <span className="text-5xl">{config.icon}</span>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-5 gap-3 mb-6">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={`rounded-lg p-3 ${stat.bgColor} border ${stat.borderColor} transition-all hover:scale-105`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon size={12} className={stat.color} />
                    <span className="text-[10px] uppercase tracking-widest text-[#6b7280] font-bold">{stat.label}</span>
                  </div>
                  <div className={`font-mono text-xl font-bold ${stat.color}`}>{stat.value}</div>
                </div>
              );
            })}
          </div>
          
          {/* Win/Loss Record */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-venom font-mono font-bold text-lg">{mockAgent.wins}</span>
              <span className="badge-win">W</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blood font-mono font-bold text-lg">{mockAgent.losses}</span>
              <span className="badge-loss">L</span>
            </div>
            <div className="h-4 w-px bg-border-warm" />
            <span className="font-mono text-gold font-bold">{winRate}% WR</span>
          </div>
        </motion.div>
        
        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link
              href="/arena"
              className="group game-card flex items-center gap-6 p-6 border-fire/20 hover:border-fire/40 hover:shadow-fire/10"
            >
              <div className="w-14 h-14 rounded-lg bg-fire/10 border border-fire/20 flex items-center justify-center group-hover:bg-fire/20 transition-colors">
                <Swords size={28} className="text-fire" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl font-bold text-[#e8e6e3] group-hover:text-fire transition-colors">
                  ENTER THE DEPTHS
                </h3>
                <p className="text-[#6b7280] text-sm mt-0.5">Descend into the arena. Fight. Survive.</p>
              </div>
              <ChevronRight size={20} className="text-[#6b7280] group-hover:text-fire transition-colors" />
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Link
              href="/inventory"
              className="group game-card flex items-center gap-6 p-6 border-gold-dim/30 hover:border-gold-dim hover:shadow-gold/10"
            >
              <div className="w-14 h-14 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                <Shield size={28} className="text-gold" />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl font-bold text-[#e8e6e3] group-hover:text-gold transition-colors">
                  VISIT THE ARMORY
                </h3>
                <p className="text-[#6b7280] text-sm mt-0.5">Forge your legend. Wield ancient relics.</p>
              </div>
              <ChevronRight size={20} className="text-[#6b7280] group-hover:text-gold transition-colors" />
            </Link>
          </motion.div>
        </div>
        
        {/* Battle Chronicle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="game-card p-6"
        >
          <h3 className="font-display text-xl font-semibold text-gold uppercase tracking-wider mb-4">
            Battle Chronicle
          </h3>
          <div className="divider-gold mb-4" />
          
          <div className="space-y-2">
            {mockBattles.map((battle, idx) => (
              <motion.div
                key={battle.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + idx * 0.05 }}
                className="flex items-center justify-between bg-arena-elevated/50 rounded-lg p-3 hover:bg-arena-elevated transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-1.5 h-8 rounded-full ${battle.result === 'win' ? 'bg-venom' : 'bg-blood'}`} />
                  <div>
                    <div className="text-[#e8e6e3] font-medium group-hover:text-gold transition-colors">
                      vs {battle.opponent}
                    </div>
                    <div className="text-xs text-[#6b7280]">{battle.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gold font-mono text-sm font-bold">+{battle.xp} XP</span>
                  <span className={battle.result === 'win' ? 'badge-win' : 'badge-loss'}>
                    {battle.result === 'win' ? 'VICTORY' : 'DEFEAT'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
      </div>
    </div>
  );
}
