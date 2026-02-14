/**
 * index.ts - Dungeon 3D Module Exports
 * 
 * Central export file for the dungeon 3D environment generation system.
 */

// Type definitions
export * from './types';

// Core classes
export { DungeonGenerator } from './generator';
export { MaterialLibrary, getMaterialLibrary, disposeMaterialLibrary } from './materials';
export { FogOfWar } from './fogOfWar';
export { DungeonLighting, createDefaultLighting } from './lighting';

// React hooks
export {
  useDungeon3D,
  useRoomMesh,
  useFogOfWar,
  useBackendRoomConverter,
  useDungeonLighting,
} from './useDungeon3D';
