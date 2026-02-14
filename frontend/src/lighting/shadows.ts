/**
 * Shadow Manager - Configure and optimize shadow rendering
 * Agent Arena 3D Roguelike - P2.6
 */

import * as THREE from 'three';
import { ShadowQuality, ShadowConfig } from './types';

/**
 * Shadow manager for configuring and optimizing shadows
 */
export class ShadowManager {
  private renderer: THREE.WebGLRenderer;
  private quality: ShadowQuality;
  private config: Required<ShadowConfig>;

  constructor(renderer: THREE.WebGLRenderer, quality: ShadowQuality = ShadowQuality.MEDIUM) {
    this.renderer = renderer;
    this.quality = quality;

    this.config = {
      quality,
      bias: -0.0001,
      normalBias: 0.02,
      radius: 2,
      near: 0.1,
      far: 25,
      enabled: true,
    };

    this.configure();
  }

  /**
   * Configure renderer shadow settings
   */
  private configure(): void {
    this.renderer.shadowMap.enabled = this.config.enabled;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows
    this.renderer.shadowMap.autoUpdate = true;
  }

  /**
   * Apply shadow configuration to a light
   */
  public configureLightShadow(
    light: THREE.Light,
    customConfig?: Partial<ShadowConfig>
  ): void {
    if (!('castShadow' in light)) {
      console.warn('ShadowManager: Light does not support shadows');
      return;
    }

    const config = { ...this.config, ...customConfig };
    
    light.castShadow = config.enabled;

    if (!light.shadow) return;

    // Set shadow map size based on quality
    const mapSize = this.getShadowMapSize(config.quality);
    light.shadow.mapSize.width = mapSize;
    light.shadow.mapSize.height = mapSize;

    // Configure shadow camera
    const camera = light.shadow.camera as THREE.PerspectiveCamera | THREE.OrthographicCamera;
    camera.near = config.near;
    camera.far = config.far;

    // Shadow quality settings
    light.shadow.bias = config.bias;
    light.shadow.normalBias = config.normalBias;
    light.shadow.radius = config.radius;

    // Update shadow camera if needed
    camera.updateProjectionMatrix();
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
   * Set shadow quality globally
   */
  public setQuality(quality: ShadowQuality): void {
    this.quality = quality;
    this.config.quality = quality;
  }

  /**
   * Enable/disable shadows globally
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.renderer.shadowMap.enabled = enabled;
  }

  /**
   * Set shadow bias (fixes shadow acne)
   */
  public setBias(bias: number): void {
    this.config.bias = bias;
  }

  /**
   * Set normal bias (fixes shadow acne on curved surfaces)
   */
  public setNormalBias(normalBias: number): void {
    this.config.normalBias = normalBias;
  }

  /**
   * Set shadow radius (softness)
   */
  public setRadius(radius: number): void {
    this.config.radius = radius;
  }

  /**
   * Enable selective shadows on specific meshes
   */
  public enableSelectiveShadows(
    meshes: THREE.Mesh[],
    castShadow: boolean = true,
    receiveShadow: boolean = true
  ): void {
    meshes.forEach(mesh => {
      mesh.castShadow = castShadow;
      mesh.receiveShadow = receiveShadow;
    });
  }

  /**
   * Optimize shadows for performance
   * - Reduces shadow map size for distant lights
   * - Adjusts camera frustum
   */
  public optimizeLightShadow(light: THREE.Light, distanceFromCamera: number): void {
    if (!light.shadow) return;

    // Reduce quality for distant lights
    let quality = this.quality;
    if (distanceFromCamera > 20) {
      quality = ShadowQuality.LOW;
    } else if (distanceFromCamera > 10) {
      quality = ShadowQuality.MEDIUM;
    }

    const mapSize = this.getShadowMapSize(quality);
    light.shadow.mapSize.width = mapSize;
    light.shadow.mapSize.height = mapSize;

    // Adjust camera frustum based on light type
    if (light instanceof THREE.DirectionalLight) {
      const size = 10;
      const camera = light.shadow.camera as THREE.OrthographicCamera;
      camera.left = -size;
      camera.right = size;
      camera.top = size;
      camera.bottom = -size;
      camera.updateProjectionMatrix();
    } else {
      const camera = light.shadow.camera as THREE.PerspectiveCamera | THREE.OrthographicCamera;
      camera.updateProjectionMatrix();
    }
  }

  /**
   * Get current configuration
   */
  public getConfig(): Required<ShadowConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<ShadowConfig>): void {
    this.config = { ...this.config, ...config };
    this.configure();
  }
}
