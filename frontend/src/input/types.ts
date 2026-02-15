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
  USE_SKILL_1 = 'use-skill-1', // Q key
  USE_SKILL_2 = 'use-skill-2', // E key
  USE_SKILL_3 = 'use-skill-3', // R key
  USE_SKILL_4 = 'use-skill-4', // F key
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

  // Targeting
  TARGET_ENEMY = 'target-enemy',
  CLEAR_TARGET = 'clear-target',
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

  /** Ability cooldowns (skill slot -> timestamp when ready) */
  abilityCooldowns: Map<PlayerAction, number>;

  /** Currently targeted enemy ID (null = no target) */
  targetedEnemyId: string | null;

  /** Buffered inputs waiting for network confirmation */
  inputBuffer: BufferedInput[];
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

/** Input buffered during network lag */
export interface BufferedInput {
  /** Unique ID for this input */
  id: string;
  /** Action to perform */
  action: PlayerAction;
  /** Timestamp when input was created */
  timestamp: number;
  /** Optional payload (e.g., target position, skill ID) */
  payload?: {
    targetId?: string;
    position?: { x: number; y: number; z: number };
    skillSlot?: number;
  };
  /** Has this been sent to server? */
  sent: boolean;
  /** Has server confirmed? */
  confirmed: boolean;
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
