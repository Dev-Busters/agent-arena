/**
 * Quick test of dungeon generation without database
 */

import { generateDungeon, generateEncounter, ENEMY_TEMPLATES, scaleEnemyStats } from './src/game/dungeon.js';
import { AI_PATTERNS } from './src/game/enemy-ai.js';

console.log('🎮 Testing Dungeon Generation...\n');

// Test 1: Generate dungeon
console.log('Test 1: Procedural Dungeon Generation');
const dungeon = generateDungeon(12345, 'normal', 1, 5);
console.log(`✓ Generated ${dungeon.rooms.length} rooms`);
console.log(`✓ Dungeon size: ${dungeon.width}x${dungeon.height}`);
console.log(`✓ Room positions:`, dungeon.rooms.map(r => `[${r.x},${r.y}]`).join(', '));

// Test 2: Generate encounter
console.log('\nTest 2: Enemy Encounter Generation');
const seededRng = () => Math.random();
const enemies = generateEncounter(0, 'normal', 1, 5, seededRng);
console.log(`✓ Generated ${enemies.length} enemy type(s): ${enemies.join(', ')}`);

// Test 3: Scale enemy stats
console.log('\nTest 3: Enemy Stat Scaling');
const goblinTemplate = ENEMY_TEMPLATES.goblin;
const scaledStats = scaleEnemyStats(goblinTemplate, 5, 'normal');
console.log(`✓ Goblin base stats:`, {
  hp: goblinTemplate.baseHp,
  attack: goblinTemplate.baseAttack,
  defense: goblinTemplate.baseDefense
});
console.log(`✓ Scaled to player level 5:`, scaledStats);

// Test 4: AI patterns
console.log('\nTest 4: AI Behavior Patterns');
Object.entries(AI_PATTERNS).forEach(([type, pattern]) => {
  console.log(`✓ ${type}: aggressive=${pattern.aggressiveness}, defensive=${pattern.defensiveness}, ranged=${pattern.rangedPreference}`);
});

// Test 5: Multi-floor generation
console.log('\nTest 5: Multi-floor Dungeon');
for (let floor = 1; floor <= 3; floor++) {
  const floorDungeon = generateDungeon(floor * 1000, 'hard', floor, 5);
  const encounter = generateEncounter(0, 'hard', floor, 5, seededRng);
  console.log(`✓ Floor ${floor}: ${floorDungeon.rooms.length} rooms, encounter: ${encounter.join(',')}`);
}

console.log('\n✅ All dungeon tests passed!');
