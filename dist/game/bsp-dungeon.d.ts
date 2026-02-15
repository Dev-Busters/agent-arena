/**
 * BSP (Binary Space Partitioning) Dungeon Generator
 *
 * Creates sophisticated room layouts by recursively splitting the map space
 * into partitions, placing rooms within leaf nodes, and connecting them
 * with corridors. Supports room types, decorations, and special features.
 *
 * Algorithm:
 * 1. Start with full map as root node
 * 2. Recursively split into left/right or top/bottom partitions
 * 3. Place rooms in leaf partitions with padding
 * 4. Connect sibling rooms with corridors (L-shaped or straight)
 * 5. Assign room types based on position, depth, and difficulty
 * 6. Place features (doors, traps, treasure, exits) within rooms
 */
export declare enum Tile {
    WALL = 0,
    FLOOR = 1,
    EXIT = 2,
    DOOR = 3,
    CORRIDOR = 4,
    TRAP = 5,
    TREASURE = 6,
    PILLAR = 7,
    WATER = 8,
    LAVA = 9,
    ENTRANCE = 10
}
export type RoomType = "entrance" | "normal" | "treasure" | "trap" | "boss" | "shrine" | "armory" | "library" | "exit" | "secret";
export interface BSPRoom {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
    type: RoomType;
    connections: number[];
    features: RoomFeature[];
    explored: boolean;
}
export interface RoomFeature {
    type: "chest" | "trap" | "shrine" | "pillar" | "water" | "lava" | "torch" | "bookshelf";
    x: number;
    y: number;
}
export interface Corridor {
    id: number;
    from: number;
    to: number;
    points: Array<{
        x: number;
        y: number;
    }>;
    hasDoor: boolean;
}
export interface BSPDungeonMap {
    width: number;
    height: number;
    tiles: number[][];
    rooms: BSPRoom[];
    corridors: Corridor[];
    entrance: {
        x: number;
        y: number;
    };
    exit: {
        x: number;
        y: number;
    };
    seed: number;
    depth: number;
    roomCount: number;
}
export interface BSPConfig {
    width: number;
    height: number;
    minPartitionSize: number;
    maxPartitionSize: number;
    minRoomSize: number;
    roomPadding: number;
    maxDepthSplits: number;
    corridorWidth: number;
    doorChance: number;
    trapChance: number;
    treasureChance: number;
    secretRoomChance: number;
    featureDensity: number;
    bossRoomMinSize: number;
}
type DungeonDifficulty = "easy" | "normal" | "hard" | "nightmare";
export declare class BSPDungeonGenerator {
    private config;
    private rng;
    private tiles;
    private rooms;
    private corridors;
    private nextRoomId;
    private nextCorridorId;
    constructor(config?: Partial<BSPConfig>, seed?: number);
    /**
     * Main generation entry point
     */
    generate(difficulty: DungeonDifficulty, depth: number, seed: number): BSPDungeonMap;
    private initTiles;
    private createBSPNode;
    private splitNode;
    private placeRooms;
    private connectRooms;
    private getLeafRooms;
    private createCorridor;
    private assignRoomTypes;
    private placeFeatures;
    private placeTreasureFeatures;
    private placeTrapFeatures;
    private placeShrineFeatures;
    private placeLibraryFeatures;
    private placeBossFeatures;
    private placeNormalFeatures;
    private addCornerTorches;
    private placeEntrance;
    private placeExit;
    private addSecretRooms;
    private overlapsAnyRoom;
    private carveTiles;
    private inBounds;
}
/**
 * Generate a BSP dungeon map (drop-in replacement for the old generateDungeon)
 */
export declare function generateBSPDungeon(seed: number, difficulty: DungeonDifficulty, depth: number, _playerLevel: number): BSPDungeonMap;
/**
 * Convert BSPDungeonMap to the legacy DungeonMap format for backward compatibility
 */
export declare function bspToLegacyFormat(bspMap: BSPDungeonMap): {
    width: number;
    height: number;
    tiles: number[][];
    rooms: Array<{
        id: number;
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
    visited: Set<number>;
};
/**
 * Get room adjacency graph for pathfinding
 */
export declare function getRoomGraph(map: BSPDungeonMap): Map<number, number[]>;
/**
 * Find shortest path between two rooms using BFS
 */
export declare function findRoomPath(graph: Map<number, number[]>, startId: number, endId: number): number[] | null;
/**
 * ASCII visualization for debugging
 */
export declare function dungeonToASCII(map: BSPDungeonMap): string;
export {};
//# sourceMappingURL=bsp-dungeon.d.ts.map