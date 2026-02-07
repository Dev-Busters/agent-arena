'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'

const CLASSES = [
  {
    name: 'Warrior',
    description: 'High HP and Defense, strong melee attacks',
    icon: '⚔️',
    stats: { hp: 120, attack: 15, defense: 12, speed: 8 }
  },
  {
    name: 'Mage',
    description: 'Balanced attack and defense, high speed',
    icon: '✨',
    stats: { hp: 80, attack: 10, defense: 8, speed: 12 }
  },
  {
    name: 'Rogue',
    description: 'Fast and deadly, high evasion',
    icon: '🗡️',
    stats: { hp: 100, attack: 14, defense: 8, speed: 15 }
  },
  {
    name: 'Paladin',
    description: 'Tank class with healing and defense',
    icon: '🛡️',
    stats: { hp: 110, attack: 12, defense: 15, speed: 9 }
  },
]

export default function CreateAgentPage() {
  const router = useRouter()
  const [agentName, setAgentName] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!agentName.trim()) {
      setError('Agent name is required')
      return
    }

    if (!selectedClass) {
      setError('Please select a class')
      return
    }

    setIsLoading(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/login')
        return
      }

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/agents`,
        {
          name: agentName,
          class: selectedClass.toLowerCase(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create agent')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-dark to-darker px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-primary mb-12">Create Your Agent</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-200 p-4 rounded">
              {error}
            </div>
          )}

          {/* Agent Name */}
          <div>
            <label className="block text-lg font-semibold mb-4">Agent Name</label>
            <input
              type="text"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              maxLength={100}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-primary"
              placeholder="Enter your agent's name"
            />
          </div>

          {/* Class Selection */}
          <div>
            <label className="block text-lg font-semibold mb-6">Choose Your Class</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CLASSES.map((classOption) => (
                <button
                  key={classOption.name}
                  type="button"
                  onClick={() => setSelectedClass(classOption.name)}
                  className={`p-6 rounded-lg border-2 transition text-left ${
                    selectedClass === classOption.name
                      ? 'border-primary bg-primary bg-opacity-10'
                      : 'border-gray-700 bg-gray-900 bg-opacity-30 hover:border-primary'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{classOption.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{classOption.name}</h3>
                      <p className="text-sm text-gray-400 mb-3">{classOption.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>HP: {classOption.stats.hp}</div>
                        <div>ATK: {classOption.stats.attack}</div>
                        <div>DEF: {classOption.stats.defense}</div>
                        <div>SPD: {classOption.stats.speed}</div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !selectedClass}
            className="w-full px-6 py-3 bg-primary text-dark font-bold rounded-lg hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Agent...' : 'Create Agent'}
          </button>
        </form>
      </div>
    </main>
  )
}
