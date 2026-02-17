import { Graphics, Container } from 'pixi.js';
import { Enemy } from './Enemy';
import { SchoolConfig } from './schools';
import { Discipline } from './disciplines';
import { Tenet, TargetingMode } from './tenets';

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
const BLAST_COOLDOWN = 6000; // 6s
const BLAST_RANGE = 100; // pixels
const BLAST_DAMAGE = 30;
const PROJECTILE_COOLDOWN = 5000; // 5s
const PROJECTILE_SPEED = 10;
const PROJECTILE_DAMAGE = 25;
const HEAL_COOLDOWN = 12000; // 12s
const HEAL_PERCENT = 0.3; // 30% of max HP

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
  lastBlastTime: number;
  lastProjectileTime: number;
  lastHealTime: number;
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
  public onBlast?: (x: number, y: number, range: number, damage: number) => void;
  public onProjectile?: (x: number, y: number, targetX: number, targetY: number, damage: number) => void;
  
  private graphics: Graphics;
  private bounds: { minX: number; minY: number; maxX: number; maxY: number };
  
  // Enemy tracking
  private enemies: Enemy[] = [];
  
  // Keyboard handler for cleanup
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  // School-derived instance properties
  private schoolConfig: SchoolConfig | null = null;
  private _moveSpeed = MOVE_SPEED;
  private _attackDamage = ATTACK_DAMAGE;
  private _attackCooldown = ATTACK_COOLDOWN;
  private _dashCooldown = DASH_COOLDOWN;
  private _blastRange = BLAST_RANGE;
  private _blastDamage = BLAST_DAMAGE;
  private _preferredDistance = 80;
  private _critBonus = 0;
  private _damageTakenMult = 1.0;
  private _targetingMode: TargetingMode = 'nearest';
  private _berserker = false;
  private _executioner = false;

  public getDamageTakenMult(): number { return this._damageTakenMult; }

  /** Live damage multiplier (includes berserker scaling based on current HP) */
  public getLiveDamageMultiplier(): number {
    if (!this._berserker) return 1.0;
    const missingPct = 1 - Math.max(0, this.state.hp / this.state.maxHp);
    return 1 + missingPct * 1.5; // up to 2.5x at 0 HP
  }

  /** Executioner bonus: +50% vs enemies below 30% HP */
  public getExecutionerBonus(targetHpPct: number): number {
    return (this._executioner && targetHpPct < 0.3) ? 1.5 : 1.0;
  }

  /** Apply a tenet — universal passive */
  public applyTenet(tenet: Tenet): void {
    const e = tenet.effects;
    if (e.hpBonus)            { this.state.maxHp += e.hpBonus; this.state.hp += e.hpBonus; }
    if (e.hpMult)             { const newMax = Math.round(this.state.maxHp * e.hpMult); this.state.hp = newMax; this.state.maxHp = newMax; }
    if (e.damageMult)         { this._attackDamage *= e.damageMult; this._blastDamage *= e.damageMult; }
    if (e.speedMult)          { this._moveSpeed *= e.speedMult; }
    if (e.critBonus)          { this._critBonus += e.critBonus; }
    if (e.blastRadiusMult)    { this._blastRange *= e.blastRadiusMult; }
    if (e.attackCooldownMult) { this._attackCooldown *= e.attackCooldownMult; }
    if (e.damageTakenMult)    { this._damageTakenMult *= e.damageTakenMult; }
    if (e.targeting)          { this._targetingMode = e.targeting; }
    if (e.berserker)          { this._berserker = true; }
    if (e.executioner)        { this._executioner = true; }
    console.log(`⚖️ Tenet: ${tenet.name} | HP:${Math.round(this.state.maxHp)} Target:${this._targetingMode}`);
  }

  /** Apply a discipline on top of current school stats */
  public applyDiscipline(disc: Discipline): void {
    const e = disc.effects;
    if (e.hpBonus)             { this.state.maxHp += e.hpBonus; this.state.hp += e.hpBonus; }
    if (e.damageMult)          { this._attackDamage *= e.damageMult; this._blastDamage *= e.damageMult; }
    if (e.speedMult)           { this._moveSpeed *= e.speedMult; }
    if (e.critBonus)           { this._critBonus += e.critBonus; }
    if (e.blastRadiusMult)     { this._blastRange *= e.blastRadiusMult; }
    if (e.attackCooldownMult)  { this._attackCooldown *= e.attackCooldownMult; }
    if (e.dashCooldownMult)    { this._dashCooldown *= e.dashCooldownMult; }
    if (e.damageTakenMult)     { this._damageTakenMult *= e.damageTakenMult; }
    this.drawAgent();
    console.log(`📖 Discipline: ${disc.name} applied | HP:${Math.round(this.state.maxHp)} Dmg:${this._attackDamage.toFixed(1)} Crit:${10 + this._critBonus}%`);
  }

  /** Apply a combat school — changes stats, sprite color, AI behavior */
  public setSchool(config: SchoolConfig): void {
    this.schoolConfig = config;
    this.state.maxHp = 100 + config.stats.hpBonus;
    this.state.hp = this.state.maxHp;
    this._moveSpeed = MOVE_SPEED * config.stats.speedMultiplier;
    this._attackDamage = ATTACK_DAMAGE * config.stats.damageMultiplier;
    this._attackCooldown = ATTACK_COOLDOWN * config.ai.attackCooldownMult;
    this._dashCooldown = DASH_COOLDOWN * config.ai.dashCooldownMult;
    this._blastRange = BLAST_RANGE * (1 + config.stats.blastRadiusBonus / 100);
    this._blastDamage = BLAST_DAMAGE * config.stats.damageMultiplier;
    this._preferredDistance = config.ai.preferredDistance;
    this._critBonus = config.stats.critBonus;
    this.drawAgent(); // redraw with new color
    console.log(`🎖️ School: ${config.name} | HP:${this.state.maxHp} Speed:${this._moveSpeed.toFixed(1)} Crit:${10 + this._critBonus}%`);
  }

  public getSchoolConfig(): SchoolConfig | null { return this.schoolConfig; }
  
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
      lastBlastTime: 0,
      lastProjectileTime: 0,
      lastHealTime: 0,
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
    if (now - this.state.lastAttackTime < this._attackCooldown) {
      return false;
    }
    
    this.state.isAttacking = true;
    this.state.lastAttackTime = now;
    
    // Draw attack effect (expanding circle)
    this.showAttackEffect();
    
    // Trigger callback
    if (this.onAttack) {
      this.onAttack(this.state.x, this.state.y, ATTACK_RANGE, this._attackDamage);
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
    if (now - this.state.lastDashTime < this._dashCooldown) {
      return false;
    }
    
    this.state.isDashing = true;
    this.state.lastDashTime = now;
    
    // Dash in current velocity direction (or toward target if stationary)
    let dashX = this.state.vx;
    let dashY = this.state.vy;
    
    if (dashX === 0 && dashY === 0 && this.state.target) {
      // Dash toward current target if not moving
      dashX = this.state.target.state.x - this.state.x;
      dashY = this.state.target.state.y - this.state.y;
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
   * Area Blast ability (E key) - commanded by player
   */
  public areaBlast(): boolean {
    const now = Date.now();
    if (now - this.state.lastBlastTime < BLAST_COOLDOWN) {
      return false;
    }
    
    this.state.lastBlastTime = now;
    
    // Trigger callback for damage
    if (this.onBlast) {
      this.onBlast(this.state.x, this.state.y, this._blastRange, this._blastDamage);
    }
    
    // Visual flash
    this.graphics.tint = 0xffff00;
    setTimeout(() => {
      if (this.graphics) this.graphics.tint = 0xffffff;
    }, 200);
    
    console.log('💥 Agent area blast!');
    return true;
  }
  
  /**
   * Projectile ability (R key) - commanded by player
   */
  public fireProjectile(): boolean {
    const now = Date.now();
    if (now - this.state.lastProjectileTime < PROJECTILE_COOLDOWN) {
      return false;
    }
    
    this.state.lastProjectileTime = now;
    
    // Fire toward current target if available, otherwise forward
    let targetX = this.state.x;
    let targetY = this.state.y - 100; // Default: up
    
    if (this.state.target) {
      targetX = this.state.target.state.x;
      targetY = this.state.target.state.y;
    }
    
    // Trigger callback
    if (this.onProjectile) {
      this.onProjectile(this.state.x, this.state.y, targetX, targetY, PROJECTILE_DAMAGE);
    }
    
    console.log('🔮 Agent projectile!');
    return true;
  }
  
  /**
   * Heal ability (F key) - commanded by player
   */
  public heal(): boolean {
    const now = Date.now();
    if (now - this.state.lastHealTime < HEAL_COOLDOWN) {
      return false;
    }
    
    // Can't overheal
    if (this.state.hp >= this.state.maxHp) {
      return false;
    }
    
    this.state.lastHealTime = now;
    
    const healAmount = Math.floor(this.state.maxHp * HEAL_PERCENT);
    this.state.hp = Math.min(this.state.maxHp, this.state.hp + healAmount);
    
    // Visual flash
    this.graphics.tint = 0x00ff00;
    setTimeout(() => {
      if (this.graphics) this.graphics.tint = 0xffffff;
    }, 300);
    
    console.log(`💚 Agent heal! +${healAmount} HP (${this.state.hp}/${this.state.maxHp})`);
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
    this.graphics.clear();
    const color = this.schoolConfig?.spriteColor ?? AGENT_COLOR;
    // Body circle
    this.graphics.beginFill(color);
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
    this.keydownHandler = (e: KeyboardEvent) => {
      // Q: Dash
      if (e.code === 'KeyQ') {
        this.dash();
        e.preventDefault();
      }
      // E: Area Blast
      if (e.code === 'KeyE') {
        this.areaBlast();
        e.preventDefault();
      }
      // R: Projectile
      if (e.code === 'KeyR') {
        this.fireProjectile();
        e.preventDefault();
      }
      // F: Heal
      if (e.code === 'KeyF') {
        this.heal();
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', this.keydownHandler);
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
      const dx = enemy.state.x - this.state.x;
      const dy = enemy.state.y - this.state.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) { nearestDist = dist; nearest = enemy; }
    }
    return nearest;
  }

  /** Find target based on current targeting mode */
  private findTarget(): Enemy | null {
    const alive = this.enemies.filter(e => !e.dead && e.state.hp > 0);
    if (alive.length === 0) return null;
    switch (this._targetingMode) {
      case 'lowest-hp':
        return alive.reduce((min, e) => e.state.hp < min.state.hp ? e : min, alive[0]);
      case 'random':
        // Re-randomize only occasionally (every ~60 frames) to avoid jitter
        if (!this.state.target || this.state.target.dead || Math.random() < 0.016) {
          return alive[Math.floor(Math.random() * alive.length)];
        }
        return this.state.target;
      default:
        return this.findNearestEnemy();
    }
  }
  
  /**
   * Calculate distance to target
   */
  private distanceTo(enemy: Enemy): number {
    const dx = enemy.state.x - this.state.x;
    const dy = enemy.state.y - this.state.y;
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
      this.state.vx = (dx / dist) * this._moveSpeed;
      this.state.vy = (dy / dist) * this._moveSpeed;
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
      this.state.vx = (dx / dist) * this._moveSpeed;
      this.state.vy = (dy / dist) * this._moveSpeed;
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
      this.state.target = this.findTarget();
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
          // Move toward target until within preferred distance
          this.moveToward(this.state.target.state.x, this.state.target.state.y);
          
          const dist = this.distanceTo(this.state.target);
          if (dist <= this._preferredDistance) {
            this.state.aiState = AgentAIState.ATTACK;
          }
        }
        break;
        
      case AgentAIState.ATTACK:
        if (!this.state.target) {
          this.state.aiState = AgentAIState.IDLE;
        } else {
          const dist = this.distanceTo(this.state.target);
          
          if (dist > this._preferredDistance * 1.4) {
            // Drifted too far — re-approach
            this.state.aiState = AgentAIState.APPROACH;
          } else {
            // In range: if close enough, melee attack
            if (dist <= ATTACK_RANGE) {
              this.attack();
            }
            // Drift toward preferred distance
            if (dist > this._preferredDistance) {
              this.moveToward(this.state.target.state.x, this.state.target.state.y);
              this.state.vx *= 0.5;
              this.state.vy *= 0.5;
            } else if (dist < this._preferredDistance * 0.5) {
              // Too close — drift back slightly
              const dx = this.state.x - this.state.target.state.x;
              const dy = this.state.y - this.state.target.state.y;
              const d = Math.sqrt(dx * dx + dy * dy) || 1;
              this.state.vx = (dx / d) * this._moveSpeed * 0.4;
              this.state.vy = (dy / d) * this._moveSpeed * 0.4;
            } else {
              this.state.vx *= 0.3;
              this.state.vy *= 0.3;
            }
          }
        }
        break;
        
      case AgentAIState.RETREAT:
        // Move away from nearest enemy
        const nearestEnemy = this.findNearestEnemy();
        if (nearestEnemy) {
          this.moveAwayFrom(nearestEnemy.state.x, nearestEnemy.state.y);
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
    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
    console.log('🤖 Agent destroyed');
  }
}
