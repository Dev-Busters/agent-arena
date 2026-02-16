import { Graphics, Container } from 'pixi.js';

// Enemy type configurations with varied stats
const ENEMY_TYPES = {
  goblin: { 
    color: 0x4a9a4a, 
    outline: 0x2a6a2a, 
    size: 20,       // Small
    speed: 3.0,     // Fast
    hp: 40,
    damage: 5 
  },
  skeleton: { 
    color: 0xd4d4d4, 
    outline: 0x8a8a8a, 
    size: 24,       // Medium-small
    speed: 2.0,     // Medium
    hp: 50,
    damage: 8 
  },
  demon: { 
    color: 0xc44a4a, 
    outline: 0x8a2a2a, 
    size: 28,       // Medium
    speed: 2.5,     // Medium-fast
    hp: 60,
    damage: 10 
  },
  brute: {
    color: 0x8a2a2a,
    outline: 0x5a1a1a,
    size: 40,       // Large
    speed: 1.2,     // Slow
    hp: 120,
    damage: 15
  }
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
  private healthBar: Graphics;
  private config: typeof ENEMY_TYPES[EnemyType];
  private bounds: { minX: number; minY: number; maxX: number; maxY: number };
  
  constructor(
    x: number, 
    y: number, 
    type: EnemyType,
    arenaWidth: number, 
    arenaHeight: number, 
    wallThickness: number = 16,
    hpMultiplier: number = 1.0,
    damageMultiplier: number = 1.0
  ) {
    this.id = `enemy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.container = new Container();
    this.graphics = new Graphics();
    this.healthBar = new Graphics();
    this.config = ENEMY_TYPES[type];
    
    // Apply scaling multipliers
    const scaledHp = Math.floor(this.config.hp * hpMultiplier);
    const scaledDamage = Math.floor(this.config.damage * damageMultiplier);
    
    this.state = { 
      x, y, 
      vx: 0, vy: 0,
      hp: scaledHp,
      maxHp: scaledHp,
      type 
    };
    
    // Set movement bounds (inside walls, using this enemy's size)
    const halfSize = this.config.size / 2;
    this.bounds = {
      minX: wallThickness + halfSize,
      minY: wallThickness + halfSize,
      maxX: arenaWidth - wallThickness - halfSize,
      maxY: arenaHeight - wallThickness - halfSize,
    };
    
    this.drawEnemy();
    this.drawHealthBar();
    this.container.addChild(this.graphics);
    this.container.addChild(this.healthBar);
    this.updatePosition();
    
    console.log(`🎮 Enemy spawned at ${x}, ${y} (${type})`);
  }
  
  private drawEnemy(): void {
    const { color, outline, size } = this.config;
    
    // Body - diamond/rhombus shape scaled to enemy size
    this.graphics.beginFill(color);
    this.graphics.lineStyle(2, outline);
    
    const s = size / 2;
    this.graphics.moveTo(0, -s);
    this.graphics.lineTo(s, 0);
    this.graphics.lineTo(0, s);
    this.graphics.lineTo(-s, 0);
    this.graphics.closePath();
    this.graphics.endFill();
    
    // Eyes (scaled relative to size)
    const eyeSize = Math.max(2, size / 10);
    const eyeOffset = size / 7;
    this.graphics.beginFill(0x000000);
    this.graphics.drawCircle(-eyeOffset, -eyeOffset / 2, eyeSize);
    this.graphics.drawCircle(eyeOffset, -eyeOffset / 2, eyeSize);
    this.graphics.endFill();
    
    // Red pupil glow
    this.graphics.beginFill(0xff0000, 0.8);
    this.graphics.drawCircle(-eyeOffset, -eyeOffset / 2, eyeSize / 2);
    this.graphics.drawCircle(eyeOffset, -eyeOffset / 2, eyeSize / 2);
    this.graphics.endFill();
  }
  
  private drawHealthBar(): void {
    this.healthBar.clear();
    
    // Scale bar width with enemy size
    const barWidth = Math.max(30, this.config.size + 10);
    const barHeight = 4;
    const yOffset = -this.config.size / 2 - 10;
    
    // Background (dark)
    this.healthBar.beginFill(0x333333);
    this.healthBar.drawRect(-barWidth / 2, yOffset, barWidth, barHeight);
    this.healthBar.endFill();
    
    // Health fill (green to red based on HP)
    const hpPercent = this.state.hp / this.state.maxHp;
    const hpColor = hpPercent > 0.5 ? 0x44cc44 : hpPercent > 0.25 ? 0xcccc44 : 0xcc4444;
    
    this.healthBar.beginFill(hpColor);
    this.healthBar.drawRect(-barWidth / 2, yOffset, barWidth * hpPercent, barHeight);
    this.healthBar.endFill();
    
    // Border
    this.healthBar.lineStyle(1, 0x000000, 0.5);
    this.healthBar.drawRect(-barWidth / 2, yOffset, barWidth, barHeight);
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
    
    // Rotate body to face player (but not health bar)
    this.graphics.rotation = Math.atan2(dy, dx) + Math.PI / 2;
    
    // Update health bar (keep it upright)
    this.drawHealthBar();
  }
  
  public destroy(): void {
    this.container.destroy({ children: true });
    console.log(`🎮 Enemy destroyed (${this.state.type})`);
  }
}

/**
 * Spawn enemies at random positions away from player
 * Uses weighted random selection to vary enemy types
 */
export function spawnEnemies(
  count: number,
  playerX: number,
  playerY: number,
  arenaWidth: number,
  arenaHeight: number,
  wallThickness: number = 16,
  hpMultiplier: number = 1.0,
  damageMultiplier: number = 1.0
): Enemy[] {
  const enemies: Enemy[] = [];
  const minDistFromPlayer = 200;
  
  // Weighted spawn chances (higher = more common)
  const typeWeights: [EnemyType, number][] = [
    ['goblin', 40],   // Most common
    ['skeleton', 30], // Common
    ['demon', 20],    // Less common
    ['brute', 10]     // Rare (large, tanky)
  ];
  
  const totalWeight = typeWeights.reduce((sum, [, weight]) => sum + weight, 0);
  
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
    
    // Weighted random type selection
    let random = Math.random() * totalWeight;
    let selectedType: EnemyType = 'goblin';
    
    for (const [type, weight] of typeWeights) {
      random -= weight;
      if (random <= 0) {
        selectedType = type;
        break;
      }
    }
    
    enemies.push(new Enemy(x, y, selectedType, arenaWidth, arenaHeight, wallThickness, hpMultiplier, damageMultiplier));
  }
  
  return enemies;
}
