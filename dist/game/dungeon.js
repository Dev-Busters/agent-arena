/**
 * Roguelike Dungeon Generation & Management
 * Uses BSP (Binary Space Partitioning) for sophisticated room layouts
 * with fallback to rot.js Digger for simple maps
 */
import * as ROT from "rot-js";
import SeededRandom from "seedrandom";
import { generateBSPDungeon, bspToLegacyFormat, Tile, getRoomGraph, findRoomPath, dungeonToASCII, } from "./bsp-dungeon.js";
// Re-export BSP types for consumers
export { Tile };
export { getRoomGraph, findRoomPath, dungeonToASCII };
export const ENEMY_TEMPLATES = {
    goblin: {
        type: "goblin",
        name: "Goblin",
        baseLevel: 1,
        baseHp: 25,
        baseAttack: 8,
        baseDefense: 3,
        baseSpeed: 12,
        goldDrop: 50,
        xpDrop: 100,
        lootTable: [],
    },
    orc: {
        type: "orc",
        name: "Orc",
        baseLevel: 3,
        baseHp: 45,
        baseAttack: 12,
        baseDefense: 6,
        baseSpeed: 9,
        goldDrop: 100,
        xpDrop: 250,
        lootTable: [],
    },
    skeleton: {
        type: "skeleton",
        name: "Skeleton",
        baseLevel: 2,
        baseHp: 35,
        baseAttack: 10,
        baseDefense: 4,
        baseSpeed: 11,
        goldDrop: 75,
        xpDrop: 150,
        lootTable: [],
    },
    wraith: {
        type: "wraith",
        name: "Wraith",
        baseLevel: 5,
        baseHp: 40,
        baseAttack: 14,
        baseDefense: 2,
        baseSpeed: 15,
        goldDrop: 150,
        xpDrop: 400,
        lootTable: [],
    },
    boss_skeleton: {
        type: "boss_skeleton",
        name: "Skeletal Lord",
        baseLevel: 8,
        baseHp: 100,
        baseAttack: 18,
        baseDefense: 8,
        baseSpeed: 10,
        goldDrop: 500,
        xpDrop: 1000,
        lootTable: [],
    },
    boss_dragon: {
        type: "boss_dragon",
        name: "Ancient Dragon",
        baseLevel: 10,
        baseHp: 200,
        baseAttack: 25,
        baseDefense: 12,
        baseSpeed: 12,
        goldDrop: 1000,
        xpDrop: 2500,
        lootTable: [],
    },
    boss_lich: {
        type: "boss_lich",
        name: "Lich King",
        baseLevel: 10,
        baseHp: 150,
        baseAttack: 22,
        baseDefense: 10,
        baseSpeed: 14,
        goldDrop: 800,
        xpDrop: 2000,
        lootTable: [],
    },
};
/**
 * Generate a BSP dungeon with sophisticated room layouts.
 * Returns the full BSPDungeonMap with typed rooms, corridors, features.
 */
export function generateBSPDungeonMap(seed, difficulty, depth, playerLevel) {
    console.log('🏗️ [DUNGEON] Starting BSP generation:', { seed, difficulty, depth, playerLevel });
    const map = generateBSPDungeon(seed, difficulty, depth, playerLevel);
    console.log(`✅ [DUNGEON] BSP generation complete: ${map.roomCount} rooms, ${map.corridors.length} corridors`);
    return map;
}
/**
 * Generate a procedurally random dungeon using BSP algorithm.
 * Backward-compatible: returns the legacy DungeonMap format.
 * Internally uses BSP for much better room layouts.
 */
export function generateDungeon(seed, difficulty, depth, playerLevel) {
    console.log('🏗️ [DUNGEON] Starting BSP-backed generation:', { seed, difficulty, depth, playerLevel });
    try {
        const bspMap = generateBSPDungeon(seed, difficulty, depth, playerLevel);
        const legacy = bspToLegacyFormat(bspMap);
        console.log(`✅ [DUNGEON] BSP generation complete: ${bspMap.roomCount} rooms`);
        return legacy;
    }
    catch (err) {
        // Fallback to rot.js Digger if BSP fails
        console.warn('⚠️ [DUNGEON] BSP generation failed, falling back to Digger:', err.message);
        return generateDungeonLegacy(seed, difficulty, depth, playerLevel);
    }
}
/**
 * Legacy rot.js Digger generation (fallback)
 */
function generateDungeonLegacy(seed, _difficulty, _depth, _playerLevel) {
    const WIDTH = 80;
    const HEIGHT = 24;
    const tiles = [];
    for (let y = 0; y < HEIGHT; y++) {
        tiles[y] = [];
        for (let x = 0; x < WIDTH; x++) {
            tiles[y][x] = 0;
        }
    }
    console.log('🏗️ [DUNGEON] Falling back to Digger generation:', { WIDTH, HEIGHT });
    const digger = new ROT.Map.Digger(WIDTH, HEIGHT);
    try {
        digger.create((x, y, value) => {
            if (value === 0) {
                tiles[y][x] = 1;
            }
        });
        console.log('✅ [DUNGEON] Digger generation complete');
    }
    catch (err) {
        console.error('❌ [DUNGEON] Digger.create error:', err.message);
        throw err;
    }
    const rooms = [];
    const rotRooms = digger.getRooms();
    rotRooms.forEach((room, index) => {
        const x1 = room._x1 ?? 0;
        const y1 = room._y1 ?? 0;
        const x2 = room._x2 ?? WIDTH - 1;
        const y2 = room._y2 ?? HEIGHT - 1;
        rooms.push({
            id: index,
            x: x1,
            y: y1,
            width: x2 - x1 + 1,
            height: y2 - y1 + 1,
        });
    });
    if (rooms.length > 0) {
        const lastRoom = rooms[rooms.length - 1];
        const exitX = lastRoom.x + Math.floor(lastRoom.width / 2);
        const exitY = lastRoom.y + Math.floor(lastRoom.height / 2);
        tiles[exitY][exitX] = 2;
    }
    return { width: WIDTH, height: HEIGHT, tiles, rooms, visited: new Set() };
}
/**
 * Generate enemies for a specific room based on difficulty and depth
 */
export function generateEncounter(roomId, _difficulty, depth, _playerLevel, rng) {
    const enemyCount = Math.min(1 + Math.floor(depth / 2), 4); // 1-4 enemies
    const enemyTypes = [];
    const availableEnemies = [
        "goblin",
        "skeleton",
        "orc",
        "wraith",
    ];
    // Add bosses on certain rooms
    const isBossRoom = (roomId % 5 === 4 && depth >= 3) || depth >= 9;
    if (isBossRoom) {
        if (depth <= 5) {
            enemyTypes.push("boss_skeleton");
        }
        else if (depth <= 8) {
            enemyTypes.push("boss_dragon");
        }
        else {
            enemyTypes.push("boss_lich");
        }
        return enemyTypes;
    }
    // Generate regular enemies
    for (let i = 0; i < enemyCount; i++) {
        const enemy = availableEnemies[Math.floor(rng() * availableEnemies.length)];
        enemyTypes.push(enemy);
    }
    return enemyTypes;
}
/**
 * Scale enemy stats based on player level and difficulty
 */
export function scaleEnemyStats(template, playerLevel, _difficulty) {
    const levelScale = 1 + (playerLevel - template.baseLevel) * 0.1;
    return {
        hp: Math.round(template.baseHp * levelScale),
        attack: Math.round(template.baseAttack * levelScale),
        defense: Math.round(template.baseDefense * levelScale),
        speed: template.baseSpeed, // Speed doesn't scale
    };
}
/**
 * Calculate loot drops for a defeated enemy
 */
export function calculateLoot(template, playerLevel, difficulty) {
    const difficultyMultipliers = {
        easy: 0.8,
        normal: 1.0,
        hard: 1.3,
        nightmare: 1.6,
    };
    const levelBonus = 1 + Math.max(0, playerLevel - template.baseLevel) * 0.05;
    const diffMult = difficultyMultipliers[difficulty];
    return {
        gold: Math.round(template.goldDrop * levelBonus * diffMult),
        xp: Math.round(template.xpDrop * levelBonus * diffMult),
    };
}
/**
 * Get dungeon name based on depth
 */
export function getDungeonName(depth) {
    const names = [
        "Goblin Caverns",
        "Skeletal Tombs",
        "Orc Stronghold",
        "Phantom Depths",
        "Dragon's Lair",
        "Cursed Crypt",
        "Shadowy Abyss",
        "Hellfire Pit",
        "The Forbidden Tower",
        "God's Tomb",
    ];
    return names[Math.min(depth - 1, names.length - 1)];
}
/**
 * Determine difficulty tier based on floor (auto-scaling)
 * Floors 1-3: Easy, 4-6: Normal, 7-9: Hard, 10+: Nightmare
 *
 * BALANCED: Reduced Hard (1.3→1.15) and Nightmare (1.6→1.4) for better survival rates
 */
export function getDifficultyForFloor(floor) {
    if (floor <= 3)
        return "easy";
    if (floor <= 6)
        return "normal";
    if (floor <= 9)
        return "hard";
    return "nightmare";
}
/**
 * Get difficulty multiplier for stats/damage scaling
 * BALANCED: Smoother progression curve
 */
export function getDifficultyMultiplier(difficulty) {
    const multipliers = {
        easy: 0.7,
        normal: 1.0,
        hard: 1.15, // Reduced from 1.3 for better Floor 7-9 survival
        nightmare: 1.4, // Reduced from 1.6 for Floor 10+ accessibility
    };
    return multipliers[difficulty];
}
/**
 * Generate branching paths for deeper floors (starts at floor 5)
 * Returns 2-3 path options with special zones
 */
export function generateBranchingPaths(floor, seed) {
    if (floor < 5)
        return [];
    const rng = SeededRandom(seed.toString());
    const pathCount = floor < 8 ? 2 : 3; // 3 options at floor 8+
    const paths = [];
    const zoneTypes = [
        "boss_chamber",
        "treasure_vault",
        "cursed_hall",
        "dragon_lair",
        "arcane_sanctum",
        "shadow_den",
    ];
    const zoneDescriptions = {
        boss_chamber: "Encounter a powerful boss with high rewards",
        treasure_vault: "Find rare materials and equipment",
        cursed_hall: "Face cursed enemies with unique drops",
        dragon_lair: "Battle dragon-type enemies for legendary gear",
        arcane_sanctum: "Discover magical essences and artifacts",
        shadow_den: "Shadows hold secrets and rare resources",
    };
    const rarityBoosts = [1.3, 1.6, 2.0];
    for (let i = 0; i < pathCount; i++) {
        const zoneType = zoneTypes[Math.floor(rng() * zoneTypes.length)];
        const rarityBoost = rarityBoosts[Math.floor(rng() * rarityBoosts.length)];
        const baseDiff = getDifficultyForFloor(floor);
        // Path difficulty slightly higher than base
        const pathDifficulty = baseDiff === "easy"
            ? "normal"
            : baseDiff === "normal"
                ? "hard"
                : baseDiff === "hard"
                    ? "nightmare"
                    : "nightmare";
        paths.push({
            pathId: `path-${floor}-${i}`,
            floor,
            description: zoneDescriptions[zoneType],
            zoneType,
            difficulty: pathDifficulty,
            rarityBoost,
        });
    }
    return paths;
}
/**
 * Get special zone rewards (materials, items, gold multiplier)
 * BALANCED: Adjusted Boss Chamber and Shadow Den for zone variety
 */
export function getSpecialZoneBonus(zoneType) {
    const bonuses = {
        boss_chamber: { goldMult: 1.5, xpMult: 2.0, rarityMult: 1.5 }, // Reduced gold from 1.8
        treasure_vault: { goldMult: 2.5, xpMult: 1.5, rarityMult: 2.0 }, // Best for materials
        cursed_hall: { goldMult: 1.6, xpMult: 1.8, rarityMult: 1.4 }, // Unique drops focus
        dragon_lair: { goldMult: 2.0, xpMult: 2.2, rarityMult: 1.8 }, // Best for XP
        arcane_sanctum: { goldMult: 1.7, xpMult: 1.9, rarityMult: 1.7 }, // Boosted gold
        shadow_den: { goldMult: 1.8, xpMult: 1.7, rarityMult: 1.6 }, // Boosted gold
    };
    return bonuses[zoneType];
}
//# sourceMappingURL=dungeon.js.map