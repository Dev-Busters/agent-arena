/**
 * Rendering Optimizations — barrel export
 */

export { AssetCache } from './AssetCache';
export { FrustumCuller } from './FrustumCuller';
export { buildInstancedDungeon, flickerTorches } from './InstancedDungeon';
export type { DungeonLayout } from './InstancedDungeon';
export { ObjectPool, vec3Pool, mat4Pool } from './ObjectPool';
export { detectTier, getQualitySettings, overrideTier } from './QualityTier';
export type { Tier, QualitySettings } from './QualityTier';
export { configureRenderer } from './RendererSetup';
