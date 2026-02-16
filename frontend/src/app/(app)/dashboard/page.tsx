'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Flame, Shield, Zap, Brain, Heart, Swords, ChevronRight, Sparkles } from 'lucide-react';

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
  { id: 1, opponent: 'Fire Mage', result: 'win', xp: 45, date: '2 hours ago' },
  { id: 2, opponent: 'Stone Golem', result: 'win', xp: 50, date: '5 hours ago' },
  { id: 3, opponent: 'Dark Knight', result: 'loss', xp: 15, date: '1 day ago' },
  { id: 4, opponent: 'Frost Archer', result: 'win', xp: 40, date: '1 day ago' },
  { id: 5, opponent: 'Lightning Sage', result: 'win', xp: 55, date: '2 days ago' },
];

const typeIcons: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  warrior: { icon: '⚔️', color: '#f97316', bg: 'radial-gradient(circle, rgba(249,115,22,0.25) 0%, rgba(249,115,22,0.08) 70%)', border: 'rgba(249,115,22,0.35)' },
  rogue:   { icon: '🗡️', color: '#22c55e', bg: 'radial-gradient(circle, rgba(34,197,94,0.25) 0%, rgba(34,197,94,0.08) 70%)',  border: 'rgba(34,197,94,0.35)' },
  mage:    { icon: '✦',  color: '#38bdf8', bg: 'radial-gradient(circle, rgba(56,189,248,0.25) 0%, rgba(56,189,248,0.08) 70%)', border: 'rgba(56,189,248,0.35)' },
  tank:    { icon: '🛡️', color: '#a855f7', bg: 'radial-gradient(circle, rgba(168,85,247,0.25) 0%, rgba(168,85,247,0.08) 70%)', border: 'rgba(168,85,247,0.35)' },
};

const stats = [
  { label: 'VITALITY', value: `${mockAgent.hp}/${mockAgent.maxHp}`, icon: Heart, color: 'text-venom', glowClass: 'text-glow-gold', gradientFrom: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.35)' },
  { label: 'MIGHT', value: mockAgent.might, icon: Flame, color: 'text-fire', glowClass: 'text-glow-fire', gradientFrom: 'rgba(249,115,22,0.06)', borderColor: 'rgba(249,115,22,0.35)' },
  { label: 'FORTITUDE', value: mockAgent.fortitude, icon: Shield, color: 'text-ice', glowClass: '', gradientFrom: 'rgba(56,189,248,0.05)', borderColor: 'rgba(56,189,248,0.28)' },
  { label: 'AGILITY', value: mockAgent.agility, icon: Zap, color: 'text-gold', glowClass: 'text-glow-gold', gradientFrom: 'rgba(250,204,21,0.05)', borderColor: 'rgba(250,204,21,0.28)' },
  { label: 'ARCANA', value: mockAgent.arcana, icon: Brain, color: 'text-arcane', glowClass: 'text-glow-arcane', gradientFrom: 'rgba(168,85,247,0.06)', borderColor: 'rgba(168,85,247,0.28)' },
];

export default function DashboardPage() {
  const winRate = ((mockAgent.wins / (mockAgent.wins + mockAgent.losses)) * 100).toFixed(0);
  const typeInfo = typeIcons[mockAgent.type];
  
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-5">
        
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-[2.75rem] font-bold tracking-wide leading-tight text-gradient-gold text-glow-gold">
            War Room
          </h1>
          <p className="text-[#92600a] italic font-display text-sm tracking-widest uppercase mt-1">
            Your champion awaits orders
          </p>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
            className="divider-gold max-w-xs mt-3 origin-left"
          />
        </motion.div>
        
        {/* Agent Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="game-card p-5"
        >
          <div className="flex items-start justify-between mb-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="text-lg" style={{ color: typeInfo.color }}>{typeInfo.icon}</span>
                <span className="px-2 py-0.5 rounded text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[#9ca3af]"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {mockAgent.class}
                </span>
              </div>
              <h2 className="font-display text-[2rem] font-bold text-[#e8e6e3] leading-tight text-shadow-sm">
                {mockAgent.name}
              </h2>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-gold-bright font-bold text-glow-gold">Level {mockAgent.level}</span>
                <span className="text-[#6b7280]">•</span>
                <span className="font-mono text-xs shimmer-gold font-bold">{mockAgent.elo} ELO</span>
              </div>
            </div>
            
            {/* Agent icon with breathe animation */}
            <motion.div
              className="rounded-full flex items-center justify-center"
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 72, height: 72,
                background: typeInfo.bg,
                border: `1.5px solid ${typeInfo.border}`,
                boxShadow: `inset 0 0 20px rgba(0,0,0,0.2), 0 0 24px rgba(0,0,0,0.3)`,
                fontSize: 32,
              }}
            >
              {typeInfo.icon}
            </motion.div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.08, ease: 'easeOut' }}
                  whileHover={{ scale: 1.04, transition: { duration: 0.2 } }}
                  className="rounded-[10px] p-3 relative overflow-hidden cursor-default"
                  style={{
                    background: `linear-gradient(135deg, ${stat.gradientFrom} 0%, rgba(15,15,25,0.9) 100%)`,
                    border: `1px solid rgba(255,255,255,0.04)`,
                    borderLeftWidth: '2px',
                    borderLeftColor: stat.borderColor,
                  }}
                >
                  <div className="flex items-center gap-1 mb-0.5">
                    <Icon size={11} className={stat.color} />
                    <span className={`text-[0.55rem] uppercase tracking-[0.12em] font-bold ${stat.color}`}>{stat.label}</span>
                  </div>
                  <div className={`font-mono text-[1.75rem] font-bold text-[#e8e6e3] leading-tight ${stat.glowClass}`}>
                    {stat.value}
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {/* Win/Loss Record */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5">
              <span className="text-venom font-mono font-bold text-base">{mockAgent.wins}</span>
              <span className="badge-win">W</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-blood font-mono font-bold text-base">{mockAgent.losses}</span>
              <span className="badge-loss">L</span>
            </div>
            <div className="h-3.5 w-px bg-white/[0.06]" />
            <span className="font-mono text-gold font-bold text-sm text-glow-gold">{winRate}% WR</span>
          </div>
        </motion.div>
        
        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link href="/arena" className="group action-card-fire flex items-center gap-5 p-5 rounded-2xl transition-all duration-300">
              <motion.div
                className="w-12 h-12 rounded-xl flex items-center justify-center relative z-10"
                whileHover={{ rotate: [0, -5, 5, 0], transition: { duration: 0.4 } }}
                style={{ background: 'rgba(249,115,22,0.12)' }}
              >
                <Swords size={24} className="text-fire" />
              </motion.div>
              <div className="flex-1 relative z-10">
                <h3 className="font-display text-lg font-bold text-[#e8e6e3] group-hover:text-gradient-fire transition-all duration-300 tracking-wide">
                  ENTER THE DEPTHS
                </h3>
                <p className="text-[#6b7280] text-xs mt-0.5">Descend into the arena. Fight. Survive.</p>
              </div>
              <motion.div
                className="relative z-10"
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ChevronRight size={18} className="text-[#6b7280] group-hover:text-fire transition-colors" />
              </motion.div>
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Link href="/inventory" className="group action-card-gold flex items-center gap-5 p-5 rounded-2xl transition-all duration-300">
              <motion.div
                className="w-12 h-12 rounded-xl flex items-center justify-center relative z-10"
                whileHover={{ rotate: [0, -5, 5, 0], transition: { duration: 0.4 } }}
                style={{ background: 'rgba(245,158,11,0.12)' }}
              >
                <Shield size={24} className="text-gold" />
              </motion.div>
              <div className="flex-1 relative z-10">
                <h3 className="font-display text-lg font-bold text-[#e8e6e3] group-hover:text-gradient-gold transition-all duration-300 tracking-wide">
                  VISIT THE ARMORY
                </h3>
                <p className="text-[#6b7280] text-xs mt-0.5">Forge your legend. Wield ancient relics.</p>
              </div>
              <ChevronRight size={18} className="text-[#6b7280] group-hover:text-gold transition-colors relative z-10" />
            </Link>
          </motion.div>
        </div>
        
        {/* Battle Chronicle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="game-card p-5"
        >
          {/* Ornamental section header */}
          <div className="ornament-header mb-3">
            <span className="text-[0.75rem] font-semibold text-gold uppercase tracking-[0.12em] whitespace-nowrap flex items-center gap-1.5">
              <Sparkles size={12} className="text-gold-dim" />
              Battle Chronicle
            </span>
          </div>
          
          <div className="space-y-1.5">
            {mockBattles.map((battle, idx) => (
              <motion.div
                key={battle.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + idx * 0.06, ease: 'easeOut' }}
                className="battle-row justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-[3px] h-8 rounded-full ${battle.result === 'win' ? 'bg-venom' : 'bg-blood'}`} />
                  <div>
                    <div className="text-[#e8e6e3] font-medium text-sm">vs <span className="font-display">{battle.opponent}</span></div>
                    <div className="text-[0.65rem] text-[#6b7280]">{battle.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gold font-mono text-xs font-semibold text-glow-gold">+{battle.xp} XP</span>
                  <span className={`font-mono text-[0.65rem] font-bold tracking-[0.08em] px-3 py-0.5 rounded ${
                    battle.result === 'win' 
                      ? 'bg-venom/[0.15] text-venom border border-venom/20'
                      : 'bg-blood/[0.15] text-blood border border-blood/20'
                  }`}>
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
