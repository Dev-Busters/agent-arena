'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import Minimap from './Minimap';
import StatsOverlay from './StatsOverlay';
import Dungeon3DView from './Dungeon3DView';

interface Room {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DungeonExplorationProps {
  dungeonId: string;
  difficulty: string;
  depth: number;
  playerStats: any;
  initialRooms?: any[];
  onEncounter: () => void;
  onNextFloor: () => void;
  onComplete: () => void;
}

export default function DungeonExploration({
  dungeonId,
  difficulty,
  depth,
  playerStats,
  initialRooms = [],
  onEncounter,
  onNextFloor,
  onComplete
}: DungeonExplorationProps) {
  const { socket } = useSocket();
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [visitedRooms, setVisitedRooms] = useState<number[]>([]);
  const [floorComplete, setFloorComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentFloor, setCurrentFloor] = useState(depth);
  const [currentRoomId, setCurrentRoomId] = useState<number | null>(null);
  const [enemiesDefeated, setEnemiesDefeated] = useState(0);
  const [goldEarned, setGoldEarned] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [currentHp, setCurrentHp] = useState(playerStats.hp);
  const [currentDifficulty, setCurrentDifficulty] = useState(difficulty);
  const startTimeRef = useRef(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [view3D, setView3D] = useState(true); // Default to 3D view

  // Elapsed timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleRoomClear = (data: any) => {
      setVisitedRooms(prev => {
        const updated = prev;
        setLoading(false);
        
        if (updated.length >= rooms.length - 1) {
          setFloorComplete(true);
        }
        return updated;
      });
    };

    const handleEncounterStarted = () => {
      setLoading(false);
      onEncounter();
    };

    const handleFloorChanged = (data: any) => {
      setCurrentFloor(data.floor);
      setCurrentDifficulty(data.difficulty || difficulty);
      setRooms(data.map.rooms || []);
      setVisitedRooms([]);
      setCurrentRoomId(null);
      setFloorComplete(false);
      setLoading(false);
    };

    const handleEncounterWon = (data: any) => {
      setEnemiesDefeated(prev => prev + 1);
      if (data?.gold) setGoldEarned(prev => prev + data.gold);
      if (data?.xp) setXpEarned(prev => prev + data.xp);
    };

    const handleTurnResult = (data: any) => {
      // Track HP changes from enemy attacks
      if (data?.playerHp !== undefined) {
        setCurrentHp(data.playerHp);
      }
    };

    socket.on('room_clear', handleRoomClear);
    socket.on('encounter_started', handleEncounterStarted);
    socket.on('floor_changed', handleFloorChanged);
    socket.on('encounter_won', handleEncounterWon);
    socket.on('turn_result', handleTurnResult);

    return () => {
      socket.off('room_clear', handleRoomClear);
      socket.off('encounter_started', handleEncounterStarted);
      socket.off('floor_changed', handleFloorChanged);
      socket.off('encounter_won', handleEncounterWon);
      socket.off('turn_result', handleTurnResult);
    };
  }, [socket, rooms.length, onEncounter, difficulty]);

  const handleRoomClick = (roomId: number) => {
    if (visitedRooms.includes(roomId) || loading) return;

    setLoading(true);
    setCurrentRoomId(roomId);
    setVisitedRooms(prev => [...prev, roomId]);

    socket?.emit('enter_room', {
      dungeonId,
      roomId
    });
  };

  const getRoomStatus = (roomId: number) => {
    if (visitedRooms.includes(roomId)) return 'cleared';
    return 'unexplored';
  };

  const difficultyColor: Record<string, string> = {
    easy: 'from-green-600 to-emerald-600',
    normal: 'from-blue-600 to-cyan-600',
    hard: 'from-orange-600 to-red-600',
    nightmare: 'from-purple-600 to-pink-600',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative">
      {/* 3D View Toggle Button (Fixed Position) */}
      <motion.button
        onClick={() => setView3D(!view3D)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg bg-slate-800/90 border border-slate-600/50 backdrop-blur-sm text-slate-200 font-bold text-sm hover:bg-slate-700/90 transition-colors"
      >
        {view3D ? '🗺️ 2D Map' : '🎮 3D View'}
      </motion.button>

      {/* Render 3D View or 2D Map */}
      {view3D ? (
        <Dungeon3DView
          dungeonId={dungeonId}
          rooms={rooms}
          currentRoomId={currentRoomId}
          onRoomChange={(roomId) => handleRoomClick(roomId)}
          playerStats={playerStats}
        />
      ) : (
        <div className="p-8">
          {/* Background effects */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-end justify-between mb-6">
            <div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-2"
              >
                Floor {currentFloor}
              </motion.div>
              <p className="text-slate-400 font-mono text-sm">Depth: {currentFloor} / 10</p>
            </div>

            <div className="text-right space-y-2">
              <div className="inline-block px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 backdrop-blur-sm">
                <p className="text-slate-300 text-xs uppercase tracking-widest font-bold">Difficulty</p>
                <p className={`text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r ${difficultyColor[difficulty]}`}>
                  {difficulty.toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* Compact inline status */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 flex-wrap"
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/30 backdrop-blur-sm">
              <span className="text-[10px] text-slate-500 font-mono">HP</span>
              <span className="text-xs font-bold text-cyan-300 font-mono">{currentHp}/{playerStats.maxHp}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/30 backdrop-blur-sm">
              <span className="text-[10px] text-slate-500 font-mono">LVL</span>
              <span className="text-xs font-bold text-yellow-300 font-mono">{playerStats.level}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/30 backdrop-blur-sm">
              <span className="text-[10px] text-slate-500 font-mono">ROOMS</span>
              <span className="text-xs font-bold text-purple-300 font-mono">{visitedRooms.length}/{rooms.length}</span>
            </div>
            <motion.div
              key={floorComplete ? 'complete' : 'incomplete'}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`px-3 py-1.5 rounded-full border backdrop-blur-sm text-xs font-bold ${
                floorComplete
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              {floorComplete ? '✨ Complete' : '🔍 Exploring'}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Dungeon Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-2xl p-8 mb-8"
        >
          <h2 className="text-lg font-bold text-slate-200 mb-6 uppercase tracking-widest">Dungeon Map</h2>

          {/* Room Grid */}
          <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-5">
            <AnimatePresence>
              {rooms.map((room, idx) => {
                const isCleared = visitedRooms.includes(room.id);
                return (
                  <motion.button
                    key={room.id}
                    onClick={() => handleRoomClick(room.id)}
                    disabled={isCleared || loading}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`relative group overflow-hidden rounded-xl transition-all duration-300 aspect-square ${
                      isCleared ? 'cursor-default opacity-60' : 'cursor-pointer hover:scale-105'
                    }`}
                  >
                    {/* Background */}
                    <div className={`absolute inset-0 transition-all duration-300 ${
                      isCleared
                        ? 'bg-gradient-to-br from-slate-600 to-slate-700'
                        : 'bg-gradient-to-br from-slate-700 to-slate-800 group-hover:from-blue-600 group-hover:to-slate-700'
                    }`} />

                    {/* Border glow */}
                    {!isCleared && (
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-xl" />
                    )}

                    {/* Border */}
                    <div className={`absolute inset-0 border rounded-xl transition-all duration-300 ${
                      isCleared 
                        ? 'border-slate-600' 
                        : 'border-slate-600 group-hover:border-blue-500'
                    }`} />

                    {/* Content */}
                    <div className="relative h-full flex flex-col items-center justify-center gap-2 p-2">
                      <motion.div
                        animate={!isCleared && !loading ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="text-2xl"
                      >
                        {isCleared ? '✓' : '?'}
                      </motion.div>
                      <p className="text-xs font-bold text-slate-300">
                        {isCleared ? 'Cleared' : `Room ${room.id + 1}`}
                      </p>
                    </div>

                    {/* Loading indicator */}
                    {loading && (
                      <div className="absolute inset-0 bg-blue-500/20 animate-pulse" />
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>

          <p className="text-slate-400 text-xs mt-6 font-mono">
            💡 Click rooms to explore. Some rooms contain enemies!
          </p>
        </motion.div>

        {/* Floor Complete Actions */}
        <AnimatePresence>
          {floorComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20 }}
              className="backdrop-blur-xl bg-gradient-to-br from-emerald-600/20 to-teal-600/10 border border-emerald-500/50 rounded-2xl p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="text-5xl mb-4"
              >
                ✨
              </motion.div>
              <h3 className="text-2xl font-bold text-emerald-300 mb-2">Floor Complete!</h3>
              <p className="text-emerald-300/70 mb-6">Ready to descend deeper?</p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onNextFloor}
                className="relative group overflow-hidden rounded-xl px-8 py-4 font-bold text-white uppercase tracking-wide"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 group-hover:from-emerald-500 group-hover:to-teal-500 transition-all" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/10 transition-all" />
                <div className="relative">
                  {depth >= 10 ? '🏆 Claim Victory' : '⬇️ Next Floor'}
                </div>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
