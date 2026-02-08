'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import {
  AgentProfileCard,
  QuickActions,
  CostWidget,
  ModelSelector,
  CostHistory,
  SessionSummary,
} from '@/components/Dashboard'
import { TASK_ESTIMATES, ModelType } from '@/utils/costCalculator'
import { initSession } from '@/utils/costTracker'

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [agent, setAgent] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedModel, setSelectedModel] = useState<ModelType>('haiku')
  const [sessionInited, setSessionInited] = useState(false)

  useEffect(() => {
    // Initialize cost tracking session
    if (!sessionInited) {
      initSession()
      setSessionInited(true)
    }

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
      if (err.response?.status === 404) {
        // No agent exists yet, that's OK
        setAgent(null)
      } else {
        setError(err.response?.data?.error || 'Failed to load dashboard')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🎮</div>
          <p className="text-gray-400">Loading Agent Arena...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-primary/20 bg-gray-900/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎮</span>
            <h1 className="text-xl font-bold text-primary hidden sm:block">Agent Arena</h1>
          </div>
          <div className="flex items-center gap-4">
            {agent && (
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-400">Active Agent</p>
                <p className="font-bold text-white">{agent.name}</p>
              </div>
            )}
            <button
              onClick={() => {
                localStorage.removeItem('token')
                router.push('/')
              }}
              className="px-4 py-2 text-sm text-gray-400 hover:text-primary transition rounded-lg hover:bg-primary/10"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-lg">
            {error}
          </div>
        )}

        {agent ? (
          // Agent exists - show full dashboard
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Agent Profile */}
            <div className="lg:col-span-2">
              <AgentProfileCard agent={agent} />
            </div>

            {/* Right Column - Quick Actions & Costs */}
            <div className="space-y-6 pb-80">
              <ModelSelector selected={selectedModel} onChange={setSelectedModel} />

              <QuickActions costs={{ battle: TASK_ESTIMATES.battle(selectedModel) }} />

              {/* Cost History */}
              <CostHistory />

              {/* Cost Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Estimated Costs</h3>
                <CostWidget
                  title="Battle (1v1)"
                  cost={TASK_ESTIMATES.battle(selectedModel)}
                />
                <CostWidget
                  title="Agent Creation"
                  cost={TASK_ESTIMATES.createAgent(selectedModel)}
                />
              </div>

              {/* Info Box */}
              <div className="bg-gray-900/50 border border-primary/20 rounded-lg p-4 text-sm text-gray-400">
                <p className="mb-2">💡 <span className="font-bold">Pro Tip</span></p>
                <p className="text-xs">
                  Select your preferred API model above. Estimates update automatically. Haiku is fastest and cheapest, while Opus is most capable.
                </p>
              </div>
            </div>
          </div>
        ) : (
          // No agent - show onboarding
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-primary/30 rounded-lg p-12 text-center">
              <div className="text-5xl mb-6">🤖</div>
              <h2 className="text-3xl font-bold text-white mb-4">Create Your First Agent</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Build your AI combatant and enter the arena. Each agent starts with unique stats based on
                their class. Choose wisely!
              </p>

              <div className="space-y-4 mb-8">
                <div className="text-left bg-gray-800/50 rounded p-4 inline-block">
                  <p className="font-bold text-primary mb-2">⚔️ Warrior</p>
                  <p className="text-sm text-gray-300">High HP & Defense, moderate damage</p>
                </div>
                <div className="text-left bg-gray-800/50 rounded p-4 inline-block">
                  <p className="font-bold text-blue-400 mb-2">🔥 Mage</p>
                  <p className="text-sm text-gray-300">High Accuracy & Speed, lower defense</p>
                </div>
                <div className="text-left bg-gray-800/50 rounded p-4 inline-block">
                  <p className="font-bold text-purple-400 mb-2">🗡️ Rogue</p>
                  <p className="text-sm text-gray-300">High Speed & Evasion, balanced damage</p>
                </div>
                <div className="text-left bg-gray-800/50 rounded p-4 inline-block">
                  <p className="font-bold text-yellow-400 mb-2">✨ Paladin</p>
                  <p className="text-sm text-gray-300">Balanced stats across the board</p>
                </div>
              </div>

              <CostWidget title="Agent Creation" cost={TASK_ESTIMATES.createAgent()} />

              <a
                href="/agent/create"
                className="mt-8 inline-block px-8 py-3 bg-primary text-dark font-bold rounded-lg hover:bg-opacity-90 transition hover:shadow-lg hover:shadow-primary/20"
              >
                Create Agent Now
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Session Cost Summary */}
      <SessionSummary />
    </main>
  )
}
