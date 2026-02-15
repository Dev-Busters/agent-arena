/**
 * Room Themes & Biomes for Procedural Dungeons
 * Defines visual styles, hazards, and special features per room type
 */

import * as THREE from 'three';

export enum RoomType {
  NORMAL = 'normal',
  TREASURE = 'treasure',
  TRAP = 'trap',
  BOSS = 'boss',
  MERCHANT = 'merchant',
  SHRINE = 'shrine',
  CHALLENGE = 'challenge',
}

export enum BiomeType {
  CAVE = 'cave',
  CRYPT = 'crypt',
  LAVA = 'lava',
  ICE = 'ice',
  FOREST = 'forest',
}

export interface RoomTheme {
  type: RoomType;
  biome: BiomeType;
  
  // Visual styling
  floorColor: number;
  wallColor: number;
  ceilingColor: number;
  ambientLight: number;
  ambientIntensity: number;
  
  // Atmosphere
  fogColor: number;
  fogDensity: number;
  
  // Special features
  hasGlow: boolean;
  glowColor?: number;
  glowIntensity?: number;
  
  // Particle effects
  particleType?: 'dust' | 'embers' | 'mist' | 'sparkles' | 'snow';
  particleDensity?: number;
  
  // Hazards
  hazards?: string[];
}

/**
 * Biome-specific base colors and atmosphere
 */
const BIOME_CONFIGS: Record<BiomeType, Partial<RoomTheme>> = {
  [BiomeType.CAVE]: {
    floorColor: 0x3a3528,
    wallColor: 0x4a4238,
    ceilingColor: 0x2a2520,
    ambientLight: 0x6a5c42,
    ambientIntensity: 0.3,
    fogColor: 0x1a1510,
    fogDensity: 0.015,
    particleType: 'dust',
    particleDensity: 0.3,
  },
  
  [BiomeType.CRYPT]: {
    floorColor: 0x2c2c38,
    wallColor: 0x3c3c48,
    ceilingColor: 0x1c1c28,
    ambientLight: 0x4a4a6a,
    ambientIntensity: 0.25,
    fogColor: 0x0a0a18,
    fogDensity: 0.02,
    particleType: 'mist',
    particleDensity: 0.4,
  },
  
  [BiomeType.LAVA]: {
    floorColor: 0x4a1a0a,
    wallColor: 0x3a2010,
    ceilingColor: 0x2a1008,
    ambientLight: 0xff4400,
    ambientIntensity: 0.4,
    fogColor: 0x200a00,
    fogDensity: 0.01,
    hasGlow: true,
    glowColor: 0xff2200,
    glowIntensity: 0.6,
    particleType: 'embers',
    particleDensity: 0.5,
  },
  
  [BiomeType.ICE]: {
    floorColor: 0xd0e8ff,
    wallColor: 0xb0c8e8,
    ceilingColor: 0x90a8c8,
    ambientLight: 0xccddff,
    ambientIntensity: 0.5,
    fogColor: 0xaaccff,
    fogDensity: 0.008,
    hasGlow: true,
    glowColor: 0x88ccff,
    glowIntensity: 0.3,
    particleType: 'snow',
    particleDensity: 0.4,
  },
  
  [BiomeType.FOREST]: {
    floorColor: 0x2a3a1a,
    wallColor: 0x3a4a2a,
    ceilingColor: 0x1a2a0a,
    ambientLight: 0x6a8a4a,
    ambientIntensity: 0.35,
    fogColor: 0x0a1a00,
    fogDensity: 0.012,
    particleType: 'mist',
    particleDensity: 0.3,
  },
};

/**
 * Room type specific modifications
 */
const ROOM_TYPE_MODIFIERS: Record<RoomType, Partial<RoomTheme>> = {
  [RoomType.NORMAL]: {
    // Use biome defaults
  },
  
  [RoomType.TREASURE]: {
    hasGlow: true,
    glowColor: 0xffcc00,
    glowIntensity: 0.5,
    particleType: 'sparkles',
    particleDensity: 0.6,
    ambientIntensity: 0.4,
  },
  
  [RoomType.TRAP]: {
    ambientLight: 0x8a2a2a,
    ambientIntensity: 0.2,
    fogDensity: 0.025,
    hazards: ['spike_trap', 'poison_gas', 'arrow_trap'],
  },
  
  [RoomType.BOSS]: {
    ambientIntensity: 0.5,
    fogDensity: 0.03,
    hasGlow: true,
    glowColor: 0xff00ff,
    glowIntensity: 0.7,
    particleType: 'mist',
    particleDensity: 0.8,
  },
  
  [RoomType.MERCHANT]: {
    ambientLight: 0xffeecc,
    ambientIntensity: 0.6,
    fogDensity: 0.005,
    particleType: 'sparkles',
    particleDensity: 0.2,
  },
  
  [RoomType.SHRINE]: {
    hasGlow: true,
    glowColor: 0x00ffff,
    glowIntensity: 0.6,
    ambientIntensity: 0.45,
    particleType: 'sparkles',
    particleDensity: 0.5,
  },
  
  [RoomType.CHALLENGE]: {
    ambientLight: 0xffaa00,
    ambientIntensity: 0.4,
    fogDensity: 0.02,
    hasGlow: true,
    glowColor: 0xff8800,
    glowIntensity: 0.5,
  },
};

/**
 * Generate complete room theme from type and biome
 */
export function createRoomTheme(type: RoomType, biome: BiomeType): RoomTheme {
  const biomeConfig = BIOME_CONFIGS[biome];
  const typeModifier = ROOM_TYPE_MODIFIERS[type];
  
  return {
    type,
    biome,
    floorColor: typeModifier.floorColor || biomeConfig.floorColor || 0x3a3528,
    wallColor: typeModifier.wallColor || biomeConfig.wallColor || 0x4a4238,
    ceilingColor: typeModifier.ceilingColor || biomeConfig.ceilingColor || 0x2a2520,
    ambientLight: typeModifier.ambientLight || biomeConfig.ambientLight || 0x6a5c42,
    ambientIntensity: typeModifier.ambientIntensity ?? biomeConfig.ambientIntensity ?? 0.3,
    fogColor: typeModifier.fogColor || biomeConfig.fogColor || 0x1a1510,
    fogDensity: typeModifier.fogDensity ?? biomeConfig.fogDensity ?? 0.015,
    hasGlow: typeModifier.hasGlow ?? biomeConfig.hasGlow ?? false,
    glowColor: typeModifier.glowColor || biomeConfig.glowColor,
    glowIntensity: typeModifier.glowIntensity ?? biomeConfig.glowIntensity,
    particleType: typeModifier.particleType || biomeConfig.particleType,
    particleDensity: typeModifier.particleDensity ?? biomeConfig.particleDensity,
    hazards: typeModifier.hazards,
  };
}

/**
 * Determine room type from backend data or procedurally
 */
export function determineRoomType(room: any, depth: number): RoomType {
  // Check backend metadata first
  if (room.metadata?.type) {
    return room.metadata.type as RoomType;
  }
  
  // Procedural assignment based on room properties
  if (room.isBossRoom) return RoomType.BOSS;
  if (room.isTreasureRoom) return RoomType.TREASURE;
  if (room.hasMerchant) return RoomType.MERCHANT;
  
  // Random special rooms (weighted by depth)
  const rand = Math.random();
  const depthFactor = Math.min(depth / 20, 1); // More special rooms at deeper floors
  
  if (rand < 0.05 + depthFactor * 0.05) return RoomType.SHRINE;
  if (rand < 0.10 + depthFactor * 0.10) return RoomType.CHALLENGE;
  if (rand < 0.15 + depthFactor * 0.05) return RoomType.TRAP;
  if (rand < 0.20 + depthFactor * 0.05) return RoomType.TREASURE;
  
  return RoomType.NORMAL;
}

/**
 * Determine biome from depth
 */
export function determineBiomeFromDepth(depth: number): BiomeType {
  // Biomes change every 5-10 floors
  const biomeIndex = Math.floor(depth / 7);
  const biomes = [
    BiomeType.CAVE,
    BiomeType.CRYPT,
    BiomeType.LAVA,
    BiomeType.ICE,
    BiomeType.FOREST,
  ];
  
  return biomes[biomeIndex % biomes.length];
}

/**
 * Apply theme to Three.js materials
 */
export function applyThemeToMaterials(
  materials: {
    floor?: THREE.Material;
    wall?: THREE.Material;
    ceiling?: THREE.Material;
  },
  theme: RoomTheme
): void {
  if (materials.floor && materials.floor instanceof THREE.MeshStandardMaterial) {
    materials.floor.color.setHex(theme.floorColor);
    if (theme.hasGlow) {
      materials.floor.emissive.setHex(theme.glowColor || 0x000000);
      materials.floor.emissiveIntensity = theme.glowIntensity || 0;
    }
  }
  
  if (materials.wall && materials.wall instanceof THREE.MeshStandardMaterial) {
    materials.wall.color.setHex(theme.wallColor);
  }
  
  if (materials.ceiling && materials.ceiling instanceof THREE.MeshStandardMaterial) {
    materials.ceiling.color.setHex(theme.ceilingColor);
  }
}
