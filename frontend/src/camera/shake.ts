/**
 * Camera Shake Effects
 * Agent Arena 3D Roguelike - Phase 2.7
 */

import { Vector3 } from 'three';
import { CameraShakeConfig, ShakeInstance } from './types';

/**
 * Camera shake system with support for multiple simultaneous shakes
 * Includes impact, continuous, and directional shake effects
 */
export class CameraShake {
  private activeShakes: Map<string, ShakeInstance>;
  private shakeOffset: Vector3;
  private nextId: number;

  constructor() {
    this.activeShakes = new Map();
    this.shakeOffset = new Vector3();
    this.nextId = 0;
  }

  /**
   * Trigger an impact shake (e.g., hit, explosion)
   */
  public impact(intensity: number, duration: number = 300): string {
    const config: CameraShakeConfig = {
      intensity,
      duration,
      frequency: 20,
      decay: 0.95,
    };
    return this.addShake(config);
  }

  /**
   * Trigger a continuous shake (e.g., earthquake, rumble)
   */
  public continuous(intensity: number, duration: number, frequency: number = 10): string {
    const config: CameraShakeConfig = {
      intensity,
      duration,
      frequency,
      decay: 0.99,
    };
    return this.addShake(config);
  }

  /**
   * Trigger a directional shake (e.g., knockback)
   */
  public directional(
    intensity: number,
    direction: Vector3,
    duration: number = 250
  ): string {
    const config: CameraShakeConfig = {
      intensity,
      duration,
      frequency: 15,
      decay: 0.9,
      direction: direction.clone().normalize(),
    };
    return this.addShake(config);
  }

  /**
   * Add a custom shake effect
   */
  public addShake(config: CameraShakeConfig): string {
    const id = `shake_${this.nextId++}`;
    const shake: ShakeInstance = {
      id,
      config,
      startTime: Date.now(),
      currentIntensity: config.intensity,
      phase: 0,
    };
    this.activeShakes.set(id, shake);
    return id;
  }

  /**
   * Remove a specific shake by ID
   */
  public removeShake(id: string): void {
    this.activeShakes.delete(id);
  }

  /**
   * Clear all active shakes
   */
  public clearAll(): void {
    this.activeShakes.clear();
    this.shakeOffset.set(0, 0, 0);
  }

  /**
   * Update shake effects (call every frame)
   * Returns the combined shake offset to apply to camera
   */
  public update(deltaTime: number): Vector3 {
    const currentTime = Date.now();
    this.shakeOffset.set(0, 0, 0);

    // Update each active shake
    const shakesToRemove: string[] = [];
    
    for (const [id, shake] of this.activeShakes) {
      const elapsed = currentTime - shake.startTime;
      
      // Check if shake has expired
      if (elapsed >= shake.config.duration) {
        shakesToRemove.push(id);
        continue;
      }

      // Calculate shake progress (0-1)
      const progress = elapsed / shake.config.duration;
      
      // Apply decay to intensity
      shake.currentIntensity *= shake.config.decay;

      // Calculate shake offset based on type
      let offset: Vector3;
      
      if (shake.config.direction) {
        // Directional shake
        offset = this.calculateDirectionalShake(shake, progress, deltaTime);
      } else {
        // Omnidirectional shake
        offset = this.calculateOmnidirectionalShake(shake, progress, deltaTime);
      }

      // Add to total shake offset
      this.shakeOffset.add(offset);
    }

    // Remove expired shakes
    for (const id of shakesToRemove) {
      this.activeShakes.delete(id);
    }

    return this.shakeOffset.clone();
  }

  /**
   * Calculate directional shake offset
   */
  private calculateDirectionalShake(
    shake: ShakeInstance,
    progress: number,
    deltaTime: number
  ): Vector3 {
    // Decay envelope (starts strong, fades out)
    const envelope = 1 - progress;
    
    // Oscillation
    shake.phase += shake.config.frequency * deltaTime * Math.PI * 2;
    const oscillation = Math.sin(shake.phase);

    // Apply to direction
    const offset = shake.config.direction!
      .clone()
      .multiplyScalar(shake.currentIntensity * envelope * oscillation);

    return offset;
  }

  /**
   * Calculate omnidirectional shake offset
   */
  private calculateOmnidirectionalShake(
    shake: ShakeInstance,
    progress: number,
    deltaTime: number
  ): Vector3 {
    // Decay envelope
    const envelope = 1 - progress;
    
    // Update phase
    shake.phase += shake.config.frequency * deltaTime * Math.PI * 2;

    // Generate pseudo-random shake using phase
    const x = Math.sin(shake.phase * 1.1) * shake.currentIntensity * envelope;
    const y = Math.sin(shake.phase * 1.3) * shake.currentIntensity * envelope;
    const z = Math.sin(shake.phase * 0.9) * shake.currentIntensity * envelope;

    return new Vector3(x, y, z);
  }

  /**
   * Get number of active shakes
   */
  public getActiveCount(): number {
    return this.activeShakes.size;
  }

  /**
   * Get current shake offset
   */
  public getOffset(): Vector3 {
    return this.shakeOffset.clone();
  }

  /**
   * Check if any shakes are active
   */
  public isShaking(): boolean {
    return this.activeShakes.size > 0;
  }

  /**
   * Get shake by ID
   */
  public getShake(id: string): ShakeInstance | undefined {
    return this.activeShakes.get(id);
  }

  /**
   * Update shake intensity
   */
  public setIntensity(id: string, intensity: number): void {
    const shake = this.activeShakes.get(id);
    if (shake) {
      shake.currentIntensity = intensity;
    }
  }

  /**
   * Extend shake duration
   */
  public extendDuration(id: string, additionalMs: number): void {
    const shake = this.activeShakes.get(id);
    if (shake) {
      shake.config.duration += additionalMs;
    }
  }
}
