'use client';

import { useEffect, useRef, useState } from 'react';
import { Application, Graphics, Container } from 'pixi.js';
import { motion } from 'framer-motion';
import { Agent } from './Agent';
import { Enemy, spawnEnemies } from './Enemy';
import { ParticleSystem } from './Particles';
import { getSoundManager } from './Sound';
import { XPOrb } from './XPOrb';
import { Loot, randomLootType } from './Loot';
import { Room, generateRooms, getRoomCount } from './Room';
import RunEndScreen from './RunEndScreen';
import type { RunStats } from './RunEndScreen';

export interface AbilityCooldownState {
  dash: { cooldown: number; lastUsed: number; };
  blast: { cooldown: number; lastUsed: number; };
  projectile: { cooldown: number; lastUsed: number; };
  heal: { cooldown: number; lastUsed: number; };
}

export interface GameStats {
  playerHp: number;
  playerMaxHp: number;
  playerLevel: number;
  playerXP: number;
  playerXPToNext: number;
  kills: number;
  floor: number;
  roomsCompleted: number;
  enemiesRemaining: number;
  abilities: AbilityCooldownState;
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

// Room configuration
const ROOM_CLEAR_DELAY_MS = 2000; // 2 seconds to show "ROOM CLEAR" before spawning next room

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
  const [runEnded, setRunEnded] = useState(false);
  const [finalRunStats, setFinalRunStats] = useState<RunStats | null>(null);
  const [showRoomClear, setShowRoomClear] = useState(false);
  const [showFloorTransition, setShowFloorTransition] = useState(false);
  const [nextFloorNumber, setNextFloorNumber] = useState(1);
  const isPausedRef = useRef(isPaused);
  const runStartTimeRef = useRef<number>(Date.now());
  const gameStatsRef = useRef<GameStats>({
    playerHp: 100,
    playerMaxHp: 100,
    playerLevel: 1,
    playerXP: 0,
    playerXPToNext: 100,
    kills: 0,
    floor: 1,
    roomsCompleted: 0,
    enemiesRemaining: 0,
    abilities: {
      dash: { cooldown: 3000, lastUsed: 0 },
      blast: { cooldown: 6000, lastUsed: 0 },
      projectile: { cooldown: 5000, lastUsed: 0 },
      heal: { cooldown: 12000, lastUsed: 0 }
    }
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
    
    // Crucible room management
    let currentFloor = 1;
    let currentRoomIndex = 0;
    let rooms: Room[] = generateRooms(currentFloor, getRoomCount(currentFloor));
    let roomTransitioning = false;
    let enemies: Enemy[] = [];
    let xpOrbs: XPOrb[] = [];
    let lootItems: Loot[] = [];
    
    // Helper to update game stats
    const updateStats = () => {
      gameStatsRef.current = {
        playerHp: agent.state.hp,
        playerMaxHp: agent.state.maxHp,
        playerLevel: agent.state.level,
        playerXP: agent.state.xp,
        playerXPToNext: agent.state.xpToNext,
        kills: gameStatsRef.current.kills,
        floor: currentFloor,
        roomsCompleted: currentRoomIndex,
        enemiesRemaining: enemies.length,
        abilities: {
          dash: { cooldown: 3000, lastUsed: agent.state.lastDashTime },
          blast: { cooldown: 6000, lastUsed: agent.state.lastBlastTime },
          projectile: { cooldown: 5000, lastUsed: agent.state.lastProjectileTime },
          heal: { cooldown: 12000, lastUsed: agent.state.lastHealTime }
        }
      };
      onGameStateChange?.(gameStatsRef.current);
    };
    
    // Function to spawn a room
    const spawnRoom = (room: Room) => {
      console.log(`🚪 Spawning Floor ${room.floor} Room ${room.roomNumber}`);
      
      // Calculate scaling based on floor number
      const hpMultiplier = 1 + (room.floor - 1) * 0.1;  // +10% HP per floor
      const damageMultiplier = 1 + (room.floor - 1) * 0.05; // +5% damage per floor
      
      console.log(`⚖️  Floor ${room.floor} scaling: HP x${hpMultiplier.toFixed(2)}, Damage x${damageMultiplier.toFixed(2)}`);
      
      // Count total enemies from all spawn types
      let totalEnemies = 0;
      const newEnemies: Enemy[] = [];
      
      room.enemySpawns.forEach(spawn => {
        const spawnedGroup = spawnEnemies(
          spawn.count,
          agent.state.x,
          agent.state.y,
          width,
          height,
          WALL_THICKNESS,
          hpMultiplier,
          damageMultiplier
        );
        newEnemies.push(...spawnedGroup);
        totalEnemies += spawn.count;
      });
      
      newEnemies.forEach(enemy => app.stage.addChild(enemy.container));
      enemies = newEnemies;
      
      updateStats();
    };
    
    // Spawn first room
    spawnRoom(rooms[currentRoomIndex]);
    
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
            const deathColor = enemy.state.type === 'charger' ? 0xff4444 :
                              enemy.state.type === 'ranger' ? 0xa855f7 : 0x22c55e;
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
    
    // Handle agent area blast (E ability)
    agent.onBlast = (px, py, range, damage) => {
      sound.playAttack();
      let hitCount = 0;
      
      enemies.forEach(enemy => {
        const dx = enemy.state.x - px;
        const dy = enemy.state.y - py;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist <= range) {
          hitCount++;
          enemy.state.hp -= damage;
          particles.hit(enemy.state.x, enemy.state.y);
          
          onDamage?.({
            damage,
            x: enemy.state.x,
            y: enemy.state.y,
            isCrit: false
          });
          
          // Check if dead
          if (enemy.state.hp <= 0) {
            gameStatsRef.current.kills++;
            sound.playDeath();
            const deathColor = enemy.state.type === 'charger' ? 0xff4444 :
                              enemy.state.type === 'ranger' ? 0xa855f7 : 0x22c55e;
            particles.burst(enemy.state.x, enemy.state.y, deathColor);
            
            const xpOrb = new XPOrb(enemy.state.x, enemy.state.y, 10);
            xpOrbs.push(xpOrb);
            app.stage.addChild(xpOrb.container);
            
            if (enemy.container) app.stage.removeChild(enemy.container);
            enemy.destroy();
          }
        }
      });
      
      console.log(`💥 Area blast hit ${hitCount} enemies!`);
      
      // Yellow explosion particle
      particles.burst(px, py, 0xffff00, 30);
      
      enemies = enemies.filter(e => e.state.hp > 0);
      updateStats();
    };
    
    // Handle agent projectile (R ability)
    agent.onProjectile = (px, py, targetX, targetY, damage) => {
      sound.playAttack();
      
      // Create simple projectile visual (orange circle moving toward target)
      const projectileGraphic = new Graphics();
      projectileGraphic.beginFill(0xff8800);
      projectileGraphic.drawCircle(0, 0, 8);
      projectileGraphic.endFill();
      projectileGraphic.x = px;
      projectileGraphic.y = py;
      app.stage.addChild(projectileGraphic);
      
      // Calculate direction
      const dx = targetX - px;
      const dy = targetY - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const vx = (dx / dist) * 10; // Speed 10
      const vy = (dy / dist) * 10;
      
      // Animate projectile
      let traveled = 0;
      const maxDist = 400; // Max range
      
      const projectileTicker = () => {
        projectileGraphic.x += vx;
        projectileGraphic.y += vy;
        traveled += 10;
        
        // Check collision with enemies
        let hit = false;
        for (const enemy of enemies) {
          const ex = enemy.state.x - projectileGraphic.x;
          const ey = enemy.state.y - projectileGraphic.y;
          const edist = Math.sqrt(ex * ex + ey * ey);
          
          if (edist < 30) {
            enemy.state.hp -= damage;
            particles.hit(enemy.state.x, enemy.state.y);
            sound.playHit();
            
            onDamage?.({
              damage,
              x: enemy.state.x,
              y: enemy.state.y,
              isCrit: false
            });
            
            if (enemy.state.hp <= 0) {
              gameStatsRef.current.kills++;
              sound.playDeath();
              const deathColor = enemy.state.type === 'charger' ? 0xff4444 :
                                enemy.state.type === 'ranger' ? 0xa855f7 : 0x22c55e;
              particles.burst(enemy.state.x, enemy.state.y, deathColor);
              
              const xpOrb = new XPOrb(enemy.state.x, enemy.state.y, 10);
              xpOrbs.push(xpOrb);
              app.stage.addChild(xpOrb.container);
              
              if (enemy.container) app.stage.removeChild(enemy.container);
              enemy.destroy();
            }
            
            hit = true;
            break;
          }
        }
        
        if (hit || traveled >= maxDist) {
          app.ticker.remove(projectileTicker);
          app.stage.removeChild(projectileGraphic);
          projectileGraphic.destroy();
          enemies = enemies.filter(e => e.state.hp > 0);
          updateStats();
        }
      };
      
      app.ticker.add(projectileTicker);
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
        
        // Check collision with agent (simple distance check)
        const dx = enemy.state.x - agent.state.x;
        const dy = enemy.state.y - agent.state.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // If enemy touches agent, deal damage (once per second per enemy)
        const collisionRange = 40; // pixels
        if (dist < collisionRange) {
          // Simple damage over time (1 damage per frame = ~60 damage per second)
          // Reduce to make it survivable: 0.5 damage per frame = ~30 damage per second
          agent.takeDamage(0.5);
          updateStats();
        }
      });
      
      // Check if agent is dead
      if (agent.state.hp <= 0 && !roomTransitioning) {
        roomTransitioning = true; // Prevent multiple triggers
        const runTime = Math.floor((Date.now() - runStartTimeRef.current) / 1000);
        
        console.log('💀 Agent FALLEN! Run ended.');
        console.log(`📊 Final Stats: Floor ${currentFloor}, Rooms ${currentRoomIndex}, Kills ${gameStatsRef.current.kills}, Time ${runTime}s`);
        
        // Set final stats for RunEndScreen
        setFinalRunStats({
          floorsReached: currentFloor,
          roomsCompleted: currentRoomIndex,
          enemiesKilled: gameStatsRef.current.kills,
          timeSeconds: runTime,
        });
        setRunEnded(true);
        
        app.ticker.stop(); // Stop game loop
        return;
      }
      
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
      
      // Check for room completion
      if (enemies.length === 0 && !roomTransitioning) {
        // Mark current room as cleared
        rooms[currentRoomIndex].cleared = true;
        roomTransitioning = true;
        
        console.log(`✅ Floor ${currentFloor} Room ${currentRoomIndex + 1} CLEAR!`);
        
        // Show "ROOM CLEAR" overlay
        setShowRoomClear(true);
        setTimeout(() => setShowRoomClear(false), 1500);
        
        // Delay before next room
        setTimeout(() => {
          currentRoomIndex++;
          
          // Check if floor is complete
          if (currentRoomIndex >= rooms.length) {
            console.log(`🎉 Floor ${currentFloor} COMPLETE!`);
            console.log(`⬇️  DESCENDING TO FLOOR ${currentFloor + 1}...`);
            
            // Show floor transition overlay
            setNextFloorNumber(currentFloor + 1);
            setShowFloorTransition(true);
            setTimeout(() => setShowFloorTransition(false), 2000);
            
            currentFloor++;
            currentRoomIndex = 0;
            rooms = generateRooms(currentFloor, getRoomCount(currentFloor));
            console.log(`📊 Floor ${currentFloor}: ${rooms.length} rooms to clear`);
          }
          
          // Spawn next room
          spawnRoom(rooms[currentRoomIndex]);
          roomTransitioning = false;
        }, ROOM_CLEAR_DELAY_MS);
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

  const handleReturnToWarRoom = () => {
    // Navigate to dashboard (or reload for now)
    window.location.href = '/dashboard';
  };

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
      
      {/* Room Clear overlay */}
      {showRoomClear && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div 
            className="text-6xl font-bold text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]"
            style={{ textShadow: '0 0 30px rgba(250, 204, 21, 0.8)' }}
          >
            ROOM CLEAR
          </div>
        </motion.div>
      )}
      
      {/* Floor Transition overlay */}
      {showFloorTransition && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 flex items-center justify-center bg-black/70 pointer-events-none"
        >
          <motion.div 
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="text-center"
          >
            <div 
              className="text-7xl font-bold text-purple-400 mb-4 drop-shadow-[0_0_30px_rgba(192,132,252,0.9)]"
              style={{ textShadow: '0 0 40px rgba(192, 132, 252, 0.9)' }}
            >
              DESCENDING
            </div>
            <div className="text-5xl font-bold text-white">
              FLOOR {nextFloorNumber}
            </div>
          </motion.div>
        </motion.div>
      )}
      
      {/* Show RunEndScreen when agent dies */}
      {runEnded && finalRunStats && (
        <RunEndScreen
          stats={finalRunStats}
          onReturnToWarRoom={handleReturnToWarRoom}
        />
      )}
    </div>
  );
}
