/**
 * Entity Types & Animation System Type Definitions
 * Agent Arena 3D Roguelike
 */

import * as THREE from 'three';

/**
 * All entity types in the game
 */
export enum EntityType {
  // Player
  PLAYER = 'player',
  
  // Common Enemies
  GOBLIN = 'goblin',
  ORC = 'orc',
  SKELETON = 'skeleton',
  ZOMBIE = 'zombie',
  SPIDER = 'spider',
  
  // Elite Enemies
  ORC_WARRIOR = 'orc_warrior',
  SKELETON_KNIGHT = 'skeleton_knight',
  DARK_MAGE = 'dark_mage',
  
  // Bosses
  BOSS_GOBLIN_KING = 'boss_goblin_king',
  BOSS_LICH = 'boss_lich',
  BOSS_DRAGON = 'boss_dragon',
  
  // Special
  NPC = 'npc',
  PROJECTILE = 'projectile',
}

/**
 * Animation states for entities
 */
export enum AnimationState {
  IDLE = 'idle',
  WALK = 'walk',
  RUN = 'run',
  ATTACK = 'attack',
  CAST = 'cast',
  HIT = 'hit',
  DEATH = 'death',
  VICTORY = 'victory',
  BLOCK = 'block',
}

/**
 * Particle effect types
 */
export enum ParticleEffectType {
  HIT = 'hit',
  DEATH = 'death',
  ABILITY_FIRE = 'ability_fire',
  ABILITY_ICE = 'ability_ice',
  ABILITY_LIGHTNING = 'ability_lightning',
  ABILITY_POISON = 'ability_poison',
  HEAL = 'heal',
  BUFF = 'buff',
  DEBUFF = 'debuff',
  LEVEL_UP = 'level_up',
}

/**
 * Entity color scheme
 */
export const ENTITY_COLORS: Record<EntityType, number> = {
  [EntityType.PLAYER]: 0x4488ff,
  [EntityType.GOBLIN]: 0x44ff44,
  [EntityType.ORC]: 0xff4444,
  [EntityType.SKELETON]: 0xcccccc,
  [EntityType.ZOMBIE]: 0x668844,
  [EntityType.SPIDER]: 0x442288,
  [EntityType.ORC_WARRIOR]: 0xcc2222,
  [EntityType.SKELETON_KNIGHT]: 0xaaaaaa,
  [EntityType.DARK_MAGE]: 0x8844ff,
  [EntityType.BOSS_GOBLIN_KING]: 0x22cc22,
  [EntityType.BOSS_LICH]: 0xff22ff,
  [EntityType.BOSS_DRAGON]: 0xff8800,
  [EntityType.NPC]: 0xffff88,
  [EntityType.PROJECTILE]: 0xffffff,
};

/**
 * Entity hitbox configuration
 */
export interface EntityHitbox {
  width: number;
  height: number;
  depth: number;
  offsetY: number; // Y offset from entity position
}

/**
 * Complete entity model with mesh, animations, and hitbox
 */
export interface EntityModel {
  mesh: THREE.Group;
  animations: Map<AnimationState, AnimationClip>;
  hitbox: EntityHitbox;
  type: EntityType;
  scale: number;
}

/**
 * Animation clip data
 */
export interface AnimationClip {
  state: AnimationState;
  duration: number; // in seconds
  loop: boolean;
  onComplete?: () => void;
  // Animation keyframes for procedural animation
  keyframes?: AnimationKeyframe[];
}

/**
 * Keyframe for procedural animations
 */
export interface AnimationKeyframe {
  time: number; // 0-1 normalized time
  position?: THREE.Vector3;
  rotation?: THREE.Euler;
  scale?: THREE.Vector3;
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  blendDuration: number; // seconds to blend between animations
  defaultState: AnimationState;
  loopStates: AnimationState[]; // states that should loop
  interruptible: AnimationState[]; // states that can be interrupted
}

/**
 * Particle effect configuration
 */
export interface ParticleEffectConfig {
  type: ParticleEffectType;
  particleCount: number;
  lifetime: number; // seconds
  speed: number;
  spread: number;
  color: THREE.Color;
  size: number;
  gravity: boolean;
  fadeOut: boolean;
}

/**
 * Entity spawn configuration
 */
export interface EntitySpawnConfig {
  type: EntityType;
  position: THREE.Vector3;
  rotation?: number; // Y-axis rotation in radians
  scale?: number;
  animationState?: AnimationState;
}

/**
 * Animation blend state
 */
export interface AnimationBlendState {
  fromState: AnimationState;
  toState: AnimationState;
  progress: number; // 0-1
  duration: number;
}

/**
 * Ragdoll physics state
 */
export interface RagdollState {
  active: boolean;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  fadeProgress: number; // 0-1
}

/**
 * Default animation configuration
 */
export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  blendDuration: 0.2,
  defaultState: AnimationState.IDLE,
  loopStates: [AnimationState.IDLE, AnimationState.WALK, AnimationState.RUN],
  interruptible: [AnimationState.IDLE, AnimationState.WALK, AnimationState.RUN],
};

/**
 * Default hitbox sizes by entity type
 */
export const DEFAULT_HITBOXES: Record<EntityType, EntityHitbox> = {
  [EntityType.PLAYER]: { width: 0.8, height: 1.8, depth: 0.8, offsetY: 0.9 },
  [EntityType.GOBLIN]: { width: 0.6, height: 1.2, depth: 0.6, offsetY: 0.6 },
  [EntityType.ORC]: { width: 1.0, height: 2.0, depth: 1.0, offsetY: 1.0 },
  [EntityType.SKELETON]: { width: 0.7, height: 1.8, depth: 0.7, offsetY: 0.9 },
  [EntityType.ZOMBIE]: { width: 0.8, height: 1.7, depth: 0.8, offsetY: 0.85 },
  [EntityType.SPIDER]: { width: 1.2, height: 0.6, depth: 1.2, offsetY: 0.3 },
  [EntityType.ORC_WARRIOR]: { width: 1.2, height: 2.2, depth: 1.2, offsetY: 1.1 },
  [EntityType.SKELETON_KNIGHT]: { width: 0.9, height: 2.0, depth: 0.9, offsetY: 1.0 },
  [EntityType.DARK_MAGE]: { width: 0.7, height: 1.9, depth: 0.7, offsetY: 0.95 },
  [EntityType.BOSS_GOBLIN_KING]: { width: 1.5, height: 2.5, depth: 1.5, offsetY: 1.25 },
  [EntityType.BOSS_LICH]: { width: 1.0, height: 2.5, depth: 1.0, offsetY: 1.25 },
  [EntityType.BOSS_DRAGON]: { width: 3.0, height: 3.0, depth: 4.0, offsetY: 1.5 },
  [EntityType.NPC]: { width: 0.7, height: 1.8, depth: 0.7, offsetY: 0.9 },
  [EntityType.PROJECTILE]: { width: 0.2, height: 0.2, depth: 0.2, offsetY: 0.1 },
};
