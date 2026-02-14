/**
 * verify.ts - Verification Script
 * 
 * Quick verification that all modules can be imported correctly.
 */

// Test all exports from index
import {
  // Types
  RoomType,
  TileType,
  Direction,
  DungeonRoom3D,
  DungeonMeshes,
  BackendDungeonData,
  
  // Classes
  DungeonGenerator,
  MaterialLibrary,
  getMaterialLibrary,
  disposeMaterialLibrary,
  FogOfWar,
  DungeonLighting,
  createDefaultLighting,
  
  // Hooks
  useDungeon3D,
  useRoomMesh,
  useFogOfWar,
  useBackendRoomConverter,
  useDungeonLighting,
} from './index';

// Verification function
export function verifyDungeon3DSystem(): boolean {
  console.log('🔍 Verifying Dungeon 3D System...');
  
  const checks = [
    { name: 'RoomType enum', value: typeof RoomType !== 'undefined' },
    { name: 'TileType enum', value: typeof TileType !== 'undefined' },
    { name: 'Direction enum', value: typeof Direction !== 'undefined' },
    { name: 'DungeonGenerator class', value: typeof DungeonGenerator === 'function' },
    { name: 'MaterialLibrary class', value: typeof MaterialLibrary === 'function' },
    { name: 'FogOfWar class', value: typeof FogOfWar === 'function' },
    { name: 'DungeonLighting class', value: typeof DungeonLighting === 'function' },
    { name: 'getMaterialLibrary function', value: typeof getMaterialLibrary === 'function' },
    { name: 'useDungeon3D hook', value: typeof useDungeon3D === 'function' },
    { name: 'useRoomMesh hook', value: typeof useRoomMesh === 'function' },
    { name: 'useFogOfWar hook', value: typeof useFogOfWar === 'function' },
    { name: 'useDungeonLighting hook', value: typeof useDungeonLighting === 'function' },
  ];

  let allPassed = true;

  checks.forEach(check => {
    const status = check.value ? '✅' : '❌';
    console.log(`${status} ${check.name}`);
    if (!check.value) allPassed = false;
  });

  if (allPassed) {
    console.log('\n✅ All verification checks passed!');
    console.log('📦 Dungeon 3D System is ready to use.');
  } else {
    console.log('\n❌ Some verification checks failed.');
  }

  return allPassed;
}

// Run verification if executed directly
if (typeof window === 'undefined' && require.main === module) {
  verifyDungeon3DSystem();
}
