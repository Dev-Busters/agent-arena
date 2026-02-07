'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import Link from 'next/link'

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/leaderboard?limit=50`
      )
      setEntries(response.data.entries || [])
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load leaderboard')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-dark to-darker">
      <nav className="border-b border-primary border-opacity-20 bg-gray-900 bg-opacity-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">🏆 Leaderboard</h1>
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-primary transition"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-200 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading leaderboard...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No players yet. Be the first to join!</p>
          </div>
        ) : (
          <div className="bg-gray-900 bg-opacity-50 border border-primary border-opacity-20 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-primary border-opacity-20 bg-gray-800 bg-opacity-50">
                <tr>
                  <th className="px-6 py-4 text-left text-primary">Rank</th>
                  <th className="px-6 py-4 text-left text-primary">Player</th>
                  <th className="px-6 py-4 text-left text-primary">Rating</th>
                  <th className="px-6 py-4 text-left text-primary">Wins</th>
                  <th className="px-6 py-4 text-left text-primary">Losses</th>
                  <th className="px-6 py-4 text-left text-primary">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.user_id}
                    className="border-b border-gray-700 hover:bg-gray-800 hover:bg-opacity-30 transition"
                  >
                    <td className="px-6 py-4">
                      <span className="text-primary font-bold text-lg">
                        {entry.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold">{entry.username}</td>
                    <td className="px-6 py-4 text-primary font-bold">{entry.rating}</td>
                    <td className="px-6 py-4 text-green-400">{entry.wins}</td>
                    <td className="px-6 py-4 text-red-400">{entry.losses}</td>
                    <td className="px-6 py-4">{entry.win_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}
