/**
 * Socket.io Real-time Sync - Main Entry Point
 * Exports all socket utilities, types, and hooks
 */

// Socket Manager
export { SocketManager, getSocketManager, resetSocketManager } from './socketManager';

// Hooks
export {
  useSocketConnection,
  useSocketListener,
  useSocketEmit,
  useSocketSync,
  useSocketBatch,
  useSocketError,
} from './useSocketSync';

// Types
export type {
  // Event Payloads
  PlayerJoinedPayload,
  StateUpdatePayload,
  DeltaUpdatePayload,
  ActionExecutedPayload,
  CombatActionPayload,
  EnemyUpdatePayload,
  ItemAddedPayload,
  ItemEquippedPayload,
  RoomDiscoveredPayload,
  CombatStartedPayload,
  CombatEndedPayload,
  PingPayload,
  ConnectionStatePayload,
  ErrorPayload,
  ReconnectPayload,
  StateRecoveryPayload,
  // Event Map
  SocketEventMap,
  // Configuration
  SocketManagerConfig,
  EventBatch,
  DeltaState,
  ConnectionState,
  // Listeners & Emitters
  SocketEventListener,
  SocketEventEmitter,
  // Hook Return Types
  UseSocketConnectionReturn,
  UseSocketListenerOptions,
  UseSocketEmitOptions,
} from './types';

// Error Classes
export { SocketError, ConnectionError, ReconnectionError, SyncError } from './types';
