/**
 * AssetCache — Centralized geometry/material/texture cache for Three.js
 * Prevents duplicate GPU uploads and enables sharing across scenes.
 */

import * as THREE from 'three';

type DisposableAsset = THREE.BufferGeometry | THREE.Material | THREE.Texture;

interface CacheEntry<T extends DisposableAsset> {
  asset: T;
  refCount: number;
  lastAccess: number;
}

export class AssetCache {
  private static instance: AssetCache | null = null;

  private geometries = new Map<string, CacheEntry<THREE.BufferGeometry>>();
  private materials = new Map<string, CacheEntry<THREE.Material>>();
  private textures = new Map<string, CacheEntry<THREE.Texture>>();

  // Maximum idle time before eviction (ms)
  private readonly TTL = 60_000;
  private evictionTimer: ReturnType<typeof setInterval> | null = null;

  static getInstance(): AssetCache {
    if (!AssetCache.instance) {
      AssetCache.instance = new AssetCache();
    }
    return AssetCache.instance;
  }

  constructor() {
    // Run eviction sweep every 30s
    this.evictionTimer = setInterval(() => this.evict(), 30_000);
  }

  // ── Geometry ──────────────────────────────────────────────

  getGeometry(key: string, factory: () => THREE.BufferGeometry): THREE.BufferGeometry {
    const entry = this.geometries.get(key);
    if (entry) {
      entry.refCount++;
      entry.lastAccess = Date.now();
      return entry.asset;
    }
    const geo = factory();
    this.geometries.set(key, { asset: geo, refCount: 1, lastAccess: Date.now() });
    return geo;
  }

  releaseGeometry(key: string) {
    const entry = this.geometries.get(key);
    if (entry) {
      entry.refCount = Math.max(0, entry.refCount - 1);
    }
  }

  // ── Material ──────────────────────────────────────────────

  getMaterial(key: string, factory: () => THREE.Material): THREE.Material {
    const entry = this.materials.get(key);
    if (entry) {
      entry.refCount++;
      entry.lastAccess = Date.now();
      return entry.asset;
    }
    const mat = factory();
    this.materials.set(key, { asset: mat, refCount: 1, lastAccess: Date.now() });
    return mat;
  }

  releaseMaterial(key: string) {
    const entry = this.materials.get(key);
    if (entry) {
      entry.refCount = Math.max(0, entry.refCount - 1);
    }
  }

  // ── Texture ───────────────────────────────────────────────

  getTexture(key: string, factory: () => THREE.Texture): THREE.Texture {
    const entry = this.textures.get(key);
    if (entry) {
      entry.refCount++;
      entry.lastAccess = Date.now();
      return entry.asset;
    }
    const tex = factory();
    this.textures.set(key, { asset: tex, refCount: 1, lastAccess: Date.now() });
    return tex;
  }

  releaseTexture(key: string) {
    const entry = this.textures.get(key);
    if (entry) {
      entry.refCount = Math.max(0, entry.refCount - 1);
    }
  }

  // ── Eviction ──────────────────────────────────────────────

  private evict() {
    const now = Date.now();
    const evictFrom = <T extends DisposableAsset>(map: Map<string, CacheEntry<T>>) => {
      for (const [key, entry] of map) {
        if (entry.refCount <= 0 && now - entry.lastAccess > this.TTL) {
          entry.asset.dispose();
          map.delete(key);
        }
      }
    };
    evictFrom(this.geometries);
    evictFrom(this.materials);
    evictFrom(this.textures);
  }

  // ── Stats ─────────────────────────────────────────────────

  getStats() {
    return {
      geometries: this.geometries.size,
      materials: this.materials.size,
      textures: this.textures.size,
    };
  }

  // ── Cleanup ───────────────────────────────────────────────

  disposeAll() {
    for (const [, e] of this.geometries) e.asset.dispose();
    for (const [, e] of this.materials) e.asset.dispose();
    for (const [, e] of this.textures) e.asset.dispose();
    this.geometries.clear();
    this.materials.clear();
    this.textures.clear();
    if (this.evictionTimer) clearInterval(this.evictionTimer);
    AssetCache.instance = null;
  }
}
