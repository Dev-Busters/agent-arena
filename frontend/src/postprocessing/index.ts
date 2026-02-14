/**
 * Post-Processing & Effects - Main Export
 * Agent Arena 3D Roguelike - P2.5
 */

// Core Composer
export { PostProcessingComposer } from './composer';

// Individual Effects
export { BloomEffect, createRarityBloom } from './bloom';
export { DepthOfFieldEffect, createCinematicDOF } from './depthOfField';
export { MotionBlurEffect } from './motionBlur';
export { FilmGrainEffect, createRetroGrain } from './filmGrain';
export { ChromaticAberrationEffect, createDamageAberration } from './chromaticAberration';

// React Hooks
export {
  usePostProcessing,
  useBloom,
  useEffectPreset,
  usePerformanceMode,
  useDamageEffect,
  useDepthOfField,
  useEffectToggles,
} from './usePostProcessing';

// Types
export type {
  PostProcessingConfig,
  BloomConfig,
  DepthOfFieldConfig,
  MotionBlurConfig,
  FilmGrainConfig,
  ChromaticAberrationConfig,
  EffectPreset,
  EffectPresetConfig,
  EffectState,
} from './types';

// Constants
export { EFFECT_PRESETS } from './types';
