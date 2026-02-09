/**
 * Loot Generation & Item Drops
 * Handles item drops, rarity tiers, and progression rewards
 */
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
/**
 * Generate loot drops for defeating an enemy
 */
export declare function generateLoot(gold: number, xp: number, difficulty: 'easy' | 'normal' | 'hard' | 'nightmare', depth: number, rng: () => number): LootDrop;
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
 * Get rarity color for UI display
 */
export declare function getRarityColor(rarity: ItemRarity): string;
/**
 * Get rarity background color for UI
 */
export declare function getRarityBg(rarity: ItemRarity): string;
/**
 * Get all items by rarity
 */
export declare function getItemsByRarity(rarity: ItemRarity): Item[];
/**
 * Format item stats for display
 */
export declare function formatItemStats(stats: Item['stats']): string[];
//# sourceMappingURL=loot.d.ts.map