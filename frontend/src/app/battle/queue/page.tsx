'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { motion } from 'framer-motion'
import io, { Socket } from 'socket.io-client'

export default function BattleQueuePage() {
  const router = useRouter()
  const [isQueued, setIsQueued] = useState(false)
  const [waitTime, setWaitTime] = useState(0)
  const [queueSize, setQueueSize] = useState(0)
  const [agent, setAgent] = useState<any>(null)
  const [error, setError] = useState('')
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }

    fetchAgent(token)
    initSocket(token)
  }, [])

  const fetchAgent = async (token: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/agents/me/current`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setAgent(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load agent')
    }
  }

  const initSocket = (token: string) => {
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      auth: { token },
    })

    newSocket.on('queue_status', (data) => {
      setQueueSize(data.size)
    })

    newSocket.on('match_found', (data) => {
      // Redirect to battle
      router.push(`/battle/${data.battle_id}`)
    })

    newSocket.on('error', (error) => {
      setError(error)
      setIsQueued(false)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }

  useEffect(() => {
    if (isQueued) {
      const timer = setInterval(() => {
        setWaitTime((prev) => prev + 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isQueued])

  const handleJoinQueue = async () => {
    if (!agent || !socket) return

    setIsQueued(true)
    socket.emit('join_queue', { agent_id: agent.id, rating: 1000 })
  }

  const handleLeaveQueue = () => {
    if (!socket) return
    socket.emit('leave_queue')
    setIsQueued(false)
    setWaitTime(0)
  }

  const formatWaitTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-dark to-darker">
      {/* Navigation */}
      <nav className="border-b border-primary border-opacity-20 bg-gray-900 bg-opacity-30 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">🎮 Battle Queue</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 text-gray-400 hover:text-primary transition-colors border border-gray-600 rounded hover:border-primary"
          >
            ← Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="flex items-center justify-center px-4 py-12 min-h-[calc(100vh-80px)]">
      <div className="max-w-2xl w-full">
        {error && (
          <div className="bg-red-900 bg-opacity-30 border border-red-500 text-red-200 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {!isQueued ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 bg-opacity-50 border border-primary border-opacity-20 rounded-lg p-8 text-center"
          >
            <h1 className="text-4xl font-bold text-primary mb-4">Matchmaking</h1>

            {agent && (
              <>
                <div className="mb-8">
                  <p className="text-gray-400 mb-2">Your Agent</p>
                  <div className="text-3xl mb-2">{getAgentEmoji(agent.class)}</div>
                  <h2 className="text-2xl font-bold mb-1">{agent.name}</h2>
                  <p className="text-gray-500">{agent.class}</p>
                </div>

                <button
                  onClick={handleJoinQueue}
                  className="px-8 py-4 bg-gradient-to-r from-primary to-blue-500 text-dark font-bold text-lg rounded-lg hover:shadow-lg hover:shadow-primary/50 transition-all"
                >
                  ⚔️ Join Battle Queue
                </button>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-900 bg-opacity-50 border border-primary border-opacity-20 rounded-lg p-8 text-center"
          >
            <h1 className="text-4xl font-bold text-primary mb-8">Searching for Opponent...</h1>

            {/* Pulsing matchmaking indicator */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
              className="w-20 h-20 rounded-full bg-primary mx-auto mb-8"
            />

            {/* Queue stats */}
            <div className="mb-8 space-y-4">
              <div>
                <p className="text-gray-400 mb-2">Time in Queue</p>
                <p className="text-4xl font-bold text-primary">{formatWaitTime(waitTime)}</p>
              </div>

              <div>
                <p className="text-gray-400 mb-2">Players Searching</p>
                <motion.p
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-3xl font-bold"
                >
                  {queueSize}
                </motion.p>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gray-800 bg-opacity-50 rounded p-4 mb-8 text-left">
              <p className="text-sm text-gray-300">
                💡 <span className="font-semibold">Pro Tip:</span> Faster queue times with agents
                near your rating. Check the leaderboard to see where you rank!
              </p>
            </div>

            <button
              onClick={handleLeaveQueue}
              className="px-6 py-3 border-2 border-primary text-primary font-bold rounded-lg hover:bg-primary hover:bg-opacity-10 transition"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </div>
      </div>
    </main>
  )
}

function getAgentEmoji(classType: string): string {
  const emojis: { [key: string]: string } = {
    warrior: '⚔️',
    mage: '✨',
    rogue: '🗡️',
    paladin: '🛡️',
  }
  return emojis[classType.toLowerCase()] || '🎮'
}
