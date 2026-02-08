'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import { motion } from 'framer-motion'

const classEmojis: Record<string, string> = {
  warrior: '⚔️',
  mage: '🔥',
  rogue: '🗡️',
  paladin: '✨'
}

const classColors: Record<string, string> = {
  warrior: 'from-red-600 to-orange-500',
  mage: 'from-blue-600 to-purple-500',
  rogue: 'from-purple-600 to-pink-500',
  paladin: 'from-yellow-500 to-amber-400'
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [agent, setAgent] = useState<any>(null)
  const [stats, setStats] = useState({ wins: 0, losses: 0, battles: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }

    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }

    fetchData(token)
  }, [])

  const fetchData = async (token: string) => {
    try {
      const headers = { Authorization: `Bearer ${token}` }

      // Get current agent
      const agentResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/agents/me/current`,
        { headers }
      )
      setAgent(agentResponse.data)
    } catch (err: any) {
      // No agent yet is fine
      if (err.response?.status !== 404) {
        setError(err.response?.data?.error || 'Failed to load dashboard')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="text-6xl mb-4 inline-block"
          >
            🎮
          </motion.div>
          <p className="text-gray-400">Loading your arena...</p>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500 rounded-full mix-blend-screen filter blur-[200px] opacity-10" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500 rounded-full mix-blend-screen filter blur-[200px] opacity-10" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-3xl">🎮</span>
            <span className="text-2xl font-black">Agent Arena</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/leaderboard" className="text-gray-400 hover:text-white transition-colors">
              Leaderboard
            </Link>
            <Link href="/shop" className="text-gray-400 hover:text-white transition-colors">
              Shop
            </Link>
            
            <div className="flex items-center gap-3 pl-6 border-l border-white/10">
              <div className="text-right">
                <div className="text-sm font-semibold">{user?.username || 'Player'}</div>
                <div className="text-xs text-gray-500">Level {user?.level || 1}</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                title="Sign Out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200"
          >
            {error}
          </motion.div>
        )}

        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-black mb-2">
            Welcome back, <span className="text-cyan-400">{user?.username || 'Champion'}</span>
          </h1>
          <p className="text-gray-400">Ready for battle?</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content - Agent Card */}
          <div className="lg:col-span-2 space-y-6">
            {agent ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${classColors[agent.class] || 'from-gray-700 to-gray-600'} p-[1px]`}
              >
                <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center text-5xl">
                        {classEmojis[agent.class] || '🎮'}
                      </div>
                      <div>
                        <h2 className="text-3xl font-black">{agent.name}</h2>
                        <p className="text-gray-400 capitalize">Level {agent.level} {agent.class}</p>
                      </div>
                    </div>
                    <Link
                      href="/agent/customize"
                      className="px-4 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-all"
                    >
                      Customize
                    </Link>
                  </div>

                  {/* HP Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Health</span>
                      <span className="font-bold">{agent.current_hp} / {agent.max_hp}</span>
                    </div>
                    <div className="h-3 bg-black/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(agent.current_hp / agent.max_hp) * 100}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                      />
                    </div>
                  </div>

                  {/* XP Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Experience</span>
                      <span className="font-bold">{agent.xp || 0} / {(agent.level || 1) * 100}</span>
                    </div>
                    <div className="h-2 bg-black/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((agent.xp || 0) / ((agent.level || 1) * 100)) * 100}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-400 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'ATK', value: agent.attack, color: 'text-red-400' },
                      { label: 'DEF', value: agent.defense, color: 'text-blue-400' },
                      { label: 'SPD', value: agent.speed, color: 'text-yellow-400' },
                      { label: 'ACC', value: agent.accuracy, color: 'text-green-400' }
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="bg-black/30 rounded-xl p-3 text-center"
                      >
                        <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                        <div className="text-xs text-gray-500">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Equipment Preview */}
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <h3 className="text-sm text-gray-400 mb-3">Equipment</h3>
                    <div className="flex gap-3">
                      {['weapon', 'armor', 'accessory'].map((slot) => (
                        <div
                          key={slot}
                          className="flex-1 h-16 bg-black/30 rounded-xl flex items-center justify-center text-gray-600 text-sm capitalize"
                        >
                          {agent[slot]?.name || `No ${slot}`}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center"
              >
                <div className="text-6xl mb-4">🎮</div>
                <h2 className="text-2xl font-bold mb-2">Create Your First Agent</h2>
                <p className="text-gray-400 mb-6">Choose a class and enter the arena!</p>
                <Link
                  href="/agent/create"
                  className="inline-block px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                >
                  Create Agent
                </Link>
              </motion.div>
            )}

            {/* Battle Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-3 gap-4"
            >
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <div className="text-3xl font-black text-green-400">{stats.wins}</div>
                <div className="text-sm text-gray-500">Victories</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <div className="text-3xl font-black text-red-400">{stats.losses}</div>
                <div className="text-sm text-gray-500">Defeats</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <div className="text-3xl font-black text-cyan-400">{stats.battles}</div>
                <div className="text-sm text-gray-500">Total Battles</div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Quick Actions */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Link
                href="/battle/queue"
                className="block w-full p-6 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl font-bold text-center hover:shadow-2xl hover:shadow-cyan-500/30 transition-all group"
              >
                <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">⚔️</div>
                <div className="text-xl">Find Battle</div>
                <div className="text-sm opacity-80">Join the queue</div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Link
                href="/battle/test"
                className="block w-full p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🧪</span>
                  <div>
                    <div className="font-semibold">Test Battle</div>
                    <div className="text-sm text-gray-500">Practice mode</div>
                  </div>
                </div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Link
                href="/leaderboard"
                className="block w-full p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <div className="font-semibold">Leaderboard</div>
                    <div className="text-sm text-gray-500">Top players</div>
                  </div>
                </div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Link
                href="/shop"
                className="block w-full p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🛒</span>
                  <div>
                    <div className="font-semibold">Shop</div>
                    <div className="text-sm text-gray-500">Cosmetics & gear</div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Gold Display */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="p-4 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💰</span>
                  <span className="text-gray-400">Gold</span>
                </div>
                <span className="text-2xl font-black text-yellow-400">
                  {user?.gold?.toLocaleString() || '1,000'}
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  )
}
