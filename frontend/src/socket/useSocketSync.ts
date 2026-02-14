/**
 * React Hooks for Socket.io Integration
 * Provides useSocketConnection, useSocketListener, and useSocketEmit for easy socket management
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useGameStore } from '../zustand/gameStore';
import { getSocketManager } from './socketManager';
import type {
  SocketEventMap,
  SocketEventListener,
  UseSocketConnectionReturn,
  UseSocketListenerOptions,
  UseSocketEmitOptions,
  SocketManagerConfig,
} from './types';

// ============================================================================
// HOOK: useSocketConnection
// ============================================================================

/**
 * Hook to manage socket connection lifecycle
 * Handles connecting, disconnecting, and monitoring connection state
 *
 * @returns Connection state and control functions
 *
 * @example
 * const { isConnected, latency, connect, disconnect } = useSocketConnection();
 *
 * useEffect(() => {
 *   connect();
 *   return () => disconnect();
 * }, [connect, disconnect]);
 */
export function useSocketConnection(
  config?: SocketManagerConfig
): UseSocketConnectionReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [latency, setLatency] = useState(0);
  const [reconnecting, setReconnecting] = useState(false);
  const socketManagerRef = useRef(getSocketManager(config));
  const updateNetworkState = useGameStore((state) => state.updateNetworkState);

  useEffect(() => {
    const socketManager = socketManagerRef.current;

    // Listen to connection events
    const unsubscribeConnect = socketManager.on('connect', () => {
      setIsConnected(true);
      setClientId(socketManager.getClientId());
      updateNetworkState({
        isConnected: true,
        latency: 0,
        lastSyncTime: Date.now(),
        connectionStatus: 'connected',
      });
    });

    const unsubscribeDisconnect = socketManager.on('disconnect', ({ reason }) => {
      setIsConnected(false);
      updateNetworkState({
        isConnected: false,
        latency: 0,
        lastSyncTime: Date.now(),
        connectionStatus: 'disconnected',
      });
    });

    const unsubscribeReconnect = socketManager.on('reconnect', () => {
      setReconnecting(false);
      setIsConnected(true);
    });

    const unsubscribeLatency = socketManager.on('network:latency', ({ latency }) => {
      setLatency(latency);
      updateNetworkState({
        isConnected: true,
        latency,
        lastSyncTime: Date.now(),
        connectionStatus: 'connected',
      });
    });

    // Start latency monitoring
    socketManager.measureLatency();
    const latencyInterval = setInterval(() => {
      socketManager.measureLatency();
    }, 5000);

    return () => {
      unsubscribeConnect();
      unsubscribeDisconnect();
      unsubscribeReconnect();
      unsubscribeLatency();
      clearInterval(latencyInterval);
    };
  }, [updateNetworkState]);

  const connect = useCallback(async () => {
    try {
      await socketManagerRef.current.connect();
      setIsConnected(true);
      setClientId(socketManagerRef.current.getClientId());
    } catch (error) {
      console.error('Failed to connect socket:', error);
      throw error;
    }
  }, []);

  const disconnect = useCallback(() => {
    socketManagerRef.current.disconnect();
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    clientId,
    latency,
    reconnecting,
    connect,
    disconnect,
  };
}

// ============================================================================
// HOOK: useSocketListener
// ============================================================================

/**
 * Hook to listen to socket events with automatic cleanup
 *
 * @param event - Socket event name
 * @param listener - Callback function
 * @param options - Configuration options
 *
 * @example
 * useSocketListener('state:update', (payload) => {
 *   console.log('State updated:', payload);
 * });
 *
 * @example
 * useSocketListener('combat:started', async (payload) => {
 *   await handleCombatStart(payload);
 * }, { immediate: true });
 */
export function useSocketListener<T extends keyof SocketEventMap>(
  event: T,
  listener: SocketEventListener<T>,
  options: UseSocketListenerOptions = {}
): void {
  const socketManagerRef = useRef(getSocketManager());
  const listenerRef = useRef(listener);

  // Update listener ref when it changes
  useEffect(() => {
    listenerRef.current = listener;
  }, [listener]);

  useEffect(() => {
    const socketManager = socketManagerRef.current;

    // Wrap listener to use latest ref
    const wrappedListener: SocketEventListener<T> = async (payload) => {
      await listenerRef.current(payload);
    };

    // Subscribe
    const unsubscribe = socketManager.on(event, wrappedListener);

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, [event]);
}

// ============================================================================
// HOOK: useSocketEmit
// ============================================================================

/**
 * Hook to emit socket events with batching and compression support
 *
 * @param options - Emission options
 * @returns Async emit function
 *
 * @example
 * const emit = useSocketEmit({ batch: true });
 * await emit('action:execute', {
 *   agentId: 'agent-1',
 *   actionType: 'attack',
 *   targetId: 'enemy-1',
 *   timestamp: Date.now(),
 * });
 *
 * @example
 * const emit = useSocketEmit({ compress: true, priority: 'high' });
 * await emit('combat:action', combatAction);
 */
export function useSocketEmit(
  options: UseSocketEmitOptions = {}
): <T extends keyof SocketEventMap>(
  event: T,
  payload: SocketEventMap[T]
) => Promise<void> {
  const socketManagerRef = useRef(getSocketManager());

  const emit = useCallback(
    async <T extends keyof SocketEventMap>(
      event: T,
      payload: SocketEventMap[T]
    ): Promise<void> => {
      try {
        await socketManagerRef.current.emit(event, payload, options);
      } catch (error) {
        console.error(`Failed to emit event ${String(event)}:`, error);
        throw error;
      }
    },
    [options]
  );

  return emit;
}

// ============================================================================
// HOOK: useSocketSync
// ============================================================================

/**
 * Comprehensive hook combining connection, listeners, and emission
 *
 * @param autoSync - Whether to automatically sync game state
 * @returns Socket utilities and state
 *
 * @example
 * const { isConnected, latency, emit, on } = useSocketSync(true);
 *
 * useEffect(() => {
 *   on('state:update', (payload) => {
 *     console.log('State updated:', payload);
 *   });
 * }, [on]);
 *
 * const handleAttack = async () => {
 *   await emit('action:execute', {
 *     agentId: currentAgent.id,
 *     actionType: 'attack',
 *     targetId: targetEnemy.id,
 *     timestamp: Date.now(),
 *   });
 * };
 */
export function useSocketSync(autoSync: boolean = true) {
  const connection = useSocketConnection();
  const currentAgent = useGameStore((state) => state.currentAgent);
  const currentDungeon = useGameStore((state) => state.currentDungeon);
  const startCombat = useGameStore((state) => state.startCombat);
  const addCombatAction = useGameStore((state) => state.addCombatAction);
  const updateAgentStats = useGameStore((state) => state.updateAgentStats);
  const updateNetworkState = useGameStore((state) => state.updateNetworkState);

  const emit = useSocketEmit();

  // Auto-sync game state when connected
  useEffect(() => {
    if (!autoSync || !connection.isConnected || !currentAgent) return;

    const syncInterval = setInterval(() => {
      if (currentDungeon) {
        emit('state:delta', {
          agentId: currentAgent.id,
          changes: {
            position: currentAgent.position,
            health: currentAgent.health,
            mana: currentAgent.mana,
          },
          timestamp: Date.now(),
        }).catch(console.error);
      }
    }, 1000); // Sync every second

    return () => clearInterval(syncInterval);
  }, [autoSync, connection.isConnected, currentAgent, currentDungeon, emit]);

  // Listen to state updates
  useSocketListener('state:update', (payload) => {
    if (payload.agent && currentAgent?.id === payload.agent.id) {
      updateAgentStats(payload.agent.id, {
        health: payload.agent.health,
        mana: payload.agent.mana,
      });
    }
  });

  // Listen to combat events
  useSocketListener('combat:started', (payload) => {
    startCombat(payload.enemies);
  });

  useSocketListener('combat:action', (payload) => {
    addCombatAction({
      type: payload.type,
      sourceId: payload.sourceId,
      targetId: payload.targetId,
      damage: payload.damage,
      effects: payload.effects,
      timestamp: payload.timestamp,
    });
  });

  return {
    ...connection,
    emit,
    on: <T extends keyof SocketEventMap>(
      event: T,
      listener: SocketEventListener<T>
    ) => {
      const socketManager = getSocketManager();
      return socketManager.on(event, listener);
    },
  };
}

// ============================================================================
// HOOK: useSocketBatch
// ============================================================================

/**
 * Hook for batching multiple socket events and emitting them together
 *
 * @example
 * const { batch, flush } = useSocketBatch();
 *
 * batch('action:execute', actionPayload);
 * batch('inventory:item-added', itemPayload);
 * await flush(); // Send all batched events together
 */
export function useSocketBatch() {
  const [batchQueue, setBatchQueue] = useState<
    Array<{ event: string; payload: any }>
  >([]);
  const emit = useSocketEmit({ batch: true });

  const batch = useCallback((event: string, payload: any) => {
    setBatchQueue((prev) => [...prev, { event, payload }]);
  }, []);

  const flush = useCallback(async () => {
    if (batchQueue.length === 0) return;

    try {
      // Emit all events in batch mode
      await Promise.all(
        batchQueue.map(({ event, payload }) =>
          emit(event as any, payload)
        )
      );
      setBatchQueue([]);
    } catch (error) {
      console.error('Failed to flush batch:', error);
      throw error;
    }
  }, [batchQueue, emit]);

  const clear = useCallback(() => {
    setBatchQueue([]);
  }, []);

  return {
    batch,
    flush,
    clear,
    size: batchQueue.length,
  };
}

// ============================================================================
// HOOK: useSocketError
// ============================================================================

/**
 * Hook to handle socket errors
 *
 * @example
 * const { error, clearError } = useSocketError();
 *
 * useEffect(() => {
 *   if (error) {
 *     showNotification(error.message, 'error');
 *     clearError();
 *   }
 * }, [error, clearError]);
 */
export function useSocketError() {
  const [error, setError] = useState<Error | null>(null);
  const socketManager = useRef(getSocketManager());

  useEffect(() => {
    const unsubscribe = socketManager.current.on('error', (payload) => {
      const socketError = new Error(payload.message);
      setError(socketError);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, clearError };
}
