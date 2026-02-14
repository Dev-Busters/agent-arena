/**
 * React hooks for materials in Agent Arena
 * Simplified material management with automatic disposal
 */

import { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Rarity, RarityGlowConfig, MaterialConfig, StatusEffect } from './types';
import { createRarityGlowMaterial, getGlowMaterial } from './rarityGlow';
import { pbrFactory } from './pbr';
import { statusEffectManager, createStatusEffectMaterial } from './statusEffects';

/**
 * Hook for creating and managing a PBR material
 * Automatically disposes material on unmount
 */
export function usePBRMaterial(config: MaterialConfig): THREE.MeshStandardMaterial {
  const material = useMemo(() => {
    return pbrFactory.create(config);
  }, [JSON.stringify(config)]);

  // Dispose on unmount
  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  return material;
}

/**
 * Hook for applying rarity glow to an item
 * Returns both base material and glow material
 */
export function useRarityGlow(
  rarity: Rarity,
  customConfig?: Partial<RarityGlowConfig>
): {
  glowMaterial: THREE.ShaderMaterial;
  updateGlow: (deltaTime: number) => void;
} {
  const glowMaterial = useMemo(() => {
    return createRarityGlowMaterial(rarity, customConfig);
  }, [rarity, JSON.stringify(customConfig)]);

  // Auto-update glow animation
  useFrame((state, delta) => {
    if (glowMaterial.uniforms.time) {
      glowMaterial.uniforms.time.value += delta;
    }
  });

  // Dispose on unmount
  useEffect(() => {
    return () => {
      glowMaterial.dispose();
    };
  }, [glowMaterial]);

  const updateGlow = (deltaTime: number) => {
    if (glowMaterial.uniforms.time) {
      glowMaterial.uniforms.time.value += deltaTime;
    }
  };

  return { glowMaterial, updateGlow };
}

/**
 * Hook for managing status effects on an entity
 * Returns effect overlay meshes and control functions
 */
export function useStatusEffect(
  entityId: string,
  geometry: THREE.BufferGeometry
): {
  activeEffects: StatusEffect[];
  addEffect: (effect: StatusEffect, intensity?: number) => void;
  removeEffect: (effect: StatusEffect) => void;
  clearEffects: () => void;
  effectMeshes: THREE.Mesh[];
} {
  const effectMeshesRef = useRef<THREE.Mesh[]>([]);
  const geometryRef = useRef(geometry);

  // Update geometry reference
  useEffect(() => {
    geometryRef.current = geometry;
  }, [geometry]);

  // Get active effects
  const activeEffects = statusEffectManager.getEffects(entityId);

  // Add effect
  const addEffect = (effect: StatusEffect, intensity: number = 1.0) => {
    statusEffectManager.addEffect(entityId, effect, { intensity });
    updateEffectMeshes();
  };

  // Remove effect
  const removeEffect = (effect: StatusEffect) => {
    statusEffectManager.removeEffect(entityId, effect);
    updateEffectMeshes();
  };

  // Clear all effects
  const clearEffects = () => {
    statusEffectManager.clearEffects(entityId);
    disposeEffectMeshes();
  };

  // Update effect meshes
  const updateEffectMeshes = () => {
    // Dispose old meshes
    disposeEffectMeshes();

    // Create new meshes
    effectMeshesRef.current = statusEffectManager.createEffectOverlays(
      entityId,
      geometryRef.current
    );
  };

  // Dispose effect meshes
  const disposeEffectMeshes = () => {
    effectMeshesRef.current.forEach((mesh) => {
      const material = (mesh as any).effectMaterial as THREE.ShaderMaterial;
      if (material) {
        material.dispose();
      }
      mesh.geometry.dispose();
    });
    effectMeshesRef.current = [];
  };

  // Auto-update effect animations
  useFrame((state, delta) => {
    effectMeshesRef.current.forEach((mesh) => {
      statusEffectManager.updateEffectMesh(mesh, delta);
    });
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearEffects();
    };
  }, [entityId]);

  // Regenerate meshes when active effects change
  useEffect(() => {
    updateEffectMeshes();
  }, [activeEffects.length, entityId]);

  return {
    activeEffects,
    addEffect,
    removeEffect,
    clearEffects,
    effectMeshes: effectMeshesRef.current,
  };
}

/**
 * Hook for creating a complete item with PBR material and rarity glow
 */
export function useItemMaterial(
  rarity: Rarity,
  materialConfig: MaterialConfig,
  glowConfig?: Partial<RarityGlowConfig>
): {
  baseMaterial: THREE.MeshStandardMaterial;
  glowMaterial: THREE.ShaderMaterial;
} {
  const baseMaterial = usePBRMaterial(materialConfig);
  const { glowMaterial } = useRarityGlow(rarity, glowConfig);

  return { baseMaterial, glowMaterial };
}

/**
 * Hook for environment map management
 */
export function useEnvironmentMap(envMapUrl?: string): THREE.Texture | null {
  const [envMap, setEnvMap] = React.useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!envMapUrl) return;

    const loader = new THREE.TextureLoader();
    loader.load(envMapUrl, (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      setEnvMap(texture);
      pbrFactory.setEnvironmentMap(texture);
    });

    return () => {
      if (envMap) {
        envMap.dispose();
      }
    };
  }, [envMapUrl]);

  return envMap;
}

/**
 * Hook for batch material updates (performance optimization)
 */
export function useMaterialBatch(materials: THREE.Material[]): void {
  useEffect(() => {
    // Mark all materials for update
    materials.forEach((material) => {
      material.needsUpdate = true;
    });
  }, [materials]);

  // Dispose all materials on unmount
  useEffect(() => {
    return () => {
      materials.forEach((material) => {
        material.dispose();
      });
    };
  }, []);
}

/**
 * Performance monitoring hook for shaders
 */
export function useShaderPerformance(): {
  glowMaterialCount: number;
  statusEffectCount: number;
} {
  const [stats, setStats] = React.useState({
    glowMaterialCount: 0,
    statusEffectCount: 0,
  });

  useFrame(() => {
    const effectStats = statusEffectManager.stats;
    setStats({
      glowMaterialCount: 0, // Would need to track this globally
      statusEffectCount: effectStats.totalActiveEffects,
    });
  });

  return stats;
}

// Re-export React for environments where it's not globally available
import * as React from 'react';
