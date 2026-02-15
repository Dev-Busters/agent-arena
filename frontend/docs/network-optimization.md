# Network Optimization - Client Prediction & Entity Interpolation

## Overview
Agent Arena uses client-side prediction and entity interpolation to provide smooth, responsive gameplay even with network latency.

## Architecture

### Client-Side Prediction (`clientPrediction.ts`)
**Purpose:** Eliminate input lag by predicting player movement locally before server confirmation.

**How it works:**
1. **Apply Input Locally** - Player moves instantly when pressing WASD
2. **Store Input History** - Track all inputs with sequence numbers
3. **Reconcile with Server** - When server confirms position, check for mismatches
4. **Replay if Needed** - If server disagrees, rewind and replay pending inputs

**Key Methods:**
```typescript
// Apply input and get predicted state
const prediction = clientPrediction.applyInput(
  currentPosition,
  currentVelocity,
  moveX,
  moveZ,
  deltaTime
);

// Reconcile with server state
const correctedPosition = clientPrediction.reconcile({
  position: serverPosition,
  velocity: serverVelocity,
  timestamp: serverTime,
  lastProcessedInput: serverSequence,
});
```

**Benefits:**
- Zero input lag (movement feels instant)
- Handles network latency gracefully (up to 200-300ms)
- Automatically corrects drift when server disagrees
- Memory-safe (auto-cleanup of old predictions)

---

### Entity Interpolation (`entityInterpolation.ts`)
**Purpose:** Smooth out jittery entity movement from periodic server updates.

**How it works:**
1. **Buffer Snapshots** - Store recent position updates from server
2. **Render in Past** - Display entities 100ms behind real-time
3. **Interpolate Smoothly** - Blend between buffered snapshots
4. **Extrapolate Briefly** - Predict forward if updates delayed

**Key Methods:**
```typescript
// Add server snapshot
entityInterpolation.addSnapshot(position, velocity, timestamp);

// Get smooth interpolated position
const smoothPosition = entityInterpolation.getInterpolatedPosition(renderTime);

// Or extrapolate when server is delayed
const predictedPosition = entityInterpolation.getExtrapolatedPosition(renderTime);
```

**Benefits:**
- Silky-smooth enemy movement (no stuttering)
- Hides network jitter (irregular update intervals)
- Works with 10-60 tick/sec server rates
- Auto-cleanup (prevents memory leaks)

---

## Integration in Dungeon3DView

### Player Movement (Client Prediction)
```typescript
// In updatePlayerMovement()
const prediction = clientPredictionRef.current.applyInput(
  player.mesh.position,
  velocity,
  moveX,
  moveZ,
  deltaTime
);

// Apply predicted position instantly
player.mesh.position.copy(prediction.position);

// Later, when server confirms:
// (In Socket.io listener)
const corrected = clientPredictionRef.current.reconcile(serverState);
if (corrected) {
  player.mesh.position.copy(corrected);
}
```

### Enemy Movement (Entity Interpolation)
```typescript
// When server sends enemy update:
entityInterpolationRef.current.updateEntity(
  enemyId,
  position,
  velocity,
  timestamp
);

// In update loop, get smooth position:
const smoothPos = entityInterpolationRef.current.getEntityPosition(
  enemyId,
  Date.now()
);
if (smoothPos) {
  enemy.mesh.position.copy(smoothPos);
}
```

---

## Configuration

### Client Prediction Settings
```typescript
// Adjust reconciliation threshold (how much error triggers correction)
clientPrediction.setReconciliationThreshold(0.1); // meters (default: 0.1)

// Max time to keep prediction history
// (default: 1000ms = 1 second)
```

### Entity Interpolation Settings
```typescript
// Interpolation delay (higher = smoother but more lag)
entityInterpolation.setInterpolationDelay(100); // ms (default: 100)

// Range: 50ms (responsive) to 200ms (very smooth)
```

---

## Performance Characteristics

### Client Prediction
- **Memory:** ~100 bytes per pending input (max ~10-20 at 200ms latency)
- **CPU:** Negligible (simple vector math)
- **Benefit:** Eliminates 50-200ms input lag

### Entity Interpolation
- **Memory:** ~200 bytes per entity per snapshot (max ~5-10 snapshots)
- **CPU:** Minimal (linear interpolation per entity per frame)
- **Benefit:** Smooth 60 FPS rendering from 10-30 tick/sec server

---

## Testing Tips

### Simulate Network Lag (Chrome DevTools)
1. Open DevTools → Network tab
2. Click "Online" dropdown
3. Select "Slow 3G" or custom throttling
4. Movement should still feel responsive!

### Expected Behavior
- **Good Network:** Movement feels instant, enemies glide smoothly
- **200ms Latency:** Still responsive, enemies smooth (slight delay on position corrections)
- **500ms+ Latency:** Rubber-banding may occur (prediction errors → corrections)

---

## Future Enhancements

### Lag Compensation for Combat
When player attacks, server can "rewind" enemy positions to account for network delay:
```typescript
// Server-side
const lagMs = player.ping;
const enemyPosAtClientTime = interpolateBack(enemy, lagMs);
const hit = checkCollision(attackRay, enemyPosAtClientTime);
```

### Adaptive Interpolation Delay
Automatically adjust delay based on observed jitter:
```typescript
const jitter = measureJitter();
const optimalDelay = Math.max(50, Math.min(200, jitter * 2));
entityInterpolation.setInterpolationDelay(optimalDelay);
```

### Dead Reckoning
Predict enemy movement using velocity + acceleration:
```typescript
const predicted = enemy.position
  .add(enemy.velocity.multiplyScalar(dt))
  .add(enemy.acceleration.multiplyScalar(0.5 * dt * dt));
```

---

## References
- [Fast-Paced Multiplayer (Gabriel Gambetta)](https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html)
- [Source Multiplayer Networking](https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking)
- [Overwatch Gameplay Architecture](https://www.youtube.com/watch?v=W3aieHjyNvw)
