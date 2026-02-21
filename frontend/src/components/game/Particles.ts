import { Graphics, Container } from 'pixi.js';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
  graphics: Graphics;
}

/**
 * Simple particle system for visual effects
 */
export class ParticleSystem {
  public container: Container;
  private particles: Particle[] = [];
  
  constructor() {
    this.container = new Container();
  }
  
  /**
   * Emit particles at a position
   */
  public emit(
    x: number, 
    y: number, 
    count: number, 
    options: {
      color?: number;
      speed?: number;
      size?: number;
      life?: number;
      spread?: number;
    } = {}
  ): void {
    const {
      color = 0xffff00,
      speed = 3,
      size = 4,
      life = 30,
      spread = Math.PI * 2
    } = options;
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() - 0.5) * spread;
      const velocity = speed * (0.5 + Math.random() * 0.5);
      
      const graphics = new Graphics();
      graphics.beginFill(color);
      graphics.drawCircle(0, 0, size);
      graphics.endFill();
      graphics.x = x;
      graphics.y = y;
      
      this.container.addChild(graphics);
      
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life,
        maxLife: life,
        size,
        color,
        graphics
      });
    }
  }
  
  /**
   * Burst effect (explosion pattern)
   */
  public burst(x: number, y: number, color: number = 0xff4444): void {
    this.emit(x, y, 12, { color, speed: 4, size: 3, life: 20 });
  }
  
  /**
   * Hit effect (small impact)
   */
  public hit(x: number, y: number): void {
    this.emit(x, y, 6, { color: 0xffff00, speed: 2, size: 2, life: 15 });
  }
  
  /**
   * Update all particles - call every frame
   */
  public update(delta: number = 1): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      // Update position (frame-rate independent)
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.graphics.x = p.x;
      p.graphics.y = p.y;
      
      // Friction
      p.vx *= Math.pow(0.95, delta);
      p.vy *= Math.pow(0.95, delta);
      
      // Fade out
      p.life--;
      p.graphics.alpha = p.life / p.maxLife;
      
      // Scale down
      const scale = p.life / p.maxLife;
      p.graphics.scale.set(scale);
      
      // Remove dead particles
      if (p.life <= 0) {
        this.container.removeChild(p.graphics);
        p.graphics.destroy();
        this.particles.splice(i, 1);
      }
    }
  }
  
  /**
   * Clean up all particles
   */
  public destroy(): void {
    this.particles.forEach(p => {
      p.graphics.destroy();
    });
    this.particles = [];
    this.container.destroy({ children: true });
  }
}
