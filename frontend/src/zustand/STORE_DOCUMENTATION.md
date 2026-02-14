# Zustand Store Documentation

## Overview

The Agent Arena 3D Roguelike uses **Zustand** for real-time, high-performance state management. This store handles all game state including agent stats, dungeon progression, inventory, combat, and network synchronization.

## Architecture

### Files

- **`types.ts`** - Complete TypeScript definitions for all game state
- **`gameStore.ts`** - Main Zustand store with actions and persistence
- **`useGameState.ts`** - Custom React hooks for accessing state with optimized selectors
- **`index.ts`** - Central export file

### Design Principles

1. **Immutability** - All state updates are immutable (never mutate directly)
2. **Granular Updates** - Actions update only what's necessary
3. **Performance** - Selectors prevent unnecessary re-renders
4. **Persistence** - State automatically saved to localStorage
5. **Type Safety** - Full TypeScript support with strict typing

## Core Concepts

### 1. Game State Structure

```
GameStoreState
├── Agents & Players
│   ├── currentAgent (the active agent)
│   └── agents (list of all agents)
├── Dungeon
│   ├── currentDungeon
│   └── dungeonSession
├── UI & Mode
│   ├── currentMode (menu, dungeon, inventory, skills, map)
│   └── gameState (idle, exploring, combat, levelUp, dead, paused)
├── Network
│   └── networkState (connection status, latency)
├── Settings
│   └── settings (audio, graphics, input, accessibility)
└── Metadata
    └── lastUpdate (timestamp)
```

### 2. Agent Structure

```
Agent
├── id & userId
├── name & class (warrior, mage, rogue, paladin)
├── stats (level, health, mana, attack, defense, speed, etc.)
├── skills (skill trees, allocated points, active abilities)
├── inventory (items, crafting materials, gold)
├── equipment (weapon, armor, rings, amulet, etc.)
├── position & rotation (3D coordinates)
└── statusEffects (buffs, debuffs, conditions)
```

### 3. Dungeon Structure

```
Dungeon
├── id & difficulty (easy, normal, hard, nightmare)
├── currentFloor & maxFloor
├── rooms (all rooms in dungeon)
├── currentRoomId (active room)
└── progress (time, gold, xp)
```

## Usage Examples

### Basic Setup in React Components

```typescript
import {
  useCurrentAgent,
  useGameActions,
  useGameState,
} from '@/zustand';

export function GameComponent() {
  // Hook into state
  const agent = useCurrentAgent();
  const gameState = useGameState();
  
  // Get all actions
  const { updateAgentStats, startDungeon } = useGameActions();

  return (
    <div>
      <h1>{agent?.name}</h1>
      <p>Level: {agent?.stats.level}</p>
      <button onClick={() => updateAgentStats(agent!.id, { health: 100 })}>
        Heal
      </button>
    </div>
  );
}
```

### Accessing Specific State

```typescript
// Get current agent
const agent = useCurrentAgent();

// Get inventory
const inventory = useInventory();

// Get equipped items
const equipment = useEquippedItems();

// Get active abilities
const skills = useSkillTrees();

// Get dungeon rooms
const rooms = useDungeonRooms();

// Get current room
const currentRoom = useCurrentRoom();

// Get status effects
const effects = useStatusEffects();

// Get combat state
const inCombat = useInCombat();
const enemies = useCurrentEnemies();
```

### Updating Agent Stats

```typescript
const { updateAgentStats } = useGameActions();

// Update multiple stats at once
updateAgentStats(agentId, {
  health: 150,
  mana: 100,
  level: 5,
  experience: 1000,
});

// Update single stat
updateAgentStats(agentId, { attack: 25 });
```

### Managing Inventory

```typescript
const { addItem, removeItem, equipItem } = useGameActions();

// Add item to inventory
addItem(swordItem, 1);

// Remove item
removeItem(itemId, 1);

// Equip item in slot
equipItem(armorItem, 'armor');

// Check inventory
const inventory = useInventory();
const totalSlots = inventory.length;
```

### Combat Management

```typescript
const { startCombat, endCombat, updateEnemyHealth } = useGameActions();

// Start combat encounter
const enemies = [enemy1, enemy2];
startCombat(enemies);

// Update enemy health during combat
updateEnemyHealth(enemyId, newHealth);

// End combat
endCombat();

// Check if in combat
const inCombat = useInCombat();
```

### Dungeon Progression

```typescript
const { 
  startDungeon, 
  moveToRoom, 
  discoverRoom,
  updateDungeonSession,
} = useGameActions();

// Start new dungeon run
startDungeon(dungeonData);

// Move to room
moveToRoom(roomId);

// Discover room
discoverRoom(roomId);

// Check progress
const progress = useDungeonProgress();
console.log(`Floor ${progress.currentFloor}/${progress.maxFloor}`);
```

### Skill Tree Management

```typescript
const { allocateSkillPoints, setActiveAbility } = useGameActions();

// Allocate skill points to nodes
allocateSkillPoints(5, ['node1', 'node2', 'node3']);

// Set active ability
setActiveAbility('fireball');

// Check skills
const skills = useSkillTrees();
```

### Status Effects

```typescript
const { addStatusEffect, removeStatusEffect } = useGameActions();

// Add effect
addStatusEffect({
  type: 'stun',
  duration: 3000,
  potency: 1.0,
  source: 'player',
});

// Remove effect
removeStatusEffect('stun');

// Check effects
const effects = useStatusEffects();
```

### Network State Management

```typescript
const { updateNetworkState } = useGameActions();
const networkState = useNetworkState();

// Update network state
updateNetworkState({
  isConnected: true,
  latency: 45,
  lastSyncTime: Date.now(),
  connectionStatus: 'connected',
});

// Check connection
if (networkState.isConnected) {
  console.log(`Ping: ${networkState.latency}ms`);
}
```

### Game Settings

```typescript
const { updateSettings } = useUpdateSettings();
const settings = useGameSettings();

// Update settings
updateSettings({
  masterVolume: 0.8,
  graphicsQuality: 'ultra',
  fpsTarget: 120,
});

// Access settings
console.log(`Volume: ${settings.masterVolume}`);
console.log(`Graphics: ${settings.graphicsQuality}`);
```

### Pause/Resume

```typescript
const { togglePause } = useGameActions();
const isPaused = useIsPaused();

// Toggle pause state
togglePause();

// Check if paused
if (isPaused) {
  // Show pause menu
}
```

## Performance Optimization

### Using Selectors

The store provides optimized selectors that prevent unnecessary re-renders:

```typescript
// ❌ Bad - subscribes to entire store
const allState = useGameStore();

// ✅ Good - subscribes only to what you need
const agent = useCurrentAgent();
const dungeon = useCurrentDungeon();
```

### Memoization

Custom hooks already use memoization for complex selectors:

```typescript
// These are memoized to prevent excessive recalculations
const inventory = useInventory();
const equipment = useEquippedItems();
const currentRoom = useCurrentRoom();
```

### Batching Actions

For multiple related updates, use a single action or batch them:

```typescript
// Multiple stats at once is better than individual calls
updateAgentStats(agentId, {
  health: 100,
  mana: 50,
  level: 5,
});
```

## Persistence

The store automatically persists to localStorage with these features:

- **Auto-save** - Changes saved immediately
- **Auto-load** - State restored on app startup
- **Version tracking** - Supports schema migrations
- **Selective persistence** - Can exclude fields if needed

### Clearing Persisted State

```typescript
const { resetGame } = useGameActions();

// Reset all game state (clears localStorage)
resetGame();
```

## Synchronization with Server

For multiplayer/networked features:

```typescript
// Update network state when sync occurs
const { updateNetworkState, syncState } = useGameActions();

// After server sync
updateNetworkState({
  isConnected: true,
  latency: calculateLatency(),
  lastSyncTime: Date.now(),
  connectionStatus: 'connected',
});

// Mark state as synced
syncState();
```

## Best Practices

1. **Use specific hooks** - Don't pull the entire store when you only need one field
2. **Keep actions focused** - Each action should update one logical unit of state
3. **Memoize selectors** - Use the provided hooks for memoized access
4. **Handle errors gracefully** - Validate data before updating
5. **Log for debugging** - Use Redux DevTools middleware if needed
6. **Test state changes** - Write tests for complex state logic

## Common Patterns

### Loading Game

```typescript
const { setCurrentAgent, startDungeon } = useGameActions();

async function loadGame(agentId: string) {
  const agent = await fetchAgent(agentId);
  setCurrentAgent(agent);

  const dungeon = await fetchDungeon();
  startDungeon(dungeon);
}
```

### Saving Progress

```typescript
const agent = useCurrentAgent();
const dungeon = useCurrentDungeon();

// State is auto-saved to localStorage
// For server sync:
async function saveToServer() {
  await api.post('/agents', agent);
  await api.post('/dungeons', dungeon);
}
```

### Handling Leveling

```typescript
const { updateAgentStats, setGameState } = useGameActions();

async function levelUp(agentId: string) {
  updateAgentStats(agentId, {
    level: agent.stats.level + 1,
    experience: 0, // Reset XP
  });

  setGameState('levelUp');
  // Show level up UI
  
  setTimeout(() => {
    setGameState('exploring');
  }, 3000);
}
```

## Debugging

### Check Store State in Console

```typescript
// In browser console:
const store = (window as any).__zustand_store;
console.log(store.getState());
```

### Monitor State Changes

```typescript
import { useGameStore } from '@/zustand';

useGameStore.subscribe((state) => {
  console.log('State updated:', state.lastUpdate);
});
```

## Type Safety

The store is fully typed with TypeScript. All actions and state are properly typed:

```typescript
import type {
  Agent,
  GameState,
  ItemRarity,
  StatusEffectType,
} from '@/zustand';

const agent: Agent = {
  // Full type checking
};

const state: GameState = 'combat'; // Only valid values allowed
```

## Future Enhancements

- [ ] Redux DevTools integration for easier debugging
- [ ] Immer middleware for immutable updates
- [ ] Time-travel debugging
- [ ] State snapshots for replays
- [ ] Auto-sync with WebSocket
- [ ] Undo/redo functionality

---

**Last Updated**: 2026-02-13  
**Version**: 1.0.0  
**Status**: Production Ready ✅
