'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

interface Task {
  id: string
  name: string
  description: string
  status: 'done' | 'in-progress' | 'planned'
  estimatedTokens: number
  estimatedCost: number
  priority: 'critical' | 'high' | 'medium' | 'low'
  category: string
}

const tasks: Task[] = [
  // Completed
  {
    id: '1',
    name: 'Core Game Loop',
    description: 'User auth, agent creation, class selection, dashboard',
    status: 'done',
    estimatedTokens: 15000,
    estimatedCost: 0.25,
    priority: 'critical',
    category: 'Foundation'
  },
  {
    id: '2',
    name: 'PVP Battle System',
    description: 'Socket.io battles, turn-based combat, damage calculations',
    status: 'done',
    estimatedTokens: 12000,
    estimatedCost: 0.20,
    priority: 'critical',
    category: 'Combat'
  },
  {
    id: '3',
    name: 'Premium UI/UX',
    description: 'Landing page, polished auth, dashboard, animations',
    status: 'done',
    estimatedTokens: 10000,
    estimatedCost: 0.17,
    priority: 'high',
    category: 'Frontend'
  },
  {
    id: '4',
    name: 'OAuth Integration',
    description: 'Google & Discord login, account linking',
    status: 'done',
    estimatedTokens: 5000,
    estimatedCost: 0.08,
    priority: 'high',
    category: 'Auth'
  },
  
  // In Progress / Next
  {
    id: '5',
    name: 'PVE Dungeon System',
    description: 'Dungeons, enemy AI, difficulty scaling, encounter design',
    status: 'planned',
    estimatedTokens: 18000,
    estimatedCost: 0.30,
    priority: 'critical',
    category: 'Content'
  },
  {
    id: '6',
    name: 'Loot & Progression',
    description: 'Item drops, rarity system, progression curves, XP tuning',
    status: 'planned',
    estimatedTokens: 12000,
    estimatedCost: 0.20,
    priority: 'critical',
    category: 'Systems'
  },
  {
    id: '7',
    name: 'Crafting System',
    description: 'Recipes, materials, gear crafting, resource management',
    status: 'planned',
    estimatedTokens: 10000,
    estimatedCost: 0.17,
    priority: 'high',
    category: 'Systems'
  },
  {
    id: '8',
    name: 'Cosmetics Shop',
    description: 'Skins, emotes, pricing tiers, monetization design',
    status: 'planned',
    estimatedTokens: 8000,
    estimatedCost: 0.13,
    priority: 'high',
    category: 'Monetization'
  },
  {
    id: '9',
    name: 'Game Balance & Economy',
    description: 'Simulate 100+ battles, tune damage/XP/loot, balance classes',
    status: 'planned',
    estimatedTokens: 25000,
    estimatedCost: 0.42,
    priority: 'critical',
    category: 'Systems'
  },
  {
    id: '10',
    name: 'Leaderboard Refinement',
    description: 'Seasonal rankings, ELO system, rewards, decay',
    status: 'planned',
    estimatedTokens: 8000,
    estimatedCost: 0.13,
    priority: 'medium',
    category: 'Features'
  },
  {
    id: '11',
    name: 'Social Features',
    description: 'Guilds, friendlist, chat, spectate battles',
    status: 'planned',
    estimatedTokens: 15000,
    estimatedCost: 0.25,
    priority: 'medium',
    category: 'Social'
  },
  {
    id: '12',
    name: 'Advanced Battle UI',
    description: 'Damage numbers, particle effects, sound design, Polish',
    status: 'planned',
    estimatedTokens: 10000,
    estimatedCost: 0.17,
    priority: 'medium',
    category: 'Frontend'
  }
]

const statusColors = {
  done: 'bg-green-500/20 border-green-500 text-green-200',
  'in-progress': 'bg-blue-500/20 border-blue-500 text-blue-200',
  planned: 'bg-gray-500/20 border-gray-500 text-gray-200'
}

const priorityColors = {
  critical: 'text-red-400',
  high: 'text-orange-400',
  medium: 'text-yellow-400',
  low: 'text-gray-400'
}

export default function RoadmapPage() {
  const completedTasks = tasks.filter(t => t.status === 'done')
  const plannedTasks = tasks.filter(t => t.status !== 'done')
  
  const totalTokens = tasks.reduce((sum, t) => sum + t.estimatedTokens, 0)
  const totalCost = tasks.reduce((sum, t) => sum + t.estimatedCost, 0)
  const completedTokens = completedTasks.reduce((sum, t) => sum + t.estimatedTokens, 0)
  const completedCost = completedTasks.reduce((sum, t) => sum + t.estimatedCost, 0)
  const remainingTokens = plannedTasks.reduce((sum, t) => sum + t.estimatedTokens, 0)
  const remainingCost = plannedTasks.reduce((sum, t) => sum + t.estimatedCost, 0)

  const categories = [...new Set(tasks.map(t => t.category))]

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-cyan-500 rounded-full mix-blend-screen filter blur-[200px] opacity-10" />
        <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] bg-purple-500 rounded-full mix-blend-screen filter blur-[200px] opacity-10" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-3xl">🎮</span>
            <span className="text-2xl font-black">Agent Arena</span>
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-black mb-2">Development Roadmap</h1>
          <p className="text-gray-400">Track progress and costs for Agent Arena</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-4 gap-4 mb-12"
        >
          <div className="bg-white/5 border border-green-500/30 rounded-xl p-6">
            <div className="text-sm text-gray-400 mb-2">✅ Completed</div>
            <div className="text-3xl font-black text-green-400">{completedTasks.length}</div>
            <div className="text-xs text-gray-500 mt-2">{completedTokens.toLocaleString()} tokens</div>
            <div className="text-xs text-gray-500">${completedCost.toFixed(2)}</div>
          </div>

          <div className="bg-white/5 border border-yellow-500/30 rounded-xl p-6">
            <div className="text-sm text-gray-400 mb-2">📋 Planned</div>
            <div className="text-3xl font-black text-yellow-400">{plannedTasks.length}</div>
            <div className="text-xs text-gray-500 mt-2">{remainingTokens.toLocaleString()} tokens</div>
            <div className="text-xs text-gray-500">${remainingCost.toFixed(2)}</div>
          </div>

          <div className="bg-white/5 border border-cyan-500/30 rounded-xl p-6">
            <div className="text-sm text-gray-400 mb-2">🎯 Total Scope</div>
            <div className="text-3xl font-black text-cyan-400">{tasks.length}</div>
            <div className="text-xs text-gray-500 mt-2">{totalTokens.toLocaleString()} tokens</div>
            <div className="text-xs text-gray-500">${totalCost.toFixed(2)}</div>
          </div>

          <div className="bg-white/5 border border-purple-500/30 rounded-xl p-6">
            <div className="text-sm text-gray-400 mb-2">📊 Progress</div>
            <div className="text-3xl font-black text-purple-400">{Math.round((completedTokens / totalTokens) * 100)}%</div>
            <div className="w-full h-2 bg-black/30 rounded-full mt-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(completedTokens / totalTokens) * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-green-500 to-cyan-500"
              />
            </div>
          </div>
        </motion.div>

        {/* Completed Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-black text-green-400 mb-6">✅ Completed</h2>
          <div className="space-y-3">
            {completedTasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white/5 border border-green-500/30 rounded-xl p-4 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{task.name}</h3>
                    <p className="text-sm text-gray-400">{task.description}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs px-2 py-1 bg-white/10 rounded">{task.category}</span>
                      <span className="text-xs px-2 py-1 bg-white/10 rounded">
                        {task.estimatedTokens.toLocaleString()} tokens
                      </span>
                      <span className="text-xs px-2 py-1 bg-white/10 rounded">
                        ${task.estimatedCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <span className="text-2xl">✅</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Planned Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-black text-yellow-400 mb-6">📋 Planned</h2>
          <div className="space-y-3">
            {plannedTasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg">{task.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded border ${statusColors[task.status]}`}>
                        {task.status === 'planned' ? '📅 Planned' : '🚀 In Progress'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{task.description}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs px-2 py-1 bg-white/10 rounded">{task.category}</span>
                      <span className={`text-xs px-2 py-1 bg-white/10 rounded ${priorityColors[task.priority]}`}>
                        {task.priority.toUpperCase()}
                      </span>
                      <span className="text-xs px-2 py-1 bg-white/10 rounded">
                        {task.estimatedTokens.toLocaleString()} tokens
                      </span>
                      <span className="text-xs px-2 py-1 bg-white/10 rounded font-semibold">
                        ${task.estimatedCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Budget Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 p-8 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-white/10 rounded-2xl"
        >
          <h3 className="text-xl font-bold mb-4">💰 Budget Summary</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-400 mb-1">Spent</div>
              <div className="text-2xl font-black text-green-400">${completedCost.toFixed(2)}</div>
              <div className="text-xs text-gray-500">{completedTokens.toLocaleString()} tokens</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Remaining</div>
              <div className="text-2xl font-black text-yellow-400">${remainingCost.toFixed(2)}</div>
              <div className="text-xs text-gray-500">{remainingTokens.toLocaleString()} tokens</div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Available Budget</div>
              <div className="text-2xl font-black text-cyan-400">~$6.85</div>
              <div className="text-xs text-gray-500">After $10 top-up</div>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-4">
            ✅ You have enough budget to complete all planned features. Scope is achievable!
          </p>
        </motion.div>
      </div>
    </main>
  )
}
