'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const classEmojis: Record<string, string> = {
  warrior: '⚔️',
  mage: '🔥',
  rogue: '🗡️',
  paladin: '✨'
}

interface LeaderboardEntry {
  rank: number
  username: string
  agent_name: string
  class: string
  level: number
  rating: number
  wins: number
  losses: number
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'warrior' | 'mage' | 'rogue' | 'paladin'>('all')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/leaderboard`
      )
      setEntries(response.data.leaderboard || [])
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredEntries = filter === 'all' 
    ? entries 
    : entries.filter(e => e.class === filter)

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { emoji: '🥇', color: 'from-yellow-400 to-amber-500' }
    if (rank === 2) return { emoji: '🥈', color: 'from-gray-300 to-gray-400' }
    if (rank === 3) return { emoji: '🥉', color: 'from-amber-600 to-orange-700' }
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-yellow-500 rounded-full mix-blend-screen filter blur-[200px] opacity-10" />
        <div className="absolute bottom-0 right-1/3 w-[500px] h-[500px] bg-purple-500 rounded-full mix-blend-screen filter blur-[200px] opacity-10" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
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

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="text-6xl mb-4">🏆</div>
          <h1 className="text-5xl font-black mb-2">Leaderboard</h1>
          <p className="text-gray-400">The mightiest warriors in the arena</p>
        </motion.div>

        {/* Class Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center gap-2 mb-8"
        >
          {['all', 'warrior', 'mage', 'rogue', 'paladin'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                filter === f
                  ? 'bg-cyan-500 text-white'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
              }`}
            >
              {f === 'all' ? '🌟 All' : `${classEmojis[f]} ${f.charAt(0).toUpperCase() + f.slice(1)}`}
            </button>
          ))}
        </motion.div>

        {isLoading ? (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="text-5xl inline-block mb-4"
            >
              🏆
            </motion.div>
            <p className="text-gray-400">Loading champions...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white/5 rounded-2xl border border-white/10"
          >
            <div className="text-5xl mb-4">🏜️</div>
            <h3 className="text-xl font-bold mb-2">No Champions Yet</h3>
            <p className="text-gray-400 mb-4">Be the first to claim glory!</p>
            <Link
              href="/auth/register"
              className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Join the Arena
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 text-sm text-gray-500 uppercase tracking-wider">
              <div className="col-span-1">Rank</div>
              <div className="col-span-5">Player</div>
              <div className="col-span-2 text-center">Level</div>
              <div className="col-span-2 text-center">W/L</div>
              <div className="col-span-2 text-right">Rating</div>
            </div>

            {/* Entries */}
            {filteredEntries.map((entry, i) => {
              const rankBadge = getRankBadge(entry.rank)
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`grid grid-cols-12 gap-4 px-6 py-4 rounded-xl border transition-all ${
                    entry.rank <= 3
                      ? 'bg-gradient-to-r from-white/10 to-white/5 border-white/20'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {/* Rank */}
                  <div className="col-span-1 flex items-center">
                    {rankBadge ? (
                      <span className="text-2xl">{rankBadge.emoji}</span>
                    ) : (
                      <span className="text-xl font-bold text-gray-500">#{entry.rank}</span>
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
                      {classEmojis[entry.class] || '🎮'}
                    </div>
                    <div>
                      <div className="font-bold">{entry.agent_name}</div>
                      <div className="text-sm text-gray-500">@{entry.username}</div>
                    </div>
                  </div>

                  {/* Level */}
                  <div className="col-span-2 flex items-center justify-center">
                    <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm font-semibold">
                      Lv. {entry.level}
                    </span>
                  </div>

                  {/* W/L */}
                  <div className="col-span-2 flex items-center justify-center gap-2 text-sm">
                    <span className="text-green-400">{entry.wins}W</span>
                    <span className="text-gray-600">/</span>
                    <span className="text-red-400">{entry.losses}L</span>
                  </div>

                  {/* Rating */}
                  <div className="col-span-2 flex items-center justify-end">
                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
                      {entry.rating}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="inline-block p-8 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-white/10 rounded-2xl">
            {isLoggedIn ? (
              <>
                <h3 className="text-xl font-bold mb-2">Ready to Battle?</h3>
                <p className="text-gray-400 mb-4">Go back to your dashboard and join the queue</p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="inline-block px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                >
                  Go to Dashboard
                </button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-2">Ready to Compete?</h3>
                <p className="text-gray-400 mb-4">Create your agent and climb the ranks</p>
                <Link
                  href="/auth/register"
                  className="inline-block px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
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
