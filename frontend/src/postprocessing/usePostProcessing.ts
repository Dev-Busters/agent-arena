/**
 * React Hooks for Post-Processing
 * Agent Arena 3D Roguelike - P2.5
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { PostProcessingComposer } from './composer';
import type { PostProcessingConfig, EffectPreset, BloomConfig } from './types';
import { EFFECT_PRESETS } from './types';

/**
 * Main hook for post-processing setup
 */
export function usePostProcessing(
  renderer: THREE.WebGLRenderer | null,
  scene: THREE.Scene | null,
  camera: THREE.Camera | null,
  config: PostProcessingConfig
) {
  const composerRef = useRef<PostProcessingComposer | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [averageFPS, setAverageFPS] = useState(60);

  // Initialize composer
  useEffect(() => {
    if (!renderer || !scene || !camera) {
      return;
    }

    // Create composer
    const composer = new PostProcessingComposer(renderer, scene, camera, config);
    composerRef.current = composer;
    setIsInitialized(true);

    // Cleanup on unmount
    return () => {
      composer.dispose();
      composerRef.current = null;
      setIsInitialized(false);
    };
  }, [renderer, scene, camera]);

  // Update config when it changes
  useEffect(() => {
    if (composerRef.current) {
      composerRef.current.updateConfig(config);
    }
  }, [config]);

  // Render function
  const render = useCallback((deltaTime?: number) => {
    if (composerRef.current) {
      composerRef.current.render(deltaTime);
      
      // Update FPS every second
      if (Math.random() < 0.016) { // ~60 FPS = ~1.6% chance per frame = ~1/sec
        setAverageFPS(composerRef.current.getAverageFPS());
      }
    }
  }, []);

  // Resize handler
  const resize = useCallback((width: number, height: number) => {
    if (composerRef.current) {
      composerRef.current.resize(width, height);
    }
  }, []);

  // Get effect instances
  const getEffects = useCallback(() => {
    return composerRef.current?.getEffects() || {};
  }, []);

  return {
    composer: composerRef.current,
    isInitialized,
    render,
    resize,
    getEffects,
    averageFPS,
  };
}

/**
 * Hook for bloom effect control
 */
export function useBloom(
  composer: PostProcessingComposer | null,
  config?: Partial<BloomConfig>
) {
  const [bloomConfig, setBloomConfig] = useState<Partial<BloomConfig>>(config || {});

  // Update bloom config
  useEffect(() => {
    if (composer && bloomConfig) {
      composer.updateConfig({ bloom: bloomConfig as BloomConfig });
    }
  }, [composer, bloomConfig]);

  // Trigger bloom pulse
  const pulse = useCallback((duration?: number, peakStrength?: number) => {
    const effects = composer?.getEffects();
    if (effects?.bloom) {
      effects.bloom.pulse(duration, peakStrength);
    }
  }, [composer]);

  // Update bloom configuration
  const updateBloom = useCallback((newConfig: Partial<BloomConfig>) => {
    setBloomConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  return {
    bloomConfig,
    updateBloom,
    pulse,
  };
}

/**
 * Hook for applying effect presets
 */
export function useEffectPreset(
  composer: PostProcessingComposer | null,
  initialPreset: EffectPreset = 'exploration'
) {
  const [currentPreset, setCurrentPreset] = useState<EffectPreset>(initialPreset);

  // Apply preset when it changes
  useEffect(() => {
    if (composer) {
      composer.applyPreset(currentPreset);
    }
  }, [composer, currentPreset]);

  // Change preset
  const applyPreset = useCallback((preset: EffectPreset) => {
    setCurrentPreset(preset);
  }, []);

  // Get available presets
  const getPresets = useCallback(() => {
    return Object.keys(EFFECT_PRESETS) as EffectPreset[];
  }, []);

  return {
    currentPreset,
    applyPreset,
    getPresets,
    presetConfig: EFFECT_PRESETS[currentPreset],
  };
}

/**
 * Hook for performance mode control
 */
export function usePerformanceMode(
  composer: PostProcessingComposer | null,
  autoEnable: boolean = true,
  fpsThreshold: number = 45
) {
  const [performanceMode, setPerformanceMode] = useState(false);
  const [fps, setFps] = useState(60);

  // Monitor FPS and auto-enable performance mode
  useEffect(() => {
    if (!composer || !autoEnable) return;

    const interval = setInterval(() => {
      const avgFPS = composer.getAverageFPS();
      setFps(avgFPS);

      if (avgFPS < fpsThreshold && !performanceMode) {
        setPerformanceMode(true);
        composer.setPerformanceMode(true);
      } else if (avgFPS > fpsThreshold * 1.2 && performanceMode) {
        setPerformanceMode(false);
        composer.setPerformanceMode(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [composer, autoEnable, fpsThreshold, performanceMode]);

  // Manual toggle
  const togglePerformanceMode = useCallback(() => {
    if (composer) {
      const newMode = !performanceMode;
      setPerformanceMode(newMode);
      composer.setPerformanceMode(newMode);
    }
  }, [composer, performanceMode]);

  return {
    performanceMode,
    togglePerformanceMode,
    fps,
  };
}

/**
 * Hook for chromatic aberration damage effects
 */
export function useDamageEffect(composer: PostProcessingComposer | null) {
  const triggerDamage = useCallback((severity: 'light' | 'medium' | 'heavy' = 'medium') => {
    const effects = composer?.getEffects();
    if (!effects?.chromaticAberration) return;

    const durations = { light: 100, medium: 150, heavy: 250 };
    const offsets = { light: 0.01, medium: 0.015, heavy: 0.025 };

    effects.chromaticAberration.damageFlash(durations[severity], offsets[severity]);
  }, [composer]);

  const triggerImpact = useCallback(() => {
    const effects = composer?.getEffects();
    if (effects?.chromaticAberration) {
      effects.chromaticAberration.impactEffect();
    }

    // Also trigger motion blur for impact
    if (effects?.motionBlur) {
      effects.motionBlur.impactBlur();
    }
  }, [composer]);

  return {
    triggerDamage,
    triggerImpact,
  };
}

/**
 * Hook for depth of field control
 */
export function useDepthOfField(composer: PostProcessingComposer | null) {
  const setFocusTarget = useCallback((target: THREE.Object3D | undefined) => {
    const effects = composer?.getEffects();
    if (effects?.depthOfField) {
      effects.depthOfField.setFocusTarget(target);
    }
  }, [composer]);

  const focusOn = useCallback((distance: number, duration?: number) => {
    const effects = composer?.getEffects();
    if (effects?.depthOfField) {
      if (duration) {
        effects.depthOfField.focusTransition(distance, duration);
      } else {
        effects.depthOfField.setFocusDistance(distance);
      }
    }
  }, [composer]);

  const setAperture = useCallback((fStop: number) => {
    const effects = composer?.getEffects();
    if (effects?.depthOfField) {
      effects.depthOfField.setAperture(fStop);
    }
  }, [composer]);

  return {
    setFocusTarget,
    focusOn,
    setAperture,
  };
}

/**
 * Hook for individual effect toggles
 */
export function useEffectToggles(composer: PostProcessingComposer | null) {
  const [enabledEffects, setEnabledEffects] = useState({
    bloom: true,
    depthOfField: true,
    motionBlur: true,
    filmGrain: true,
    chromaticAberration: true,
  });

  const toggleEffect = useCallback((
    effect: 'bloom' | 'dof' | 'motionBlur' | 'filmGrain' | 'ca'
  ) => {
    if (!composer) return;

    const effectMap = {
      bloom: 'bloom',
      dof: 'depthOfField',
      motionBlur: 'motionBlur',
      filmGrain: 'filmGrain',
      ca: 'chromaticAberration',
    } as const;

    const key = effectMap[effect];
    const newState = !enabledEffects[key as keyof typeof enabledEffects];

    setEnabledEffects((prev) => ({
      ...prev,
      [key]: newState,
    }));

    composer.setEffectEnabled(effect, newState);
  }, [composer, enabledEffects]);

  return {
    enabledEffects,
    toggleEffect,
  };
}
