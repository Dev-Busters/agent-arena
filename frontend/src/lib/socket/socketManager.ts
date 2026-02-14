/**
 * Socket.io Manager for Real-time State Synchronization
 * Handles connection, event batching, compression, and state delta sync
 */

import { io, Socket } from 'socket.io-client';
import type {
  SocketConfig,
  SyncConfig,
  ConnectionState,
  StateDelta,
  EventBatch,
  ClientSyncState,
  ConnectionStatus,
} from './types';

export class SocketManager {
  private socket: Socket | null = null;
  private config: SocketConfig;
  private syncConfig: SyncConfig;
  private connectionState: ConnectionState;
  private clientSyncState: ClientSyncState;
  private eventBatch: StateDelta[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private sequenceNumber: number = 0;
  private listeners: Map<string, Set<Function>> = new Map();
  private compressionStats = {
    totalOriginalSize: 0,
    totalCompressedSize: 0,
    eventsProcessed: 0,
  };

  constructor(
    config: SocketConfig = {
      url: process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000',
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
      upgrade: true,
      path: '/socket.io/',
    },
    syncConfig: SyncConfig = {
      batchIntervalMs: 16, // ~60 FPS
      batchMaxSize: 50,
      compressionEnabled: true,
      deltaThrottleMs: 16,
      interpolationSpeed: 0.15,
      staleConnectionThresholdMs: 10000,
      maxPendingDeltas: 100,
    }
  ) {
    this.config = config;
    this.syncConfig = syncConfig;

    this.connectionState = {
      status: 'disconnected',
      latency: 0,
      reconnectAttempts: 0,
      isStale: false,
      staleThresholdMs: syncConfig.staleConnectionThresholdMs,
    };

    this.clientSyncState = {
      clientId: this.generateClientId(),
      isConnected: false,
      isReconnecting: false,
      lastSyncTime: Date.now(),
      lastSequenceNumber: 0,
      pendingActions: [],
      outstandingDeltas: new Map(),
      serverLatency: 0,
      reconnectAttempts: 0,
      maxReconnectAttempts: config.reconnectionAttempts,
    };
  }

  /**
   * Connect to the server
   */
  async connect(): Promise<void> {
    if (this.socket?.connected) {
      console.warn('Already connected');
      return;
    }

    this.connectionState.status = 'connecting';
    this.emit('connection:status-change', this.connectionState);

    this.socket = io(this.config.url, {
      reconnection: this.config.reconnection,
      reconnectionDelay: this.config.reconnectionDelay,
      reconnectionDelayMax: this.config.reconnectionDelayMax,
      reconnectionAttempts: this.config.reconnectionAttempts,
      transports: this.config.transports,
      upgrade: this.config.upgrade,
      path: this.config.path,
      query: this.config.query,
      auth: this.config.auth,
    });

    this.setupEventHandlers();

    return new Promise((resolve, reject) => {
      this.socket!.once('connect', () => {
        resolve();
      });

      this.socket!.once('error', (error) => {
        reject(error);
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);
    });
  }

  /**
   * Disconnect from the server
   */
  async disconnect(): Promise<void> {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.connectionState.status = 'disconnected';
    this.connectionState.lastDisconnectTime = Date.now();
    this.clientSyncState.isConnected = false;
    this.emit('connection:status-change', this.connectionState);
  }

  /**
   * Send a state delta to the server
   */
  sendDelta(delta: Omit<StateDelta, 'timestamp' | 'sequenceNumber'>): void {
    if (!this.socket?.connected) {
      console.warn('Not connected, queuing delta');
      this.clientSyncState.pendingActions.push({
        ...delta,
        timestamp: Date.now(),
        sequenceNumber: this.sequenceNumber++,
      });
      return;
    }

    const fullDelta: StateDelta = {
      ...delta,
      timestamp: Date.now(),
      sequenceNumber: this.sequenceNumber++,
    };

    // Add to batch
    this.eventBatch.push(fullDelta);

    // Send immediately if batch is full
    if (this.eventBatch.length >= this.syncConfig.batchMaxSize) {
      this.flushBatch();
    } else {
      // Schedule batch send if not already scheduled
      if (!this.batchTimer) {
        this.scheduleBatchSend();
      }
    }
  }

  /**
   * Send batch of deltas
   */
  private flushBatch(): void {
    if (this.eventBatch.length === 0) return;

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    const batch: EventBatch = {
      id: `batch-${Date.now()}-${Math.random()}`,
      events: this.eventBatch,
      createdAt: Date.now(),
      batchSize: this.eventBatch.length,
    };

    // Track original size
    const originalSize = JSON.stringify(batch).length;
    batch.compressedSize = originalSize; // Can be compressed further if needed

    // Send to server
    this.socket?.emit('game:state-batch', batch);

    // Track compression stats
    this.compressionStats.totalOriginalSize += originalSize;
    this.compressionStats.totalCompressedSize += (batch.compressedSize || 0);
    this.compressionStats.eventsProcessed += batch.batchSize;

    // Clear batch
    this.eventBatch = [];
  }

  /**
   * Schedule batch send
   */
  private scheduleBatchSend(): void {
    this.batchTimer = setTimeout(() => {
      this.flushBatch();
    }, this.syncConfig.batchIntervalMs);
  }

  /**
   * Request full state sync from server
   */
  requestSync(): void {
    if (!this.socket?.connected) {
      console.warn('Not connected, cannot request sync');
      return;
    }

    this.socket.emit('game:sync-request', {
      clientId: this.clientSyncState.clientId,
      lastSequenceNumber: this.clientSyncState.lastSequenceNumber,
    });
  }

  /**
   * Setup internal event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.connectionState.status = 'connected';
      this.connectionState.lastConnectTime = Date.now();
      this.connectionState.reconnectAttempts = 0;
      this.clientSyncState.isConnected = true;
      this.clientSyncState.isReconnecting = false;

      // Request sync on connect
      this.requestSync();

      this.emit('connection:status-change', this.connectionState);
      this.emit('socket:connected');

      console.log('✅ Connected to server');
    });

    this.socket.on('disconnect', (reason: string) => {
      this.connectionState.status = 'disconnected';
      this.connectionState.lastDisconnectTime = Date.now();
      this.connectionState.disconnectReason = reason;
      this.clientSyncState.isConnected = false;

      this.emit('connection:status-change', this.connectionState);
      this.emit('socket:disconnected', reason);

      console.warn('❌ Disconnected:', reason);
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      this.connectionState.status = 'connected';
      this.connectionState.reconnectAttempts = 0;
      this.clientSyncState.isReconnecting = false;
      this.clientSyncState.isConnected = true;

      // Resend pending actions
      this.resendPendingActions();

      this.emit('connection:status-change', this.connectionState);
      this.emit('socket:reconnected', attemptNumber);

      console.log('🔄 Reconnected after attempt', attemptNumber);
    });

    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      this.connectionState.status = 'reconnecting';
      this.connectionState.reconnectAttempts = attemptNumber;
      this.clientSyncState.isReconnecting = true;
      this.clientSyncState.reconnectAttempts = attemptNumber;

      this.emit('connection:status-change', this.connectionState);
      this.emit('socket:reconnect-attempt', attemptNumber);

      console.log('⏳ Reconnection attempt', attemptNumber);
    });

    this.socket.on('error', (error: any) => {
      this.connectionState.status = 'error';

      this.emit('connection:error', error);
      this.emit('socket:error', error);

      console.error('❌ Socket error:', error);
    });

    // Game state sync events
    this.socket.on('game:sync-response', (data: any) => {
      this.clientSyncState.lastSyncTime = Date.now();

      // Process received deltas
      if (data.deltas) {
        data.deltas.forEach((delta: StateDelta) => {
          this.clientSyncState.outstandingDeltas.set(
            delta.sequenceNumber,
            delta
          );
          this.emit('game:state-delta', delta);
        });
      }

      // If full state provided, replace local state
      if (data.fullState) {
        this.emit('game:full-state', data.fullState);
      }

      console.log(`✅ Synced ${data.deltas?.length || 0} deltas`);
    });

    this.socket.on('game:state-delta', (delta: StateDelta) => {
      this.clientSyncState.lastSyncTime = Date.now();
      this.clientSyncState.outstandingDeltas.set(delta.sequenceNumber, delta);
      this.emit('game:state-delta', delta);
    });

    // Time sync for latency calculation
    this.socket.on('server:time-sync', (data: any) => {
      const clientTime = Date.now();
      const latency = (clientTime - data.clientTime) / 2;

      this.connectionState.latency = latency;
      this.clientSyncState.serverLatency = latency;

      this.emit('connection:latency-update', latency);
    });

    // Force resync if server requests it
    this.socket.on('server:force-resync', (data: any) => {
      console.warn('⚠️ Server requesting resync:', data.reason);
      this.requestSync();
    });
  }

  /**
   * Resend pending actions that failed
   */
  private resendPendingActions(): void {
    if (this.clientSyncState.pendingActions.length === 0) return;

    console.log(
      `Resending ${this.clientSyncState.pendingActions.length} pending actions`
    );

    this.clientSyncState.pendingActions.forEach((delta) => {
      this.sendDelta(delta);
    });

    this.clientSyncState.pendingActions = [];
  }

  /**
   * Subscribe to events
   */
  on(eventName: string, callback: Function): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    this.listeners.get(eventName)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventName)?.delete(callback);
    };
  }

  /**
   * Emit events to listeners
   */
  private emit(eventName: string, data?: any): void {
    const callbacks = this.listeners.get(eventName);
    if (!callbacks) return;

    callbacks.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in listener for ${eventName}:`, error);
      }
    });
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Get current sync state
   */
  getSyncState(): ClientSyncState {
    return { ...this.clientSyncState };
  }

  /**
   * Get compression statistics
   */
  getCompressionStats() {
    return {
      ...this.compressionStats,
      compressionRatio:
        this.compressionStats.totalOriginalSize > 0
          ? (
              (this.compressionStats.totalCompressedSize /
                this.compressionStats.totalOriginalSize) *
              100
            ).toFixed(2) + '%'
          : 'N/A',
    };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.clientSyncState.isConnected;
  }

  /**
   * Get latency in ms
   */
  getLatency(): number {
    return this.connectionState.latency;
  }
}

// Singleton instance
let instance: SocketManager | null = null;

export function getSocketManager(): SocketManager {
  if (!instance) {
    instance = new SocketManager();
  }
  return instance;
}

export function createSocketManager(
  config?: SocketConfig,
  syncConfig?: SyncConfig
): SocketManager {
  return new SocketManager(config, syncConfig);
}
