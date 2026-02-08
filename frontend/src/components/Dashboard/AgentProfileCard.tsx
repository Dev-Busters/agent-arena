'use client'

import Link from 'next/link'
import { StatCard } from './StatCard'

interface AgentProfileCardProps {
  agent: {
    id: string
    name: string
    class: string
    level: number
    experience: number
    current_hp: number
    max_hp: number
    attack: number
    defense: number
    speed: number
    accuracy: number
    evasion: number
  }
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

export function AgentProfileCard({ agent }: AgentProfileCardProps) {
  const hpPercent = Math.round((agent.current_hp / agent.max_hp) * 100)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-primary/30 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Active Agent</p>
            <h2 className={`text-3xl font-bold mb-2 ${CLASS_COLORS[agent.class as keyof typeof CLASS_COLORS]}`}>
              {CLASS_EMOJIS[agent.class as keyof typeof CLASS_EMOJIS]} {agent.name}
            </h2>
            <p className="text-gray-400 capitalize">
              Level {agent.level} • {agent.class}
            </p>
          </div>
          <Link
            href="/agent/create"
            className="px-4 py-2 bg-primary text-dark font-bold rounded hover:bg-opacity-90 transition"
          >
            Create New
          </Link>
        </div>

        {/* HP Bar */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Health Points</span>
            <span className="text-sm font-bold text-primary">
              {agent.current_hp} / {agent.max_hp}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full overflow-hidden h-3">
            <div
              className={`h-full transition-all ${
                hpPercent > 50
                  ? 'bg-green-500'
                  : hpPercent > 25
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* Experience */}
        <div className="mt-4">
          <p className="text-xs text-gray-400 mb-1">Experience</p>
          <p className="text-lg font-bold text-primary">{agent.experience} XP</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          label="Attack"
          value={agent.attack}
          icon="⚔️"
          tooltip="Physical damage dealt"
          highlight
        />
        <StatCard
          label="Defense"
          value={agent.defense}
          icon="🛡️"
          tooltip="Damage reduction"
          highlight
        />
        <StatCard
          label="Speed"
          value={agent.speed}
          icon="⚡"
          tooltip="Turn order priority"
          highlight
        />
        <StatCard
          label="Accuracy"
          value={`${agent.accuracy}%`}
          icon="🎯"
          tooltip="Hit chance"
        />
        <StatCard
          label="Evasion"
          value={`${agent.evasion}%`}
          icon="🏃"
          tooltip="Dodge chance"
        />
        <StatCard
          label="Level"
          value={agent.level}
          icon="⭐"
          tooltip="Agent progression"
        />
      </div>
    </div>
  )
}
