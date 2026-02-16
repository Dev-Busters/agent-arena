import { Graphics, Container } from 'pixi.js';

/**
 * GoldCoin - Collectible currency that drops from enemies
 */
export class GoldCoin {
  public container: Container;
  public value: number;
  public collected: boolean = false;
  private graphics: Graphics;
  private x: number;
  private y: number;
  private pulseTimer: number = 0;
  
  constructor(x: number, y: number, value: number = 5) {
    this.x = x;
    this.y = y;
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
    
    // Outer ring (gold)
    this.graphics.beginFill(0xffd700);
    this.graphics.drawCircle(0, 0, size);
    this.graphics.endFill();
    
    // Inner ring (darker gold)
    this.graphics.beginFill(0xdaa520);
    this.graphics.drawCircle(0, 0, size - 3);
    this.graphics.endFill();
    
    // Center highlight
    this.graphics.beginFill(0xffed4e, 0.8);
    this.graphics.drawCircle(-2, -2, size / 3);
    this.graphics.endFill();
  }
  
  /**
   * Update coin animation (pulse effect)
   */
  public update(delta: number): void {
    this.pulseTimer += delta * 0.1;
    const scale = 1 + Math.sin(this.pulseTimer) * 0.1;
    this.graphics.scale.set(scale, scale);
  }
  
  /**
   * Check if agent is close enough to collect
   */
  public checkCollection(agentX: number, agentY: number): boolean {
    const dx = this.x - agentX;
    const dy = this.y - agentY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 30 && !this.collected) {
      this.collected = true;
      return true;
    }
    
    return false;
  }
  
  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
