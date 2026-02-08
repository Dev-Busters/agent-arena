'use client';

import { motion } from 'framer-motion';
import BattleScene3D from '@/components/Battle/BattleScene3D';
import Link from 'next/link';

const mockEnemies = [
  { id: '1', name: 'Goblin', hp: 15, maxHp: 25 },
  { id: '2', name: 'Skeleton', hp: 28, maxHp: 35 }
];

const mockGear = {
  weapon: { visualEffect: 'fire' },
  armor: { visualEffect: 'arcane' }
};

export default function ShowcasePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
            🎨 Agent Arena 3D Battle System
          </h1>
          <p className="text-xl text-purple-300">
            Stunning procedurally-generated gear visualization with real-time 3D combat
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all"
          >
            ← Back to Dashboard
          </Link>
        </motion.div>

        {/* Battle Scene Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="text-3xl font-bold text-white">⚔️ Live Battle Preview</h2>
          <BattleScene3D enemies={mockEnemies} playerGear={mockGear} />
          <p className="text-sm text-slate-400">
            The 3D scene above shows real-time gear visualization with visual effects, lighting, and dynamic combat animations.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* 3D Rendering */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-6 space-y-3"
          >
            <h3 className="text-2xl font-bold text-white">🎯 3D Rendering</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>✓ Real-time Three.js battle scenes</li>
              <li>✓ Procedurally generated weapon models</li>
              <li>✓ Dynamic armor visualization</li>
              <li>✓ Physical-based material rendering</li>
              <li>✓ Advanced shadow mapping</li>
              <li>✓ Smooth camera animations</li>
            </ul>
          </motion.div>

          {/* Visual Effects */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-pink-900/30 border border-pink-500/50 rounded-lg p-6 space-y-3"
          >
            <h3 className="text-2xl font-bold text-white">✨ Visual Effects</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-orange-500" />
                <span className="text-slate-300 text-sm">Fire - Flaming weapons</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-cyan-400" />
                <span className="text-slate-300 text-sm">Ice - Frozen armor</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-yellow-300" />
                <span className="text-slate-300 text-sm">Lightning - Electric gear</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-purple-700" />
                <span className="text-slate-300 text-sm">Shadow - Dark enchantments</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded bg-purple-400" />
                <span className="text-slate-300 text-sm">Arcane - Magical gear</span>
              </div>
            </div>
          </motion.div>

          {/* Procedural Gear */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-6 space-y-3"
          >
            <h3 className="text-2xl font-bold text-white">🔧 Procedural Gear</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>✓ 17 unique material types</li>
              <li>✓ 18 dynamic affix combinations</li>
              <li>✓ Millions of unique gear pieces</li>
              <li>✓ Material-based stat scaling</li>
              <li>✓ Rarity-weighted generation</li>
              <li>✓ Visual effect inheritance</li>
            </ul>
          </motion.div>

          {/* Combat System */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-orange-900/30 border border-orange-500/50 rounded-lg p-6 space-y-3"
          >
            <h3 className="text-2xl font-bold text-white">⚡ Combat Animations</h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li>✓ Attack thrust animations</li>
              <li>✓ Defense recoil effects</li>
              <li>✓ Ability spin attacks</li>
              <li>✓ Particle effect emissions</li>
              <li>✓ Enemy model recoil</li>
              <li>✓ Floating damage numbers</li>
            </ul>
          </motion.div>
        </div>

        {/* Tech Stack */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 space-y-4"
        >
          <h2 className="text-2xl font-bold text-white">🛠️ Technology Stack</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-purple-300 font-bold">Rendering</p>
              <p className="text-slate-300">Three.js r128</p>
            </div>
            <div>
              <p className="text-purple-300 font-bold">Geometry</p>
              <p className="text-slate-300">Procedural meshes</p>
            </div>
            <div>
              <p className="text-purple-300 font-bold">Materials</p>
              <p className="text-slate-300">MeshStandardMaterial</p>
            </div>
            <div>
              <p className="text-purple-300 font-bold">Effects</p>
              <p className="text-slate-300">GPU particles</p>
            </div>
            <div>
              <p className="text-purple-300 font-bold">Lighting</p>
              <p className="text-slate-300">PCF Shadow mapping</p>
            </div>
            <div>
              <p className="text-purple-300 font-bold">Animation</p>
              <p className="text-slate-300">Keyframe tweens</p>
            </div>
            <div>
              <p className="text-purple-300 font-bold">Frontend</p>
              <p className="text-slate-300">Next.js 14 React</p>
            </div>
            <div>
              <p className="text-purple-300 font-bold">UI</p>
              <p className="text-slate-300">Framer Motion</p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid md:grid-cols-4 gap-4 text-center"
        >
          <div className="bg-purple-900/30 border border-purple-500 rounded-lg p-4">
            <p className="text-3xl font-bold text-purple-300">17</p>
            <p className="text-sm text-slate-400">Material Types</p>
          </div>
          <div className="bg-pink-900/30 border border-pink-500 rounded-lg p-4">
            <p className="text-3xl font-bold text-pink-300">18</p>
            <p className="text-sm text-slate-400">Affix Combinations</p>
          </div>
          <div className="bg-blue-900/30 border border-blue-500 rounded-lg p-4">
            <p className="text-3xl font-bold text-blue-300">5</p>
            <p className="text-sm text-slate-400">Visual Effects</p>
          </div>
          <div className="bg-orange-900/30 border border-orange-500 rounded-lg p-4">
            <p className="text-3xl font-bold text-orange-300">∞</p>
            <p className="text-sm text-slate-400">Unique Gear</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
