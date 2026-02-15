/**
 * React Hooks for Input Management
 * Provides hooks for consuming input state and actions in React components
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  InputState,
  PlayerAction,
  KeyBindings,
  InputConfig,
  GamepadInputState,
} from './types';
import { getInputManager } from './inputManager';

/**
 * Hook to get current input state and action queue
 * @returns Current input state and methods to dequeue actions
 */
export function usePlayerInput() {
  const [inputState, setInputState] = useState<InputState>(() =>
    getInputManager().getState()
  );

  useEffect(() => {
    const manager = getInputManager();
    const unsubscribe = manager.onStateChange((newState) => {
      setInputState(newState);
    });

    return () => unsubscribe();
  }, []);

  const dequeueAction = useCallback((): PlayerAction | null => {
    return getInputManager().dequeueAction();
  }, []);

  const isKeyPressed = useCallback((key: string): boolean => {
    return getInputManager().isKeyPressed(key);
  }, []);

  return {
    inputState,
    dequeueAction,
    isKeyPressed,
    mousePosition: inputState.mousePosition,
    actionQueue: inputState.actionQueue,
    gamepadState: inputState.gamepadState,
    gamepadConnected: inputState.gamepadConnected,
  };
}

/**
 * Hook to listen for specific key bindings
 * @param action - The action to listen for
 * @param callback - Function to call when action is triggered
 */
export function useKeyBind(
  action: PlayerAction,
  callback: (action: PlayerAction) => void
): void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const manager = getInputManager();
    const unsubscribe = manager.onAction((triggeredAction) => {
      if (triggeredAction === action) {
        callbackRef.current(triggeredAction);
      }
    });

    return () => unsubscribe();
  }, [action]);
}

/**
 * Hook to manage input configuration and key bindings
 * @returns Current config and methods to update it
 */
export function useInputConfig() {
  const [config, setConfig] = useState<InputConfig>(() =>
    getInputManager().getConfig()
  );

  const updateConfig = useCallback((newConfig: Partial<InputConfig>) => {
    const manager = getInputManager();
    manager.setConfig(newConfig);
    setConfig(manager.getConfig());
  }, []);

  const setKeyBindings = useCallback((bindings: KeyBindings) => {
    updateConfig({ keyBindings: bindings });
  }, [updateConfig]);

  const rebindKey = useCallback(
    (key: string, action: PlayerAction) => {
      const newBindings = { ...config.keyBindings };
      // Remove old binding for this action
      Object.keys(newBindings).forEach((k) => {
        if (newBindings[k] === action) {
          delete newBindings[k];
        }
      });
      newBindings[key.toLowerCase()] = action;
      setKeyBindings(newBindings);
    },
    [config.keyBindings, setKeyBindings]
  );

  const resetToDefaults = useCallback(() => {
    updateConfig({
      keyBindings: {
        'w': PlayerAction.MOVE_UP,
        'arrowup': PlayerAction.MOVE_UP,
        's': PlayerAction.MOVE_DOWN,
        'arrowdown': PlayerAction.MOVE_DOWN,
        'a': PlayerAction.MOVE_LEFT,
        'arrowleft': PlayerAction.MOVE_LEFT,
        'd': PlayerAction.MOVE_RIGHT,
        'arrowright': PlayerAction.MOVE_RIGHT,
        ' ': PlayerAction.ATTACK,
        'e': PlayerAction.INTERACT,
        'q': PlayerAction.USE_SKILL_1,
        'shift': PlayerAction.DASH,
        'i': PlayerAction.OPEN_INVENTORY,
        'esc': PlayerAction.OPEN_MENU,
        'p': PlayerAction.PAUSE,
      },
    });
  }, [updateConfig]);

  return {
    config,
    updateConfig,
    setKeyBindings,
    rebindKey,
    resetToDefaults,
  };
}

/**
 * Hook for gamepad input
 * @returns Gamepad state and connection status
 */
export function useGamepadInput() {
  const [gamepadState, setGamepadState] = useState<GamepadInputState | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const manager = getInputManager();

    const unsubscribe = manager.onStateChange((state) => {
      setGamepadState(state.gamepadState);
      setConnected(state.gamepadConnected);
    });

    return () => unsubscribe();
  }, []);

  const setDeadzone = useCallback((deadzone: number) => {
    const manager = getInputManager();
    const config = manager.getConfig();
    manager.setConfig({
      ...config,
      gamepadDeadzone: Math.max(0, Math.min(1, deadzone)),
    });
  }, []);

  return {
    gamepadState,
    connected,
    leftStick: gamepadState?.leftStick || { x: 0, y: 0 },
    rightStick: gamepadState?.rightStick || { x: 0, y: 0 },
    buttons: gamepadState?.buttons || {},
    triggers: gamepadState?.triggers || { left: 0, right: 0 },
    setDeadzone,
  };
}

/**
 * Hook to initialize and cleanup input manager
 * Should be called once in app root
 */
export function useInputManager() {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      const manager = getInputManager();
      manager.initialize();
      initializedRef.current = true;

      return () => {
        manager.destroy();
        initializedRef.current = false;
      };
    }
  }, []);

  return getInputManager();
}

/**
 * Hook to handle combo chains and sequential actions
 * @param actionSequence - Array of actions in sequence
 * @param onComboComplete - Callback when full sequence is matched
 * @param timeoutMs - Max time between actions in sequence (default: 500ms)
 */
export function useComboChain(
  actionSequence: PlayerAction[],
  onComboComplete: () => void,
  timeoutMs: number = 500
): void {
  const sequenceIndexRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const callbackRef = useRef(onComboComplete);

  useEffect(() => {
    callbackRef.current = onComboComplete;
  }, [onComboComplete]);

  const handleAction = useCallback((action: PlayerAction) => {
    // Reset if action doesn't match sequence
    if (action !== actionSequence[sequenceIndexRef.current]) {
      sequenceIndexRef.current = 0;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    // Move to next action in sequence
    sequenceIndexRef.current += 1;

    // Combo complete!
    if (sequenceIndexRef.current === actionSequence.length) {
      callbackRef.current();
      sequenceIndexRef.current = 0;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    // Set timeout to reset sequence if no action within timeoutMs
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      sequenceIndexRef.current = 0;
    }, timeoutMs);
  }, [actionSequence]);

  const manager = getInputManager();

  useEffect(() => {
    const unsubscribe = manager.onAction(handleAction);

    return () => {
      unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleAction, manager]);
}
