import { Graphics, Container } from 'pixi.js';
import { SchoolConfig } from './schools';
import { Discipline } from './disciplines';
import { Tenet, TargetingMode } from './tenets';

// Agent configuration
const AGENT_SIZE       = 32;
const AGENT_COLOR      = 0x4a90d9;
const AGENT_OUTLINE    = 0x2a5a9a;
const MOVE_SPEED       = 5;
const ATTACK_RANGE     = 60;
const ATTACK_DAMAGE    = 10;
const ATTACK_COOLDOWN  = 300; // ms

// Abilities
const DASH_COOLDOWN       = 3000;
const DASH_SPEED          = 20;
const DASH_DURATION       = 150;
const BLAST_COOLDOWN      = 6000;
const BLAST_RANGE         = 100;
const BLAST_DAMAGE        = 30;
const PROJECTILE_COOLDOWN = 5000;
const PROJECTILE_DAMAGE   = 25;
const HEAL_COOLDOWN       = 12000;
const HEAL_PERCENT        = 0.3;

export interface AgentState {
  x: number; y: number;
  vx: number; vy: number;
  hp: number; maxHp: number;
  isAttacking: boolean;
  lastAttackTime: number;
  isDashing: boolean;
  lastDashTime: number;
  lastBlastTime: number;
  lastProjectileTime: number;
  lastHealTime: number;
  level: number; xp: number; xpToNext: number;
  attack: number; defense: number;
}

/**
 * Agent class - player-controlled champion.
 * WASD to move, Space/Click to attack, Q/E/R/F for abilities, mouse for aiming.
 * AI behavior lives in AgentAI.ts and is used for PvP autonomous matches only.
 */
export class Agent {
  public container: Container;
  public state: AgentState;
  public onAttack?:    (x: number, y: number, range: number, damage: number) => void;
  public onBlast?:     (x: number, y: number, range: number, damage: number) => void;
  public onProjectile?:(x: number, y: number, tx: number, ty: number, damage: number) => void;

  private graphics: Graphics;
  private bounds: { minX: number; minY: number; maxX: number; maxY: number };
  private canvasRef: HTMLCanvasElement | null = null;

  // Input state — held keys
  private keys = { w: false, a: false, s: false, d: false, space: false };

  // Mouse state
  private mouseX = 0;
  private mouseY = 0;

  // Event handler refs for cleanup
  private keydownHandler:   ((e: KeyboardEvent) => void) | null = null;
  private keyupHandler:     ((e: KeyboardEvent) => void) | null = null;
  private mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private clickHandler:     ((e: MouseEvent) => void) | null = null;

  // School-derived instance properties
  private schoolConfig: SchoolConfig | null = null;
  private _moveSpeed        = MOVE_SPEED;
  private _attackDamage     = ATTACK_DAMAGE;
  private _attackCooldown   = ATTACK_COOLDOWN;
  private _dashCooldown     = DASH_COOLDOWN;
  private _blastRange       = BLAST_RANGE;
  private _blastDamage      = BLAST_DAMAGE;
  private _critBonus        = 0;
  private _damageTakenMult  = 1.0;
  private _berserker        = false;
  private _executioner      = false;
  // targetingMode kept for AgentAI compatibility — not used in player mode
  private _targetingMode: TargetingMode = 'nearest';

  // ── Public accessors ────────────────────────────────────────────────────
  public getDamageTakenMult(): number  { return this._damageTakenMult; }
  public getMoveSpeed(): number        { return this._moveSpeed; }
  /** Used by AgentAI in PvP autonomous mode */
  public tryAttack(): boolean          { return this.attack(); }

  public getLiveDamageMultiplier(): number {
    if (!this._berserker) return 1.0;
    const missingPct = 1 - Math.max(0, this.state.hp / this.state.maxHp);
    return 1 + missingPct * 1.5;
  }

  public getExecutionerBonus(targetHpPct: number): number {
    return (this._executioner && targetHpPct < 0.3) ? 1.5 : 1.0;
  }

  // ── School / Discipline / Tenet ─────────────────────────────────────────
  public setSchool(config: SchoolConfig): void {
    this.schoolConfig = config;
    this.state.maxHp        = 100 + config.stats.hpBonus;
    this.state.hp           = this.state.maxHp;
    this._moveSpeed         = MOVE_SPEED * config.stats.speedMultiplier;
    this._attackDamage      = ATTACK_DAMAGE * config.stats.damageMultiplier;
    this._attackCooldown    = ATTACK_COOLDOWN * config.ai.attackCooldownMult;
    this._dashCooldown      = DASH_COOLDOWN * config.ai.dashCooldownMult;
    this._blastRange        = BLAST_RANGE * (1 + config.stats.blastRadiusBonus / 100);
    this._blastDamage       = BLAST_DAMAGE * config.stats.damageMultiplier;
    this._critBonus         = config.stats.critBonus;
    this.drawAgent();
    console.log(`🎖️ School: ${config.name} | HP:${this.state.maxHp} Speed:${this._moveSpeed.toFixed(1)}`);
  }

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
  }

  public applyTenet(tenet: Tenet): void {
    const e = tenet.effects;
    if (e.hpBonus)            { this.state.maxHp += e.hpBonus; this.state.hp += e.hpBonus; }
    if (e.hpMult)             { const n = Math.round(this.state.maxHp * e.hpMult); this.state.hp = n; this.state.maxHp = n; }
    if (e.damageMult)         { this._attackDamage *= e.damageMult; this._blastDamage *= e.damageMult; }
    if (e.speedMult)          { this._moveSpeed *= e.speedMult; }
    if (e.critBonus)          { this._critBonus += e.critBonus; }
    if (e.blastRadiusMult)    { this._blastRange *= e.blastRadiusMult; }
    if (e.attackCooldownMult) { this._attackCooldown *= e.attackCooldownMult; }
    if (e.damageTakenMult)    { this._damageTakenMult *= e.damageTakenMult; }
    if (e.targeting)          { this._targetingMode = e.targeting; }
    if (e.berserker)          { this._berserker = true; }
    if (e.executioner)        { this._executioner = true; }
  }

  public getSchoolConfig(): SchoolConfig | null { return this.schoolConfig; }

  // ── Constructor ──────────────────────────────────────────────────────────
  constructor(x: number, y: number, arenaWidth: number, arenaHeight: number, wallThickness = 16) {
    this.container = new Container();
    this.graphics  = new Graphics();

    this.state = {
      x, y, vx: 0, vy: 0,
      hp: 100, maxHp: 100,
      isAttacking: false, lastAttackTime: 0,
      isDashing: false, lastDashTime: 0,
      lastBlastTime: 0, lastProjectileTime: 0, lastHealTime: 0,
      level: 1, xp: 0, xpToNext: 100,
      attack: 10, defense: 5,
    };

    this.bounds = {
      minX: wallThickness + AGENT_SIZE / 2,
      minY: wallThickness + AGENT_SIZE / 2,
      maxX: arenaWidth  - wallThickness - AGENT_SIZE / 2,
      maxY: arenaHeight - wallThickness - AGENT_SIZE / 2,
    };

    this.drawAgent();
    this.container.addChild(this.graphics);
    this.updatePosition();
    this.setupInput();

    console.log('🎮 Agent created at', x, y, '(player-controlled)');
  }

  /** Pass the PixiJS canvas element so mouse coordinates are correct */
  public setCanvas(canvas: HTMLCanvasElement): void {
    this.canvasRef = canvas;

    this.mouseMoveHandler = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
    };
    canvas.addEventListener('mousemove', this.mouseMoveHandler);

    this.clickHandler = (_e: MouseEvent) => { this.attack(); };
    canvas.addEventListener('mousedown', this.clickHandler);
  }

  // ── Input setup ──────────────────────────────────────────────────────────
  private setupInput(): void {
    this.keydownHandler = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':    this.keys.w = true; break;
        case 'KeyA':    this.keys.a = true; break;
        case 'KeyS':    this.keys.s = true; break;
        case 'KeyD':    this.keys.d = true; break;
        case 'Space':   this.keys.space = true; e.preventDefault(); break;
        case 'KeyQ':    this.dash();         e.preventDefault(); break;
        case 'KeyE':    this.areaBlast();    e.preventDefault(); break;
        case 'KeyR':    this.fireProjectile(); e.preventDefault(); break;
        case 'KeyF':    this.heal();         e.preventDefault(); break;
      }
    };
    this.keyupHandler = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':  this.keys.w = false; break;
        case 'KeyA':  this.keys.a = false; break;
        case 'KeyS':  this.keys.s = false; break;
        case 'KeyD':  this.keys.d = false; break;
        case 'Space': this.keys.space = false; break;
      }
    };
    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup',   this.keyupHandler);
  }

  // ── Player movement ──────────────────────────────────────────────────────
  private processInput(_delta: number): void {
    if (this.state.isDashing) return;

    let moveX = 0;
    let moveY = 0;
    if (this.keys.w) moveY -= 1;
    if (this.keys.s) moveY += 1;
    if (this.keys.a) moveX -= 1;
    if (this.keys.d) moveX += 1;

    // Normalize diagonal so it is not faster
    if (moveX !== 0 && moveY !== 0) {
      const inv = 0.7071;
      moveX *= inv;
      moveY *= inv;
    }

    // Instant stop when keys released — no drift
    this.state.vx = moveX * this._moveSpeed;
    this.state.vy = moveY * this._moveSpeed;

    // Space held = continuous melee attack (limited by cooldown)
    if (this.keys.space) {
      this.attack();
    }
  }

  // ── Facing direction ─────────────────────────────────────────────────────
  private updateFacing(): void {
    const dx = this.mouseX - this.state.x;
    const dy = this.mouseY - this.state.y;
    // atan2 gives angle from positive X axis; +PI/2 corrects for upward default
    this.container.rotation = Math.atan2(dy, dx) + Math.PI / 2;
  }

  // ── Combat ───────────────────────────────────────────────────────────────
  private attack(): boolean {
    const now = Date.now();
    if (now - this.state.lastAttackTime < this._attackCooldown) return false;

    this.state.isAttacking  = true;
    this.state.lastAttackTime = now;
    this.showAttackEffect();
    this.onAttack?.(this.state.x, this.state.y, ATTACK_RANGE, this._attackDamage);
    setTimeout(() => { this.state.isAttacking = false; }, 150);
    return true;
  }

  public dash(): boolean {
    const now = Date.now();
    if (now - this.state.lastDashTime < this._dashCooldown) return false;

    this.state.isDashing   = true;
    this.state.lastDashTime = now;

    // Dash in movement direction; fall back to cursor direction if stationary
    let dashX = this.state.vx;
    let dashY = this.state.vy;

    if (dashX === 0 && dashY === 0) {
      dashX = this.mouseX - this.state.x;
      dashY = this.mouseY - this.state.y;
    }

    const mag = Math.sqrt(dashX * dashX + dashY * dashY);
    if (mag > 0) {
      this.state.vx = (dashX / mag) * DASH_SPEED;
      this.state.vy = (dashY / mag) * DASH_SPEED;
    }

    this.graphics.tint = 0xccccff;
    setTimeout(() => {
      this.state.isDashing = false;
      if (this.graphics) this.graphics.tint = 0xffffff;
    }, DASH_DURATION);

    return true;
  }

  public areaBlast(): boolean {
    const now = Date.now();
    if (now - this.state.lastBlastTime < BLAST_COOLDOWN) return false;

    this.state.lastBlastTime = now;
    this.onBlast?.(this.state.x, this.state.y, this._blastRange, this._blastDamage);

    this.graphics.tint = 0xffff00;
    setTimeout(() => { if (this.graphics) this.graphics.tint = 0xffffff; }, 200);
    return true;
  }

  public fireProjectile(): boolean {
    const now = Date.now();
    if (now - this.state.lastProjectileTime < PROJECTILE_COOLDOWN) return false;

    this.state.lastProjectileTime = now;

    // Aim at mouse cursor; fall back to directly up if mouse hasn't moved
    let targetX = this.mouseX;
    let targetY = this.mouseY;
    if (targetX === 0 && targetY === 0) {
      targetX = this.state.x;
      targetY = this.state.y - 100;
    }

    this.onProjectile?.(this.state.x, this.state.y, targetX, targetY, PROJECTILE_DAMAGE);
    return true;
  }

  public heal(): boolean {
    const now = Date.now();
    if (now - this.state.lastHealTime < HEAL_COOLDOWN) return false;
    if (this.state.hp >= this.state.maxHp) return false;

    this.state.lastHealTime = now;
    const healAmount = Math.floor(this.state.maxHp * HEAL_PERCENT);
    this.state.hp = Math.min(this.state.maxHp, this.state.hp + healAmount);

    this.graphics.tint = 0x00ff00;
    setTimeout(() => { if (this.graphics) this.graphics.tint = 0xffffff; }, 300);
    return true;
  }

  public takeDamage(amount: number): void {
    this.state.hp = Math.max(0, this.state.hp - amount);
  }

  // ── Per-frame update ─────────────────────────────────────────────────────
  public update(delta: number): void {
    this.processInput(delta);

    this.state.x += this.state.vx;
    this.state.y += this.state.vy;

    this.state.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.state.x));
    this.state.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, this.state.y));

    this.updatePosition();
    this.updateFacing();
  }

  // ── XP / Level ───────────────────────────────────────────────────────────
  public gainXP(amount: number): boolean {
    this.state.xp += amount;
    if (this.state.xp >= this.state.xpToNext) { this.levelUp(); return true; }
    return false;
  }

  private levelUp(): void {
    this.state.level++;
    this.state.xp      = 0;
    this.state.xpToNext = this.state.level * 100;
    this.state.maxHp   += 10;
    this.state.hp       = this.state.maxHp;
    this.state.attack  += 2;
    this.state.defense += 1;
    console.log(`⭐ Level Up! ${this.state.level}`);
  }

  // ── Visuals ──────────────────────────────────────────────────────────────
  private showAttackEffect(): void {
    if (this.graphics) {
      this.graphics.tint = 0xffff00;
      setTimeout(() => { if (this.graphics) this.graphics.tint = 0xffffff; }, 100);
    }
  }

  private drawAgent(): void {
    this.graphics.clear();
    const color = this.schoolConfig?.spriteColor ?? AGENT_COLOR;
    this.graphics.beginFill(color);
    this.graphics.lineStyle(2, AGENT_OUTLINE);
    this.graphics.drawCircle(0, 0, AGENT_SIZE / 2);
    this.graphics.endFill();
    // Direction indicator (points up by default; rotated in updateFacing)
    this.graphics.beginFill(0xffffff, 0.8);
    this.graphics.moveTo(0, -AGENT_SIZE / 2 - 4);
    this.graphics.lineTo(-6, -AGENT_SIZE / 2 + 4);
    this.graphics.lineTo(6,  -AGENT_SIZE / 2 + 4);
    this.graphics.closePath();
    this.graphics.endFill();
  }

  private updatePosition(): void {
    this.container.x = this.state.x;
    this.container.y = this.state.y;
  }

  // ── Cleanup ──────────────────────────────────────────────────────────────
  public destroy(): void {
    if (this.keydownHandler)   { window.removeEventListener('keydown', this.keydownHandler); this.keydownHandler = null; }
    if (this.keyupHandler)     { window.removeEventListener('keyup',   this.keyupHandler);   this.keyupHandler   = null; }
    if (this.canvasRef) {
      if (this.mouseMoveHandler) { this.canvasRef.removeEventListener('mousemove', this.mouseMoveHandler); this.mouseMoveHandler = null; }
      if (this.clickHandler)     { this.canvasRef.removeEventListener('mousedown', this.clickHandler);     this.clickHandler     = null; }
    }
    console.log('🎮 Agent destroyed');
  }
}
