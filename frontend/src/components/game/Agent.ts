import { Graphics, Container } from 'pixi.js';
import { Enemy } from './Enemy';

// Agent configuration
const AGENT_SIZE = 32;
const AGENT_COLOR = 0x4a90d9; // Blue agent color
const AGENT_OUTLINE = 0x2a5a9a;
const MOVE_SPEED = 5;
const ATTACK_RANGE = 60;
const ATTACK_DAMAGE = 10;
const ATTACK_COOLDOWN = 300; // ms

// AI behavior configuration
const RETREAT_DAMAGE_THRESHOLD = 20; // Retreat after taking this much damage
const RETREAT_DURATION = 1000; // ms to retreat

// Abilities
const DASH_COOLDOWN = 3000; // 3s
const DASH_SPEED = 20;
const DASH_DURATION = 150; // ms

/**
 * AI State Machine States
 */
export enum AgentAIState {
  IDLE = 'IDLE',
  APPROACH = 'APPROACH',
  ATTACK = 'ATTACK',
  RETREAT = 'RETREAT',
}

export interface AgentState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  lastHp: number; // Track HP to detect damage taken
  isAttacking: boolean;
  lastAttackTime: number;
  isDashing: boolean;
  lastDashTime: number;
  level: number;
  xp: number;
  xpToNext: number;
  attack: number;
  defense: number;
  
  // AI state
  aiState: AgentAIState;
  target: Enemy | null;
  retreatTimer: number;
}

/**
 * Agent class - AI-controlled fighter that the player commands
 * The agent moves and attacks autonomously. Player only triggers abilities (Q/E/R/F).
 */
export class Agent {
  public container: Container;
  public state: AgentState;
  public onAttack?: (x: number, y: number, range: number, damage: number) => void;
  
  private graphics: Graphics;
  private bounds: { minX: number; minY: number; maxX: number; maxY: number };
  
  // Enemy tracking
  private enemies: Enemy[] = [];
  
  constructor(x: number, y: number, arenaWidth: number, arenaHeight: number, wallThickness: number = 16) {
    this.container = new Container();
    this.graphics = new Graphics();
    
    this.state = { 
      x, y, 
      vx: 0, vy: 0,
      hp: 100,
      maxHp: 100,
      lastHp: 100,
      isAttacking: false, 
      lastAttackTime: 0,
      isDashing: false,
      lastDashTime: 0,
      level: 1,
      xp: 0,
      xpToNext: 100,
      attack: 10,
      defense: 5,
      
      // AI state
      aiState: AgentAIState.IDLE,
      target: null,
      retreatTimer: 0,
    };
    
    // Set movement bounds (inside walls)
    this.bounds = {
      minX: wallThickness + AGENT_SIZE / 2,
      minY: wallThickness + AGENT_SIZE / 2,
      maxX: arenaWidth - wallThickness - AGENT_SIZE / 2,
      maxY: arenaHeight - wallThickness - AGENT_SIZE / 2,
    };
    
    this.drawAgent();
    this.container.addChild(this.graphics);
    this.updatePosition();
    
    // Set up input (ONLY abilities, no movement)
    this.setupInput();
    
    console.log('🤖 Agent created at', x, y, '(AI-controlled)');
  }
  
  /**
   * Update enemy list for AI targeting
   */
  public setEnemies(enemies: Enemy[]): void {
    this.enemies = enemies.filter(e => !e.dead);
  }
  
  /**
   * Perform attack - called autonomously by AI
   */
  private attack(): boolean {
    const now = Date.now();
    if (now - this.state.lastAttackTime < ATTACK_COOLDOWN) {
      return false;
    }
    
    this.state.isAttacking = true;
    this.state.lastAttackTime = now;
    
    // Draw attack effect (expanding circle)
    this.showAttackEffect();
    
    // Trigger callback
    if (this.onAttack) {
      this.onAttack(this.state.x, this.state.y, ATTACK_RANGE, ATTACK_DAMAGE);
    }
    
    // Reset attack state after animation
    setTimeout(() => {
      this.state.isAttacking = false;
    }, 150);
    
    return true;
  }
  
  /**
   * Dash ability (Q key) - commanded by player
   */
  public dash(): boolean {
    const now = Date.now();
    if (now - this.state.lastDashTime < DASH_COOLDOWN) {
      return false;
    }
    
    this.state.isDashing = true;
    this.state.lastDashTime = now;
    
    // Dash in current velocity direction (or toward target if stationary)
    let dashX = this.state.vx;
    let dashY = this.state.vy;
    
    if (dashX === 0 && dashY === 0 && this.state.target) {
      // Dash toward current target if not moving
      dashX = this.state.target.x - this.state.x;
      dashY = this.state.target.y - this.state.y;
      const mag = Math.sqrt(dashX * dashX + dashY * dashY);
      if (mag > 0) {
        dashX /= mag;
        dashY /= mag;
      }
    }
    
    // Apply dash velocity
    this.state.vx = dashX * DASH_SPEED;
    this.state.vy = dashY * DASH_SPEED;
    
    // Visual effect (quick flash)
    this.graphics.tint = 0xccccff;
    
    // Reset after dash duration
    setTimeout(() => {
      this.state.isDashing = false;
      if (this.graphics) {
        this.graphics.tint = 0xffffff;
      }
    }, DASH_DURATION);
    
    console.log('💨 Agent dash!');
    return true;
  }
  
  /**
   * Take damage - updates HP and triggers retreat if needed
   */
  public takeDamage(amount: number): void {
    this.state.hp = Math.max(0, this.state.hp - amount);
  }
  
  private showAttackEffect(): void {
    // Yellow flash to indicate attack
    if (this.graphics) {
      this.graphics.tint = 0xffff00;
      setTimeout(() => {
        if (this.graphics) {
          this.graphics.tint = 0xffffff;
        }
      }, 100);
    }
  }
  
  private drawAgent(): void {
    // Body circle
    this.graphics.beginFill(AGENT_COLOR);
    this.graphics.lineStyle(2, AGENT_OUTLINE);
    this.graphics.drawCircle(0, 0, AGENT_SIZE / 2);
    this.graphics.endFill();
    
    // Direction indicator (small triangle pointing up)
    this.graphics.beginFill(0xffffff, 0.8);
    this.graphics.moveTo(0, -AGENT_SIZE / 2 - 4);
    this.graphics.lineTo(-6, -AGENT_SIZE / 2 + 4);
    this.graphics.lineTo(6, -AGENT_SIZE / 2 + 4);
    this.graphics.closePath();
    this.graphics.endFill();
  }
  
  private setupInput(): void {
    // ONLY ability inputs - NO WASD movement
    const handleKeyDown = (e: KeyboardEvent) => {
      // Q to dash
      if (e.code === 'KeyQ') {
        this.dash();
        e.preventDefault();
      }
      // E, R, F abilities will be added in D5
    };
    
    window.addEventListener('keydown', handleKeyDown);
  }
  
  private updatePosition(): void {
    this.container.x = this.state.x;
    this.container.y = this.state.y;
  }
  
  /**
   * Find nearest enemy for targeting
   */
  private findNearestEnemy(): Enemy | null {
    if (this.enemies.length === 0) return null;
    
    let nearest: Enemy | null = null;
    let nearestDist = Infinity;
    
    for (const enemy of this.enemies) {
      const dx = enemy.x - this.state.x;
      const dy = enemy.y - this.state.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = enemy;
      }
    }
    
    return nearest;
  }
  
  /**
   * Calculate distance to target
   */
  private distanceTo(enemy: Enemy): number {
    const dx = enemy.x - this.state.x;
    const dy = enemy.y - this.state.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Move toward a position
   */
  private moveToward(x: number, y: number): void {
    const dx = x - this.state.x;
    const dy = y - this.state.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      this.state.vx = (dx / dist) * MOVE_SPEED;
      this.state.vy = (dy / dist) * MOVE_SPEED;
    }
  }
  
  /**
   * Move away from a position
   */
  private moveAwayFrom(x: number, y: number): void {
    const dx = this.state.x - x;
    const dy = this.state.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      this.state.vx = (dx / dist) * MOVE_SPEED;
      this.state.vy = (dy / dist) * MOVE_SPEED;
    }
  }
  
  /**
   * AI Update - autonomous behavior
   */
  public updateAI(delta: number): void {
    // Skip AI during dash
    if (this.state.isDashing) return;
    
    // Check for damage taken
    const damageTaken = this.state.lastHp - this.state.hp;
    if (damageTaken >= RETREAT_DAMAGE_THRESHOLD && this.state.aiState !== AgentAIState.RETREAT) {
      // Take significant damage → retreat
      this.state.aiState = AgentAIState.RETREAT;
      this.state.retreatTimer = RETREAT_DURATION;
      console.log('🤖 Agent retreating after taking damage!');
    }
    
    // Update lastHp for next frame
    this.state.lastHp = this.state.hp;
    
    // Find or update target
    if (!this.state.target || this.state.target.dead) {
      this.state.target = this.findNearestEnemy();
    }
    
    // State machine
    switch (this.state.aiState) {
      case AgentAIState.IDLE:
        if (this.state.target) {
          this.state.aiState = AgentAIState.APPROACH;
        } else {
          // No enemies - stay still
          this.state.vx = 0;
          this.state.vy = 0;
        }
        break;
        
      case AgentAIState.APPROACH:
        if (!this.state.target) {
          this.state.aiState = AgentAIState.IDLE;
        } else {
          // Move toward target
          this.moveToward(this.state.target.x, this.state.target.y);
          
          // Check if in attack range
          const dist = this.distanceTo(this.state.target);
          if (dist <= ATTACK_RANGE) {
            this.state.aiState = AgentAIState.ATTACK;
          }
        }
        break;
        
      case AgentAIState.ATTACK:
        if (!this.state.target) {
          this.state.aiState = AgentAIState.IDLE;
        } else {
          const dist = this.distanceTo(this.state.target);
          
          if (dist > ATTACK_RANGE) {
            // Target moved out of range - approach
            this.state.aiState = AgentAIState.APPROACH;
          } else {
            // Attack!
            this.attack();
            
            // Slow movement while attacking (maintain distance)
            this.state.vx *= 0.3;
            this.state.vy *= 0.3;
          }
        }
        break;
        
      case AgentAIState.RETREAT:
        // Move away from nearest enemy
        const nearestEnemy = this.findNearestEnemy();
        if (nearestEnemy) {
          this.moveAwayFrom(nearestEnemy.x, nearestEnemy.y);
        }
        
        // Update retreat timer
        this.state.retreatTimer -= delta;
        if (this.state.retreatTimer <= 0) {
          // Done retreating - go back to approach
          this.state.aiState = AgentAIState.APPROACH;
          console.log('🤖 Agent done retreating, re-engaging!');
        }
        break;
    }
  }
  
  /**
   * Update agent state - call this every frame
   */
  public update(delta: number): void {
    // Update AI behavior
    this.updateAI(delta);
    
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
   * Gain XP and check for level-up
   */
  public gainXP(amount: number): boolean {
    this.state.xp += amount;
    
    if (this.state.xp >= this.state.xpToNext) {
      this.levelUp();
      return true;
    }
    
    return false;
  }
  
  /**
   * Level up - increase stats
   */
  private levelUp(): void {
    this.state.level++;
    this.state.xp = 0;
    this.state.xpToNext = this.state.level * 100;
    
    // Stat increases
    this.state.maxHp += 10;
    this.state.hp = this.state.maxHp; // Heal on level up
    this.state.attack += 2;
    this.state.defense += 1;
    
    console.log(`⭐ Agent Level Up! Now level ${this.state.level}`);
  }
  
  /**
   * Clean up event listeners
   */
  public destroy(): void {
    console.log('🤖 Agent destroyed');
  }
}
