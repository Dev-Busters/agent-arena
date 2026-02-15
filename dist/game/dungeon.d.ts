/**
 * Roguelike Dungeon Generation & Management
 * Uses BSP (Binary Space Partitioning) for sophisticated room layouts
 * with fallback to rot.js Digger for simple maps
 */
import { BSPDungeonMap, BSPRoom, RoomType, Tile, Corridor, RoomFeature, getRoomGraph, findRoomPath, dungeonToASCII } from "./bsp-dungeon.js";
export { BSPDungeonMap, BSPRoom, RoomType, Tile, Corridor, RoomFeature };
export { getRoomGraph, findRoomPath, dungeonToASCII };
export type DungeonDifficulty = "easy" | "normal" | "hard" | "nightmare";
export type EnemyType = "goblin" | "orc" | "skeleton" | "wraith" | "boss_skeleton" | "boss_dragon" | "boss_lich";
export type SpecialZoneType = "boss_chamber" | "treasure_vault" | "cursed_hall" | "dragon_lair" | "arcane_sanctum" | "shadow_den";
export interface BranchingPath {
    pathId: string;
    floor: number;
    description: string;
    zoneType: SpecialZoneType;
    difficulty: DungeonDifficulty;
    rarityBoost: number;
}
export interface Room {
    x: number;
    y: number;
    width: number;
    height: number;
    id: number;
}
export interface DungeonMap {
    width: number;
    height: number;
    tiles: number[][];
    rooms: Room[];
    visited: Set<number>;
}
export interface EnemyTemplate {
    type: EnemyType;
    name: string;
    baseLevel: number;
    baseHp: number;
    baseAttack: number;
    baseDefense: number;
    baseSpeed: number;
    goldDrop: number;
    xpDrop: number;
    lootTable: string[];
}
export declare const ENEMY_TEMPLATES: Record<EnemyType, EnemyTemplate>;
/**
 * Generate a BSP dungeon with sophisticated room layouts.
 * Returns the full BSPDungeonMap with typed rooms, corridors, features.
 */
export declare function generateBSPDungeonMap(seed: number, difficulty: DungeonDifficulty, depth: number, playerLevel: number): BSPDungeonMap;
/**
 * Generate a procedurally random dungeon using BSP algorithm.
 * Backward-compatible: returns the legacy DungeonMap format.
 * Internally uses BSP for much better room layouts.
 */
export declare function generateDungeon(seed: number, difficulty: DungeonDifficulty, depth: number, playerLevel: number): DungeonMap;
/**
 * Generate enemies for a specific room based on difficulty and depth
 */
export declare function generateEncounter(roomId: number, _difficulty: DungeonDifficulty, depth: number, _playerLevel: number, rng: () => number): EnemyType[];
/**
 * Scale enemy stats based on player level and difficulty
 */
export declare function scaleEnemyStats(template: EnemyTemplate, playerLevel: number, _difficulty: DungeonDifficulty): {
    hp: number;
    attack: number;
    defense: number;
    speed: number;
};
/**
 * Calculate loot drops for a defeated enemy
 */
export declare function calculateLoot(template: EnemyTemplate, playerLevel: number, difficulty: DungeonDifficulty): {
    gold: number;
    xp: number;
};
/**
 * Get dungeon name based on depth
 */
export declare function getDungeonName(depth: number): string;
/**
 * Determine difficulty tier based on floor (auto-scaling)
 * Floors 1-3: Easy, 4-6: Normal, 7-9: Hard, 10+: Nightmare
 *
 * BALANCED: Reduced Hard (1.3→1.15) and Nightmare (1.6→1.4) for better survival rates
 */
export declare function getDifficultyForFloor(floor: number): DungeonDifficulty;
/**
 * Get difficulty multiplier for stats/damage scaling
 * BALANCED: Smoother progression curve
 */
export declare function getDifficultyMultiplier(difficulty: DungeonDifficulty): number;
/**
 * Generate branching paths for deeper floors (starts at floor 5)
 * Returns 2-3 path options with special zones
 */
export declare function generateBranchingPaths(floor: number, seed: number): BranchingPath[];
/**
 * Get special zone rewards (materials, items, gold multiplier)
 * BALANCED: Adjusted Boss Chamber and Shadow Den for zone variety
 */
export declare function getSpecialZoneBonus(zoneType: SpecialZoneType): {
    goldMult: number;
    xpMult: number;
    rarityMult: number;
};
//# sourceMappingURL=dungeon.d.ts.map