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
    dropRate: number;
    minFloor: number;
    properties: {
        [key: string]: number;
    };
}
export declare const MATERIALS: Record<string, Material>;
/**
 * Get materials available at a specific dungeon floor
 */
export declare function getMaterialsForFloor(floor: number): Material[];
/**
 * Get drop chance for a material at a specific floor
 */
export declare function getMaterialDropChance(materialId: string, floor: number): number;
/**
 * Get material color for UI
 */
export declare function getMaterialColor(rarity: MaterialRarity): string;
//# sourceMappingURL=materials.d.ts.map