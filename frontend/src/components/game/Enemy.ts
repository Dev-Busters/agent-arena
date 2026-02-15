import { Graphics, Container } from 'pixi.js';

// Enemy configuration
const ENEMY_SIZE = 28;
const ENEMY_SPEED = 2;

// Enemy types with different colors
const ENEMY_TYPES = {
  goblin: { color: 0x4a9a4a, outline: 0x2a6a2a, speed: 2.5 },
  skeleton: { color: 0xd4d4d4, outline: 0x8a8a8a, speed: 1.8 },
  demon: { color: 0xc44a4a, outline: 0x8a2a2a, speed: 2.0 },
} as const;

type EnemyType = keyof typeof ENEMY_TYPES;

export interface EnemyState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  type: EnemyType;
}

/**
 * Enemy class - basic AI that chases the player
 */
export class Enemy {
  public container: Container;
  public state: EnemyState;
  public id: string;
  
  private graphics: Graphics;
  private config: typeof ENEMY_TYPES[EnemyType];
  private bounds: { minX: number; minY: number; maxX: number; maxY: number };
  
  constructor(
    x: number, 
    y: number, 
    type: EnemyType,
    arenaWidth: number, 
    arenaHeight: number, 
    wallThickness: number = 16
  ) {
    this.id = `enemy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.container = new Container();
    this.graphics = new Graphics();
    this.config = ENEMY_TYPES[type];
    
    this.state = { 
      x, y, 
      vx: 0, vy: 0,
      hp: 30,
      maxHp: 30,
      type 
    };
    
    // Set movement bounds (inside walls)
    this.bounds = {
      minX: wallThickness + ENEMY_SIZE / 2,
      minY: wallThickness + ENEMY_SIZE / 2,
      maxX: arenaWidth - wallThickness - ENEMY_SIZE / 2,
      maxY: arenaHeight - wallThickness - ENEMY_SIZE / 2,
    };
    
    this.drawEnemy();
    this.container.addChild(this.graphics);
    this.updatePosition();
    
    console.log(`🎮 Enemy spawned at ${x}, ${y} (${type})`);
  }
  
  private drawEnemy(): void {
    const { color, outline } = this.config;
    
    // Body - slightly angular shape for enemies
    this.graphics.beginFill(color);
    this.graphics.lineStyle(2, outline);
    
    // Draw a diamond/rhombus shape
    const s = ENEMY_SIZE / 2;
    this.graphics.moveTo(0, -s);
    this.graphics.lineTo(s, 0);
    this.graphics.lineTo(0, s);
    this.graphics.lineTo(-s, 0);
    this.graphics.closePath();
    this.graphics.endFill();
    
    // Eyes (two small dots)
    this.graphics.beginFill(0x000000);
    this.graphics.drawCircle(-4, -2, 3);
    this.graphics.drawCircle(4, -2, 3);
    this.graphics.endFill();
    
    // Red pupil glow
    this.graphics.beginFill(0xff0000, 0.8);
    this.graphics.drawCircle(-4, -2, 1.5);
    this.graphics.drawCircle(4, -2, 1.5);
    this.graphics.endFill();
  }
  
  private updatePosition(): void {
    this.container.x = this.state.x;
    this.container.y = this.state.y;
  }
  
  /**
   * Update enemy AI - chase the player
   */
  public update(playerX: number, playerY: number): void {
    // Calculate direction to player
    const dx = playerX - this.state.x;
    const dy = playerY - this.state.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Don't move if too close (prevents stacking)
    if (dist < 40) {
      this.state.vx = 0;
      this.state.vy = 0;
    } else {
      // Normalize and apply speed
      this.state.vx = (dx / dist) * this.config.speed;
      this.state.vy = (dy / dist) * this.config.speed;
    }
    
    // Apply velocity
    this.state.x += this.state.vx;
    this.state.y += this.state.vy;
    
    // Clamp to bounds
    this.state.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.state.x));
    this.state.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, this.state.y));
    
    // Update visual
    this.updatePosition();
    
    // Rotate to face player
    this.container.rotation = Math.atan2(dy, dx) + Math.PI / 2;
  }
  
  public destroy(): void {
    this.container.destroy({ children: true });
    console.log(`🎮 Enemy destroyed (${this.state.type})`);
  }
}

/**
 * Spawn enemies at random positions away from player
 */
export function spawnEnemies(
  count: number,
  playerX: number,
  playerY: number,
  arenaWidth: number,
  arenaHeight: number,
  wallThickness: number = 16
): Enemy[] {
  const enemies: Enemy[] = [];
  const types: EnemyType[] = ['goblin', 'skeleton', 'demon'];
  const minDistFromPlayer = 200;
  
  for (let i = 0; i < count; i++) {
    let x: number, y: number;
    let attempts = 0;
    
    // Find position away from player
    do {
      x = wallThickness + 50 + Math.random() * (arenaWidth - wallThickness * 2 - 100);
      y = wallThickness + 50 + Math.random() * (arenaHeight - wallThickness * 2 - 100);
      attempts++;
    } while (
      Math.sqrt((x - playerX) ** 2 + (y - playerY) ** 2) < minDistFromPlayer && 
      attempts < 20
    );
    
    const type = types[i % types.length];
    enemies.push(new Enemy(x, y, type, arenaWidth, arenaHeight, wallThickness));
  }
  
  return enemies;
}
