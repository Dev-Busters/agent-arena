/**
 * Loot Generation & Item Drops
 * Handles item drops, rarity tiers, and progression rewards
 */

import { v4 as uuidv4 } from 'uuid';
import { MATERIALS, Material } from './materials.js';

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ItemType = 'weapon' | 'armor' | 'accessory' | 'consumable';

export interface MaterialDrop {
  materialId: string;
  quantity: number;
}

export interface LootDrop {
  id: string;
  gold: number;
  xp: number;
  items: Item[];
  materials: MaterialDrop[];
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  stats: {
    attack?: number;
    defense?: number;
    speed?: number;
    accuracy?: number;
    evasion?: number;
  };
  price: number;
}

// Rarity drop rates (cumulative)
const RARITY_RATES: Record<ItemRarity, number> = {
  common: 0.55,      // 55%
  uncommon: 0.25,    // +25% = 80% total
  rare: 0.12,        // +12% = 92% total
  epic: 0.07,        // +7% = 99% total
  legendary: 0.01    // +1% = 100% total
};

const ITEM_POOLS: Record<ItemType, Item[]> = {
  weapon: [
    { id: 'iron_sword', name: 'Iron Sword', type: 'weapon', rarity: 'common', stats: { attack: 5 }, price: 100 },
    { id: 'steel_sword', name: 'Steel Sword', type: 'weapon', rarity: 'uncommon', stats: { attack: 10 }, price: 250 },
    { id: 'enchanted_blade', name: 'Enchanted Blade', type: 'weapon', rarity: 'rare', stats: { attack: 15, accuracy: 5 }, price: 500 },
    { id: 'dragons_fang', name: "Dragon's Fang", type: 'weapon', rarity: 'epic', stats: { attack: 25, evasion: 3 }, price: 1000 },
    { id: 'excalibur', name: 'Excalibur', type: 'weapon', rarity: 'legendary', stats: { attack: 40, accuracy: 10 }, price: 5000 }
  ],
  armor: [
    { id: 'leather_armor', name: 'Leather Armor', type: 'armor', rarity: 'common', stats: { defense: 5 }, price: 100 },
    { id: 'iron_mail', name: 'Iron Mail', type: 'armor', rarity: 'uncommon', stats: { defense: 10 }, price: 250 },
    { id: 'steel_plate', name: 'Steel Plate', type: 'armor', rarity: 'rare', stats: { defense: 15, speed: -2 }, price: 500 },
    { id: 'dragon_scale', name: 'Dragon Scale Armor', type: 'armor', rarity: 'epic', stats: { defense: 25, evasion: 5 }, price: 1000 },
    { id: 'divine_armor', name: 'Divine Armor', type: 'armor', rarity: 'legendary', stats: { defense: 40, accuracy: 5 }, price: 5000 }
  ],
  accessory: [
    { id: 'copper_ring', name: 'Copper Ring', type: 'accessory', rarity: 'common', stats: { attack: 2 }, price: 50 },
    { id: 'silver_ring', name: 'Silver Ring', type: 'accessory', rarity: 'uncommon', stats: { speed: 3 }, price: 150 },
    { id: 'emerald_amulet', name: 'Emerald Amulet', type: 'accessory', rarity: 'rare', stats: { accuracy: 8 }, price: 300 },
    { id: 'ruby_crown', name: 'Ruby Crown', type: 'accessory', rarity: 'epic', stats: { attack: 10, defense: 5 }, price: 600 },
    { id: 'infinity_gem', name: 'Infinity Gem', type: 'accessory', rarity: 'legendary', stats: { attack: 20, defense: 10, speed: 5, accuracy: 10 }, price: 2000 }
  ],
  consumable: [
    { id: 'health_potion', name: 'Health Potion', type: 'consumable', rarity: 'common', stats: {}, price: 50 },
    { id: 'mana_potion', name: 'Mana Potion', type: 'consumable', rarity: 'uncommon', stats: {}, price: 100 }
  ]
};

/**
 * Roll for item rarity
 */
function rollRarity(rng: () => number): ItemRarity {
  const roll = rng();
  if (roll < RARITY_RATES.common) return 'common';
  if (roll < RARITY_RATES.uncommon) return 'uncommon';
  if (roll < RARITY_RATES.rare) return 'rare';
  if (roll < RARITY_RATES.epic) return 'epic';
  return 'legendary';
}

/**
 * Generate loot drops for defeating an enemy
 */
export function generateLoot(
  gold: number,
  xp: number,
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare',
  depth: number,
  rng: () => number
): LootDrop {
  // Difficulty multipliers
  // BALANCED: Updated difficulty multipliers for smoother progression
  const difficultyMult: Record<string, number> = {
    easy: 0.7,
    normal: 1.0,
    hard: 1.15,     // Reduced from 1.3
    nightmare: 1.4  // Reduced from 1.6
  };

  // BALANCED: Exponential depth scaling (1.12x per floor) instead of linear
  // Creates more rewarding deep-dungeon gameplay
  const depthBonus = Math.pow(1.12, depth - 1);
  const mult = difficultyMult[difficulty] * depthBonus;

  // Calculate gold and XP with exponential scaling
  const finalGold = Math.round(gold * mult);
  const finalXp = Math.round(xp * mult);

  // Item drop chance increases with depth and difficulty
  const dropChance = 0.4 + (depth / 10) * 0.3 + (difficultyMult[difficulty] - 1) * 0.2;
  const items: Item[] = [];

  if (rng() < dropChance) {
    const rarity = rollRarity(rng);
    const itemPool = ITEM_POOLS[Math.random() < 0.5 ? 'weapon' : 'armor'];
    const itemsOfRarity = itemPool.filter(i => i.rarity === rarity);
    
    if (itemsOfRarity.length > 0) {
      const item = itemsOfRarity[Math.floor(rng() * itemsOfRarity.length)];
      items.push(item);
    }
  }

  // Generate material drops based on dungeon floor
  const materials: MaterialDrop[] = [];
  const materialsForFloor = Object.values(MATERIALS).filter(m => m.minFloor <= depth);
  
  // 50% chance to drop 1-2 materials
  if (rng() < 0.5 && materialsForFloor.length > 0) {
    const material = materialsForFloor[Math.floor(rng() * materialsForFloor.length)];
    const quantity = Math.floor(rng() * 3) + 1; // 1-3 quantity
    materials.push({ materialId: material.id, quantity });
  }

  return {
    id: uuidv4(),
    gold: finalGold,
    xp: finalXp,
    items,
    materials
  };
}

/**
 * Calculate XP needed for next level (exponential curve)
 */
export function xpForNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

/**
 * Calculate new level after gaining XP
 */
export function calculateLevelUp(
  currentLevel: number,
  currentXp: number,
  gainedXp: number
): { newLevel: number; newXp: number; levelsGained: number } {
  let level = currentLevel;
  let xp = currentXp + gainedXp;

  const levelsGained = currentLevel;

  while (xp >= xpForNextLevel(level)) {
    xp -= xpForNextLevel(level);
    level += 1;
  }

  return {
    newLevel: level,
    newXp: xp,
    levelsGained: level - levelsGained
  };
}

/**
 * Get rarity color for UI display
 */
export function getRarityColor(rarity: ItemRarity): string {
  const colors: Record<ItemRarity, string> = {
    common: 'text-gray-400',
    uncommon: 'text-green-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-yellow-400'
  };
  return colors[rarity];
}

/**
 * Get rarity background color for UI
 */
export function getRarityBg(rarity: ItemRarity): string {
  const colors: Record<ItemRarity, string> = {
    common: 'bg-gray-500/20 border-gray-500',
    uncommon: 'bg-green-500/20 border-green-500',
    rare: 'bg-blue-500/20 border-blue-500',
    epic: 'bg-purple-500/20 border-purple-500',
    legendary: 'bg-yellow-500/20 border-yellow-500'
  };
  return colors[rarity];
}

/**
 * Get all items by rarity
 */
export function getItemsByRarity(rarity: ItemRarity): Item[] {
  const items: Item[] = [];
  Object.values(ITEM_POOLS).forEach(pool => {
    items.push(...pool.filter(i => i.rarity === rarity));
  });
  return items;
}

/**
 * Format item stats for display
 */
export function formatItemStats(stats: Item['stats']): string[] {
  const parts: string[] = [];
  if (stats.attack) parts.push(`+${stats.attack} ATK`);
  if (stats.defense) parts.push(`+${stats.defense} DEF`);
  if (stats.speed) parts.push(`${stats.speed > 0 ? '+' : ''}${stats.speed} SPD`);
  if (stats.accuracy) parts.push(`+${stats.accuracy} ACC`);
  if (stats.evasion) parts.push(`+${stats.evasion} EVA`);
  return parts;
}
