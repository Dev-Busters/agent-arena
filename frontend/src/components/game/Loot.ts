import { Graphics, Container } from 'pixi.js';

export type LootType = 'health_potion' | 'damage_boost' | 'shield';

interface LootConfig {
  color: number;
  name: string;
  effect: string;
}

const LOOT_TYPES: Record<LootType, LootConfig> = {
  health_potion: { 
    color: 0xff4444, 
    name: 'Health Potion', 
    effect: '+30 HP' 
  },
  damage_boost: { 
    color: 0xff8844, 
    name: 'Damage Boost', 
    effect: '+5 ATK (30s)' 
  },
  shield: { 
    color: 0x4488ff, 
    name: 'Shield', 
    effect: '+10 DEF (30s)' 
  }
};

/**
 * Loot - pickable item that appears on enemy death
 */
export class Loot {
  public container: Container;
  public collected: boolean = false;
  public type: LootType;
  
  private graphics: Graphics;
  private bobOffset: number = 0;
  private config: LootConfig;
  
  constructor(x: number, y: number, type: LootType) {
    this.container = new Container();
    this.graphics = new Graphics();
    this.type = type;
    this.config = LOOT_TYPES[type];
    
    // Draw loot as a glowing square
    this.graphics.beginFill(this.config.color, 0.8);
    this.graphics.drawRect(-8, -8, 16, 16);
    this.graphics.endFill();
    
    // Outer glow
    this.graphics.beginFill(this.config.color, 0.3);
    this.graphics.drawCircle(0, 0, 14);
    this.graphics.endFill();
    
    this.container.addChild(this.graphics);
    this.container.x = x;
    this.container.y = y;
    
    // Random bob offset for variation
    this.bobOffset = Math.random() * Math.PI * 2;
  }
  
  /**
   * Update loot - gentle bob animation
   * Returns true if player is close enough to collect
   */
  public update(playerX: number, playerY: number): boolean {
    if (this.collected) return true;
    
    // Bob up and down
    this.bobOffset += 0.05;
    this.graphics.y = Math.sin(this.bobOffset) * 4;
    
    // Gentle rotation
    this.graphics.rotation += 0.02;
    
    // Check distance to player
    const dx = playerX - this.container.x;
    const dy = playerY - this.container.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    // Collect if close
    if (dist < 30) {
      this.collected = true;
      return true;
    }
    
    return false;
  }
  
  public getName(): string {
    return this.config.name;
  }
  
  public getEffect(): string {
    return this.config.effect;
  }
  
  public destroy(): void {
    this.container.destroy({ children: true });
  }
}

/**
 * Random loot type selection
 */
export function randomLootType(): LootType {
  const types: LootType[] = ['health_potion', 'damage_boost', 'shield'];
  return types[Math.floor(Math.random() * types.length)];
}
