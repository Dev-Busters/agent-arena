'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [agent, setAgent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
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
      setError(err.response?.data?.error || 'Failed to load dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-dark to-darker flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎮</div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-dark to-darker">
      <nav className="border-b border-primary border-opacity-20 bg-gray-900 bg-opacity-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">🎮 Agent Arena</h1>
          <button
            onClick={() => {
              localStorage.removeItem('token')
              router.push('/')
            }}
            className="text-gray-400 hover:text-primary transition"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-200 p-4 rounded mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Agent Card */}
          {agent ? (
            <div className="md:col-span-2 bg-gray-900 bg-opacity-50 border border-primary border-opacity-20 rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4 text-primary">{agent.name}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400">Class</p>
                  <p className="text-xl font-bold capitalize">{agent.class}</p>
                </div>
                <div>
                  <p className="text-gray-400">Level</p>
                  <p className="text-xl font-bold">{agent.level}</p>
                </div>
                <div>
                  <p className="text-gray-400">HP</p>
                  <p className="text-xl font-bold">
                    {agent.current_hp} / {agent.max_hp}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Attack</p>
                  <p className="text-xl font-bold">{agent.attack}</p>
                </div>
              </div>
              <Link
                href="/agent/create"
                className="mt-6 inline-block px-4 py-2 bg-primary text-dark font-bold rounded hover:bg-opacity-90 transition"
              >
                Create New Agent
              </Link>
            </div>
          ) : (
            <div className="md:col-span-2 bg-gray-900 bg-opacity-50 border border-primary border-opacity-20 rounded-lg p-6 text-center">
              <p className="text-gray-400 mb-4">No active agent</p>
              <Link
                href="/agent/create"
                className="inline-block px-4 py-2 bg-primary text-dark font-bold rounded hover:bg-opacity-90 transition"
              >
                Create Your First Agent
              </Link>
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-4">
            <Link
              href="/battle/queue"
              className="block w-full px-4 py-3 bg-primary text-dark font-bold rounded text-center hover:bg-opacity-90 transition"
            >
              ⚔️ Join Battle Queue
            </Link>
            <Link
              href="/leaderboard"
              className="block w-full px-4 py-3 border-2 border-primary text-primary font-bold rounded text-center hover:bg-primary hover:bg-opacity-10 transition"
            >
              🏆 Leaderboard
            </Link>
            <Link
              href="/battles/history"
              className="block w-full px-4 py-3 border-2 border-primary text-primary font-bold rounded text-center hover:bg-primary hover:bg-opacity-10 transition"
            >
              📋 Battle History
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        {agent && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 bg-opacity-50 border border-primary border-opacity-20 rounded p-4">
              <p className="text-gray-400 text-sm">Defense</p>
              <p className="text-2xl font-bold">{agent.defense}</p>
            </div>
            <div className="bg-gray-900 bg-opacity-50 border border-primary border-opacity-20 rounded p-4">
              <p className="text-gray-400 text-sm">Speed</p>
              <p className="text-2xl font-bold">{agent.speed}</p>
            </div>
            <div className="bg-gray-900 bg-opacity-50 border border-primary border-opacity-20 rounded p-4">
              <p className="text-gray-400 text-sm">Accuracy</p>
              <p className="text-2xl font-bold">{agent.accuracy}</p>
            </div>
            <div className="bg-gray-900 bg-opacity-50 border border-primary border-opacity-20 rounded p-4">
              <p className="text-gray-400 text-sm">Evasion</p>
              <p className="text-2xl font-bold">{agent.evasion}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
