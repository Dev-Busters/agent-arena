/**
 * Post-Processing Type Definitions
 * Agent Arena 3D Roguelike - P2.5
 */

import * as THREE from 'three';

/**
 * Bloom effect configuration
 */
export interface BloomConfig {
  /** Bloom strength/intensity (0-3, default: 1.5) */
  strength: number;
  /** Luminance threshold for bloom (0-1, default: 0.85) */
  threshold: number;
  /** Bloom radius/spread (0-1, default: 0.4) */
  radius: number;
  /** Enable HDR bloom rendering */
  hdr?: boolean;
  /** Adaptive resolution for performance (0.5-1.0, default: 1.0) */
  resolution?: number;
}

/**
 * Depth of Field effect configuration
 */
export interface DepthOfFieldConfig {
  /** Focus distance from camera (world units, default: 10) */
  focusDistance: number;
  /** Aperture size - lower = more blur (f-stop, 1-22, default: 5.6) */
  aperture: number;
  /** Maximum blur amount (0-1, default: 0.01) */
  maxBlur?: number;
  /** Auto-focus on target object */
  autoFocus?: boolean;
  /** Target object for auto-focus */
  focusTarget?: THREE.Object3D;
}

/**
 * Motion blur effect configuration
 */
export interface MotionBlurConfig {
  /** Blur intensity multiplier (0-1, default: 0.5) */
  intensity: number;
  /** Number of blur samples (2-32, default: 8) */
  samples: number;
  /** Velocity threshold to trigger blur (default: 0.1) */
  velocityThreshold?: number;
  /** Enable velocity-based adaptive blur */
  velocityBased?: boolean;
}

/**
 * Film grain effect configuration
 */
export interface FilmGrainConfig {
  /** Grain intensity (0-1, default: 0.35) */
  intensity: number;
  /** Animate grain every frame */
  animated: boolean;
  /** Enable vignette effect */
  vignette?: boolean;
  /** Vignette intensity (0-1, default: 0.5) */
  vignetteIntensity?: number;
  /** Grain size multiplier (default: 1.0) */
  scale?: number;
}

/**
 * Chromatic aberration effect configuration
 */
export interface ChromaticAberrationConfig {
  /** RGB channel offset amount (0-0.1, default: 0.002) */
  offset: number;
  /** Enable radial distortion from center */
  radial?: boolean;
  /** Radial strength multiplier (default: 1.0) */
  radialStrength?: number;
  /** Maximum offset at screen edges (default: 0.005) */
  maxOffset?: number;
}

/**
 * Complete post-processing configuration
 */
export interface PostProcessingConfig {
  /** Enable post-processing system */
  enabled: boolean;
  /** Bloom effect config */
  bloom?: BloomConfig;
  /** Depth of field config */
  depthOfField?: DepthOfFieldConfig;
  /** Motion blur config */
  motionBlur?: MotionBlurConfig;
  /** Film grain config */
  filmGrain?: FilmGrainConfig;
  /** Chromatic aberration config */
  chromaticAberration?: ChromaticAberrationConfig;
  /** Performance mode - reduces quality for FPS */
  performanceMode?: boolean;
  /** Target FPS for adaptive quality (default: 60) */
  targetFPS?: number;
}

/**
 * Effect presets for different gameplay scenarios
 */
export type EffectPreset = 'cinematic' | 'combat' | 'exploration' | 'minimal' | 'quality';

/**
 * Preset configurations
 */
export interface EffectPresetConfig {
  name: EffectPreset;
  description: string;
  config: PostProcessingConfig;
}

/**
 * Default configurations for each preset
 */
export const EFFECT_PRESETS: Record<EffectPreset, PostProcessingConfig> = {
  cinematic: {
    enabled: true,
    bloom: {
      strength: 2.0,
      threshold: 0.8,
      radius: 0.5,
      hdr: true,
      resolution: 1.0,
    },
    depthOfField: {
      focusDistance: 10,
      aperture: 2.8,
      maxBlur: 0.015,
      autoFocus: true,
    },
    motionBlur: {
      intensity: 0.7,
      samples: 12,
      velocityBased: true,
    },
    filmGrain: {
      intensity: 0.25,
      animated: true,
      vignette: true,
      vignetteIntensity: 0.4,
    },
    chromaticAberration: {
      offset: 0.001,
      radial: true,
      radialStrength: 0.8,
    },
    performanceMode: false,
    targetFPS: 60,
  },
  combat: {
    enabled: true,
    bloom: {
      strength: 1.8,
      threshold: 0.85,
      radius: 0.35,
      hdr: true,
      resolution: 0.85,
    },
    motionBlur: {
      intensity: 0.6,
      samples: 8,
      velocityBased: true,
      velocityThreshold: 0.2,
    },
    filmGrain: {
      intensity: 0.15,
      animated: true,
      vignette: false,
    },
    chromaticAberration: {
      offset: 0.003,
      radial: true,
      radialStrength: 1.2,
      maxOffset: 0.008,
    },
    performanceMode: false,
    targetFPS: 60,
  },
  exploration: {
    enabled: true,
    bloom: {
      strength: 1.2,
      threshold: 0.9,
      radius: 0.4,
      hdr: true,
      resolution: 1.0,
    },
    depthOfField: {
      focusDistance: 15,
      aperture: 8.0,
      maxBlur: 0.008,
      autoFocus: false,
    },
    filmGrain: {
      intensity: 0.3,
      animated: true,
      vignette: true,
      vignetteIntensity: 0.3,
      scale: 1.2,
    },
    performanceMode: false,
    targetFPS: 60,
  },
  minimal: {
    enabled: true,
    bloom: {
      strength: 0.8,
      threshold: 0.95,
      radius: 0.3,
      resolution: 0.75,
    },
    filmGrain: {
      intensity: 0.1,
      animated: false,
    },
    performanceMode: true,
    targetFPS: 60,
  },
  quality: {
    enabled: true,
    bloom: {
      strength: 2.5,
      threshold: 0.75,
      radius: 0.6,
      hdr: true,
      resolution: 1.0,
    },
    depthOfField: {
      focusDistance: 10,
      aperture: 1.8,
      maxBlur: 0.02,
      autoFocus: true,
    },
    motionBlur: {
      intensity: 0.8,
      samples: 16,
      velocityBased: true,
    },
    filmGrain: {
      intensity: 0.4,
      animated: true,
      vignette: true,
      vignetteIntensity: 0.5,
    },
    chromaticAberration: {
      offset: 0.0015,
      radial: true,
      radialStrength: 1.0,
    },
    performanceMode: false,
    targetFPS: 45,
  },
};

/**
 * Effect state for runtime management
 */
export interface EffectState {
  enabled: boolean;
  initialized: boolean;
  lastUpdateTime: number;
  fps: number;
}
