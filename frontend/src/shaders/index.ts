/**
 * Agent Arena Shaders & Materials
 * Main entry point for shader system
 */

// Type definitions
export * from './types';

// Rarity glow shaders
export {
  rarityGlowVertexShader,
  rarityGlowFragmentShader,
  createRarityGlowMaterial,
  updateRarityGlow,
  RarityGlowManager,
  createGlowingItem,
  getGlowMaterial,
} from './rarityGlow';

// Normal map utilities
export {
  generateProceduralNormalMap,
  applyNormalMap,
  createDetailNormalMap,
  combineNormalMaps,
  NormalMapCache,
  normalMapCache,
  NORMAL_MAP_PRESETS,
} from './normalMaps';

// PBR materials
export {
  PBRMaterialFactory,
  pbrFactory,
  Materials,
  applyPBRMaterial,
} from './pbr';

// Status effects
export {
  createStatusEffectMaterial,
  StatusEffectManager,
  statusEffectManager,
} from './statusEffects';

// React hooks
export {
  usePBRMaterial,
  useRarityGlow,
  useStatusEffect,
  useItemMaterial,
  useEnvironmentMap,
  useMaterialBatch,
  useShaderPerformance,
} from './useMaterial';
