/**
 * Modifier System - Hades-style stackable modifiers
 * 
 * 12 starting modifiers across 3 categories:
 * - Amplifiers: Direct stat increases (damage, speed, etc.)
 * - Triggers: Conditional effects (on-kill, on-crit, etc.)
 * - Transmuters: Change behavior (lifesteal, chain attacks, etc.)
 */

export type ModifierCategory = 'amplifier' | 'trigger' | 'transmuter';
export type ModifierRarity = 'common' | 'rare' | 'epic' | 'boss';

export interface Modifier {
  id: string;
  name: string;
  description: string;
  category: ModifierCategory;
  rarity: ModifierRarity;
  effect: ModifierEffect;
  stackable: boolean;
  maxStacks?: number;
}

export interface ModifierEffect {
  // Amplifier effects
  damageMultiplier?: number;      // +20% damage = 1.2
  speedMultiplier?: number;       // +15% speed = 1.15
  attackSpeedMultiplier?: number; // +25% attack speed = 1.25
  maxHpBonus?: number;            // +30 max HP
  
  // Trigger effects
  onKillHeal?: number;            // Heal X HP on kill
  onKillDamageBoost?: number;     // +X% damage on next attack after kill
  onCritExplosion?: boolean;      // Critical hits explode for AoE
  
  // Transmuter effects
  lifestealPercent?: number;      // X% of damage dealt heals agent
  chainAttacks?: number;          // Attacks chain to X nearby enemies
  dashDamage?: number;            // Dash deals X damage
}

export interface ActiveModifier {
  modifier: Modifier;
  stacks: number;
}

/**
 * 12 Starting Modifiers
 */
export const MODIFIER_POOL: Modifier[] = [
  // AMPLIFIERS (4)
  {
    id: 'damage_boost',
    name: 'Crushing Blow',
    description: '+20% damage to all attacks',
    category: 'amplifier',
    rarity: 'common',
    effect: { damageMultiplier: 1.2 },
    stackable: true,
    maxStacks: 5
  },
  {
    id: 'speed_boost',
    name: 'Swift Steps',
    description: '+15% movement speed',
    category: 'amplifier',
    rarity: 'common',
    effect: { speedMultiplier: 1.15 },
    stackable: true,
    maxStacks: 5
  },
  {
    id: 'attack_speed',
    name: 'Rapid Strikes',
    description: '+25% attack speed',
    category: 'amplifier',
    rarity: 'common',
    effect: { attackSpeedMultiplier: 1.25 },
    stackable: true,
    maxStacks: 4
  },
  {
    id: 'fortitude',
    name: 'Fortitude',
    description: '+30 max HP',
    category: 'amplifier',
    rarity: 'common',
    effect: { maxHpBonus: 30 },
    stackable: true,
    maxStacks: 5
  },
  
  // TRIGGERS (4)
  {
    id: 'bloodlust',
    name: 'Bloodlust',
    description: 'Heal 15 HP on kill',
    category: 'trigger',
    rarity: 'rare',
    effect: { onKillHeal: 15 },
    stackable: true,
    maxStacks: 3
  },
  {
    id: 'killer_instinct',
    name: 'Killer Instinct',
    description: '+40% damage on next attack after kill',
    category: 'trigger',
    rarity: 'rare',
    effect: { onKillDamageBoost: 1.4 },
    stackable: true,
    maxStacks: 3
  },
  {
    id: 'critical_mass',
    name: 'Critical Mass',
    description: 'Critical hits explode for AoE damage',
    category: 'trigger',
    rarity: 'epic',
    effect: { onCritExplosion: true },
    stackable: false
  },
  {
    id: 'chain_reaction',
    name: 'Chain Reaction',
    description: 'Attacks chain to 2 nearby enemies',
    category: 'trigger',
    rarity: 'epic',
    effect: { chainAttacks: 2 },
    stackable: true,
    maxStacks: 2
  },
  
  // TRANSMUTERS (4)
  {
    id: 'lifesteal',
    name: 'Vampiric Touch',
    description: '10% lifesteal on attacks',
    category: 'transmuter',
    rarity: 'rare',
    effect: { lifestealPercent: 0.1 },
    stackable: true,
    maxStacks: 3
  },
  {
    id: 'dash_slam',
    name: 'Dash Slam',
    description: 'Dash deals 20 damage on impact',
    category: 'transmuter',
    rarity: 'rare',
    effect: { dashDamage: 20 },
    stackable: true,
    maxStacks: 3
  },
  {
    id: 'overcharge',
    name: 'Overcharged Blast',
    description: 'Area Blast radius +50%',
    category: 'transmuter',
    rarity: 'rare',
    effect: { /* handled in ArenaCanvas blast logic */ },
    stackable: false
  },
  {
    id: 'piercing_projectile',
    name: 'Piercing Shot',
    description: 'Projectile pierces through enemies',
    category: 'transmuter',
    rarity: 'rare',
    effect: { /* handled in ArenaCanvas projectile logic */ },
    stackable: false
  }
];

/**
 * Select 3 random modifiers for choice
 */
export function getRandomModifiers(count: number = 3, rarity: ModifierRarity = 'common'): Modifier[] {
  // Filter by rarity
  let pool = MODIFIER_POOL;
  if (rarity === 'rare') {
    pool = MODIFIER_POOL.filter(m => m.rarity === 'rare' || m.rarity === 'common');
  } else if (rarity === 'epic') {
    pool = MODIFIER_POOL.filter(m => m.rarity === 'epic' || m.rarity === 'rare');
  }
  
  const selected: Modifier[] = [];
  const available = [...pool];
  
  for (let i = 0; i < count && available.length > 0; i++) {
    const index = Math.floor(Math.random() * available.length);
    selected.push(available[index]);
    available.splice(index, 1);
  }
  
  return selected;
}

/**
 * Apply modifier to agent's stats
 */
export function applyModifier(modifier: Modifier, activeModifiers: ActiveModifier[]): void {
  const existing = activeModifiers.find(m => m.modifier.id === modifier.id);
  
  if (existing && modifier.stackable) {
    // Stack it
    const maxStacks = modifier.maxStacks || 1;
    if (existing.stacks < maxStacks) {
      existing.stacks++;
      console.log(`🔮 Stacked ${modifier.name} (${existing.stacks}/${maxStacks})`);
    } else {
      console.log(`⚠️ ${modifier.name} already at max stacks`);
    }
  } else if (!existing) {
    // Add new
    activeModifiers.push({ modifier, stacks: 1 });
    console.log(`✨ Applied ${modifier.name}`);
  } else {
    console.log(`⚠️ ${modifier.name} is not stackable`);
  }
}

/**
 * Calculate total damage multiplier from active modifiers
 */
export function calculateDamageMultiplier(activeModifiers: ActiveModifier[]): number {
  let multiplier = 1.0;
  
  activeModifiers.forEach(({ modifier, stacks }) => {
    if (modifier.effect.damageMultiplier) {
      const bonus = modifier.effect.damageMultiplier - 1; // e.g., 1.2 → 0.2
      multiplier += bonus * stacks;
    }
  });
  
  return multiplier;
}

/**
 * Calculate total speed multiplier from active modifiers
 */
export function calculateSpeedMultiplier(activeModifiers: ActiveModifier[]): number {
  let multiplier = 1.0;
  
  activeModifiers.forEach(({ modifier, stacks }) => {
    if (modifier.effect.speedMultiplier) {
      const bonus = modifier.effect.speedMultiplier - 1;
      multiplier += bonus * stacks;
    }
  });
  
  return multiplier;
}

/**
 * Get total max HP bonus from active modifiers
 */
export function getMaxHpBonus(activeModifiers: ActiveModifier[]): number {
  let bonus = 0;
  
  activeModifiers.forEach(({ modifier, stacks }) => {
    if (modifier.effect.maxHpBonus) {
      bonus += modifier.effect.maxHpBonus * stacks;
    }
  });
  
  return bonus;
}
