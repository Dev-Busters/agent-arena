/**
 * React Hook for Socket.io Real-time Synchronization
 * Connects Zustand store to Socket.io manager for real-time game state sync
 */

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/zustand';
import type { StateDelta } from './types';
import { getSocketManager } from './socketManager';

interface UseSocketSyncOptions {
  autoConnect?: boolean;
  userId?: string;
  agentId?: string;
  onConnected?: () => void;
  onDisconnected?: (reason: string) => void;
  onError?: (error: Error) => void;
  onLatencyUpdate?: (latency: number) => void;
}

/**
 * Hook to synchronize game state with server via Socket.io
 */
export function useSocketSync(options: UseSocketSyncOptions = {}) {
  const {
    autoConnect = true,
    userId,
    agentId,
    onConnected,
    onDisconnected,
    onError,
    onLatencyUpdate,
  } = options;

  const socketRef = useRef(getSocketManager());
  const unsubscribesRef = useRef<Array<() => void>>([]);
  const isConnectingRef = useRef(false);
  const deltaTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Zustand store actions
  const updateAgentStats = useGameStore((state) => state.updateAgentStats);
  const updateAgentPosition = useGameStore(
    (state) => state.updateAgentPosition
  );
  const addItem = useGameStore((state) => state.addItem);
  const updateGold = useGameStore((state) => state.updateGold);
  const updateEnemyHealth = useGameStore((state) => state.updateEnemyHealth);
  const moveToRoom = useGameStore((state) => state.moveToRoom);
  const updateNetworkState = useGameStore(
    (state) => state.updateNetworkState
  );
  const setCurrentAgent = useGameStore((state) => state.setCurrentAgent);
  const startDungeon = useGameStore((state) => state.startDungeon);

  /**
   * Apply delta to local game state
   */
  const applyDelta = useCallback(
    (delta: StateDelta) => {
      // Update agent stats if present
      if (delta.agentStats && delta.agentId) {
        updateAgentStats(delta.agentId, delta.agentStats);
      }

      // Update agent position if present
      if (delta.agentPosition) {
        updateAgentPosition(delta.agentPosition);
      }

      // Update inventory
      if (delta.inventory) {
        if (delta.inventory.gold !== undefined) {
          const currentGold =
            useGameStore.getState().currentAgent?.inventory.gold || 0;
          const goldDiff = delta.inventory.gold - currentGold;
          if (goldDiff !== 0) {
            updateGold(goldDiff);
          }
        }
      }

      // Update enemies
      if (delta.enemies) {
        delta.enemies.forEach((enemy) => {
          updateEnemyHealth(enemy.id, enemy.health);
        });
      }

      // Update dungeon state
      if (delta.dungeonState) {
        if (delta.dungeonState.currentRoomId !== undefined) {
          moveToRoom(delta.dungeonState.currentRoomId);
        }
      }

      // Update network latency
      const socket = socketRef.current;
      updateNetworkState({
        isConnected: socket.isConnected(),
        latency: socket.getLatency(),
        lastSyncTime: Date.now(),
        connectionStatus: 'connected',
      });
    },
    [
      updateAgentStats,
      updateAgentPosition,
      updateGold,
      updateEnemyHealth,
      moveToRoom,
      updateNetworkState,
    ]
  );

  /**
   * Connect to socket server
   */
  const connect = useCallback(async () => {
    if (isConnectingRef.current) return;
    if (socketRef.current.isConnected()) return;

    isConnectingRef.current = true;

    try {
      await socketRef.current.connect();
      isConnectingRef.current = false;
    } catch (error) {
      isConnectingRef.current = false;
      const err = error instanceof Error ? error : new Error(String(error));
      onError?.(err);
      console.error('Failed to connect socket:', err);
    }
  }, [onError]);

  /**
   * Disconnect from socket server
   */
  const disconnect = useCallback(async () => {
    if (deltaTimeoutRef.current) {
      clearTimeout(deltaTimeoutRef.current);
    }
    await socketRef.current.disconnect();
  }, []);

  /**
   * Send state delta to server
   */
  const sendDelta = useCallback(
    (delta: Omit<StateDelta, 'timestamp' | 'sequenceNumber'>) => {
      socketRef.current.sendDelta(delta);
    },
    []
  );

  /**
   * Request full state sync from server
   */
  const requestSync = useCallback(() => {
    socketRef.current.requestSync();
  }, []);

  /**
   * Get connection information
   */
  const getConnectionInfo = useCallback(() => {
    return {
      isConnected: socketRef.current.isConnected(),
      latency: socketRef.current.getLatency(),
      connectionState: socketRef.current.getConnectionState(),
      syncState: socketRef.current.getSyncState(),
    };
  }, []);

  /**
   * Setup socket event listeners
   */
  useEffect(() => {
    const socket = socketRef.current;

    // Listen for state deltas
    const unsubscribeDelta = socket.on('game:state-delta', (delta: StateDelta) => {
      applyDelta(delta);
    });
    unsubscribesRef.current.push(unsubscribeDelta);

    // Listen for full state syncs
    const unsubscribeFullState = socket.on('game:full-state', (state: any) => {
      if (state.agent) {
        setCurrentAgent(state.agent);
      }
      if (state.dungeon) {
        startDungeon(state.dungeon);
      }
    });
    unsubscribesRef.current.push(unsubscribeFullState);

    // Listen for connection status changes
    const unsubscribeConnected = socket.on('socket:connected', () => {
      updateNetworkState({
        isConnected: true,
        latency: socket.getLatency(),
        lastSyncTime: Date.now(),
        connectionStatus: 'connected',
      });
      onConnected?.();
    });
    unsubscribesRef.current.push(unsubscribeConnected);

    // Listen for disconnection
    const unsubscribeDisconnected = socket.on(
      'socket:disconnected',
      (reason: string) => {
        updateNetworkState({
          isConnected: false,
          latency: 0,
          lastSyncTime: Date.now(),
          connectionStatus: 'disconnected',
        });
        onDisconnected?.(reason);
      }
    );
    unsubscribesRef.current.push(unsubscribeDisconnected);

    // Listen for latency updates
    const unsubscribeLatency = socket.on(
      'connection:latency-update',
      (latency: number) => {
        updateNetworkState({
          isConnected: socket.isConnected(),
          latency,
          lastSyncTime: Date.now(),
          connectionStatus: 'connected',
        });
        onLatencyUpdate?.(latency);
      }
    );
    unsubscribesRef.current.push(unsubscribeLatency);

    // Listen for errors
    const unsubscribeError = socket.on('socket:error', (error: any) => {
      const err =
        error instanceof Error ? error : new Error(String(error));
      onError?.(err);
    });
    unsubscribesRef.current.push(unsubscribeError);

    // Cleanup: unsubscribe all listeners
    return () => {
      unsubscribesRef.current.forEach((unsubscribe) => {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing:', error);
        }
      });
      unsubscribesRef.current = [];
    };
  }, [applyDelta, setCurrentAgent, startDungeon, updateNetworkState, onConnected, onDisconnected, onError, onLatencyUpdate]);

  /**
   * Auto-connect on mount
   */
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      // Don't auto-disconnect on unmount as the socket may be used by other components
      // User must manually call disconnect() when needed
    };
  }, [autoConnect, connect]);

  return {
    connect,
    disconnect,
    sendDelta,
    requestSync,
    getConnectionInfo,
    socket: socketRef.current,
  };
}

/**
 * Hook to monitor connection status
 */
export function useSocketConnectionStatus() {
  const socket = getSocketManager();
  const [status, setStatus] = useGameStore((state) => [
    state.networkState,
    state.updateNetworkState,
  ]);

  useEffect(() => {
    const unsubscribeStatus = socket.on('connection:status-change', (state) => {
      const newStatus =
        state.status === 'connecting'
          ? 'reconnecting'
          : state.status === 'error'
            ? 'disconnected'
            : state.status;

      setStatus({
        isConnected: newStatus === 'connected',
        latency: state.latency,
        lastSyncTime: Date.now(),
        connectionStatus: newStatus as any,
      });
    });

    return unsubscribeStatus;
  }, [setStatus]);

  return status;
}

/**
 * Hook to get compression statistics
 */
export function useSocketCompressionStats() {
  const socket = getSocketManager();

  const getStats = useCallback(() => {
    return socket.getCompressionStats();
  }, [socket]);

  return getStats;
}
