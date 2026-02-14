/**
 * Light Pool - Performance optimization through object reuse
 * Agent Arena 3D Roguelike - P2.6
 */

import * as THREE from 'three';
import { LightType, LightPoolConfig, LightPoolStats, PooledLight, ShadowQuality } from './types';

/**
 * Light pool for efficient light management
 * Pre-allocates lights and reuses them to avoid GC pressure
 */
export class LightPool {
  private pointLights: PooledLight[] = [];
  private spotLights: PooledLight[] = [];
  private scene: THREE.Scene;
  private config: Required<LightPoolConfig>;
  private nextId = 0;

  constructor(scene: THREE.Scene, config: LightPoolConfig = {}) {
    this.scene = scene;
    this.config = {
      pointLightCount: config.pointLightCount ?? 30,
      spotLightCount: config.spotLightCount ?? 20,
      maxLights: config.maxLights ?? 50,
      enableShadows: config.enableShadows ?? true,
      shadowQuality: config.shadowQuality ?? ShadowQuality.MEDIUM,
    };

    this.initialize();
  }

  /**
   * Pre-allocate light pool
   */
  private initialize(): void {
    // Create point lights
    for (let i = 0; i < this.config.pointLightCount; i++) {
      const light = new THREE.PointLight(0xffffff, 0, 10, 2);
      light.visible = false;
      
      if (this.config.enableShadows) {
        this.configureShadow(light);
      }

      this.pointLights.push({
        light,
        active: false,
        id: this.generateId(),
        type: LightType.POINT,
      });

      this.scene.add(light);
    }

    // Create spot lights
    for (let i = 0; i < this.config.spotLightCount; i++) {
      const light = new THREE.SpotLight(0xffffff, 0, 10, Math.PI / 4, 0.5, 2);
      light.visible = false;

      if (this.config.enableShadows) {
        this.configureShadow(light);
      }

      this.spotLights.push({
        light,
        active: false,
        id: this.generateId(),
        type: LightType.SPOT,
      });

      this.scene.add(light);
    }

    console.log(`LightPool initialized: ${this.pointLights.length} point lights, ${this.spotLights.length} spot lights`);
  }

  /**
   * Configure shadow settings for a light
   */
  private configureShadow(light: THREE.PointLight | THREE.SpotLight): void {
    light.castShadow = true;

    const mapSize = this.getShadowMapSize(this.config.shadowQuality);
    light.shadow.mapSize.width = mapSize;
    light.shadow.mapSize.height = mapSize;

    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 25;
    light.shadow.bias = -0.0001;
    light.shadow.normalBias = 0.02;
    light.shadow.radius = 2; // Soft shadows (PCF)
  }

  /**
   * Get shadow map size from quality setting
   */
  private getShadowMapSize(quality: ShadowQuality): number {
    switch (quality) {
      case ShadowQuality.LOW:
        return 512;
      case ShadowQuality.MEDIUM:
        return 1024;
      case ShadowQuality.HIGH:
        return 2048;
      case ShadowQuality.ULTRA:
        return 4096;
      default:
        return 1024;
    }
  }

  /**
   * Generate unique light ID
   */
  private generateId(): string {
    return `light_${this.nextId++}`;
  }

  /**
   * Acquire a point light from the pool
   */
  public acquirePointLight(): THREE.PointLight | null {
    const pooled = this.pointLights.find(pl => !pl.active);
    
    if (!pooled) {
      console.warn('LightPool: No available point lights');
      return null;
    }

    pooled.active = true;
    pooled.light.visible = true;
    return pooled.light as THREE.PointLight;
  }

  /**
   * Acquire a spot light from the pool
   */
  public acquireSpotLight(): THREE.SpotLight | null {
    const pooled = this.spotLights.find(sl => !sl.active);
    
    if (!pooled) {
      console.warn('LightPool: No available spot lights');
      return null;
    }

    pooled.active = true;
    pooled.light.visible = true;
    return pooled.light as THREE.SpotLight;
  }

  /**
   * Release a light back to the pool
   */
  public release(light: THREE.PointLight | THREE.SpotLight): void {
    const pooled = [...this.pointLights, ...this.spotLights].find(
      pl => pl.light === light
    );

    if (!pooled) {
      console.warn('LightPool: Attempted to release non-pooled light');
      return;
    }

    if (!pooled.active) {
      console.warn('LightPool: Attempted to release inactive light');
      return;
    }

    // Reset light properties
    light.visible = false;
    light.intensity = 0;
    light.position.set(0, 0, 0);

    pooled.active = false;
  }

  /**
   * Release all active lights
   */
  public releaseAll(): void {
    [...this.pointLights, ...this.spotLights].forEach(pooled => {
      if (pooled.active) {
        this.release(pooled.light);
      }
    });
  }

  /**
   * Get pool statistics
   */
  public getStats(): LightPoolStats {
    const activePointLights = this.pointLights.filter(pl => pl.active).length;
    const activeSpotLights = this.spotLights.filter(sl => sl.active).length;

    return {
      totalLights: this.pointLights.length + this.spotLights.length,
      activeLights: activePointLights + activeSpotLights,
      availableLights: 
        (this.pointLights.length - activePointLights) +
        (this.spotLights.length - activeSpotLights),
      pointLights: {
        total: this.pointLights.length,
        active: activePointLights,
      },
      spotLights: {
        total: this.spotLights.length,
        active: activeSpotLights,
      },
    };
  }

  /**
   * Dispose of all lights and cleanup
   */
  public dispose(): void {
    [...this.pointLights, ...this.spotLights].forEach(pooled => {
      this.scene.remove(pooled.light);
      pooled.light.dispose();
    });

    this.pointLights = [];
    this.spotLights = [];
    console.log('LightPool disposed');
  }
}
