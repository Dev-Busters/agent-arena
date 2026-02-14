/**
 * React Hooks for Lighting System
 * Agent Arena 3D Roguelike - P2.6
 */

import { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { LightPool } from './lightPool';
import { TorchLight } from './torches';
import { ShadowManager } from './shadows';
import { RoomLightingManager } from './roomLighting';
import { LightAnimator, AnimationPresets } from './animations';
import {
  LightPoolConfig,
  TorchConfig,
  RoomType,
  ShadowQuality,
  AnimationType,
  LightAnimationConfig,
} from './types';

/**
 * Hook to create and manage a light pool
 */
export function useLightPool(
  scene: THREE.Scene | null,
  config?: LightPoolConfig
) {
  const lightPoolRef = useRef<LightPool | null>(null);

  useEffect(() => {
    if (!scene) return;

    // Create light pool
    lightPoolRef.current = new LightPool(scene, config);

    return () => {
      // Cleanup on unmount
      lightPoolRef.current?.dispose();
      lightPoolRef.current = null;
    };
  }, [scene, config]);

  return lightPoolRef.current;
}

/**
 * Hook to create and manage a torch light
 */
export function useTorchLight(
  scene: THREE.Scene | null,
  position: THREE.Vector3,
  config?: Partial<TorchConfig>
) {
  const torchRef = useRef<TorchLight | null>(null);

  useEffect(() => {
    if (!scene) return;

    // Create torch
    const torch = new TorchLight({
      ...config,
      position,
    });

    scene.add(torch.light);
    torchRef.current = torch;

    return () => {
      // Cleanup on unmount
      if (torchRef.current) {
        scene.remove(torchRef.current.light);
        torchRef.current.dispose();
        torchRef.current = null;
      }
    };
  }, [scene, position, config]);

  // Update animation
  useEffect(() => {
    if (!torchRef.current) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = () => {
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      torchRef.current?.update(deltaTime);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return torchRef.current;
}

/**
 * Hook to manage room lighting
 */
export function useRoomLighting(
  scene: THREE.Scene | null,
  lightPool: LightPool | null,
  roomType: RoomType,
  roomSize?: { width: number; depth: number }
) {
  const managerRef = useRef<RoomLightingManager | null>(null);

  useEffect(() => {
    if (!scene || !lightPool) return;

    // Create room lighting manager
    managerRef.current = new RoomLightingManager(scene, lightPool);
    managerRef.current.createRoomLights(roomType, roomSize);

    return () => {
      // Cleanup on unmount
      managerRef.current?.dispose();
      managerRef.current = null;
    };
  }, [scene, lightPool, roomType, roomSize]);

  // Update animation
  useEffect(() => {
    if (!managerRef.current) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = () => {
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      managerRef.current?.update(deltaTime);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return managerRef.current;
}

/**
 * Hook to manage light animations
 */
export function useLightAnimation(
  light: THREE.Light | null,
  animationType: AnimationType | keyof typeof AnimationPresets,
  customConfig?: Partial<LightAnimationConfig>
) {
  const animatorRef = useRef<LightAnimator | null>(null);
  const lightIdRef = useRef<string | null>(null);

  // Initialize animator
  useEffect(() => {
    if (!animatorRef.current) {
      animatorRef.current = new LightAnimator();
    }

    return () => {
      animatorRef.current?.dispose();
      animatorRef.current = null;
    };
  }, []);

  // Add light to animator
  useEffect(() => {
    if (!light || !animatorRef.current) return;

    // Get animation config
    let animationConfig: LightAnimationConfig;
    
    if (typeof animationType === 'string' && animationType in AnimationPresets) {
      animationConfig = { 
        ...AnimationPresets[animationType as keyof typeof AnimationPresets],
        ...customConfig 
      };
    } else {
      animationConfig = {
        type: animationType as AnimationType,
        enabled: true,
        ...customConfig,
      };
    }

    // Add light with animation
    lightIdRef.current = animatorRef.current.addLight(light, animationConfig);

    return () => {
      if (lightIdRef.current && animatorRef.current) {
        animatorRef.current.removeLight(lightIdRef.current);
        lightIdRef.current = null;
      }
    };
  }, [light, animationType, customConfig]);

  // Update animation
  useEffect(() => {
    if (!animatorRef.current) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = () => {
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      animatorRef.current?.update(deltaTime);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return animatorRef.current;
}

/**
 * Hook to manage shadow quality
 */
export function useShadowQuality(
  renderer: THREE.WebGLRenderer | null,
  quality: ShadowQuality = ShadowQuality.MEDIUM
) {
  const shadowManagerRef = useRef<ShadowManager | null>(null);

  useEffect(() => {
    if (!renderer) return;

    // Create shadow manager
    shadowManagerRef.current = new ShadowManager(renderer, quality);

    return () => {
      shadowManagerRef.current = null;
    };
  }, [renderer, quality]);

  return shadowManagerRef.current;
}

/**
 * Hook to configure shadows on a light
 */
export function useLightShadow(
  light: THREE.Light | null,
  shadowManager: ShadowManager | null,
  enabled: boolean = true,
  quality?: ShadowQuality
) {
  useEffect(() => {
    if (!light || !shadowManager) return;

    shadowManager.configureLightShadow(light, {
      enabled,
      quality: quality ?? ShadowQuality.MEDIUM,
    });
  }, [light, shadowManager, enabled, quality]);
}

/**
 * Hook to create multiple torches from positions
 */
export function useTorches(
  scene: THREE.Scene | null,
  positions: THREE.Vector3[],
  config?: Partial<TorchConfig>
) {
  const torchesRef = useRef<TorchLight[]>([]);

  useEffect(() => {
    if (!scene) return;

    // Create torches
    torchesRef.current = positions.map(position => {
      const torch = new TorchLight({
        ...config,
        position,
      });
      scene.add(torch.light);
      return torch;
    });

    return () => {
      // Cleanup on unmount
      torchesRef.current.forEach(torch => {
        scene.remove(torch.light);
        torch.dispose();
      });
      torchesRef.current = [];
    };
  }, [scene, positions, config]);

  // Update animations
  useEffect(() => {
    if (torchesRef.current.length === 0) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = () => {
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      torchesRef.current.forEach(torch => torch.update(deltaTime));
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return torchesRef.current;
}

/**
 * Hook to get light pool statistics
 */
export function useLightPoolStats(lightPool: LightPool | null) {
  const stats = useMemo(() => {
    return lightPool?.getStats() ?? null;
  }, [lightPool]);

  return stats;
}
