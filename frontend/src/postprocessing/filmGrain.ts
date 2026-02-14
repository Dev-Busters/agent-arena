/**
 * Film Grain Effect Implementation
 * Agent Arena 3D Roguelike - P2.5
 */

import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import type { FilmGrainConfig } from './types';

/**
 * Custom film grain shader with optional vignette
 */
const FilmGrainShader = {
  uniforms: {
    tDiffuse: { value: null },
    intensity: { value: 0.35 },
    time: { value: 0.0 },
    vignette: { value: false },
    vignetteIntensity: { value: 0.5 },
    scale: { value: 1.0 },
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
    uniform float intensity;
    uniform float time;
    uniform bool vignette;
    uniform float vignetteIntensity;
    uniform float scale;
    varying vec2 vUv;

    // Pseudo-random noise function
    float random(vec2 st, float seed) {
      return fract(sin(dot(st.xy + seed, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    // Film grain noise
    float grain(vec2 uv, float time) {
      vec2 scaledUv = uv * scale;
      float noise = random(scaledUv, time);
      return noise * 2.0 - 1.0;
    }

    // Vignette effect
    float getVignette(vec2 uv) {
      vec2 center = uv - 0.5;
      float dist = length(center);
      return smoothstep(0.8, 0.3, dist);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      
      // Apply film grain
      float grainValue = grain(vUv, time);
      color.rgb += grainValue * intensity;
      
      // Apply vignette if enabled
      if (vignette) {
        float vignetteValue = getVignette(vUv);
        color.rgb *= mix(0.3, 1.0, vignetteValue * (1.0 - vignetteIntensity) + vignetteIntensity);
      }
      
      gl_FragColor = color;
    }
  `,
};

/**
 * Film grain effect for atmospheric/retro feel
 */
export class FilmGrainEffect {
  private pass: ShaderPass;
  private config: Required<FilmGrainConfig>;
  private animationTime: number = 0;

  constructor(
    config: FilmGrainConfig = {
      intensity: 0.35,
      animated: true,
    }
  ) {
    // Fill in defaults
    this.config = {
      intensity: config.intensity,
      animated: config.animated,
      vignette: config.vignette ?? false,
      vignetteIntensity: config.vignetteIntensity ?? 0.5,
      scale: config.scale ?? 1.0,
    };

    // Create shader pass
    this.pass = new ShaderPass(FilmGrainShader);
    this.pass.uniforms['intensity'].value = this.config.intensity;
    this.pass.uniforms['vignette'].value = this.config.vignette;
    this.pass.uniforms['vignetteIntensity'].value = this.config.vignetteIntensity;
    this.pass.uniforms['scale'].value = this.config.scale;
  }

  /**
   * Get the THREE.js pass for the effect composer
   */
  getPass(): ShaderPass {
    return this.pass;
  }

  /**
   * Update film grain configuration
   */
  updateConfig(config: Partial<FilmGrainConfig>): void {
    if (config.intensity !== undefined) {
      this.config.intensity = config.intensity;
      this.pass.uniforms['intensity'].value = config.intensity;
    }

    if (config.animated !== undefined) {
      this.config.animated = config.animated;
    }

    if (config.vignette !== undefined) {
      this.config.vignette = config.vignette;
      this.pass.uniforms['vignette'].value = config.vignette;
    }

    if (config.vignetteIntensity !== undefined) {
      this.config.vignetteIntensity = config.vignetteIntensity;
      this.pass.uniforms['vignetteIntensity'].value = config.vignetteIntensity;
    }

    if (config.scale !== undefined) {
      this.config.scale = config.scale;
      this.pass.uniforms['scale'].value = config.scale;
    }
  }

  /**
   * Update animation (call each frame if animated is true)
   */
  update(deltaTime: number = 0.016): void {
    if (this.config.animated) {
      this.animationTime += deltaTime;
      this.pass.uniforms['time'].value = this.animationTime;
    }
  }

  /**
   * Enable/disable vignette
   */
  setVignette(enabled: boolean): void {
    this.config.vignette = enabled;
    this.pass.uniforms['vignette'].value = enabled;
  }

  /**
   * Pulse grain intensity (for effects)
   */
  pulseIntensity(duration: number = 300, peakIntensity: number = 1.0): void {
    const originalIntensity = this.config.intensity;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1.0);

      // Sine wave pulse
      const pulseValue =
        originalIntensity + (peakIntensity - originalIntensity) * Math.sin(progress * Math.PI);

      this.pass.uniforms['intensity'].value = pulseValue;

      if (progress < 1.0) {
        requestAnimationFrame(animate);
      } else {
        this.pass.uniforms['intensity'].value = originalIntensity;
      }
    };

    animate();
  }

  /**
   * Enable/disable film grain effect
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
  getConfig(): Required<FilmGrainConfig> {
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
 * Helper function to create retro film grain presets
 */
export function createRetroGrain(style: 'subtle' | 'moderate' | 'heavy'): FilmGrainConfig {
  const presets: Record<string, FilmGrainConfig> = {
    subtle: {
      intensity: 0.15,
      animated: true,
      vignette: false,
      scale: 1.0,
    },
    moderate: {
      intensity: 0.35,
      animated: true,
      vignette: true,
      vignetteIntensity: 0.4,
      scale: 1.2,
    },
    heavy: {
      intensity: 0.6,
      animated: true,
      vignette: true,
      vignetteIntensity: 0.7,
      scale: 1.5,
    },
  };

  return presets[style] || presets.moderate;
}
