/**
 * Input Manager - Core input event handling
 * Singleton pattern for managing keyboard, mouse, and gamepad input
 */

import {
  InputState,
  PlayerAction,
  KeyBindings,
  InputConfig,
  GamepadInputState,
} from './types';

const DEFAULT_KEY_BINDINGS: KeyBindings = {
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
  'q': PlayerAction.USE_SKILL,
  'shift': PlayerAction.DASH,
  'i': PlayerAction.OPEN_INVENTORY,
  'esc': PlayerAction.OPEN_MENU,
  'p': PlayerAction.PAUSE,
};

const DEFAULT_CONFIG: InputConfig = {
  keyBindings: DEFAULT_KEY_BINDINGS,
  enableGamepad: true,
  debounceMs: 50,
  enableActionQueuing: true,
  maxQueueSize: 10,
  gamepadDeadzone: 0.15,
  enableMouse: true,
};

class InputManager {
  private static instance: InputManager;
  private state: InputState;
  private config: InputConfig;
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private gamepadPollInterval: NodeJS.Timeout | null = null;
  private listeners: Set<(state: InputState) => void> = new Set();
  private actionListeners: Set<(action: PlayerAction) => void> = new Set();

  private constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.state = {
      pressedKeys: new Map(),
      mousePosition: { x: 0, y: 0 },
      actionQueue: [],
      currentAction: null,
      lastUpdate: Date.now(),
      gamepadConnected: false,
      gamepadState: null,
    };
  }

  static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager();
    }
    return InputManager.instance;
  }

  /**
   * Initialize input listeners
   */
  initialize(): void {
    this.setupKeyboardListeners();
    this.setupMouseListeners();
    if (this.config.enableGamepad) {
      this.setupGamepadListeners();
    }
  }

  /**
   * Setup keyboard event listeners
   */
  private setupKeyboardListeners(): void {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
  }

  /**
   * Handle key down event
   */
  private handleKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    const isNewPress = !this.state.pressedKeys.has(key);

    this.state.pressedKeys.set(key, true);
    this.state.lastUpdate = Date.now();

    // Get action for this key
    const action = this.config.keyBindings[key];
    if (action && isNewPress) {
      this.enqueueAction(action);
      this.notifyActionListeners(action);
    }

    this.notifyStateListeners();
  }

  /**
   * Handle key up event
   */
  private handleKeyUp(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    this.state.pressedKeys.delete(key);
    this.state.lastUpdate = Date.now();
    this.notifyStateListeners();
  }

  /**
   * Setup mouse event listeners
   */
  private setupMouseListeners(): void {
    window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('click', (e) => this.handleMouseClick(e));
  }

  /**
   * Handle mouse move
   */
  private handleMouseMove(event: MouseEvent): void {
    this.state.mousePosition = {
      x: event.clientX,
      y: event.clientY,
    };
    this.notifyStateListeners();
  }

  /**
   * Handle mouse click
   */
  private handleMouseClick(event: MouseEvent): void {
    // Can be extended for click-to-move or target selection
    this.state.lastUpdate = Date.now();
    this.notifyStateListeners();
  }

  /**
   * Setup gamepad event listeners
   */
  private setupGamepadListeners(): void {
    window.addEventListener('gamepadconnected', () => {
      this.state.gamepadConnected = true;
      this.startGamepadPolling();
      this.notifyStateListeners();
    });

    window.addEventListener('gamepaddisconnected', () => {
      this.state.gamepadConnected = false;
      this.state.gamepadState = null;
      this.stopGamepadPolling();
      this.notifyStateListeners();
    });
  }

  /**
   * Start polling gamepad input
   */
  private startGamepadPolling(): void {
    if (this.gamepadPollInterval) return;

    this.gamepadPollInterval = setInterval(() => {
      const gamepads = navigator.getGamepads?.() || [];
      const gamepad = gamepads[0];

      if (gamepad) {
        this.updateGamepadState(gamepad);
      }
    }, 16); // ~60fps
  }

  /**
   * Stop polling gamepad input
   */
  private stopGamepadPolling(): void {
    if (this.gamepadPollInterval) {
      clearInterval(this.gamepadPollInterval);
      this.gamepadPollInterval = null;
    }
  }

  /**
   * Update gamepad state from native Gamepad API
   */
  private updateGamepadState(gamepad: Gamepad): void {
    const deadzone = this.config.gamepadDeadzone;

    const leftStickX = Math.abs(gamepad.axes[0]) > deadzone ? gamepad.axes[0] : 0;
    const leftStickY = Math.abs(gamepad.axes[1]) > deadzone ? gamepad.axes[1] : 0;
    const rightStickX = Math.abs(gamepad.axes[2]) > deadzone ? gamepad.axes[2] : 0;
    const rightStickY = Math.abs(gamepad.axes[3]) > deadzone ? gamepad.axes[3] : 0;

    // Handle movement via left stick
    if (Math.abs(leftStickY) > deadzone) {
      const action = leftStickY < 0 ? PlayerAction.MOVE_UP : PlayerAction.MOVE_DOWN;
      if (!this.state.pressedKeys.has(`gamepad-${action}`)) {
        this.enqueueAction(action);
      }
      this.state.pressedKeys.set(`gamepad-${action}`, true);
    }

    if (Math.abs(leftStickX) > deadzone) {
      const action = leftStickX < 0 ? PlayerAction.MOVE_LEFT : PlayerAction.MOVE_RIGHT;
      if (!this.state.pressedKeys.has(`gamepad-${action}`)) {
        this.enqueueAction(action);
      }
      this.state.pressedKeys.set(`gamepad-${action}`, true);
    }

    // Button mapping
    const buttonActions: Record<number, PlayerAction> = {
      0: PlayerAction.ATTACK,
      1: PlayerAction.USE_SKILL,
      2: PlayerAction.DASH,
      3: PlayerAction.INTERACT,
    };

    const buttons: Record<string, boolean> = {};
    gamepad.buttons.forEach((button, index) => {
      const pressed = button.pressed;
      const action = buttonActions[index];
      if (action) {
        buttons[action] = pressed;
        if (pressed && !this.state.pressedKeys.has(`gamepad-button-${index}`)) {
          this.enqueueAction(action);
          this.state.pressedKeys.set(`gamepad-button-${index}`, true);
        } else if (!pressed) {
          this.state.pressedKeys.delete(`gamepad-button-${index}`);
        }
      }
    });

    this.state.gamepadState = {
      leftStick: { x: leftStickX, y: leftStickY },
      rightStick: { x: rightStickX, y: rightStickY },
      buttons,
      triggers: {
        left: gamepad.buttons[6]?.value || 0,
        right: gamepad.buttons[7]?.value || 0,
      },
    };

    this.state.lastUpdate = Date.now();
    this.notifyStateListeners();
  }

  /**
   * Add action to queue with debouncing
   */
  private enqueueAction(action: PlayerAction): void {
    if (!this.config.enableActionQueuing) {
      this.state.currentAction = action;
      return;
    }

    // Debounce frequent actions
    if (this.debounceTimers.has(action)) {
      return;
    }

    if (this.state.actionQueue.length < this.config.maxQueueSize) {
      this.state.actionQueue.push(action);
    }

    // Set debounce timer
    const timer = setTimeout(() => {
      this.debounceTimers.delete(action);
    }, this.config.debounceMs);

    this.debounceTimers.set(action, timer);
  }

  /**
   * Get next action from queue
   */
  dequeueAction(): PlayerAction | null {
    return this.state.actionQueue.shift() || null;
  }

  /**
   * Get current input state
   */
  getState(): Readonly<InputState> {
    return Object.freeze({ ...this.state });
  }

  /**
   * Check if a key is currently pressed
   */
  isKeyPressed(key: string): boolean {
    return this.state.pressedKeys.get(key.toLowerCase()) || false;
  }

  /**
   * Update input configuration
   */
  setConfig(newConfig: Partial<InputConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<InputConfig> {
    return Object.freeze({ ...this.config });
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(listener: (state: InputState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Subscribe to action events
   */
  onAction(listener: (action: PlayerAction) => void): () => void {
    this.actionListeners.add(listener);
    return () => this.actionListeners.delete(listener);
  }

  /**
   * Notify all state listeners
   */
  private notifyStateListeners(): void {
    const frozenState = Object.freeze({ ...this.state });
    this.listeners.forEach((listener) => listener(frozenState));
  }

  /**
   * Notify all action listeners
   */
  private notifyActionListeners(action: PlayerAction): void {
    this.actionListeners.forEach((listener) => listener(action));
  }

  /**
   * Clear all listeners and timers
   */
  destroy(): void {
    this.listeners.clear();
    this.actionListeners.clear();
    this.debounceTimers.forEach((timer) => clearTimeout(timer));
    this.debounceTimers.clear();
    this.stopGamepadPolling();
    this.state.actionQueue = [];
    this.state.pressedKeys.clear();
  }
}

export function getInputManager(): InputManager {
  return InputManager.getInstance();
}

export default InputManager;
