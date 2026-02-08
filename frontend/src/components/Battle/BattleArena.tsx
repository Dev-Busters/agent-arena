'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DamageNumber from './DamageNumber'
import LootDrop from './LootDrop'
import ParticleEffect from './ParticleEffect'

interface Agent {
  id: string
  name: string
  class: string
  stats: {
    max_hp: number
    current_hp: number
    attack: number
    defense: number
  }
}

interface BattleAction {
  type: 'attack' | 'defend' | 'ability'
  damage?: number
  critical?: boolean
  timestamp: number
}

interface BattleArenaProps {
  agent1: Agent
  agent2: Agent
  onAction: (action: BattleAction) => void
}

export default function BattleArena({ agent1, agent2, onAction }: BattleArenaProps) {
  const [damageNumbers, setDamageNumbers] = useState<any[]>([])
  const [particles, setParticles] = useState<any[]>([])
  const [loot, setLoot] = useState<any[]>([])
  const [selectedAction, setSelectedAction] = useState<string | null>(null)

  const addDamageNumber = (agentId: string, damage: number, isCritical: boolean) => {
    const id = Math.random()
    setDamageNumbers(prev => [...prev, {
      id,
      agentId,
      damage,
      isCritical,
      createdAt: Date.now()
    }])

    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(d => d.id !== id))
    }, 2000)
  }

  const addParticles = (agentId: string, type: 'crit' | 'bleed' | 'burn' | 'poison') => {
    const id = Math.random()
    setParticles(prev => [...prev, {
      id,
      agentId,
      type,
      createdAt: Date.now()
    }])

    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== id))
    }, 1500)
  }

  const handleAction = (actionType: 'attack' | 'defend' | 'ability') => {
    const damage = Math.floor(Math.random() * 50) + 20
    const isCritical = Math.random() < 0.1
    const finalDamage = isCritical ? damage * 1.5 : damage

    addDamageNumber(agent2.id, finalDamage, isCritical)
    if (isCritical) {
      addParticles(agent2.id, 'crit')
    }

    onAction({
      type: actionType,
      damage: finalDamage,
      critical: isCritical,
      timestamp: Date.now()
    })

    setSelectedAction(null)
  }

  const hpPercent1 = (agent1.stats.current_hp / agent1.stats.max_hp) * 100
  const hpPercent2 = (agent2.stats.current_hp / agent2.stats.max_hp) * 100

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-dark via-darker to-black overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(64,224,208,0.1)_1px,transparent_1px),linear-gradient(rgba(64,224,208,0.1)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </div>

      {/* Agent 1 (Left) */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="absolute left-12 top-1/2 transform -translate-y-1/2 z-20"
      >
        <AgentCard agent={agent1} isPlayer={true} />
        <div className="mt-4 w-48">
          <HealthBar current={agent1.stats.current_hp} max={agent1.stats.max_hp} />
        </div>

        {/* Damage Numbers for Agent 1 */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-32">
          <AnimatePresence>
            {damageNumbers
              .filter(d => d.agentId === agent1.id)
              .map(dmg => (
                <DamageNumber key={dmg.id} damage={dmg.damage} isCritical={dmg.isCritical} />
              ))}
          </AnimatePresence>
        </div>

        {/* Particles */}
        {particles
          .filter(p => p.agentId === agent1.id)
          .map(particle => (
            <ParticleEffect key={particle.id} type={particle.type} />
          ))}
      </motion.div>

      {/* Agent 2 (Right) */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="absolute right-12 top-1/2 transform -translate-y-1/2 z-20"
      >
        <AgentCard agent={agent2} isPlayer={false} />
        <div className="mt-4 w-48">
          <HealthBar current={agent2.stats.current_hp} max={agent2.stats.max_hp} />
        </div>

        {/* Damage Numbers for Agent 2 */}
        <div className="absolute top-0 right-1/2 transform translate-x-1/2 w-32 h-32">
          <AnimatePresence>
            {damageNumbers
              .filter(d => d.agentId === agent2.id)
              .map(dmg => (
                <DamageNumber key={dmg.id} damage={dmg.damage} isCritical={dmg.isCritical} />
              ))}
          </AnimatePresence>
        </div>

        {/* Particles */}
        {particles
          .filter(p => p.agentId === agent2.id)
          .map(particle => (
            <ParticleEffect key={particle.id} type={particle.type} />
          ))}
      </motion.div>

      {/* Action Buttons (Bottom Center) */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30"
      >
        <ActionButtons onAction={handleAction} selected={selectedAction} />
      </motion.div>

      {/* Loot Display */}
      <AnimatePresence>
        {loot.map(item => (
          <LootDrop key={item.id} item={item} />
        ))}
      </AnimatePresence>

      {/* Battle Log (Bottom Right) */}
      <BattleLog />
    </div>
  )
}

function AgentCard({ agent, isPlayer }: { agent: Agent; isPlayer: boolean }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-gray-900 bg-opacity-60 border-2 border-primary border-opacity-40 rounded-lg p-6 backdrop-blur-sm"
    >
      <h2 className="text-2xl font-bold text-primary mb-2">{agent.name}</h2>
      <p className="text-sm text-gray-400 capitalize mb-4">{agent.class}</p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-500">ATK</span>
          <p className="font-bold text-primary">{agent.stats.attack}</p>
        </div>
        <div>
          <span className="text-gray-500">DEF</span>
          <p className="font-bold text-primary">{agent.stats.defense}</p>
        </div>
      </div>
    </motion.div>
  )
}

function HealthBar({ current, max }: { current: number; max: number }) {
  const percent = Math.max(0, (current / max) * 100)
  const color = percent > 50 ? 'bg-green-500' : percent > 25 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="bg-gray-800 rounded-full h-6 overflow-hidden border-2 border-gray-700">
      <motion.div
        initial={{ width: '100%' }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.5 }}
        className={`h-full ${color} shadow-lg`}
      />
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
        {Math.round(current)} / {max}
      </div>
    </div>
  )
}

function ActionButtons({
  onAction,
  selected
}: {
  onAction: (type: 'attack' | 'defend' | 'ability') => void
  selected: string | null
}) {
  const actions = [
    { type: 'attack' as const, label: '⚔️ Attack', color: 'from-red-600 to-red-700' },
    { type: 'defend' as const, label: '🛡️ Defend', color: 'from-blue-600 to-blue-700' },
    { type: 'ability' as const, label: '✨ Ability', color: 'from-purple-600 to-purple-700' },
  ]

  return (
    <div className="flex gap-4">
      {actions.map(action => (
        <motion.button
          key={action.type}
          onClick={() => onAction(action.type)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={`px-6 py-3 rounded-lg font-bold text-white transition ${
            selected === action.type
              ? `bg-gradient-to-b ${action.color} ring-2 ring-primary`
              : `bg-gradient-to-b ${action.color} opacity-80 hover:opacity-100`
          }`}
        >
          {action.label}
        </motion.button>
      ))}
    </div>
  )
}

function BattleLog() {
  return (
    <div className="absolute bottom-8 left-8 bg-gray-900 bg-opacity-80 border border-primary border-opacity-30 rounded p-4 w-64 max-h-48 overflow-y-auto">
      <h3 className="text-primary font-bold mb-2">Battle Log</h3>
      <div className="text-xs text-gray-400 space-y-1">
        <p>Turn 1: Player attacks for 45 damage!</p>
        <p className="text-yellow-400">CRITICAL HIT!</p>
        <p>Opponent defends</p>
      </div>
    </div>
  )
}
