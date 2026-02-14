# Agent Arena Network Optimization Guide

## Overview

The Network Optimization module (`P1.4`) provides production-ready utilities for reducing bandwidth consumption and optimizing real-time communication in Agent Arena. Expected bandwidth savings: **50-80%**.

## Architecture

```
┌─────────────────────────────────────────────┐
│         Application Layer                    │
│    (Zustand Store, Socket.io Events)        │
└────────────┬────────────────────────────────┘
             │
┌────────────▼────────────────────────────────┐
│      Network Optimization Layer              │
│  ┌──────────────────────────────────────┐   │
│  │  Compression (Delta Encoding)        │   │
│  │  - Only send changed properties      │   │
│  │  - Typical savings: 60-70%           │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │  Throttling & Debouncing             │   │
│  │  - Limit high-frequency events       │   │
│  │  - Smooth updates (60 FPS default)   │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │  Monitoring & Analytics              │   │
│  │  - Real-time bandwidth tracking      │   │
│  │  - Performance metrics               │   │
│  └──────────────────────────────────────┘   │
└────────────┬────────────────────────────────┘
             │
┌────────────▼────────────────────────────────┐
│         Socket.io Transport                  │
│    (Optimized Payload Delivery)              │
└─────────────────────────────────────────────┘
```

## Core Components

### 1. Compression (Delta Encoding)

**Problem**: Sending full game state repeatedly wastes bandwidth
**Solution**: Send only changed properties

```typescript
import { compressDelta, decompressDelta } from '@/network';

// Server-side: Only send what changed
const previousState = { x: 10, y: 20, health: 100 };
const currentState = { x: 15, y: 20, health: 95 };

const delta = compressDelta(currentState, previousState);
// Result: { x: 15, health: 95 } - omits unchanged y

socket.emit('state_update', delta);

// Client-side: Reconstruct full state
const fullState = decompressDelta(delta.data, previousState);
// Result: { x: 15, y: 20, health: 95 }
```

**Bandwidth Savings**: 60-80% for typical game state (only 20-40% of properties change per update)

### 2. Throttling & Debouncing

**Problem**: Mouse movement, collision checks, and sensor events fire hundreds of times per second
**Solution**: Rate-limit function execution

#### Throttle (Consistent Rate)
```typescript
import { throttle } from '@/network';

// Limit position updates to 60 FPS (16ms intervals)
const sendPosition = throttle(
  (x, y) => socket.emit('move', { x, y }),
  16
);

// Called 1000x per second, executes every 16ms
window.addEventListener('mousemove', (e) => {
  sendPosition(e.clientX, e.clientY);
});
```

#### Debounce (Wait Until Action Stops)
```typescript
import { debounce } from '@/network';

// Search only after user stops typing for 300ms
const searchPlayers = debounce(
  (query) => socket.emit('search', { query }),
  300
);

const input = document.querySelector('#search');
input.addEventListener('input', (e) => {
  searchPlayers(e.target.value);
});
```

#### RAF-based Throttle (Smooth 60 FPS)
```typescript
import { throttleRAF } from '@/network';

const updateGameState = throttleRAF((state) => {
  socket.emit('game_update', state);
}, 60); // Syncs with browser refresh rate

// In game loop
gameLoop(() => {
  updateGameState(currentGameState);
});
```

### 3. Request Batching

Reduce network round-trips by grouping related requests:

```typescript
import { RequestQueue } from '@/network';

const queue = new RequestQueue(50); // Batch every 50ms

// Queue multiple requests
const results = await Promise.all([
  queue.add(() => fetchPlayerStats(id1)),
  queue.add(() => fetchPlayerStats(id2)),
  queue.add(() => fetchPlayerStats(id3)),
]);

// All 3 requests batched into 1 network call
```

### 4. Network Monitoring

Real-time performance metrics:

```typescript
import { getNetworkMonitor } from '@/network';

const monitor = getNetworkMonitor();

// Record events
monitor.recordEvent({
  type: 'send',
  size: 256,
  timestamp: Date.now(),
  duration: 12, // latency
  compressed: true
});

// Get current stats
const stats = monitor.getStats();
console.log(`Bandwidth: ${stats.bandwidth} bytes/sec`);
console.log(`Latency: ${stats.latency.toFixed(2)}ms`);
console.log(`Compression: ${(stats.compressionRatio * 100).toFixed(1)}%`);

// Detailed metrics including percentiles
const detailed = monitor.getDetailedStats();
console.log(`P95 Latency: ${detailed.latencyP95}ms`);
```

## Integration Examples

### Example 1: Socket.io + Zustand (Game State)

```typescript
import { useGameStore } from '@/store';
import { compressDelta, throttle } from '@/network';
import { socket } from '@/socket';

// In your Zustand store
export const useGameStore = create((set, get) => ({
  gameState: { x: 0, y: 0, health: 100 },
  
  // Optimized state update
  updatePosition: throttle(
    (x: number, y: number) => {
      const prev = get().gameState;
      const next = { ...prev, x, y };
      
      // Send delta
      const delta = compressDelta(next, prev);
      socket.emit('update_position', delta);
      
      // Update local state
      set({ gameState: next });
    },
    16 // 60 FPS
  ),
}));

// In React component
function GameCanvas() {
  const updatePosition = useGameStore((s) => s.updatePosition);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    updatePosition(e.clientX, e.clientY);
  };
  
  return <canvas onMouseMove={handleMouseMove} />;
}
```

### Example 2: Socket.io Listener with Decompression

```typescript
import { decompressDelta, getNetworkMonitor } from '@/network';
import { useGameStore } from '@/store';

const monitor = getNetworkMonitor();

socket.on('game_update', (compressed) => {
  const startTime = Date.now();
  
  // Decompress delta
  const current = useGameStore.getState().gameState;
  const updated = decompressDelta(compressed.data, current);
  
  // Update store
  useGameStore.setState({ gameState: updated });
  
  // Track metrics
  monitor.recordEvent({
    type: 'receive',
    size: compressed.compressedSize,
    timestamp: Date.now(),
    duration: Date.now() - startTime,
    compressed: true,
  });
});
```

### Example 3: High-Frequency Event Monitoring

```typescript
import { throttleRAF, getNetworkMonitor } from '@/network';

const monitor = getNetworkMonitor();

// Smooth sensor updates at 60 FPS
const sendSensorData = throttleRAF((data) => {
  socket.emit('sensor', data);
}, 60);

// In game loop
function gameLoop() {
  const sensorData = readSensor();
  sendSensorData(sensorData);
  
  // Optional: Log stats periodically
  if (frameCount % 300 === 0) {
    const stats = monitor.getStats();
    console.log(`Network Stats: ${JSON.stringify(stats)}`);
  }
}
```

## Best Practices for Real-Time Games

### 1. Always Use Compression for Game State
```typescript
// ✅ GOOD
const delta = compressDelta(newState, oldState);
socket.emit('state', delta); // 256 bytes

// ❌ BAD - Wastes bandwidth
socket.emit('state', newState); // 1024 bytes
```

### 2. Throttle High-Frequency Events
```typescript
// ✅ GOOD - Limit to 60 FPS
const throttledMove = throttle(emitMove, 16);

// ❌ BAD - Floods network
window.addEventListener('mousemove', emitMove);
```

### 3. Use RAF-based Throttle for Visual Sync
```typescript
// ✅ GOOD - Syncs with display refresh
const update = throttleRAF(emitUpdate, 60);

// ❌ BAD - May not align with frame rendering
const update = throttle(emitUpdate, 16);
```

### 4. Monitor Compression Efficiency
```typescript
// Track if compression is effective
const stats = monitor.getStats();
if (stats.compressionRatio < 0.7) {
  // Good: Saving 30% or more
  console.log('✅ Compression effective');
} else {
  // Warning: Low compression efficiency
  console.warn('⚠️ Check if delta encoding is optimal');
}
```

### 5. Batch Related Requests
```typescript
// ✅ GOOD - Single network call
const queue = new RequestQueue();
const results = await Promise.all([
  queue.add(() => fetchPlayer(id1)),
  queue.add(() => fetchPlayer(id2)),
]);

// ❌ BAD - Multiple network calls
const p1 = await fetchPlayer(id1);
const p2 = await fetchPlayer(id2);
```

## Performance Targets

| Metric | Target | Impact |
|--------|--------|--------|
| Compression Ratio | < 0.3 (70% savings) | 50-80% bandwidth reduction |
| Throttle Interval | 16-32ms | Smooth 30-60 FPS updates |
| Latency (p95) | < 100ms | Good gameplay feel |
| Packet Loss | < 1% | Stable connections |
| Monitor Overhead | < 2% CPU | Negligible impact |

## API Reference

### Compression
- `compressDelta(current, previous)` - Get delta payload
- `decompressDelta(delta, previous)` - Reconstruct state
- `calculateCompressionRatio(originalSize, compressedSize)` - Measure efficiency
- `createChecksum(data)` - Verify integrity

### Throttling
- `throttle(fn, interval)` - Rate-limit execution
- `debounce(fn, delay)` - Delay until action stops
- `throttleRAF(fn, fps)` - Sync with browser refresh
- `RequestQueue` - Batch network requests

### Monitoring
- `NetworkMonitor` - Track performance metrics
- `getNetworkMonitor()` - Get global instance
- `recordEvent()` - Log network activity
- `getStats()` - Get current metrics
- `getDetailedStats()` - Percentiles and detailed breakdown

## Troubleshooting

**Q: Compression ratio is high (> 0.8)?**
A: Check if many properties are changing. Consider splitting state into hot (frequently changed) and cold (rarely changed) objects.

**Q: Latency is high after enabling compression?**
A: Decompression overhead is minimal. Check network latency with `monitor.getStats().latency`.

**Q: Monitor is using too much memory?**
A: Call `monitor.cleanup(60000)` periodically to remove old events.

## Zero Impact Guarantee

The Network Optimization module is designed with **zero breaking changes**:
- Existing Socket.io calls work unchanged
- Zustand store integration is optional
- Compression/throttling are opt-in per feature
- Monitor runs silently until explicitly called
- Can be disabled entirely without code changes

---

*Last Updated: 2026-02-13*
*Version: 1.0.0*
