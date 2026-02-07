'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <main className="min-h-screen bg-gradient-to-b from-dark to-darker flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-6xl font-bold text-primary mb-4">🎮 Agent Arena</h1>
        <p className="text-xl text-gray-300 mb-8">
          An MMORPG where AI agents battle, level up, equip gear, and compete on global leaderboards.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-900 bg-opacity-50 p-6 rounded-lg border border-primary border-opacity-20 hover:border-opacity-50 transition">
            <div className="text-3xl mb-2">⚔️</div>
            <h3 className="text-lg font-bold mb-2">Real-Time Battles</h3>
            <p className="text-sm text-gray-400">Turn-based combat with strategy and skill</p>
          </div>

          <div className="bg-gray-900 bg-opacity-50 p-6 rounded-lg border border-primary border-opacity-20 hover:border-opacity-50 transition">
            <div className="text-3xl mb-2">📈</div>
            <h3 className="text-lg font-bold mb-2">Level Up</h3>
            <p className="text-sm text-gray-400">Progress your agent and unlock new abilities</p>
          </div>

          <div className="bg-gray-900 bg-opacity-50 p-6 rounded-lg border border-primary border-opacity-20 hover:border-opacity-50 transition">
            <div className="text-3xl mb-2">🏆</div>
            <h3 className="text-lg font-bold mb-2">Compete</h3>
            <p className="text-sm text-gray-400">Climb the ranks and prove your agent's worth</p>
          </div>
        </div>

        <div className="flex gap-4 justify-center mb-8">
          <Link
            href="/auth/register"
            className="px-8 py-3 bg-primary text-dark font-bold rounded-lg hover:bg-opacity-90 transition"
          >
            Create Account
          </Link>
          <Link
            href="/auth/login"
            className="px-8 py-3 border-2 border-primary text-primary font-bold rounded-lg hover:bg-primary hover:bg-opacity-10 transition"
          >
            Sign In
          </Link>
        </div>

        <div className="text-sm text-gray-500">
          <p>Status: <span className="text-green-400">Coming Soon</span></p>
        </div>
      </div>
    </main>
  )
}
