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
 * Get room count for a floor (legacy - kept for compatibility)
 */
export function getRoomCount(floor: number): number {
  if (floor <= 5) return 3;
  if (floor <= 10) return 4;
  return 5;
}

export interface BehaviorProfile {
  avgDistance: number;      // Agent's avg distance from enemies
  abilityUsageRate: number; // How often abilities are used
  totalDamage: number;      // Total damage taken this run
}

/**
 * Generate a room for a specific floor map node type.
 * On trial floors, behavior profile adapts enemy composition to counter playstyle.
 */
export function generateRoomForNodeType(
  nodeType: 'combat' | 'elite' | 'exit',
  floor: number,
  nodeId: string,
  isTrial: boolean = false,
  behavior?: BehaviorProfile
): Room {
  const baseCount = 3 + Math.floor(floor / 2);
  let countMultiplier = nodeType === 'elite' ? 1.5 : nodeType === 'exit' ? 1.3 : 1.0;
  if (isTrial) countMultiplier *= 1.4; // Trial rooms are 40% harder

  const count = Math.max(2, Math.floor(baseCount * countMultiplier));

  let spawns: EnemySpawn[];

  if (isTrial && behavior && floor >= 3) {
    // Adaptive composition — counter the agent's behavior
    if (behavior.avgDistance > 150) {
      // Agent kites/hangs back → spawn fast dashers + chargers to close distance
      spawns = [
        { type: 'dasher', count: Math.ceil(count * 0.5) },
        { type: 'charger', count: Math.floor(count * 0.5) },
      ];
    } else if (behavior.avgDistance < 60) {
      // Agent facetanks → spawn rangers to punish close-quarters
      spawns = [
        { type: 'ranger', count: Math.ceil(count * 0.6) },
        { type: 'dasher', count: Math.floor(count * 0.4) },
      ];
    } else {
      // Balanced behavior → heavy mixed pressure
      spawns = [
        { type: 'charger', count: Math.ceil(count * 0.35) },
        { type: 'ranger', count: Math.ceil(count * 0.35) },
        { type: 'dasher', count: Math.max(1, Math.floor(count * 0.3)) },
      ];
    }
  } else if (floor === 1) {
    spawns = [{ type: 'charger', count }];
  } else if (floor === 2) {
    spawns = [
      { type: 'charger', count: Math.ceil(count * 0.6) },
      { type: 'ranger', count: Math.floor(count * 0.4) },
    ];
  } else {
    spawns = [
      { type: 'charger', count: Math.ceil(count * 0.4) },
      { type: 'ranger', count: Math.ceil(count * 0.35) },
      { type: 'dasher', count: Math.max(1, Math.floor(count * 0.25)) },
    ];
  }

  return { id: nodeId, floor, roomNumber: 0, enemySpawns: spawns, cleared: false };
}
