/**
 * Socket.io Real-time Synchronization Types
 * Type definitions for network events and state sync
 */

import type { Agent, Dungeon, Enemy, Item } from '@/zustand';

// ============================================================================
// STATE DELTA TYPES
// ============================================================================

/**
 * Delta represents only the changed properties (for compression)
 * Null/undefined values are omitted in transmission
 */
export interface StateDelta {
  agentId?: string;
  agentStats?: Partial<{
    level: number;
    health: number;
    maxHealth: number;
    mana: number;
    maxMana: number;
    attack: number;
    defense: number;
    speed: number;
    critChance: number;
    dodgeChance: number;
  }>;
  agentPosition?: {
    x: number;
    y: number;
    z: number;
  };
  dungeonState?: Partial<{
    currentFloor: number;
    currentRoomId: number;
    elapsedTime: number;
    goldCollected: number;
    xpGained: number;
  }>;
  inventory?: {
    items?: Array<{ itemId: string; quantity: number }>;
    gold?: number;
  };
  statusEffects?: Array<{
    type: string;
    duration: number;
    potency: number;
  }>;
  enemies?: Array<{
    id: string;
    health: number;
    position: { x: number; y: number; z: number };
  }>;
  timestamp: number;
  sequenceNumber: number;
}

// ============================================================================
// SOCKET EVENT TYPES
// ============================================================================

/**
 * Connection Events
 */
export interface ConnectionEvents {
  'socket:connect': {
    clientId: string;
    timestamp: number;
  };
  'socket:disconnect': {
    clientId: string;
    reason: string;
  };
  'socket:reconnect': {
    clientId: string;
    attemptNumber: number;
  };
  'socket:error': {
    error: string;
    code?: string;
  };
}

/**
 * Game State Sync Events
 */
export interface GameStateEvents {
  'game:sync-request': {
    clientId: string;
    lastSequenceNumber: number;
  };
  'game:sync-response': {
    deltas: StateDelta[];
    fullState?: {
      agent: Agent;
      dungeon: Dungeon | null;
    };
    serverTimestamp: number;
  };
  'game:state-delta': StateDelta;
  'game:state-batch': {
    deltas: StateDelta[];
    batchSize: number;
  };
}

/**
 * Player Action Events
 */
export interface PlayerActionEvents {
  'player:move': {
    agentId: string;
    position: { x: number; y: number; z: number };
    direction: { x: number; y: number; z: number };
  };
  'player:attack': {
    agentId: string;
    targetId: string;
    abilityId?: string;
    timestamp: number;
  };
  'player:use-ability': {
    agentId: string;
    abilityId: string;
    targetPosition?: { x: number; y: number; z: number };
  };
  'player:equip-item': {
    agentId: string;
    itemId: string;
    slot: string;
  };
  'player:consume-item': {
    agentId: string;
    itemId: string;
  };
}

/**
 * Combat Events
 */
export interface CombatEvents {
  'combat:start': {
    agentId: string;
    enemies: Enemy[];
    roomId: number;
  };
  'combat:end': {
    agentId: string;
    victory: boolean;
    rewards: {
      xp: number;
      gold: number;
      items: Item[];
    };
  };
  'combat:action': {
    sourceId: string;
    targetId: string;
    actionType: 'attack' | 'ability' | 'defend';
    damage?: number;
    effects?: Array<{ type: string; duration: number }>;
  };
  'combat:enemy-action': {
    enemyId: string;
    actionType: string;
    targetId: string;
    damage?: number;
  };
}

/**
 * Room & Dungeon Events
 */
export interface DungeonEvents {
  'dungeon:room-enter': {
    agentId: string;
    roomId: number;
    roomType: string;
  };
  'dungeon:room-discover': {
    agentId: string;
    roomId: number;
  };
  'dungeon:loot-found': {
    roomId: number;
    item: Item;
    position: { x: number; y: number; z: number };
  };
  'dungeon:floor-complete': {
    agentId: string;
    floor: number;
    nextFloor: number;
  };
}

/**
 * Server Control Events
 */
export interface ServerControlEvents {
  'server:time-sync': {
    serverTime: number;
    clientTime: number;
    latency: number;
  };
  'server:disconnect-warning': {
    reason: string;
    gracePeriodMs: number;
  };
  'server:force-resync': {
    reason: string;
  };
}

// ============================================================================
// CLIENT-SIDE STATE TRACKING
// ============================================================================

export interface ClientSyncState {
  clientId: string;
  isConnected: boolean;
  isReconnecting: boolean;
  lastSyncTime: number;
  lastSequenceNumber: number;
  pendingActions: StateDelta[];
  outstandingDeltas: Map<number, StateDelta>;
  serverLatency: number;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

export interface InterpolationState {
  agentPosition: {
    current: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
    velocity: { x: number; y: number; z: number };
    interpolationTime: number;
  };
  enemyPositions: Map<
    string,
    {
      current: { x: number; y: number; z: number };
      target: { x: number; y: number; z: number };
      velocity: { x: number; y: number; z: number };
      interpolationTime: number;
    }
  >;
}

// ============================================================================
// BATCH & COMPRESSION TYPES
// ============================================================================

export interface EventBatch {
  id: string;
  events: StateDelta[];
  createdAt: number;
  sentAt?: number;
  batchSize: number;
  compressedSize?: number;
}

export interface CompressionStats {
  originalSize: number;
  compressedSize: number;
  ratio: number;
  eventsCompressed: number;
  timeTaken: number;
}

// ============================================================================
// CONNECTION STATE
// ============================================================================

export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'reconnecting'
  | 'error';

export interface ConnectionState {
  status: ConnectionStatus;
  latency: number;
  lastConnectTime?: number;
  lastDisconnectTime?: number;
  disconnectReason?: string;
  reconnectAttempts: number;
  isStale: boolean;
  staleThresholdMs: number;
}

// ============================================================================
// SOCKET CONFIGURATION
// ============================================================================

export interface SocketConfig {
  url: string;
  reconnection: boolean;
  reconnectionDelay: number;
  reconnectionDelayMax: number;
  reconnectionAttempts: number;
  transports: string[];
  upgrade: boolean;
  path: string;
  query?: Record<string, string>;
  auth?: {
    token: string;
    userId: string;
  };
}

export interface SyncConfig {
  batchIntervalMs: number;
  batchMaxSize: number;
  compressionEnabled: boolean;
  deltaThrottleMs: number;
  interpolationSpeed: number;
  staleConnectionThresholdMs: number;
  maxPendingDeltas: number;
}

// ============================================================================
// FULL EVENT UNION TYPE
// ============================================================================

export type SocketEvent =
  | ConnectionEvents[keyof ConnectionEvents]
  | GameStateEvents[keyof GameStateEvents]
  | PlayerActionEvents[keyof PlayerActionEvents]
  | CombatEvents[keyof CombatEvents]
  | DungeonEvents[keyof DungeonEvents]
  | ServerControlEvents[keyof ServerControlEvents];

export type SocketEventKey =
  | keyof ConnectionEvents
  | keyof GameStateEvents
  | keyof PlayerActionEvents
  | keyof CombatEvents
  | keyof DungeonEvents
  | keyof ServerControlEvents;
