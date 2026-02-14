/**
 * Simplified Ragdoll Physics
 * Agent Arena 3D Roguelike
 */

import * as THREE from 'three';
import { RagdollState, EntityModel } from './types';

/**
 * Simplified ragdoll physics controller for death animations
 */
export class RagdollController {
  private state: RagdollState;
  private entity: EntityModel;
  private duration: number = 2.0; // Total ragdoll duration
  private startTime: number = 0;
  private initialPosition: THREE.Vector3;

  constructor(entity: EntityModel) {
    this.entity = entity;
    this.initialPosition = entity.mesh.position.clone();
    this.state = {
      active: false,
      velocity: new THREE.Vector3(),
      angularVelocity: new THREE.Vector3(),
      fadeProgress: 0,
    };
  }

  /**
   * Activate ragdoll physics with optional impulse
   */
  activate(impulse?: THREE.Vector3): void {
    if (this.state.active) return;

    this.state.active = true;
    this.startTime = Date.now() / 1000;
    this.initialPosition = this.entity.mesh.position.clone();

    // Set initial velocity from impulse or random
    if (impulse) {
      this.state.velocity.copy(impulse);
    } else {
      // Random death velocity
      this.state.velocity.set(
        (Math.random() - 0.5) * 2.0,
        Math.random() * 2.0 + 1.0, // Upward component
        (Math.random() - 0.5) * 2.0
      );
    }

    // Random angular velocity for tumbling
    this.state.angularVelocity.set(
      (Math.random() - 0.5) * 3.0,
      (Math.random() - 0.5) * 3.0,
      (Math.random() - 0.5) * 3.0
    );
  }

  /**
   * Update ragdoll physics
   */
  update(deltaTime: number): void {
    if (!this.state.active) return;

    const currentTime = Date.now() / 1000;
    const elapsed = currentTime - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1.0);

    // Apply gravity
    this.state.velocity.y -= 9.8 * deltaTime;

    // Apply velocity to position
    this.entity.mesh.position.x += this.state.velocity.x * deltaTime;
    this.entity.mesh.position.y += this.state.velocity.y * deltaTime;
    this.entity.mesh.position.z += this.state.velocity.z * deltaTime;

    // Floor collision (simple)
    if (this.entity.mesh.position.y < 0) {
      this.entity.mesh.position.y = 0;
      this.state.velocity.y *= -0.3; // Bounce with damping
      this.state.velocity.x *= 0.7; // Friction
      this.state.velocity.z *= 0.7;

      // Reduce angular velocity on impact
      this.state.angularVelocity.multiplyScalar(0.7);
    }

    // Apply angular velocity to rotation
    this.entity.mesh.rotation.x += this.state.angularVelocity.x * deltaTime;
    this.entity.mesh.rotation.y += this.state.angularVelocity.y * deltaTime;
    this.entity.mesh.rotation.z += this.state.angularVelocity.z * deltaTime;

    // Apply damping
    this.state.velocity.multiplyScalar(0.98);
    this.state.angularVelocity.multiplyScalar(0.95);

    // Fade out
    this.state.fadeProgress = progress;
    this.applyFade(progress);

    // Deactivate when complete
    if (progress >= 1.0) {
      this.deactivate();
    }
  }

  /**
   * Apply fade effect
   */
  private applyFade(progress: number): void {
    // Fade starts at 50% progress
    const fadeStart = 0.5;
    const fadeProgress = Math.max(0, (progress - fadeStart) / (1 - fadeStart));

    this.entity.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            mat.transparent = true;
            mat.opacity = 1 - fadeProgress;
          });
        } else {
          child.material.transparent = true;
          child.material.opacity = 1 - fadeProgress;
        }
      }
    });
  }

  /**
   * Deactivate ragdoll
   */
  deactivate(): void {
    this.state.active = false;
    this.state.velocity.set(0, 0, 0);
    this.state.angularVelocity.set(0, 0, 0);
    this.state.fadeProgress = 1.0;
  }

  /**
   * Reset ragdoll to initial state
   */
  reset(): void {
    this.deactivate();
    this.entity.mesh.position.copy(this.initialPosition);
    this.entity.mesh.rotation.set(0, 0, 0);
    this.state.fadeProgress = 0;

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
   * Check if ragdoll is active
   */
  isActive(): boolean {
    return this.state.active;
  }

  /**
   * Check if ragdoll is complete
   */
  isComplete(): boolean {
    return this.state.fadeProgress >= 1.0;
  }

  /**
   * Get current state
   */
  getState(): RagdollState {
    return { ...this.state };
  }

  /**
   * Apply impulse to ragdoll
   */
  applyImpulse(impulse: THREE.Vector3): void {
    if (this.state.active) {
      this.state.velocity.add(impulse);
    }
  }

  /**
   * Dispose ragdoll controller
   */
  dispose(): void {
    this.deactivate();
  }
}

/**
 * Create a ragdoll controller for an entity
 */
export function createRagdollController(entity: EntityModel): RagdollController {
  return new RagdollController(entity);
}

/**
 * Helper: Create death impulse from direction
 */
export function createDeathImpulse(
  direction: THREE.Vector3,
  force: number = 3.0
): THREE.Vector3 {
  const impulse = direction.clone().normalize();
  impulse.y = Math.abs(impulse.y) + 0.5; // Always have upward component
  impulse.multiplyScalar(force);
  return impulse;
}
