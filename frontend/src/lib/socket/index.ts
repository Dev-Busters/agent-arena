/**
 * Socket.io Real-time Synchronization Module
 * Central export for all socket-related functionality
 */

// Socket Manager
export { SocketManager, getSocketManager, createSocketManager } from './socketManager';

// Hooks
export { useSocketSync, useSocketConnectionStatus, useSocketCompressionStats } from './useSocketSync';

// Types
export type {
  StateDelta,
  ConnectionEvents,
  GameStateEvents,
  PlayerActionEvents,
  CombatEvents,
  DungeonEvents,
  ServerControlEvents,
  ClientSyncState,
  InterpolationState,
  EventBatch,
  CompressionStats,
  ConnectionState,
  ConnectionStatus,
  SocketConfig,
  SyncConfig,
  SocketEvent,
  SocketEventKey,
} from './types';
