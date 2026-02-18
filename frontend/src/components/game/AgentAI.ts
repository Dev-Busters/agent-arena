import { Agent } from './Agent';
import { Enemy } from './Enemy';
import type { TargetingMode } from './tenets';

/**
 * AgentAI — Autonomous AI controller for PvP arena battles.
 * Extracted from Agent.ts so it can be attached to any Agent instance
 * in a context where no player input is available (PvP matches, replays, etc.)
 *
 * NOT used during Crucible gameplay — the player controls the champion there.
 * Will be used in Phase I (The Arena) when two agents fight each other autonomously.
 */

export enum AgentAIState {
  IDLE     = 'IDLE',
  APPROACH = 'APPROACH',
  ATTACK   = 'ATTACK',
  RETREAT  = 'RETREAT',
}

// Behavior thresholds
const RETREAT_DAMAGE_THRESHOLD = 20;
const RETREAT_DURATION         = 1000; // ms
const ATTACK_RANGE             = 60;

export class AgentAI {
  private agent: Agent;
  private enemies: Enemy[] = [];
  private preferredDistance: number;
  private retreatTimer: number = 0;
  private aiState: AgentAIState = AgentAIState.IDLE;
  private target: Enemy | null = null;
  private lastHp: number;
  private targetingMode: TargetingMode = 'nearest';

  constructor(agent: Agent, preferredDistance: number = 80) {
    this.agent = agent;
    this.preferredDistance = preferredDistance;
    this.lastHp = agent.state.hp;
  }

  public setEnemies(enemies: Enemy[]): void {
    this.enemies = enemies.filter(e => !e.dead);
  }

  public setPreferredDistance(d: number): void {
    this.preferredDistance = d;
  }

  public setTargetingMode(mode: TargetingMode): void {
    this.targetingMode = mode;
  }

  public getState(): AgentAIState {
    return this.aiState;
  }

  /** Main update — call every ticker tick when running in autonomous mode */
  public update(delta: number): void {
    if (this.agent.state.isDashing) return;

    // Detect damage taken for retreat trigger
    const damageTaken = this.lastHp - this.agent.state.hp;
    if (damageTaken >= RETREAT_DAMAGE_THRESHOLD && this.aiState !== AgentAIState.RETREAT) {
      this.aiState = AgentAIState.RETREAT;
      this.retreatTimer = RETREAT_DURATION;
    }
    this.lastHp = this.agent.state.hp;

    // Refresh target
    if (!this.target || this.target.dead) {
      this.target = this.findTarget();
    }

    switch (this.aiState) {
      case AgentAIState.IDLE:
        if (this.target) {
          this.aiState = AgentAIState.APPROACH;
        } else {
          this.agent.state.vx = 0;
          this.agent.state.vy = 0;
        }
        break;

      case AgentAIState.APPROACH:
        if (!this.target) {
          this.aiState = AgentAIState.IDLE;
        } else {
          this.moveToward(this.target.state.x, this.target.state.y);
          if (this.distanceTo(this.target) <= this.preferredDistance) {
            this.aiState = AgentAIState.ATTACK;
          }
        }
        break;

      case AgentAIState.ATTACK:
        if (!this.target) {
          this.aiState = AgentAIState.IDLE;
        } else {
          const dist = this.distanceTo(this.target);
          if (dist > this.preferredDistance * 1.4) {
            this.aiState = AgentAIState.APPROACH;
          } else {
            if (dist <= ATTACK_RANGE) {
              this.agent.tryAttack();
            }
            if (dist > this.preferredDistance) {
              this.moveToward(this.target.state.x, this.target.state.y);
              this.agent.state.vx *= 0.5;
              this.agent.state.vy *= 0.5;
            } else if (dist < this.preferredDistance * 0.5) {
              const dx = this.agent.state.x - this.target.state.x;
              const dy = this.agent.state.y - this.target.state.y;
              const d = Math.sqrt(dx * dx + dy * dy) || 1;
              const speed = this.agent.getMoveSpeed();
              this.agent.state.vx = (dx / d) * speed * 0.4;
              this.agent.state.vy = (dy / d) * speed * 0.4;
            } else {
              this.agent.state.vx *= 0.3;
              this.agent.state.vy *= 0.3;
            }
          }
        }
        break;

      case AgentAIState.RETREAT: {
        const nearest = this.findNearestEnemy();
        if (nearest) this.moveAwayFrom(nearest.state.x, nearest.state.y);
        this.retreatTimer -= delta;
        if (this.retreatTimer <= 0) {
          this.aiState = AgentAIState.APPROACH;
        }
        break;
      }
    }
  }

  /** Find target using current targeting mode */
  public findTarget(): Enemy | null {
    const alive = this.enemies.filter(e => !e.dead && e.state.hp > 0);
    if (alive.length === 0) return null;
    switch (this.targetingMode) {
      case 'lowest-hp':
        return alive.reduce((min, e) => e.state.hp < min.state.hp ? e : min, alive[0]);
      case 'random':
        if (!this.target || this.target.dead || Math.random() < 0.016) {
          return alive[Math.floor(Math.random() * alive.length)];
        }
        return this.target;
      default: // nearest
        return this.findNearestEnemy();
    }
  }

  private findNearestEnemy(): Enemy | null {
    if (this.enemies.length === 0) return null;
    let nearest: Enemy | null = null;
    let nearestDist = Infinity;
    for (const e of this.enemies) {
      const dx = e.state.x - this.agent.state.x;
      const dy = e.state.y - this.agent.state.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nearestDist) { nearestDist = dist; nearest = e; }
    }
    return nearest;
  }

  private distanceTo(enemy: Enemy): number {
    const dx = enemy.state.x - this.agent.state.x;
    const dy = enemy.state.y - this.agent.state.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private moveToward(x: number, y: number): void {
    const dx = x - this.agent.state.x;
    const dy = y - this.agent.state.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      const speed = this.agent.getMoveSpeed();
      this.agent.state.vx = (dx / dist) * speed;
      this.agent.state.vy = (dy / dist) * speed;
    }
  }

  private moveAwayFrom(x: number, y: number): void {
    const dx = this.agent.state.x - x;
    const dy = this.agent.state.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      const speed = this.agent.getMoveSpeed();
      this.agent.state.vx = (dx / dist) * speed;
      this.agent.state.vy = (dy / dist) * speed;
    }
  }
}
