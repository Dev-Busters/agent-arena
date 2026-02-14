/**
 * Input Type Definitions for Agent Arena
 * Defines all player actions, input states, and configuration types
 */

export enum PlayerAction {
  // Movement
  MOVE_UP = 'move-up',
  MOVE_DOWN = 'move-down',
  MOVE_LEFT = 'move-left',
  MOVE_RIGHT = 'move-right',

  // Combat
  ATTACK = 'attack',
  USE_SKILL = 'use-skill',
  INTERACT = 'interact',

  // Items & Inventory
  PICK_UP_ITEM = 'pick-up-item',
  DROP_ITEM = 'drop-item',
  USE_ITEM = 'use-item',

  // UI & Menu
  OPEN_INVENTORY = 'open-inventory',
  OPEN_MENU = 'open-menu',
  PAUSE = 'pause',

  // Camera & View
  CAMERA_ZOOM_IN = 'camera-zoom-in',
  CAMERA_ZOOM_OUT = 'camera-zoom-out',

  // Special
  DASH = 'dash',
  JUMP = 'jump',
}

export interface InputState {
  /** Map of currently pressed keys (keyCode -> boolean) */
  pressedKeys: Map<string, boolean>;

  /** Current mouse position in screen coordinates */
  mousePosition: {
    x: number;
    y: number;
  };

  /** Queue of actions to process this frame */
  actionQueue: PlayerAction[];

  /** Current primary action being performed */
  currentAction: PlayerAction | null;

  /** Timestamp of last update */
  lastUpdate: number;

  /** Whether gamepad is connected */
  gamepadConnected: boolean;

  /** Gamepad state if connected */
  gamepadState: GamepadInputState | null;
}

export interface GamepadInputState {
  leftStick: {
    x: number;
    y: number;
  };
  rightStick: {
    x: number;
    y: number;
  };
  buttons: {
    [key: string]: boolean;
  };
  triggers: {
    left: number;
    right: number;
  };
}

/** Custom key binding that maps a key to an action */
export interface KeyBinding {
  key: string;
  action: PlayerAction;
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
  };
}

/** All key bindings for a player */
export type KeyBindings = Record<string, PlayerAction>;

export interface InputConfig {
  /** Key bindings for this player */
  keyBindings: KeyBindings;

  /** Enable gamepad input */
  enableGamepad: boolean;

  /** Debounce time in ms for frequent actions */
  debounceMs: number;

  /** Whether to enable action queuing */
  enableActionQueuing: boolean;

  /** Max size of action queue */
  maxQueueSize: number;

  /** Deadzone for gamepad analog sticks (0-1) */
  gamepadDeadzone: number;

  /** Enable mouse input */
  enableMouse: boolean;
}

export interface ActionPayload {
  action: PlayerAction;
  timestamp: number;
  data?: Record<string, unknown>;
}
