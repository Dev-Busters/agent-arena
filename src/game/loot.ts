/**
 * Comprehensive Loot Table System
 * Diablo/PoE-inspired with rarity tiers, affix generation, loot tables,
 * set items, uniques, and zone-specific drops.
 */

import { v4 as uuidv4 } from 'uuid';
import { MATERIALS, Material } from './materials.js';

// ============================================================
// Types & Enums
// ============================================================

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
export type ItemType = 'weapon' | 'armor' | 'accessory' | 'consumable';
export type AffixSlot = 'prefix' | 'suffix';
export type DamageType = 'physical' | 'fire' | 'ice' | 'lightning' | 'shadow' | 'arcane' | 'holy';

export interface ItemStats {
  attack?: number;
  defense?: number;
  speed?: number;
  accuracy?: number;
  evasion?: number;
  hp?: number;
  critChance?: number;   // percentage 0-100
  critDamage?: number;    // percentage bonus e.g. 150 = 1.5x
  lifeSteal?: number;     // percentage
  thorns?: number;        // flat reflect damage
  magicFind?: number;     // percentage bonus to rarity rolls
}

export interface ItemAffix {
  id: string;
  name: string;
  slot: AffixSlot;
  tier: number;               // 1-5 (higher = stronger)
  rarity: ItemRarity;
  bonuses: Partial<ItemStats>;
  damageType?: DamageType;
  visualEffect?: string;
  description: string;
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  itemLevel: number;          // determines affix tier caps
  stats: ItemStats;
  affixes: ItemAffix[];
  setId?: string;             // belongs to a named set
  isUnique?: boolean;         // unique (named) item
  damageType?: DamageType;
  visualEffect?: string;
  flavorText?: string;
  price: number;
  requiredLevel: number;
  soulbound?: boolean;
}

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

export interface LootTableEntry {
  weight: number;             // relative drop weight
  itemPool?: string;          // reference to a base item pool key
  fixedItemId?: string;       // for guaranteed unique/set drops
  rarityOverride?: ItemRarity;
  minAffixes?: number;
  maxAffixes?: number;
  guaranteedAffix?: string;   // affix id to always include
}

export interface LootTable {
  id: string;
  name: string;
  entries: LootTableEntry[];
  guaranteedDrops?: number;   // minimum items to drop
  bonusDropChance?: number;   // chance for extra roll (0-1)
  goldRange: [number, number];
  xpRange: [number, number];
}

export interface LootContext {
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare';
  depth: number;
  playerLevel: number;
  magicFind: number;          // percentage bonus (0 = none, 100 = double)
  rarityBoost: number;        // zone multiplier (1.0 = normal)
  zoneType?: string;
  isBoss?: boolean;
}

// ============================================================
// Rarity System
// ============================================================

const RARITY_ORDER: ItemRarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

const RARITY_WEIGHTS: Record<ItemRarity, number> = {
  common:    5500,
  uncommon:  2500,
  rare:      1200,
  epic:       550,
  legendary:  200,
  mythic:      50,
};

/** Maximum affixes per rarity */
const MAX_AFFIXES: Record<ItemRarity, number> = {
  common:    0,
  uncommon:  1,
  rare:      2,
  epic:      3,
  legendary: 4,
  mythic:    6,
};

/** Stat multiplier per rarity tier */
const RARITY_STAT_MULT: Record<ItemRarity, number> = {
  common:    1.0,
  uncommon:  1.2,
  rare:      1.5,
  epic:      1.9,
  legendary: 2.5,
  mythic:    3.5,
};

/** Gold value multiplier per rarity */
const RARITY_VALUE_MULT: Record<ItemRarity, number> = {
  common:    1,
  uncommon:  2,
  rare:      5,
  epic:      12,
  legendary: 30,
  mythic:    100,
};

export function getRarityIndex(r: ItemRarity): number {
  return RARITY_ORDER.indexOf(r);
}

// ============================================================
// Affix Pools
// ============================================================

const PREFIX_POOL: ItemAffix[] = [
  // Tier 1 – Common
  { id: 'sturdy', name: 'Sturdy', slot: 'prefix', tier: 1, rarity: 'common', bonuses: { defense: 3 }, description: 'Slightly reinforced' },
  { id: 'keen', name: 'Keen', slot: 'prefix', tier: 1, rarity: 'common', bonuses: { attack: 3 }, description: 'Sharpened edge' },
  { id: 'quick', name: 'Quick', slot: 'prefix', tier: 1, rarity: 'common', bonuses: { speed: 2 }, description: 'Light and agile' },
  { id: 'tough', name: 'Tough', slot: 'prefix', tier: 1, rarity: 'common', bonuses: { hp: 15 }, description: 'Durable construction' },

  // Tier 2 – Uncommon
  { id: 'mighty', name: 'Mighty', slot: 'prefix', tier: 2, rarity: 'uncommon', bonuses: { attack: 6, critChance: 2 }, description: 'Empowered with force' },
  { id: 'reinforced', name: 'Reinforced', slot: 'prefix', tier: 2, rarity: 'uncommon', bonuses: { defense: 6, hp: 10 }, description: 'Extra protective layers' },
  { id: 'swift', name: 'Swift', slot: 'prefix', tier: 2, rarity: 'uncommon', bonuses: { speed: 5, accuracy: 3 }, description: 'Fast and precise' },
  { id: 'flaming', name: 'Flaming', slot: 'prefix', tier: 2, rarity: 'uncommon', bonuses: { attack: 8 }, damageType: 'fire', visualEffect: 'fire', description: 'Wreathed in flames' },
  { id: 'frozen', name: 'Frozen', slot: 'prefix', tier: 2, rarity: 'uncommon', bonuses: { defense: 8, speed: -1 }, damageType: 'ice', visualEffect: 'ice', description: 'Coated in frost' },

  // Tier 3 – Rare
  { id: 'thundering', name: 'Thundering', slot: 'prefix', tier: 3, rarity: 'rare', bonuses: { attack: 10, speed: 8, critChance: 5 }, damageType: 'lightning', visualEffect: 'lightning', description: 'Crackles with lightning' },
  { id: 'shadow', name: 'Shadow', slot: 'prefix', tier: 3, rarity: 'rare', bonuses: { evasion: 10, accuracy: 5, critDamage: 15 }, damageType: 'shadow', visualEffect: 'shadow', description: 'Shrouded in darkness' },
  { id: 'vampiric', name: 'Vampiric', slot: 'prefix', tier: 3, rarity: 'rare', bonuses: { attack: 7, lifeSteal: 5 }, description: 'Drains life force' },
  { id: 'thorned', name: 'Thorned', slot: 'prefix', tier: 3, rarity: 'rare', bonuses: { defense: 5, thorns: 8 }, description: 'Reflects damage to attackers' },

  // Tier 4 – Epic
  { id: 'arcane', name: 'Arcane', slot: 'prefix', tier: 4, rarity: 'epic', bonuses: { attack: 12, defense: 8, accuracy: 10, critChance: 8 }, damageType: 'arcane', visualEffect: 'arcane', description: 'Infused with pure magic' },
  { id: 'draconic', name: 'Draconic', slot: 'prefix', tier: 4, rarity: 'epic', bonuses: { attack: 15, defense: 10, hp: 25 }, damageType: 'fire', visualEffect: 'fire', description: 'Forged in dragonfire' },
  { id: 'abyssal', name: 'Abyssal', slot: 'prefix', tier: 4, rarity: 'epic', bonuses: { attack: 14, evasion: 8, lifeSteal: 8 }, damageType: 'shadow', visualEffect: 'shadow', description: 'From the depths of the abyss' },

  // Tier 5 – Legendary / Mythic
  { id: 'divine', name: 'Divine', slot: 'prefix', tier: 5, rarity: 'legendary', bonuses: { attack: 20, defense: 15, speed: 10, hp: 40 }, damageType: 'holy', visualEffect: 'holy', description: 'Blessed by the gods' },
  { id: 'primordial', name: 'Primordial', slot: 'prefix', tier: 5, rarity: 'legendary', bonuses: { attack: 25, critChance: 12, critDamage: 30, lifeSteal: 5 }, description: 'Power from creation itself' },
  { id: 'cosmic', name: 'Cosmic', slot: 'prefix', tier: 5, rarity: 'mythic', bonuses: { attack: 30, defense: 20, speed: 15, accuracy: 15, critChance: 15, critDamage: 40 }, visualEffect: 'cosmic', description: 'Channeling stellar energy' },
];

const SUFFIX_POOL: ItemAffix[] = [
  // Tier 1 – Common
  { id: 'of_strength', name: 'of Strength', slot: 'suffix', tier: 1, rarity: 'common', bonuses: { attack: 3 }, description: 'Grants physical power' },
  { id: 'of_iron', name: 'of Iron', slot: 'suffix', tier: 1, rarity: 'common', bonuses: { defense: 3 }, description: 'Hard as iron' },
  { id: 'of_the_wind', name: 'of the Wind', slot: 'suffix', tier: 1, rarity: 'common', bonuses: { speed: 2 }, description: 'Light as the breeze' },

  // Tier 2 – Uncommon
  { id: 'of_precision', name: 'of Precision', slot: 'suffix', tier: 2, rarity: 'uncommon', bonuses: { accuracy: 8, critChance: 3 }, description: 'Deadly precision' },
  { id: 'of_haste', name: 'of Haste', slot: 'suffix', tier: 2, rarity: 'uncommon', bonuses: { speed: 6, evasion: 3 }, description: 'Enhances agility' },
  { id: 'of_vitality', name: 'of Vitality', slot: 'suffix', tier: 2, rarity: 'uncommon', bonuses: { hp: 25, defense: 2 }, description: 'Grants life force' },
  { id: 'of_evasion', name: 'of Evasion', slot: 'suffix', tier: 2, rarity: 'uncommon', bonuses: { evasion: 8 }, description: 'Grants dodge chance' },

  // Tier 3 – Rare
  { id: 'of_the_warrior', name: 'of the Warrior', slot: 'suffix', tier: 3, rarity: 'rare', bonuses: { attack: 10, defense: 5, critDamage: 10 }, description: 'Empowers warriors' },
  { id: 'of_the_guardian', name: 'of the Guardian', slot: 'suffix', tier: 3, rarity: 'rare', bonuses: { defense: 12, hp: 20, thorns: 5 }, description: 'Steadfast protection' },
  { id: 'of_the_hunter', name: 'of the Hunter', slot: 'suffix', tier: 3, rarity: 'rare', bonuses: { accuracy: 10, critChance: 8, speed: 3 }, description: 'Predator instincts' },
  { id: 'of_fortune', name: 'of Fortune', slot: 'suffix', tier: 3, rarity: 'rare', bonuses: { magicFind: 15, evasion: 5 }, description: 'Luck favors the bold' },

  // Tier 4 – Epic
  { id: 'of_the_titan', name: 'of the Titan', slot: 'suffix', tier: 4, rarity: 'epic', bonuses: { attack: 15, defense: 10, hp: 30, critDamage: 20 }, description: 'Titan-forged' },
  { id: 'of_the_phantom', name: 'of the Phantom', slot: 'suffix', tier: 4, rarity: 'epic', bonuses: { evasion: 15, speed: 8, critChance: 10, lifeSteal: 3 }, description: 'Ghostly agility' },
  { id: 'of_the_archmage', name: 'of the Archmage', slot: 'suffix', tier: 4, rarity: 'epic', bonuses: { accuracy: 15, magicFind: 20, critChance: 8 }, description: 'Supreme magical knowledge' },

  // Tier 5 – Legendary / Mythic
  { id: 'of_infinity', name: 'of Infinity', slot: 'suffix', tier: 5, rarity: 'legendary', bonuses: { attack: 15, defense: 15, accuracy: 10, evasion: 10, critChance: 10, critDamage: 25 }, description: 'Limitless power' },
  { id: 'of_the_gods', name: 'of the Gods', slot: 'suffix', tier: 5, rarity: 'legendary', bonuses: { attack: 20, defense: 20, hp: 50, magicFind: 25 }, description: 'Divinely empowered' },
  { id: 'of_oblivion', name: 'of Oblivion', slot: 'suffix', tier: 5, rarity: 'mythic', bonuses: { attack: 25, critChance: 15, critDamage: 50, lifeSteal: 10, magicFind: 30 }, description: 'Annihilating force' },
];

// ============================================================
// Base Item Templates
// ============================================================

interface BaseItemTemplate {
  id: string;
  name: string;
  type: ItemType;
  baseStats: ItemStats;
  basePrice: number;
  requiredLevel: number;
  flavorText?: string;
}

const BASE_WEAPONS: BaseItemTemplate[] = [
  { id: 'iron_sword', name: 'Iron Sword', type: 'weapon', baseStats: { attack: 5 }, basePrice: 80, requiredLevel: 1 },
  { id: 'steel_blade', name: 'Steel Blade', type: 'weapon', baseStats: { attack: 8, accuracy: 2 }, basePrice: 150, requiredLevel: 3 },
  { id: 'war_axe', name: 'War Axe', type: 'weapon', baseStats: { attack: 12, critDamage: 10 }, basePrice: 250, requiredLevel: 5 },
  { id: 'battle_staff', name: 'Battle Staff', type: 'weapon', baseStats: { attack: 7, accuracy: 5, speed: 3 }, basePrice: 200, requiredLevel: 4 },
  { id: 'longbow', name: 'Longbow', type: 'weapon', baseStats: { attack: 9, accuracy: 8 }, basePrice: 220, requiredLevel: 4 },
  { id: 'curved_dagger', name: 'Curved Dagger', type: 'weapon', baseStats: { attack: 6, speed: 5, critChance: 5 }, basePrice: 180, requiredLevel: 3 },
  { id: 'great_hammer', name: 'Great Hammer', type: 'weapon', baseStats: { attack: 15, speed: -3, critDamage: 15 }, basePrice: 300, requiredLevel: 6 },
  { id: 'runic_wand', name: 'Runic Wand', type: 'weapon', baseStats: { attack: 10, accuracy: 10, critChance: 3 }, basePrice: 350, requiredLevel: 7 },
  { id: 'obsidian_blade', name: 'Obsidian Blade', type: 'weapon', baseStats: { attack: 18, critChance: 5, critDamage: 20 }, basePrice: 500, requiredLevel: 9 },
  { id: 'void_scythe', name: 'Void Scythe', type: 'weapon', baseStats: { attack: 22, lifeSteal: 3, critDamage: 25 }, basePrice: 700, requiredLevel: 10 },
];

const BASE_ARMORS: BaseItemTemplate[] = [
  { id: 'leather_vest', name: 'Leather Vest', type: 'armor', baseStats: { defense: 4, speed: 1 }, basePrice: 60, requiredLevel: 1 },
  { id: 'iron_mail', name: 'Iron Mail', type: 'armor', baseStats: { defense: 8 }, basePrice: 140, requiredLevel: 3 },
  { id: 'steel_plate', name: 'Steel Plate', type: 'armor', baseStats: { defense: 12, speed: -2 }, basePrice: 250, requiredLevel: 5 },
  { id: 'chain_hauberk', name: 'Chain Hauberk', type: 'armor', baseStats: { defense: 10, evasion: 3 }, basePrice: 200, requiredLevel: 4 },
  { id: 'mage_robe', name: 'Mage Robe', type: 'armor', baseStats: { defense: 5, speed: 3, accuracy: 3 }, basePrice: 180, requiredLevel: 4 },
  { id: 'scale_armor', name: 'Scale Armor', type: 'armor', baseStats: { defense: 15, hp: 15 }, basePrice: 350, requiredLevel: 6 },
  { id: 'enchanted_plate', name: 'Enchanted Plate', type: 'armor', baseStats: { defense: 18, hp: 20, thorns: 3 }, basePrice: 500, requiredLevel: 8 },
  { id: 'shadow_cloak', name: 'Shadow Cloak', type: 'armor', baseStats: { defense: 8, evasion: 12, speed: 5 }, basePrice: 450, requiredLevel: 7 },
  { id: 'dragonscale_mail', name: 'Dragonscale Mail', type: 'armor', baseStats: { defense: 22, hp: 30 }, basePrice: 650, requiredLevel: 9 },
  { id: 'void_vestments', name: 'Void Vestments', type: 'armor', baseStats: { defense: 20, evasion: 10, lifeSteal: 2 }, basePrice: 700, requiredLevel: 10 },
];

const BASE_ACCESSORIES: BaseItemTemplate[] = [
  { id: 'copper_ring', name: 'Copper Ring', type: 'accessory', baseStats: { attack: 2 }, basePrice: 40, requiredLevel: 1 },
  { id: 'silver_ring', name: 'Silver Ring', type: 'accessory', baseStats: { speed: 3 }, basePrice: 80, requiredLevel: 2 },
  { id: 'jade_amulet', name: 'Jade Amulet', type: 'accessory', baseStats: { accuracy: 5, evasion: 3 }, basePrice: 150, requiredLevel: 3 },
  { id: 'gold_bracers', name: 'Gold Bracers', type: 'accessory', baseStats: { defense: 4, attack: 3 }, basePrice: 200, requiredLevel: 4 },
  { id: 'ruby_pendant', name: 'Ruby Pendant', type: 'accessory', baseStats: { attack: 6, critChance: 3 }, basePrice: 280, requiredLevel: 5 },
  { id: 'sapphire_crown', name: 'Sapphire Crown', type: 'accessory', baseStats: { defense: 6, hp: 20 }, basePrice: 320, requiredLevel: 6 },
  { id: 'emerald_cloak', name: 'Emerald Cloak', type: 'accessory', baseStats: { evasion: 8, magicFind: 10 }, basePrice: 400, requiredLevel: 7 },
  { id: 'obsidian_belt', name: 'Obsidian Belt', type: 'accessory', baseStats: { defense: 5, hp: 15, thorns: 5 }, basePrice: 350, requiredLevel: 6 },
  { id: 'phoenix_feather', name: 'Phoenix Feather', type: 'accessory', baseStats: { speed: 8, critChance: 5, lifeSteal: 2 }, basePrice: 500, requiredLevel: 8 },
  { id: 'void_gem', name: 'Void Gem', type: 'accessory', baseStats: { attack: 10, accuracy: 8, critDamage: 15 }, basePrice: 600, requiredLevel: 9 },
];

const BASE_CONSUMABLES: BaseItemTemplate[] = [
  { id: 'health_potion', name: 'Health Potion', type: 'consumable', baseStats: { hp: 50 }, basePrice: 30, requiredLevel: 1 },
  { id: 'greater_health_potion', name: 'Greater Health Potion', type: 'consumable', baseStats: { hp: 120 }, basePrice: 80, requiredLevel: 5 },
  { id: 'elixir_of_power', name: 'Elixir of Power', type: 'consumable', baseStats: { attack: 10 }, basePrice: 100, requiredLevel: 3, flavorText: 'Temporarily boosts attack' },
  { id: 'elixir_of_iron', name: 'Elixir of Iron', type: 'consumable', baseStats: { defense: 10 }, basePrice: 100, requiredLevel: 3, flavorText: 'Temporarily boosts defense' },
  { id: 'elixir_of_haste', name: 'Elixir of Haste', type: 'consumable', baseStats: { speed: 10 }, basePrice: 100, requiredLevel: 3, flavorText: 'Temporarily boosts speed' },
  { id: 'scroll_of_fortune', name: 'Scroll of Fortune', type: 'consumable', baseStats: { magicFind: 50 }, basePrice: 200, requiredLevel: 5, flavorText: 'Increases loot quality for one encounter' },
];

const BASE_ITEM_POOLS: Record<ItemType, BaseItemTemplate[]> = {
  weapon: BASE_WEAPONS,
  armor: BASE_ARMORS,
  accessory: BASE_ACCESSORIES,
  consumable: BASE_CONSUMABLES,
};

// ============================================================
// Unique Items (Named legendaries with fixed properties)
// ============================================================

export interface UniqueItemDef {
  id: string;
  name: string;
  type: ItemType;
  fixedStats: ItemStats;
  fixedAffixes: string[];  // affix ids to always attach
  damageType?: DamageType;
  visualEffect?: string;
  flavorText: string;
  price: number;
  requiredLevel: number;
  dropWeight: number;      // relative weight in unique pool
  minFloor: number;        // min dungeon floor to drop
}

export const UNIQUE_ITEMS: UniqueItemDef[] = [
  {
    id: 'excalibur',
    name: 'Excalibur',
    type: 'weapon',
    fixedStats: { attack: 40, accuracy: 15, critChance: 10, critDamage: 30, hp: 25 },
    fixedAffixes: ['divine'],
    damageType: 'holy',
    visualEffect: 'holy',
    flavorText: 'The blade that chose its wielder, forged in the light of a dying star.',
    price: 10000,
    requiredLevel: 10,
    dropWeight: 5,
    minFloor: 8,
  },
  {
    id: 'frostmourne',
    name: 'Frostmourne',
    type: 'weapon',
    fixedStats: { attack: 35, lifeSteal: 10, critChance: 8, speed: -2 },
    fixedAffixes: ['frozen'],
    damageType: 'ice',
    visualEffect: 'ice',
    flavorText: 'Whomever wields this blade shall command the dead.',
    price: 9000,
    requiredLevel: 9,
    dropWeight: 5,
    minFloor: 7,
  },
  {
    id: 'thunderfury',
    name: 'Thunderfury, Blessed Blade of the Windseeker',
    type: 'weapon',
    fixedStats: { attack: 30, speed: 12, accuracy: 10, critChance: 12 },
    fixedAffixes: ['thundering'],
    damageType: 'lightning',
    visualEffect: 'lightning',
    flavorText: 'Did someone say [Thunderfury]?',
    price: 9500,
    requiredLevel: 9,
    dropWeight: 4,
    minFloor: 8,
  },
  {
    id: 'aegis_of_the_immortal',
    name: 'Aegis of the Immortal',
    type: 'armor',
    fixedStats: { defense: 45, hp: 60, thorns: 10, lifeSteal: 3 },
    fixedAffixes: ['divine'],
    damageType: 'holy',
    visualEffect: 'holy',
    flavorText: 'An impenetrable shield said to have turned aside the wrath of gods.',
    price: 12000,
    requiredLevel: 10,
    dropWeight: 4,
    minFloor: 9,
  },
  {
    id: 'shadow_mantle',
    name: 'Shadow Mantle',
    type: 'armor',
    fixedStats: { defense: 20, evasion: 25, speed: 10, critChance: 8 },
    fixedAffixes: ['shadow'],
    damageType: 'shadow',
    visualEffect: 'shadow',
    flavorText: 'Woven from the fabric of midnight itself.',
    price: 8000,
    requiredLevel: 8,
    dropWeight: 6,
    minFloor: 6,
  },
  {
    id: 'eye_of_eternity',
    name: 'Eye of Eternity',
    type: 'accessory',
    fixedStats: { attack: 15, defense: 10, accuracy: 15, magicFind: 40, critChance: 8 },
    fixedAffixes: ['arcane'],
    damageType: 'arcane',
    visualEffect: 'arcane',
    flavorText: 'Gazing into its depths reveals every timeline at once.',
    price: 15000,
    requiredLevel: 10,
    dropWeight: 3,
    minFloor: 9,
  },
  {
    id: 'ring_of_the_leech_king',
    name: 'Ring of the Leech King',
    type: 'accessory',
    fixedStats: { attack: 12, lifeSteal: 15, critChance: 5, hp: 30 },
    fixedAffixes: ['vampiric'],
    damageType: 'shadow',
    visualEffect: 'shadow',
    flavorText: 'Its previous owner never truly died.',
    price: 7000,
    requiredLevel: 7,
    dropWeight: 6,
    minFloor: 5,
  },
];

// ============================================================
// Set Items
// ============================================================

export interface SetBonus {
  piecesRequired: number;
  bonuses: Partial<ItemStats>;
  description: string;
}

export interface ItemSet {
  id: string;
  name: string;
  pieces: string[];         // unique item ids or base template ids
  setBonuses: SetBonus[];
}

export const ITEM_SETS: ItemSet[] = [
  {
    id: 'dragonslayer',
    name: "Dragonslayer's Regalia",
    pieces: ['dragonslayer_blade', 'dragonslayer_plate', 'dragonslayer_helm'],
    setBonuses: [
      { piecesRequired: 2, bonuses: { attack: 10, defense: 10 }, description: '+10 ATK, +10 DEF' },
      { piecesRequired: 3, bonuses: { critChance: 15, critDamage: 30, hp: 40 }, description: '+15% Crit, +30% Crit DMG, +40 HP' },
    ],
  },
  {
    id: 'shadow_assassin',
    name: "Shadow Assassin's Garb",
    pieces: ['shadow_fang', 'shadow_mantle', 'shadow_band'],
    setBonuses: [
      { piecesRequired: 2, bonuses: { evasion: 15, speed: 8 }, description: '+15 EVA, +8 SPD' },
      { piecesRequired: 3, bonuses: { critChance: 20, lifeSteal: 8, magicFind: 15 }, description: '+20% Crit, +8% Lifesteal, +15% MF' },
    ],
  },
  {
    id: 'arcane_scholar',
    name: "Arcane Scholar's Vestments",
    pieces: ['arcane_staff', 'arcane_robe', 'eye_of_eternity'],
    setBonuses: [
      { piecesRequired: 2, bonuses: { accuracy: 15, magicFind: 20 }, description: '+15 ACC, +20% MF' },
      { piecesRequired: 3, bonuses: { attack: 20, critDamage: 40, hp: 30 }, description: '+20 ATK, +40% Crit DMG, +30 HP' },
    ],
  },
];

// Set piece base definitions (generate as legendaries with set tag)
const SET_PIECE_DEFS: UniqueItemDef[] = [
  // Dragonslayer set
  { id: 'dragonslayer_blade', name: "Dragonslayer's Blade", type: 'weapon', fixedStats: { attack: 28, critChance: 8, critDamage: 20 }, fixedAffixes: ['draconic'], damageType: 'fire', visualEffect: 'fire', flavorText: 'Bathed in the blood of a hundred dragons.', price: 6000, requiredLevel: 8, dropWeight: 8, minFloor: 7 },
  { id: 'dragonslayer_plate', name: "Dragonslayer's Plate", type: 'armor', fixedStats: { defense: 30, hp: 40, thorns: 5 }, fixedAffixes: ['draconic'], damageType: 'fire', visualEffect: 'fire', flavorText: 'Forged from dragon bones and tempered in flame.', price: 6000, requiredLevel: 8, dropWeight: 8, minFloor: 7 },
  { id: 'dragonslayer_helm', name: "Dragonslayer's Helm", type: 'accessory', fixedStats: { defense: 12, attack: 8, hp: 25, critDamage: 15 }, fixedAffixes: ['draconic'], damageType: 'fire', visualEffect: 'fire', flavorText: 'The visage of the beast, claimed as a trophy.', price: 5000, requiredLevel: 8, dropWeight: 8, minFloor: 7 },

  // Shadow Assassin set
  { id: 'shadow_fang', name: 'Shadow Fang', type: 'weapon', fixedStats: { attack: 20, speed: 10, critChance: 12, lifeSteal: 3 }, fixedAffixes: ['shadow'], damageType: 'shadow', visualEffect: 'shadow', flavorText: 'It strikes before you see it.', price: 5500, requiredLevel: 7, dropWeight: 8, minFloor: 6 },
  { id: 'shadow_band', name: 'Shadow Band', type: 'accessory', fixedStats: { evasion: 12, speed: 6, critChance: 8, magicFind: 10 }, fixedAffixes: ['shadow'], damageType: 'shadow', visualEffect: 'shadow', flavorText: 'Slip between the cracks of reality.', price: 4500, requiredLevel: 7, dropWeight: 8, minFloor: 6 },

  // Arcane Scholar set
  { id: 'arcane_staff', name: 'Staff of the Archmage', type: 'weapon', fixedStats: { attack: 22, accuracy: 15, critChance: 6, magicFind: 15 }, fixedAffixes: ['arcane'], damageType: 'arcane', visualEffect: 'arcane', flavorText: 'Knowledge is the ultimate weapon.', price: 5500, requiredLevel: 8, dropWeight: 8, minFloor: 7 },
  { id: 'arcane_robe', name: 'Robe of the Archmage', type: 'armor', fixedStats: { defense: 15, accuracy: 12, hp: 25, magicFind: 20 }, fixedAffixes: ['arcane'], damageType: 'arcane', visualEffect: 'arcane', flavorText: 'Woven with threads of pure mana.', price: 5500, requiredLevel: 8, dropWeight: 8, minFloor: 7 },
];

// Merge set pieces into unique pool for drop resolution
const ALL_UNIQUES: UniqueItemDef[] = [...UNIQUE_ITEMS, ...SET_PIECE_DEFS];

// ============================================================
// Enemy-Specific Loot Tables
// ============================================================

export const ENEMY_LOOT_TABLES: Record<string, LootTable> = {
  goblin: {
    id: 'goblin',
    name: 'Goblin Loot',
    entries: [
      { weight: 60, itemPool: 'weapon', maxAffixes: 1 },
      { weight: 30, itemPool: 'consumable', maxAffixes: 0 },
      { weight: 10, itemPool: 'accessory', maxAffixes: 1 },
    ],
    goldRange: [30, 80],
    xpRange: [60, 120],
    bonusDropChance: 0.1,
  },
  skeleton: {
    id: 'skeleton',
    name: 'Skeleton Loot',
    entries: [
      { weight: 50, itemPool: 'weapon', maxAffixes: 1 },
      { weight: 40, itemPool: 'armor', maxAffixes: 1 },
      { weight: 10, itemPool: 'accessory', maxAffixes: 1 },
    ],
    goldRange: [50, 100],
    xpRange: [100, 180],
    bonusDropChance: 0.15,
  },
  orc: {
    id: 'orc',
    name: 'Orc Loot',
    entries: [
      { weight: 45, itemPool: 'weapon', maxAffixes: 2 },
      { weight: 35, itemPool: 'armor', maxAffixes: 2 },
      { weight: 15, itemPool: 'consumable', maxAffixes: 0 },
      { weight: 5, itemPool: 'accessory', maxAffixes: 1 },
    ],
    goldRange: [80, 150],
    xpRange: [180, 300],
    bonusDropChance: 0.2,
  },
  wraith: {
    id: 'wraith',
    name: 'Wraith Loot',
    entries: [
      { weight: 30, itemPool: 'weapon', maxAffixes: 2 },
      { weight: 20, itemPool: 'armor', maxAffixes: 2 },
      { weight: 30, itemPool: 'accessory', maxAffixes: 2 },
      { weight: 20, itemPool: 'consumable', maxAffixes: 0 },
    ],
    goldRange: [100, 200],
    xpRange: [300, 500],
    bonusDropChance: 0.25,
  },
  boss_skeleton: {
    id: 'boss_skeleton',
    name: 'Skeletal Lord Loot',
    entries: [
      { weight: 35, itemPool: 'weapon', minAffixes: 1, maxAffixes: 3 },
      { weight: 35, itemPool: 'armor', minAffixes: 1, maxAffixes: 3 },
      { weight: 20, itemPool: 'accessory', minAffixes: 1, maxAffixes: 2 },
      { weight: 10, itemPool: 'consumable', maxAffixes: 0 },
    ],
    guaranteedDrops: 2,
    goldRange: [300, 600],
    xpRange: [800, 1200],
    bonusDropChance: 0.4,
  },
  boss_dragon: {
    id: 'boss_dragon',
    name: 'Ancient Dragon Loot',
    entries: [
      { weight: 30, itemPool: 'weapon', minAffixes: 2, maxAffixes: 4 },
      { weight: 30, itemPool: 'armor', minAffixes: 2, maxAffixes: 4 },
      { weight: 25, itemPool: 'accessory', minAffixes: 1, maxAffixes: 3 },
      { weight: 15, itemPool: 'consumable', maxAffixes: 0 },
    ],
    guaranteedDrops: 3,
    goldRange: [700, 1200],
    xpRange: [2000, 3000],
    bonusDropChance: 0.5,
  },
  boss_lich: {
    id: 'boss_lich',
    name: 'Lich King Loot',
    entries: [
      { weight: 25, itemPool: 'weapon', minAffixes: 2, maxAffixes: 4 },
      { weight: 25, itemPool: 'armor', minAffixes: 2, maxAffixes: 4 },
      { weight: 30, itemPool: 'accessory', minAffixes: 2, maxAffixes: 3 },
      { weight: 20, itemPool: 'consumable', maxAffixes: 0 },
    ],
    guaranteedDrops: 3,
    goldRange: [600, 1000],
    xpRange: [1600, 2400],
    bonusDropChance: 0.5,
  },
};

// Zone-specific bonus loot tables (layered on top of enemy tables)
export const ZONE_LOOT_MODIFIERS: Record<string, { rarityBoost: number; bonusMaterials: string[]; bonusDropChance: number }> = {
  boss_chamber:    { rarityBoost: 1.5,  bonusMaterials: ['adamantite_shard', 'dragon_scale'],  bonusDropChance: 0.3 },
  treasure_vault:  { rarityBoost: 2.0,  bonusMaterials: ['diamond_core', 'arcane_essence'],    bonusDropChance: 0.5 },
  cursed_hall:     { rarityBoost: 1.4,  bonusMaterials: ['shadow_essence', 'void_shard'],      bonusDropChance: 0.2 },
  dragon_lair:     { rarityBoost: 1.8,  bonusMaterials: ['dragon_scale', 'orichalcum'],        bonusDropChance: 0.4 },
  arcane_sanctum:  { rarityBoost: 1.7,  bonusMaterials: ['arcane_essence', 'emerald_gem'],     bonusDropChance: 0.35 },
  shadow_den:      { rarityBoost: 1.6,  bonusMaterials: ['shadow_essence', 'sapphire_gem'],    bonusDropChance: 0.25 },
};

// ============================================================
// Core Loot Generation
// ============================================================

/**
 * Roll for item rarity using weighted system with magic find support
 */
export function rollRarity(rng: () => number, ctx: LootContext): ItemRarity {
  // Magic find increases weight of higher rarities
  const mfMult = 1 + (ctx.magicFind / 100);
  const zoneMult = ctx.rarityBoost;

  const weights: [ItemRarity, number][] = RARITY_ORDER.map(r => {
    let w = RARITY_WEIGHTS[r];
    // Boost non-common rarities by MF and zone multiplier
    if (r !== 'common') {
      w = Math.round(w * mfMult * zoneMult);
    }
    return [r, w];
  });

  const totalWeight = weights.reduce((s, [, w]) => s + w, 0);
  let roll = Math.floor(rng() * totalWeight);

  for (const [rarity, weight] of weights) {
    roll -= weight;
    if (roll < 0) return rarity;
  }
  return 'common';
}

/**
 * Select a base item template appropriate for the context
 */
function selectBaseItem(
  type: ItemType,
  ctx: LootContext,
  rng: () => number
): BaseItemTemplate {
  const pool = BASE_ITEM_POOLS[type];
  // Filter to items within level range (+2 above player level allowed)
  const eligible = pool.filter(t => t.requiredLevel <= ctx.playerLevel + 2);
  if (eligible.length === 0) return pool[0];

  // Weight higher-level items more on deeper floors
  const weighted = eligible.map(t => ({
    template: t,
    weight: 1 + Math.max(0, t.requiredLevel - 1) * (ctx.depth / 5),
  }));
  const totalWeight = weighted.reduce((s, w) => s + w.weight, 0);
  let roll = rng() * totalWeight;
  for (const w of weighted) {
    roll -= w.weight;
    if (roll <= 0) return w.template;
  }
  return eligible[eligible.length - 1];
}

/**
 * Select affixes for an item based on rarity and item level
 */
function rollAffixes(
  rarity: ItemRarity,
  itemLevel: number,
  rng: () => number,
  minAffixes?: number,
  maxAffixesOverride?: number,
  guaranteedAffixId?: string,
): ItemAffix[] {
  const maxAllowed = maxAffixesOverride !== undefined
    ? Math.min(maxAffixesOverride, MAX_AFFIXES[rarity])
    : MAX_AFFIXES[rarity];

  if (maxAllowed <= 0) return [];

  const min = minAffixes ?? (getRarityIndex(rarity) >= 3 ? 1 : 0);
  const count = Math.max(min, Math.floor(rng() * (maxAllowed + 1)));
  if (count <= 0) return [];

  const affixes: ItemAffix[] = [];
  const usedIds = new Set<string>();

  // Guaranteed affix first
  if (guaranteedAffixId) {
    const found = [...PREFIX_POOL, ...SUFFIX_POOL].find(a => a.id === guaranteedAffixId);
    if (found) {
      affixes.push(found);
      usedIds.add(found.id);
    }
  }

  // Max tier based on item level
  const maxTier = Math.min(5, Math.ceil(itemLevel / 2));

  // Fill remaining slots, alternating prefix/suffix for variety
  for (let i = affixes.length; i < count; i++) {
    const wantPrefix = i % 2 === 0;
    const pool = wantPrefix ? PREFIX_POOL : SUFFIX_POOL;

    // Filter by tier and rarity proximity
    const rarityIdx = getRarityIndex(rarity);
    const eligible = pool.filter(a =>
      a.tier <= maxTier &&
      !usedIds.has(a.id) &&
      getRarityIndex(a.rarity) <= rarityIdx + 1
    );

    if (eligible.length === 0) continue;

    // Weighted selection favoring matching rarity
    const weighted = eligible.map(a => ({
      affix: a,
      weight: a.tier === maxTier ? 3 : (getRarityIndex(a.rarity) === rarityIdx ? 2 : 1),
    }));
    const totalW = weighted.reduce((s, w) => s + w.weight, 0);
    let roll = rng() * totalW;
    for (const w of weighted) {
      roll -= w.weight;
      if (roll <= 0) {
        affixes.push(w.affix);
        usedIds.add(w.affix.id);
        break;
      }
    }
  }

  return affixes;
}

/**
 * Build a complete Item from a base template, rarity, and affixes
 */
function buildItem(
  base: BaseItemTemplate,
  rarity: ItemRarity,
  affixes: ItemAffix[],
  itemLevel: number,
): Item {
  const statMult = RARITY_STAT_MULT[rarity];

  // Scale base stats by rarity
  const stats: ItemStats = {};
  for (const [key, val] of Object.entries(base.baseStats)) {
    (stats as any)[key] = Math.round((val as number) * statMult);
  }

  // Add affix bonuses
  for (const affix of affixes) {
    for (const [key, val] of Object.entries(affix.bonuses)) {
      (stats as any)[key] = ((stats as any)[key] || 0) + (val as number);
    }
  }

  // Build name: [prefix] BaseName [suffix]
  const prefixes = affixes.filter(a => a.slot === 'prefix');
  const suffixes = affixes.filter(a => a.slot === 'suffix');
  const prefixStr = prefixes.map(a => a.name).join(' ');
  const suffixStr = suffixes.map(a => a.name).join(' ');
  const name = [prefixStr, base.name, suffixStr].filter(Boolean).join(' ');

  // Price scales with rarity and affixes
  const price = Math.round(base.basePrice * RARITY_VALUE_MULT[rarity] * (1 + affixes.length * 0.3));

  // Visual effect from highest-tier affix
  const visualAffix = affixes
    .filter(a => a.visualEffect)
    .sort((a, b) => b.tier - a.tier)[0];

  return {
    id: uuidv4(),
    name,
    type: base.type,
    rarity,
    itemLevel,
    stats,
    affixes,
    damageType: visualAffix?.damageType,
    visualEffect: visualAffix?.visualEffect,
    flavorText: base.flavorText,
    price,
    requiredLevel: base.requiredLevel,
  };
}

/**
 * Try to generate a unique item drop
 */
function tryUniqueItem(
  ctx: LootContext,
  rng: () => number,
): Item | null {
  // Unique chance: base 2% for legendary, boosted by MF and boss status
  const basePct = ctx.isBoss ? 0.08 : 0.02;
  const mfBonus = ctx.magicFind / 1000; // MF adds 0.1% per 100 MF
  const uniqueChance = basePct + mfBonus;

  if (rng() > uniqueChance) return null;

  // Filter eligible uniques by floor
  const eligible = ALL_UNIQUES.filter(u => u.minFloor <= ctx.depth);
  if (eligible.length === 0) return null;

  // Weighted selection
  const totalWeight = eligible.reduce((s, u) => s + u.dropWeight, 0);
  let roll = rng() * totalWeight;
  let chosen: UniqueItemDef | null = null;
  for (const u of eligible) {
    roll -= u.dropWeight;
    if (roll <= 0) { chosen = u; break; }
  }
  if (!chosen) return null;

  // Build the unique item
  const affixes: ItemAffix[] = [];
  for (const affixId of chosen.fixedAffixes) {
    const found = [...PREFIX_POOL, ...SUFFIX_POOL].find(a => a.id === affixId);
    if (found) affixes.push(found);
  }

  // Determine set membership
  const setId = ITEM_SETS.find(s => s.pieces.includes(chosen!.id))?.id;

  const item: Item = {
    id: uuidv4(),
    name: chosen.name,
    type: chosen.type,
    rarity: 'legendary',
    itemLevel: ctx.depth + ctx.playerLevel,
    stats: { ...chosen.fixedStats },
    affixes,
    setId,
    isUnique: true,
    damageType: chosen.damageType,
    visualEffect: chosen.visualEffect,
    flavorText: chosen.flavorText,
    price: chosen.price,
    requiredLevel: chosen.requiredLevel,
    soulbound: true,
  };
  return item;
}

/**
 * Generate a single item from a loot table entry
 */
function generateSingleItem(
  entry: LootTableEntry,
  ctx: LootContext,
  rng: () => number,
): Item {
  const type = (entry.itemPool || 'weapon') as ItemType;
  const rarity = entry.rarityOverride || rollRarity(rng, ctx);
  const itemLevel = ctx.depth + ctx.playerLevel;
  const base = selectBaseItem(type, ctx, rng);
  const affixes = rollAffixes(
    rarity,
    itemLevel,
    rng,
    entry.minAffixes,
    entry.maxAffixes,
    entry.guaranteedAffix,
  );
  return buildItem(base, rarity, affixes, itemLevel);
}

/**
 * Generate complete loot drops from a loot table + context
 */
export function generateLootFromTable(
  table: LootTable,
  ctx: LootContext,
  rng: () => number,
): LootDrop {
  const difficultyMult: Record<string, number> = {
    easy: 0.7,
    normal: 1.0,
    hard: 1.15,
    nightmare: 1.4,
  };
  const depthBonus = Math.pow(1.12, ctx.depth - 1);
  const mult = (difficultyMult[ctx.difficulty] || 1.0) * depthBonus;

  // Gold and XP
  const goldBase = table.goldRange[0] + rng() * (table.goldRange[1] - table.goldRange[0]);
  const xpBase = table.xpRange[0] + rng() * (table.xpRange[1] - table.xpRange[0]);
  const gold = Math.round(goldBase * mult);
  const xp = Math.round(xpBase * mult);

  const items: Item[] = [];

  // Guaranteed drops
  const guaranteed = table.guaranteedDrops || 0;
  for (let i = 0; i < guaranteed; i++) {
    // Try unique first
    const unique = tryUniqueItem(ctx, rng);
    if (unique) {
      items.push(unique);
      continue;
    }
    // Normal weighted roll
    const entry = weightedSelect(table.entries, rng);
    if (entry) items.push(generateSingleItem(entry, ctx, rng));
  }

  // Base drop chance (scales with depth & difficulty)
  const baseDropChance = 0.4 + (ctx.depth / 10) * 0.3 + ((difficultyMult[ctx.difficulty] || 1) - 1) * 0.2;
  if (rng() < baseDropChance) {
    const unique = tryUniqueItem(ctx, rng);
    if (unique) {
      items.push(unique);
    } else {
      const entry = weightedSelect(table.entries, rng);
      if (entry) items.push(generateSingleItem(entry, ctx, rng));
    }
  }

  // Bonus drop chance
  if (table.bonusDropChance && rng() < table.bonusDropChance) {
    const entry = weightedSelect(table.entries, rng);
    if (entry) items.push(generateSingleItem(entry, ctx, rng));
  }

  // Zone bonus materials
  const materials: MaterialDrop[] = [];
  const zoneModifier = ctx.zoneType ? ZONE_LOOT_MODIFIERS[ctx.zoneType] : null;

  // Standard material drops
  const materialsForFloor = Object.values(MATERIALS).filter(m => m.minFloor <= ctx.depth);
  if (rng() < 0.5 && materialsForFloor.length > 0) {
    const material = materialsForFloor[Math.floor(rng() * materialsForFloor.length)];
    const quantity = Math.floor(rng() * 3) + 1;
    materials.push({ materialId: material.id, quantity });
  }

  // Zone-specific bonus materials
  if (zoneModifier && rng() < zoneModifier.bonusDropChance) {
    const bonusMats = zoneModifier.bonusMaterials;
    const mat = bonusMats[Math.floor(rng() * bonusMats.length)];
    if (MATERIALS[mat]) {
      materials.push({ materialId: mat, quantity: Math.floor(rng() * 2) + 1 });
    }
  }

  return {
    id: uuidv4(),
    gold,
    xp,
    items,
    materials,
  };
}

/**
 * Simplified loot generation (backward-compatible with old API)
 */
export function generateLoot(
  gold: number,
  xp: number,
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare',
  depth: number,
  rng: () => number,
  enemyType?: string,
  magicFind?: number,
  zoneType?: string,
  isBoss?: boolean,
): LootDrop {
  const ctx: LootContext = {
    difficulty,
    depth,
    playerLevel: Math.max(1, Math.floor(depth * 1.2)),
    magicFind: magicFind || 0,
    rarityBoost: zoneType && ZONE_LOOT_MODIFIERS[zoneType] ? ZONE_LOOT_MODIFIERS[zoneType].rarityBoost : 1.0,
    zoneType,
    isBoss: isBoss || false,
  };

  // Use enemy-specific table if available
  const table = enemyType && ENEMY_LOOT_TABLES[enemyType]
    ? ENEMY_LOOT_TABLES[enemyType]
    : {
        id: 'generic',
        name: 'Generic Loot',
        entries: [
          { weight: 40, itemPool: 'weapon', maxAffixes: 2 },
          { weight: 30, itemPool: 'armor', maxAffixes: 2 },
          { weight: 20, itemPool: 'accessory', maxAffixes: 1 },
          { weight: 10, itemPool: 'consumable', maxAffixes: 0 },
        ],
        goldRange: [gold * 0.8, gold * 1.2] as [number, number],
        xpRange: [xp * 0.8, xp * 1.2] as [number, number],
        bonusDropChance: 0.15,
      };

  // Override gold/xp ranges with passed values if using generic table
  if (!enemyType || !ENEMY_LOOT_TABLES[enemyType]) {
    table.goldRange = [gold * 0.8, gold * 1.2];
    table.xpRange = [xp * 0.8, xp * 1.2];
  }

  return generateLootFromTable(table, ctx, rng);
}

// ============================================================
// Utility Helpers
// ============================================================

function weightedSelect<T extends { weight: number }>(
  entries: T[],
  rng: () => number,
): T | null {
  const totalWeight = entries.reduce((s, e) => s + e.weight, 0);
  if (totalWeight <= 0) return null;
  let roll = rng() * totalWeight;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry;
  }
  return entries[entries.length - 1];
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
  const startLevel = currentLevel;

  while (xp >= xpForNextLevel(level)) {
    xp -= xpForNextLevel(level);
    level += 1;
  }

  return {
    newLevel: level,
    newXp: xp,
    levelsGained: level - startLevel,
  };
}

/**
 * Calculate set bonuses for equipped items
 */
export function calculateSetBonuses(equippedItems: Item[]): { setName: string; bonuses: Partial<ItemStats>; description: string }[] {
  const activeBonuses: { setName: string; bonuses: Partial<ItemStats>; description: string }[] = [];

  for (const set of ITEM_SETS) {
    const equipped = equippedItems.filter(item =>
      item.setId === set.id || set.pieces.includes(item.id)
    ).length;

    for (const bonus of set.setBonuses) {
      if (equipped >= bonus.piecesRequired) {
        activeBonuses.push({
          setName: set.name,
          bonuses: bonus.bonuses,
          description: `${set.name} (${bonus.piecesRequired}pc): ${bonus.description}`,
        });
      }
    }
  }

  return activeBonuses;
}

/**
 * Get total stats including set bonuses
 */
export function getTotalItemStats(items: Item[]): ItemStats {
  const total: ItemStats = {};
  const statKeys: (keyof ItemStats)[] = [
    'attack', 'defense', 'speed', 'accuracy', 'evasion',
    'hp', 'critChance', 'critDamage', 'lifeSteal', 'thorns', 'magicFind',
  ];

  // Sum item stats
  for (const item of items) {
    for (const key of statKeys) {
      if (item.stats[key]) {
        total[key] = (total[key] || 0) + item.stats[key]!;
      }
    }
  }

  // Add set bonuses
  const setBonuses = calculateSetBonuses(items);
  for (const sb of setBonuses) {
    for (const key of statKeys) {
      const val = sb.bonuses[key];
      if (val) {
        total[key] = (total[key] || 0) + val;
      }
    }
  }

  return total;
}

// ============================================================
// Display Helpers
// ============================================================

export function getRarityColor(rarity: ItemRarity): string {
  const colors: Record<ItemRarity, string> = {
    common: 'text-gray-400',
    uncommon: 'text-green-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-yellow-400',
    mythic: 'text-red-400',
  };
  return colors[rarity];
}

export function getRarityBg(rarity: ItemRarity): string {
  const colors: Record<ItemRarity, string> = {
    common: 'bg-gray-500/20 border-gray-500',
    uncommon: 'bg-green-500/20 border-green-500',
    rare: 'bg-blue-500/20 border-blue-500',
    epic: 'bg-purple-500/20 border-purple-500',
    legendary: 'bg-yellow-500/20 border-yellow-500',
    mythic: 'bg-red-500/20 border-red-500',
  };
  return colors[rarity];
}

export function getRarityHexColors(rarity: ItemRarity): { bg: string; text: string; light: string } {
  const colors: Record<ItemRarity, { bg: string; text: string; light: string }> = {
    common:    { bg: '#6b7280', text: '#d1d5db', light: '#e5e7eb' },
    uncommon:  { bg: '#10b981', text: '#a7f3d0', light: '#d1fae5' },
    rare:      { bg: '#3b82f6', text: '#93c5fd', light: '#dbeafe' },
    epic:      { bg: '#a855f7', text: '#d8b4fe', light: '#f3e8ff' },
    legendary: { bg: '#f59e0b', text: '#fef3c7', light: '#fef9e7' },
    mythic:    { bg: '#ef4444', text: '#fecaca', light: '#fee2e2' },
  };
  return colors[rarity];
}

export function getItemsByRarity(rarity: ItemRarity): Item[] {
  // Generate sample items of each type at this rarity
  const items: Item[] = [];
  const types: ItemType[] = ['weapon', 'armor', 'accessory'];
  let seedCounter = 0;
  for (const type of types) {
    const pool = BASE_ITEM_POOLS[type];
    for (const base of pool) {
      const simpleRng = () => {
        seedCounter = (seedCounter * 1103515245 + 12345) & 0x7fffffff;
        return seedCounter / 0x7fffffff;
      };
      const affixes = rollAffixes(rarity, 10, simpleRng, 0, MAX_AFFIXES[rarity]);
      items.push(buildItem(base, rarity, affixes, 10));
    }
  }
  return items;
}

export function formatItemStats(stats: ItemStats): string[] {
  const parts: string[] = [];
  if (stats.attack) parts.push(`+${stats.attack} ATK`);
  if (stats.defense) parts.push(`+${stats.defense} DEF`);
  if (stats.speed) parts.push(`${stats.speed > 0 ? '+' : ''}${stats.speed} SPD`);
  if (stats.accuracy) parts.push(`+${stats.accuracy} ACC`);
  if (stats.evasion) parts.push(`+${stats.evasion} EVA`);
  if (stats.hp) parts.push(`+${stats.hp} HP`);
  if (stats.critChance) parts.push(`+${stats.critChance}% CRIT`);
  if (stats.critDamage) parts.push(`+${stats.critDamage}% CDMG`);
  if (stats.lifeSteal) parts.push(`+${stats.lifeSteal}% LS`);
  if (stats.thorns) parts.push(`+${stats.thorns} THORNS`);
  if (stats.magicFind) parts.push(`+${stats.magicFind}% MF`);
  return parts;
}

export function formatItemTooltip(item: Item): string {
  const lines: string[] = [];
  lines.push(`[${item.rarity.toUpperCase()}] ${item.name}`);
  if (item.isUnique) lines.push('★ UNIQUE');
  if (item.setId) {
    const set = ITEM_SETS.find(s => s.id === item.setId);
    if (set) lines.push(`⚔ Set: ${set.name}`);
  }
  lines.push(`Type: ${item.type} | iLvl: ${item.itemLevel}`);
  lines.push(`Stats: ${formatItemStats(item.stats).join(', ')}`);
  if (item.affixes.length > 0) {
    lines.push(`Affixes: ${item.affixes.map(a => a.name).join(', ')}`);
  }
  if (item.damageType) lines.push(`Damage: ${item.damageType}`);
  if (item.flavorText) lines.push(`"${item.flavorText}"`);
  lines.push(`Value: ${item.price} gold | Req Lv: ${item.requiredLevel}`);
  return lines.join('\n');
}
