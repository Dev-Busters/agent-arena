'use client'

import { useState } from 'react'
import axios from 'axios'
import Link from 'next/link'

export default function BattleTestPage() {
  const [battleId, setBattleId] = useState('')
  const [agent1Id, setAgent1Id] = useState('')
  const [agent2Id, setAgent2Id] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [agents, setAgents] = useState<any[]>([])

  // Fetch all agents
  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/agents`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setAgents(response.data.agents || [])
    } catch (err: any) {
      setError('Failed to load agents')
    }
  }

  // Create test battle
  const handleCreateBattle = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      if (!agent1Id || !agent2Id) {
        setError('Select two agents')
        setLoading(false)
        return
      }

      // Simulate battle start via API
      const token = localStorage.getItem('token')
      
      // For now, generate a fake battle ID
      const fakeBattleId = `battle_${Date.now()}`
      setBattleId(fakeBattleId)
      setSuccess(`Created test battle: ${fakeBattleId}. Navigate to /battle/${fakeBattleId} to watch.`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create battle')
    } finally {
      setLoading(false)
    }
  }

  const handleSimulateBattle = async () => {
    try {
      setLoading(true)
      setError('')
      
      if (!agent1Id || !agent2Id) {
        setError('Select two agents')
        setLoading(false)
        return
      }

      const token = localStorage.getItem('token')
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/battles/simulate`,
        {
          agent1_id: agent1Id,
          agent2_id: agent2Id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      const newBattleId = response.data.battle_id
      setBattleId(newBattleId)
      setSuccess(`Simulated battle created: ${newBattleId}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to simulate battle')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-dark to-darker">
      {/* Navigation */}
      <nav className="border-b border-primary border-opacity-20 bg-gray-900 bg-opacity-30 px-6 py-4 mb-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">🧪 Test Battle</h1>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-gray-400 hover:text-primary transition-colors border border-gray-600 rounded hover:border-primary"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-primary mb-2">🧪 Battle Test Harness</h1>
        <p className="text-gray-400 mb-8">Manually test battles without real players</p>

        {error && (
          <div className="mb-6 bg-red-900 bg-opacity-30 border border-red-500 text-red-200 p-4 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-900 bg-opacity-30 border border-green-500 text-green-200 p-4 rounded">
            {success}
            {battleId && (
              <p className="mt-2">
                <Link
                  href={`/battle/${battleId}`}
                  className="text-green-300 underline hover:text-green-100"
                >
                  → Watch battle
                </Link>
              </p>
            )}
          </div>
        )}

        {/* Agent Selection */}
        <div className="bg-gray-900 bg-opacity-50 border border-primary border-opacity-20 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-primary mb-4">Select Agents</h2>

          <button
            onClick={fetchAgents}
            className="mb-4 px-4 py-2 bg-primary text-dark font-bold rounded hover:bg-opacity-90 transition"
          >
            Load Agents
          </button>

          {agents.length > 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Agent 1</label>
                <select
                  value={agent1Id}
                  onChange={(e) => setAgent1Id(e.target.value)}
                  className="w-full bg-gray-800 border border-primary border-opacity-20 rounded p-2 text-white"
                >
                  <option value="">-- Select Agent --</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} (Lv {agent.level} {agent.class})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Agent 2</label>
                <select
                  value={agent2Id}
                  onChange={(e) => setAgent2Id(e.target.value)}
                  className="w-full bg-gray-800 border border-primary border-opacity-20 rounded p-2 text-white"
                >
                  <option value="">-- Select Agent --</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} (Lv {agent.level} {agent.class})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCreateBattle}
                  disabled={loading || !agent1Id || !agent2Id}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Creating...' : 'Create Manual Battle'}
                </button>

                <button
                  onClick={handleSimulateBattle}
                  disabled={loading || !agent1Id || !agent2Id}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-bold rounded hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading ? 'Simulating...' : 'Simulate Auto Battle'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-gray-900 bg-opacity-50 border border-primary border-opacity-20 rounded-lg p-6">
          <h3 className="text-lg font-bold text-primary mb-3">How to Use</h3>
          <ul className="text-gray-300 space-y-2 text-sm">
            <li>
              <strong>1. Load Agents</strong> — Click "Load Agents" to fetch your created agents
            </li>
            <li>
              <strong>2. Select Two Agents</strong> — Choose agent1 and agent2 to battle
            </li>
            <li>
              <strong>3. Create Battle</strong> — Creates a battle ID without auto-play
            </li>
            <li>
              <strong>4. Simulate Auto Battle</strong> — Runs automated battle with AI turns
            </li>
            <li>
              <strong>5. Watch Battle</strong> — Opens the battle UI to see animations
            </li>
          </ul>
        </div>

        <div className="mt-8">
          {/* Back link removed - nav bar already has it */}
        </div>
      </div>
      </div>
    </main>
  )
}
