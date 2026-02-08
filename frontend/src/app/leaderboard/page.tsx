'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

const classData: Record<string, { symbol: string; color: string }> = {
  warrior: { symbol: '⚔', color: 'text-red-400' },
  mage: { symbol: '✦', color: 'text-blue-400' },
  rogue: { symbol: '◆', color: 'text-purple-400' },
  paladin: { symbol: '☀', color: 'text-amber-400' }
}

type LeaderboardCategory = 'rating' | 'wins' | 'depth' | 'gold'

interface LeaderboardEntry {
  rank: number
  user_id: string
  username: string
  agent_name: string
  class: string
  level: number
  rating: number
  wins: number
  losses: number
  max_depth: number
  total_gold: number
}

// Mock data for demo (replace with real API)
const mockEntries: LeaderboardEntry[] = [
  { rank: 1, user_id: '1', username: 'ShadowBlade', agent_name: 'Nyx', class: 'rogue', level: 45, rating: 2847, wins: 312, losses: 89, max_depth: 10, total_gold: 1250000 },
  { rank: 2, user_id: '2', username: 'DragonSlayer', agent_name: 'Alduin', class: 'warrior', level: 42, rating: 2691, wins: 287, losses: 94, max_depth: 10, total_gold: 980000 },
  { rank: 3, user_id: '3', username: 'ArcaneWizard', agent_name: 'Merlin', class: 'mage', level: 40, rating: 2534, wins: 256, losses: 112, max_depth: 9, total_gold: 875000 },
  { rank: 4, user_id: '4', username: 'HolyKnight', agent_name: 'Galahad', class: 'paladin', level: 38, rating: 2401, wins: 234, losses: 98, max_depth: 9, total_gold: 720000 },
  { rank: 5, user_id: '5', username: 'PhantomStriker', agent_name: 'Shade', class: 'rogue', level: 36, rating: 2298, wins: 198, losses: 87, max_depth: 8, total_gold: 654000 },
  { rank: 6, user_id: '6', username: 'IronFist', agent_name: 'Titan', class: 'warrior', level: 35, rating: 2187, wins: 187, losses: 92, max_depth: 8, total_gold: 598000 },
  { rank: 7, user_id: '7', username: 'FrostMage', agent_name: 'Elsa', class: 'mage', level: 33, rating: 2089, wins: 167, losses: 88, max_depth: 7, total_gold: 521000 },
  { rank: 8, user_id: '8', username: 'LightBringer', agent_name: 'Aurora', class: 'paladin', level: 31, rating: 1987, wins: 156, losses: 79, max_depth: 7, total_gold: 467000 },
  { rank: 9, user_id: '9', username: 'NightStalker', agent_name: 'Vex', class: 'rogue', level: 29, rating: 1876, wins: 143, losses: 81, max_depth: 6, total_gold: 398000 },
  { rank: 10, user_id: '10', username: 'BattleMaster', agent_name: 'Kronos', class: 'warrior', level: 28, rating: 1798, wins: 134, losses: 76, max_depth: 6, total_gold: 356000 },
]

export default function LeaderboardPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [category, setCategory] = useState<LeaderboardCategory>('rating')
  const [classFilter, setClassFilter] = useState<'all' | 'warrior' | 'mage' | 'rogue' | 'paladin'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    setIsLoggedIn(!!token)
    if (user) setCurrentUser(JSON.parse(user))
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/leaderboard`
      )
      setEntries(response.data.leaderboard?.length > 0 ? response.data.leaderboard : mockEntries)
    } catch (err) {
      // Use mock data if API fails
      setEntries(mockEntries)
    } finally {
      setIsLoading(false)
    }
  }

  // Sort entries by category
  const sortedEntries = [...entries].sort((a, b) => {
    switch (category) {
      case 'rating': return b.rating - a.rating
      case 'wins': return b.wins - a.wins
      case 'depth': return b.max_depth - a.max_depth
      case 'gold': return b.total_gold - a.total_gold
      default: return 0
    }
  }).map((entry, i) => ({ ...entry, rank: i + 1 }))

  // Filter by class and search
  const filteredEntries = sortedEntries
    .filter(e => classFilter === 'all' || e.class === classFilter)
    .filter(e => 
      searchQuery === '' || 
      e.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.agent_name.toLowerCase().includes(searchQuery.toLowerCase())
    )

  const categories: { id: LeaderboardCategory; label: string; icon: string; valueKey: keyof LeaderboardEntry; format: (v: number) => string }[] = [
    { id: 'rating', label: 'ELO Rating', icon: '🏆', valueKey: 'rating', format: (v) => v.toLocaleString() },
    { id: 'wins', label: 'Total Wins', icon: '⚔', valueKey: 'wins', format: (v) => v.toLocaleString() },
    { id: 'depth', label: 'Deepest Floor', icon: '🏰', valueKey: 'max_depth', format: (v) => `Floor ${v}` },
    { id: 'gold', label: 'Gold Earned', icon: '💰', valueKey: 'total_gold', format: (v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v.toString() },
  ]

  const currentCategory = categories.find(c => c.id === category)!

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return { badge: '👑', color: 'from-yellow-400 to-amber-500', glow: 'shadow-yellow-500/30' }
    if (rank === 2) return { badge: '🥈', color: 'from-stone-300 to-stone-400', glow: 'shadow-stone-400/30' }
    if (rank === 3) return { badge: '🥉', color: 'from-amber-600 to-orange-600', glow: 'shadow-orange-500/30' }
    return null
  }

  const getWinRate = (wins: number, losses: number) => {
    const total = wins + losses
    if (total === 0) return 0
    return Math.round((wins / total) * 100)
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[200px]" />
        <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[200px]" />
      </div>
      
      {/* Stone texture */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} 
      />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-stone-800 bg-stone-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
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
          <Link
            href={isLoggedIn ? "/dashboard" : "/auth/login"}
            className="px-4 py-2 bg-stone-800 border border-stone-700 rounded-lg hover:bg-stone-700 transition-all text-sm font-medium"
          >
            {isLoggedIn ? "Dashboard" : "Sign In"}
          </Link>
        </div>
      </nav>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <motion.div 
            className="text-6xl mb-4"
            animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            🏆
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight">Hall of Champions</h1>
          <p className="text-stone-500">The greatest warriors to descend into the depths</p>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 mb-6"
        >
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                category === cat.id
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-stone-900/50 text-stone-500 border border-stone-800 hover:border-stone-700 hover:text-stone-300'
              }`}
            >
              <span>{cat.icon}</span>
              <span className="hidden sm:inline">{cat.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Filters Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          {/* Class Filter */}
          <div className="flex gap-1 p-1 bg-stone-900/50 border border-stone-800 rounded-xl">
            {['all', 'warrior', 'mage', 'rogue', 'paladin'].map((cls) => (
              <button
                key={cls}
                onClick={() => setClassFilter(cls as any)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  classFilter === cls
                    ? 'bg-stone-800 text-white'
                    : 'text-stone-500 hover:text-stone-300'
                }`}
              >
                {cls === 'all' ? 'All' : (
                  <span className={classData[cls]?.color}>{classData[cls]?.symbol}</span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-900/50 border border-stone-800 rounded-xl text-sm placeholder-stone-600 focus:outline-none focus:border-amber-500/50 transition-all"
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="text-center py-16">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="text-5xl inline-block mb-4"
            >
              ⚔
            </motion.div>
            <p className="text-stone-500">Loading champions...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-stone-900/30 rounded-2xl border border-stone-800"
          >
            <div className="text-5xl mb-4">🏜️</div>
            <h3 className="text-xl font-bold mb-2">No Champions Found</h3>
            <p className="text-stone-500 mb-6">
              {searchQuery ? 'Try a different search term' : 'Be the first to claim glory!'}
            </p>
            {!isLoggedIn && (
              <Link
                href="/auth/register"
                className="inline-block px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Enter the Arena
              </Link>
            )}
          </motion.div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {category === 'rating' && classFilter === 'all' && searchQuery === '' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-3 gap-4 mb-8"
              >
                {[1, 0, 2].map((podiumIndex) => {
                  const entry = filteredEntries[podiumIndex]
                  if (!entry) return <div key={podiumIndex} />
                  const rank = getRankDisplay(entry.rank)!
                  const cls = classData[entry.class]
                  
                  return (
                    <motion.div
                      key={entry.user_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + podiumIndex * 0.1 }}
                      className={`relative p-6 rounded-2xl border border-stone-800 bg-gradient-to-b from-stone-900/80 to-stone-950 text-center ${
                        podiumIndex === 0 ? 'md:-mt-4 md:scale-105' : ''
                      }`}
                    >
                      {/* Rank badge */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="text-3xl">{rank.badge}</span>
                      </div>
                      
                      {/* Class symbol */}
                      <motion.div 
                        className={`text-5xl mb-3 ${cls?.color}`}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {cls?.symbol}
                      </motion.div>
                      
                      <h3 className="font-bold text-lg truncate">{entry.agent_name}</h3>
                      <p className="text-stone-500 text-sm truncate">@{entry.username}</p>
                      
                      <div className={`mt-4 text-3xl font-black bg-gradient-to-r ${rank.color} bg-clip-text text-transparent`}>
                        {currentCategory.format(entry[currentCategory.valueKey] as number)}
                      </div>
                      
                      <div className="mt-2 text-xs text-stone-500">
                        Level {entry.level} • {getWinRate(entry.wins, entry.losses)}% WR
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}

            {/* Table */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-stone-900/30 border border-stone-800 rounded-2xl overflow-hidden"
            >
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-stone-900/50 text-xs text-stone-500 uppercase tracking-wider border-b border-stone-800">
                <div className="col-span-1">#</div>
                <div className="col-span-4">Champion</div>
                <div className="col-span-2 text-center">Level</div>
                <div className="col-span-2 text-center">Win Rate</div>
                <div className="col-span-3 text-right">{currentCategory.label}</div>
              </div>

              {/* Entries */}
              <AnimatePresence>
                {filteredEntries.slice(category === 'rating' && classFilter === 'all' && searchQuery === '' ? 3 : 0, 50).map((entry, i) => {
                  const rank = getRankDisplay(entry.rank)
                  const cls = classData[entry.class]
                  const winRate = getWinRate(entry.wins, entry.losses)
                  const isCurrentUser = currentUser?.username === entry.username
                  
                  return (
                    <motion.div
                      key={entry.user_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: i * 0.03 }}
                      className={`grid grid-cols-12 gap-4 px-6 py-4 border-b border-stone-800/50 hover:bg-stone-800/30 transition-all ${
                        isCurrentUser ? 'bg-amber-500/5 border-l-2 border-l-amber-500' : ''
                      }`}
                    >
                      {/* Rank */}
                      <div className="col-span-1 flex items-center">
                        {rank ? (
                          <span className="text-xl">{rank.badge}</span>
                        ) : (
                          <span className="text-lg font-bold text-stone-600">#{entry.rank}</span>
                        )}
                      </div>

                      {/* Player Info */}
                      <div className="col-span-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center text-xl ${cls?.color}`}>
                          {cls?.symbol}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold truncate flex items-center gap-2">
                            {entry.agent_name}
                            {isCurrentUser && <span className="text-xs text-amber-500">(You)</span>}
                          </div>
                          <div className="text-xs text-stone-600 truncate">@{entry.username}</div>
                        </div>
                      </div>

                      {/* Level */}
                      <div className="col-span-2 flex items-center justify-center">
                        <span className="px-2.5 py-1 bg-stone-800 rounded-lg text-xs font-semibold text-stone-300">
                          Lv.{entry.level}
                        </span>
                      </div>

                      {/* Win Rate */}
                      <div className="col-span-2 flex items-center justify-center">
                        <div className="text-center">
                          <div className={`text-sm font-bold ${
                            winRate >= 60 ? 'text-emerald-400' : winRate >= 50 ? 'text-amber-400' : 'text-stone-400'
                          }`}>
                            {winRate}%
                          </div>
                          <div className="text-[10px] text-stone-600">
                            {entry.wins}W / {entry.losses}L
                          </div>
                        </div>
                      </div>

                      {/* Value */}
                      <div className="col-span-3 flex items-center justify-end">
                        <span className="text-xl font-black text-amber-400">
                          {currentCategory.format(entry[currentCategory.valueKey] as number)}
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </motion.div>

            {/* Stats Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4"
            >
              <div className="p-4 bg-stone-900/30 border border-stone-800 rounded-xl text-center">
                <div className="text-2xl font-black text-amber-400">{entries.length}</div>
                <div className="text-xs text-stone-500">Total Champions</div>
              </div>
              <div className="p-4 bg-stone-900/30 border border-stone-800 rounded-xl text-center">
                <div className="text-2xl font-black text-emerald-400">
                  {entries.reduce((sum, e) => sum + e.wins, 0).toLocaleString()}
                </div>
                <div className="text-xs text-stone-500">Battles Won</div>
              </div>
              <div className="p-4 bg-stone-900/30 border border-stone-800 rounded-xl text-center">
                <div className="text-2xl font-black text-purple-400">
                  Floor {Math.max(...entries.map(e => e.max_depth))}
                </div>
                <div className="text-xs text-stone-500">Deepest Descent</div>
              </div>
              <div className="p-4 bg-stone-900/30 border border-stone-800 rounded-xl text-center">
                <div className="text-2xl font-black text-blue-400">
                  {(entries.reduce((sum, e) => sum + e.total_gold, 0) / 1000000).toFixed(1)}M
                </div>
                <div className="text-xs text-stone-500">Total Gold Earned</div>
              </div>
            </motion.div>
          </>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="inline-block p-8 bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl">
            {isLoggedIn ? (
              <>
                <h3 className="text-xl font-bold mb-2">Ready to Climb?</h3>
                <p className="text-stone-500 mb-4">Enter the depths and prove your worth</p>
                <button
                  onClick={() => router.push('/dungeon')}
                  className="inline-block px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/25 transition-all"
                >
                  Enter the Depths
                </button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-2">Join the Ranks</h3>
                <p className="text-stone-500 mb-4">Create your champion and start climbing</p>
                <Link
                  href="/auth/register"
                  className="inline-block px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/25 transition-all"
                >
                  Enter the Arena
                </Link>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </main>
  )
}
