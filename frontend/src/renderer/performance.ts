/**
 * Performance Monitor
 * Track FPS, frame time, draw calls, and memory usage
 */

import * as THREE from 'three';
import { PerformanceLevel } from './types';
import type { RenderStats, PerformanceWarning } from './types';

/**
 * Performance Monitor
 * Tracks rendering performance and provides real-time metrics
 */
export class PerformanceMonitor {
  private _fps = 0;
  private _frameTime = 0;
  private _frameCount = 0;
  private _lastTime = performance.now();
  private _fpsUpdateInterval = 500; // Update FPS every 500ms
  private _lastFpsUpdate = performance.now();
  
  private _renderer: THREE.WebGLRenderer | null = null;
  private _performanceWarningCallback?: (warning: PerformanceWarning) => void;
  private _lastWarningTime = 0;
  private _warningThrottle = 5000; // Only warn every 5 seconds

  constructor(renderer?: THREE.WebGLRenderer) {
    this._renderer = renderer ?? null;
  }

  /**
   * Set the renderer for draw call tracking
   */
  public setRenderer(renderer: THREE.WebGLRenderer): void {
    this._renderer = renderer;
  }

  /**
   * Update performance metrics (call once per frame)
   */
  public update(): void {
    const now = performance.now();
    const delta = now - this._lastTime;
    this._lastTime = now;

    // Update frame time
    this._frameTime = delta;
    this._frameCount++;

    // Update FPS at interval
    const timeSinceLastFpsUpdate = now - this._lastFpsUpdate;
    if (timeSinceLastFpsUpdate >= this._fpsUpdateInterval) {
      this._fps = Math.round((this._frameCount * 1000) / timeSinceLastFpsUpdate);
      this._frameCount = 0;
      this._lastFpsUpdate = now;

      // Check for performance warnings
      this._checkPerformance(now);
    }
  }

  /**
   * Check performance and emit warnings if needed
   */
  private _checkPerformance(now: number): void {
    if (!this._performanceWarningCallback) return;

    // Throttle warnings
    if (now - this._lastWarningTime < this._warningThrottle) return;

    const level = this._getPerformanceLevel(this._fps);
    
    if (level === PerformanceLevel.POOR) {
      this._performanceWarningCallback({
        level,
        fps: this._fps,
        message: `Low FPS detected: ${this._fps} FPS (< 30 FPS)`,
        timestamp: now,
      });
      this._lastWarningTime = now;
    } else if (level === PerformanceLevel.ACCEPTABLE) {
      this._performanceWarningCallback({
        level,
        fps: this._fps,
        message: `Acceptable FPS: ${this._fps} FPS (30-45 FPS)`,
        timestamp: now,
      });
      this._lastWarningTime = now;
    }
  }

  /**
   * Get performance level based on FPS
   */
  private _getPerformanceLevel(fps: number): PerformanceLevel {
    if (fps >= 55) return PerformanceLevel.EXCELLENT;
    if (fps >= 45) return PerformanceLevel.GOOD;
    if (fps >= 30) return PerformanceLevel.ACCEPTABLE;
    return PerformanceLevel.POOR;
  }

  /**
   * Get current render statistics
   */
  public getStats(): RenderStats {
    const stats: RenderStats = {
      fps: this._fps,
      frameTime: this._frameTime,
      drawCalls: 0,
      triangles: 0,
      textures: 0,
      geometries: 0,
      timestamp: performance.now(),
    };

    // Get renderer info if available
    if (this._renderer) {
      const info = this._renderer.info;
      stats.drawCalls = info.render.calls;
      stats.triangles = info.render.triangles;
      stats.textures = info.memory.textures;
      stats.geometries = info.memory.geometries;
    }

    // Get memory stats if available
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      stats.memory = {
        used: Math.round(memory.usedJSHeapSize / 1048576), // Convert to MB
        total: Math.round(memory.totalJSHeapSize / 1048576),
        limit: Math.round(memory.jsHeapSizeLimit / 1048576),
      };
    }

    return stats;
  }

  /**
   * Get current FPS
   */
  public get fps(): number {
    return this._fps;
  }

  /**
   * Get current frame time in milliseconds
   */
  public get frameTime(): number {
    return this._frameTime;
  }

  /**
   * Get performance level
   */
  public get performanceLevel(): PerformanceLevel {
    return this._getPerformanceLevel(this._fps);
  }

  /**
   * Set FPS update interval
   */
  public setFpsUpdateInterval(ms: number): void {
    this._fpsUpdateInterval = Math.max(100, ms); // Minimum 100ms
  }

  /**
   * Set performance warning callback
   */
  public onPerformanceWarning(callback: (warning: PerformanceWarning) => void): void {
    this._performanceWarningCallback = callback;
  }

  /**
   * Reset performance metrics
   */
  public reset(): void {
    this._fps = 0;
    this._frameTime = 0;
    this._frameCount = 0;
    this._lastTime = performance.now();
    this._lastFpsUpdate = performance.now();
    this._lastWarningTime = 0;
  }

  /**
   * Get formatted stats string
   */
  public getFormattedStats(): string {
    const stats = this.getStats();
    let output = `FPS: ${stats.fps} | Frame Time: ${stats.frameTime.toFixed(2)}ms`;
    
    if (this._renderer) {
      output += ` | Draws: ${stats.drawCalls} | Tris: ${stats.triangles}`;
    }

    if (stats.memory) {
      output += ` | Memory: ${stats.memory.used}MB / ${stats.memory.total}MB`;
    }

    return output;
  }

  /**
   * Log stats to console
   */
  public logStats(): void {
    console.log(this.getFormattedStats());
  }
}

/**
 * Simple FPS counter for quick integration
 */
export class FPSCounter {
  private _monitor: PerformanceMonitor;

  constructor() {
    this._monitor = new PerformanceMonitor();
  }

  /**
   * Update FPS counter (call once per frame)
   */
  public update(): void {
    this._monitor.update();
  }

  /**
   * Get current FPS
   */
  public get fps(): number {
    return this._monitor.fps;
  }

  /**
   * Get current frame time
   */
  public get frameTime(): number {
    return this._monitor.frameTime;
  }
}

/**
 * Create a performance monitor with renderer
 */
export function createPerformanceMonitor(
  renderer?: THREE.WebGLRenderer
): PerformanceMonitor {
  return new PerformanceMonitor(renderer);
}
