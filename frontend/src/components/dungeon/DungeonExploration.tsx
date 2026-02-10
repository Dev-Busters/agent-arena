'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';

interface Room {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BranchingPath {
  pathId: string;
  floor: number;
  description: string;
  zoneType: string;
  difficulty: string;
  rarityBoost: number;
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
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [visitedRooms, setVisitedRooms] = useState<number[]>([]);
  const [floorComplete, setFloorComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [branchingPaths, setBranchingPaths] = useState<BranchingPath[] | null>(null);
  const [currentFloor, setCurrentFloor] = useState(depth);

  useEffect(() => {
    if (!socket) return;

    const handleRoomClear = (data: any) => {
      console.log('✅ Room clear:', data);
      setVisitedRooms(prev => {
        const updated = selectedRoom !== null && !prev.includes(selectedRoom) 
          ? [...prev, selectedRoom] 
          : prev;
        
        // Check if floor is complete
        if (updated.length >= rooms.length - 1) {
          console.log('🎯 Floor complete!', updated.length, rooms.length);
          setFloorComplete(true);
        }
        return updated;
      });
      setLoading(false);
      setSelectedRoom(null);
    };

    const handleEncounterStarted = (data: any) => {
      console.log('⚔️  Encounter started:', data);
      setLoading(false);
      onEncounter();
    };

    const handleFloorChanged = (data: any) => {
      console.log('📈 Floor changed:', data.floor);
      setCurrentFloor(data.floor);
      setRooms(data.map.rooms || []);
      setVisitedRooms([]);
      setFloorComplete(false);
      setBranchingPaths(data.branchingPaths || null);
      setLoading(false);
      setSelectedRoom(null);
    };

    const handlePathChosen = (data: any) => {
      console.log('🔀 Path chosen:', data.zoneType);
      setRooms(data.map.rooms || []);
      setVisitedRooms([]);
      setFloorComplete(false);
      setBranchingPaths(null);
      setLoading(false);
      setSelectedRoom(null);
    };

    const handleDungeonError = (data: any) => {
      console.error('❌ Dungeon error:', data.message);
      alert('Error: ' + data.message);
      setLoading(false);
      setSelectedRoom(null);
    };

    socket.on('room_clear', handleRoomClear);
    socket.on('encounter_started', handleEncounterStarted);
    socket.on('floor_changed', handleFloorChanged);
    socket.on('path_chosen', handlePathChosen);
    socket.on('dungeon_error', handleDungeonError);

    return () => {
      socket.off('room_clear', handleRoomClear);
      socket.off('encounter_started', handleEncounterStarted);
      socket.off('floor_changed', handleFloorChanged);
      socket.off('path_chosen', handlePathChosen);
      socket.off('dungeon_error', handleDungeonError);
    };
  }, [socket, rooms.length, onEncounter]);

  const handleRoomClick = (roomId: number) => {
    if (visitedRooms.includes(roomId) || selectedRoom === roomId) return;

    setSelectedRoom(roomId);
    setLoading(true);

    socket?.emit('enter_room', {
      dungeonId,
      roomId
    });
  };

  const handleNextFloor = () => {
    if (currentFloor >= 10) {
      socket?.emit('next_floor', { dungeonId });
    } else {
      setLoading(true);
      socket?.emit('next_floor', { dungeonId });
    }
  };

  const handleChoosePath = (path: BranchingPath) => {
    setLoading(true);
    socket?.emit('choose_path', {
      dungeonId,
      pathId: path.pathId,
      zoneType: path.zoneType
    });
  };

  const roomColors = (roomId: number) => {
    if (visitedRooms.includes(roomId)) return 'bg-slate-600';
    if (selectedRoom === roomId) return 'bg-purple-500';
    return 'bg-purple-600/50 hover:bg-purple-500 cursor-pointer';
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-4xl font-bold text-white"
          >
            Floor {currentFloor}
          </motion.h1>
          <div className="text-right">
            <p className="text-purple-300">Difficulty: <span className="font-bold capitalize">{difficulty}</span></p>
            <p className="text-purple-400">Rooms Cleared: {visitedRooms.length} / {rooms.length}</p>
          </div>
        </div>

        {/* Player Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 mb-6"
        >
          <div className="flex justify-between items-center">
            <div>
              <p className="text-purple-300 text-sm">Health</p>
              <div className="w-64 h-4 bg-slate-800 rounded overflow-hidden border border-purple-500/30">
                <div
                  className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all"
                  style={{ width: `${(playerStats.hp / playerStats.maxHp) * 100}%` }}
                />
              </div>
              <p className="text-purple-300 text-xs mt-1">{playerStats.hp} / {playerStats.maxHp}</p>
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-lg">Level {playerStats.level}</p>
            </div>
          </div>
        </motion.div>

        {/* Dungeon Map */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-slate-900/50 border border-purple-500/30 rounded-lg p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-white mb-4">Dungeon Map</h2>
          <div className="grid grid-cols-4 gap-3">
            {rooms.map((room) => (
              <motion.button
                key={room.id}
                onClick={() => handleRoomClick(room.id)}
                disabled={visitedRooms.includes(room.id) || loading}
                whileHover={!visitedRooms.includes(room.id) ? { scale: 1.05 } : {}}
                className={`p-4 rounded-lg border border-purple-500/50 transition-all font-bold ${roomColors(room.id)} ${
                  visitedRooms.includes(room.id) ? 'cursor-not-allowed' : ''
                }`}
              >
                <div className="text-2xl mb-1">
                  {visitedRooms.includes(room.id) ? '✓' : room.id + 1}
                </div>
                <div className="text-xs text-purple-200">
                  {visitedRooms.includes(room.id) ? 'Cleared' : 'Room'}
                </div>
              </motion.button>
            ))}
          </div>
          <p className="text-slate-400 text-sm mt-4">
            💡 Click on rooms to explore. Some rooms contain enemies!
          </p>
        </motion.div>

        {/* Floor Complete - Show branching paths or next floor option */}
        {floorComplete && (
          <>
            {branchingPaths && branchingPaths.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 rounded-lg p-6"
              >
                <p className="text-2xl font-bold text-white mb-6 text-center">
                  🔀 The Path Diverges
                </p>
                <p className="text-purple-300 text-center mb-6">
                  Choose a path to a special zone for greater rewards!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {branchingPaths.map((path) => (
                    <motion.button
                      key={path.pathId}
                      onClick={() => handleChoosePath(path)}
                      disabled={loading}
                      whileHover={{ scale: 1.05 }}
                      className="p-4 rounded-lg border border-amber-500/50 bg-slate-800/50 hover:bg-amber-500/20 transition-all text-left"
                    >
                      <div className="text-sm font-bold text-amber-300 mb-2">
                        {path.zoneType.replace(/_/g, ' ').toUpperCase()}
                      </div>
                      <div className="text-white text-sm mb-3">{path.description}</div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-purple-300">
                          {path.difficulty}
                        </span>
                        <span className="text-xs font-bold text-yellow-400">
                          +{Math.round((path.rarityBoost - 1) * 100)}% Rarity
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-lg p-6 text-center"
              >
                <p className="text-2xl font-bold text-white mb-4">🎉 Floor Complete!</p>
                <button
                  onClick={handleNextFloor}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold py-3 px-8 rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all disabled:opacity-50"
                >
                  {currentFloor >= 10 ? '🏆 Complete Dungeon' : '⬇️ Next Floor'}
                </button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
