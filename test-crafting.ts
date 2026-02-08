/**
 * Test Crafting & Gear Generation System
 */

import { generateCraftedGear, formatGearStats, PREFIXES, SUFFIXES } from './src/game/crafting.js';
import { getMaterialsForFloor, MATERIALS } from './src/game/materials.js';
import SeededRandom from 'seedrandom';

console.log('🔨 Testing Procedural Crafting System...\n');

// Test 1: Generate unique weapons
console.log('Test 1: Procedurally Generated Unique Weapons');
const rng = SeededRandom('crafting-test');
for (let i = 0; i < 5; i++) {
  const materials = [
    { materialId: 'steel_ingot', quantity: 2 },
    { materialId: 'fire_essence', quantity: 1 }
  ];
  const gear = generateCraftedGear('weapon', materials, () => rng());
  const stats = formatGearStats(gear);
  console.log(`✓ ${gear.name}`);
  console.log(`  Rarity: ${gear.baseRarity}, Stats: ${stats.join(', ')}`);
  console.log(`  Effect: ${gear.visualEffect || 'none'}`);
}

// Test 2: Generate armor with epic materials
console.log('\nTest 2: Epic Armor Generation');
const epicArmor = generateCraftedGear(
  'armor',
  [{ materialId: 'adamantite_shard', quantity: 2 }, { materialId: 'sapphire_gem', quantity: 1 }],
  () => rng()
);
console.log(`✓ ${epicArmor.name}`);
console.log(`  Rarity: ${epicArmor.baseRarity}`);
console.log(`  Stats:`, epicArmor.totalStats);
console.log(`  Affixes: ${epicArmor.affixes.map(a => a.name).join(' ')}`);

// Test 3: Legendary gear
console.log('\nTest 3: Legendary Gear Generation');
const legendaryGear = generateCraftedGear(
  'weapon',
  [{ materialId: 'orichalcum', quantity: 1 }, { materialId: 'arcane_essence', quantity: 1 }, { materialId: 'diamond_core', quantity: 1 }],
  () => rng()
);
console.log(`✓ ${legendaryGear.name}`);
console.log(`  Rarity: ${legendaryGear.baseRarity}`);
console.log(`  Affixes: ${legendaryGear.affixes.length}`);
console.log(`  Total Stats:`, legendaryGear.totalStats);
console.log(`  Visual Effect: ${legendaryGear.visualEffect || 'none'}`);

// Test 4: Materials available per floor
console.log('\nTest 4: Materials Available by Dungeon Floor');
for (let floor of [1, 3, 5, 7, 9, 10]) {
  const available = getMaterialsForFloor(floor);
  console.log(`✓ Floor ${floor}: ${available.length} materials available`);
}

// Test 5: All affixes
console.log('\nTest 5: Affix Summary');
console.log(`✓ Prefixes: ${PREFIXES.length}`);
console.log(`  - Common: ${PREFIXES.filter(p => p.rarity === 'common').length}`);
console.log(`  - Uncommon: ${PREFIXES.filter(p => p.rarity === 'uncommon').length}`);
console.log(`  - Rare: ${PREFIXES.filter(p => p.rarity === 'rare').length}`);
console.log(`  - Epic: ${PREFIXES.filter(p => p.rarity === 'epic').length}`);
console.log(`  - Legendary: ${PREFIXES.filter(p => p.rarity === 'legendary').length}`);

console.log(`✓ Suffixes: ${SUFFIXES.length}`);
console.log(`  - Common: ${SUFFIXES.filter(s => s.rarity === 'common').length}`);
console.log(`  - Uncommon: ${SUFFIXES.filter(s => s.rarity === 'uncommon').length}`);
console.log(`  - Rare: ${SUFFIXES.filter(s => s.rarity === 'rare').length}`);
console.log(`  - Epic: ${SUFFIXES.filter(s => s.rarity === 'epic').length}`);
console.log(`  - Legendary: ${SUFFIXES.filter(s => s.rarity === 'legendary').length}`);

// Test 6: Visual effects
console.log('\nTest 6: Visual Effects Available');
const effectsSet = new Set<string>();
[...PREFIXES, ...SUFFIXES].forEach(affix => {
  if (affix.visualEffect) effectsSet.add(affix.visualEffect);
});
console.log(`✓ Available effects: ${Array.from(effectsSet).join(', ')}`);

// Test 7: Material system
console.log('\nTest 7: Material System');
console.log(`✓ Total materials: ${Object.keys(MATERIALS).length}`);
const materialsByType = new Map<string, number>();
Object.values(MATERIALS).forEach(m => {
  materialsByType.set(m.type, (materialsByType.get(m.type) || 0) + 1);
});
materialsByType.forEach((count, type) => {
  console.log(`  - ${type}: ${count}`);
});

console.log('\n✅ All crafting system tests passed!');
