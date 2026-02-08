/**
 * Procedural Crafting & Gear Generation
 * Create unique gear with mods and affixes
 */

import { v4 as uuidv4 } from 'uuid';
import { MATERIALS, Material } from './materials.js';

export type GearSlot = 'weapon' | 'armor' | 'accessory';
export type AffixType = 'prefix' | 'suffix';

export interface Affix {
  id: string;
  name: string;
  type: AffixType;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  bonuses: {
    [key: string]: number;
  };
  description: string;
  visualEffect?: string; // 'fire', 'ice', 'lightning', 'shadow', 'arcane'
}

export interface CraftedGear {
  id: string;
  name: string;
  slot: GearSlot;
  baseRarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  baseMaterials: { materialId: string; quantity: number }[];
  affixes: Affix[];
  totalStats: {
    attack?: number;
    defense?: number;
    speed?: number;
    accuracy?: number;
    evasion?: number;
  };
  visualEffect?: string;
  createdAt: number;
}

// Base gear templates
export const BASE_GEAR: Record<GearSlot, string[]> = {
  weapon: ['Blade', 'Sword', 'Axe', 'Spear', 'Staff', 'Bow', 'Wand'],
  armor: ['Plate', 'Mail', 'Coat', 'Robe', 'Leather', 'Chain', 'Vestments'],
  accessory: ['Ring', 'Amulet', 'Crown', 'Belt', 'Cloak', 'Bracers', 'Helm']
};

// Prefix affixes (add first)
export const PREFIXES: Affix[] = [
  {
    id: 'mighty',
    name: 'Mighty',
    type: 'prefix',
    rarity: 'common',
    bonuses: { attack: 5 },
    description: 'Increases attack power'
  },
  {
    id: 'reinforced',
    name: 'Reinforced',
    type: 'prefix',
    rarity: 'common',
    bonuses: { defense: 5 },
    description: 'Strengthens defenses'
  },
  {
    id: 'swift',
    name: 'Swift',
    type: 'prefix',
    rarity: 'uncommon',
    bonuses: { speed: 5, accuracy: 3 },
    description: 'Increases speed and accuracy'
  },
  {
    id: 'flaming',
    name: 'Flaming',
    type: 'prefix',
    rarity: 'uncommon',
    bonuses: { attack: 8 },
    description: 'Wreathed in flames',
    visualEffect: 'fire'
  },
  {
    id: 'frozen',
    name: 'Frozen',
    type: 'prefix',
    rarity: 'uncommon',
    bonuses: { defense: 8 },
    description: 'Infused with ice',
    visualEffect: 'ice'
  },
  {
    id: 'thundering',
    name: 'Thundering',
    type: 'prefix',
    rarity: 'rare',
    bonuses: { attack: 10, speed: 8 },
    description: 'Crackles with lightning',
    visualEffect: 'lightning'
  },
  {
    id: 'shadow',
    name: 'Shadow',
    type: 'prefix',
    rarity: 'rare',
    bonuses: { evasion: 10, accuracy: 5 },
    description: 'Shrouded in darkness',
    visualEffect: 'shadow'
  },
  {
    id: 'arcane',
    name: 'Arcane',
    type: 'prefix',
    rarity: 'epic',
    bonuses: { attack: 12, defense: 8, accuracy: 10 },
    description: 'Infused with pure magic',
    visualEffect: 'arcane'
  },
  {
    id: 'divine',
    name: 'Divine',
    type: 'prefix',
    rarity: 'legendary',
    bonuses: { attack: 20, defense: 15, speed: 10 },
    description: 'Blessed by the gods'
  }
];

// Suffix affixes (add second)
export const SUFFIXES: Affix[] = [
  {
    id: 'of_strength',
    name: 'of Strength',
    type: 'suffix',
    rarity: 'common',
    bonuses: { attack: 3 },
    description: 'Grants physical power'
  },
  {
    id: 'of_protection',
    name: 'of Protection',
    type: 'suffix',
    rarity: 'common',
    bonuses: { defense: 3 },
    description: 'Provides defense'
  },
  {
    id: 'of_accuracy',
    name: 'of Accuracy',
    type: 'suffix',
    rarity: 'uncommon',
    bonuses: { accuracy: 8 },
    description: 'Grants precision'
  },
  {
    id: 'of_haste',
    name: 'of Haste',
    type: 'suffix',
    rarity: 'uncommon',
    bonuses: { speed: 6 },
    description: 'Speeds up the wearer'
  },
  {
    id: 'of_evasion',
    name: 'of Evasion',
    type: 'suffix',
    rarity: 'uncommon',
    bonuses: { evasion: 8 },
    description: 'Grants dodge chance'
  },
  {
    id: 'of_the_warrior',
    name: 'of the Warrior',
    type: 'suffix',
    rarity: 'rare',
    bonuses: { attack: 10, defense: 5 },
    description: 'Empowers warriors'
  },
  {
    id: 'of_the_guardian',
    name: 'of the Guardian',
    type: 'suffix',
    rarity: 'rare',
    bonuses: { defense: 12, speed: 3 },
    description: 'Strengthens protection'
  },
  {
    id: 'of_fortune',
    name: 'of Fortune',
    type: 'suffix',
    rarity: 'epic',
    bonuses: { accuracy: 15, evasion: 5 },
    description: 'Grants luck'
  },
  {
    id: 'of_infinity',
    name: 'of Infinity',
    type: 'suffix',
    rarity: 'legendary',
    bonuses: { attack: 15, defense: 15, accuracy: 10, evasion: 10 },
    description: 'Grants unlimited power'
  }
];

/**
 * Generate a procedural unique gear piece
 */
export function generateCraftedGear(
  slot: GearSlot,
  materials: { materialId: string; quantity: number }[],
  rng: () => number
): CraftedGear {
  // Determine rarity based on materials
  const avgRarity = calculateMaterialRarity(materials);

  // Pick base name
  const baseNames = BASE_GEAR[slot];
  const baseName = baseNames[Math.floor(rng() * baseNames.length)];

  // Get affixes (more for higher rarity)
  const affixCount = avgRarity === 'legendary' ? 3 : avgRarity === 'epic' ? 2 : 1;
  const affixes: Affix[] = [];

  // Add prefix
  if (affixCount >= 1) {
    const prefix = selectAffix(PREFIXES, avgRarity, rng);
    affixes.push(prefix);
  }

  // Add suffix
  if (affixCount >= 2) {
    const suffix = selectAffix(SUFFIXES, avgRarity, rng);
    affixes.push(suffix);
  }

  // Add special affix for legendary
  if (affixCount >= 3) {
    const special = selectAffix([...PREFIXES, ...SUFFIXES], 'legendary', rng);
    affixes.push(special);
  }

  // Calculate total stats
  const totalStats: CraftedGear['totalStats'] = {};
  affixes.forEach(affix => {
    Object.entries(affix.bonuses).forEach(([key, value]) => {
      totalStats[key as keyof typeof totalStats] = (totalStats[key as keyof typeof totalStats] || 0) + value;
    });
  });

  // Add material bonuses
  materials.forEach(({ materialId }) => {
    const material = MATERIALS[materialId];
    if (material) {
      Object.entries(material.properties).forEach(([key, value]) => {
        totalStats[key as keyof typeof totalStats] = (totalStats[key as keyof typeof totalStats] || 0) + value;
      });
    }
  });

  // Determine visual effect
  const visualEffect = affixes.find(a => a.visualEffect)?.visualEffect;

  // Generate name
  const nameString = affixes.map(a => a.name).join(' ') + ` ${baseName}`;

  return {
    id: uuidv4(),
    name: nameString,
    slot,
    baseRarity: avgRarity as any,
    baseMaterials: materials,
    affixes,
    totalStats,
    visualEffect,
    createdAt: Date.now()
  };
}

/**
 * Calculate average rarity from materials
 */
function calculateMaterialRarity(materials: { materialId: string; quantity: number }[]): string {
  const rarityMap: Record<string, number> = {
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 4,
    legendary: 5
  };

  const avgScore =
    materials.reduce((sum, { materialId }) => {
      const material = MATERIALS[materialId];
      return sum + (rarityMap[material.rarity] || 1);
    }, 0) / materials.length;

  if (avgScore >= 4.5) return 'legendary';
  if (avgScore >= 3.5) return 'epic';
  if (avgScore >= 2.5) return 'rare';
  if (avgScore >= 1.5) return 'uncommon';
  return 'common';
}

/**
 * Select a random affix of appropriate rarity
 */
function selectAffix(pool: Affix[], targetRarity: string, rng: () => number): Affix {
  const rarityMap: Record<string, number> = {
    common: 1,
    uncommon: 2,
    rare: 3,
    epic: 4,
    legendary: 5
  };

  const targetScore = rarityMap[targetRarity] || 3;
  const filtered = pool.filter(a => {
    const score = rarityMap[a.rarity];
    return Math.abs(score - targetScore) <= 2;
  });

  return filtered[Math.floor(rng() * filtered.length)] || pool[0];
}

/**
 * Get crafting recipe cost (materials needed)
 */
export function getCraftingCost(slot: GearSlot, rarity: string): { materialId: string; quantity: number }[] {
  const costMap: Record<string, { materialId: string; quantity: number }[]> = {
    common_weapon: [{ materialId: 'iron_ore', quantity: 3 }],
    uncommon_weapon: [{ materialId: 'steel_ingot', quantity: 2 }, { materialId: 'fire_essence', quantity: 1 }],
    rare_weapon: [{ materialId: 'mithril_ore', quantity: 2 }, { materialId: 'lightning_essence', quantity: 1 }],
    epic_weapon: [{ materialId: 'adamantite_shard', quantity: 2 }, { materialId: 'shadow_essence', quantity: 1 }],
    legendary_weapon: [{ materialId: 'orichalcum', quantity: 1 }, { materialId: 'arcane_essence', quantity: 1 }]
  };

  return costMap[`${rarity}_${slot}`] || costMap['common_weapon']!;
}

/**
 * Format gear for display
 */
export function formatGearStats(gear: CraftedGear): string[] {
  const parts: string[] = [];
  if (gear.totalStats.attack) parts.push(`+${gear.totalStats.attack} ATK`);
  if (gear.totalStats.defense) parts.push(`+${gear.totalStats.defense} DEF`);
  if (gear.totalStats.speed) parts.push(`+${gear.totalStats.speed} SPD`);
  if (gear.totalStats.accuracy) parts.push(`+${gear.totalStats.accuracy} ACC`);
  if (gear.totalStats.evasion) parts.push(`+${gear.totalStats.evasion} EVA`);
  return parts;
}
