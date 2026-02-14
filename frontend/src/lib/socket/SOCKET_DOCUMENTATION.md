# Socket.io Real-time Synchronization Documentation

## Overview

Agent Arena uses **Socket.io** for real-time, bidirectional communication between client and server. This module handles:

- ✅ **State Delta Sync** - Only sends changed values (compression)
- ✅ **Event Batching** - Groups multiple updates into single packets
- ✅ **Automatic Reconnection** - Handles network failures gracefully
- ✅ **Latency Tracking** - Measures round-trip time
- ✅ **Client Prediction** - Interpolates positions for smooth animation
- ✅ **Pending Action Queue** - Resends failed actions on reconnect

## Architecture

### Components

1. **SocketManager** - Core socket connection & state sync logic
2. **useSocketSync** - React hook integrating socket with Zustand store
3. **Types** - TypeScript definitions for all events

### Data Flow

```
Local Game State (Zustand)
        ↓
   sendDelta() 
        ↓
  Event Batch
        ↓
  Socket.io
        ↓
    Server
        ↓
  (Validation & Broadcasting)
        ↓
  Other Clients
        ↓
  game:state-delta
        ↓
  applyDelta()
        ↓
  Update Local State
```

## Usage

### Basic Setup

```typescript
import { useSocketSync } from '@/lib/socket';
import { useEffect } from 'react';

export function GameComponent() {
  const { connect, disconnect, sendDelta, getConnectionInfo } = useSocketSync({
    autoConnect: true,
    userId: 'user-123',
    agentId: 'agent-456',
    onConnected: () => console.log('Connected!'),
    onDisconnected: (reason) => console.log('Disconnected:', reason),
    onError: (error) => console.error('Error:', error),
    onLatencyUpdate: (latency) => console.log('Ping:', latency + 'ms'),
  });

  // Manual disconnect on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return (
    <div>
      <button onClick={() => getConnectionInfo()}>
        Check Connection
      </button>
    </div>
  );
}
```

### Sending State Deltas

```typescript
const { sendDelta } = useSocketSync();

// Update agent position
sendDelta({
  agentId: 'agent-123',
  agentPosition: { x: 10, y: 20, z: 5 },
});

// Update multiple stats
sendDelta({
  agentId: 'agent-123',
  agentStats: {
    health: 80,
    mana: 50,
  },
});

// Update inventory
sendDelta({
  agentId: 'agent-123',
  inventory: {
    gold: 250,
    items: [{ itemId: 'sword-1', quantity: 1 }],
  },
});

// Multiple updates in one delta
sendDelta({
  agentId: 'agent-123',
  agentStats: { health: 75 },
  agentPosition: { x: 15, y: 25, z: 5 },
  statusEffects: [
    { type: 'burn', duration: 5000, potency: 1.0 },
  ],
});
```

### Monitoring Connection

```typescript
import { useSocketConnectionStatus } from '@/lib/socket';

export function ConnectionStatus() {
  const networkState = useSocketConnectionStatus();

  return (
    <div>
      <p>
        Status: {networkState.connectionStatus}
      </p>
      <p>
        Latency: {networkState.latency}ms
      </p>
    </div>
  );
}
```

### Manual Control

```typescript
const { 
  socket, 
  connect, 
  disconnect, 
  requestSync,
  getConnectionInfo,
} = useSocketSync({ autoConnect: false });

// Manual connect
await connect();

// Request full state sync
requestSync();

// Get connection info
const info = getConnectionInfo();
console.log(info);
// {
//   isConnected: true,
//   latency: 45,
//   connectionState: { ... },
//   syncState: { ... }
// }

// Manual disconnect
await disconnect();
```

## Event Types

### Connection Events

| Event | Fired When | Data |
|-------|-----------|------|
| `socket:connected` | Connected to server | - |
| `socket:disconnected` | Disconnected from server | reason: string |
| `socket:error` | Socket error occurs | error: Error |
| `socket:reconnected` | Reconnected after failure | attemptNumber: number |
| `socket:reconnect-attempt` | Attempting to reconnect | attemptNumber: number |

### Game State Events

| Event | Sent By | Description |
|-------|---------|-------------|
| `game:sync-request` | Client | Request full state sync |
| `game:sync-response` | Server | Send state deltas & full state |
| `game:state-delta` | Both | Single state update |
| `game:state-batch` | Client | Batch of deltas |

### Player Action Events

| Event | Sent By | Description |
|-------|---------|-------------|
| `player:move` | Client | Agent position change |
| `player:attack` | Client | Attack action |
| `player:use-ability` | Client | Ability activation |
| `player:equip-item` | Client | Equip/unequip item |

### Combat Events

| Event | Sent By | Description |
|-------|---------|-------------|
| `combat:start` | Server | Combat initiated |
| `combat:end` | Server | Combat ended |
| `combat:action` | Both | Combat action performed |
| `combat:enemy-action` | Server | Enemy action |

## State Deltas

Deltas contain only changed properties (compression):

```typescript
interface StateDelta {
  agentId?: string;
  agentStats?: Partial<AgentStats>;  // Only changed stats
  agentPosition?: Vector3;             // Only if moved
  dungeonState?: Partial<DungeonState>;
  inventory?: {
    items?: ItemUpdate[];
    gold?: number;
  };
  statusEffects?: StatusEffect[];
  enemies?: EnemyUpdate[];
  timestamp: number;
  sequenceNumber: number;
}
```

**Benefits:**
- ✅ Smaller packet size (compression)
- ✅ Faster transmission
- ✅ Lower bandwidth usage
- ✅ Reduced server load

## Event Batching

Multiple deltas are grouped into batches:

- **Batch Interval**: 16ms (~60 FPS)
- **Max Batch Size**: 50 events
- **Auto-flush**: When batch reaches max size or interval expires

```typescript
// All these are batched together (sent within 16ms)
sendDelta({ agentPosition: { x: 10, y: 20, z: 5 } });
sendDelta({ agentStats: { health: 80 } });
sendDelta({ inventory: { gold: 250 } });

// Sent as single batch packet to server
// 3 events → 1 packet (compression!)
```

## Compression Statistics

```typescript
import { useSocketCompressionStats } from '@/lib/socket';

export function CompressionStatsPanel() {
  const getStats = useSocketCompressionStats();

  const stats = getStats();
  // {
  //   totalOriginalSize: 15000 bytes,
  //   totalCompressedSize: 3500 bytes,
  //   eventsProcessed: 250,
  //   compressionRatio: "23.33%"
  // }

  return (
    <div>
      <p>Compression: {stats.compressionRatio}</p>
      <p>Events: {stats.eventsProcessed}</p>
    </div>
  );
}
```

## Connection Recovery

The system automatically handles:

1. **Temporary Disconnection**
   - Queues actions locally
   - Attempts reconnection (5 tries)
   - Resends pending actions on reconnect

2. **Full State Resync**
   - Server can request full resync if desync detected
   - Client requests sync on connect
   - Deltas applied after sync

3. **Latency Tracking**
   - Measures round-trip time every 30 seconds
   - Updates UI with current latency
   - Helps detect network issues

## Configuration

### Custom Config

```typescript
const { socket } = useSocketSync({
  // ... hook options
});

// Access socket manager for advanced config
const connectionState = socket.getConnectionState();
const syncState = socket.getSyncState();
const stats = socket.getCompressionStats();
```

### Environment Variables

```env
# .env.local
REACT_APP_SOCKET_URL=http://localhost:3000
REACT_APP_SOCKET_PATH=/socket.io/
```

## Performance Optimization

### 1. Event Batching
- Automatically groups deltas
- Reduces packet overhead
- Configurable batch interval & size

### 2. State Delta Compression
- Only changed values sent
- Server validates before broadcast
- Unused fields omitted

### 3. Client Prediction
- Position interpolation (smooth movement)
- Pending action queue
- Resend on reconnect

### 4. Lazy Sync
- Only sync on connect/reconnect
- Avoid redundant full state transfers
- Delta-based incremental updates

## Best Practices

### ✅ DO

```typescript
// Batch related updates
sendDelta({
  agentId: 'agent-123',
  agentStats: { health: 80, mana: 50 },
  agentPosition: { x: 10, y: 20, z: 5 },
});

// Use delta compression (omit unchanged values)
sendDelta({
  agentId: 'agent-123',
  agentPosition: { x: 10, y: 20, z: 5 }, // Changed
  // Don't include health if it didn't change!
});

// Handle disconnection gracefully
const { 
  connect, 
  disconnect, 
  onDisconnected 
} = useSocketSync({
  onDisconnected: (reason) => {
    // Update UI to show offline mode
  },
});

// Monitor latency
const { onLatencyUpdate } = useSocketSync({
  onLatencyUpdate: (latency) => {
    if (latency > 200) {
      console.warn('High latency detected');
    }
  },
});
```

### ❌ DON'T

```typescript
// Don't send individual updates rapidly
for (const stat in statUpdates) {
  sendDelta({ [stat]: value }); // Wrong!
}
// Instead batch them:
sendDelta(statUpdates); // Right!

// Don't include unchanged values
sendDelta({
  agentStats: {
    health: 80,
    mana: 50,
    attack: 15, // Unchanged!
  },
});

// Don't forget to handle disconnection
const { socket } = useSocketSync();
// Missing error/disconnection handlers!

// Don't send huge deltas
sendDelta({
  agentStats: { ...allStats }, // Too much!
});
```

## Troubleshooting

### High Latency

```typescript
const { onLatencyUpdate } = useSocketSync({
  onLatencyUpdate: (latency) => {
    if (latency > 150) {
      console.warn(`High latency: ${latency}ms`);
      // Reduce update frequency or show warning
    }
  },
});
```

### Frequent Disconnections

```typescript
const { getConnectionInfo } = useSocketSync({
  onDisconnected: (reason) => {
    console.log('Disconnected:', reason);
    const info = getConnectionInfo();
    console.log('Reconnect attempts:', 
      info.syncState.reconnectAttempts);
  },
});
```

### State Desync

```typescript
const { requestSync } = useSocketSync();

// Manually request full sync if needed
requestSync();
```

### Compression Not Working

```typescript
const getStats = useSocketCompressionStats();
const stats = getStats();

console.log('Compression ratio:', stats.compressionRatio);
// If ratio is 100%, compression isn't helping
// Review delta contents
```

## Server-Side Integration

The server receives events and:

1. **Validates** state deltas
2. **Broadcasts** to other players
3. **Persists** to database
4. **Detects desyncs** and requests resync if needed

Example server handler:

```typescript
// Server-side (Node.js)
socket.on('game:state-batch', (batch) => {
  batch.events.forEach(delta => {
    // Validate delta
    validateDelta(delta);
    
    // Apply to server state
    applyDeltaToServer(delta);
    
    // Broadcast to other clients
    socket.broadcast.emit('game:state-delta', delta);
  });
});
```

## Monitoring & Analytics

```typescript
import { useSocketCompressionStats } from '@/lib/socket';

export function NetworkPanel() {
  const getStats = useSocketCompressionStats();
  const networkState = useSocketConnectionStatus();

  return (
    <div>
      <div>Status: {networkState.connectionStatus}</div>
      <div>Latency: {networkState.latency}ms</div>
      <div>
        Compression: {getStats().compressionRatio}
      </div>
      <div>
        Events: {getStats().eventsProcessed}
      </div>
    </div>
  );
}
```

## Complete Example

```typescript
import React, { useEffect } from 'react';
import {
  useSocketSync,
  useSocketConnectionStatus,
  useSocketCompressionStats,
} from '@/lib/socket';
import { useCurrentAgent } from '@/zustand';

export function GameScene() {
  const agent = useCurrentAgent();
  const { sendDelta, requestSync, disconnect } = useSocketSync({
    autoConnect: true,
    userId: agent?.userId,
    agentId: agent?.id,
    onConnected: () => console.log('✅ Connected'),
    onDisconnected: (r) => console.log('❌ Disconnected:', r),
    onError: (e) => console.error('⚠️ Error:', e),
  });

  const networkState = useSocketConnectionStatus();
  const getStats = useSocketCompressionStats();

  // Send position updates
  const handleMove = (x: number, y: number, z: number) => {
    sendDelta({
      agentId: agent?.id,
      agentPosition: { x, y, z },
    });
  };

  // Send stat updates
  const handleDamage = (damage: number) => {
    const newHealth = (agent?.health || 0) - damage;
    sendDelta({
      agentId: agent?.id,
      agentStats: { health: Math.max(0, newHealth) },
    });
  };

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return (
    <div>
      <div>
        Status: {networkState.connectionStatus}
      </div>
      <div>
        Latency: {networkState.latency}ms
      </div>
      <div>
        Compression: {getStats().compressionRatio}
      </div>
      <button onClick={() => handleMove(10, 20, 5)}>
        Move
      </button>
      <button onClick={() => handleDamage(10)}>
        Take Damage
      </button>
      <button onClick={() => requestSync()}>
        Sync State
      </button>
    </div>
  );
}
```

---

**Last Updated**: 2026-02-13  
**Status**: Production Ready ✅  
**Version**: 1.0.0
