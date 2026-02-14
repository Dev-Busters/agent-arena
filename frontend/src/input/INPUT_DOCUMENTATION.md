# Input Handler Documentation

## Overview

The P1.3 Input Handler provides a complete input management system for the Agent Arena frontend. It handles keyboard, mouse, and gamepad input with built-in debouncing, action queuing, and combo chain support.

## Architecture

```
Event Layer (DOM Events)
    ↓
InputManager (Singleton)
    ├─ Event Listeners (keyboard, mouse, gamepad)
    ├─ State Management
    ├─ Action Queue
    └─ Debouncing
    ↓
React Hooks (usePlayerInput, useKeyBind, etc.)
    ↓
Game Logic (Zustand Store, Socket.io)
```

## Default Key Bindings

| Key | Action | Alternative |
|-----|--------|-------------|
| W | Move Up | Arrow Up |
| S | Move Down | Arrow Down |
| A | Move Left | Arrow Left |
| D | Move Right | Arrow Right |
| Space | Attack | - |
| E | Interact | - |
| Q | Use Skill | - |
| Shift | Dash | - |
| I | Open Inventory | - |
| Esc | Open Menu | - |
| P | Pause | - |

## How to Use

### 1. Initialize in App Root

```typescript
import { useInputManager } from '@/input/useInput';

export function App() {
  // Initialize input manager once
  useInputManager();

  return (
    // Your app components
  );
}
```

### 2. Get Input State in a Component

```typescript
import { usePlayerInput } from '@/input/useInput';

export function PlayerMovement() {
  const { inputState, isKeyPressed } = usePlayerInput();

  return (
    <div>
      <p>Mouse: {inputState.mousePosition.x}, {inputState.mousePosition.y}</p>
      <p>A Pressed: {isKeyPressed('a') ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### 3. Listen to Specific Actions

```typescript
import { useKeyBind } from '@/input/useInput';
import { PlayerAction } from '@/input/types';

export function AttackButton() {
  const [isAttacking, setIsAttacking] = useState(false);

  useKeyBind(PlayerAction.ATTACK, () => {
    setIsAttacking(true);
    setTimeout(() => setIsAttacking(false), 100);
  });

  return <button className={isAttacking ? 'active' : ''}>Attack</button>;
}
```

### 4. Handle Action Queue (Game Loop)

```typescript
import { usePlayerInput } from '@/input/useInput';
import { useStore } from '@/store';

export function GameLoop() {
  const { dequeueAction } = usePlayerInput();
  const dispatch = useStore((state) => state.dispatch);

  useAnimationFrame(() => {
    let action = dequeueAction();
    while (action) {
      dispatch({ type: 'executeAction', payload: action });
      action = dequeueAction();
    }
  });

  return null;
}
```

### 5. Process Gamepad Input

```typescript
import { useGamepadInput } from '@/input/useInput';

export function GamepadStatus() {
  const { connected, leftStick, buttons } = useGamepadInput();

  return (
    <div>
      <p>Gamepad: {connected ? 'Connected' : 'Disconnected'}</p>
      {connected && (
        <>
          <p>Stick X: {leftStick.x.toFixed(2)}</p>
          <p>Stick Y: {leftStick.y.toFixed(2)}</p>
          <p>Buttons: {Object.keys(buttons).length}</p>
        </>
      )}
    </div>
  );
}
```

### 6. Customize Key Bindings

```typescript
import { useInputConfig } from '@/input/useInput';
import { PlayerAction } from '@/input/types';

export function ControlsSettings() {
  const { config, rebindKey, resetToDefaults } = useInputConfig();

  return (
    <div>
      <h2>Controls</h2>
      <button onClick={() => rebindKey('e', PlayerAction.ATTACK)}>
        Rebind Attack to E
      </button>
      <button onClick={resetToDefaults}>Reset to Defaults</button>
      
      <pre>{JSON.stringify(config.keyBindings, null, 2)}</pre>
    </div>
  );
}
```

## Combo Chains

Detect sequences of actions for special moves:

```typescript
import { useComboChain } from '@/input/useInput';
import { PlayerAction } from '@/input/types';

export function ComboSystem() {
  useComboChain(
    [PlayerAction.ATTACK, PlayerAction.ATTACK, PlayerAction.USE_SKILL],
    () => {
      console.log('Double Attack + Skill combo executed!');
      // Trigger special move
    },
    500 // 500ms between actions
  );

  return <div>Combo Ready</div>;
}
```

## Integration with Zustand Store

```typescript
import create from 'zustand';
import { PlayerAction } from '@/input/types';

interface GameState {
  position: { x: number; y: number };
  dispatch: (action: GameAction) => void;
}

type GameAction = 
  | { type: 'move'; payload: { x: number; y: number } }
  | { type: 'attack' }
  | { type: 'interact' };

export const useGameStore = create<GameState>((set) => ({
  position: { x: 0, y: 0 },
  dispatch: (action) => {
    switch (action.type) {
      case 'move':
        set((state) => ({ position: action.payload }));
        break;
      case 'attack':
        set((state) => ({ /* attack logic */ }));
        break;
    }
  },
}));

// In your game loop component
export function GameController() {
  const { dequeueAction } = usePlayerInput();
  const dispatch = useGameStore((state) => state.dispatch);

  useAnimationFrame(() => {
    let action = dequeueAction();
    while (action) {
      handleInputAction(action, dispatch);
      action = dequeueAction();
    }
  });

  return null;
}

function handleInputAction(
  action: PlayerAction,
  dispatch: (action: GameAction) => void
) {
  switch (action) {
    case PlayerAction.MOVE_UP:
      dispatch({ type: 'move', payload: { x: 0, y: -1 } });
      break;
    case PlayerAction.MOVE_DOWN:
      dispatch({ type: 'move', payload: { x: 0, y: 1 } });
      break;
    case PlayerAction.MOVE_LEFT:
      dispatch({ type: 'move', payload: { x: -1, y: 0 } });
      break;
    case PlayerAction.MOVE_RIGHT:
      dispatch({ type: 'move', payload: { x: 1, y: 0 } });
      break;
    case PlayerAction.ATTACK:
      dispatch({ type: 'attack' });
      break;
  }
}
```

## Integration with Socket.io

```typescript
import { usePlayerInput } from '@/input/useInput';
import { PlayerAction } from '@/input/types';
import { useSocket } from '@/hooks/useSocket';

export function NetworkInputSync() {
  const { dequeueAction } = usePlayerInput();
  const socket = useSocket();

  useAnimationFrame(() => {
    let action = dequeueAction();
    while (action) {
      // Send to server
      socket.emit('player:action', {
        action,
        timestamp: Date.now(),
      });
      action = dequeueAction();
    }
  });

  return null;
}
```

## Debouncing & Throttling

Frequent actions (like movement) are debounced to prevent flooding:

```typescript
// Configuration
const config: InputConfig = {
  debounceMs: 50, // Debounce rapid key presses
  enableActionQueuing: true,
  maxQueueSize: 10, // Max pending actions
};

// Apply configuration
const manager = getInputManager();
manager.setConfig(config);
```

**Without debouncing:** Holding 'W' sends 60+ MOVE_UP actions per second  
**With debouncing (50ms):** Sends ~20 actions per second (more manageable)

## Action Queuing Best Practices

1. **Dequeue in Game Loop:** Process actions once per frame
2. **Limit Queue Size:** Prevent unbounded action accumulation
3. **Handle Queue Overflow:** Game feels laggy if queue overflows
4. **Dequeue Immediately:** Don't hold actions for too long

```typescript
// Good: Process queue every frame
useAnimationFrame(() => {
  let action;
  while ((action = dequeueAction())) {
    processAction(action);
  }
});

// Bad: Only check first action
const action = dequeueAction();
if (action) processAction(action);
```

## Simultaneous Key Presses

The input system properly handles multiple simultaneous keys:

```typescript
// Pressing W + D at the same time:
// 1. Enqueues MOVE_UP
// 2. Enqueues MOVE_RIGHT
// 3. Game processes both in sequence
// Result: Diagonal movement (up-right)

const { isKeyPressed } = usePlayerInput();

if (isKeyPressed('w') && isKeyPressed('d')) {
  movePlayer(0, -1); // up
  movePlayer(1, 0);  // right
  // Result: Diagonal
}
```

## Keyboard vs Gamepad

The system automatically handles both input methods:

```typescript
export function PlayerController() {
  const { isKeyPressed, gamepadState } = usePlayerInput();

  // Keyboard input
  if (isKeyPressed('w')) moveUp();
  
  // Or gamepad input (if connected)
  if (gamepadState?.leftStick.y < -0.15) moveUp();
}
```

## Mouse Input

Mouse position is always tracked:

```typescript
import { usePlayerInput } from '@/input/useInput';

export function MouseTracking() {
  const { mousePosition } = usePlayerInput();

  return (
    <div
      style={{
        position: 'absolute',
        left: mousePosition.x,
        top: mousePosition.y,
      }}
    >
      Cursor Position
    </div>
  );
}
```

## Custom Hooks Example

Create custom hooks for specific game systems:

```typescript
// useMovementInput.ts
import { usePlayerInput } from './useInput';
import { PlayerAction } from './types';

export function useMovementInput() {
  const { inputState, isKeyPressed } = usePlayerInput();

  return {
    moveX: (isKeyPressed('a') ? -1 : 0) + (isKeyPressed('d') ? 1 : 0),
    moveY: (isKeyPressed('w') ? -1 : 0) + (isKeyPressed('s') ? 1 : 0),
    isDashing: inputState.pressedKeys.has('shift'),
  };
}

// Usage
export function Player() {
  const { moveX, moveY, isDashing } = useMovementInput();
  
  return <div style={{
    transform: `translate(${moveX * 5}px, ${moveY * 5}px)`,
    opacity: isDashing ? 0.7 : 1,
  }} />;
}
```

## Troubleshooting

**Q: Actions aren't being dispatched**  
A: Make sure `useInputManager()` is called in your App root first

**Q: Gamepad input not working**  
A: Check that gamepad is connected and `enableGamepad: true` in config

**Q: Input feels laggy**  
A: Process action queue every frame, not just once per interaction

**Q: Simultaneous keys not registering**  
A: Use `pressedKeys` Map to track current state, or `isKeyPressed()` method
