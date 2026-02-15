'use client';

import { ArenaCanvas } from '@/components/game';

/**
 * Arena Test Page - For verifying PixiJS setup
 * Route: /arena
 */
export default function ArenaPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold text-white mb-4">🎮 Arena Test</h1>
      <p className="text-purple-300 mb-6">PixiJS Canvas - Phase A-1</p>
      
      <div className="border-2 border-purple-500/30 rounded-lg overflow-hidden shadow-2xl shadow-purple-500/20">
        <ArenaCanvas width={1280} height={720} />
      </div>
      
      <p className="text-slate-400 mt-4 text-sm">
        Expected: Dark background (0x0a0a12) with "Loading Arena..." briefly shown
      </p>
    </div>
  );
}
