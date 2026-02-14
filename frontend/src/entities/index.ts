/**
 * Entity System - Main Exports
 * Agent Arena 3D Roguelike
 */

// Types
export {
  EntityType,
  AnimationState,
  ParticleEffectType,
  ENTITY_COLORS,
  DEFAULT_ANIMATION_CONFIG,
  DEFAULT_HITBOXES,
} from './types';

export type {
  EntityHitbox,
  EntityModel,
  AnimationClip,
  AnimationKeyframe,
  AnimationConfig,
  ParticleEffectConfig,
  EntitySpawnConfig,
  AnimationBlendState,
  RagdollState,
} from './types';

// Models
export { EntityModelFactory } from './models';

// Animations
export { AnimationController, createAnimationController } from './animations';

// Particles
export { ParticleEffectManager, createParticleEffectManager } from './particles';

// Ragdoll
export {
  RagdollController,
  createRagdollController,
  createDeathImpulse,
} from './ragdoll';

// React Hooks
export {
  useEntity,
  useEntityAnimation,
  useParticleEffect,
  useEntityManager,
  useRagdollUpdate,
} from './useEntity';
