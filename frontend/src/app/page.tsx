'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// Floating ember particles
function EmberParticles() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; duration: number }>>([])
  
  useEffect(() => {
    const newParticles = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      duration: Math.random() * 8 + 12
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-amber-600"
          style={{
            left: `${p.x}%`,
            bottom: '-10px',
            width: '4px',
            height: '4px',
            filter: 'blur(0.5px)'
          }}
          animate={{
            y: [0, -window.innerHeight - 20],
            opacity: [0.1, 0.8, 0.1],
            x: [0, (Math.random() - 0.5) * 40]
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "easeOut",
            delay: Math.random() * 5
          }}
        />
      ))}
    </div>
  )
}

// Center torch glow
function CenterGlow() {
  return (
    <motion.div
      className="fixed inset-0 pointer-events-none"
      animate={{
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-amber-600/20 via-amber-900/5 to-transparent rounded-full blur-3xl" />
    </motion.div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem('token')
    if (token) {
      router.push('/dashboard')
    }
  }, [router])

  if (!mounted) return null

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-[#e8e6e3] overflow-hidden relative flex flex-col items-center justify-center px-8">
      {/* Ambient effects */}
      <EmberParticles />
      <CenterGlow />
      
      {/* Noise texture overlay */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} 
      />

      {/* Main content */}
      <div className="relative z-10 text-center max-w-2xl">
        {/* Small icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <motion.div
            className="text-5xl inline-block"
            animate={{ 
              textShadow: ['0 0 10px #f59e0b', '0 0 20px #f59e0b', '0 0 10px #f59e0b']
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            ⚔️
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-6xl md:text-7xl font-display font-black tracking-tight leading-tight mb-2"
          style={{
            background: 'linear-gradient(180deg, #f5e6b8, #d4a843, #a67c2e)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          AGENT ARENA
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl tracking-widest text-[#e8e6e3] mb-12 font-light"
        >
          Command AI Agents. Conquer the Arena.
        </motion.p>

        {/* Divider line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="h-px bg-gradient-to-r from-transparent via-[#d4a843] to-transparent mb-12 origin-center"
        />

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Link
            href={'/auth/login'}
            className="inline-block px-10 py-3 border-2 border-[#d4a843] text-[#d4a843] font-bold text-lg tracking-widest hover:bg-[#d4a843] hover:text-[#0a0a0f] transition-all duration-300 hover:shadow-[0_0_30px_rgba(212,168,67,0.3)]"
          >
            ENTER THE ARENA
          </Link>
        </motion.div>

        {/* Flavor text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-16 text-sm italic text-[#9ca3af] max-w-md mx-auto leading-relaxed"
        >
          Forge your champion. Descend into the depths. Become legend.
        </motion.p>
      </div>

      {/* Version text at bottom */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="absolute bottom-8 text-xs text-[#6b7280] tracking-widest"
      >
        v0.1 · Anthropic Game Jam
      </motion.div>
    </main>
  )
}
