/**
 * Chromatic Aberration Effect Implementation
 * Agent Arena 3D Roguelike - P2.5
 */

import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import type { ChromaticAberrationConfig } from './types';

/**
 * Custom chromatic aberration shader
 */
const ChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    offset: { value: 0.002 },
    radial: { value: true },
    radialStrength: { value: 1.0 },
    maxOffset: { value: 0.005 },
  },

  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float offset;
    uniform bool radial;
    uniform float radialStrength;
    uniform float maxOffset;
    varying vec2 vUv;

    void main() {
      vec2 center = vec2(0.5, 0.5);
      vec2 direction = vUv - center;
      float dist = length(direction);
      
      // Calculate offset based on distance from center (radial mode)
      float currentOffset = offset;
      if (radial) {
        currentOffset = offset + (dist * radialStrength * maxOffset);
      }
      
      // Normalize direction
      vec2 dir = normalize(direction);
      
      // Sample RGB channels with offset
      float r = texture2D(tDiffuse, vUv + dir * currentOffset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - dir * currentOffset).b;
      
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
};

/**
 * Chromatic aberration effect for hit feedback and impact
 */
export class ChromaticAberrationEffect {
  private pass: ShaderPass;
  private config: Required<ChromaticAberrationConfig>;

  constructor(
    config: ChromaticAberrationConfig = {
      offset: 0.002,
    }
  ) {
    // Fill in defaults
    this.config = {
      offset: config.offset,
      radial: config.radial ?? true,
      radialStrength: config.radialStrength ?? 1.0,
      maxOffset: config.maxOffset ?? 0.005,
    };

    // Create shader pass
    this.pass = new ShaderPass(ChromaticAberrationShader);
    this.pass.uniforms['offset'].value = this.config.offset;
    this.pass.uniforms['radial'].value = this.config.radial;
    this.pass.uniforms['radialStrength'].value = this.config.radialStrength;
    this.pass.uniforms['maxOffset'].value = this.config.maxOffset;
  }

  /**
   * Get the THREE.js pass for the effect composer
   */
  getPass(): ShaderPass {
    return this.pass;
  }

  /**
   * Update chromatic aberration configuration
   */
  updateConfig(config: Partial<ChromaticAberrationConfig>): void {
    if (config.offset !== undefined) {
      this.config.offset = config.offset;
      this.pass.uniforms['offset'].value = config.offset;
    }

    if (config.radial !== undefined) {
      this.config.radial = config.radial;
      this.pass.uniforms['radial'].value = config.radial;
    }

    if (config.radialStrength !== undefined) {
      this.config.radialStrength = config.radialStrength;
      this.pass.uniforms['radialStrength'].value = config.radialStrength;
    }

    if (config.maxOffset !== undefined) {
      this.config.maxOffset = config.maxOffset;
      this.pass.uniforms['maxOffset'].value = config.maxOffset;
    }
  }

  /**
   * Apply damage/hit effect with chromatic aberration pulse
   */
  damageFlash(duration: number = 150, peakOffset: number = 0.015): void {
    const originalOffset = this.config.offset;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1.0);

      // Quick spike then exponential decay
      const aberrationOffset =
        originalOffset + (peakOffset - originalOffset) * Math.pow(1 - progress, 2);

      this.pass.uniforms['offset'].value = aberrationOffset;

      if (progress < 1.0) {
        requestAnimationFrame(animate);
      } else {
        this.pass.uniforms['offset'].value = originalOffset;
      }
    };

    animate();
  }

  /**
   * Apply impact effect with stronger aberration
   */
  impactEffect(duration: number = 250, peakOffset: number = 0.025): void {
    const originalOffset = this.config.offset;
    const originalRadialStrength = this.config.radialStrength;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1.0);

      // Exponential decay
      const t = Math.pow(1 - progress, 2);
      const aberrationOffset = originalOffset + (peakOffset - originalOffset) * t;
      const radialBoost = originalRadialStrength + (2.0 - originalRadialStrength) * t;

      this.pass.uniforms['offset'].value = aberrationOffset;
      this.pass.uniforms['radialStrength'].value = radialBoost;

      if (progress < 1.0) {
        requestAnimationFrame(animate);
      } else {
        this.pass.uniforms['offset'].value = originalOffset;
        this.pass.uniforms['radialStrength'].value = originalRadialStrength;
      }
    };

    animate();
  }

  /**
   * Enable/disable chromatic aberration effect
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
  getConfig(): Required<ChromaticAberrationConfig> {
    return { ...this.config };
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    if (this.pass.dispose) {
      this.pass.dispose();
    }
  }
}

/**
 * Helper function to create damage effect presets
 */
export function createDamageAberration(severity: 'light' | 'medium' | 'heavy'): ChromaticAberrationConfig {
  const presets: Record<string, ChromaticAberrationConfig> = {
    light: {
      offset: 0.001,
      radial: true,
      radialStrength: 0.6,
      maxOffset: 0.003,
    },
    medium: {
      offset: 0.003,
      radial: true,
      radialStrength: 1.2,
      maxOffset: 0.008,
    },
    heavy: {
      offset: 0.006,
      radial: true,
      radialStrength: 1.8,
      maxOffset: 0.015,
    },
  };

  return presets[severity] || presets.medium;
}
