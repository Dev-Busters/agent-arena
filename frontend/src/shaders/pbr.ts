/**
 * Physically-Based Rendering materials for Agent Arena
 * Factory for creating optimized PBR materials for different surface types
 */

import * as THREE from 'three';
import { MaterialType, MaterialConfig, MATERIAL_PRESETS } from './types';
import { generateProceduralNormalMap, normalMapCache, NORMAL_MAP_PRESETS } from './normalMaps';

/**
 * PBR Material Factory
 * Creates and manages PBR materials for various game assets
 */
export class PBRMaterialFactory {
  private materialCache: Map<string, THREE.MeshStandardMaterial> = new Map();
  private envMap: THREE.Texture | null = null;

  /**
   * Set environment map for all PBR materials
   */
  setEnvironmentMap(envMap: THREE.Texture): void {
    this.envMap = envMap;
    // Update existing materials
    this.materialCache.forEach((material) => {
      material.envMap = envMap;
      material.needsUpdate = true;
    });
  }

  /**
   * Create a PBR material based on configuration
   */
  create(config: MaterialConfig): THREE.MeshStandardMaterial {
    const cacheKey = this.generateCacheKey(config);

    // Return cached material if available
    if (this.materialCache.has(cacheKey)) {
      return this.materialCache.get(cacheKey)!.clone();
    }

    // Get preset defaults
    const preset = MATERIAL_PRESETS[config.type] || {};
    const mergedConfig = { ...preset, ...config };

    // Create base material
    const material = new THREE.MeshStandardMaterial({
      color: this.parseColor(mergedConfig.color),
      metalness: mergedConfig.metalness ?? 0.0,
      roughness: mergedConfig.roughness ?? 0.5,
      envMapIntensity: mergedConfig.envMapIntensity ?? 1.0,
    });

    // Apply environment map if available
    if (this.envMap) {
      material.envMap = this.envMap;
    }

    // Apply normal map
    if (mergedConfig.proceduralNormal) {
      const normalPreset = NORMAL_MAP_PRESETS[config.type] || {};
      const normalMap = normalMapCache.get({
        resolution: 256,
        detail: mergedConfig.normalDetail || normalPreset.detail || 1.0,
        scale: normalPreset.scale || 1.0,
        strength: normalPreset.strength || 1.0,
        seed: this.hashCode(config.type),
      });
      
      material.normalMap = normalMap;
      material.normalScale = new THREE.Vector2(
        mergedConfig.normalScale ?? 1.0,
        mergedConfig.normalScale ?? 1.0
      );
    }

    // Cache the material
    this.materialCache.set(cacheKey, material);

    return material.clone();
  }

  /**
   * Create a metal material (swords, armor)
   */
  createMetal(color?: THREE.Color | string, roughness: number = 0.3): THREE.MeshStandardMaterial {
    return this.create({
      type: MaterialType.Metal,
      color,
      roughness,
    });
  }

  /**
   * Create a stone material (walls, floor)
   */
  createStone(color?: THREE.Color | string): THREE.MeshStandardMaterial {
    return this.create({
      type: MaterialType.Stone,
      color,
      proceduralNormal: true,
    });
  }

  /**
   * Create a leather material (belts, boots)
   */
  createLeather(color?: THREE.Color | string): THREE.MeshStandardMaterial {
    return this.create({
      type: MaterialType.Leather,
      color: color || new THREE.Color(0x8b4513), // Brown default
      proceduralNormal: true,
    });
  }

  /**
   * Create a cloth material (robes)
   */
  createCloth(color?: THREE.Color | string): THREE.MeshStandardMaterial {
    return this.create({
      type: MaterialType.Cloth,
      color,
      proceduralNormal: true,
    });
  }

  /**
   * Create a wood material
   */
  createWood(color?: THREE.Color | string): THREE.MeshStandardMaterial {
    return this.create({
      type: MaterialType.Wood,
      color: color || new THREE.Color(0x8b6914),
      proceduralNormal: true,
    });
  }

  /**
   * Create a crystal material
   */
  createCrystal(color?: THREE.Color | string): THREE.MeshStandardMaterial {
    return this.create({
      type: MaterialType.Crystal,
      color,
    });
  }

  /**
   * Parse color from various input formats
   */
  private parseColor(color?: THREE.Color | string): THREE.Color {
    if (!color) {
      return new THREE.Color(0xffffff);
    }
    if (typeof color === 'string') {
      return new THREE.Color(color);
    }
    return color;
  }

  /**
   * Generate cache key from config
   */
  private generateCacheKey(config: MaterialConfig): string {
    return JSON.stringify({
      type: config.type,
      color: config.color?.toString(),
      metalness: config.metalness,
      roughness: config.roughness,
      normalScale: config.normalScale,
      proceduralNormal: config.proceduralNormal,
      normalDetail: config.normalDetail,
    });
  }

  /**
   * Simple hash function for deterministic seeds
   */
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Dispose all cached materials
   */
  dispose(): void {
    this.materialCache.forEach((material) => {
      material.dispose();
    });
    this.materialCache.clear();
  }

  /**
   * Get cache statistics
   */
  get stats() {
    return {
      cachedMaterials: this.materialCache.size,
    };
  }
}

/**
 * Global PBR material factory instance
 */
export const pbrFactory = new PBRMaterialFactory();

/**
 * Quick material creation helpers
 */
export const Materials = {
  metal: (color?: THREE.Color | string, roughness?: number) =>
    pbrFactory.createMetal(color, roughness),
  
  stone: (color?: THREE.Color | string) =>
    pbrFactory.createStone(color),
  
  leather: (color?: THREE.Color | string) =>
    pbrFactory.createLeather(color),
  
  cloth: (color?: THREE.Color | string) =>
    pbrFactory.createCloth(color),
  
  wood: (color?: THREE.Color | string) =>
    pbrFactory.createWood(color),
  
  crystal: (color?: THREE.Color | string) =>
    pbrFactory.createCrystal(color),
};

/**
 * Apply PBR material to mesh with optional customization
 */
export function applyPBRMaterial(
  mesh: THREE.Mesh,
  materialType: MaterialType,
  customConfig?: Partial<MaterialConfig>
): void {
  const config: MaterialConfig = {
    type: materialType,
    ...customConfig,
  };
  
  const material = pbrFactory.create(config);
  mesh.material = material;
}
