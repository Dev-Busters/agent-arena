'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface DamageNumberProps {
  value: number
  isCritical: boolean
  x: number
  y: number
  isHealing?: boolean
  onComplete: () => void
}

export default function DamageNumber({
  value,
  isCritical,
  x,
  y,
  isHealing = false,
  onComplete,
}: DamageNumberProps) {
  const [key, setKey] = useState(0)

  const baseColor = isHealing ? '#4ade80' : isCritical ? '#fbbf24' : '#e0e0e0'
  const glow = isHealing ? '#22c55e' : isCritical ? '#f59e0b' : '#60a5fa'

  const duration = isCritical ? 1.2 : 0.8

  return (
    <motion.div
      key={key}
      initial={{
        x,
        y,
        opacity: 1,
        scale: isCritical ? 0.8 : 0.6,
      }}
      animate={{
        y: y - 80,
        opacity: 0,
        scale: isCritical ? 1.3 : 1,
      }}
      transition={{
        duration,
        ease: [0.34, 1.56, 0.64, 1], // Bouncy easing
      }}
      onAnimationComplete={onComplete}
      className="fixed pointer-events-none font-bold select-none"
      style={{
        textShadow: isCritical
          ? `0 0 20px ${glow}, 0 0 40px ${glow}`
          : `0 2px 4px rgba(0,0,0,0.8)`,
      }}
    >
      <div
        className="text-xl"
        style={{
          color: baseColor,
          fontSize: isCritical ? '2rem' : '1.5rem',
          fontWeight: isCritical ? 900 : 700,
          letterSpacing: isCritical ? '2px' : '0',
        }}
      >
        {isHealing ? '+' : '-'}
        {value}
        {isCritical && ' ⚡'}
      </div>
    </motion.div>
  )
}
