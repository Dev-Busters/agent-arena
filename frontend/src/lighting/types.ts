/**
 * Lighting System Type Definitions
 * Agent Arena 3D Roguelike - P2.6
 */

import * as THREE from 'three';

/**
 * Light type enumeration
 */
export enum LightType {
  POINT = 'point',
  SPOT = 'spot',
  DIRECTIONAL = 'directional',
  AMBIENT = 'ambient',
  HEMISPHERE = 'hemisphere',
}

/**
 * Shadow quality levels
 */
export enum ShadowQuality {
  LOW = 'low',       // 512x512
  MEDIUM = 'medium', // 1024x1024
  HIGH = 'high',     // 2048x2048
  ULTRA = 'ultra',   // 4096x4096
}

/**
 * Room types for lighting presets
 */
export enum RoomType {
  ENTRANCE = 'entrance',
  TREASURE = 'treasure',
  COMBAT = 'combat',
  BOSS = 'boss',
  EXIT = 'exit',
  CORRIDOR = 'corridor',
}

/**
 * Light animation types
 */
export enum AnimationType {
  FLICKER = 'flicker',
  PULSE = 'pulse',
  STROBE = 'strobe',
  RAINBOW = 'rainbow',
  NONE = 'none',
}

/**
 * Base light configuration
 */
export interface LightConfig {
  type: LightType;
  color: THREE.Color | string | number;
  intensity: number;
  distance?: number;
  decay?: number;
  castShadow?: boolean;
  position?: THREE.Vector3;
  target?: THREE.Vector3;
  angle?: number; // For spot lights
  penumbra?: number; // For spot lights
}

/**
 * Torch-specific configuration
 */
export interface TorchConfig extends Omit<LightConfig, 'type'> {
  flickerSpeed?: number;
  flickerIntensity?: number;
  enableParticles?: boolean;
  warmth?: number; // 0-1, affects color temperature
}

/**
 * Light animation configuration
 */
export interface LightAnimationConfig {
  type: AnimationType;
  speed?: number;
  intensity?: number;
  minIntensity?: number;
  maxIntensity?: number;
  colorRange?: THREE.Color[];
  enabled?: boolean;
}

/**
 * Shadow configuration
 */
export interface ShadowConfig {
  quality: ShadowQuality;
  bias?: number;
  normalBias?: number;
  radius?: number;
  near?: number;
  far?: number;
  enabled?: boolean;
}

/**
 * Room lighting configuration
 */
export interface RoomLightingConfig {
  roomType: RoomType;
  ambientLight: {
    color: THREE.Color | string | number;
    intensity: number;
  };
  torches: TorchConfig[];
  accentLights: LightConfig[];
  shadows: ShadowConfig;
  ceilingLights?: LightConfig[];
}

/**
 * Light pool configuration
 */
export interface LightPoolConfig {
  pointLightCount?: number;
  spotLightCount?: number;
  maxLights?: number;
  enableShadows?: boolean;
  shadowQuality?: ShadowQuality;
}

/**
 * Light pool statistics
 */
export interface LightPoolStats {
  totalLights: number;
  activeLights: number;
  availableLights: number;
  pointLights: {
    total: number;
    active: number;
  };
  spotLights: {
    total: number;
    active: number;
  };
}

/**
 * Lightmap baking configuration
 */
export interface LightmapConfig {
  resolution: number;
  samples: number;
  blur?: number;
  indirect?: boolean;
  bounces?: number;
}

/**
 * Pooled light wrapper
 */
export interface PooledLight {
  light: THREE.PointLight | THREE.SpotLight;
  active: boolean;
  id: string;
  type: LightType.POINT | LightType.SPOT;
}

/**
 * Light instance with animation
 */
export interface AnimatedLight {
  light: THREE.Light;
  animation?: LightAnimationConfig;
  baseIntensity: number;
  baseColor: THREE.Color;
  time: number;
}
