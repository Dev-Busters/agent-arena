'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

// Particle system for ambient atmosphere
function DungeonParticles() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; duration: number }>>([])
  
  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 10 + 10
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-amber-500/30"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 5
          }}
        />
      ))}
    </div>
  )
}

// Flickering torch effect
function TorchGlow({ position }: { position: 'left' | 'right' }) {
  return (
    <motion.div
      className={`fixed top-1/4 ${position === 'left' ? 'left-0' : 'right-0'} w-32 h-64 pointer-events-none`}
      animate={{
        opacity: [0.4, 0.7, 0.5, 0.8, 0.4],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <div className={`absolute inset-0 bg-gradient-radial from-orange-500/40 via-amber-600/20 to-transparent blur-3xl`} />
    </motion.div>
  )
}

// Animated rune symbols
function RuneCircle() {
  const runes = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ']
  
  return (
    <motion.div
      className="absolute w-[600px] h-[600px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-10"
      animate={{ rotate: 360 }}
      transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
    >
      {runes.map((rune, i) => (
        <span
          key={i}
          className="absolute text-4xl text-amber-400 font-bold"
          style={{
            left: '50%',
            top: '50%',
            transform: `rotate(${i * 30}deg) translateY(-280px)`,
          }}
        >
          {rune}
        </span>
      ))}
    </motion.div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [hoveredClass, setHoveredClass] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    const token = localStorage.getItem('token')
    if (token) {
      router.push('/dashboard')
    }
  }, [])

  const features = [
    {
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Tiered Depths',
      description: 'Descend through 10+ floors of procedurally generated dungeons. The deeper you go, the greater the rewards.',
      color: 'text-emerald-400'
    },
    {
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Branching Paths',
      description: 'At Floor 5, the dungeon splits. Choose your destiny: Dragon Lair, Shadow Den, or Treasure Vault.',
      color: 'text-purple-400'
    },
    {
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Craft Legendaries',
      description: '17 materials. 18 affixes. Millions of unique gear combinations. Forge your perfect weapon.',
      color: 'text-amber-400'
    },
    {
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: 'Real-Time Combat',
      description: 'Turn-based battles with 3D visualization. Critical hits. Status effects. Strategic depth.',
      color: 'text-red-400'
    }
  ]

  const classes = [
    {
      name: 'Warrior',
      symbol: '⚔',
      ascii: `
  /|\\
 / | \\
|  |  |
|  |  |
   |
   |
`,
      stats: { HP: 120, ATK: 15, DEF: 12, SPD: 8 },
      color: 'from-red-900/80 to-red-950',
      accent: 'border-red-500/50',
      glow: 'shadow-red-500/20',
      description: 'The immovable object. High HP, high defense, relentless pressure.'
    },
    {
      name: 'Mage',
      symbol: '✦',
      ascii: `
    *
   /|\\
  / | \\
    |
   / \\
  /   \\
`,
      stats: { HP: 80, ATK: 10, DEF: 8, SPD: 12 },
      color: 'from-blue-900/80 to-indigo-950',
      accent: 'border-blue-500/50',
      glow: 'shadow-blue-500/20',
      description: 'Glass cannon. Devastating abilities, but one mistake is fatal.'
    },
    {
      name: 'Rogue',
      symbol: '◆',
      ascii: `
   __
  /  \\
 |    |
  \\__/
    ||
   /  \\
`,
      stats: { HP: 100, ATK: 14, DEF: 8, SPD: 15 },
      color: 'from-purple-900/80 to-violet-950',
      accent: 'border-purple-500/50',
      glow: 'shadow-purple-500/20',
      description: 'The fastest blade. Evasion master, critical hit specialist.'
    },
    {
      name: 'Paladin',
      symbol: '☀',
      ascii: `
   ___
  /   \\
 | + + |
  \\___/
    |
   /|\\
`,
      stats: { HP: 110, ATK: 12, DEF: 15, SPD: 9 },
      color: 'from-amber-900/80 to-yellow-950',
      accent: 'border-amber-500/50',
      glow: 'shadow-amber-500/20',
      description: 'The balanced fighter. Adapts to any situation, never falters.'
    }
  ]

  if (!mounted) return null

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden relative">
      {/* Ambient effects */}
      <DungeonParticles />
      <TorchGlow position="left" />
      <TorchGlow position="right" />
      
      {/* Dark gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-[#0a0a0f]/50 to-[#0a0a0f] pointer-events-none" />
      
      {/* Stone texture overlay */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} 
      />

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <div className="relative">
            <motion.div
              className="text-4xl"
              animate={{ 
                textShadow: ['0 0 20px #f59e0b', '0 0 40px #f59e0b', '0 0 20px #f59e0b']
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ⚔
            </motion.div>
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight">AGENT</span>
            <span className="text-2xl font-black tracking-tight text-amber-500">ARENA</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <Link
            href="/leaderboard"
            className="px-4 py-2 text-stone-400 hover:text-amber-400 transition-colors font-medium"
          >
            Leaderboard
          </Link>
          <Link
            href="/auth/login"
            className="px-5 py-2 border border-stone-700 rounded-lg hover:border-amber-500/50 hover:bg-amber-500/5 transition-all font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg font-bold hover:shadow-lg hover:shadow-amber-500/25 transition-all"
          >
            Enter the Arena
          </Link>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-8 pt-16 pb-32 max-w-7xl mx-auto">
        <RuneCircle />
        
        <div className="text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-sm font-semibold">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              Season 1 — Now Live
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 text-5xl md:text-7xl lg:text-8xl font-black leading-[0.9] tracking-tight"
          >
            <span className="block text-stone-100">DESCEND</span>
            <span className="block text-stone-100">INTO THE</span>
            <motion.span 
              className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-500"
              animate={{
                backgroundPosition: ['0%', '100%', '0%'],
              }}
              transition={{ duration: 5, repeat: Infinity }}
              style={{ backgroundSize: '200% 100%' }}
            >
              DEPTHS
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-lg md:text-xl text-stone-400 max-w-2xl mx-auto leading-relaxed"
          >
            Create your champion. Master the dungeons. Forge legendary gear.
            <br />
            <span className="text-stone-500">Free to play. No pay-to-win. Ever.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/auth/register"
              className="group relative px-8 py-4 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl font-bold text-lg overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Begin Your Descent
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  ↓
                </motion.span>
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600"
                initial={{ x: '-100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </Link>
            <Link
              href="/showcase"
              className="px-8 py-4 border border-stone-700 rounded-xl font-semibold text-lg hover:border-stone-500 hover:bg-stone-800/50 transition-all flex items-center gap-2"
            >
              <span>View 3D Demo</span>
              <span className="text-amber-500">✦</span>
            </Link>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-20 flex items-center justify-center"
          >
            <div className="inline-flex items-center gap-8 px-8 py-4 bg-stone-900/50 border border-stone-800 rounded-2xl backdrop-blur-sm">
              <div className="text-center">
                <div className="text-3xl font-black text-amber-400">10</div>
                <div className="text-xs text-stone-500 uppercase tracking-wider">Dungeon Floors</div>
              </div>
              <div className="w-px h-10 bg-stone-700" />
              <div className="text-center">
                <div className="text-3xl font-black text-purple-400">6</div>
                <div className="text-xs text-stone-500 uppercase tracking-wider">Special Zones</div>
              </div>
              <div className="w-px h-10 bg-stone-700" />
              <div className="text-center">
                <div className="text-3xl font-black text-emerald-400">∞</div>
                <div className="text-xs text-stone-500 uppercase tracking-wider">Unique Gear</div>
              </div>
              <div className="w-px h-10 bg-stone-700" />
              <div className="text-center">
                <div className="text-3xl font-black text-red-400">4</div>
                <div className="text-xs text-stone-500 uppercase tracking-wider">Classes</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Divider */}
      <div className="relative z-10 max-w-5xl mx-auto px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-stone-700 to-transparent" />
      </div>

      {/* Features Section */}
      <section className="relative z-10 px-8 py-24 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-sm uppercase tracking-[0.3em] text-amber-500 font-semibold mb-4">The Experience</h2>
          <p className="text-4xl md:text-5xl font-black">Not Your Average Dungeon</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative p-8 bg-gradient-to-br from-stone-900/80 to-stone-950 border border-stone-800 rounded-2xl hover:border-stone-700 transition-all overflow-hidden"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className={`${feature.color} mb-4 transition-transform group-hover:scale-110`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-stone-400 leading-relaxed">{feature.description}</p>
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
          <h2 className="text-sm uppercase tracking-[0.3em] text-amber-500 font-semibold mb-4">Choose Your Path</h2>
          <p className="text-4xl md:text-5xl font-black">Four Champions. One Victor.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {classes.map((cls, i) => (
            <motion.div
              key={cls.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              onMouseEnter={() => setHoveredClass(cls.name)}
              onMouseLeave={() => setHoveredClass(null)}
              className={`relative overflow-hidden rounded-xl border ${cls.accent} bg-gradient-to-br ${cls.color} p-6 cursor-pointer transition-all duration-300 ${
                hoveredClass === cls.name ? `shadow-2xl ${cls.glow} scale-[1.02]` : ''
              }`}
            >
              <div className="relative z-10">
                {/* Class symbol */}
                <motion.div
                  className="text-6xl mb-4 opacity-90"
                  animate={hoveredClass === cls.name ? { 
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0]
                  } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {cls.symbol}
                </motion.div>
                
                <h3 className="text-2xl font-black mb-2">{cls.name}</h3>
                <p className="text-stone-400 text-sm mb-4">{cls.description}</p>
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(cls.stats).map(([stat, value]) => (
                    <div key={stat} className="flex justify-between bg-black/20 rounded px-2 py-1">
                      <span className="text-stone-500">{stat}</span>
                      <span className="font-bold text-stone-300">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-8 py-24 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative bg-gradient-to-br from-stone-900 to-stone-950 border border-stone-800 rounded-3xl p-12 overflow-hidden"
        >
          {/* Background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <motion.div
              className="text-6xl mb-6"
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              ⚔
            </motion.div>
            <h2 className="text-4xl font-black mb-4">The Arena Awaits</h2>
            <p className="text-stone-400 mb-8 max-w-md mx-auto">
              Thousands have already descended. Will you join them, or be forgotten?
            </p>
            <Link
              href="/auth/register"
              className="inline-block px-10 py-4 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-amber-500/30 transition-all"
            >
              Create Your Champion
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-8 border-t border-stone-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-stone-500">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚔</span>
            <span className="font-semibold">Agent Arena</span>
            <span className="text-stone-600">© 2026</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-stone-600">Free to Play • No Pay-to-Win</span>
            <div className="w-px h-4 bg-stone-700" />
            <Link href="#" className="hover:text-amber-500 transition-colors">Discord</Link>
            <Link href="#" className="hover:text-amber-500 transition-colors">Twitter</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
