/**
 * Shader type definitions for Agent Arena
 * Provides type safety for shader configurations, materials, and effects
 */

import * as THREE from 'three';

/**
 * Rarity tiers for items (8 tiers total)
 */
export enum Rarity {
  Common = 'common',
  Uncommon = 'uncommon',
  Rare = 'rare',
  Epic = 'epic',
  Legendary = 'legendary',
  Mythic = 'mythic',
  Ancient = 'ancient',
  Divine = 'divine',
}

/**
 * Status effects that can be applied to entities
 */
export enum StatusEffect {
  Frozen = 'frozen',
  Burning = 'burning',
  Poisoned = 'poisoned',
  Stunned = 'stunned',
  Blessed = 'blessed',
}

/**
 * Configuration for rarity glow effects
 */
export interface RarityGlowConfig {
  /** Glow color as THREE.Color or hex string */
  color: THREE.Color | string;
  /** Glow intensity (0-1, typically 0.3-0.8) */
  intensity: number;
  /** Animation speed multiplier (0.5-2.0) */
  speed: number;
  /** Pulse range (min-max intensity during animation) */
  pulseRange?: [number, number];
  /** Enable bloom post-processing optimization */
  bloomOptimized?: boolean;
}

/**
 * Rarity to color mapping
 */
export const RARITY_COLORS: Record<Rarity, string> = {
  [Rarity.Common]: '#ffffff',      // White
  [Rarity.Uncommon]: '#00ff00',    // Green
  [Rarity.Rare]: '#0080ff',        // Blue
  [Rarity.Epic]: '#8000ff',        // Purple
  [Rarity.Legendary]: '#ff8000',   // Orange
  [Rarity.Mythic]: '#ff0080',      // Pink
  [Rarity.Ancient]: '#ffff00',     // Yellow
  [Rarity.Divine]: '#ffd700',      // Gold
};

/**
 * Default glow configurations per rarity
 */
export const RARITY_GLOW_DEFAULTS: Record<Rarity, RarityGlowConfig> = {
  [Rarity.Common]: { color: RARITY_COLORS.common, intensity: 0.2, speed: 0.5 },
  [Rarity.Uncommon]: { color: RARITY_COLORS.uncommon, intensity: 0.3, speed: 0.7 },
  [Rarity.Rare]: { color: RARITY_COLORS.rare, intensity: 0.4, speed: 0.9 },
  [Rarity.Epic]: { color: RARITY_COLORS.epic, intensity: 0.5, speed: 1.1 },
  [Rarity.Legendary]: { color: RARITY_COLORS.legendary, intensity: 0.6, speed: 1.3 },
  [Rarity.Mythic]: { color: RARITY_COLORS.mythic, intensity: 0.7, speed: 1.5 },
  [Rarity.Ancient]: { color: RARITY_COLORS.ancient, intensity: 0.75, speed: 1.7 },
  [Rarity.Divine]: { color: RARITY_COLORS.divine, intensity: 0.8, speed: 2.0 },
};

/**
 * Configuration for status effect shaders
 */
export interface StatusEffectShaderConfig {
  /** Effect type */
  type: StatusEffect;
  /** Effect color */
  color: THREE.Color | string;
  /** Effect intensity (0-1) */
  intensity: number;
  /** Animation speed */
  speed: number;
  /** Effect-specific parameters */
  params?: Record<string, number>;
}

/**
 * Shader uniform types
 */
export interface ShaderUniforms {
  /** Current time in seconds */
  time: { value: number };
  /** Glow color */
  glowColor?: { value: THREE.Color };
  /** Glow intensity */
  glowIntensity?: { value: number };
  /** Animation speed */
  speed?: { value: number };
  /** Effect-specific parameters */
  [key: string]: { value: any } | undefined;
}

/**
 * General shader configuration
 */
export interface ShaderConfig {
  /** Vertex shader source */
  vertexShader: string;
  /** Fragment shader source */
  fragmentShader: string;
  /** Shader uniforms */
  uniforms: ShaderUniforms;
  /** Enable transparency */
  transparent?: boolean;
  /** Blending mode */
  blending?: THREE.Blending;
  /** Depth write */
  depthWrite?: boolean;
  /** Depth test */
  depthTest?: boolean;
}

/**
 * PBR material types
 */
export enum MaterialType {
  Metal = 'metal',
  Stone = 'stone',
  Leather = 'leather',
  Cloth = 'cloth',
  Wood = 'wood',
  Crystal = 'crystal',
}

/**
 * Configuration for PBR materials
 */
export interface MaterialConfig {
  /** Material type */
  type: MaterialType;
  /** Base color */
  color?: THREE.Color | string;
  /** Metalness (0-1, higher for metals) */
  metalness?: number;
  /** Roughness (0-1, lower for smooth surfaces) */
  roughness?: number;
  /** Normal map strength (0-2) */
  normalScale?: number;
  /** Enable procedural normal map */
  proceduralNormal?: boolean;
  /** Normal map detail level */
  normalDetail?: number;
  /** Environment map intensity */
  envMapIntensity?: number;
}

/**
 * Default material presets
 */
export const MATERIAL_PRESETS: Record<MaterialType, Partial<MaterialConfig>> = {
  [MaterialType.Metal]: {
    metalness: 0.9,
    roughness: 0.3,
    normalScale: 1.5,
    envMapIntensity: 1.2,
  },
  [MaterialType.Stone]: {
    metalness: 0.0,
    roughness: 0.8,
    normalScale: 1.2,
    envMapIntensity: 0.5,
    proceduralNormal: true,
    normalDetail: 2.0,
  },
  [MaterialType.Leather]: {
    metalness: 0.0,
    roughness: 0.6,
    normalScale: 0.8,
    envMapIntensity: 0.3,
    proceduralNormal: true,
    normalDetail: 1.5,
  },
  [MaterialType.Cloth]: {
    metalness: 0.0,
    roughness: 0.9,
    normalScale: 0.5,
    envMapIntensity: 0.2,
    proceduralNormal: true,
    normalDetail: 3.0,
  },
  [MaterialType.Wood]: {
    metalness: 0.0,
    roughness: 0.7,
    normalScale: 1.0,
    envMapIntensity: 0.4,
    proceduralNormal: true,
    normalDetail: 2.5,
  },
  [MaterialType.Crystal]: {
    metalness: 0.1,
    roughness: 0.1,
    normalScale: 1.8,
    envMapIntensity: 1.5,
  },
};

/**
 * Active status effects on an entity
 */
export interface ActiveStatusEffects {
  effects: StatusEffect[];
  configs: Map<StatusEffect, StatusEffectShaderConfig>;
}
