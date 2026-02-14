/**
 * Delta Compression Utilities
 * Reduces bandwidth by sending only changed properties
 */

import { CompressedPayload } from './types';

/**
 * Deep equality check for primitive values
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) => deepEqual(a[key], b[key]));
}

/**
 * Get only changed properties between old and new objects
 * Supports nested objects
 */
function getDelta(
  oldObj: Record<string, any>,
  newObj: Record<string, any>
): Record<string, any> {
  const delta: Record<string, any> = {};

  for (const key in newObj) {
    if (!(key in oldObj) || !deepEqual(oldObj[key], newObj[key])) {
      delta[key] = newObj[key];
    }
  }

  // Check for deleted properties
  for (const key in oldObj) {
    if (!(key in newObj)) {
      delta[key] = undefined;
    }
  }

  return delta;
}

/**
 * Compress object changes using delta encoding
 * Only includes properties that have changed
 *
 * @param newData - Current state
 * @param previousData - Previous state (optional, default empty object)
 * @returns Compressed payload with only changed properties
 */
export function compressDelta<T extends Record<string, any>>(
  newData: T,
  previousData?: T
): CompressedPayload<T> {
  const prev = previousData || ({} as T);
  const delta = getDelta(prev, newData);

  const originalJson = JSON.stringify(newData);
  const compressedJson = JSON.stringify(delta);

  const originalSize = new Blob([originalJson]).size;
  const compressedSize = new Blob([compressedJson]).size;

  return {
    timestamp: Date.now(),
    algorithm: 'delta',
    compressed: Object.keys(delta).length < Object.keys(newData).length,
    originalSize,
    compressedSize,
    data: delta as Partial<T>,
  };
}

/**
 * Restore full object from delta compressed payload
 * Merges delta with previous state to reconstruct complete object
 *
 * @param delta - Compressed delta payload
 * @param previousData - Previous complete state
 * @returns Reconstructed full object
 */
export function decompressDelta<T extends Record<string, any>>(
  delta: Partial<T>,
  previousData: T
): T {
  const result = { ...previousData };

  for (const [key, value] of Object.entries(delta)) {
    if (value === undefined) {
      delete result[key as keyof T];
    } else {
      result[key as keyof T] = value;
    }
  }

  return result;
}

/**
 * Calculate compression ratio
 * Returns ratio of compressed size to original size (0-1)
 * Lower values = better compression
 *
 * @param originalSize - Original byte size
 * @param compressedSize - Compressed byte size
 * @returns Compression ratio (0-1)
 */
export function calculateCompressionRatio(
  originalSize: number,
  compressedSize: number
): number {
  if (originalSize === 0) return 0;
  return Math.min(1, compressedSize / originalSize);
}

/**
 * Measure bandwidth savings from compression
 * @returns Percentage saved (0-100)
 */
export function calculateBandwidthSavings(
  originalSize: number,
  compressedSize: number
): number {
  if (originalSize === 0) return 0;
  return Math.max(0, (1 - compressedSize / originalSize) * 100);
}

/**
 * Create a checksum for integrity verification
 * Simple hash for detecting corruption
 */
export function createChecksum(data: Record<string, any>): string {
  const json = JSON.stringify(data);
  let hash = 0;

  for (let i = 0; i < json.length; i++) {
    const char = json.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(16);
}

/**
 * Batch compress multiple payloads
 * Efficient for sending multiple deltas in one message
 */
export function compressBatch<T extends Record<string, any>>(
  items: Array<{ current: T; previous?: T }>
): CompressedPayload<T>[] {
  return items.map((item) => compressDelta(item.current, item.previous));
}
