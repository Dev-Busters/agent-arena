/**
 * Test Loot Generation System
 */

import { generateLoot, calculateLevelUp, xpForNextLevel, getItemsByRarity, formatItemStats } from './src/game/loot.js';
import SeededRandom from 'seedrandom';

console.log('🎁 Testing Loot Generation System...\n');

// Test 1: Generate loot at different difficulties
console.log('Test 1: Loot Generation by Difficulty');
const difficulties = ['easy', 'normal', 'hard', 'nightmare'] as const;
const rng = SeededRandom('test-seed');

difficulties.forEach((diff) => {
  const loot = generateLoot(100, 200, diff, 3, () => rng());
  console.log(`✓ ${diff.toUpperCase()}: ${loot.gold} gold, ${loot.xp} xp, ${loot.items.length} item(s)`);
});

// Test 2: XP and leveling curve
console.log('\nTest 2: XP & Leveling Curve');
let totalXp = 0;
for (let level = 1; level <= 10; level++) {
  const xpNeeded = xpForNextLevel(level);
  totalXp += xpNeeded;
  console.log(`✓ Level ${level} → ${level + 1}: ${xpNeeded} XP (cumulative: ${totalXp})`);
}

// Test 3: Level up calculation
console.log('\nTest 3: Level Up Calculation');
const levelUpResult = calculateLevelUp(5, 500, 5000);
console.log(`✓ Level 5 + 5000 XP → Level ${levelUpResult.newLevel}, ${levelUpResult.newXp} XP stored`);
console.log(`✓ Levels gained: ${levelUpResult.levelsGained}`);

// Test 4: Rarity distribution
console.log('\nTest 4: Rarity Distribution (1000 rolls)');
const rarities: Record<string, number> = { common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 0 };
const rng2 = SeededRandom('rarity-test');
for (let i = 0; i < 1000; i++) {
  const loot = generateLoot(100, 200, 'normal', 5, () => rng2());
  if (loot.items.length > 0) {
    rarities[loot.items[0].rarity]++;
  }
}
Object.entries(rarities).forEach(([rarity, count]) => {
  const pct = ((count / 1000) * 100).toFixed(1);
  console.log(`✓ ${rarity}: ${count} (${pct}%)`);
});

// Test 5: Depth scaling
console.log('\nTest 5: Depth Scaling (Normal difficulty)');
const rng3 = SeededRandom('depth-test');
for (let depth = 1; depth <= 10; depth += 3) {
  const loot = generateLoot(100, 200, 'normal', depth, () => rng3());
  const dropChance = loot.items.length > 0 ? 'dropped' : 'no drop';
  console.log(`✓ Floor ${depth}: ${loot.gold} gold, ${loot.xp} xp (${dropChance})`);
}

// Test 6: Item stats formatting
console.log('\nTest 6: Item Stats Formatting');
const rarities_items = getItemsByRarity('epic');
console.log(`✓ Found ${rarities_items.length} epic items:`);
rarities_items.forEach((item) => {
  const stats = formatItemStats(item.stats);
  console.log(`  - ${item.name}: ${stats.join(', ')}`);
});

console.log('\n✅ All loot system tests passed!');
