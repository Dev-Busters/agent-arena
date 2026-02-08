'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

const classes = [
  {
    id: 'warrior',
    name: 'Warrior',
    emoji: '⚔️',
    color: 'from-red-600 to-orange-500',
    borderColor: 'border-red-500',
    description: 'A stalwart defender with high HP and defense. Masters of close combat.',
    stats: { hp: 120, attack: 15, defense: 12, speed: 8, accuracy: 85, evasion: 5 },
    abilities: ['Shield Bash', 'Battlecry', 'Last Stand']
  },
  {
    id: 'mage',
    name: 'Mage',
    emoji: '🔥',
    color: 'from-blue-600 to-purple-500',
    borderColor: 'border-blue-500',
    description: 'A powerful spellcaster with devastating abilities. Glass cannon.',
    stats: { hp: 70, attack: 22, defense: 5, speed: 10, accuracy: 90, evasion: 8 },
    abilities: ['Fireball', 'Arcane Shield', 'Meteor Strike']
  },
  {
    id: 'rogue',
    name: 'Rogue',
    emoji: '🗡️',
    color: 'from-purple-600 to-pink-500',
    borderColor: 'border-purple-500',
    description: 'A swift assassin with high evasion and critical hits. Death from shadows.',
    stats: { hp: 85, attack: 18, defense: 6, speed: 15, accuracy: 95, evasion: 20 },
    abilities: ['Backstab', 'Smoke Bomb', 'Execute']
  },
  {
    id: 'paladin',
    name: 'Paladin',
    emoji: '✨',
    color: 'from-yellow-500 to-amber-400',
    borderColor: 'border-yellow-500',
    description: 'A holy warrior with balanced stats and healing abilities. Jack of all trades.',
    stats: { hp: 100, attack: 14, defense: 10, speed: 9, accuracy: 88, evasion: 8 },
    abilities: ['Holy Strike', 'Divine Shield', 'Lay on Hands']
  }
]

export default function CreateAgentPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  const selectedClassData = classes.find(c => c.id === selectedClass)

  const handleCreate = async () => {
    if (!selectedClass) {
      setError('Please select a class')
      return
    }

    setIsCreating(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/agents`,
        {
          class: selectedClass
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create agent')
      setIsCreating(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500 rounded-full mix-blend-screen filter blur-[150px] opacity-15" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500 rounded-full mix-blend-screen filter blur-[150px] opacity-15" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-cyan-500' : 'bg-gray-600'}`} />
            <span className={`w-8 h-0.5 ${step >= 2 ? 'bg-cyan-500' : 'bg-gray-600'}`} />
            <span className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-cyan-500' : 'bg-gray-600'}`} />
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-12">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="text-6xl mb-4"
                >
                  ⚔️
                </motion.div>
                <h1 className="text-4xl font-black mb-2">What Class Are You?</h1>
                <p className="text-gray-400">Choose your fighting style and enter the arena</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {classes.map((cls, i) => (
                  <motion.button
                    key={cls.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setSelectedClass(cls.id)}
                    className={`relative overflow-hidden rounded-2xl p-6 text-left transition-all ${
                      selectedClass === cls.id
                        ? `bg-gradient-to-br ${cls.color} border-2 ${cls.borderColor} shadow-2xl scale-[1.02]`
                        : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    {selectedClass === cls.id && (
                      <div className="absolute top-4 right-4">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}

                    <div className={`text-5xl mb-4 ${selectedClass === cls.id ? '' : ''}`}>
                      {cls.emoji}
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{cls.name}</h3>
                    <p className={`text-sm mb-4 ${selectedClass === cls.id ? 'text-white/80' : 'text-gray-400'}`}>
                      {cls.description}
                    </p>

                    {/* Stats Preview */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className={`rounded-lg p-2 ${selectedClass === cls.id ? 'bg-black/20' : 'bg-black/30'}`}>
                        <div className="text-lg font-bold">{cls.stats.hp}</div>
                        <div className="text-xs opacity-60">HP</div>
                      </div>
                      <div className={`rounded-lg p-2 ${selectedClass === cls.id ? 'bg-black/20' : 'bg-black/30'}`}>
                        <div className="text-lg font-bold">{cls.stats.attack}</div>
                        <div className="text-xs opacity-60">ATK</div>
                      </div>
                      <div className={`rounded-lg p-2 ${selectedClass === cls.id ? 'bg-black/20' : 'bg-black/30'}`}>
                        <div className="text-lg font-bold">{cls.stats.defense}</div>
                        <div className="text-xs opacity-60">DEF</div>
                      </div>
                    </div>

                    {/* Abilities */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {cls.abilities.map((ability) => (
                        <span
                          key={ability}
                          className={`text-xs px-2 py-1 rounded-full ${
                            selectedClass === cls.id ? 'bg-black/20' : 'bg-white/10'
                          }`}
                        >
                          {ability}
                        </span>
                      ))}
                    </div>
                  </motion.button>
                ))}
              </div>

              <div className="flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => selectedClass && setStep(2)}
                  disabled={!selectedClass}
                  className="px-12 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-cyan-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  Continue →
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-xl mx-auto"
            >
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Change class
              </button>

              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="text-7xl mb-4"
                >
                  {selectedClassData?.emoji}
                </motion.div>
                <h1 className="text-4xl font-black mb-2">Become a {selectedClassData?.name}</h1>
                <p className="text-gray-400">Confirm your choice and enter the arena</p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-center"
                >
                  {error}
                </motion.div>
              )}

              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                {/* Character Info */}
                <div className="mb-6 p-4 bg-black/30 rounded-xl text-center">
                  <h3 className="text-sm text-gray-400 mb-2">Your Character</h3>
                  <div className="text-2xl font-black mb-2">{name || 'You'}</div>
                  <div className="text-lg text-gray-400">the {selectedClassData?.name}</div>
                </div>

                {/* Stats Preview */}
                <div className="mb-6 p-4 bg-black/30 rounded-xl">
                  <h3 className="text-sm text-gray-400 mb-3">Starting Stats</h3>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {selectedClassData && Object.entries(selectedClassData.stats).map(([key, value]) => (
                      <div key={key} className="bg-white/5 rounded-lg p-2">
                        <div className="text-lg font-bold">{value}</div>
                        <div className="text-xs text-gray-500 uppercase">{key}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Class Description */}
                <div className="mb-6 p-4 bg-black/30 rounded-xl">
                  <h3 className="text-sm text-gray-400 mb-2">Class Abilities</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedClassData?.abilities.map((ability) => (
                      <span key={ability} className="text-xs px-3 py-1 bg-white/10 rounded-full">
                        {ability}
                      </span>
                    ))}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreate}
                  disabled={isCreating}
                  className={`w-full py-4 bg-gradient-to-r ${selectedClassData?.color} rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isCreating ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Entering Arena...
                    </span>
                  ) : (
                    `Become a ${selectedClassData?.name}`
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
