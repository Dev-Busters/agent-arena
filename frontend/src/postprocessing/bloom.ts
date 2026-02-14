/**
 * Bloom Effect Implementation
 * Agent Arena 3D Roguelike - P2.5
 */

import * as THREE from 'three';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import type { BloomConfig } from './types';

/**
 * Bloom effect for magical items, abilities, and HDR highlights
 */
export class BloomEffect {
  private pass: UnrealBloomPass;
  private config: Required<BloomConfig>;
  private renderer: THREE.WebGLRenderer;
  private baseResolution: THREE.Vector2;

  constructor(
    renderer: THREE.WebGLRenderer,
    config: BloomConfig = {
      strength: 1.5,
      threshold: 0.85,
      radius: 0.4,
    }
  ) {
    this.renderer = renderer;
    this.baseResolution = new THREE.Vector2();
    renderer.getSize(this.baseResolution);

    // Fill in defaults
    this.config = {
      strength: config.strength,
      threshold: config.threshold,
      radius: config.radius,
      hdr: config.hdr ?? true,
      resolution: config.resolution ?? 1.0,
    };

    // Calculate resolution for bloom pass
    const resolution = new THREE.Vector2(
      this.baseResolution.x * this.config.resolution,
      this.baseResolution.y * this.config.resolution
    );

    // Create UnrealBloomPass
    this.pass = new UnrealBloomPass(
      resolution,
      this.config.strength,
      this.config.radius,
      this.config.threshold
    );

    // Configure HDR tone mapping if enabled
    if (this.config.hdr) {
      this.setupHDR();
    }
  }

  /**
   * Setup HDR rendering for better bloom quality
   */
  private setupHDR(): void {
    if (this.renderer.toneMapping === THREE.NoToneMapping) {
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.0;
    }
  }

  /**
   * Get the THREE.js pass for the effect composer
   */
  getPass(): UnrealBloomPass {
    return this.pass;
  }

  /**
   * Update bloom configuration
   */
  updateConfig(config: Partial<BloomConfig>): void {
    if (config.strength !== undefined) {
      this.config.strength = config.strength;
      this.pass.strength = config.strength;
    }

    if (config.threshold !== undefined) {
      this.config.threshold = config.threshold;
      this.pass.threshold = config.threshold;
    }

    if (config.radius !== undefined) {
      this.config.radius = config.radius;
      this.pass.radius = config.radius;
    }

    if (config.hdr !== undefined) {
      this.config.hdr = config.hdr;
      if (config.hdr) {
        this.setupHDR();
      }
    }

    if (config.resolution !== undefined && config.resolution !== this.config.resolution) {
      this.config.resolution = config.resolution;
      this.updateResolution();
    }
  }

  /**
   * Update bloom resolution (for performance optimization)
   */
  private updateResolution(): void {
    const resolution = new THREE.Vector2(
      this.baseResolution.x * this.config.resolution,
      this.baseResolution.y * this.config.resolution
    );

    // UnrealBloomPass doesn't have a direct resolution setter,
    // so we recreate the pass
    const oldPass = this.pass;
    this.pass = new UnrealBloomPass(
      resolution,
      this.config.strength,
      this.config.radius,
      this.config.threshold
    );

    // Copy enabled state
    this.pass.enabled = oldPass.enabled;
  }

  /**
   * Adaptive resolution based on FPS
   * Reduces bloom resolution if FPS drops below target
   */
  adaptiveResolution(currentFPS: number, targetFPS: number = 60): void {
    if (currentFPS < targetFPS * 0.8 && this.config.resolution > 0.5) {
      // Reduce resolution by 10%
      this.config.resolution = Math.max(0.5, this.config.resolution - 0.1);
      this.updateResolution();
    } else if (currentFPS > targetFPS * 0.95 && this.config.resolution < 1.0) {
      // Increase resolution by 5%
      this.config.resolution = Math.min(1.0, this.config.resolution + 0.05);
      this.updateResolution();
    }
  }

  /**
   * Enable/disable bloom effect
   */
  setEnabled(enabled: boolean): void {
    this.pass.enabled = enabled;
  }

  /**
   * Get current enabled state
   */
  isEnabled(): boolean {
    return this.pass.enabled;
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<BloomConfig> {
    return { ...this.config };
  }

  /**
   * Resize handler for window/canvas changes
   */
  resize(width: number, height: number): void {
    this.baseResolution.set(width, height);
    this.updateResolution();
  }

  /**
   * Apply bloom intensity pulse (for magical effects)
   * @param duration Duration in milliseconds
   * @param peakStrength Peak bloom strength
   */
  pulse(duration: number = 500, peakStrength: number = 3.0): void {
    const originalStrength = this.config.strength;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1.0);

      // Sine wave pulse
      const pulseStrength =
        originalStrength + (peakStrength - originalStrength) * Math.sin(progress * Math.PI);

      this.pass.strength = pulseStrength;

      if (progress < 1.0) {
        requestAnimationFrame(animate);
      } else {
        this.pass.strength = originalStrength;
      }
    };

    animate();
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    // UnrealBloomPass has internal render targets that need cleanup
    if (this.pass.dispose) {
      this.pass.dispose();
    }
  }
}

/**
 * Helper function to create bloom effect for rarity glow
 */
export function createRarityBloom(rarity: 'common' | 'rare' | 'epic' | 'legendary'): BloomConfig {
  const rarityConfigs: Record<string, BloomConfig> = {
    common: {
      strength: 0.8,
      threshold: 0.95,
      radius: 0.3,
    },
    rare: {
      strength: 1.2,
      threshold: 0.9,
      radius: 0.35,
    },
    epic: {
      strength: 1.8,
      threshold: 0.85,
      radius: 0.4,
    },
    legendary: {
      strength: 2.5,
      threshold: 0.8,
      radius: 0.5,
      hdr: true,
    },
  };

  return rarityConfigs[rarity] || rarityConfigs.common;
}
