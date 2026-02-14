/**
 * Depth of Field Effect Implementation
 * Agent Arena 3D Roguelike - P2.5
 */

import * as THREE from 'three';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass';
import type { DepthOfFieldConfig } from './types';

/**
 * Depth of Field effect for cinematic look
 */
export class DepthOfFieldEffect {
  private pass: BokehPass;
  private config: Required<DepthOfFieldConfig>;
  private camera: THREE.Camera;
  private scene: THREE.Scene;

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    config: DepthOfFieldConfig = {
      focusDistance: 10,
      aperture: 5.6,
    }
  ) {
    this.scene = scene;
    this.camera = camera;

    // Fill in defaults
    this.config = {
      focusDistance: config.focusDistance,
      aperture: config.aperture,
      maxBlur: config.maxBlur ?? 0.01,
      autoFocus: config.autoFocus ?? false,
      focusTarget: config.focusTarget,
    };

    // Create BokehPass
    this.pass = new BokehPass(scene, camera, {
      focus: this.config.focusDistance,
      aperture: this.calculateAperture(this.config.aperture),
      maxblur: this.config.maxBlur,
    });
  }

  /**
   * Convert f-stop to BokehPass aperture value
   * Lower f-stop = larger aperture = more blur
   */
  private calculateAperture(fStop: number): number {
    // BokehPass aperture is in range 0.0001 - 0.01
    // f-stop typically ranges from 1.4 to 22
    // Invert: smaller f-stop = larger aperture
    const normalized = THREE.MathUtils.clamp(fStop, 1.0, 22.0);
    return THREE.MathUtils.mapLinear(normalized, 1.0, 22.0, 0.008, 0.0001);
  }

  /**
   * Get the THREE.js pass for the effect composer
   */
  getPass(): BokehPass {
    return this.pass;
  }

  /**
   * Update depth of field configuration
   */
  updateConfig(config: Partial<DepthOfFieldConfig>): void {
    if (config.focusDistance !== undefined) {
      this.config.focusDistance = config.focusDistance;
      this.pass.uniforms['focus'].value = config.focusDistance;
    }

    if (config.aperture !== undefined) {
      this.config.aperture = config.aperture;
      this.pass.uniforms['aperture'].value = this.calculateAperture(config.aperture);
    }

    if (config.maxBlur !== undefined) {
      this.config.maxBlur = config.maxBlur;
      this.pass.uniforms['maxblur'].value = config.maxBlur;
    }

    if (config.autoFocus !== undefined) {
      this.config.autoFocus = config.autoFocus;
    }

    if (config.focusTarget !== undefined) {
      this.config.focusTarget = config.focusTarget;
    }
  }

  /**
   * Update focus based on auto-focus target or camera
   */
  update(): void {
    if (this.config.autoFocus) {
      if (this.config.focusTarget) {
        // Focus on target object
        const distance = this.camera.position.distanceTo(this.config.focusTarget.position);
        this.setFocusDistance(distance);
      } else if (this.camera instanceof THREE.PerspectiveCamera) {
        // Default auto-focus at center of view
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        const intersects = raycaster.intersectObjects(this.scene.children, true);

        if (intersects.length > 0) {
          this.setFocusDistance(intersects[0].distance);
        }
      }
    }
  }

  /**
   * Set focus distance directly
   */
  setFocusDistance(distance: number): void {
    this.config.focusDistance = distance;
    this.pass.uniforms['focus'].value = distance;
  }

  /**
   * Set aperture (f-stop) directly
   */
  setAperture(fStop: number): void {
    this.config.aperture = fStop;
    this.pass.uniforms['aperture'].value = this.calculateAperture(fStop);
  }

  /**
   * Set focus target for auto-focus
   */
  setFocusTarget(target: THREE.Object3D | undefined): void {
    this.config.focusTarget = target;
    this.config.autoFocus = target !== undefined;
  }

  /**
   * Smooth focus transition to new distance
   * @param targetDistance Target focus distance
   * @param duration Transition duration in milliseconds
   */
  focusTransition(targetDistance: number, duration: number = 1000): Promise<void> {
    return new Promise((resolve) => {
      const startDistance = this.config.focusDistance;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1.0);

        // Ease-in-out interpolation
        const eased = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const currentDistance = startDistance + (targetDistance - startDistance) * eased;
        this.setFocusDistance(currentDistance);

        if (progress < 1.0) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }

  /**
   * Enable/disable depth of field effect
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
  getConfig(): Required<DepthOfFieldConfig> {
    return { ...this.config };
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    // BokehPass cleanup if needed
    if (this.pass.dispose) {
      this.pass.dispose();
    }
  }
}

/**
 * Helper function to create cinematic DOF presets
 */
export function createCinematicDOF(style: 'shallow' | 'medium' | 'deep'): DepthOfFieldConfig {
  const presets: Record<string, DepthOfFieldConfig> = {
    shallow: {
      focusDistance: 8,
      aperture: 1.8, // f/1.8 - very shallow DOF
      maxBlur: 0.02,
      autoFocus: true,
    },
    medium: {
      focusDistance: 12,
      aperture: 5.6, // f/5.6 - moderate DOF
      maxBlur: 0.012,
      autoFocus: true,
    },
    deep: {
      focusDistance: 20,
      aperture: 11, // f/11 - deep DOF
      maxBlur: 0.006,
      autoFocus: false,
    },
  };

  return presets[style] || presets.medium;
}
