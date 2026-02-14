/**
 * Camera Transitions
 * Agent Arena 3D Roguelike - Phase 2.7
 */

import { Vector3 } from 'three';
import { TransitionConfig, TransitionInstance, EasingFunction } from './types';

/**
 * Camera transition system with smooth easing
 * For cinematic camera movements and scene transitions
 */
export class CameraTransition {
  private activeTransition: TransitionInstance | null;
  private easingFunctions: Map<EasingFunction, (t: number) => number>;

  constructor() {
    this.activeTransition = null;
    this.easingFunctions = new Map();
    this.initializeEasingFunctions();
  }

  /**
   * Initialize easing functions
   */
  private initializeEasingFunctions(): void {
    // Linear
    this.easingFunctions.set('linear', (t: number) => t);

    // Quadratic
    this.easingFunctions.set('easeInQuad', (t: number) => t * t);
    this.easingFunctions.set('easeOutQuad', (t: number) => t * (2 - t));
    this.easingFunctions.set('easeInOutQuad', (t: number) =>
      t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    );

    // Cubic
    this.easingFunctions.set('easeInCubic', (t: number) => t * t * t);
    this.easingFunctions.set('easeOutCubic', (t: number) => {
      const t1 = t - 1;
      return t1 * t1 * t1 + 1;
    });
    this.easingFunctions.set('easeInOutCubic', (t: number) =>
      t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
    );

    // Quartic
    this.easingFunctions.set('easeInQuart', (t: number) => t * t * t * t);
    this.easingFunctions.set('easeOutQuart', (t: number) => {
      const t1 = t - 1;
      return 1 - t1 * t1 * t1 * t1;
    });
    this.easingFunctions.set('easeInOutQuart', (t: number) => {
      if (t < 0.5) {
        return 8 * t * t * t * t;
      } else {
        const t1 = t - 1;
        return 1 - 8 * t1 * t1 * t1 * t1;
      }
    });
  }

  /**
   * Start a new camera transition
   */
  public start(config: TransitionConfig): void {
    // If there's an active transition, complete it first
    if (this.activeTransition) {
      this.complete();
    }

    // Create new transition instance
    this.activeTransition = {
      config,
      startPosition: new Vector3(), // Will be set by camera controller
      startLookAt: new Vector3(), // Will be set by camera controller
      startZoom: 1.0, // Will be set by camera controller
      startTime: Date.now(),
      progress: 0,
    };
  }

  /**
   * Set starting values for transition
   */
  public setStartValues(position: Vector3, lookAt: Vector3, zoom: number): void {
    if (this.activeTransition) {
      this.activeTransition.startPosition.copy(position);
      this.activeTransition.startLookAt.copy(lookAt);
      this.activeTransition.startZoom = zoom;
    }
  }

  /**
   * Update transition (call every frame)
   * Returns current position, lookAt, and zoom
   */
  public update(): {
    position: Vector3;
    lookAt: Vector3;
    zoom: number;
  } | null {
    if (!this.activeTransition) {
      return null;
    }

    const currentTime = Date.now();
    const elapsed = currentTime - this.activeTransition.startTime;
    const duration = this.activeTransition.config.duration;

    // Calculate progress (0-1)
    const rawProgress = Math.min(elapsed / duration, 1);

    // Apply easing function
    const easingFn = this.easingFunctions.get(this.activeTransition.config.easing);
    const progress = easingFn ? easingFn(rawProgress) : rawProgress;

    this.activeTransition.progress = progress;

    // Interpolate position
    const position = this.activeTransition.startPosition
      .clone()
      .lerp(this.activeTransition.config.targetPosition, progress);

    // Interpolate lookAt
    const lookAt = this.activeTransition.startLookAt
      .clone()
      .lerp(this.activeTransition.config.targetLookAt, progress);

    // Interpolate zoom (if specified)
    let zoom = this.activeTransition.startZoom;
    if (this.activeTransition.config.targetZoom !== undefined) {
      zoom =
        this.activeTransition.startZoom +
        (this.activeTransition.config.targetZoom - this.activeTransition.startZoom) *
          progress;
    }

    // Check if transition is complete
    if (rawProgress >= 1) {
      this.complete();
    }

    return { position, lookAt, zoom };
  }

  /**
   * Complete current transition
   */
  private complete(): void {
    if (this.activeTransition && this.activeTransition.config.onComplete) {
      this.activeTransition.config.onComplete();
    }
    this.activeTransition = null;
  }

  /**
   * Cancel current transition
   */
  public cancel(): void {
    this.activeTransition = null;
  }

  /**
   * Check if transition is active
   */
  public isActive(): boolean {
    return this.activeTransition !== null;
  }

  /**
   * Get current transition progress (0-1)
   */
  public getProgress(): number {
    return this.activeTransition ? this.activeTransition.progress : 0;
  }

  /**
   * Get current transition
   */
  public getActiveTransition(): TransitionInstance | null {
    return this.activeTransition;
  }

  /**
   * Create a cinematic transition (commonly used settings)
   */
  public static createCinematic(
    targetPosition: Vector3,
    targetLookAt: Vector3,
    duration: number = 2000,
    onComplete?: () => void
  ): TransitionConfig {
    return {
      targetPosition,
      targetLookAt,
      duration,
      easing: 'easeInOutCubic',
      onComplete,
    };
  }

  /**
   * Create a quick snap transition
   */
  public static createSnap(
    targetPosition: Vector3,
    targetLookAt: Vector3,
    duration: number = 300,
    onComplete?: () => void
  ): TransitionConfig {
    return {
      targetPosition,
      targetLookAt,
      duration,
      easing: 'easeOutQuad',
      onComplete,
    };
  }

  /**
   * Create a smooth drift transition
   */
  public static createDrift(
    targetPosition: Vector3,
    targetLookAt: Vector3,
    duration: number = 1500,
    onComplete?: () => void
  ): TransitionConfig {
    return {
      targetPosition,
      targetLookAt,
      duration,
      easing: 'easeInOutQuad',
      onComplete,
    };
  }
}
