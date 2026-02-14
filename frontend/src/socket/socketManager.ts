/**
 * Socket.io Client Manager for Agent Arena
 * Handles connection, reconnection, event batching, delta compression, and latency tracking
 */

import { io, Socket } from 'socket.io-client';
import type {
  SocketManagerConfig,
  SocketEventMap,
  SocketEventListener,
  ConnectionState,
  EventBatch,
  DeltaState,
} from './types';
import {
  ConnectionError,
  ReconnectionError,
  SyncError,
} from './types';

// ============================================================================
// SOCKET MANAGER CLASS
// ============================================================================

export class SocketManager {
  private socket: Socket | null = null;
  private config: Required<SocketManagerConfig>;
  private connectionState: ConnectionState;
  private listeners: Map<string, Set<SocketEventListener<any>>>;
  private eventQueue: Array<{ name: string; payload: any; timestamp: number }> =
    [];
  private batchTimer: NodeJS.Timeout | null = null;
  private deltaState: DeltaState = { lastTimestamp: Date.now() };
  private sequenceNum: number = 0;
  private lastPingTime: number = 0;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectBackoff: number = 1000; // Start with 1 second
  private maxReconnectBackoff: number = 30000; // Max 30 seconds

  constructor(config: SocketManagerConfig = {}) {
    this.config = {
      url: config.url || process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001',
      reconnection: config.reconnection ?? true,
      reconnectionDelay: config.reconnectionDelay ?? 1000,
      reconnectionDelayMax: config.reconnectionDelayMax ?? 5000,
      reconnectionAttempts: config.reconnectionAttempts ?? 5,
      autoConnect: config.autoConnect ?? true,
      transports: config.transports ?? ['websocket', 'polling'],
    };

    this.connectionState = {
      isConnected: false,
      clientId: null,
      latency: 0,
      reconnecting: false,
      reconnectAttempts: 0,
      lastMessageTime: Date.now(),
      lastSyncTime: Date.now(),
    };

    this.listeners = new Map();

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  /**
   * Connect to Socket.io server with exponential backoff
   */
  public async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(this.config.url, {
          reconnection: this.config.reconnection,
          reconnectionDelay: this.config.reconnectionDelay,
          reconnectionDelayMax: this.config.reconnectionDelayMax,
          reconnectionAttempts: this.config.reconnectionAttempts,
          transports: this.config.transports,
          autoConnect: false,
        });

        // Connection event
        this.socket.on('connect', () => {
          this.handleConnect();
          resolve();
        });

        // Disconnect event
        this.socket.on('disconnect', (reason) => {
          this.handleDisconnect(reason);
        });

        // Reconnect event
        this.socket.on('reconnect', () => {
          this.handleReconnect();
        });

        // Error handlers
        this.socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          reject(new ConnectionError('Failed to connect', { error }));
        });

        this.socket.on('reconnect_error', (error) => {
          console.error('Socket reconnection error:', error);
          this.handleReconnectError(error);
        });

        // Setup built-in listeners
        this.setupBuiltInListeners();

        this.socket.connect();
      } catch (error) {
        reject(new ConnectionError('Connection initialization failed', { error }));
      }
    });
  }

  /**
   * Disconnect from server
   */
  public disconnect(): void {
    if (this.socket) {
      this.clearBatchTimer();
      this.socket.disconnect();
      this.connectionState.isConnected = false;
    }
  }

  /**
   * Emit event with optional batching and compression
   */
  public async emit<T extends keyof SocketEventMap>(
    event: T,
    payload: SocketEventMap[T],
    options: { batch?: boolean; compress?: boolean; priority?: 'low' | 'normal' | 'high' } = {}
  ): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error('Socket not connected. Call connect() first.');
    }

    const { batch = false, compress = false } = options;

    if (batch) {
      this.queueEvent(event as string, payload);
      this.scheduleBatchFlush();
    } else {
      const processedPayload = compress ? this.compressPayload(payload) : payload;
      this.socket.emit(event as string, processedPayload);
      this.connectionState.lastMessageTime = Date.now();
    }
  }

  /**
   * Listen to socket event
   */
  public on<T extends keyof SocketEventMap>(
    event: T,
    listener: SocketEventListener<T>
  ): () => void {
    if (!this.listeners.has(event as string)) {
      this.listeners.set(event as string, new Set());
    }

    const listeners = this.listeners.get(event as string)!;
    listeners.add(listener);

    // Also attach to socket if available
    if (this.socket) {
      this.socket.on(event as string, (payload) => {
        Promise.resolve(listener(payload)).catch(console.error);
      });
    }

    // Return unsubscribe function
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(event as string);
      }
    };
  }

  /**
   * Listen to socket event once
   */
  public once<T extends keyof SocketEventMap>(
    event: T,
    listener: SocketEventListener<T>
  ): () => void {
    const unsubscribe = this.on(event, async (payload) => {
      unsubscribe();
      await listener(payload);
    });

    return unsubscribe;
  }

  /**
   * Remove event listener
   */
  public off<T extends keyof SocketEventMap>(
    event: T,
    listener: SocketEventListener<T>
  ): void {
    const listeners = this.listeners.get(event as string);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.connectionState.isConnected;
  }

  /**
   * Get current latency
   */
  public getLatency(): number {
    return this.connectionState.latency;
  }

  /**
   * Get client ID
   */
  public getClientId(): string | null {
    return this.connectionState.clientId;
  }

  /**
   * Get connection state
   */
  public getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Measure latency by sending ping
   */
  public measureLatency(): void {
    if (!this.socket?.connected) return;

    this.lastPingTime = Date.now();
    this.socket.emit('network:ping', {
      clientTimestamp: this.lastPingTime,
    });
  }

  /**
   * Handle connection event
   */
  private handleConnect(): void {
    this.connectionState.isConnected = true;
    this.connectionState.clientId = this.socket?.id || null;
    this.connectionState.reconnecting = false;
    this.reconnectAttempts = 0;
    this.reconnectBackoff = 1000;
    this.connectionState.lastSyncTime = Date.now();

    console.log('Socket connected:', this.connectionState.clientId);

    // Start latency monitoring
    this.startLatencyMonitoring();

    // Emit connection event to listeners
    this.notifyListeners('connect' as any, {});
  }

  /**
   * Handle disconnect event
   */
  private handleDisconnect(reason: string): void {
    this.connectionState.isConnected = false;
    this.clearBatchTimer();

    console.log('Socket disconnected:', reason);

    this.notifyListeners('disconnect' as any, {
      isConnected: false,
      reason,
      timestamp: Date.now(),
    });
  }

  /**
   * Handle reconnect event
   */
  private handleReconnect(): void {
    this.connectionState.reconnecting = false;
    this.connectionState.isConnected = true;
    this.connectionState.lastSyncTime = Date.now();

    console.log('Socket reconnected');

    // Request state recovery
    this.socket?.emit('state:recovery-request', {
      clientId: this.connectionState.clientId,
      lastSequenceNum: this.sequenceNum,
      timestamp: Date.now(),
    });

    this.notifyListeners('reconnect' as any, {
      clientId: this.connectionState.clientId || '',
      lastSequenceNum: this.sequenceNum,
      timestamp: Date.now(),
    });
  }

  /**
   * Handle reconnection error
   */
  private handleReconnectError(error: any): void {
    this.reconnectAttempts++;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      throw new ReconnectionError(
        `Max reconnection attempts (${this.maxReconnectAttempts}) reached`,
        { error }
      );
    }

    // Exponential backoff
    this.reconnectBackoff = Math.min(
      this.reconnectBackoff * 1.5,
      this.maxReconnectBackoff
    );

    this.connectionState.reconnecting = true;
    this.connectionState.reconnectAttempts = this.reconnectAttempts;
  }

  /**
   * Setup built-in event listeners
   */
  private setupBuiltInListeners(): void {
    if (!this.socket) return;

    // Network pong response
    this.socket.on('network:pong', (payload: any) => {
      const latency = Date.now() - this.lastPingTime;
      this.connectionState.latency = latency;
      this.notifyListeners('network:latency' as any, { latency, timestamp: Date.now() });
    });

    // State recovery
    this.socket.on('state:recovery' as any, (payload: any) => {
      this.notifyListeners('state:recovery' as any, payload);
    });

    // Error events
    this.socket.on('error' as any, (payload: any) => {
      this.notifyListeners('error' as any, payload);
    });
  }

  /**
   * Queue event for batching
   */
  private queueEvent(name: string, payload: any): void {
    this.eventQueue.push({
      name,
      payload,
      timestamp: Date.now(),
    });
  }

  /**
   * Schedule batch flush
   */
  private scheduleBatchFlush(): void {
    if (this.batchTimer) return;

    this.batchTimer = setTimeout(() => {
      this.flushBatch();
    }, 50); // Batch every 50ms
  }

  /**
   * Flush batched events
   */
  private flushBatch(): void {
    if (this.eventQueue.length === 0) {
      this.batchTimer = null;
      return;
    }

    const batch: EventBatch = {
      clientId: this.connectionState.clientId || '',
      sequenceNum: this.sequenceNum++,
      events: this.eventQueue as any,
      timestamp: Date.now(),
    };

    this.socket?.emit('batch:events', batch);
    this.eventQueue = [];
    this.batchTimer = null;
    this.connectionState.lastMessageTime = Date.now();
  }

  /**
   * Clear batch timer
   */
  private clearBatchTimer(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /**
   * Compress payload using delta encoding
   */
  private compressPayload(payload: any): any {
    if (payload?.agent || payload?.dungeon || payload?.dungeonSession) {
      const delta: any = {};

      if (payload.agent && this.deltaState.agent) {
        delta.agent = this.getDelta(payload.agent, this.deltaState.agent);
        this.deltaState.agent = payload.agent;
      } else if (payload.agent) {
        delta.agent = payload.agent;
        this.deltaState.agent = payload.agent;
      }

      if (payload.dungeon && this.deltaState.dungeon) {
        delta.dungeon = this.getDelta(payload.dungeon, this.deltaState.dungeon);
        this.deltaState.dungeon = payload.dungeon;
      } else if (payload.dungeon) {
        delta.dungeon = payload.dungeon;
        this.deltaState.dungeon = payload.dungeon;
      }

      delta.timestamp = payload.timestamp;
      return delta;
    }

    return payload;
  }

  /**
   * Calculate delta between current and previous state
   */
  private getDelta(current: any, previous: any): Record<string, any> {
    const delta: Record<string, any> = {};

    for (const key in current) {
      if (JSON.stringify(current[key]) !== JSON.stringify(previous[key])) {
        delta[key] = current[key];
      }
    }

    return delta;
  }

  /**
   * Start latency monitoring
   */
  private startLatencyMonitoring(): void {
    // Measure latency every 5 seconds
    setInterval(() => {
      if (this.connectionState.isConnected) {
        this.measureLatency();
      }
    }, 5000);
  }

  /**
   * Notify listeners of event
   */
  private notifyListeners(event: string, payload: any): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        Promise.resolve(listener(payload)).catch(console.error);
      });
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let socketManagerInstance: SocketManager | null = null;

/**
 * Get or create singleton socket manager instance
 */
export function getSocketManager(config?: SocketManagerConfig): SocketManager {
  if (!socketManagerInstance) {
    socketManagerInstance = new SocketManager(config);
  }
  return socketManagerInstance;
}

/**
 * Reset socket manager instance
 */
export function resetSocketManager(): void {
  if (socketManagerInstance) {
    socketManagerInstance.disconnect();
    socketManagerInstance = null;
  }
}
