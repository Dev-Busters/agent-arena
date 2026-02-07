'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DamageNumber from './DamageNumber'
import LootDrop from './LootDrop'
import { generateLoot, LootItem } from '@/utils/lootGenerator'

interface Agent {
  id: string
  name: string
  class: string
  max_hp: number
  current_hp: number
  attack: number
  defense: number
  speed: number
  accuracy: number
  evasion: number
  effects: string[]
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
    const agent = agentId === agent1.id ? agent1 : agent2
    const isAgent1 = agentId === agent1.id
    const x = isAgent1 ? 200 : window.innerWidth - 200
    const y = 300

    const id = `dmg-${Date.now()}-${Math.random()}`
    setFloatingNumbers((prev) => [...prev, { id, value: damage, isCritical, x, y, agentId }])

    // Screen shake on critical
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

  const getHPPercent = (current: number, max: number) => {
    return Math.max(0, (current / max) * 100)
  }

  const getStatusColor = (effect: string) => {
    const colors = {
      bleed: '#dc2626',
      burn: '#f59e0b',
      poison: '#22c55e',
      stun: '#3b82f6',
      defend: '#60a5fa',
    }
    return (colors as any)[effect] || '#6b7280'
  }

  return (
    <motion.div
      animate={{
        x: screenShake ? [-5, 5, -5, 0] : 0,
      }}
      transition={{
        duration: 0.2,
      }}
      className="relative w-full h-screen bg-gradient-to-b from-gray-900 to-black overflow-hidden"
    >
      {/* Background arena */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(64,224,208,0.05)_0%,transparent_100%)]" />

      {/* Combat area */}
      <div className="relative h-full flex items-center justify-between px-12">
        {/* Agent 1 (Left) */}
        <AgentCard
          agent={agent1}
          isLeft={true}
          isActive={selectedAction ? selectedAction === 'agent1' : true}
        />

        {/* Center action area */}
        <div className="flex flex-col items-center gap-4">
          <motion.div
            animate={{ scale: isYourTurn ? 1.1 : 1 }}
            transition={{ duration: 0.3 }}
            className="text-primary text-xl font-bold"
          >
            {isYourTurn ? '⚔️ Your Turn' : '⏳ Opponent Turn'}
          </motion.div>
        </div>

        {/* Agent 2 (Right) */}
        <AgentCard
          agent={agent2}
          isLeft={false}
          isActive={selectedAction ? selectedAction === 'agent2' : false}
        />
      </div>

      {/* Action buttons */}
      {isYourTurn && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4"
        >
          <ActionButton
            label="Attack"
            icon="⚔️"
            onClick={() => onAction('attack', agent2.id)}
            disabled={selectedAction !== null}
          />
          <ActionButton
            label="Defend"
            icon="🛡️"
            onClick={() => onAction('defend', agent1.id)}
            disabled={selectedAction !== null}
          />
          <ActionButton
            label="Ability"
            icon="✨"
            onClick={() => onAction('ability', agent2.id)}
            disabled={selectedAction !== null}
          />
        </motion.div>
      )}

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

      {/* Battle log */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute bottom-32 left-8 max-w-xs bg-gray-900 bg-opacity-80 border border-primary border-opacity-30 rounded p-4 max-h-40 overflow-y-auto"
      >
        <h3 className="text-sm font-bold text-primary mb-2">Battle Log</h3>
        <div className="text-xs text-gray-400 space-y-1">
          {battleLog.slice(-5).map((entry, i) => (
            <p key={i} className="truncate">
              {entry}
            </p>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

function AgentCard({
  agent,
  isLeft,
  isActive,
}: {
  agent: Agent
  isLeft: boolean
  isActive: boolean
}) {
  const hpPercent = (agent.current_hp / agent.max_hp) * 100

  return (
    <motion.div
      animate={{
        scale: isActive ? 1.05 : 1,
      }}
      className={`flex flex-col gap-4 ${isLeft ? 'items-start' : 'items-end'}`}
    >
      {/* Agent avatar */}
      <div className="relative">
        <motion.div
          animate={{
            boxShadow: isActive
              ? `0 0 30px rgba(64, 224, 208, 0.6)`
              : `0 0 10px rgba(64, 224, 208, 0.2)`,
          }}
          className="w-32 h-32 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-primary flex items-center justify-center text-6xl cursor-pointer transition-all"
        >
          {getAgentEmoji(agent.class)}
        </motion.div>
      </div>

      {/* Agent info */}
      <div className={`${isLeft ? 'text-left' : 'text-right'}`}>
        <h3 className="font-bold text-lg">{agent.name}</h3>
        <p className="text-sm text-gray-400">{agent.class}</p>
      </div>

      {/* HP bar */}
      <div className="w-48">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>HP</span>
          <span>
            {agent.current_hp} / {agent.max_hp}
          </span>
        </div>
        <div className="w-full h-6 bg-gray-800 border border-gray-700 rounded overflow-hidden">
          <motion.div
            animate={{ width: `${hpPercent}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-gradient-to-r from-red-600 to-red-500 relative"
          >
            <motion.div
              animate={{
                opacity: [1, 0.8, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent to-white opacity-20"
            />
          </motion.div>
        </div>
      </div>

      {/* Status effects */}
      {agent.effects.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {agent.effects.map((effect) => (
            <motion.div
              key={effect}
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
              className="px-3 py-1 rounded text-xs font-semibold text-white"
              style={{
                backgroundColor: getStatusColor(effect),
              }}
            >
              {effect}
            </motion.div>
          ))}
        </div>
      )}

      {/* Stats display */}
      <div
        className={`text-xs text-gray-400 space-y-1 ${
          isLeft ? 'text-left' : 'text-right'
        }`}
      >
        <p>⚔️ {agent.attack} | 🛡️ {agent.defense}</p>
        <p>⚡ {agent.speed} | 🎯 {agent.accuracy}</p>
      </div>
    </motion.div>
  )
}

function ActionButton({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string
  icon: string
  onClick: () => void
  disabled: boolean
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className="px-6 py-3 bg-gradient-to-r from-primary to-blue-500 text-dark font-bold rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {icon} {label}
    </motion.button>
  )
}

function getAgentEmoji(classType: string): string {
  const emojis: { [key: string]: string } = {
    warrior: '⚔️',
    mage: '✨',
    rogue: '🗡️',
    paladin: '🛡️',
  }
  return emojis[classType.toLowerCase()] || '🎮'
}
