/**
 * Normal map utilities for Agent Arena
 * Procedural normal map generation and PBR integration
 */

import * as THREE from 'three';

/**
 * Configuration for procedural normal map generation
 */
export interface ProceduralNormalConfig {
  /** Resolution of the normal map (power of 2) */
  resolution?: number;
  /** Detail level (1.0 = standard, higher = more detail) */
  detail?: number;
  /** Scale of the noise pattern */
  scale?: number;
  /** Seed for deterministic generation */
  seed?: number;
  /** Normal strength multiplier */
  strength?: number;
}

/**
 * Generate procedural normal map using noise functions
 * Useful for stone, leather, cloth, and wood materials
 */
export function generateProceduralNormalMap(
  config: ProceduralNormalConfig = {}
): THREE.DataTexture {
  const {
    resolution = 256,
    detail = 1.0,
    scale = 1.0,
    seed = 0,
    strength = 1.0,
  } = config;

  const size = resolution * resolution;
  const data = new Uint8Array(4 * size);

  // Perlin-like noise function (simplified)
  const noise = (x: number, y: number, octave: number): number => {
    const freq = Math.pow(2, octave);
    const amp = Math.pow(0.5, octave);
    const nx = (x * scale * freq + seed) % 256;
    const ny = (y * scale * freq + seed) % 256;
    return Math.sin(nx * 0.1) * Math.cos(ny * 0.1) * amp;
  };

  // Generate height map using multiple octaves
  const heightMap: number[] = [];
  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      let height = 0;
      const octaves = Math.max(1, Math.floor(detail * 4));
      for (let oct = 0; oct < octaves; oct++) {
        height += noise(i / resolution, j / resolution, oct);
      }
      heightMap[i * resolution + j] = height * 0.5 + 0.5; // Normalize to 0-1
    }
  }

  // Calculate normals from height map
  for (let i = 0; i < resolution; i++) {
    for (let j = 0; j < resolution; j++) {
      const idx = i * resolution + j;

      // Sample neighboring heights (with wrapping)
      const hL = heightMap[((i - 1 + resolution) % resolution) * resolution + j];
      const hR = heightMap[((i + 1) % resolution) * resolution + j];
      const hD = heightMap[i * resolution + ((j - 1 + resolution) % resolution)];
      const hU = heightMap[i * resolution + ((j + 1) % resolution)];

      // Calculate gradients
      const dx = (hR - hL) * strength;
      const dy = (hU - hD) * strength;

      // Normal vector (convert to RGB, 0-255 range)
      const normal = new THREE.Vector3(-dx, -dy, 1).normalize();
      const r = Math.floor(((normal.x + 1) * 0.5) * 255);
      const g = Math.floor(((normal.y + 1) * 0.5) * 255);
      const b = Math.floor(((normal.z + 1) * 0.5) * 255);

      // Store in data array (RGBA)
      data[idx * 4] = r;
      data[idx * 4 + 1] = g;
      data[idx * 4 + 2] = b;
      data[idx * 4 + 3] = 255; // Alpha
    }
  }

  const texture = new THREE.DataTexture(
    data,
    resolution,
    resolution,
    THREE.RGBAFormat
  );
  
  texture.needsUpdate = true;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  return texture;
}

/**
 * Apply normal map to a PBR material
 */
export function applyNormalMap(
  material: THREE.MeshStandardMaterial,
  normalMap: THREE.Texture,
  strength: number = 1.0
): void {
  material.normalMap = normalMap;
  material.normalScale = new THREE.Vector2(strength, strength);
  material.needsUpdate = true;
}

/**
 * Create detail normal map for fine surface features
 * Can be combined with main normal map
 */
export function createDetailNormalMap(
  baseResolution: number = 256,
  detailScale: number = 5.0
): THREE.DataTexture {
  return generateProceduralNormalMap({
    resolution: baseResolution,
    detail: 3.0,
    scale: detailScale,
    strength: 0.5,
  });
}

/**
 * Combine two normal maps (base + detail)
 * Uses Reoriented Normal Mapping (RNM) blending
 */
export function combineNormalMaps(
  base: THREE.Texture,
  detail: THREE.Texture
): THREE.Texture {
  // This is a simplified approach - in production, you'd use a shader
  // For now, we return the base and suggest layering in the material
  console.warn('Normal map combining requires shader-based blending for best results');
  return base;
}

/**
 * Normal map cache for performance
 * Reuse common procedural normal maps
 */
export class NormalMapCache {
  private cache: Map<string, THREE.DataTexture> = new Map();

  /**
   * Get or create a procedural normal map
   */
  get(config: ProceduralNormalConfig): THREE.DataTexture {
    const key = this.generateKey(config);
    
    if (!this.cache.has(key)) {
      const normalMap = generateProceduralNormalMap(config);
      this.cache.set(key, normalMap);
    }

    return this.cache.get(key)!;
  }

  /**
   * Generate cache key from config
   */
  private generateKey(config: ProceduralNormalConfig): string {
    return JSON.stringify({
      res: config.resolution || 256,
      det: config.detail || 1.0,
      scl: config.scale || 1.0,
      sed: config.seed || 0,
      str: config.strength || 1.0,
    });
  }

  /**
   * Clear the cache and dispose all textures
   */
  dispose(): void {
    this.cache.forEach((texture) => {
      texture.dispose();
    });
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  get stats() {
    return {
      count: this.cache.size,
      memoryEstimate: this.cache.size * 256 * 256 * 4, // bytes (rough estimate)
    };
  }
}

/**
 * Preset normal map configurations for common materials
 */
export const NORMAL_MAP_PRESETS = {
  stone: {
    detail: 2.0,
    scale: 1.5,
    strength: 1.2,
  },
  leather: {
    detail: 1.5,
    scale: 2.0,
    strength: 0.8,
  },
  cloth: {
    detail: 3.0,
    scale: 3.0,
    strength: 0.5,
  },
  wood: {
    detail: 2.5,
    scale: 1.0,
    strength: 1.0,
  },
  metal: {
    detail: 0.5,
    scale: 0.5,
    strength: 0.3,
  },
};

/**
 * Global normal map cache instance
 */
export const normalMapCache = new NormalMapCache();
