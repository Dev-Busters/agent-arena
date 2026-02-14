/**
 * Follow Camera Behavior
 * Agent Arena 3D Roguelike - Phase 2.7
 */

import { Vector3 } from 'three';
import { FollowConfig } from './types';

/**
 * Follow camera that tracks a target with smooth interpolation
 * Includes look-ahead and speed-based zoom features
 */
export class FollowCamera {
  private config: FollowConfig;
  private target: Vector3 | null;
  private lastTargetPosition: Vector3;
  private targetVelocity: Vector3;
  private lookAheadOffset: Vector3;
  private currentSpeedZoom: number;

  constructor(config: FollowConfig) {
    this.config = config;
    this.target = null;
    this.lastTargetPosition = new Vector3();
    this.targetVelocity = new Vector3();
    this.lookAheadOffset = new Vector3();
    this.currentSpeedZoom = 1.0;
  }

  /**
   * Set the target to follow
   */
  public setTarget(target: Vector3 | null): void {
    this.target = target;
    if (target) {
      this.lastTargetPosition.copy(target);
    }
  }

  /**
   * Get the current target
   */
  public getTarget(): Vector3 | null {
    return this.target;
  }

  /**
   * Update follow camera (call every frame)
   * Returns desired camera position and look-at point
   */
  public update(deltaTime: number): {
    position: Vector3;
    lookAt: Vector3;
    zoomMultiplier: number;
  } {
    if (!this.target) {
      return {
        position: new Vector3(),
        lookAt: new Vector3(),
        zoomMultiplier: 1.0,
      };
    }

    // Calculate target velocity
    this.targetVelocity
      .copy(this.target)
      .sub(this.lastTargetPosition)
      .multiplyScalar(1 / Math.max(deltaTime, 0.001));

    // Update last position
    this.lastTargetPosition.copy(this.target);

    // Calculate look-ahead offset based on velocity
    const speed = this.targetVelocity.length();
    if (speed > 0.1 && this.config.lookAhead > 0) {
      const lookAheadTarget = this.targetVelocity
        .clone()
        .normalize()
        .multiplyScalar(this.config.lookAhead);

      // Smooth interpolation of look-ahead
      this.lookAheadOffset.lerp(
        lookAheadTarget,
        1 - Math.pow(0.1, deltaTime)
      );
    } else {
      // Decay look-ahead when not moving
      this.lookAheadOffset.lerp(
        new Vector3(),
        1 - Math.pow(0.05, deltaTime)
      );
    }

    // Calculate speed-based zoom
    if (this.config.speedBasedZoom) {
      const speedFactor = Math.min(
        speed / this.config.speedThreshold,
        1.0
      );
      const targetSpeedZoom = 1.0 + (this.config.maxSpeedZoom - 1.0) * speedFactor;
      
      // Smooth zoom transition
      this.currentSpeedZoom +=
        (targetSpeedZoom - this.currentSpeedZoom) *
        (1 - Math.pow(0.1, deltaTime));
    } else {
      this.currentSpeedZoom = 1.0;
    }

    // Calculate desired look-at position (target + look-ahead)
    const lookAt = this.target.clone().add(this.lookAheadOffset);

    // Calculate desired camera position (target + offset + look-ahead)
    const position = this.target
      .clone()
      .add(this.config.offset)
      .add(this.lookAheadOffset);

    return {
      position,
      lookAt,
      zoomMultiplier: this.currentSpeedZoom,
    };
  }

  /**
   * Set follow offset
   */
  public setOffset(offset: Vector3): void {
    this.config.offset.copy(offset);
  }

  /**
   * Get follow offset
   */
  public getOffset(): Vector3 {
    return this.config.offset.clone();
  }

  /**
   * Set follow smoothness
   */
  public setSmoothness(smoothness: number): void {
    this.config.smoothness = Math.max(0, Math.min(1, smoothness));
  }

  /**
   * Get follow smoothness
   */
  public getSmoothness(): number {
    return this.config.smoothness;
  }

  /**
   * Set look-ahead distance
   */
  public setLookAhead(distance: number): void {
    this.config.lookAhead = Math.max(0, distance);
  }

  /**
   * Get look-ahead distance
   */
  public getLookAhead(): number {
    return this.config.lookAhead;
  }

  /**
   * Enable/disable speed-based zoom
   */
  public setSpeedBasedZoom(enabled: boolean): void {
    this.config.speedBasedZoom = enabled;
    if (!enabled) {
      this.currentSpeedZoom = 1.0;
    }
  }

  /**
   * Set speed threshold for zoom
   */
  public setSpeedThreshold(threshold: number): void {
    this.config.speedThreshold = Math.max(0.1, threshold);
  }

  /**
   * Set maximum speed zoom multiplier
   */
  public setMaxSpeedZoom(max: number): void {
    this.config.maxSpeedZoom = Math.max(1.0, max);
  }

  /**
   * Get current target velocity
   */
  public getVelocity(): Vector3 {
    return this.targetVelocity.clone();
  }

  /**
   * Get current speed
   */
  public getSpeed(): number {
    return this.targetVelocity.length();
  }

  /**
   * Reset follow camera state
   */
  public reset(): void {
    this.lastTargetPosition.set(0, 0, 0);
    this.targetVelocity.set(0, 0, 0);
    this.lookAheadOffset.set(0, 0, 0);
    this.currentSpeedZoom = 1.0;
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<FollowConfig>): void {
    Object.assign(this.config, config);
  }

  /**
   * Get current configuration
   */
  public getConfig(): FollowConfig {
    return { ...this.config };
  }
}
