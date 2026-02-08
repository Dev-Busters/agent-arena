'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if already logged in
    const token = localStorage.getItem('token')
    if (token) {
      router.push('/dashboard')
    }
  }, [])

  const features = [
    {
      icon: '⚔️',
      title: 'Epic Battles',
      description: 'Turn-based combat with strategic depth. Every decision matters.'
    },
    {
      icon: '📈',
      title: 'Level Up',
      description: 'Gain experience, unlock abilities, and grow stronger with each victory.'
    },
    {
      icon: '🎨',
      title: 'Customize',
      description: 'Collect rare gear and cosmetics. Stand out from the crowd.'
    },
    {
      icon: '🏆',
      title: 'Compete',
      description: 'Climb the leaderboards. Prove you have the best agent.'
    }
  ]

  const classes = [
    {
      name: 'Warrior',
      emoji: '⚔️',
      color: 'from-red-600 to-orange-500',
      description: 'High HP & defense. The frontline tank.'
    },
    {
      name: 'Mage',
      emoji: '🔥',
      color: 'from-blue-600 to-purple-500',
      description: 'Devastating abilities. Glass cannon.'
    },
    {
      name: 'Rogue',
      emoji: '🗡️',
      color: 'from-purple-600 to-pink-500',
      description: 'Fast and evasive. Death by a thousand cuts.'
    },
    {
      name: 'Paladin',
      emoji: '✨',
      color: 'from-yellow-500 to-amber-400',
      description: 'Balanced fighter. Jack of all trades.'
    }
  ]

  if (!mounted) return null

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500 rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500 rounded-full mix-blend-screen filter blur-[150px] opacity-20 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-pink-500 rounded-full mix-blend-screen filter blur-[100px] opacity-10 animate-pulse" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <span className="text-3xl">🎮</span>
          <span className="text-2xl font-black">Agent Arena</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <Link
            href="/leaderboard"
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Leaderboard
          </Link>
          <Link
            href="/auth/login"
            className="px-6 py-2 border border-white/20 rounded-xl hover:bg-white/10 transition-all"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
          >
            Play Free
          </Link>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-8 pt-20 pb-32 max-w-7xl mx-auto">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="px-4 py-2 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-300 text-sm font-semibold">
              🚀 Now in Open Beta
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-6xl md:text-8xl font-black leading-tight"
          >
            Where AI Agents
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
              Battle for Glory
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-xl text-gray-400 max-w-2xl mx-auto"
          >
            Create your AI agent, equip powerful gear, and compete against
            players worldwide in strategic turn-based combat.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-10 flex items-center justify-center gap-4"
          >
            <Link
              href="/auth/register"
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-cyan-500/30 transition-all flex items-center gap-2"
            >
              <span>Start Playing</span>
              <span>→</span>
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 border border-white/20 rounded-xl font-semibold text-lg hover:bg-white/5 transition-all"
            >
              Learn More
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-16 flex items-center justify-center gap-12"
          >
            <div>
              <div className="text-4xl font-bold text-cyan-400">1,000+</div>
              <div className="text-gray-500">Active Players</div>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div>
              <div className="text-4xl font-bold text-purple-400">50,000+</div>
              <div className="text-gray-500">Battles Fought</div>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div>
              <div className="text-4xl font-bold text-pink-400">100%</div>
              <div className="text-gray-500">Free to Play</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-8 py-24 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-black">Why Agent Arena?</h2>
          <p className="mt-4 text-gray-400">Everything you need for epic AI battles</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-cyan-500/30 transition-all group"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Classes Section */}
      <section className="relative z-10 px-8 py-24 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-black">Choose Your Class</h2>
          <p className="mt-4 text-gray-400">Each class has unique strengths</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {classes.map((cls, i) => (
            <motion.div
              key={cls.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -10 }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-6"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${cls.color} opacity-10`}
              />
              <div className="relative z-10">
                <div className="text-5xl mb-4">{cls.emoji}</div>
                <h3 className="text-2xl font-bold mb-2">{cls.name}</h3>
                <p className="text-gray-400 text-sm">{cls.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-8 py-24 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 border border-white/10 rounded-3xl p-12"
        >
          <h2 className="text-4xl font-black mb-4">Ready to Fight?</h2>
          <p className="text-gray-400 mb-8">
            Join thousands of players in the ultimate AI battle arena.
            <br />
            It's free, forever.
          </p>
          <Link
            href="/auth/register"
            className="inline-block px-10 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-cyan-500/30 transition-all"
          >
            Create Your Agent
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎮</span>
            <span>Agent Arena © 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Discord
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
