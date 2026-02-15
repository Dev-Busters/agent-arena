/**
 * Entity Interpolation for Agent Arena
 * Smoothly interpolates entity positions between server updates
 * Handles network jitter and lag compensation
 */

import * as THREE from 'three';

export interface EntitySnapshot {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  timestamp: number;
}

export class EntityInterpolation {
  private snapshots: EntitySnapshot[] = [];
  private interpolationDelay = 100; // ms (render-delay for smooth interpolation)
  private maxSnapshotAge = 1000; // ms
  
  /**
   * Add a new snapshot from server
   */
  addSnapshot(position: THREE.Vector3, velocity: THREE.Vector3, timestamp: number): void {
    this.snapshots.push({
      position: position.clone(),
      velocity: velocity.clone(),
      timestamp,
    });
    
    // Keep snapshots sorted by timestamp
    this.snapshots.sort((a, b) => a.timestamp - b.timestamp);
    
    // Cleanup old snapshots
    const cutoffTime = timestamp - this.maxSnapshotAge;
    this.snapshots = this.snapshots.filter((s) => s.timestamp >= cutoffTime);
  }
  
  /**
   * Get interpolated position at current render time
   */
  getInterpolatedPosition(renderTime: number): THREE.Vector3 | null {
    if (this.snapshots.length < 2) {
      // Not enough data, return latest if available
      return this.snapshots[0]?.position.clone() || null;
    }
    
    // Interpolate slightly in the past for smooth rendering
    const interpolationTime = renderTime - this.interpolationDelay;
    
    // Find the two snapshots to interpolate between
    let before: EntitySnapshot | null = null;
    let after: EntitySnapshot | null = null;
    
    for (let i = 0; i < this.snapshots.length - 1; i++) {
      if (
        this.snapshots[i].timestamp <= interpolationTime &&
        this.snapshots[i + 1].timestamp >= interpolationTime
      ) {
        before = this.snapshots[i];
        after = this.snapshots[i + 1];
        break;
      }
    }
    
    // If no valid range found, use the latest snapshot
    if (!before || !after) {
      return this.snapshots[this.snapshots.length - 1].position.clone();
    }
    
    // Linear interpolation between snapshots
    const timeDiff = after.timestamp - before.timestamp;
    const t = (interpolationTime - before.timestamp) / timeDiff;
    
    const interpolatedPosition = new THREE.Vector3().lerpVectors(
      before.position,
      after.position,
      t
    );
    
    return interpolatedPosition;
  }
  
  /**
   * Get extrapolated position (predict forward based on velocity)
   * Used when server updates are delayed
   */
  getExtrapolatedPosition(renderTime: number): THREE.Vector3 | null {
    if (this.snapshots.length === 0) return null;
    
    const latest = this.snapshots[this.snapshots.length - 1];
    const timeSinceUpdate = renderTime - latest.timestamp;
    
    // Don't extrapolate too far (would look weird)
    if (timeSinceUpdate > 500) {
      return latest.position.clone();
    }
    
    // Predict position based on velocity
    const extrapolatedPosition = latest.position
      .clone()
      .add(latest.velocity.clone().multiplyScalar(timeSinceUpdate / 1000));
    
    return extrapolatedPosition;
  }
  
  /**
   * Set interpolation delay (higher = smoother but more lag)
   */
  setInterpolationDelay(delayMs: number): void {
    this.interpolationDelay = Math.max(0, Math.min(500, delayMs));
  }
  
  /**
   * Clear all snapshots (e.g., entity removed)
   */
  clear(): void {
    this.snapshots = [];
  }
  
  /**
   * Get number of buffered snapshots
   */
  getSnapshotCount(): number {
    return this.snapshots.length;
  }
}

/**
 * Manages interpolation for multiple entities
 */
export class EntityInterpolationManager {
  private entities: Map<string, EntityInterpolation> = new Map();
  
  /**
   * Add or update entity snapshot
   */
  updateEntity(
    entityId: string,
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    timestamp: number
  ): void {
    let interpolator = this.entities.get(entityId);
    if (!interpolator) {
      interpolator = new EntityInterpolation();
      this.entities.set(entityId, interpolator);
    }
    interpolator.addSnapshot(position, velocity, timestamp);
  }
  
  /**
   * Get interpolated position for entity
   */
  getEntityPosition(entityId: string, renderTime: number): THREE.Vector3 | null {
    const interpolator = this.entities.get(entityId);
    return interpolator?.getInterpolatedPosition(renderTime) || null;
  }
  
  /**
   * Remove entity interpolator
   */
  removeEntity(entityId: string): void {
    this.entities.delete(entityId);
  }
  
  /**
   * Clear all entities
   */
  clear(): void {
    this.entities.clear();
  }
  
  /**
   * Get statistics for monitoring
   */
  getStats(): { entityCount: number; avgSnapshots: number } {
    let totalSnapshots = 0;
    for (const interpolator of this.entities.values()) {
      totalSnapshots += interpolator.getSnapshotCount();
    }
    
    return {
      entityCount: this.entities.size,
      avgSnapshots: this.entities.size > 0 ? totalSnapshots / this.entities.size : 0,
    };
  }
}
