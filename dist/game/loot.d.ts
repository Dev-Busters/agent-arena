/**
 * Comprehensive Loot Table System
 * Diablo/PoE-inspired with rarity tiers, affix generation, loot tables,
 * set items, uniques, and zone-specific drops.
 */
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
    critChance?: number;
    critDamage?: number;
    lifeSteal?: number;
    thorns?: number;
    magicFind?: number;
}
export interface ItemAffix {
    id: string;
    name: string;
    slot: AffixSlot;
    tier: number;
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
    itemLevel: number;
    stats: ItemStats;
    affixes: ItemAffix[];
    setId?: string;
    isUnique?: boolean;
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
    weight: number;
    itemPool?: string;
    fixedItemId?: string;
    rarityOverride?: ItemRarity;
    minAffixes?: number;
    maxAffixes?: number;
    guaranteedAffix?: string;
}
export interface LootTable {
    id: string;
    name: string;
    entries: LootTableEntry[];
    guaranteedDrops?: number;
    bonusDropChance?: number;
    goldRange: [number, number];
    xpRange: [number, number];
}
export interface LootContext {
    difficulty: 'easy' | 'normal' | 'hard' | 'nightmare';
    depth: number;
    playerLevel: number;
    magicFind: number;
    rarityBoost: number;
    zoneType?: string;
    isBoss?: boolean;
}
export declare function getRarityIndex(r: ItemRarity): number;
export interface UniqueItemDef {
    id: string;
    name: string;
    type: ItemType;
    fixedStats: ItemStats;
    fixedAffixes: string[];
    damageType?: DamageType;
    visualEffect?: string;
    flavorText: string;
    price: number;
    requiredLevel: number;
    dropWeight: number;
    minFloor: number;
}
export declare const UNIQUE_ITEMS: UniqueItemDef[];
export interface SetBonus {
    piecesRequired: number;
    bonuses: Partial<ItemStats>;
    description: string;
}
export interface ItemSet {
    id: string;
    name: string;
    pieces: string[];
    setBonuses: SetBonus[];
}
export declare const ITEM_SETS: ItemSet[];
export declare const ENEMY_LOOT_TABLES: Record<string, LootTable>;
export declare const ZONE_LOOT_MODIFIERS: Record<string, {
    rarityBoost: number;
    bonusMaterials: string[];
    bonusDropChance: number;
}>;
/**
 * Roll for item rarity using weighted system with magic find support
 */
export declare function rollRarity(rng: () => number, ctx: LootContext): ItemRarity;
/**
 * Generate complete loot drops from a loot table + context
 */
export declare function generateLootFromTable(table: LootTable, ctx: LootContext, rng: () => number): LootDrop;
/**
 * Simplified loot generation (backward-compatible with old API)
 */
export declare function generateLoot(gold: number, xp: number, difficulty: 'easy' | 'normal' | 'hard' | 'nightmare', depth: number, rng: () => number, enemyType?: string, magicFind?: number, zoneType?: string, isBoss?: boolean): LootDrop;
/**
 * Calculate XP needed for next level (exponential curve)
 */
export declare function xpForNextLevel(level: number): number;
/**
 * Calculate new level after gaining XP
 */
export declare function calculateLevelUp(currentLevel: number, currentXp: number, gainedXp: number): {
    newLevel: number;
    newXp: number;
    levelsGained: number;
};
/**
 * Calculate set bonuses for equipped items
 */
export declare function calculateSetBonuses(equippedItems: Item[]): {
    setName: string;
    bonuses: Partial<ItemStats>;
    description: string;
}[];
/**
 * Get total stats including set bonuses
 */
export declare function getTotalItemStats(items: Item[]): ItemStats;
export declare function getRarityColor(rarity: ItemRarity): string;
export declare function getRarityBg(rarity: ItemRarity): string;
export declare function getRarityHexColors(rarity: ItemRarity): {
    bg: string;
    text: string;
    light: string;
};
export declare function getItemsByRarity(rarity: ItemRarity): Item[];
export declare function formatItemStats(stats: ItemStats): string[];
export declare function formatItemTooltip(item: Item): string;
//# sourceMappingURL=loot.d.ts.map