/**
 * Motion Blur Effect Implementation
 * Agent Arena 3D Roguelike - P2.5
 */

import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import type { MotionBlurConfig } from './types';

/**
 * Custom motion blur shader
 */
const MotionBlurShader = {
  uniforms: {
    tDiffuse: { value: null },
    tPrevious: { value: null },
    intensity: { value: 0.5 },
    velocityFactor: { value: 1.0 },
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
    uniform sampler2D tPrevious;
    uniform float intensity;
    uniform float velocityFactor;
    varying vec2 vUv;

    void main() {
      vec4 current = texture2D(tDiffuse, vUv);
      vec4 previous = texture2D(tPrevious, vUv);
      
      // Calculate motion vector
      vec3 motion = current.rgb - previous.rgb;
      float motionMagnitude = length(motion);
      
      // Apply velocity-based blur
      float blurAmount = intensity * motionMagnitude * velocityFactor;
      blurAmount = clamp(blurAmount, 0.0, 1.0);
      
      // Blend current and previous frames
      vec3 blurred = mix(current.rgb, previous.rgb, blurAmount * 0.7);
      
      gl_FragColor = vec4(blurred, current.a);
    }
  `,
};

/**
 * Motion blur effect for fast camera movement and actions
 */
export class MotionBlurEffect {
  private pass: ShaderPass;
  private config: Required<MotionBlurConfig>;
  private previousFrameTexture: THREE.WebGLRenderTarget;
  private renderer: THREE.WebGLRenderer;
  private lastVelocity: THREE.Vector3 = new THREE.Vector3();
  private lastCameraPosition: THREE.Vector3 = new THREE.Vector3();

  constructor(
    renderer: THREE.WebGLRenderer,
    width: number,
    height: number,
    config: MotionBlurConfig = {
      intensity: 0.5,
      samples: 8,
    }
  ) {
    this.renderer = renderer;

    // Fill in defaults
    this.config = {
      intensity: config.intensity,
      samples: config.samples,
      velocityThreshold: config.velocityThreshold ?? 0.1,
      velocityBased: config.velocityBased ?? true,
    };

    // Create render target for previous frame
    this.previousFrameTexture = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });

    // Create shader pass
    this.pass = new ShaderPass(MotionBlurShader);
    this.pass.uniforms['tPrevious'].value = this.previousFrameTexture.texture;
    this.pass.uniforms['intensity'].value = this.config.intensity;
  }

  /**
   * Get the THREE.js pass for the effect composer
   */
  getPass(): ShaderPass {
    return this.pass;
  }

  /**
   * Update motion blur configuration
   */
  updateConfig(config: Partial<MotionBlurConfig>): void {
    if (config.intensity !== undefined) {
      this.config.intensity = config.intensity;
      this.pass.uniforms['intensity'].value = config.intensity;
    }

    if (config.samples !== undefined) {
      this.config.samples = config.samples;
    }

    if (config.velocityThreshold !== undefined) {
      this.config.velocityThreshold = config.velocityThreshold;
    }

    if (config.velocityBased !== undefined) {
      this.config.velocityBased = config.velocityBased;
    }
  }

  /**
   * Update velocity-based blur intensity
   * Call this each frame with camera or object
   */
  updateVelocity(camera: THREE.Camera): void {
    if (!this.config.velocityBased) {
      this.pass.uniforms['velocityFactor'].value = 1.0;
      return;
    }

    // Calculate camera velocity
    const currentPosition = camera.position.clone();
    const velocity = currentPosition.sub(this.lastCameraPosition);
    const speed = velocity.length();

    // Update velocity factor based on speed
    if (speed > this.config.velocityThreshold) {
      const velocityFactor = THREE.MathUtils.clamp(speed / this.config.velocityThreshold, 0, 3);
      this.pass.uniforms['velocityFactor'].value = velocityFactor;
    } else {
      this.pass.uniforms['velocityFactor'].value = 0.5;
    }

    // Store for next frame
    this.lastCameraPosition.copy(camera.position);
    this.lastVelocity.copy(velocity);
  }

  /**
   * Capture current frame for next frame's motion blur
   * Call this after rendering the scene
   */
  captureFrame(sourceTexture: THREE.Texture): void {
    // Copy current frame to previous frame texture
    const oldRenderTarget = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(this.previousFrameTexture);
    
    // Simple blit shader to copy texture
    const blitMaterial = new THREE.MeshBasicMaterial({ map: sourceTexture });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), blitMaterial);
    const scene = new THREE.Scene();
    scene.add(quad);
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    this.renderer.render(scene, camera);
    this.renderer.setRenderTarget(oldRenderTarget);
    
    // Cleanup
    blitMaterial.dispose();
    quad.geometry.dispose();
  }

  /**
   * Apply motion blur pulse for impact effects
   */
  impactBlur(duration: number = 200, peakIntensity: number = 1.5): void {
    const originalIntensity = this.config.intensity;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1.0);

      // Quick spike then fade
      const blurIntensity =
        originalIntensity + (peakIntensity - originalIntensity) * (1 - progress);

      this.pass.uniforms['intensity'].value = blurIntensity;

      if (progress < 1.0) {
        requestAnimationFrame(animate);
      } else {
        this.pass.uniforms['intensity'].value = originalIntensity;
      }
    };

    animate();
  }

  /**
   * Enable/disable motion blur effect
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
  getConfig(): Required<MotionBlurConfig> {
    return { ...this.config };
  }

  /**
   * Resize handler
   */
  resize(width: number, height: number): void {
    this.previousFrameTexture.setSize(width, height);
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.previousFrameTexture.dispose();
    if (this.pass.dispose) {
      this.pass.dispose();
    }
  }
}
