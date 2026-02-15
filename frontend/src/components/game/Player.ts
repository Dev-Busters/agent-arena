import { Graphics, Container } from 'pixi.js';

// Player configuration
const PLAYER_SIZE = 32;
const PLAYER_COLOR = 0x4a90d9; // Blue hero color
const PLAYER_OUTLINE = 0x2a5a9a;
const MOVE_SPEED = 5;

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/**
 * Player class - handles rendering and movement
 */
export class Player {
  public container: Container;
  public state: PlayerState;
  
  private graphics: Graphics;
  private keys: Set<string> = new Set();
  private bounds: { minX: number; minY: number; maxX: number; maxY: number };
  
  constructor(x: number, y: number, arenaWidth: number, arenaHeight: number, wallThickness: number = 16) {
    this.container = new Container();
    this.graphics = new Graphics();
    
    this.state = { x, y, vx: 0, vy: 0 };
    
    // Set movement bounds (inside walls)
    this.bounds = {
      minX: wallThickness + PLAYER_SIZE / 2,
      minY: wallThickness + PLAYER_SIZE / 2,
      maxX: arenaWidth - wallThickness - PLAYER_SIZE / 2,
      maxY: arenaHeight - wallThickness - PLAYER_SIZE / 2,
    };
    
    this.drawPlayer();
    this.container.addChild(this.graphics);
    this.updatePosition();
    
    // Set up keyboard listeners
    this.setupInput();
    
    console.log('🎮 Player created at', x, y);
  }
  
  private drawPlayer(): void {
    // Body circle
    this.graphics.beginFill(PLAYER_COLOR);
    this.graphics.lineStyle(2, PLAYER_OUTLINE);
    this.graphics.drawCircle(0, 0, PLAYER_SIZE / 2);
    this.graphics.endFill();
    
    // Direction indicator (small triangle pointing up)
    this.graphics.beginFill(0xffffff, 0.8);
    this.graphics.moveTo(0, -PLAYER_SIZE / 2 - 4);
    this.graphics.lineTo(-6, -PLAYER_SIZE / 2 + 4);
    this.graphics.lineTo(6, -PLAYER_SIZE / 2 + 4);
    this.graphics.closePath();
    this.graphics.endFill();
  }
  
  private setupInput(): void {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        this.keys.add(key);
        e.preventDefault();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      this.keys.delete(e.key.toLowerCase());
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
  }
  
  private updatePosition(): void {
    this.container.x = this.state.x;
    this.container.y = this.state.y;
  }
  
  /**
   * Update player state - call this every frame
   */
  public update(): void {
    // Calculate velocity from keys
    this.state.vx = 0;
    this.state.vy = 0;
    
    if (this.keys.has('w') || this.keys.has('arrowup')) this.state.vy = -MOVE_SPEED;
    if (this.keys.has('s') || this.keys.has('arrowdown')) this.state.vy = MOVE_SPEED;
    if (this.keys.has('a') || this.keys.has('arrowleft')) this.state.vx = -MOVE_SPEED;
    if (this.keys.has('d') || this.keys.has('arrowright')) this.state.vx = MOVE_SPEED;
    
    // Normalize diagonal movement
    if (this.state.vx !== 0 && this.state.vy !== 0) {
      const factor = 0.707; // 1/sqrt(2)
      this.state.vx *= factor;
      this.state.vy *= factor;
    }
    
    // Apply velocity
    this.state.x += this.state.vx;
    this.state.y += this.state.vy;
    
    // Clamp to bounds
    this.state.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.state.x));
    this.state.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, this.state.y));
    
    // Update visual position
    this.updatePosition();
  }
  
  /**
   * Clean up event listeners
   */
  public destroy(): void {
    // Note: In a real app, store references to remove specific listeners
    console.log('🎮 Player destroyed');
  }
}
