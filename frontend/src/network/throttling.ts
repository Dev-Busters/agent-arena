/**
 * Network Throttling & Request Rate Limiting
 * Optimizes real-time game communication
 */

import { ThrottleConfig, ThrottledFunction } from './types';

/**
 * Throttle a function to execute at most once per interval
 * Perfect for high-frequency events (mouse movement, game state updates)
 *
 * @param fn - Function to throttle
 * @param interval - Minimum milliseconds between executions (default 16ms for 60 FPS)
 * @param config - Additional throttle configuration
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  interval: number = 16,
  config: Partial<ThrottleConfig> = {}
): ThrottledFunction<T> {
  let lastCall = 0;
  let lastResult: any;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: any[] | null = null;

  const { leading = true, trailing = true, maxWait = interval * 10 } = config;

  return function (...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    // Leading edge execution
    if (leading && timeSinceLastCall >= interval && !timeoutId) {
      lastCall = now;
      lastResult = fn(...args);
      return lastResult;
    }

    // Schedule trailing edge execution
    if (trailing) {
      pendingArgs = args;

      // Clear existing timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Set new timeout for trailing execution
      timeoutId = setTimeout(() => {
        if (pendingArgs) {
          lastCall = Date.now();
          lastResult = fn(...pendingArgs);
        }
        timeoutId = null;
        pendingArgs = null;
      }, Math.max(0, interval - timeSinceLastCall));
    }

    return lastResult;
  };
}

/**
 * Debounce a function to delay execution until action stops
 * Ideal for user input (search, form submission)
 *
 * @param fn - Function to debounce
 * @param delay - Milliseconds to wait after last call (default 300ms)
 * @returns Debounced function with cancel() method
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): ThrottledFunction<T> & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);

    return undefined;
  } as ThrottledFunction<T> & { cancel: () => void };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * RequestAnimationFrame-based throttle for smooth visual updates
 * Synchronizes with browser refresh rate (60 FPS default)
 *
 * @param fn - Function to throttle
 * @param fps - Target frames per second (default 60)
 * @returns Throttled function
 */
export function throttleRAF<T extends (...args: any[]) => any>(
  fn: T,
  fps: number = 60
): ThrottledFunction<T> {
  const interval = 1000 / fps;
  let frameId: number | null = null;
  let lastCall = 0;
  let lastResult: any;
  let pendingArgs: any[] | null = null;

  return function (...args: Parameters<T>) {
    const now = Date.now();
    pendingArgs = args;

    if (now - lastCall >= interval) {
      lastCall = now;
      lastResult = fn(...args);
    } else if (!frameId) {
      frameId = requestAnimationFrame(() => {
        if (pendingArgs) {
          lastCall = Date.now();
          lastResult = fn(...pendingArgs);
        }
        frameId = null;
        pendingArgs = null;
      });
    }

    return lastResult;
  };
}

/**
 * Request queue for batching network requests
 * Reduces number of individual network calls
 */
export class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private batchDelay: number;

  constructor(batchDelay: number = 50) {
    this.batchDelay = batchDelay;
  }

  /**
   * Add a request to the queue
   */
  add(request: () => Promise<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  /**
   * Process queued requests in batches
   */
  private processQueue(): void {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    setTimeout(async () => {
      const batch = this.queue.splice(0, 10); // Process 10 at a time

      await Promise.all(batch.map((req) => req().catch(() => null)));

      this.processing = false;

      if (this.queue.length > 0) {
        this.processQueue();
      }
    }, this.batchDelay);
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }
}
