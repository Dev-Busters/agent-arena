'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';

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

  useEffect(() => {
    if (!socket) return;

    const handleRoomClear = () => {
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
      setRooms(data.map.rooms || []);
      setVisitedRooms([]);
      setFloorComplete(false);
      setLoading(false);
    };

    socket.on('room_clear', handleRoomClear);
    socket.on('encounter_started', handleEncounterStarted);
    socket.on('floor_changed', handleFloorChanged);

    return () => {
      socket.off('room_clear', handleRoomClear);
      socket.off('encounter_started', handleEncounterStarted);
      socket.off('floor_changed', handleFloorChanged);
    };
  }, [socket, rooms.length, onEncounter]);

  const handleRoomClick = (roomId: number) => {
    if (visitedRooms.includes(roomId) || loading) return;

    setLoading(true);
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-8">
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

          {/* Player Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-4 gap-4"
          >
            {/* HP */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/30 rounded-xl p-4">
              <p className="text-xs text-cyan-300/70 uppercase tracking-widest mb-2">HP</p>
              <div className="w-full h-4 bg-slate-800/50 rounded-full border border-cyan-500/30 overflow-hidden mb-2">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  initial={{ width: '100%' }}
                  animate={{ width: `${(playerStats.hp / playerStats.maxHp) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-cyan-300 font-mono">{playerStats.hp} / {playerStats.maxHp}</p>
            </div>

            {/* Level */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-500/30 rounded-xl p-4">
              <p className="text-xs text-yellow-300/70 uppercase tracking-widest mb-2">Level</p>
              <p className="text-3xl font-black text-yellow-300">{playerStats.level}</p>
            </div>

            {/* Rooms Cleared */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/30 rounded-xl p-4">
              <p className="text-xs text-purple-300/70 uppercase tracking-widest mb-2">Explored</p>
              <p className="text-3xl font-black text-purple-300">{visitedRooms.length}/{rooms.length}</p>
            </div>

            {/* Floor Status */}
            <div className="backdrop-blur-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/30 rounded-xl p-4">
              <p className="text-xs text-emerald-300/70 uppercase tracking-widest mb-2">Status</p>
              <motion.p
                key={floorComplete ? 'complete' : 'incomplete'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`text-sm font-bold ${floorComplete ? 'text-emerald-300' : 'text-amber-300'}`}
              >
                {floorComplete ? '✨ Complete' : '🔍 Exploring'}
              </motion.p>
            </div>
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
  );
}
