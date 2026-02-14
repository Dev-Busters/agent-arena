/**
 * Network Monitoring & Analytics
 * Tracks bandwidth, latency, and compression efficiency
 */

import { NetworkStats, NetworkEvent } from './types';

/**
 * Network monitoring class
 * Tracks real-time performance metrics
 */
export class NetworkMonitor {
  private events: NetworkEvent[] = [];
  private windowSize: number; // Keep last N events
  private startTime: number;
  private totalBytesIn: number = 0;
  private totalBytesOut: number = 0;
  private latencies: number[] = [];

  constructor(windowSize: number = 1000) {
    this.windowSize = windowSize;
    this.startTime = Date.now();
  }

  /**
   * Record a network event
   */
  recordEvent(event: NetworkEvent): void {
    this.events.push(event);

    // Keep window size bounded
    if (this.events.length > this.windowSize) {
      this.events.shift();
    }

    // Track statistics
    if (event.type === 'send') {
      this.totalBytesOut += event.size;
    } else if (event.type === 'receive') {
      this.totalBytesIn += event.size;
    }

    if (event.duration) {
      this.latencies.push(event.duration);
      if (this.latencies.length > this.windowSize) {
        this.latencies.shift();
      }
    }
  }

  /**
   * Get current network statistics
   */
  getStats(): NetworkStats {
    const now = Date.now();
    const elapsedSeconds = (now - this.startTime) / 1000;

    // Calculate average bandwidth over last 10 seconds
    const tenSecondsAgo = now - 10000;
    const recentEvents = this.events.filter((e) => e.timestamp > tenSecondsAgo);

    const recentBytesIn = recentEvents
      .filter((e) => e.type === 'receive')
      .reduce((sum, e) => sum + e.size, 0);

    const recentBytesOut = recentEvents
      .filter((e) => e.type === 'send')
      .reduce((sum, e) => sum + e.size, 0);

    const bandwidthIn = recentBytesIn / 10;
    const bandwidthOut = recentBytesOut / 10;
    const totalBandwidth = bandwidthIn + bandwidthOut;

    // Calculate average latency
    const avgLatency =
      this.latencies.length > 0
        ? this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length
        : 0;

    // Calculate compression ratio
    const compressedEvents = recentEvents.filter((e) => e.compressed);
    const compressionRatio =
      recentEvents.length > 0
        ? compressedEvents.length / recentEvents.length
        : 0;

    // Calculate packet loss (estimate from errors)
    const errorEvents = recentEvents.filter((e) => e.type === 'error');
    const packetLoss = recentEvents.length > 0 ? errorEvents.length / recentEvents.length : 0;

    return {
      bandwidth: totalBandwidth,
      latency: avgLatency,
      packetLoss,
      compressionRatio,
      timestamp: now,
    };
  }

  /**
   * Get detailed stats including historical data
   */
  getDetailedStats() {
    const stats = this.getStats();
    const now = Date.now();

    // Latency percentiles
    const sortedLatencies = [...this.latencies].sort((a, b) => a - b);
    const p50 = sortedLatencies[Math.floor(sortedLatencies.length * 0.5)] || 0;
    const p95 = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] || 0;
    const p99 = sortedLatencies[Math.floor(sortedLatencies.length * 0.99)] || 0;

    return {
      ...stats,
      eventCount: this.events.length,
      totalBytesIn: this.totalBytesIn,
      totalBytesOut: this.totalBytesOut,
      uptime: now - this.startTime,
      latencyP50: p50,
      latencyP95: p95,
      latencyP99: p99,
    };
  }

  /**
   * Get events in a time range
   */
  getEventsByTimeRange(startTime: number, endTime: number): NetworkEvent[] {
    return this.events.filter((e) => e.timestamp >= startTime && e.timestamp <= endTime);
  }

  /**
   * Reset statistics
   */
  reset(): void {
    this.events = [];
    this.latencies = [];
    this.totalBytesIn = 0;
    this.totalBytesOut = 0;
    this.startTime = Date.now();
  }

  /**
   * Clear old events (older than specified age in ms)
   */
  cleanup(maxAge: number = 60000): void {
    const cutoff = Date.now() - maxAge;
    this.events = this.events.filter((e) => e.timestamp > cutoff);
  }

  /**
   * Export statistics for analytics
   */
  export(): Record<string, any> {
    return {
      stats: this.getDetailedStats(),
      events: this.events,
      timestamp: Date.now(),
    };
  }
}

/**
 * Global network monitor instance
 */
let globalMonitor: NetworkMonitor | null = null;

/**
 * Get or create global monitor
 */
export function getNetworkMonitor(): NetworkMonitor {
  if (!globalMonitor) {
    globalMonitor = new NetworkMonitor();
  }
  return globalMonitor;
}

/**
 * Reset global monitor
 */
export function resetNetworkMonitor(): void {
  if (globalMonitor) {
    globalMonitor.reset();
  }
}
