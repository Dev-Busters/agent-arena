// Stub: Dungeon system (TODO: implement in Phase H)
// This file should be deleted once Phase H (Product Infrastructure) begins
// and real dungeon/encounter systems are implemented via API

export function generateDungeon() { return { rooms: [] }; }
export function generateBSPDungeonMap() { return { rooms: [] }; }
export function generateEncounter() { return { enemies: [] }; }
export function scaleEnemyStats() { return { hp: 100, damage: 10 }; }
export function calculateLoot() { return { gold: 10, xp: 50 }; }
export function getDifficultyForFloor() { return 1; }
export function generateBranchingPaths() { return []; }
export function getSpecialZoneBonus() { return { goldMult: 1, xpMult: 1, rarityMult: 1 }; }

export enum EnemyType { Goblin = 'goblin', Skeleton = 'skeleton', Demon = 'demon' }
export enum DungeonDifficulty { Easy = 'easy', Normal = 'normal', Hard = 'hard' }
export enum SpecialZoneType { Treasure = 'treasure', Hazard = 'hazard', Boss = 'boss' }
export enum RoomType { Combat = 'combat', Boss = 'boss', Treasure = 'treasure' }

export interface BSPRoom { id: string; x: number; y: number; width: number; height: number; }
export interface BSPDungeonMap { rooms: BSPRoom[]; }

export const ENEMY_TEMPLATES = {
  goblin: { type: EnemyType.Goblin, hp: 30, damage: 5 },
};
