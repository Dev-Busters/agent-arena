'use client'

import { motion } from 'framer-motion'

interface DamageNumberProps {
  damage: number
  isCritical: boolean
}

export default function DamageNumber({ damage, isCritical }: DamageNumberProps) {
  const formattedDamage = Math.round(damage)

  return (
    <motion.div
      initial={{
        y: 0,
        opacity: 1,
        scale: isCritical ? 0.5 : 0.8,
      }}
      animate={{
        y: -100,
        opacity: 0,
        scale: isCritical ? 1.5 : 1,
      }}
      transition={{
        duration: 2,
        ease: 'easeOut',
      }}
      className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
    >
      {/* Background glow for critical hits */}
      {isCritical && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0.8 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="absolute inset-0 blur-xl bg-yellow-400 rounded-full"
          style={{ width: '100px', height: '100px', left: '-50px', top: '-50px' }}
        />
      )}

      {/* Damage text with glow */}
      <motion.div
        animate={
          isCritical
            ? {
                textShadow: [
                  '0 0 0px rgba(255, 200, 0, 0)',
                  '0 0 20px rgba(255, 200, 0, 1)',
                  '0 0 30px rgba(255, 100, 0, 0.8)',
                  '0 0 10px rgba(255, 200, 0, 0)',
                ],
              }
            : {}
        }
        transition={{ duration: 0.8 }}
        className={`font-black text-center leading-none ${
          isCritical
            ? 'text-4xl text-yellow-300'
            : 'text-2xl text-red-400'
        }`}
      >
        {formattedDamage}
      </motion.div>

      {/* "CRIT!" label for critical hits */}
      {isCritical && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center text-xs font-bold text-yellow-200 mt-1 uppercase tracking-widest"
          style={{
            textShadow: '0 0 8px rgba(255, 200, 0, 0.8)',
          }}
        >
          CRITICAL!
        </motion.div>
      )}
    </motion.div>
  )
}
