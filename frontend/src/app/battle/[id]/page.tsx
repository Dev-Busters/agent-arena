'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import io, { Socket } from 'socket.io-client'
import BattleArena from '@/components/Battle/BattleArena'

export default function BattlePage() {
  const router = useRouter()
  const params = useParams()
  const battleId = params.id as string

  const [agent1, setAgent1] = useState<any>(null)
  const [agent2, setAgent2] = useState<any>(null)
  const [isYourTurn, setIsYourTurn] = useState(false)
  const [battleLog, setBattleLog] = useState<string[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/auth/login')
      return
    }

    initSocket(token)
  }, [])

  const initSocket = (token: string) => {
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      auth: { token },
    })

    newSocket.on('battle_start', (data) => {
      setAgent1(data.agent1)
      setAgent2(data.agent2)
      setIsLoading(false)
      addLog('Battle started!')
    })

    newSocket.on('turn_start', (data) => {
      setIsYourTurn(data.isYourTurn)
      if (data.isYourTurn) {
        addLog('Your turn!')
      }
    })

    newSocket.on('action_result', (data) => {
      // Update agent states
      if (data.target === agent1?.id) {
        setAgent1((prev: any) => ({
          ...prev,
          current_hp: data.targetHP,
          effects: data.targetEffects,
        }))
      } else {
        setAgent2((prev: any) => ({
          ...prev,
          current_hp: data.targetHP,
          effects: data.targetEffects,
        }))
      }

      addLog(data.message)
    })

    newSocket.on('battle_end', (data) => {
      addLog(`Battle ended! ${data.winnerName} wins!`)
      // Redirect after delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 3000)
    })

    newSocket.on('error', (error) => {
      setError(error)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }

  const addLog = (message: string) => {
    setBattleLog((prev) => [...prev, message])
  }

  const handleAction = (action: string, targetId: string) => {
    if (socket && battleId) {
      socket.emit('action', {
        battle_id: battleId,
        action,
        target_id: targetId,
      })
      setIsYourTurn(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-dark to-darker flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚔️</div>
          <p className="text-gray-400 text-lg">Loading battle...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-dark to-darker flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={() => router.push('/battle/queue')}
            className="px-4 py-2 bg-primary text-dark font-bold rounded"
          >
            Return to Queue
          </button>
        </div>
      </div>
    )
  }

  if (!agent1 || !agent2) {
    return null
  }

  return (
    <BattleArena
      agent1={agent1}
      agent2={agent2}
      onAction={handleAction}
      isYourTurn={isYourTurn}
      battleLog={battleLog}
    />
  )
}
