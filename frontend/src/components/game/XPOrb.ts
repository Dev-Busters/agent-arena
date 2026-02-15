import { Graphics, Container } from 'pixi.js';

/**
 * XP Orb - floats toward player when enemy dies
 */
export class XPOrb {
  public container: Container;
  public collected: boolean = false;
  
  private graphics: Graphics;
  private targetX: number = 0;
  private targetY: number = 0;
  private xpValue: number;
  
  constructor(x: number, y: number, xpValue: number = 10) {
    this.container = new Container();
    this.graphics = new Graphics();
    this.xpValue = xpValue;
    
    // Yellow glowing orb
    this.graphics.beginFill(0xffd700, 0.8);
    this.graphics.drawCircle(0, 0, 6);
    this.graphics.endFill();
    
    // Outer glow
    this.graphics.beginFill(0xffff00, 0.3);
    this.graphics.drawCircle(0, 0, 10);
    this.graphics.endFill();
    
    this.container.addChild(this.graphics);
    this.container.x = x;
    this.container.y = y;
  }
  
  /**
   * Set target position (player) for orb to move toward
   */
  public setTarget(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }
  
  /**
   * Update orb position - moves toward target
   * Returns true when orb reaches player
   */
  public update(): boolean {
    if (this.collected) return true;
    
    const dx = this.targetX - this.container.x;
    const dy = this.targetY - this.container.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Collected when close to player
    if (dist < 20) {
      this.collected = true;
      return true;
    }
    
    // Move toward player (accelerate as closer)
    const speed = 2 + (100 - Math.min(dist, 100)) / 20;
    this.container.x += (dx / dist) * speed;
    this.container.y += (dy / dist) * speed;
    
    // Gentle pulse animation
    const scale = 1 + Math.sin(Date.now() / 200) * 0.1;
    this.container.scale.set(scale);
    
    return false;
  }
  
  public getValue(): number {
    return this.xpValue;
  }
  
  public destroy(): void {
    this.container.destroy({ children: true });
  }
}
