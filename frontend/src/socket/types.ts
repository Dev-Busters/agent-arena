/**
 * Socket.io Event Type Definitions for Agent Arena
 * Type-safe event emitters and listeners for real-time synchronization
 */

import type {
  Agent,
  Dungeon,
  DungeonSession,
  Enemy,
  Item,
  CombatAction,
  StatusEffect,
  Vector3,
  NetworkState,
} from '../zustand/types';

// ============================================================================
// SOCKET EVENT PAYLOAD TYPES
// ============================================================================

/**
 * Player joined the arena
 */
export interface PlayerJoinedPayload {
  playerId: string;
  playerName: string;
  agentId: string;
  timestamp: number;
}

/**
 * Full state synchronization
 */
export interface StateUpdatePayload {
  agent?: Agent;
  dungeon?: Dungeon;
  dungeonSession?: DungeonSession;
  networkState?: NetworkState;
  timestamp: number;
}

/**
 * Delta state update - only changed properties
 */
export interface DeltaUpdatePayload {
  agentId: string;
  changes: Record<string, any>;
  timestamp: number;
}

/**
 * Action executed in game
 */
export interface ActionExecutedPayload {
  agentId: string;
  actionType: 'attack' | 'ability' | 'defend' | 'item' | 'move';
  targetId?: string;
  data?: Record<string, any>;
  timestamp: number;
}

/**
 * Combat action performed
 */
export interface CombatActionPayload extends CombatAction {
  clientId: string;
  sequenceNum: number;
}

/**
 * Enemy state update
 */
export interface EnemyUpdatePayload {
  roomId: number;
  enemies: Enemy[];
  timestamp: number;
}

/**
 * Inventory item added
 */
export interface ItemAddedPayload {
  item: Item;
  quantity: number;
  agentId: string;
  timestamp: number;
}

/**
 * Item equipped
 */
export interface ItemEquippedPayload {
  agentId: string;
  itemId: string;
  slot: string;
  timestamp: number;
}

/**
 * Room discovered
 */
export interface RoomDiscoveredPayload {
  roomId: number;
  dungeonId: string;
  timestamp: number;
}

/**
 * Combat started
 */
export interface CombatStartedPayload {
  dungeonId: string;
  roomId: number;
  enemies: Enemy[];
  timestamp: number;
}

/**
 * Combat ended
 */
export interface CombatEndedPayload {
  dungeonId: string;
  victorious: boolean;
  xpGained: number;
  lootDropped: Item[];
  timestamp: number;
}

/**
 * Latency measurement ping
 */
export interface PingPayload {
  clientTimestamp: number;
  serverTimestamp?: number;
}

/**
 * Connection state changed
 */
export interface ConnectionStatePayload {
  isConnected: boolean;
  reason?: string;
  timestamp: number;
}

/**
 * Error event from server
 */
export interface ErrorPayload {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: number;
}

/**
 * Reconnection with state recovery
 */
export interface ReconnectPayload {
  clientId: string;
  lastSequenceNum: number;
  timestamp: number;
}

/**
 * State recovery after reconnection
 */
export interface StateRecoveryPayload {
  agent: Agent;
  dungeon?: Dungeon;
  dungeonSession?: DungeonSession;
  missedActions?: CombatActionPayload[];
  timestamp: number;
}

// ============================================================================
// SOCKET EVENT DEFINITIONS
// ============================================================================

export interface SocketEventMap {
  // Connection events
  'connect': void;
  'disconnect': ConnectionStatePayload;
  'reconnect': ReconnectPayload;
  'reconnect_error': ErrorPayload;
  'connect_error': ErrorPayload;

  // Player events
  'player:joined': PlayerJoinedPayload;
  'player:left': { playerId: string; timestamp: number };

  // State synchronization
  'state:update': StateUpdatePayload;
  'state:delta': DeltaUpdatePayload;
  'state:recovery': StateRecoveryPayload;

  // Action events
  'action:execute': ActionExecutedPayload;
  'action:confirmed': { actionId: string; timestamp: number };

  // Combat events
  'combat:started': CombatStartedPayload;
  'combat:action': CombatActionPayload;
  'combat:ended': CombatEndedPayload;
  'enemy:updated': EnemyUpdatePayload;

  // Inventory events
  'inventory:item-added': ItemAddedPayload;
  'inventory:item-removed': { agentId: string; itemId: string; timestamp: number };
  'inventory:item-equipped': ItemEquippedPayload;

  // Room & dungeon events
  'room:discovered': RoomDiscoveredPayload;
  'dungeon:level-up': { dungeonId: string; newFloor: number; timestamp: number };

  // Network monitoring
  'network:ping': PingPayload;
  'network:pong': PingPayload;
  'network:latency': { latency: number; timestamp: number };

  // Errors
  'error': ErrorPayload;
}

// ============================================================================
// SOCKET MANAGER CONFIGURATION TYPES
// ============================================================================

export interface SocketManagerConfig {
  url?: string;
  reconnection?: boolean;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  reconnectionAttempts?: number;
  autoConnect?: boolean;
  transports?: string[];
}

/**
 * Event batch for network optimization
 */
export interface EventBatch {
  clientId: string;
  sequenceNum: number;
  events: Array<{
    name: keyof SocketEventMap;
    payload: any;
    timestamp: number;
  }>;
  timestamp: number;
}

/**
 * Delta compression state
 */
export interface DeltaState {
  agent?: Partial<Agent>;
  dungeon?: Partial<Dungeon>;
  dungeonSession?: Partial<DungeonSession>;
  lastTimestamp: number;
}

/**
 * Socket connection state
 */
export interface ConnectionState {
  isConnected: boolean;
  clientId: string | null;
  latency: number;
  reconnecting: boolean;
  reconnectAttempts: number;
  lastMessageTime: number;
  lastSyncTime: number;
}

/**
 * Socket event listener type
 */
export type SocketEventListener<T extends keyof SocketEventMap> = (
  payload: SocketEventMap[T]
) => void | Promise<void>;

/**
 * Socket event emitter type
 */
export type SocketEventEmitter<T extends keyof SocketEventMap> = (
  payload: SocketEventMap[T]
) => Promise<void>;

// ============================================================================
// HOOK TYPES
// ============================================================================

export interface UseSocketConnectionReturn {
  isConnected: boolean;
  clientId: string | null;
  latency: number;
  reconnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

export interface UseSocketListenerOptions {
  immediate?: boolean;
  autoRemove?: boolean;
}

export interface UseSocketEmitOptions {
  batch?: boolean;
  compress?: boolean;
  priority?: 'low' | 'normal' | 'high';
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class SocketError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'SocketError';
  }
}

export class ConnectionError extends SocketError {
  constructor(message: string, details?: Record<string, any>) {
    super('CONNECTION_ERROR', message, details);
    this.name = 'ConnectionError';
  }
}

export class ReconnectionError extends SocketError {
  constructor(message: string, details?: Record<string, any>) {
    super('RECONNECTION_ERROR', message, details);
    this.name = 'ReconnectionError';
  }
}

export class SyncError extends SocketError {
  constructor(message: string, details?: Record<string, any>) {
    super('SYNC_ERROR', message, details);
    this.name = 'SyncError';
  }
}
