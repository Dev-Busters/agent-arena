/**
 * Procedural Crafting & Gear Generation
 * Create unique gear with mods and affixes
 */
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
    visualEffect?: string;
}
export interface CraftedGear {
    id: string;
    name: string;
    slot: GearSlot;
    baseRarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    baseMaterials: {
        materialId: string;
        quantity: number;
    }[];
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
export declare const BASE_GEAR: Record<GearSlot, string[]>;
export declare const PREFIXES: Affix[];
export declare const SUFFIXES: Affix[];
/**
 * Generate a procedural unique gear piece
 */
export declare function generateCraftedGear(slot: GearSlot, materials: {
    materialId: string;
    quantity: number;
}[], rng: () => number): CraftedGear;
/**
 * Get crafting recipe cost (materials needed)
 */
export declare function getCraftingCost(slot: GearSlot, rarity: string): {
    materialId: string;
    quantity: number;
}[];
/**
 * Format gear for display
 */
export declare function formatGearStats(gear: CraftedGear): string[];
//# sourceMappingURL=crafting.d.ts.map