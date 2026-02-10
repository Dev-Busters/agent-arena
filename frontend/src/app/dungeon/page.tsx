'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DungeonStart from '@/components/dungeon/DungeonStart';
import DungeonExploration from '@/components/dungeon/DungeonExploration';
import DungeonEncounter from '@/components/dungeon/DungeonEncounter';
import DungeonComplete from '@/components/dungeon/DungeonComplete';

type DungeonState = 'start' | 'exploring' | 'encounter' | 'complete';

export default function DungeonPage() {
  const router = useRouter();
  const [state, setState] = useState<DungeonState>('start');
  const [dungeonId, setDungeonId] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard' | 'nightmare'>('normal');
  const [depth, setDepth] = useState(1);
  const [playerStats, setPlayerStats] = useState({ hp: 100, maxHp: 100, level: 1 });
  const [initialRooms, setInitialRooms] = useState<any[]>([]);

  const handleStartDungeon = (dungId: string, diff: string, stats: any, rooms: any[]) => {
    setDungeonId(dungId);
    setDifficulty(diff as any);
    setPlayerStats(stats);
    setInitialRooms(rooms);
    console.log('🎮 Dungeon page received rooms:', rooms);
    setState('exploring');
  };

  const handleEnterEncounter = () => {
    setState('encounter');
  };

  const handleEncounterWon = () => {
    setState('exploring');
  };

  const handleNextFloor = () => {
    setDepth(depth + 1);
    setState('exploring');
  };

  const handleDungeonComplete = () => {
    setState('complete');
  };

  const handleReturn = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {state === 'start' && (
        <DungeonStart onStart={handleStartDungeon} />
      )}
      {state === 'exploring' && dungeonId && (
        <DungeonExploration
          dungeonId={dungeonId}
          difficulty={difficulty}
          depth={depth}
          playerStats={playerStats}
          initialRooms={initialRooms}
          onEncounter={handleEnterEncounter}
          onNextFloor={handleNextFloor}
          onComplete={handleDungeonComplete}
        />
      )}
      {state === 'encounter' && dungeonId && (
        <DungeonEncounter
          dungeonId={dungeonId}
          playerStats={playerStats}
          onWin={handleEncounterWon}
          onFlee={handleEncounterWon}
        />
      )}
      {state === 'complete' && (
        <DungeonComplete
          depth={depth}
          rewards={{ gold: 5000 * depth, xp: 10000 * depth }}
          onReturn={handleReturn}
        />
      )}
    </div>
  );
}
