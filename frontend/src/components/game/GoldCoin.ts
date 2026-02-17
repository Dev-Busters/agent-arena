import { Graphics, Container } from 'pixi.js';

const ATTRACT_RADIUS = 120; // start pulling toward player within this range
const COLLECT_RADIUS = 22;  // auto-collect when this close

/**
 * GoldCoin - Collectible currency that drops from enemies.
 * Pulses in place until the agent comes within ATTRACT_RADIUS,
 * then flies toward them like XP orbs.
 */
export class GoldCoin {
  public container: Container;
  public value: number;
  public collected: boolean = false;
  private graphics: Graphics;
  private pulseTimer: number = 0;
  private targetX: number;
  private targetY: number;
  private attracting: boolean = false;

  constructor(x: number, y: number, value: number = 5) {
    this.targetX = x;
    this.targetY = y;
    this.value = value;

    this.container = new Container();
    this.graphics = new Graphics();
    this.drawCoin();
    this.container.addChild(this.graphics);
    this.container.x = x;
    this.container.y = y;
  }

  private drawCoin(): void {
    const size = 12;
    this.graphics.beginFill(0xffd700);
    this.graphics.drawCircle(0, 0, size);
    this.graphics.endFill();
    this.graphics.beginFill(0xdaa520);
    this.graphics.drawCircle(0, 0, size - 3);
    this.graphics.endFill();
    this.graphics.beginFill(0xffed4e, 0.8);
    this.graphics.drawCircle(-2, -2, size / 3);
    this.graphics.endFill();
  }

  /**
   * Update coin — moves toward player when in range.
   * Pass agent position every frame.
   * Returns true when collected.
   */
  public update(delta: number, agentX: number, agentY: number): boolean {
    if (this.collected) return true;

    const dx = agentX - this.container.x;
    const dy = agentY - this.container.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Auto-collect when very close
    if (dist < COLLECT_RADIUS) {
      this.collected = true;
      return true;
    }

    // Start attracting once agent is within radius
    if (dist < ATTRACT_RADIUS) {
      this.attracting = true;
    }

    if (this.attracting) {
      // Accelerate as it gets closer (same feel as XPOrb)
      const speed = 2.5 + (ATTRACT_RADIUS - Math.min(dist, ATTRACT_RADIUS)) / 25;
      this.container.x += (dx / dist) * speed;
      this.container.y += (dy / dist) * speed;

      // Shrink slightly as it flies in for a satisfying "snap" feel
      const scalePulse = 0.85 + Math.sin(Date.now() / 150) * 0.1;
      this.graphics.scale.set(scalePulse);
    } else {
      // Idle pulse while waiting on the ground
      this.pulseTimer += delta * 0.08;
      const idleScale = 1 + Math.sin(this.pulseTimer) * 0.12;
      this.graphics.scale.set(idleScale);
    }

    return false;
  }

  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
