import { Enemy } from './Enemy';

/**
 * Enemy spawn configuration for a room
 */
export interface EnemySpawn {
  type: 'charger' | 'ranger' | 'dasher';
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
    // Floor 1: Mostly chargers (easier to understand)
    spawns.push({ type: 'charger', count: totalEnemies });
  } else if (floor === 2) {
    // Floor 2: Chargers + rangers
    const chargers = Math.floor(totalEnemies * 0.6);
    const rangers = totalEnemies - chargers;
    spawns.push({ type: 'charger', count: chargers });
    if (rangers > 0) spawns.push({ type: 'ranger', count: rangers });
  } else {
    // Floor 3+: Mix of all 3 archetypes
    const chargers = Math.floor(totalEnemies * 0.4);
    const rangers = Math.floor(totalEnemies * 0.35);
    const dashers = totalEnemies - chargers - rangers;
    
    spawns.push({ type: 'charger', count: chargers });
    spawns.push({ type: 'ranger', count: rangers });
    if (dashers > 0) spawns.push({ type: 'dasher', count: dashers });
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
