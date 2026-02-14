/**
 * Network Optimization Type Definitions
 * Provides comprehensive typing for network monitoring and optimization
 */

/**
 * Compression algorithm types
 */
export type CompressionAlgorithm = 'delta' | 'none';

/**
 * Network statistics interface
 * Tracks performance metrics for bandwidth optimization
 */
export interface NetworkStats {
  bandwidth: number; // bytes per second
  latency: number; // milliseconds
  packetLoss: number; // 0-1 (percentage)
  compressionRatio: number; // 0-1 (compressed/original)
  timestamp: number; // Date.now()
}

/**
 * Compressed payload format
 * Contains only changed properties for delta compression
 */
export interface CompressedPayload<T = Record<string, any>> {
  id?: string;
  timestamp: number;
  algorithm: CompressionAlgorithm;
  compressed: boolean;
  originalSize: number;
  compressedSize: number;
  data: Partial<T>; // Only changed properties
  checksum?: string;
}

/**
 * Configuration for network optimization
 */
export interface OptimizationConfig {
  enableCompression: boolean;
  enableThrottling: boolean;
  compressionAlgorithm: CompressionAlgorithm;
  throttleInterval: number; // milliseconds
  maxBandwidth?: number; // bytes per second
  monitoringEnabled: boolean;
}

/**
 * Throttle configuration
 */
export interface ThrottleConfig {
  interval: number; // milliseconds (default 16ms for 60 FPS)
  leading?: boolean; // execute on leading edge
  trailing?: boolean; // execute on trailing edge
  maxWait?: number; // maximum wait time before forced execution
}

/**
 * Network event for monitoring
 */
export interface NetworkEvent {
  type: 'send' | 'receive' | 'error';
  size: number; // bytes
  timestamp: number;
  duration?: number; // milliseconds
  compressed?: boolean;
}

/**
 * Throttled/Debounced function type
 */
export type ThrottledFunction<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => ReturnType<T> | undefined;
