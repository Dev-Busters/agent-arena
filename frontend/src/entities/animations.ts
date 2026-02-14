/**
 * Animation Controller System
 * Agent Arena 3D Roguelike
 */

import * as THREE from 'three';
import {
  AnimationState,
  AnimationConfig,
  AnimationBlendState,
  DEFAULT_ANIMATION_CONFIG,
  EntityModel,
} from './types';

/**
 * Controls entity animations with smooth blending
 */
export class AnimationController {
  private currentState: AnimationState;
  private targetState: AnimationState | null = null;
  private blendState: AnimationBlendState | null = null;
  private animationTime: number = 0;
  private config: AnimationConfig;
  private entity: EntityModel;
  private onAnimationComplete?: (state: AnimationState) => void;

  constructor(
    entity: EntityModel,
    config: AnimationConfig = DEFAULT_ANIMATION_CONFIG,
    onAnimationComplete?: (state: AnimationState) => void
  ) {
    this.entity = entity;
    this.config = config;
    this.currentState = config.defaultState;
    this.onAnimationComplete = onAnimationComplete;
  }

  /**
   * Play a specific animation
   */
  playAnimation(state: AnimationState, loop: boolean = true, force: boolean = false): void {
    // Don't interrupt non-interruptible animations unless forced
    if (
      !force &&
      this.currentState !== state &&
      !this.config.interruptible.includes(this.currentState)
    ) {
      return;
    }

    if (this.currentState === state && !force) {
      return; // Already playing
    }

    // Start blend transition
    this.targetState = state;
    this.blendState = {
      fromState: this.currentState,
      toState: state,
      progress: 0,
      duration: this.config.blendDuration,
    };
  }

  /**
   * Update animation (call every frame)
   */
  update(deltaTime: number): void {
    // Handle animation blending
    if (this.blendState) {
      this.blendState.progress += deltaTime / this.blendState.duration;

      if (this.blendState.progress >= 1.0) {
        // Blend complete
        this.currentState = this.blendState.toState;
        this.blendState = null;
        this.targetState = null;
        this.animationTime = 0;
      } else {
        // Continue blending
        this.blendAnimations(this.blendState);
        return;
      }
    }

    // Update current animation
    const clip = this.entity.animations.get(this.currentState);
    if (!clip) return;

    this.animationTime += deltaTime;

    // Handle loop or completion
    if (this.animationTime >= clip.duration) {
      if (clip.loop || this.config.loopStates.includes(this.currentState)) {
        this.animationTime = 0; // Loop
      } else {
        // Animation complete
        this.animationTime = clip.duration;
        if (this.onAnimationComplete) {
          this.onAnimationComplete(this.currentState);
        }
        if (clip.onComplete) {
          clip.onComplete();
        }
        // Return to idle
        if (this.currentState !== AnimationState.IDLE) {
          this.playAnimation(AnimationState.IDLE);
        }
      }
    }

    // Apply animation
    this.applyAnimation(this.currentState, this.animationTime);
  }

  /**
   * Blend between two animations
   */
  private blendAnimations(blend: AnimationBlendState): void {
    const fromTime = this.animationTime;
    const toTime = 0;

    // Apply both animations and blend between them
    const alpha = this.easeInOutCubic(blend.progress);

    // Store original transforms
    const originalPositions = new Map<THREE.Object3D, THREE.Vector3>();
    const originalRotations = new Map<THREE.Object3D, THREE.Quaternion>();
    const originalScales = new Map<THREE.Object3D, THREE.Vector3>();

    this.entity.mesh.traverse((child) => {
      originalPositions.set(child, child.position.clone());
      originalRotations.set(child, child.quaternion.clone());
      originalScales.set(child, child.scale.clone());
    });

    // Apply from animation
    this.applyAnimation(blend.fromState, fromTime);

    // Store "from" transforms
    const fromPositions = new Map<THREE.Object3D, THREE.Vector3>();
    const fromRotations = new Map<THREE.Object3D, THREE.Quaternion>();
    const fromScales = new Map<THREE.Object3D, THREE.Vector3>();

    this.entity.mesh.traverse((child) => {
      fromPositions.set(child, child.position.clone());
      fromRotations.set(child, child.quaternion.clone());
      fromScales.set(child, child.scale.clone());
    });

    // Reset to original
    this.entity.mesh.traverse((child) => {
      child.position.copy(originalPositions.get(child)!);
      child.quaternion.copy(originalRotations.get(child)!);
      child.scale.copy(originalScales.get(child)!);
    });

    // Apply to animation
    this.applyAnimation(blend.toState, toTime);

    // Blend between from and to
    this.entity.mesh.traverse((child) => {
      const fromPos = fromPositions.get(child)!;
      const fromRot = fromRotations.get(child)!;
      const fromScale = fromScales.get(child)!;

      child.position.lerpVectors(fromPos, child.position, alpha);
      child.quaternion.slerpQuaternions(fromRot, child.quaternion, alpha);
      child.scale.lerpVectors(fromScale, child.scale, alpha);
    });
  }

  /**
   * Apply animation to entity mesh
   */
  private applyAnimation(state: AnimationState, time: number): void {
    const clip = this.entity.animations.get(state);
    if (!clip) return;

    const progress = Math.min(time / clip.duration, 1.0);

    switch (state) {
      case AnimationState.IDLE:
        this.applyIdleAnimation(progress);
        break;
      case AnimationState.WALK:
        this.applyWalkAnimation(progress);
        break;
      case AnimationState.RUN:
        this.applyRunAnimation(progress);
        break;
      case AnimationState.ATTACK:
        this.applyAttackAnimation(progress);
        break;
      case AnimationState.HIT:
        this.applyHitAnimation(progress);
        break;
      case AnimationState.DEATH:
        this.applyDeathAnimation(progress);
        break;
      default:
        this.applyIdleAnimation(progress);
    }
  }

  // Animation implementations

  private applyIdleAnimation(progress: number): void {
    // Gentle bobbing motion
    const bob = Math.sin(progress * Math.PI * 2) * 0.05;
    this.entity.mesh.position.y = bob;

    // Slight rotation sway
    const sway = Math.sin(progress * Math.PI * 2) * 0.05;
    this.entity.mesh.rotation.z = sway;
  }

  private applyWalkAnimation(progress: number): void {
    // Walking bob
    const bob = Math.abs(Math.sin(progress * Math.PI * 2)) * 0.1;
    this.entity.mesh.position.y = bob;

    // Leg swing simulation (rotate entire mesh slightly)
    const swing = Math.sin(progress * Math.PI * 2) * 0.1;
    this.entity.mesh.rotation.x = swing;
  }

  private applyRunAnimation(progress: number): void {
    // Faster, more pronounced bob
    const bob = Math.abs(Math.sin(progress * Math.PI * 4)) * 0.15;
    this.entity.mesh.position.y = bob;

    // More aggressive swing
    const swing = Math.sin(progress * Math.PI * 4) * 0.15;
    this.entity.mesh.rotation.x = swing;

    // Forward lean
    this.entity.mesh.rotation.z = 0.1;
  }

  private applyAttackAnimation(progress: number): void {
    // Lunge forward
    const lunge = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
    this.entity.mesh.position.z = lunge * 0.3;

    // Wind up and strike rotation
    const rotation = progress < 0.3 ? -progress * 2 : (progress - 0.3) * 3;
    this.entity.mesh.rotation.y = rotation;

    // Slight upward motion during attack
    const lift = Math.sin(progress * Math.PI) * 0.15;
    this.entity.mesh.position.y = lift;
  }

  private applyHitAnimation(progress: number): void {
    // Knockback
    const knockback = (1 - progress) * 0.2;
    this.entity.mesh.position.z = -knockback;

    // Flash effect (scale pulse)
    const flash = 1 + Math.sin(progress * Math.PI * 4) * 0.1;
    this.entity.mesh.scale.setScalar(this.entity.scale * flash);

    // Shake
    const shake = Math.sin(progress * Math.PI * 8) * 0.05;
    this.entity.mesh.rotation.z = shake;
  }

  private applyDeathAnimation(progress: number): void {
    // Fall and rotate
    this.entity.mesh.position.y = -progress * 0.5;
    this.entity.mesh.rotation.x = progress * Math.PI / 2;
    this.entity.mesh.rotation.z = progress * 0.5;

    // Fade out
    this.entity.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            mat.transparent = true;
            mat.opacity = 1 - progress;
          });
        } else {
          child.material.transparent = true;
          child.material.opacity = 1 - progress;
        }
      }
    });
  }

  /**
   * Easing function for smooth blending
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Get current animation state
   */
  getCurrentState(): AnimationState {
    return this.currentState;
  }

  /**
   * Check if animation is complete
   */
  isAnimationComplete(): boolean {
    const clip = this.entity.animations.get(this.currentState);
    if (!clip) return true;
    return this.animationTime >= clip.duration && !clip.loop;
  }

  /**
   * Reset animation to default state
   */
  reset(): void {
    this.currentState = this.config.defaultState;
    this.targetState = null;
    this.blendState = null;
    this.animationTime = 0;

    // Reset mesh transforms
    this.entity.mesh.position.set(0, 0, 0);
    this.entity.mesh.rotation.set(0, 0, 0);
    this.entity.mesh.scale.setScalar(this.entity.scale);

    // Reset material opacity
    this.entity.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            mat.transparent = false;
            mat.opacity = 1;
          });
        } else {
          child.material.transparent = false;
          child.material.opacity = 1;
        }
      }
    });
  }

  /**
   * Dispose animation controller
   */
  dispose(): void {
    this.blendState = null;
    this.targetState = null;
  }
}

/**
 * Create an animation controller for an entity
 */
export function createAnimationController(
  entity: EntityModel,
  config?: AnimationConfig,
  onAnimationComplete?: (state: AnimationState) => void
): AnimationController {
  return new AnimationController(entity, config, onAnimationComplete);
}
