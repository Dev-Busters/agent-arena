/**
 * Lighting System - Main Exports
 * Agent Arena 3D Roguelike - P2.6
 */

// Type definitions
export * from './types';

// Core lighting classes
export { LightPool } from './lightPool';
export { TorchLight, WallTorchPlacer } from './torches';
export { ShadowManager } from './shadows';
export { RoomLightingManager } from './roomLighting';
export { LightmapBaker, AmbientOcclusionBaker } from './baking';
export { LightAnimator, AnimationPresets } from './animations';

// React hooks
export {
  useLightPool,
  useTorchLight,
  useRoomLighting,
  useLightAnimation,
  useShadowQuality,
  useLightShadow,
  useTorches,
  useLightPoolStats,
} from './useLighting';
