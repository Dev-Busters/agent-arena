/**
 * Material System for Crafting
 * Defines materials, rarities, and properties
 */

export type MaterialType = 'metal' | 'essence' | 'crystal' | 'wood' | 'leather' | 'fabric' | 'gem' | 'catalyst';
export type MaterialRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Material {
  id: string;
  name: string;
  type: MaterialType;
  rarity: MaterialRarity;
  description: string;
  dropRate: number; // 0-1 probability
  minFloor: number; // Minimum dungeon floor
  properties: {
    [key: string]: number;
  };
}

export const MATERIALS: Record<string, Material> = {
  // === METALS ===
  iron_ore: {
    id: 'iron_ore',
    name: 'Iron Ore',
    type: 'metal',
    rarity: 'common',
    description: 'Basic ore for weapon crafting',
    dropRate: 0.3,
    minFloor: 1,
    properties: { attack: 2, defense: 1 }
  },
  steel_ingot: {
    id: 'steel_ingot',
    name: 'Steel Ingot',
    type: 'metal',
    rarity: 'uncommon',
    description: 'Superior metal for quality gear',
    dropRate: 0.15,
    minFloor: 3,
    properties: { attack: 5, defense: 3 }
  },
  mithril_ore: {
    id: 'mithril_ore',
    name: 'Mithril Ore',
    type: 'metal',
    rarity: 'rare',
    description: 'Legendary metal with ethereal properties',
    dropRate: 0.08,
    minFloor: 6,
    properties: { attack: 10, defense: 8, speed: 2 }
  },
  adamantite_shard: {
    id: 'adamantite_shard',
    name: 'Adamantite Shard',
    type: 'metal',
    rarity: 'epic',
    description: 'Unbreakable metal from the deep earth',
    dropRate: 0.04,
    minFloor: 8,
    properties: { attack: 15, defense: 15, accuracy: 5 }
  },
  orichalcum: {
    id: 'orichalcum',
    name: 'Orichalcum',
    type: 'metal',
    rarity: 'legendary',
    description: 'Divine metal that channels cosmic energy',
    dropRate: 0.01,
    minFloor: 10,
    properties: { attack: 25, defense: 20, speed: 5, accuracy: 10 }
  },

  // === ESSENCES (Magic) ===
  fire_essence: {
    id: 'fire_essence',
    name: 'Fire Essence',
    type: 'essence',
    rarity: 'uncommon',
    description: 'Captured flame for enchantments',
    dropRate: 0.1,
    minFloor: 2,
    properties: { attack: 3 }
  },
  ice_essence: {
    id: 'ice_essence',
    name: 'Ice Essence',
    type: 'essence',
    rarity: 'uncommon',
    description: 'Frozen magic for defensive enchantments',
    dropRate: 0.1,
    minFloor: 2,
    properties: { defense: 3 }
  },
  lightning_essence: {
    id: 'lightning_essence',
    name: 'Lightning Essence',
    type: 'essence',
    rarity: 'rare',
    description: 'Crackling energy for speed enchantments',
    dropRate: 0.08,
    minFloor: 5,
    properties: { speed: 5, attack: 5 }
  },
  shadow_essence: {
    id: 'shadow_essence',
    name: 'Shadow Essence',
    type: 'essence',
    rarity: 'epic',
    description: 'Darkness embodied, grants evasion',
    dropRate: 0.05,
    minFloor: 7,
    properties: { evasion: 10, accuracy: 3 }
  },
  arcane_essence: {
    id: 'arcane_essence',
    name: 'Arcane Essence',
    type: 'essence',
    rarity: 'legendary',
    description: 'Pure magic that transcends elements',
    dropRate: 0.02,
    minFloor: 9,
    properties: { attack: 10, defense: 10, accuracy: 10 }
  },

  // === CRYSTALS ===
  quartz_crystal: {
    id: 'quartz_crystal',
    name: 'Quartz Crystal',
    type: 'crystal',
    rarity: 'common',
    description: 'Basic crystal for reinforcement',
    dropRate: 0.25,
    minFloor: 1,
    properties: { defense: 2 }
  },
  amethyst_crystal: {
    id: 'amethyst_crystal',
    name: 'Amethyst Crystal',
    type: 'crystal',
    rarity: 'uncommon',
    description: 'Purple crystal enhancing magical power',
    dropRate: 0.12,
    minFloor: 4,
    properties: { attack: 4, accuracy: 2 }
  },
  sapphire_gem: {
    id: 'sapphire_gem',
    name: 'Sapphire Gem',
    type: 'crystal',
    rarity: 'rare',
    description: 'Blue gem granting water resistance',
    dropRate: 0.06,
    minFloor: 5,
    properties: { defense: 8, speed: 2 }
  },
  emerald_gem: {
    id: 'emerald_gem',
    name: 'Emerald Gem',
    type: 'crystal',
    rarity: 'epic',
    description: 'Green gem of vitality and growth',
    dropRate: 0.03,
    minFloor: 7,
    properties: { defense: 12, accuracy: 5 }
  },
  diamond_core: {
    id: 'diamond_core',
    name: 'Diamond Core',
    type: 'crystal',
    rarity: 'legendary',
    description: 'Hardest substance, ultimate defense',
    dropRate: 0.01,
    minFloor: 10,
    properties: { defense: 25, attack: 10 }
  },

  // === SPECIAL ===
  dragon_scale: {
    id: 'dragon_scale',
    name: 'Dragon Scale',
    type: 'gem',
    rarity: 'epic',
    description: 'Shed scale from an ancient dragon',
    dropRate: 0.02,
    minFloor: 9,
    properties: { defense: 15, attack: 10 }
  },
  void_shard: {
    id: 'void_shard',
    name: 'Void Shard',
    type: 'catalyst',
    rarity: 'legendary',
    description: 'Fragment of the void itself',
    dropRate: 0.005,
    minFloor: 10,
    properties: { attack: 20, evasion: 15 }
  }
};

/**
 * Get materials available at a specific dungeon floor
 */
export function getMaterialsForFloor(floor: number): Material[] {
  return Object.values(MATERIALS).filter(m => m.minFloor <= floor);
}

/**
 * Get drop chance for a material at a specific floor
 */
export function getMaterialDropChance(materialId: string, floor: number): number {
  const material = MATERIALS[materialId];
  if (!material || material.minFloor > floor) return 0;

  // Drop chance increases with depth
  const floorBonus = 1 + (floor - material.minFloor) * 0.05;
  return Math.min(0.8, material.dropRate * floorBonus);
}

/**
 * Get material color for UI
 */
export function getMaterialColor(rarity: MaterialRarity): string {
  const colors: Record<MaterialRarity, string> = {
    common: 'text-gray-400',
    uncommon: 'text-green-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-yellow-400'
  };
  return colors[rarity];
}
