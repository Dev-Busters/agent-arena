'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

/**
 * Dashboard - War Room
 * Styled to match agent-arena-visual-reference.html exactly
 */

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
];

// Class shape styles matching reference exactly
const classShapes: Record<string, { icon: string; bg: string; border: string; shadow: string }> = {
  warrior: {
    icon: '⚔️',
    bg: 'radial-gradient(circle, rgba(232, 114, 42, 0.2) 0%, rgba(232, 114, 42, 0.05) 70%)',
    border: '1.5px solid rgba(232, 114, 42, 0.35)',
    shadow: '0 0 20px rgba(232, 114, 42, 0.1)',
  },
  rogue: {
    icon: '🗡️',
    bg: 'radial-gradient(circle, rgba(61, 186, 111, 0.2) 0%, rgba(61, 186, 111, 0.05) 70%)',
    border: '1.5px solid rgba(61, 186, 111, 0.35)',
    shadow: '0 0 20px rgba(61, 186, 111, 0.1)',
  },
  mage: {
    icon: '✦',
    bg: 'radial-gradient(circle, rgba(77, 168, 218, 0.2) 0%, rgba(77, 168, 218, 0.05) 70%)',
    border: '1.5px solid rgba(77, 168, 218, 0.35)',
    shadow: '0 0 20px rgba(77, 168, 218, 0.1)',
  },
  tank: {
    icon: '🛡️',
    bg: 'radial-gradient(circle, rgba(155, 93, 229, 0.2) 0%, rgba(155, 93, 229, 0.05) 70%)',
    border: '1.5px solid rgba(155, 93, 229, 0.35)',
    shadow: '0 0 20px rgba(155, 93, 229, 0.1)',
  },
};

// Stat box styles matching reference exactly
const stats = [
  {
    label: 'Vitality',
    icon: '❤',
    value: `${mockAgent.hp}`,
    suffix: `/${mockAgent.maxHp}`,
    labelColor: 'rgba(212, 64, 64, 0.7)',
    borderColor: 'rgba(212, 64, 64, 0.5)',
    gradientFrom: 'rgba(212, 64, 64, 0.1)',
  },
  {
    label: 'Might',
    icon: '🔥',
    value: mockAgent.might,
    labelColor: 'rgba(232, 114, 42, 0.7)',
    borderColor: 'rgba(232, 114, 42, 0.5)',
    gradientFrom: 'rgba(232, 114, 42, 0.08)',
  },
  {
    label: 'Fortitude',
    icon: '◇',
    value: mockAgent.fortitude,
    labelColor: 'rgba(77, 168, 218, 0.7)',
    borderColor: 'rgba(77, 168, 218, 0.4)',
    gradientFrom: 'rgba(77, 168, 218, 0.07)',
  },
  {
    label: 'Agility',
    icon: '⚡',
    value: mockAgent.agility,
    labelColor: 'rgba(212, 168, 67, 0.6)',
    borderColor: 'rgba(212, 168, 67, 0.4)',
    gradientFrom: 'rgba(212, 168, 67, 0.07)',
  },
  {
    label: 'Arcana',
    icon: '✦',
    value: mockAgent.arcana,
    labelColor: 'rgba(155, 93, 229, 0.7)',
    borderColor: 'rgba(155, 93, 229, 0.4)',
    gradientFrom: 'rgba(155, 93, 229, 0.08)',
  },
];

export default function DashboardPage() {
  const winRate = ((mockAgent.wins / (mockAgent.wins + mockAgent.losses)) * 100).toFixed(0);
  const shape = classShapes[mockAgent.type];

  return (
    <div className="min-h-screen p-10 max-w-[1000px] mx-auto">
      {/* Page Header - Left aligned */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-7"
      >
        <h1 className="font-display text-[2.8rem] font-bold text-[#f5f0e8] tracking-wide leading-none">
          War Room
        </h1>
        <p className="font-display text-[0.8rem] font-normal tracking-[0.2em] uppercase text-[#8a6d2b] mt-2">
          Your champion awaits orders
        </p>
        <div
          className="mt-3"
          style={{
            width: 50,
            height: 1,
            background: 'linear-gradient(90deg, transparent, #8a6d2b, transparent)',
          }}
        />
      </motion.div>

      {/* Hero Agent Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative rounded-2xl overflow-hidden mb-4"
        style={{
          background: 'linear-gradient(160deg, rgba(24, 22, 18, 0.9) 0%, rgba(12, 12, 18, 0.95) 100%)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
          padding: '28px 32px 24px',
        }}
      >
        {/* Subtle warm glow top edge */}
        <div
          className="absolute top-0 left-[10%] right-[10%] h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(212, 168, 67, 0.25), transparent)',
          }}
        />
        {/* Ambient glow in corner */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            background: 'radial-gradient(circle, rgba(212, 168, 67, 0.04) 0%, transparent 70%)',
          }}
        />

        {/* Top row */}
        <div className="flex justify-between items-start mb-5 relative z-10">
          <div className="flex-1">
            {/* Class badge */}
            <div
              className="inline-flex items-center gap-1.5 font-mono text-[0.65rem] font-semibold tracking-[0.08em] uppercase text-[#5c574e] rounded px-2.5 py-0.5 mb-2"
              style={{ background: 'rgba(255, 255, 255, 0.04)' }}
            >
              {shape.icon} {mockAgent.class}
            </div>
            <h2 className="font-display text-[2rem] font-bold text-[#f5f0e8] leading-tight mb-1">
              {mockAgent.name}
            </h2>
            <div className="font-mono text-[0.78rem] text-[#5c574e] flex items-center gap-2">
              <span className="text-[#d4a843] font-semibold">Level {mockAgent.level}</span>
              <span>·</span>
              <span>{mockAgent.elo} ELO</span>
            </div>
          </div>

          {/* Agent icon - matching reference shape styling */}
          <motion.div
            className="rounded-full flex items-center justify-center flex-shrink-0"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 80,
              height: 80,
              background: shape.bg,
              border: shape.border,
              boxShadow: shape.shadow,
              fontSize: 32,
            }}
          >
            {shape.icon}
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-5 gap-2 mb-4 relative z-10">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.06 }}
              className="rounded-[10px] p-[10px_12px] relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${stat.gradientFrom} 0%, rgba(12, 12, 18, 0.8) 100%)`,
              }}
            >
              {/* Left border accent */}
              <div
                className="absolute left-0 top-0 bottom-0 w-[2px]"
                style={{ background: stat.borderColor }}
              />
              <div
                className="font-mono text-[0.58rem] font-semibold tracking-[0.1em] uppercase mb-[3px] flex items-center gap-1"
                style={{ color: stat.labelColor }}
              >
                {stat.icon} {stat.label}
              </div>
              <div className="font-mono text-[1.4rem] font-bold text-[#f5f0e8] leading-tight">
                {stat.value}
                {stat.suffix && (
                  <span className="text-[#5c574e] text-[0.9rem]">{stat.suffix}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Win/Loss Record */}
        <div className="flex items-center gap-3 font-mono text-[0.82rem] relative z-10">
          <span className="text-[#3dba6f] flex items-center gap-1">
            {mockAgent.wins}
            <span
              className="w-[18px] h-[18px] rounded-full inline-flex items-center justify-center text-[0.6rem] font-bold"
              style={{ background: 'rgba(61, 186, 111, 0.2)' }}
            >
              W
            </span>
          </span>
          <span className="text-[#d44040] flex items-center gap-1">
            {mockAgent.losses}
            <span
              className="w-[18px] h-[18px] rounded-full inline-flex items-center justify-center text-[0.6rem] font-bold"
              style={{ background: 'rgba(212, 64, 64, 0.2)' }}
            >
              L
            </span>
          </span>
          <span className="text-[#5c574e] text-[0.7rem]">|</span>
          <span className="text-[#d4a843] font-semibold">{winRate}% WR</span>
        </div>
      </motion.div>

      {/* Action Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Link
            href="/arena"
            className="group relative rounded-[14px] overflow-hidden flex items-center gap-4 p-[18px_22px] transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(28, 18, 12, 0.9) 0%, rgba(14, 12, 10, 0.95) 100%)',
            }}
          >
            {/* Corner glow */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: -20,
                left: -20,
                width: 100,
                height: 100,
                background: 'radial-gradient(circle, rgba(232, 114, 42, 0.12) 0%, transparent 70%)',
              }}
            />
            <div
              className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center text-[20px] flex-shrink-0 relative z-10"
              style={{ background: 'rgba(232, 114, 42, 0.12)', color: '#e8722a' }}
            >
              ⚔️
            </div>
            <div className="flex-1 relative z-10">
              <h3 className="font-body text-[0.82rem] font-bold tracking-[0.06em] uppercase text-[#f5f0e8] mb-[1px]">
                Enter the Depths
              </h3>
              <p className="text-[0.72rem] text-[#5c574e]">
                Descend into the arena. Fight. Survive.
              </p>
            </div>
            <span className="text-[#5c574e] text-[14px] relative z-10 group-hover:translate-x-[3px] transition-transform">
              ›
            </span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Link
            href="/inventory"
            className="group relative rounded-[14px] overflow-hidden flex items-center gap-4 p-[18px_22px] transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(24, 22, 14, 0.9) 0%, rgba(14, 13, 10, 0.95) 100%)',
            }}
          >
            {/* Corner glow */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: -20,
                left: -20,
                width: 100,
                height: 100,
                background: 'radial-gradient(circle, rgba(212, 168, 67, 0.1) 0%, transparent 70%)',
              }}
            />
            <div
              className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center text-[20px] flex-shrink-0 relative z-10"
              style={{ background: 'rgba(212, 168, 67, 0.12)', color: '#d4a843' }}
            >
              🛡️
            </div>
            <div className="flex-1 relative z-10">
              <h3 className="font-body text-[0.82rem] font-bold tracking-[0.06em] uppercase text-[#f5f0e8] mb-[1px]">
                Visit the Armory
              </h3>
              <p className="text-[0.72rem] text-[#5c574e]">
                Forge your legend. Wield ancient relics.
              </p>
            </div>
            <span className="text-[#5c574e] text-[14px] relative z-10 group-hover:translate-x-[3px] transition-transform">
              ›
            </span>
          </Link>
        </motion.div>
      </div>

      {/* Battle Chronicle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-[14px] p-[20px_24px]"
        style={{
          background: 'linear-gradient(180deg, rgba(18, 18, 28, 0.6) 0%, rgba(10, 10, 16, 0.8) 100%)',
          boxShadow: '0 2px 16px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div className="font-body text-[0.68rem] font-bold tracking-[0.14em] uppercase text-[#8a6d2b] text-center mb-4 flex items-center justify-center gap-1.5">
          ⚔ Battle Chronicle
        </div>

        <div className="space-y-[2px]">
          {mockBattles.map((battle, idx) => (
            <motion.div
              key={battle.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 + idx * 0.06 }}
              className="flex items-center rounded-lg p-[10px_12px] hover:bg-white/[0.02] transition-colors"
            >
              {/* Win/Loss indicator with glow */}
              <div
                className="w-[3px] h-7 rounded-sm mr-3.5 flex-shrink-0"
                style={{
                  background: battle.result === 'win' ? '#3dba6f' : '#d44040',
                  boxShadow: battle.result === 'win'
                    ? '0 0 8px rgba(61, 186, 111, 0.3)'
                    : '0 0 8px rgba(212, 64, 64, 0.3)',
                }}
              />
              <div className="flex-1">
                <div className="text-[0.82rem] font-semibold text-[#d4cfc5]">
                  vs {battle.opponent}
                </div>
                <div className="text-[0.68rem] text-[#5c574e]">{battle.date}</div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[0.78rem] font-semibold text-[#d4a843]">
                  +{battle.xp} XP
                </span>
                <span
                  className="font-mono text-[0.62rem] font-bold tracking-[0.08em] px-2.5 py-[3px] rounded"
                  style={{
                    background: battle.result === 'win'
                      ? 'rgba(61, 186, 111, 0.12)'
                      : 'rgba(212, 64, 64, 0.12)',
                    color: battle.result === 'win' ? '#3dba6f' : '#d44040',
                    border: battle.result === 'win'
                      ? '1px solid rgba(61, 186, 111, 0.15)'
                      : '1px solid rgba(212, 64, 64, 0.15)',
                  }}
                >
                  {battle.result === 'win' ? 'VICTORY' : 'DEFEAT'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
