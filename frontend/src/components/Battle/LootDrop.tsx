'use client'

import { motion } from 'framer-motion'
import { LootItem, getRarityColor } from '@/utils/lootGenerator'

interface LootDropProps {
  item: LootItem
  onCollect: () => void
}

export default function LootDrop({ item, onCollect }: LootDropProps) {
  const rarityColor = getRarityColor(item.rarity)

  const containerVariants = {
    initial: {
      scale: 0,
      opacity: 0,
      y: -100,
    },
    animate: {
      scale: 1,
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 20,
      },
    },
    hover: {
      scale: 1.08,
      boxShadow: `0 0 30px ${rarityColor.text}`,
    },
  }

  const glowVariants = {
    animate: {
      opacity: [0.5, 1, 0.5],
      boxShadow: [
        `0 0 20px ${rarityColor.text}`,
        `0 0 40px ${rarityColor.text}`,
        `0 0 20px ${rarityColor.text}`,
      ],
    },
  }

  const rarityEmoji = {
    common: '⬜',
    uncommon: '🟩',
    rare: '🟦',
    epic: '🟪',
    legendary: '🟨',
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
      onClick={onCollect}
      className="cursor-pointer fixed"
      style={{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Glow aura */}
      <motion.div
        variants={glowVariants}
        animate="animate"
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 rounded-lg"
        style={{
          backgroundColor: rarityColor.bg,
          opacity: 0.1,
        }}
      />

      {/* Item card */}
      <motion.div
        className="relative rounded-lg p-6 border-2 backdrop-blur-sm min-w-max"
        style={{
          backgroundColor: `${rarityColor.bg}20`,
          borderColor: rarityColor.text,
        }}
      >
        {/* Rarity indicator */}
        <div className="text-4xl mb-3 text-center">{rarityEmoji[item.rarity]}</div>

        {/* Item name */}
        <h3
          className="text-lg font-bold text-center mb-2 uppercase tracking-wider"
          style={{ color: rarityColor.text }}
        >
          {item.name}
        </h3>

        {/* Item type and stats */}
        <div className="text-sm text-gray-400 text-center mb-3">
          <p className="capitalize font-semibold">{item.type}</p>
          <div className="mt-2 space-y-1">
            {item.stats.attack && (
              <p className="text-yellow-400">+{item.stats.attack} Attack</p>
            )}
            {item.stats.defense && (
              <p className="text-blue-400">+{item.stats.defense} Defense</p>
            )}
            {item.stats.hp && <p className="text-green-400">+{item.stats.hp} HP</p>}
          </div>
        </div>

        {/* Value */}
        <div
          className="text-center font-bold text-lg"
          style={{ color: rarityColor.text }}
        >
          💰 {item.value} gold
        </div>

        {/* Click hint */}
        <div className="text-center text-xs text-gray-500 mt-3">Click to collect</div>
      </motion.div>

      {/* Particle effects (optional - can enhance with more) */}
      {item.rarity === 'legendary' && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: rarityColor.text,
              }}
              initial={{
                x: 0,
                y: 0,
                opacity: 1,
              }}
              animate={{
                x: Math.cos((i / 6) * Math.PI * 2) * 100,
                y: Math.sin((i / 6) * Math.PI * 2) * 100,
                opacity: 0,
              }}
              transition={{
                duration: 1,
                delay: i * 0.1,
              }}
            />
          ))}
        </>
      )}
    </motion.div>
  )
}
