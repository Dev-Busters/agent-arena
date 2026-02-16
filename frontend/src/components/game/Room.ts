import { Enemy } from './Enemy';

/**
 * Enemy spawn configuration for a room
 */
export interface EnemySpawn {
  type: 'goblin' | 'skeleton' | 'demon';
  count: number;
}

/**
 * Room definition - represents a combat encounter
 */
export interface Room {
  id: string;
  floor: number;
  roomNumber: number; // 1-indexed (1, 2, 3...)
  enemySpawns: EnemySpawn[];
  cleared: boolean;
}

/**
 * Generate rooms for a floor
 */
export function generateRooms(floorNumber: number, roomCount: number): Room[] {
  const rooms: Room[] = [];
  
  for (let i = 0; i < roomCount; i++) {
    rooms.push({
      id: `floor${floorNumber}_room${i + 1}`,
      floor: floorNumber,
      roomNumber: i + 1,
      enemySpawns: generateEnemySpawns(floorNumber, i + 1),
      cleared: false,
    });
  }
  
  return rooms;
}

/**
 * Generate enemy spawns for a room based on floor and room number
 */
function generateEnemySpawns(floor: number, roomNumber: number): EnemySpawn[] {
  // Base enemy count increases with floor
  const baseCount = 3 + Math.floor(floor / 2);
  
  // Room difficulty increases within a floor
  const roomMultiplier = 1 + (roomNumber - 1) * 0.2;
  const totalEnemies = Math.floor(baseCount * roomMultiplier);
  
  // Mix of enemy types - more variety on higher floors
  const spawns: EnemySpawn[] = [];
  
  if (floor === 1) {
    // Floor 1: Mostly goblins
    spawns.push({ type: 'goblin', count: totalEnemies });
  } else if (floor === 2) {
    // Floor 2: Goblins + some skeletons
    const goblins = Math.floor(totalEnemies * 0.7);
    const skeletons = totalEnemies - goblins;
    spawns.push({ type: 'goblin', count: goblins });
    if (skeletons > 0) spawns.push({ type: 'skeleton', count: skeletons });
  } else {
    // Floor 3+: Mix of all types
    const goblins = Math.floor(totalEnemies * 0.4);
    const skeletons = Math.floor(totalEnemies * 0.4);
    const demons = totalEnemies - goblins - skeletons;
    
    spawns.push({ type: 'goblin', count: goblins });
    spawns.push({ type: 'skeleton', count: skeletons });
    if (demons > 0) spawns.push({ type: 'demon', count: demons });
  }
  
  return spawns;
}

/**
 * Get room count for a floor
 */
export function getRoomCount(floor: number): number {
  if (floor <= 5) return 3;
  if (floor <= 10) return 4;
  return 5;
}
