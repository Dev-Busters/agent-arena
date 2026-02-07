/**
 * Procedural Loot Generation
 * Diablo/PoE-style rarity system
 */

export enum LootRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export interface LootItem {
  id: string
  name: string
  rarity: LootRarity
  type: 'weapon' | 'armor' | 'accessory'
  stats: {
    attack?: number
    defense?: number
    hp?: number
    speed?: number
  }
  value: number
}

// Rarity colors matching Diablo/PoE aesthetic
const RARITY_COLORS = {
  [LootRarity.COMMON]: { bg: '#6b7280', text: '#d1d5db', light: '#e5e7eb' },
  [LootRarity.UNCOMMON]: { bg: '#10b981', text: '#a7f3d0', light: '#d1fae5' },
  [LootRarity.RARE]: { bg: '#3b82f6', text: '#93c5fd', light: '#dbeafe' },
  [LootRarity.EPIC]: { bg: '#a855f7', text: '#d8b4fe', light: '#f3e8ff' },
  [LootRarity.LEGENDARY]: { bg: '#f59e0b', text: '#fef3c7', light: '#fef9e7' },
}

// Rarity drop rates
const RARITY_RATES = {
  [LootRarity.COMMON]: 0.6,
  [LootRarity.UNCOMMON]: 0.25,
  [LootRarity.RARE]: 0.1,
  [LootRarity.EPIC]: 0.04,
  [LootRarity.LEGENDARY]: 0.01,
}

// Procedural names
const PREFIXES = [
  'Gleaming',
  'Shadow',
  'Burning',
  'Frozen',
  'Ancient',
  'Cursed',
  'Divine',
  'Vicious',
  'Radiant',
  'Void',
]

const SUFFIXES = [
  'of Power',
  'of Destruction',
  'of Protection',
  'of Swiftness',
  'of Fortune',
  'of Darkness',
  'of Light',
  'of Rending',
  'of Eternity',
  'of Chaos',
]

const BASE_NAMES = {
  weapon: ['Sword', 'Axe', 'Staff', 'Bow', 'Dagger', 'Hammer', 'Spear', 'Blade'],
  armor: ['Plate', 'Mail', 'Robes', 'Leather', 'Chainmail', 'Breastplate'],
  accessory: ['Ring', 'Amulet', 'Bracelet', 'Crown', 'Pendant', 'Cloak'],
}

/**
 * Generate random rarity based on drop rates
 */
function generateRarity(): LootRarity {
  const roll = Math.random()
  let accumulated = 0

  for (const [rarity, rate] of Object.entries(RARITY_RATES)) {
    accumulated += rate
    if (roll <= accumulated) {
      return rarity as LootRarity
    }
  }

  return LootRarity.COMMON
}

/**
 * Generate random procedural name
 */
function generateName(type: 'weapon' | 'armor' | 'accessory'): string {
  const baseName = BASE_NAMES[type][Math.floor(Math.random() * BASE_NAMES[type].length)]
  const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)]
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)]

  // 60% chance for prefix + base, 30% for base + suffix, 10% for all three
  const roll = Math.random()
  if (roll < 0.6) {
    return `${prefix} ${baseName}`
  } else if (roll < 0.9) {
    return `${baseName} ${suffix}`
  } else {
    return `${prefix} ${baseName} ${suffix}`
  }
}

/**
 * Generate stats based on rarity
 */
function generateStats(rarity: LootRarity, type: 'weapon' | 'armor' | 'accessory') {
  const rarityMultiplier = {
    [LootRarity.COMMON]: 1,
    [LootRarity.UNCOMMON]: 1.2,
    [LootRarity.RARE]: 1.5,
    [LootRarity.EPIC]: 1.9,
    [LootRarity.LEGENDARY]: 2.5,
  }[rarity]

  const stats: LootItem['stats'] = {}

  if (type === 'weapon') {
    stats.attack = Math.floor(5 * rarityMultiplier + Math.random() * 5)
  } else if (type === 'armor') {
    stats.defense = Math.floor(4 * rarityMultiplier + Math.random() * 4)
  } else if (type === 'accessory') {
    // Random bonus
    const bonusType = Math.random()
    if (bonusType < 0.33) {
      stats.attack = Math.floor(3 * rarityMultiplier)
    } else if (bonusType < 0.66) {
      stats.defense = Math.floor(3 * rarityMultiplier)
    } else {
      stats.hp = Math.floor(20 * rarityMultiplier)
    }
  }

  return stats
}

/**
 * Generate a random loot item
 */
export function generateLoot(): LootItem {
  const type = ['weapon', 'armor', 'accessory'][Math.floor(Math.random() * 3)] as any
  const rarity = generateRarity()
  const name = generateName(type)
  const stats = generateStats(rarity, type)

  // Value increases with rarity
  const baseValue = {
    [LootRarity.COMMON]: 50,
    [LootRarity.UNCOMMON]: 150,
    [LootRarity.RARE]: 400,
    [LootRarity.EPIC]: 1000,
    [LootRarity.LEGENDARY]: 3000,
  }[rarity]

  return {
    id: `loot-${Date.now()}-${Math.random()}`,
    name,
    rarity,
    type,
    stats,
    value: Math.floor(baseValue * (0.8 + Math.random() * 0.4)),
  }
}

export function getRarityColor(rarity: LootRarity) {
  return RARITY_COLORS[rarity]
}
