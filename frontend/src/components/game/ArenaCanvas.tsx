'use client';

import { useEffect, useRef, useState } from 'react';
import { Application, Graphics, Container } from 'pixi.js';
import { motion } from 'framer-motion';
import { Agent } from './Agent';
import { ParticleSystem } from './Particles';
import { getSoundManager } from './Sound';
import { Boss } from './Boss';
import RunEndScreen from './RunEndScreen';
import type { RunStats } from './RunEndScreen';
import ModifierSelection from './ModifierSelection';
import { Modifier, ActiveModifier } from './Modifier';
import FloorMapComponent from './FloorMap';
import { DEFAULT_SCHOOL } from './schools';
import { FloorMap, FloorMapNode } from './floorMapGenerator';
import { useAgentLoadout } from '@/stores/agentLoadout';
import BossAnnouncement from './BossAnnouncement';
import { getGameBridge } from './managers/GameBridge';
import { CombatManager } from './managers/CombatManager';
import { RunManager } from './managers/RunManager';

export interface AbilityCooldownState {
  dash: { cooldown: number; lastUsed: number; };
  blast: { cooldown: number; lastUsed: number; };
  projectile: { cooldown: number; lastUsed: number; };
  heal: { cooldown: number; lastUsed: number; };
}

export interface GameStats {
  playerHp: number; playerMaxHp: number; playerLevel: number;
  playerXP: number; playerXPToNext: number; kills: number; gold: number;
  floor: number; roomsCompleted: number; enemiesRemaining: number;
  abilities: AbilityCooldownState;
  bossHp?: number; bossMaxHp?: number;
  school?: import('./schools').SchoolConfig;
}

export interface DamageEvent { damage: number; x: number; y: number; isCrit: boolean; }

interface ArenaCanvasProps {
  width?: number; height?: number; className?: string;
  onGameStateChange?: (stats: GameStats) => void;
  onDamage?: (event: DamageEvent) => void;
  isPaused?: boolean;
}

const TILE_SIZE = 64;
const FLOOR_COLORS = [0x1a1a24, 0x181820, 0x1c1c28, 0x161622];
const WALL_THICKNESS = 16;
const WALL_COLOR = 0x2a2a3a;
const WALL_HIGHLIGHT = 0x3a3a4a;

function createArenaFloor(width: number, height: number): Container {
  const c = new Container();
  const tilesX = Math.ceil(width / TILE_SIZE);
  const tilesY = Math.ceil(height / TILE_SIZE);
  for (let y = 0; y < tilesY; y++) {
    for (let x = 0; x < tilesX; x++) {
      const tile = new Graphics();
      tile.beginFill(FLOOR_COLORS[(x + y * 7) % FLOOR_COLORS.length]);
      tile.drawRect(0, 0, TILE_SIZE - 1, TILE_SIZE - 1);
      tile.endFill();
      tile.lineStyle(1, 0x0a0a12, 0.5);
      tile.moveTo(0, TILE_SIZE - 1); tile.lineTo(TILE_SIZE - 1, TILE_SIZE - 1); tile.lineTo(TILE_SIZE - 1, 0);
      tile.x = x * TILE_SIZE; tile.y = y * TILE_SIZE;
      c.addChild(tile);
    }
  }
  return c;
}

function createArenaWalls(width: number, height: number): Container {
  const c = new Container();
  const w = new Graphics();
  w.beginFill(WALL_COLOR);
  w.drawRect(0, 0, width, WALL_THICKNESS);
  w.drawRect(0, height - WALL_THICKNESS, width, WALL_THICKNESS);
  w.drawRect(0, WALL_THICKNESS, WALL_THICKNESS, height - WALL_THICKNESS * 2);
  w.drawRect(width - WALL_THICKNESS, WALL_THICKNESS, WALL_THICKNESS, height - WALL_THICKNESS * 2);
  w.endFill();
  w.lineStyle(2, WALL_HIGHLIGHT, 0.6);
  w.drawRect(WALL_THICKNESS, WALL_THICKNESS, width - WALL_THICKNESS * 2, height - WALL_THICKNESS * 2);
  w.lineStyle(1, 0x0a0a12, 0.8);
  w.drawRect(WALL_THICKNESS + 2, WALL_THICKNESS + 2, width - WALL_THICKNESS * 2 - 4, height - WALL_THICKNESS * 2 - 4);
  c.addChild(w);
  return c;
}

export default function ArenaCanvas({
  width = 1280, height = 720, className = '',
  onGameStateChange, onDamage, isPaused = false
}: ArenaCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const isPausedRef = useRef(isPaused);

  const [isReady, setIsReady] = useState(false);
  const [runEnded, setRunEnded] = useState(false);
  const [finalRunStats, setFinalRunStats] = useState<RunStats | null>(null);
  const [showRoomClear, setShowRoomClear] = useState(false);
  const [showFloorTransition, setShowFloorTransition] = useState(false);
  const [nextFloorNumber, setNextFloorNumber] = useState(1);
  const [showModifierSelection, setShowModifierSelection] = useState(false);
  const [modifierChoices, setModifierChoices] = useState<Modifier[]>([]);
  const [showFloorMap, setShowFloorMap] = useState(false);
  const [floorMapData, setFloorMapData] = useState<FloorMap | null>(null);
  const [showBossAnnouncement, setShowBossAnnouncement] = useState(false);

  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  useEffect(() => {
    if (!containerRef.current || appRef.current) return;

    const app = new Application({
      width, height, backgroundColor: 0x0a0a12,
      resolution: window.devicePixelRatio || 1, autoDensity: true, antialias: true,
    });
    containerRef.current.appendChild(app.view as HTMLCanvasElement);
    appRef.current = app;

    app.stage.addChild(createArenaFloor(width, height));
    app.stage.addChild(createArenaWalls(width, height));

    const agent = new Agent(width / 2, height / 2, width, height, WALL_THICKNESS);
    app.stage.addChild(agent.container);

    const particles = new ParticleSystem();
    app.stage.addChild(particles.container);

    const sound = getSoundManager();

    // Mutable game state owned by closures
    const enemies: import('./Enemy').Enemy[] = [];
    let bossRef: Boss | null = null;
    const activeModifiers: ActiveModifier[] = [];
    let kills = 0;
    let gold = 0;
    const runStartTime = Date.now();

    const gameStatsRef = { current: { kills, gold, floor: 1, roomsCompleted: 0 } as any };

    const updateStats = () => {
      const stats: GameStats = {
        playerHp: agent.state.hp, playerMaxHp: agent.state.maxHp,
        playerLevel: agent.state.level, playerXP: agent.state.xp, playerXPToNext: agent.state.xpToNext,
        kills, gold, floor: runManager.getFloor(),
        roomsCompleted: runManager.getRoomsCompleted(),
        enemiesRemaining: enemies.length,
        abilities: {
          dash: { cooldown: 3000, lastUsed: agent.state.lastDashTime },
          blast: { cooldown: 6000, lastUsed: agent.state.lastBlastTime },
          projectile: { cooldown: 5000, lastUsed: agent.state.lastProjectileTime },
          heal: { cooldown: 12000, lastUsed: agent.state.lastHealTime },
        },
        school: agent.getSchoolConfig() ?? undefined,
        bossHp: bossRef?.state.hp, bossMaxHp: bossRef?.state.maxHp,
      };
      onGameStateChange?.(stats);
    };

    // ── CombatManager ──────────────────────────────────────────────────────
    const combatManager = new CombatManager({
      app,
      getAgent: () => agent,
      getEnemies: () => enemies,
      setEnemies: (next) => { enemies.length = 0; enemies.push(...next); },
      getBoss: () => bossRef,
      onEnemyKilled: () => { kills++; updateStats(); },
      onAgentDamaged: (amt) => { runManager.onAgentDamaged(amt); updateStats(); },
      onRoomCleared: () => {
        setShowRoomClear(true);
        setTimeout(() => setShowRoomClear(false), 1500);
        setTimeout(() => runManager.onRoomCleared(), 1500);
      },
      onDamageEvent: (e) => onDamage?.(e),
      onGoldCollected: (v) => { gold += v; updateStats(); },
      particles,
      sound,
      getActiveModifiers: () => activeModifiers,
      getIsTrial: () => false, // RunManager owns this — future wire-up
      onAbilityUsed: () => runManager.onAbilityUsed(),
    });

    combatManager.setupAgentCallbacks();

    // ── RunManager ─────────────────────────────────────────────────────────
    const runManager = new RunManager({
      app,
      combatManager,
      getAgent: () => agent,
      getBoss: () => bossRef,
      setBoss: (b) => { bossRef = b; },
      onFloorChange: (floor) => {
        setNextFloorNumber(floor);
        setShowFloorTransition(true);
        setShowFloorMap(false);
        setTimeout(() => setShowFloorTransition(false), 2000);
        updateStats();
      },
      onShowFloorMap: (map) => { setFloorMapData({ ...map }); setShowFloorMap(true); },
      onShowModifierSelect: (choices) => { setModifierChoices(choices); setShowModifierSelection(true); },
      onShowBossAnnouncement: () => setShowBossAnnouncement(true),
      onRunEnd: (stats) => { setFinalRunStats(stats); setRunEnded(true); },
      onDamageEvent: (e) => onDamage?.(e),
      onRoomCountChange: () => updateStats(),
      getActiveModifiers: () => activeModifiers,
      addActiveModifier: (m) => activeModifiers.push(m),
      getKills: () => kills,
      getGold: () => gold,
      runStartTime: () => runStartTime,
    });

    // ── Apply loadout ──────────────────────────────────────────────────────
    const loadout = useAgentLoadout.getState();
    agent.setSchool(loadout.school ?? DEFAULT_SCHOOL);
    loadout.disciplines.forEach(d => agent.applyDiscipline(d));
    loadout.tenets.forEach(t => agent.applyTenet(t));
    updateStats();

    // ── GameBridge handlers ────────────────────────────────────────────────
    const bridge = getGameBridge();
    bridge.on('modifier:select', (mod: Modifier) => runManager.handleModifierSelect(mod));
    bridge.on('node:select', (node: FloorMapNode) => runManager.handleNodeSelect(node));
    bridge.on('boss:start', () => runManager.startBossFight());

    runManager.start();

    // ── Game loop ──────────────────────────────────────────────────────────
    app.ticker.add((delta) => {
      particles.update();
      if (isPausedRef.current) return;

      agent.update(delta);

      // Behavior sampling for Trial floors
      const ePositions = enemies.map(e => ({ x: e.state.x, y: e.state.y }));
      runManager.sampleBehavior(agent.state.x, agent.state.y, ePositions);

      combatManager.updateCombat(delta);

      // Boss tick + boss HP in HUD
      if (bossRef && !bossRef.dead) {
        bossRef.update(delta, agent.state.x, agent.state.y);
        updateStats();
      }

      // Boss death
      if (bossRef?.dead) runManager.handleBossDead();

      // Agent death
      if (agent.state.hp <= 0) {
        app.ticker.stop();
        combatManager.setRoomTransitioning(true);
        runManager.handleRunEnd();
        return;
      }

      updateStats();
    });

    setIsReady(true);

    return () => {
      bridge.clear();
      agent.destroy();
      particles.destroy();
      combatManager.cleanup();
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true });
        appRef.current = null;
      }
    };
  }, [width, height]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <div className="text-purple-400 animate-pulse">Loading Arena...</div>
        </div>
      )}
      {showRoomClear && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-6xl font-bold text-yellow-400"
            style={{ textShadow: '0 0 30px rgba(250,204,21,0.8)' }}>ROOM CLEAR</div>
        </motion.div>
      )}
      {showFloorTransition && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/70 pointer-events-none">
          <div className="text-center">
            <div className="text-7xl font-bold text-purple-400 mb-4"
              style={{ textShadow: '0 0 40px rgba(192,132,252,0.9)' }}>DESCENDING</div>
            <div className="text-5xl font-bold text-white">FLOOR {nextFloorNumber}</div>
          </div>
        </motion.div>
      )}
      {showModifierSelection && modifierChoices.length > 0 && (
        <ModifierSelection modifiers={modifierChoices}
          onSelect={(mod) => { setShowModifierSelection(false); getGameBridge().emit('modifier:select', mod); }} />
      )}
      {showFloorMap && floorMapData && (
        <FloorMapComponent floorMap={floorMapData}
          onNodeSelect={(node) => { setShowFloorMap(false); getGameBridge().emit('node:select', node); }} />
      )}
      {showBossAnnouncement && (
        <BossAnnouncement bossName="THE WARDEN"
          onDismiss={() => { setShowBossAnnouncement(false); getGameBridge().emit('boss:start'); }} />
      )}
      {runEnded && finalRunStats && (
        <RunEndScreen stats={finalRunStats} onReturnToWarRoom={() => { window.location.href = '/dashboard'; }} />
      )}
    </div>
  );
}
