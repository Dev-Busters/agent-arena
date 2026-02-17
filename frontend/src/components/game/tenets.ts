/**
 * Tenet System — 8 universal passive modifiers available to any school
 * Tenets affect stats AND AI behavior (targeting, aggression, timing)
 * Equip up to 4 per run
 */

export type TargetingMode = 'nearest' | 'lowest-hp' | 'random';

export interface TenetEffects {
  // Stat modifiers
  hpBonus?: number;
  hpMult?: number;            // Multiply max HP (0.5 = half HP)
  damageMult?: number;
  speedMult?: number;
  critBonus?: number;
  blastRadiusMult?: number;
  attackCooldownMult?: number;
  damageTakenMult?: number;
  // AI behavior
  targeting?: TargetingMode;
  berserker?: boolean;        // Damage scales with missing HP (up to +150%)
  executioner?: boolean;      // +50% damage vs enemies below 30% HP
}

export interface Tenet {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  effects: TenetEffects;
}

export const TENETS: Tenet[] = [
  {
    id: 'strike-the-wounded',
    name: 'Strike the Wounded',
    tagline: 'Hunt the weak',
    description: 'Agent always targets the enemy with the lowest remaining HP. Accelerates kills dramatically.',
    icon: '🎯',
    effects: { targeting: 'lowest-hp', damageMult: 1.1 },
  },
  {
    id: 'glass-cannon',
    name: 'Glass Cannon',
    tagline: 'Live fast, die fast',
    description: 'Double damage output but half the HP. Absolute destruction if you can survive.',
    icon: '💥',
    effects: { damageMult: 2.0, hpMult: 0.5 },
  },
  {
    id: 'chaos-doctrine',
    name: 'Chaos Doctrine',
    tagline: 'Unpredictable and lethal',
    description: 'Random target selection. Harder for enemies to predict. +20% damage from confusion.',
    icon: '🌀',
    effects: { targeting: 'random', damageMult: 1.2 },
  },
  {
    id: 'iron-resolve',
    name: 'Iron Resolve',
    tagline: 'Will not fall',
    description: 'Massively increased HP and damage reduction. Slower, but nearly unkillable.',
    icon: '⚓',
    effects: { hpBonus: 50, damageTakenMult: 0.6, speedMult: 0.8 },
  },
  {
    id: 'swift-execution',
    name: 'Swift Execution',
    tagline: 'Speed is power',
    description: 'Extreme movement and attack speed. Overwhelm before they can react.',
    icon: '⚡',
    effects: { speedMult: 1.4, attackCooldownMult: 0.7 },
  },
  {
    id: 'berserkers-rage',
    name: "Berserker's Rage",
    tagline: 'Pain fuels fury',
    description: 'Damage scales with missing HP — up to +150% at near-death. The lower your HP, the harder you hit.',
    icon: '🔥',
    effects: { berserker: true, damageTakenMult: 1.15 },
  },
  {
    id: 'executioner',
    name: 'Executioner',
    tagline: 'No mercy for the weak',
    description: '+50% damage against enemies below 30% HP. Combined with Strike the Wounded, nothing survives.',
    icon: '☠️',
    effects: { executioner: true, critBonus: 8 },
  },
  {
    id: 'arcane-efficiency',
    name: 'Arcane Efficiency',
    tagline: 'Cast without limit',
    description: 'All ability cooldowns drastically reduced. Maximum blast radius. Never stop firing.',
    icon: '✨',
    effects: { attackCooldownMult: 0.6, blastRadiusMult: 1.4 },
  },
];
