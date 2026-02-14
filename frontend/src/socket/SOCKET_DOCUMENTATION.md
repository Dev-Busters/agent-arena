# Socket.io Real-time Sync Documentation

Complete integration guide for Socket.io real-time synchronization in Agent Arena frontend.

## Table of Contents

1. [Overview](#overview)
2. [Installation & Setup](#installation--setup)
3. [Core Concepts](#core-concepts)
4. [API Reference](#api-reference)
5. [Hook Usage](#hook-usage)
6. [Error Handling](#error-handling)
7. [Code Examples](#code-examples)
8. [Best Practices](#best-practices)

---

## Overview

The Socket.io integration provides real-time synchronization between the client and server for Agent Arena multiplayer gameplay. It handles:

- **Connection Management**: Automatic reconnection with exponential backoff
- **Event Batching**: Groups events every 50ms for network optimization
- **Delta Compression**: Only sends changed properties to reduce bandwidth
- **Latency Tracking**: Continuous monitoring of connection quality
- **State Recovery**: Automatic state sync on reconnection
- **Type Safety**: Full TypeScript support with event type definitions

### Architecture

```
┌─────────────────────────────────────┐
│   React Components                   │
│   (useSocketSync, useSocketListener) │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Socket Manager (Singleton)         │
│   - Connection/Reconnection          │
│   - Event Batching (50ms)            │
│   - Delta Compression                │
│   - Latency Tracking                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Socket.io Client                   │
│   - WebSocket Transport              │
│   - Fallback to Polling              │
└──────────────┬──────────────────────┘
               │
               ▼
          Server
```

---

## Installation & Setup

### 1. Environment Variables

Add to `.env`:

```bash
REACT_APP_SOCKET_URL=http://localhost:3001
REACT_APP_SOCKET_RECONNECTION=true
REACT_APP_SOCKET_RECONNECTION_DELAY=1000
REACT_APP_SOCKET_RECONNECTION_ATTEMPTS=5
```

### 2. Initialize in App Root

```typescript
import { useEffect } from 'react';
import { useSocketConnection } from './socket/useSocketSync';

export function App() {
  const { connect } = useSocketConnection();

  useEffect(() => {
    connect().catch(console.error);
  }, [connect]);

  return (
    // Your app components
  );
}
```

### 3. Import Types in Store

```typescript
import type { NetworkState } from './socket/types';

// In your Zustand store
const gameStore = create<GameStore>((set) => ({
  networkState: {
    isConnected: false,
    latency: 0,
    lastSyncTime: Date.now(),
    connectionStatus: 'disconnected',
  },
  // ... rest of store
}));
```

---

## Core Concepts

### Event Batching

Events are automatically batched and sent every 50ms when using the `batch: true` option:

```
Client              Server
├─ action:execute
├─ inventory:item-added   ──(batched)──>  │ Batch[0]: action:execute
├─ combat:action                          │ Batch[1]: inventory:item-added
└─ (50ms timeout)                         │ Batch[2]: combat:action
```

**Benefits:**
- Reduces network overhead
- Decreases socket emissions
- Better latency for high-frequency updates

**When to use:**
- Non-critical updates (movement, animations)
- Frequently-fired events
- Network-constrained environments

### Delta Compression

Only changed properties are sent, reducing bandwidth:

```typescript
// Full payload (not compressed)
{
  agent: {
    id: 'agent-1',
    health: 80,
    mana: 60,
    position: { x: 10, y: 0, z: 5 },
    stats: { ... }, // Many properties
    skills: { ... }
  }
}

// Delta payload (compressed - only changed)
{
  agent: {
    health: 80,      // Only changed
    mana: 60         // Only changed
  }
}
```

**Bandwidth savings:** 60-80% reduction for frequent state updates

### Connection Recovery

Automatic state recovery on reconnection:

```
Disconnected (1s)
    ↓
Reconnecting with exponential backoff:
  - Attempt 1: 1s delay
  - Attempt 2: 1.5s delay
  - Attempt 3: 2.25s delay
  - Attempt 4: 3.375s delay
  - Attempt 5: 5s delay (max)
    ↓
Connected & State Recovered
```

---

## API Reference

### SocketManager (Singleton)

```typescript
import { getSocketManager } from './socket/socketManager';

const socketManager = getSocketManager();

// Core Methods
socketManager.connect(): Promise<void>
socketManager.disconnect(): void
socketManager.emit<T>(event: T, payload: SocketEventMap[T], options?): Promise<void>
socketManager.on<T>(event: T, listener: SocketEventListener<T>): () => void
socketManager.once<T>(event: T, listener: SocketEventListener<T>): () => void
socketManager.off<T>(event: T, listener: SocketEventListener<T>): void

// Query Methods
socketManager.isConnected(): boolean
socketManager.getLatency(): number
socketManager.getClientId(): string | null
socketManager.getConnectionState(): ConnectionState
socketManager.measureLatency(): void
```

### Type Definitions

All events are type-safe with TypeScript:

```typescript
// From SocketEventMap
'player:joined' → PlayerJoinedPayload
'state:update' → StateUpdatePayload
'action:execute' → ActionExecutedPayload
'combat:started' → CombatStartedPayload
'combat:action' → CombatActionPayload
'combat:ended' → CombatEndedPayload
'inventory:item-added' → ItemAddedPayload
'enemy:updated' → EnemyUpdatePayload
'network:latency' → { latency: number; timestamp: number }
'error' → ErrorPayload
```

---

## Hook Usage

### useSocketConnection

Manages socket connection lifecycle and connection state.

```typescript
const { 
  isConnected,      // boolean
  clientId,         // string | null
  latency,          // number (ms)
  reconnecting,     // boolean
  connect,          // () => Promise<void>
  disconnect        // () => void
} = useSocketConnection();
```

**Features:**
- Auto-updates Zustand store's `networkState`
- Continuous latency monitoring (every 5s)
- Automatic cleanup on unmount

### useSocketListener

Listen to socket events with automatic cleanup.

```typescript
useSocketListener('combat:started', (payload) => {
  console.log('Combat started:', payload.enemies);
});

// With options
useSocketListener('state:update', handleStateUpdate, {
  immediate: true,
  autoRemove: true
});
```

**Cleanup:** Automatically unsubscribes on unmount.

### useSocketEmit

Emit socket events with batching and compression.

```typescript
const emit = useSocketEmit({
  batch: true,           // Group events (50ms)
  compress: true,        // Delta compression
  priority: 'normal'     // 'low' | 'normal' | 'high'
});

await emit('action:execute', {
  agentId: agent.id,
  actionType: 'attack',
  targetId: enemy.id,
  timestamp: Date.now()
});
```

**Return:** Async function that throws on failure.

### useSocketSync

Comprehensive hook combining connection, listeners, and emission.

```typescript
const {
  isConnected,
  clientId,
  latency,
  reconnecting,
  connect,
  disconnect,
  emit,
  on
} = useSocketSync(autoSync = true);

// autoSync = true: Automatically syncs agent position/health/mana every second
```

### useSocketBatch

Batch multiple events and flush together.

```typescript
const { batch, flush, clear, size } = useSocketBatch();

batch('action:execute', actionPayload);
batch('inventory:item-added', itemPayload);
batch('combat:action', combatPayload);

await flush(); // Send all 3 events as batch
```

### useSocketError

Handle socket errors elegantly.

```typescript
const { error, clearError } = useSocketError();

useEffect(() => {
  if (error) {
    showNotification(error.message, 'error');
    clearError();
  }
}, [error]);
```

---

## Error Handling

### Connection Errors

```typescript
try {
  await connect();
} catch (error) {
  if (error instanceof ConnectionError) {
    console.error('Failed to establish connection:', error.message);
    // Retry with exponential backoff
  }
}
```

### Emission Errors

```typescript
try {
  await emit('action:execute', payload);
} catch (error) {
  console.error('Failed to emit action:', error);
  // Queue for retry or notify user
}
```

### Socket Errors

```typescript
useSocketListener('error', (payload) => {
  console.error(`[${payload.code}] ${payload.message}`, payload.details);
  
  switch (payload.code) {
    case 'SYNC_ERROR':
      // Request full state recovery
      emit('state:recovery-request', {...});
      break;
    case 'CONNECTION_ERROR':
      // Handle connection issues
      break;
  }
});
```

### Graceful Offline Mode

```typescript
const { isConnected, emit } = useSocketSync();

const handleAction = async (action: CombatAction) => {
  if (!isConnected) {
    // Queue action locally
    queueLocalAction(action);
    return;
  }
  
  try {
    await emit('combat:action', action);
  } catch (error) {
    // Fallback to local processing
    processActionLocally(action);
  }
};
```

---

## Code Examples

### Example 1: Simple State Synchronization

```typescript
import { useSocketSync } from './socket/useSocketSync';
import { useGameStore } from './zustand/gameStore';

export function GameComponent() {
  const { isConnected, latency, emit } = useSocketSync(true);
  const currentAgent = useGameStore(state => state.currentAgent);

  return (
    <div>
      <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      <div>Ping: {latency}ms</div>
      {currentAgent && (
        <div>Agent: {currentAgent.name}</div>
      )}
    </div>
  );
}
```

### Example 2: Combat Action Emission

```typescript
import { useSocketEmit } from './socket/useSocketSync';
import { useGameStore } from './zustand/gameStore';

export function CombatPanel() {
  const emit = useSocketEmit({ priority: 'high' });
  const currentAgent = useGameStore(state => state.currentAgent);
  const enemies = useGameStore(state => state.dungeonSession?.currentEnemies);

  const handleAttack = async (targetId: string) => {
    if (!currentAgent) return;

    try {
      await emit('action:execute', {
        agentId: currentAgent.id,
        actionType: 'attack',
        targetId,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Attack failed:', error);
    }
  };

  return (
    <div>
      {enemies?.map(enemy => (
        <button key={enemy.id} onClick={() => handleAttack(enemy.id)}>
          Attack {enemy.name}
        </button>
      ))}
    </div>
  );
}
```

### Example 3: Event Batching

```typescript
import { useSocketBatch } from './socket/useSocketSync';

export function InventoryUI() {
  const { batch, flush, size } = useSocketBatch();

  const handleMultipleActions = async () => {
    // Queue multiple actions
    batch('inventory:item-added', itemPayload1);
    batch('inventory:item-added', itemPayload2);
    batch('inventory:item-added', itemPayload3);

    // Send all together
    await flush();
  };

  return (
    <div>
      <button onClick={handleMultipleActions}>
        Add 3 Items ({size} queued)
      </button>
    </div>
  );
}
```

### Example 4: Real-time Enemy Updates

```typescript
import { useSocketListener } from './socket/useSocketSync';
import { useGameStore } from './zustand/gameStore';

export function EnemyTracker() {
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const updateEnemyHealth = useGameStore(state => state.updateEnemyHealth);

  useSocketListener('enemy:updated', (payload) => {
    // Update local state
    setEnemies(payload.enemies);

    // Sync with Zustand store
    payload.enemies.forEach(enemy => {
      updateEnemyHealth(enemy.id, enemy.health);
    });
  });

  return (
    <div>
      {enemies.map(enemy => (
        <div key={enemy.id}>
          <div>{enemy.name}</div>
          <div>HP: {enemy.health}/{enemy.maxHealth}</div>
        </div>
      ))}
    </div>
  );
}
```

### Example 5: Connection Status Monitoring

```typescript
import { useSocketConnection } from './socket/useSocketSync';

export function ConnectionMonitor() {
  const { isConnected, latency, reconnecting, connect, disconnect } = 
    useSocketConnection();

  return (
    <div className={`connection-status ${isConnected ? 'online' : 'offline'}`}>
      <div>
        Status: {reconnecting ? 'Reconnecting...' : (
          isConnected ? 'Connected' : 'Disconnected'
        )}
      </div>
      <div>Latency: {latency}ms</div>
      <div className="connection-quality">
        {latency < 50 && '🟢 Excellent'}
        {latency >= 50 && latency < 100 && '🟡 Good'}
        {latency >= 100 && latency < 150 && '🟠 Fair'}
        {latency >= 150 && '🔴 Poor'}
      </div>
      <div>
        <button onClick={connect} disabled={isConnected}>Connect</button>
        <button onClick={disconnect} disabled={!isConnected}>Disconnect</button>
      </div>
    </div>
  );
}
```

---

## Best Practices

### 1. Always Cleanup

```typescript
// ✅ Good - Automatic cleanup
useSocketListener('event', handler);

// ❌ Avoid - Manual subscription without cleanup
useEffect(() => {
  const unsubscribe = socketManager.on('event', handler);
  // Missing return/cleanup!
}, []);
```

### 2. Use Batching for Frequent Updates

```typescript
// ✅ Good - Position updates batched every 50ms
const emit = useSocketEmit({ batch: true });
setInterval(() => {
  emit('action:execute', { type: 'move', ... });
}, 100);

// ❌ Avoid - Creates 1 socket event per frame
useAnimationFrame(() => {
  emit('action:execute', { type: 'move', ... });
});
```

### 3. Use Compression for State Updates

```typescript
// ✅ Good - Only sends changed properties
const emit = useSocketEmit({ compress: true });
await emit('state:update', largeStateObject);

// ❌ Avoid - Sends entire state every time
await emit('state:update', { ...largeStateObject });
```

### 4. Handle Offline Scenarios

```typescript
// ✅ Good - Queue actions when offline
const handleAction = async (action) => {
  if (!isConnected) {
    queueLocalAction(action);
    return;
  }
  await emit('action', action);
};

// ❌ Avoid - Fail silently
const handleAction = async (action) => {
  try {
    await emit('action', action);
  } catch (error) {
    // No handling
  }
};
```

### 5. Type-Safe Event Handling

```typescript
// ✅ Good - Type-safe with full intellisense
useSocketListener('combat:action', (payload: CombatActionPayload) => {
  console.log(payload.sourceId, payload.damage);
});

// ❌ Avoid - Unsafe any types
useSocketListener('combat:action', (payload: any) => {
  console.log(payload.unknown);
});
```

### 6. Leverage Zustand Integration

```typescript
// ✅ Good - Keep socket and store in sync
useSocketListener('state:update', (payload) => {
  updateAgentStats(payload.agent.id, payload.agent.stats);
});

// ❌ Avoid - Duplicate state management
useSocketListener('state:update', (payload) => {
  setLocalAgent(payload.agent); // Also in Zustand!
});
```

---

## Performance Tips

1. **Batch frequently-fired events** (position updates, animations)
2. **Compress large state objects** (agent stats, inventory)
3. **Limit listener registrations** (reuse common listeners)
4. **Monitor latency** (use `getLatency()` to optimize)
5. **Implement debouncing** for rapid user actions

## Troubleshooting

### Connection refused
- Check `REACT_APP_SOCKET_URL` environment variable
- Verify server is running on specified port
- Check browser console for CORS errors

### High latency
- Monitor `latency` via `useSocketConnection()`
- Reduce `batch: true` timeout if needed
- Check network conditions

### Events not received
- Verify listener is subscribed **before** event is emitted
- Check event name spelling (case-sensitive)
- Ensure Zustand store is updated in listener

### Memory leaks
- Ensure all `useSocketListener` hooks are unmounted properly
- Use `useEffect` cleanup functions
- Avoid anonymous function listeners

---

## Additional Resources

- [Socket.io Documentation](https://socket.io/docs/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/)
