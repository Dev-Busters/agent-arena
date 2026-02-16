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
    <div className="min-h-screen" style={{ padding: '40px 48px', maxWidth: 1200 }}>
      {/* Page Header - Left aligned, gold gradient title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 28 }}
      >
        <h1
          className="font-display"
          style={{
            fontSize: '2.8rem',
            fontWeight: 700,
            letterSpacing: '0.03em',
            lineHeight: 1.1,
            background: 'linear-gradient(180deg, #f5e6b8 0%, #d4a843 40%, #a67c2e 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          War Room
        </h1>
        <p
          className="font-display"
          style={{
            fontSize: '0.8rem',
            fontWeight: 400,
            letterSpacing: '0.2em',
            textTransform: 'uppercase' as const,
            color: '#8a6d2b',
            marginTop: 8,
          }}
        >
          Your champion awaits orders
        </p>
        <div
          style={{
            marginTop: 12,
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
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, rgba(24, 22, 18, 0.9) 0%, rgba(12, 12, 18, 0.95) 100%)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
          borderRadius: 16,
          padding: '28px 32px 24px',
          marginBottom: 16,
          border: '1px solid rgba(255, 255, 255, 0.04)',
        }}
      >
        {/* Subtle warm glow top edge */}
        <div
          className="absolute top-0 left-[10%] right-[10%]"
          style={{
            height: 1,
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
        <div className="flex justify-between items-start relative z-10" style={{ marginBottom: 20 }}>
          <div className="flex-1">
            {/* Class badge */}
            <div
              className="inline-flex items-center font-mono"
              style={{
                gap: 5,
                fontSize: '0.65rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                color: '#5c574e',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '3px 10px',
                borderRadius: 4,
                marginBottom: 8,
              }}
            >
              {shape.icon} {mockAgent.class}
            </div>
            <h2
              className="font-display"
              style={{
                fontSize: '2rem',
                fontWeight: 700,
                color: '#f5f0e8',
                lineHeight: 1.1,
                marginBottom: 4,
              }}
            >
              {mockAgent.name}
            </h2>
            <div
              className="font-mono flex items-center"
              style={{ fontSize: '0.78rem', color: '#5c574e', gap: 8 }}
            >
              <span style={{ color: '#d4a843', fontWeight: 600 }}>Level {mockAgent.level}</span>
              <span>·</span>
              <span>{mockAgent.elo} ELO</span>
            </div>
          </div>
          {/* Agent icon */}
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

        {/* Stats Grid - individual cards with gap, NOT a single container */}
        <div
          className="relative z-10"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 8,
            marginBottom: 16,
          }}
        >
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.06 }}
              className="relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${stat.gradientFrom} 0%, rgba(12, 12, 18, 0.8) 100%)`,
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              {/* Left border accent */}
              <div
                className="absolute left-0 top-0 bottom-0"
                style={{ width: 2, background: stat.borderColor, borderRadius: 1 }}
              />
              <div
                className="font-mono flex items-center"
                style={{
                  fontSize: '0.58rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase' as const,
                  marginBottom: 3,
                  gap: 4,
                  color: stat.labelColor,
                }}
              >
                {stat.icon} {stat.label}
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: '#f5f0e8',
                  lineHeight: 1.1,
                }}
              >
                {stat.value}
                {stat.suffix && (
                  <span style={{ color: '#5c574e', fontSize: '0.9rem' }}>{stat.suffix}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Win/Loss Record */}
        <div
          className="font-mono flex items-center relative z-10"
          style={{ fontSize: '0.82rem', gap: 12 }}
        >
          <span className="flex items-center" style={{ color: '#3dba6f', gap: 4 }}>
            {mockAgent.wins}
            <span
              className="inline-flex items-center justify-center rounded-full"
              style={{
                width: 18,
                height: 18,
                fontSize: '0.6rem',
                fontWeight: 700,
                background: 'rgba(61, 186, 111, 0.2)',
              }}
            >
              W
            </span>
          </span>
          <span className="flex items-center" style={{ color: '#d44040', gap: 4 }}>
            {mockAgent.losses}
            <span
              className="inline-flex items-center justify-center rounded-full"
              style={{
                width: 18,
                height: 18,
                fontSize: '0.6rem',
                fontWeight: 700,
                background: 'rgba(212, 64, 64, 0.2)',
              }}
            >
              L
            </span>
          </span>
          <span style={{ color: '#5c574e', fontSize: '0.7rem' }}>|</span>
          <span style={{ color: '#d4a843', fontWeight: 600 }}>{winRate}% WR</span>
        </div>
      </motion.div>

      {/* Action Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Link
            href="/arena"
            className="group relative overflow-hidden flex items-center transition-all duration-300 no-underline"
            style={{
              background: 'linear-gradient(135deg, rgba(28, 18, 12, 0.9) 0%, rgba(14, 12, 10, 0.95) 100%)',
              borderRadius: 14,
              padding: '18px 22px',
              gap: 16,
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
              className="flex items-center justify-center flex-shrink-0 relative z-10"
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: 'rgba(232, 114, 42, 0.12)',
                color: '#e8722a',
                fontSize: 20,
              }}
            >
              ⚔️
            </div>
            <div className="flex-1 relative z-10">
              <h3
                className="font-body"
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase' as const,
                  color: '#f5f0e8',
                  marginBottom: 1,
                }}
              >
                Enter the Depths
              </h3>
              <p style={{ fontSize: '0.72rem', color: '#5c574e', margin: 0 }}>
                Descend into the arena. Fight. Survive.
              </p>
            </div>
            <span
              className="relative z-10 group-hover:translate-x-[3px] transition-transform"
              style={{ color: '#5c574e', fontSize: 14 }}
            >
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
            className="group relative overflow-hidden flex items-center transition-all duration-300 no-underline"
            style={{
              background: 'linear-gradient(135deg, rgba(24, 22, 14, 0.9) 0%, rgba(14, 13, 10, 0.95) 100%)',
              borderRadius: 14,
              padding: '18px 22px',
              gap: 16,
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
              className="flex items-center justify-center flex-shrink-0 relative z-10"
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: 'rgba(212, 168, 67, 0.12)',
                color: '#d4a843',
                fontSize: 20,
              }}
            >
              🛡️
            </div>
            <div className="flex-1 relative z-10">
              <h3
                className="font-body"
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase' as const,
                  color: '#f5f0e8',
                  marginBottom: 1,
                }}
              >
                Visit the Armory
              </h3>
              <p style={{ fontSize: '0.72rem', color: '#5c574e', margin: 0 }}>
                Forge your legend. Wield ancient relics.
              </p>
            </div>
            <span
              className="relative z-10 group-hover:translate-x-[3px] transition-transform"
              style={{ color: '#5c574e', fontSize: 14 }}
            >
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
        style={{
          background: 'linear-gradient(180deg, rgba(18, 18, 28, 0.6) 0%, rgba(10, 10, 16, 0.8) 100%)',
          borderRadius: 14,
          padding: '20px 24px',
          boxShadow: '0 2px 16px rgba(0, 0, 0, 0.2)',
        }}
      >
        <div
          className="font-body flex items-center justify-center"
          style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase' as const,
            color: '#8a6d2b',
            textAlign: 'center' as const,
            marginBottom: 16,
            gap: 6,
          }}
        >
          ⚔ Battle Chronicle
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 2 }}>
          {mockBattles.map((battle, idx) => (
            <motion.div
              key={battle.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 + idx * 0.06 }}
              className="flex items-center transition-colors"
              style={{
                padding: '10px 12px',
                borderRadius: 8,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {/* Win/Loss indicator with glow */}
              <div
                className="flex-shrink-0"
                style={{
                  width: 3,
                  height: 28,
                  borderRadius: 2,
                  marginRight: 14,
                  background: battle.result === 'win' ? '#3dba6f' : '#d44040',
                  boxShadow:
                    battle.result === 'win'
                      ? '0 0 8px rgba(61, 186, 111, 0.3)'
                      : '0 0 8px rgba(212, 64, 64, 0.3)',
                }}
              />
              <div className="flex-1">
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#d4cfc5' }}>
                  vs {battle.opponent}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#5c574e' }}>{battle.date}</div>
              </div>
              <div className="flex items-center" style={{ gap: 10 }}>
                <span
                  className="font-mono"
                  style={{ fontSize: '0.78rem', fontWeight: 600, color: '#d4a843' }}
                >
                  +{battle.xp} XP
                </span>
                <span
                  className="font-mono"
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    padding: '3px 10px',
                    borderRadius: 4,
                    background:
                      battle.result === 'win'
                        ? 'rgba(61, 186, 111, 0.12)'
                        : 'rgba(212, 64, 64, 0.12)',
                    color: battle.result === 'win' ? '#3dba6f' : '#d44040',
                    border:
                      battle.result === 'win'
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
