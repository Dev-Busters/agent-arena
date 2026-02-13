/**
 * ObjectPool — Generic pool to avoid GC pressure from frequent allocations.
 * Used for particles, damage numbers, temporary Vector3s, etc.
 */

export class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset: (obj: T) => void;
  private maxSize: number;

  constructor(
    factory: () => T,
    reset: (obj: T) => void,
    initialSize: number = 0,
    maxSize: number = 500
  ) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;

    // Pre-warm
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  /** Acquire an object from the pool (or create one) */
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  /** Return an object to the pool */
  release(obj: T) {
    this.reset(obj);
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
  }

  /** Current pool size (available objects) */
  get available(): number {
    return this.pool.length;
  }

  /** Drain the pool */
  clear() {
    this.pool.length = 0;
  }
}

// ── Pre-built pools for common Three.js temporaries ─────────

import * as THREE from 'three';

export const vec3Pool = new ObjectPool<THREE.Vector3>(
  () => new THREE.Vector3(),
  (v) => v.set(0, 0, 0),
  20,
  100
);

export const mat4Pool = new ObjectPool<THREE.Matrix4>(
  () => new THREE.Matrix4(),
  (m) => m.identity(),
  10,
  50
);
