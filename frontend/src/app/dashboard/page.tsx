'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import { motion } from 'framer-motion'

const classData: Record<string, { symbol: string; color: string; accent: string; glow: string }> = {
  warrior: { symbol: '⚔', color: 'from-red-900/80 to-red-950', accent: 'border-red-500/50', glow: 'shadow-red-500/20' },
  mage: { symbol: '✦', color: 'from-blue-900/80 to-indigo-950', accent: 'border-blue-500/50', glow: 'shadow-blue-500/20' },
  rogue: { symbol: '◆', color: 'from-purple-900/80 to-violet-950', accent: 'border-purple-500/50', glow: 'shadow-purple-500/20' },
  paladin: { symbol: '☀', color: 'from-amber-900/80 to-yellow-950', accent: 'border-amber-500/50', glow: 'shadow-amber-500/20' }
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
      const agentResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/agents/me/current`,
        { headers }
      )
      setAgent(agentResponse.data)
    } catch (err: any) {
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
      <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="text-6xl mb-4 inline-block"
          >
            ⚔
          </motion.div>
          <p className="text-stone-500">Entering the arena...</p>
        </motion.div>
      </main>
    )
  }

  const cls = agent ? classData[agent.class] : null

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[200px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[200px]" />
      </div>
      
      {/* Stone texture */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} 
      />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-stone-800 bg-stone-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <motion.span 
              className="text-3xl"
              animate={{ textShadow: ['0 0 20px #f59e0b', '0 0 40px #f59e0b', '0 0 20px #f59e0b'] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ⚔
            </motion.span>
            <div>
              <span className="text-xl font-black tracking-tight">AGENT</span>
              <span className="text-xl font-black tracking-tight text-amber-500">ARENA</span>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/showcase" className="text-stone-500 hover:text-amber-400 transition-colors text-sm font-medium">
              Showcase
            </Link>
            <Link href="/leaderboard" className="text-stone-500 hover:text-amber-400 transition-colors text-sm font-medium">
              Leaderboard
            </Link>
            
            <div className="flex items-center gap-3 pl-6 border-l border-stone-800">
              <div className="text-right">
                <div className="text-sm font-semibold text-stone-200">{user?.username || 'Champion'}</div>
                <div className="text-xs text-stone-600">Level {user?.level || 1}</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-stone-500 hover:text-red-400 transition-colors"
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
            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300"
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
          <h1 className="text-3xl font-black mb-1">
            Welcome back, <span className="text-amber-400">{user?.username || 'Champion'}</span>
          </h1>
          <p className="text-stone-500">The depths await your return.</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content - Agent Card */}
          <div className="lg:col-span-2 space-y-6">
            {agent ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`relative overflow-hidden rounded-2xl border ${cls?.accent} bg-gradient-to-br ${cls?.color} shadow-2xl ${cls?.glow}`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <motion.div 
                        className="w-20 h-20 rounded-2xl bg-black/30 flex items-center justify-center text-5xl border border-white/10"
                        animate={{ 
                          boxShadow: ['0 0 20px rgba(245,158,11,0.2)', '0 0 40px rgba(245,158,11,0.3)', '0 0 20px rgba(245,158,11,0.2)']
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {cls?.symbol}
                      </motion.div>
                      <div>
                        <h2 className="text-3xl font-black tracking-tight">{agent.name}</h2>
                        <p className="text-stone-400 capitalize text-sm">Level {agent.level} {agent.class}</p>
                      </div>
                    </div>
                    <Link
                      href="/agent/customize"
                      className="px-3 py-1.5 text-xs bg-black/30 border border-white/10 rounded-lg hover:bg-black/50 transition-all"
                    >
                      Customize
                    </Link>
                  </div>

                  {/* HP Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-stone-400 uppercase tracking-wider">Health</span>
                      <span className="font-bold text-stone-200">{agent.current_hp} / {agent.max_hp}</span>
                    </div>
                    <div className="h-3 bg-black/50 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(agent.current_hp / agent.max_hp) * 100}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-amber-400 rounded-full"
                      />
                    </div>
                  </div>

                  {/* XP Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-stone-400 uppercase tracking-wider">Experience</span>
                      <span className="font-bold text-stone-200">{agent.xp || 0} / {(agent.level || 1) * 100}</span>
                    </div>
                    <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((agent.xp || 0) / ((agent.level || 1) * 100)) * 100}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'ATK', value: agent.attack, color: 'text-red-400' },
                      { label: 'DEF', value: agent.defense, color: 'text-blue-400' },
                      { label: 'SPD', value: agent.speed, color: 'text-emerald-400' },
                      { label: 'ACC', value: agent.accuracy, color: 'text-amber-400' }
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="bg-black/30 border border-white/5 rounded-xl p-3 text-center"
                      >
                        <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                        <div className="text-[10px] text-stone-500 uppercase tracking-wider">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Equipment Preview */}
                  <div className="mt-6 pt-6 border-t border-white/10">
                    <h3 className="text-xs text-stone-500 mb-3 uppercase tracking-wider">Equipment</h3>
                    <div className="flex gap-2">
                      {['Weapon', 'Armor', 'Accessory'].map((slot) => (
                        <div
                          key={slot}
                          className="flex-1 h-14 bg-black/30 border border-white/5 rounded-xl flex items-center justify-center text-stone-600 text-xs"
                        >
                          {agent[slot.toLowerCase()]?.name || `No ${slot}`}
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
                className="rounded-2xl border border-stone-800 bg-stone-900/50 p-12 text-center"
              >
                <motion.div 
                  className="text-6xl mb-4"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ⚔
                </motion.div>
                <h2 className="text-2xl font-black mb-2">Create Your Champion</h2>
                <p className="text-stone-500 mb-6">Choose a class and begin your descent.</p>
                <Link
                  href="/agent/create"
                  className="inline-block px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/25 transition-all"
                >
                  Create Champion
                </Link>
              </motion.div>
            )}

            {/* Battle Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-3 gap-3"
            >
              <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-4 text-center">
                <div className="text-3xl font-black text-emerald-400">{stats.wins}</div>
                <div className="text-xs text-stone-500 uppercase tracking-wider">Victories</div>
              </div>
              <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-4 text-center">
                <div className="text-3xl font-black text-red-400">{stats.losses}</div>
                <div className="text-xs text-stone-500 uppercase tracking-wider">Defeats</div>
              </div>
              <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-4 text-center">
                <div className="text-3xl font-black text-amber-400">{stats.battles}</div>
                <div className="text-xs text-stone-500 uppercase tracking-wider">Total Battles</div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar - Quick Actions */}
          <div className="space-y-3">
            {/* Primary CTA - Dungeon */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Link
                href="/dungeon"
                className="block w-full p-5 bg-gradient-to-br from-amber-600/20 to-orange-700/20 border border-amber-500/30 rounded-xl hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="text-4xl"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    🏰
                  </motion.div>
                  <div>
                    <div className="font-bold text-lg">Enter the Depths</div>
                    <div className="text-sm text-amber-400/70">10 Floors • 6 Special Zones</div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* PVP Battle */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Link
                href="/battle/queue"
                className="block w-full p-4 bg-stone-900/50 border border-stone-800 rounded-xl hover:border-stone-700 hover:bg-stone-900 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚔️</span>
                  <div>
                    <div className="font-semibold">PVP Battle</div>
                    <div className="text-xs text-stone-500">Find an opponent</div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Test Battle */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 }}
            >
              <Link
                href="/battle/test"
                className="block w-full p-4 bg-stone-900/50 border border-stone-800 rounded-xl hover:border-stone-700 hover:bg-stone-900 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🧪</span>
                  <div>
                    <div className="font-semibold">Test Battle</div>
                    <div className="text-xs text-stone-500">Practice mode</div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Crafting */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Link
                href="/crafting"
                className="block w-full p-4 bg-gradient-to-br from-purple-900/30 to-violet-900/30 border border-purple-500/30 rounded-xl hover:border-purple-500/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚒️</span>
                  <div>
                    <div className="font-semibold">Crafting Forge</div>
                    <div className="text-xs text-purple-400/70">17 materials • ∞ combinations</div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Showcase */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 }}
            >
              <Link
                href="/showcase"
                className="block w-full p-4 bg-stone-900/50 border border-stone-800 rounded-xl hover:border-stone-700 hover:bg-stone-900 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✨</span>
                  <div>
                    <div className="font-semibold">3D Showcase</div>
                    <div className="text-xs text-stone-500">View gear in 3D</div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Leaderboard */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Link
                href="/leaderboard"
                className="block w-full p-4 bg-stone-900/50 border border-stone-800 rounded-xl hover:border-stone-700 hover:bg-stone-900 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <div className="font-semibold">Leaderboard</div>
                    <div className="text-xs text-stone-500">Top champions</div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-stone-700 to-transparent my-4" />

            {/* Gold Display */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.65 }}
              className="p-4 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/20 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💰</span>
                  <span className="text-stone-500 text-sm">Gold</span>
                </div>
                <span className="text-xl font-black text-amber-400">
                  {(user?.gold || 1000).toLocaleString()}
                </span>
              </div>
            </motion.div>

            {/* Materials Count */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="p-4 bg-stone-900/50 border border-stone-800 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💎</span>
                  <span className="text-stone-500 text-sm">Materials</span>
                </div>
                <span className="text-lg font-bold text-purple-400">
                  {user?.materials || 0}
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  )
}
