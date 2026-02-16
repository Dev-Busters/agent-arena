'use client';

import { useEffect, useRef, useState } from 'react';
import { Application, Graphics, Container } from 'pixi.js';
import { Agent } from './Agent';
import { Enemy, spawnEnemies } from './Enemy';
import { ParticleSystem } from './Particles';
import { getSoundManager } from './Sound';
import { XPOrb } from './XPOrb';
import { Loot, randomLootType } from './Loot';

export interface GameStats {
  playerHp: number;
  playerMaxHp: number;
  playerLevel: number;
  playerXP: number;
  playerXPToNext: number;
  kills: number;
  wave: number;
  enemiesRemaining: number;
}

export interface DamageEvent {
  damage: number;
  x: number;
  y: number;
  isCrit: boolean;
}

interface ArenaCanvasProps {
  width?: number;
  height?: number;
  className?: string;
  onGameStateChange?: (stats: GameStats) => void;
  onDamage?: (event: DamageEvent) => void;
  isPaused?: boolean;
}

// Floor tile configuration
const TILE_SIZE = 64;
const FLOOR_COLORS = [0x1a1a24, 0x181820, 0x1c1c28, 0x161622]; // Dark stone variations
const WALL_THICKNESS = 16;
const WALL_COLOR = 0x2a2a3a;
const WALL_HIGHLIGHT = 0x3a3a4a;

// Wave configuration
const WAVES = [
  { wave: 1, count: 3, delay: 0 },      // Starting wave
  { wave: 2, count: 5, delay: 3000 },   // 3s delay after wave 1
  { wave: 3, count: 7, delay: 3000 },
  { wave: 4, count: 9, delay: 3000 },
  { wave: 5, count: 12, delay: 3000 },  // Gets harder
];
const WAVE_DELAY_MS = 3000;

/**
 * Creates the arena floor with tiled pattern
 */
function createArenaFloor(width: number, height: number): Container {
  const floorContainer = new Container();
  
  const tilesX = Math.ceil(width / TILE_SIZE);
  const tilesY = Math.ceil(height / TILE_SIZE);
  
  for (let y = 0; y < tilesY; y++) {
    for (let x = 0; x < tilesX; x++) {
      const tile = new Graphics();
      
      // Pick a random dark color for variation
      const colorIndex = (x + y * 7) % FLOOR_COLORS.length;
      const color = FLOOR_COLORS[colorIndex];
      
      // Draw tile
      tile.beginFill(color);
      tile.drawRect(0, 0, TILE_SIZE - 1, TILE_SIZE - 1); // -1 for grid gap
      tile.endFill();
      
      // Add subtle border/crack effect
      tile.lineStyle(1, 0x0a0a12, 0.5);
      tile.moveTo(0, TILE_SIZE - 1);
      tile.lineTo(TILE_SIZE - 1, TILE_SIZE - 1);
      tile.lineTo(TILE_SIZE - 1, 0);
      
      tile.x = x * TILE_SIZE;
      tile.y = y * TILE_SIZE;
      
      floorContainer.addChild(tile);
    }
  }
  
  console.log('🎮 Arena floor rendered:', tilesX * tilesY, 'tiles');
  return floorContainer;
}

/**
 * Creates arena boundary walls
 */
function createArenaWalls(width: number, height: number): Container {
  const wallContainer = new Container();
  const walls = new Graphics();
  
  // Main wall fill
  walls.beginFill(WALL_COLOR);
  
  // Top wall
  walls.drawRect(0, 0, width, WALL_THICKNESS);
  // Bottom wall
  walls.drawRect(0, height - WALL_THICKNESS, width, WALL_THICKNESS);
  // Left wall
  walls.drawRect(0, WALL_THICKNESS, WALL_THICKNESS, height - WALL_THICKNESS * 2);
  // Right wall
  walls.drawRect(width - WALL_THICKNESS, WALL_THICKNESS, WALL_THICKNESS, height - WALL_THICKNESS * 2);
  
  walls.endFill();
  
  // Add inner highlight/bevel effect
  walls.lineStyle(2, WALL_HIGHLIGHT, 0.6);
  walls.drawRect(WALL_THICKNESS, WALL_THICKNESS, width - WALL_THICKNESS * 2, height - WALL_THICKNESS * 2);
  
  // Add dark inner shadow
  walls.lineStyle(1, 0x0a0a12, 0.8);
  walls.drawRect(WALL_THICKNESS + 2, WALL_THICKNESS + 2, width - WALL_THICKNESS * 2 - 4, height - WALL_THICKNESS * 2 - 4);
  
  wallContainer.addChild(walls);
  console.log('🎮 Arena walls rendered');
  return wallContainer;
}

/**
 * ArenaCanvas - Main PixiJS rendering canvas for Agent Arena
 * 
 * Phase A-1: Basic canvas setup ✅
 * Phase A-2: Arena floor with tiled pattern ✅
 * Phase A-3: Arena boundary walls ✅
 */
export default function ArenaCanvas({ 
  width = 1280, 
  height = 720,
  className = '',
  onGameStateChange,
  onDamage,
  isPaused = false
}: ArenaCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const [isReady, setIsReady] = useState(false);
  const isPausedRef = useRef(isPaused);
  const gameStatsRef = useRef<GameStats>({
    playerHp: 100,
    playerMaxHp: 100,
    playerLevel: 1,
    playerXP: 0,
    playerXPToNext: 100,
    kills: 0,
    wave: 1,
    enemiesRemaining: 3
  });
  
  // Keep pause ref in sync
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    if (!containerRef.current || appRef.current) return;

    // Create PixiJS Application (v7 synchronous API)
    const app = new Application({
      width,
      height,
      backgroundColor: 0x0a0a12,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
    });

    // Append canvas to container
    containerRef.current.appendChild(app.view as HTMLCanvasElement);
    appRef.current = app;
    
    // Add arena floor
    const floor = createArenaFloor(width, height);
    app.stage.addChild(floor);
    
    // Add arena walls (on top of floor)
    const walls = createArenaWalls(width, height);
    app.stage.addChild(walls);
    
    // Create agent at center of arena
    const agent = new Agent(width / 2, height / 2, width, height, WALL_THICKNESS);
    app.stage.addChild(agent.container);
    
    // Create particle system
    const particles = new ParticleSystem();
    app.stage.addChild(particles.container);
    
    // Wave management
    let currentWaveIndex = 0;
    let waveTransitioning = false;
    let enemies: Enemy[] = [];
    let xpOrbs: XPOrb[] = [];
    let lootItems: Loot[] = [];
    
    // Helper to update game stats (defined before spawnWave uses it)
    const updateStats = () => {
      gameStatsRef.current = {
        playerHp: agent.state.hp, // Agent's current HP
        playerMaxHp: agent.state.maxHp,
        playerLevel: agent.state.level,
        playerXP: agent.state.xp,
        playerXPToNext: agent.state.xpToNext,
        kills: gameStatsRef.current.kills,
        wave: gameStatsRef.current.wave,
        enemiesRemaining: enemies.length
      };
      onGameStateChange?.(gameStatsRef.current);
    };
    
    // Function to spawn a wave
    const spawnWave = (waveIndex: number) => {
      if (waveIndex >= WAVES.length) {
        console.log('🎉 All waves complete!');
        return;
      }
      
      const waveConfig = WAVES[waveIndex];
      console.log(`🌊 Spawning Wave ${waveConfig.wave} (${waveConfig.count} enemies)`);
      
      const newEnemies = spawnEnemies(
        waveConfig.count,
        agent.state.x,
        agent.state.y,
        width,
        height,
        WALL_THICKNESS
      );
      
      newEnemies.forEach(enemy => app.stage.addChild(enemy.container));
      enemies = newEnemies;
      
      gameStatsRef.current.wave = waveConfig.wave;
      updateStats();
    };
    
    // Spawn first wave
    spawnWave(0);
    
    // Sound manager
    const sound = getSoundManager();
    
    // Handle agent attacks
    agent.onAttack = (px, py, range, damage) => {
      sound.playAttack();
      
      enemies.forEach(enemy => {
        const dx = enemy.state.x - px;
        const dy = enemy.state.y - py;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist <= range) {
          // Crit chance (10%)
          const isCrit = Math.random() < 0.1;
          const finalDamage = isCrit ? damage * 2 : damage;
          
          enemy.state.hp -= finalDamage;
          console.log(`⚔️ Hit ${enemy.state.type} for ${finalDamage}${isCrit ? ' (CRIT)' : ''}! HP: ${enemy.state.hp}/${enemy.state.maxHp}`);
          
          // Trigger damage number
          onDamage?.({ 
            damage: finalDamage, 
            x: enemy.state.x, 
            y: enemy.state.y, 
            isCrit 
          });
          
          // Hit effect and sound
          particles.hit(enemy.state.x, enemy.state.y);
          sound.playHit();
          
          // Check if dead
          if (enemy.state.hp <= 0) {
            console.log(`💀 ${enemy.state.type} defeated!`);
            gameStatsRef.current.kills++;
            sound.playDeath();
            
            // Death burst effect
            const deathColor = enemy.state.type === 'goblin' ? 0x44aa44 :
                              enemy.state.type === 'demon' ? 0xaa4444 : 0xaaaaaa;
            particles.burst(enemy.state.x, enemy.state.y, deathColor);
            
            // Spawn XP orb
            const xpOrb = new XPOrb(enemy.state.x, enemy.state.y, 10);
            xpOrbs.push(xpOrb);
            app.stage.addChild(xpOrb.container);
            
            // 20% chance to drop loot
            if (Math.random() < 0.2) {
              const loot = new Loot(enemy.state.x, enemy.state.y, randomLootType());
              lootItems.push(loot);
              app.stage.addChild(loot.container);
              console.log(`💎 Loot dropped: ${loot.getName()}`);
            }
            
            if (enemy.container) {
              app.stage.removeChild(enemy.container);
            }
            enemy.destroy();
          }
        }
      });
      
      // Remove dead enemies from array
      enemies = enemies.filter(e => e.state.hp > 0);
      updateStats();
    };
    
    // Initial stats
    updateStats();
    
    // Game loop
    app.ticker.add((delta) => {
      // Always update particles (even when paused for visual continuity)
      particles.update();
      
      // Skip game updates when paused
      if (isPausedRef.current) return;
      
      // Update agent with enemies list (for AI targeting)
      agent.setEnemies(enemies);
      agent.update(delta.deltaTime);
      
      // Update enemies to chase agent
      enemies.forEach(enemy => {
        enemy.update(agent.state.x, agent.state.y);
      });
      
      // Update XP orbs
      for (let i = xpOrbs.length - 1; i >= 0; i--) {
        const orb = xpOrbs[i];
        orb.setTarget(agent.state.x, agent.state.y);
        
        if (orb.update()) {
          // Orb collected
          const leveledUp = agent.gainXP(orb.getValue());
          
          if (leveledUp) {
            console.log(`⭐ Agent Level ${agent.state.level}! HP:${agent.state.maxHp} ATK:${agent.state.attack} DEF:${agent.state.defense}`);
            // TODO: Add screen flash effect
          }
          
          app.stage.removeChild(orb.container);
          orb.destroy();
          xpOrbs.splice(i, 1);
        }
      }
      
      // Update loot items
      for (let i = lootItems.length - 1; i >= 0; i--) {
        const loot = lootItems[i];
        
        if (loot.update(agent.state.x, agent.state.y)) {
          // Loot collected
          console.log(`📦 Collected: ${loot.getName()} (${loot.getEffect()})`);
          // TODO: Apply loot effects
          
          app.stage.removeChild(loot.container);
          loot.destroy();
          lootItems.splice(i, 1);
        }
      }
      
      // Check for wave completion
      if (enemies.length === 0 && !waveTransitioning && currentWaveIndex < WAVES.length) {
        waveTransitioning = true;
        console.log(`✅ Wave ${WAVES[currentWaveIndex].wave} complete!`);
        
        // Delay before next wave
        setTimeout(() => {
          currentWaveIndex++;
          if (currentWaveIndex < WAVES.length) {
            spawnWave(currentWaveIndex);
          }
          waveTransitioning = false;
        }, WAVE_DELAY_MS);
      }
    });
    
    setIsReady(true);
    console.log('🎮 ArenaCanvas initialized with agent and', enemies.length, 'enemies');

    // Cleanup on unmount
    return () => {
      if (appRef.current) {
        console.log('🎮 ArenaCanvas destroyed');
        agent.destroy();
        enemies.forEach(enemy => enemy.destroy());
        particles.destroy();
        appRef.current.destroy(true, { children: true, texture: true });
        appRef.current = null;
      }
    };
  }, [width, height]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!appRef.current || !containerRef.current) return;
      
      const container = containerRef.current;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      
      appRef.current.renderer.resize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <div className="text-purple-400 animate-pulse">Loading Arena...</div>
        </div>
      )}
    </div>
  );
}
