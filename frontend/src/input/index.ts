/**
 * Input Module - Public API
 * Exports all input-related types, managers, and hooks
 */

// Types
export type {
  InputState,
  GamepadInputState,
  KeyBinding,
  KeyBindings,
  InputConfig,
  ActionPayload,
} from './types';

export { PlayerAction } from './types';

// InputManager
export { getInputManager } from './inputManager';
export { default as InputManager } from './inputManager';

// Hooks
export {
  usePlayerInput,
  useKeyBind,
  useInputConfig,
  useGamepadInput,
  useInputManager,
  useComboChain,
} from './useInput';
