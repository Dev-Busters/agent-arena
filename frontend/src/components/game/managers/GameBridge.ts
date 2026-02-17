/**
 * GameBridge - Typed event bridge for PixiJS game ↔ React communication
 * Replaces (window as any) calls with a clean, typed interface
 */

import type { FloorMapNode } from '../floorMapGenerator';
import type { Modifier } from '../Modifier';

export type GameEventMap = {
  'modifier:select': (modifier: Modifier) => void;
  'node:select': (node: FloorMapNode) => void;
  'boss:start': () => void;
  'school:apply': (config: any, disciplines: any[], tenets: any[]) => void;
};

export class GameBridge {
  private handlers: Partial<{
    [K in keyof GameEventMap]: GameEventMap[K];
  }> = {};

  /**
   * Register a handler for an event
   */
  on<K extends keyof GameEventMap>(event: K, handler: GameEventMap[K]): void {
    this.handlers[event] = handler;
  }

  /**
   * Emit an event with typed parameters
   */
  emit<K extends keyof GameEventMap>(
    event: K,
    ...args: Parameters<GameEventMap[K]>
  ): void {
    const handler = this.handlers[event];
    if (handler) {
      (handler as Function)(...args);
    }
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers = {};
  }
}

// Global singleton instance
let gameBridgeInstance: GameBridge | null = null;

export function getGameBridge(): GameBridge {
  if (!gameBridgeInstance) {
    gameBridgeInstance = new GameBridge();
  }
  return gameBridgeInstance;
}

export function resetGameBridge(): void {
  if (gameBridgeInstance) {
    gameBridgeInstance.clear();
  }
  gameBridgeInstance = null;
}
