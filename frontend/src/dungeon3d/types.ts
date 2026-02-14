/**
 * types.ts - Dungeon 3D Type Definitions
 * 
 * Core type system for 3D dungeon generation, rendering, and management.
 * Integrates with backend BSP dungeon generation data.
 */

import * as THREE from 'three';

/**
 * Room type classification for different dungeon areas
 */
export enum RoomType {
  ENTRANCE = 'entrance',
  TREASURE = 'treasure',
  COMBAT = 'combat',
  BOSS = 'boss',
  EXIT = 'exit',
  CORRIDOR = 'corridor',
  SECRET = 'secret',
}

/**
 * Tile type for grid-based room layout
 */
export enum TileType {
  FLOOR = 'floor',
  WALL = 'wall',
  DOOR = 'door',
  TRAP = 'trap',
  EMPTY = 'empty',
  STAIRS_UP = 'stairs_up',
  STAIRS_DOWN = 'stairs_down',
}

/**
 * Direction enumeration for doors and connections
 */
export enum Direction {
  NORTH = 'north',
  SOUTH = 'south',
  EAST = 'east',
  WEST = 'west',
}

/**
 * Wall configuration for a single wall segment
 */
export interface WallConfig {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  width: number;
  height: number;
  hasDoor?: boolean;
  doorPosition?: THREE.Vector3;
  doorWidth?: number;
  doorHeight?: number;
  material?: string;
}

/**
 * Floor configuration for room floor mesh
 */
export interface FloorConfig {
  position: THREE.Vector3;
  width: number;
  depth: number;
  tileSize: number;
  uvScale: number;
  material?: string;
}

/**
 * Ceiling configuration for room ceiling mesh
 */
export interface CeilingConfig {
  position: THREE.Vector3;
  width: number;
  depth: number;
  height: number;
  uvScale: number;
  material?: string;
}

/**
 * Door configuration for room exits/entrances
 */
export interface DoorConfig {
  id: string;
  position: THREE.Vector3;
  direction: Direction;
  width: number;
  height: number;
  isOpen: boolean;
  leadsToRoomId?: string;
}

/**
 * Trap configuration for hazards
 */
export interface TrapConfig {
  id: string;
  position: THREE.Vector3;
  type: 'spike' | 'fire' | 'poison' | 'electric';
  isActive: boolean;
  damage: number;
}

/**
 * 3D Dungeon Room representation
 * Converts backend BSP room data to 3D meshes
 */
export interface DungeonRoom3D {
  // Identification
  id: string;
  roomType: RoomType;
  
  // Spatial properties
  position: THREE.Vector3;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  
  // Grid-based layout (8x8 or 10x10 tiles)
  gridSize: number;
  tiles: TileType[][];
  
  // Mesh configurations
  walls: WallConfig[];
  floor: FloorConfig;
  ceiling: CeilingConfig;
  doors: DoorConfig[];
  traps?: TrapConfig[];
  
  // Connections to other rooms
  connections: {
    north?: string;
    south?: string;
    east?: string;
    west?: string;
  };
  
  // Lighting configuration
  lightingConfig?: RoomLightingConfig;
  
  // Fog of war state
  explored: boolean;
  partiallyExplored?: boolean[][];
}

/**
 * Lighting configuration per room
 */
export interface RoomLightingConfig {
  ambientIntensity: number;
  ambientColor: THREE.Color;
  torches: TorchLight[];
  hasShadows: boolean;
}

/**
 * Individual torch light configuration
 */
export interface TorchLight {
  position: THREE.Vector3;
  intensity: number;
  color: THREE.Color;
  distance: number;
  decay: number;
}

/**
 * Collection of all generated meshes for a room
 */
export interface DungeonMeshes {
  walls: THREE.Mesh[];
  floor: THREE.Mesh;
  ceiling: THREE.Mesh;
  doors: THREE.Mesh[];
  traps?: THREE.Mesh[];
  decorations?: THREE.Mesh[];
  
  // Container for all meshes
  group: THREE.Group;
}

/**
 * Material library configuration
 */
export interface MaterialConfig {
  name: string;
  type: 'wall' | 'floor' | 'ceiling' | 'door' | 'trap';
  baseColor: THREE.Color | string;
  roughness: number;
  metalness: number;
  normalMapUrl?: string;
  textureUrl?: string;
  emissive?: THREE.Color | string;
  emissiveIntensity?: number;
}

/**
 * Fog of War state tracking
 */
export interface FogOfWarState {
  roomId: string;
  exploredTiles: boolean[][];
  visibilityRadius: number;
  playerPosition: THREE.Vector2;
}

/**
 * Complete dungeon 3D data structure
 */
export interface Dungeon3D {
  id: string;
  rooms: Map<string, DungeonRoom3D>;
  currentRoomId: string;
  meshCache: Map<string, DungeonMeshes>;
  fogOfWar: Map<string, FogOfWarState>;
}

/**
 * Backend BSP dungeon room data (from server)
 */
export interface BackendDungeonRoom {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type?: string;
  exits?: {
    north?: boolean;
    south?: boolean;
    east?: boolean;
    west?: boolean;
  };
  connectedRooms?: string[];
}

/**
 * Backend dungeon data structure
 */
export interface BackendDungeonData {
  id: string;
  seed: number;
  rooms: BackendDungeonRoom[];
  startRoomId: string;
  bossRoomId?: string;
  exitRoomId?: string;
}

/**
 * Generator options for customization
 */
export interface GeneratorOptions {
  tileSize: number;
  wallHeight: number;
  doorWidth: number;
  doorHeight: number;
  gridSize: 8 | 10;
  optimizeMeshes: boolean;
  generateColliders: boolean;
}

/**
 * Mesh optimization settings
 */
export interface OptimizationSettings {
  mergeWalls: boolean;
  instancedRendering: boolean;
  frustumCulling: boolean;
  occlusionCulling: boolean;
  maxDrawCalls: number;
}
