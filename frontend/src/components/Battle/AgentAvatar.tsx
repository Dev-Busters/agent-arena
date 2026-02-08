'use client'

import { motion } from 'framer-motion'

interface Equipment {
  slot: string
  item_id?: string
  item_name?: string
  rarity?: string
}

interface Agent {
  id: string
  name: string
  class: string
  level: number
  max_hp: number
  current_hp: number
  attack: number
  defense: number
  speed: number
  accuracy: number
  evasion: number
  effects?: string[]
  equipment?: Equipment[]
}

interface AgentAvatarProps {
  agent: Agent
  isActive?: boolean
  isOpponent?: boolean
}

const CLASS_COLORS = {
  warrior: 'text-red-400',
  mage: 'text-blue-400',
  rogue: 'text-purple-400',
  paladin: 'text-yellow-400',
}

const CLASS_EMOJIS = {
  warrior: '⚔️',
  mage: '🔥',
  rogue: '🗡️',
  paladin: '✨',
}

const RARITY_COLORS = {
  common: 'bg-gray-600 border-gray-500 text-gray-100',
  uncommon: 'bg-green-600 border-green-500 text-green-100',
  rare: 'bg-blue-600 border-blue-500 text-blue-100',
  epic: 'bg-purple-600 border-purple-500 text-purple-100',
  legendary: 'bg-amber-600 border-amber-500 text-amber-100',
}

const RARITY_BADGES = {
  common: '◆',
  uncommon: '◆◆',
  rare: '◆◆◆',
  epic: '◆◆◆◆',
  legendary: '✦✦✦✦✦',
}

const SLOT_ICONS = {
  weapon: '⚔️',
  armor: '🛡️',
  accessory: '💎',
}

export default function AgentAvatar({
  agent,
  isActive = false,
  isOpponent = false,
}: AgentAvatarProps) {
  const hpPercent = Math.max(0, (agent.current_hp / agent.max_hp) * 100)
  const hpStatus =
    hpPercent > 50 ? 'healthy' : hpPercent > 25 ? 'wounded' : 'critical'

  // Mock equipment for now (will be dynamic later)
  const equipment = agent.equipment || [
    { slot: 'weapon', item_name: 'Iron Sword', rarity: 'common' },
    { slot: 'armor', item_name: 'Steel Plate', rarity: 'uncommon' },
    { slot: 'accessory', item_name: 'Ruby Ring', rarity: 'rare' },
  ]

  const hasLegendary = equipment.some((e) => e.rarity === 'legendary')
  const hasEpic = equipment.some((e) => e.rarity === 'epic')
  const avgRarity =
    equipment.length > 0
      ? equipment.reduce((sum, e) => {
          const rarityValue = {
            common: 1,
            uncommon: 2,
            rare: 3,
            epic: 4,
            legendary: 5,
          }
          return sum + (rarityValue[e.rarity as keyof typeof rarityValue] || 1)
        }, 0) / equipment.length
      : 0

  const glowColor =
    avgRarity >= 4.5
      ? 'shadow-2xl shadow-amber-500/50'
      : avgRarity >= 3.5
        ? 'shadow-lg shadow-purple-500/40'
        : 'shadow-md shadow-primary/30'

  return (
    <motion.div
      animate={{
        scale: isActive ? 1.05 : 1,
        y: isActive ? -10 : 0,
      }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center gap-4 ${isOpponent ? 'order-last' : ''}`}
    >
      {/* Main Avatar Display */}
      <motion.div
        animate={{
          boxShadow: isActive
            ? `0 0 40px rgba(64, 224, 208, 0.8)`
            : `0 0 20px rgba(64, 224, 208, 0.3)`,
        }}
        className={`relative w-40 h-40 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 border-4 border-primary flex flex-col items-center justify-center text-7xl cursor-pointer transition-all ${glowColor}`}
      >
        {/* Agent Class Emoji */}
        <div className="text-7xl">
          {CLASS_EMOJIS[agent.class as keyof typeof CLASS_EMOJIS] || '🎮'}
        </div>

        {/* Legendary Glow Effect */}
        {hasLegendary && (
          <motion.div
            animate={{
              opacity: [0.5, 1, 0.5],
              rotate: 360,
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute inset-0 rounded-2xl border-2 border-amber-400 pointer-events-none"
          />
        )}

        {/* Level Badge */}
        <div className="absolute top-2 right-2 bg-primary text-dark font-bold px-2 py-1 rounded-full text-sm">
          Lv {agent.level}
        </div>

        {/* Rarity Indicator */}
        {hasEpic || hasLegendary ? (
          <div className="absolute bottom-2 left-2 flex gap-1">
            {equipment
              .filter(
                (e) =>
                  (e.rarity === 'legendary' || e.rarity === 'epic') &&
                  e.item_name
              )
              .map((e, i) => (
                <motion.div
                  key={i}
                  animate={{
                    y: [0, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.2,
                    repeat: Infinity,
                  }}
                  className="text-lg"
                  title={`${e.rarity} ${e.item_name}`}
                >
                  {e.rarity === 'legendary' ? '✦' : '◆'}
                </motion.div>
              ))}
          </div>
        ) : null}
      </motion.div>

      {/* Agent Name & Class */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">{agent.name}</h2>
        <p
          className={`text-lg font-semibold ${
            CLASS_COLORS[agent.class as keyof typeof CLASS_COLORS]
          }`}
        >
          {agent.class.charAt(0).toUpperCase() + agent.class.slice(1)}
        </p>
      </div>

      {/* HP Bar */}
      <div className="w-full max-w-xs">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Health</span>
          <span className="font-bold text-white">
            {agent.current_hp} / {agent.max_hp}
          </span>
        </div>
        <div className="w-full h-8 bg-gray-800 border-2 border-gray-700 rounded-full overflow-hidden relative">
          <motion.div
            animate={{ width: `${hpPercent}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={`h-full flex items-center justify-center text-xs font-bold text-white transition-all ${
              hpStatus === 'healthy'
                ? 'bg-gradient-to-r from-green-500 to-green-400'
                : hpStatus === 'wounded'
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-400'
                  : 'bg-gradient-to-r from-red-600 to-red-500'
            }`}
          >
            {hpPercent >= 15 && <span>{Math.round(hpPercent)}%</span>}
          </motion.div>

          {/* HP shimmer effect */}
          <motion.div
            animate={{
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
          />
        </div>
      </div>

      {/* Equipment Display */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xs"
      >
        <p className="text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider">
          Equipment
        </p>
        <div className="space-y-2">
          {equipment.map((item, idx) => (
            <motion.div
              key={idx}
              animate={{
                x: isActive ? [0, 5, 0] : 0,
              }}
              transition={{
                duration: 0.6,
                delay: idx * 0.1,
                repeat: isActive ? Infinity : 0,
              }}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg border-2 ${
                RARITY_COLORS[item.rarity as keyof typeof RARITY_COLORS] ||
                RARITY_COLORS.common
              }`}
            >
              <span className="text-lg">
                {SLOT_ICONS[item.slot as keyof typeof SLOT_ICONS]}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold">{item.item_name}</p>
              </div>
              <span className="text-xs font-bold">
                {RARITY_BADGES[item.rarity as keyof typeof RARITY_BADGES]}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Stats Compact */}
      <div className="w-full max-w-xs bg-gray-900 bg-opacity-50 rounded-lg p-3 border border-primary border-opacity-20">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <span>⚔️</span>
            <span className="text-gray-400">ATK:</span>
            <span className="font-bold text-red-400">{agent.attack}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🛡️</span>
            <span className="text-gray-400">DEF:</span>
            <span className="font-bold text-blue-400">{agent.defense}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>⚡</span>
            <span className="text-gray-400">SPD:</span>
            <span className="font-bold text-yellow-400">{agent.speed}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🎯</span>
            <span className="text-gray-400">ACC:</span>
            <span className="font-bold text-green-400">{agent.accuracy}%</span>
          </div>
        </div>
      </div>

      {/* Status Effects */}
      {agent.effects && agent.effects.length > 0 && (
        <div className="flex gap-2 flex-wrap justify-center">
          {agent.effects.map((effect) => (
            <motion.div
              key={effect}
              animate={{
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
              }}
              className="px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-red-600 to-red-500 shadow-lg"
            >
              {effect}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
