'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AgentAvatar from './AgentAvatar'
import DamageNumber from './DamageNumber'
import LootDrop from './LootDrop'
import { generateLoot, LootItem } from '@/utils/lootGenerator'

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
  effects: string[]
  equipment?: any[]
}

interface BattleArenaProps {
  agent1: Agent
  agent2: Agent
  onAction: (action: string, targetId: string) => void
  isYourTurn: boolean
  battleLog: any[]
}

interface FloatingNumber {
  id: string
  value: number
  isCritical: boolean
  x: number
  y: number
  agentId: string
  isHealing?: boolean
}

export default function BattleArena({
  agent1,
  agent2,
  onAction,
  isYourTurn,
  battleLog,
}: BattleArenaProps) {
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([])
  const [lootDrops, setLootDrops] = useState<LootItem[]>([])
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [screenShake, setScreenShake] = useState(false)

  const handleDamage = (agentId: string, damage: number, isCritical: boolean) => {
    const isAgent1 = agentId === agent1.id
    const x = isAgent1 ? window.innerWidth * 0.2 : window.innerWidth * 0.8
    const y = window.innerHeight * 0.35

    const id = `dmg-${Date.now()}-${Math.random()}`
    setFloatingNumbers((prev) => [...prev, { id, value: damage, isCritical, x, y, agentId }])

    if (isCritical) {
      setScreenShake(true)
      setTimeout(() => setScreenShake(false), 200)
    }
  }

  const removeFloatingNumber = useCallback((id: string) => {
    setFloatingNumbers((prev) => prev.filter((num) => num.id !== id))
  }, [])

  const handleLootDrop = () => {
    const newLoot = generateLoot()
    setLootDrops((prev) => [...prev, newLoot])
  }

  const collectLoot = (lootId: string) => {
    setLootDrops((prev) => prev.filter((item) => item.id !== lootId))
  }

  const handleActionClick = (action: string, targetId: string) => {
    setSelectedAction(action)
    onAction(action, targetId)
    setTimeout(() => setSelectedAction(null), 1000)
  }

  return (
    <motion.div
      animate={{
        x: screenShake ? [-8, 8, -8, 0] : 0,
      }}
      transition={{
        duration: 0.2,
      }}
      className="relative w-full min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black overflow-hidden"
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(64,224,208,0.03)_0%,transparent_100%)]" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-5 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-5 animate-pulse" />

      {/* Main battle arena - centered agents */}
      <div className="relative h-screen flex items-center justify-center px-8">
        {/* VS Text in center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="text-8xl font-black text-primary"
          >
            VS
          </motion.div>
        </div>

        {/* Agent 1 (Left) */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-sm flex justify-end pr-12"
        >
          <AgentAvatar agent={agent1} isActive={isYourTurn} />
        </motion.div>

        {/* Agent 2 (Right) */}
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-sm flex justify-start pl-12"
        >
          <AgentAvatar agent={agent2} isActive={!isYourTurn} isOpponent />
        </motion.div>
      </div>

      {/* Top Status Bar */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-0 left-0 right-0 bg-gradient-to-b from-gray-900 to-transparent p-6 border-b border-primary border-opacity-20"
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-primary">⚔️ BATTLE ARENA</h1>
            <p className="text-gray-400 text-sm mt-1">Turn-based combat showcase</p>
          </div>

          <motion.div
            animate={{
              scale: isYourTurn ? [1, 1.2, 1] : 1,
            }}
            transition={{
              duration: 0.8,
              repeat: isYourTurn ? Infinity : 0,
            }}
            className={`px-6 py-3 rounded-lg font-bold text-lg ${
              isYourTurn
                ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/50'
                : 'bg-gray-700 text-gray-300'
            }`}
          >
            {isYourTurn ? '⚡ YOUR TURN' : '⏳ WAITING...'}
          </motion.div>
        </div>
      </motion.div>

      {/* Action Buttons - Bottom Center */}
      {isYourTurn && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 z-50"
        >
          <ActionButton
            label="Attack"
            icon="⚔️"
            onClick={() => handleActionClick('attack', agent2.id)}
            color="red"
            disabled={selectedAction !== null}
          />
          <ActionButton
            label="Defend"
            icon="🛡️"
            onClick={() => handleActionClick('defend', agent1.id)}
            color="blue"
            disabled={selectedAction !== null}
          />
          <ActionButton
            label="Ability"
            icon="✨"
            onClick={() => handleActionClick('ability', agent2.id)}
            color="purple"
            disabled={selectedAction !== null}
          />
        </motion.div>
      )}

      {/* Battle Log - Bottom Left */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute bottom-8 left-8 w-80 max-h-48 bg-gray-900 bg-opacity-90 border-2 border-primary border-opacity-40 rounded-lg p-4 overflow-y-auto backdrop-blur"
      >
        <h3 className="text-sm font-bold text-primary mb-3 uppercase tracking-wider">
          Battle Log
        </h3>
        <div className="text-xs text-gray-300 space-y-2">
          {battleLog.length === 0 ? (
            <p className="text-gray-500 italic">Waiting for battle to start...</p>
          ) : (
            battleLog.slice(-8).map((entry, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="truncate hover:text-primary transition-colors"
              >
                • {entry}
              </motion.p>
            ))
          )}
        </div>
      </motion.div>

      {/* Floating damage numbers */}
      <AnimatePresence>
        {floatingNumbers.map((num) => (
          <DamageNumber
            key={num.id}
            value={num.value}
            isCritical={num.isCritical}
            x={num.x}
            y={num.y}
            isHealing={num.isHealing}
            onComplete={() => removeFloatingNumber(num.id)}
          />
        ))}
      </AnimatePresence>

      {/* Loot drops */}
      <AnimatePresence>
        {lootDrops.map((loot) => (
          <LootDrop
            key={loot.id}
            item={loot}
            onCollect={() => collectLoot(loot.id)}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  )
}

function ActionButton({
  label,
  icon,
  onClick,
  color = 'primary',
  disabled,
}: {
  label: string
  icon: string
  onClick: () => void
  color?: 'red' | 'blue' | 'purple' | 'primary'
  disabled: boolean
}) {
  const colorClasses = {
    red: 'from-red-600 to-red-500 hover:shadow-red-500/50',
    blue: 'from-blue-600 to-blue-500 hover:shadow-blue-500/50',
    purple: 'from-purple-600 to-purple-500 hover:shadow-purple-500/50',
    primary: 'from-cyan-600 to-cyan-500 hover:shadow-cyan-500/50',
  }

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.1 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`px-8 py-4 bg-gradient-to-r ${colorClasses[color]} text-white font-bold rounded-xl shadow-lg transition-all text-lg flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed ${
        !disabled ? 'hover:shadow-2xl' : ''
      }`}
    >
      {icon} {label}
    </motion.button>
  )
}
