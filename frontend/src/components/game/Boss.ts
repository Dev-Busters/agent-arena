import { Graphics, Container } from 'pixi.js';

const BOSS_SIZE = 72;
const BOSS_HP = 800;
const BOSS_SPEED_CHASE = 2.0;
const BOSS_SPEED_CHARGE = 8.0;
const PATTERN_DURATION = { CHASE: 5000, SLAM: 1800, SUMMON: 1200 };

type BossPattern = 'CHASE' | 'SLAM' | 'SUMMON' | 'CHARGE';

export interface BossState {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
}

/**
 * Boss — The Warden
 * Large enemy with 3 cycling attack patterns:
 *   CHASE → SLAM → CHASE → CHARGE → SUMMON → repeat
 */
export class Boss {
  public container: Container;
  public state: BossState;
  public dead = false;
  public onSlam?: (x: number, y: number, radius: number, damage: number) => void;
  public onSummon?: (x: number, y: number, count: number) => void;

  private body: Graphics;
  private healthBar: Graphics;
  private slamWarning: Graphics;
  private bounds: { minX: number; minY: number; maxX: number; maxY: number };

  private pattern: BossPattern = 'CHASE';
  private patternTimer = 0;
  private patternIndex = 0;
  private patternSequence: BossPattern[] = ['CHASE', 'SLAM', 'CHASE', 'CHARGE', 'SUMMON'];

  private chargeVx = 0;
  private chargeVy = 0;
  private slamPhase: 'warn' | 'hit' | 'done' = 'done';
  private slamTimer = 0;

  constructor(x: number, y: number, arenaW: number, arenaH: number, wall = 16) {
    this.container = new Container();
    this.body = new Graphics();
    this.healthBar = new Graphics();
    this.slamWarning = new Graphics();

    this.state = { x, y, hp: BOSS_HP, maxHp: BOSS_HP };

    this.bounds = {
      minX: wall + BOSS_SIZE,
      minY: wall + BOSS_SIZE,
      maxX: arenaW - wall - BOSS_SIZE,
      maxY: arenaH - wall - BOSS_SIZE,
    };

    this.drawBody();
    this.container.addChild(this.slamWarning);
    this.container.addChild(this.body);
    this.container.addChild(this.healthBar);
    this.updatePosition();

    console.log('💀 The Warden has appeared!');
  }

  private drawBody(): void {
    this.body.clear();
    const s = BOSS_SIZE;
    this.body.beginFill(0xcc1111);
    this.body.lineStyle(4, 0xff4444);
    this.body.moveTo(0, -s);
    this.body.lineTo(s, 0);
    this.body.lineTo(0, s);
    this.body.lineTo(-s, 0);
    this.body.closePath();
    this.body.endFill();

    // Eyes
    const eye = 8;
    this.body.beginFill(0x000000);
    this.body.drawCircle(-18, -12, eye);
    this.body.drawCircle(18, -12, eye);
    this.body.endFill();
    this.body.beginFill(0xff0000, 0.9);
    this.body.drawCircle(-18, -12, eye / 2);
    this.body.drawCircle(18, -12, eye / 2);
    this.body.endFill();
  }

  private drawHealthBar(): void {
    this.healthBar.clear();
    const barW = 120, barH = 8;
    const yOff = -BOSS_SIZE - 18;
    this.healthBar.beginFill(0x333333);
    this.healthBar.drawRect(-barW / 2, yOff, barW, barH);
    this.healthBar.endFill();
    const pct = Math.max(0, this.state.hp / this.state.maxHp);
    const color = pct > 0.5 ? 0xff4444 : pct > 0.25 ? 0xff8800 : 0xffff00;
    this.healthBar.beginFill(color);
    this.healthBar.drawRect(-barW / 2, yOff, barW * pct, barH);
    this.healthBar.endFill();
    this.healthBar.lineStyle(1, 0x000000, 0.5);
    this.healthBar.drawRect(-barW / 2, yOff, barW, barH);
  }

  private updatePosition(): void {
    this.container.x = this.state.x;
    this.container.y = this.state.y;
  }

  public takeDamage(amount: number): void {
    this.state.hp = Math.max(0, this.state.hp - amount);
    if (this.state.hp <= 0) this.dead = true;
  }

  /** Update boss — call every frame */
  public update(delta: number, agentX: number, agentY: number): void {
    this.patternTimer += delta * 16.67; // approx ms per frame

    // Check if it's time to switch pattern
    const maxDuration = PATTERN_DURATION[this.pattern] ?? 3000;
    if (this.patternTimer >= maxDuration) {
      this.patternIndex = (this.patternIndex + 1) % this.patternSequence.length;
      this.pattern = this.patternSequence[this.patternIndex];
      this.patternTimer = 0;
      this.executePatternStart(agentX, agentY);
    }

    // Execute current pattern each frame
    switch (this.pattern) {
      case 'CHASE': this.updateChase(agentX, agentY, delta); break;
      case 'CHARGE': this.updateCharge(delta); break;
      case 'SLAM': this.updateSlam(delta); break;
      case 'SUMMON': break; // handled in executePatternStart
    }

    // Apply position
    this.state.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.state.x));
    this.state.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, this.state.y));
    this.updatePosition();
    this.drawHealthBar();

    // Rotate body to face agent
    const dx = agentX - this.state.x;
    const dy = agentY - this.state.y;
    this.body.rotation = Math.atan2(dy, dx) + Math.PI / 2;
  }

  private executePatternStart(agentX: number, agentY: number): void {
    console.log(`👹 Warden pattern: ${this.pattern}`);

    if (this.pattern === 'CHARGE') {
      const dx = agentX - this.state.x;
      const dy = agentY - this.state.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      this.chargeVx = dist > 0 ? (dx / dist) * BOSS_SPEED_CHARGE : 0;
      this.chargeVy = dist > 0 ? (dy / dist) * BOSS_SPEED_CHARGE : 0;
    }

    if (this.pattern === 'SLAM') {
      this.slamPhase = 'warn';
      this.slamTimer = 0;
      this.drawSlamWarning(200);
    }

    if (this.pattern === 'SUMMON') {
      this.onSummon?.(this.state.x, this.state.y, 3);
    }
  }

  private updateChase(agentX: number, agentY: number, delta: number): void {
    const dx = agentX - this.state.x;
    const dy = agentY - this.state.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 60) {
      this.state.x += (dx / dist) * BOSS_SPEED_CHASE * delta;
      this.state.y += (dy / dist) * BOSS_SPEED_CHASE * delta;
    }
  }

  private updateCharge(delta: number): void {
    this.state.x += this.chargeVx * delta;
    this.state.y += this.chargeVy * delta;
  }

  private updateSlam(delta: number): void {
    this.slamTimer += delta * 16.67;
    if (this.slamPhase === 'warn' && this.slamTimer > 800) {
      this.slamPhase = 'hit';
      this.slamWarning.clear();
      this.onSlam?.(this.state.x, this.state.y, 200, 25);
      console.log('💥 Warden SLAM!');
    }
  }

  private drawSlamWarning(radius: number): void {
    this.slamWarning.clear();
    this.slamWarning.lineStyle(3, 0xff4444, 0.7);
    this.slamWarning.drawCircle(0, 0, radius);
    this.slamWarning.beginFill(0xff0000, 0.12);
    this.slamWarning.drawCircle(0, 0, radius);
    this.slamWarning.endFill();
  }

  public destroy(): void {
    this.container.destroy({ children: true });
    console.log('💀 Warden defeated!');
  }
}
