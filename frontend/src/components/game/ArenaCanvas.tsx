'use client';

import { useEffect, useRef, useState } from 'react';
import { Application, Graphics, Container } from 'pixi.js';
import { Player } from './Player';
import { Enemy, spawnEnemies } from './Enemy';
import { ParticleSystem } from './Particles';
import { getSoundManager } from './Sound';

export interface GameStats {
  playerHp: number;
  playerMaxHp: number;
  kills: number;
  wave: number;
  enemiesRemaining: number;
}

interface ArenaCanvasProps {
  width?: number;
  height?: number;
  className?: string;
  onGameStateChange?: (stats: GameStats) => void;
  isPaused?: boolean;
}

// Floor tile configuration
const TILE_SIZE = 64;
const FLOOR_COLORS = [0x1a1a24, 0x181820, 0x1c1c28, 0x161622]; // Dark stone variations
const WALL_THICKNESS = 16;
const WALL_COLOR = 0x2a2a3a;
const WALL_HIGHLIGHT = 0x3a3a4a;

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
  isPaused = false
}: ArenaCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const [isReady, setIsReady] = useState(false);
  const isPausedRef = useRef(isPaused);
  const gameStatsRef = useRef<GameStats>({
    playerHp: 100,
    playerMaxHp: 100,
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
    
    // Create player at center of arena
    const player = new Player(width / 2, height / 2, width, height, WALL_THICKNESS);
    app.stage.addChild(player.container);
    
    // Create particle system
    const particles = new ParticleSystem();
    app.stage.addChild(particles.container);
    
    // Spawn enemies
    let enemies = spawnEnemies(3, width / 2, height / 2, width, height, WALL_THICKNESS);
    enemies.forEach(enemy => app.stage.addChild(enemy.container));
    
    // Helper to update game stats
    const updateStats = () => {
      gameStatsRef.current = {
        playerHp: 100, // TODO: Add player HP tracking
        playerMaxHp: 100,
        kills: gameStatsRef.current.kills,
        wave: gameStatsRef.current.wave,
        enemiesRemaining: enemies.length
      };
      onGameStateChange?.(gameStatsRef.current);
    };
    
    // Sound manager
    const sound = getSoundManager();
    
    // Handle player attacks
    player.onAttack = (px, py, range, damage) => {
      sound.playAttack();
      
      enemies.forEach(enemy => {
        const dx = enemy.state.x - px;
        const dy = enemy.state.y - py;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist <= range) {
          enemy.state.hp -= damage;
          console.log(`⚔️ Hit ${enemy.state.type} for ${damage}! HP: ${enemy.state.hp}/${enemy.state.maxHp}`);
          
          // Hit effect and sound
          particles.hit(enemy.state.x, enemy.state.y);
          sound.playHit();
          
          // Flash enemy (scale effect as visual feedback)
          enemy.container.scale.set(1.3);
          setTimeout(() => {
            enemy.container.scale.set(1.0);
          }, 100);
          
          // Check if dead
          if (enemy.state.hp <= 0) {
            console.log(`💀 ${enemy.state.type} defeated!`);
            gameStatsRef.current.kills++;
            sound.playDeath();
            
            // Death burst effect
            const deathColor = enemy.state.type === 'goblin' ? 0x44aa44 :
                              enemy.state.type === 'demon' ? 0xaa4444 : 0xaaaaaa;
            particles.burst(enemy.state.x, enemy.state.y, deathColor);
            
            app.stage.removeChild(enemy.container);
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
    app.ticker.add(() => {
      // Always update particles (even when paused for visual continuity)
      particles.update();
      
      // Skip game updates when paused
      if (isPausedRef.current) return;
      
      player.update();
      
      // Update enemies to chase player
      enemies.forEach(enemy => {
        enemy.update(player.state.x, player.state.y);
      });
    });
    
    setIsReady(true);
    console.log('🎮 ArenaCanvas initialized with player and', enemies.length, 'enemies');

    // Cleanup on unmount
    return () => {
      if (appRef.current) {
        console.log('🎮 ArenaCanvas destroyed');
        player.destroy();
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
