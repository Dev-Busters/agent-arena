import { Application } from 'pixi.js';
import { Agent } from '../Agent';
import { Boss } from '../Boss';
import { FloorMapNode, FloorMap, generateFloorMap, updateMapAfterClear } from '../floorMapGenerator';
import { Modifier, ActiveModifier, getRandomModifiers, applyModifier } from '../Modifier';
import { generateRoomForNodeType, BehaviorProfile } from '../Room';
import { DEFAULT_SCHOOL } from '../schools';
import { useAgentLoadout, calculateRunXP } from '@/stores/agentLoadout';
import type { DamageEvent } from '../ArenaCanvas';
import type { RunStats } from '../RunEndScreen';
import type { CombatManager } from './CombatManager';
import { findNearestUnlock } from '@/stores/agentLoadout';

export interface RunManagerDeps {
  app: Application;
  combatManager: CombatManager;
  getAgent: () => Agent | null;
  getBoss: () => Boss | null;
  setBoss: (boss: Boss | null) => void;
  onFloorChange: (floor: number) => void;
  onShowFloorMap: (map: FloorMap) => void;
  onShowModifierSelect: (modifiers: Modifier[]) => void;
  onShowBossAnnouncement: () => void;
  onRunEnd: (stats: RunStats) => void;
  onDamageEvent: (event: DamageEvent) => void;
  onRoomCountChange: (n: number) => void;
  getActiveModifiers: () => ActiveModifier[];
  addActiveModifier: (m: ActiveModifier) => void;
  getKills: () => number;
  getGold: () => number;
  getValor: () => number;
  getAsh: () => number;
  getEmber: () => number;
  onShowShop: (valorAmount: number) => void;
  onShopClose: (remainingValor: number) => void;
  runStartTime: () => number;
}

export class RunManager {
  private deps: RunManagerDeps;
  private floor = 1;
  private roomsCompleted = 0;
  private floorMap: FloorMap | null = null;
  private currentNodeId: string | null = null;
  private modCategoriesUsed = new Set<string>();
  private behaviorFrameCount = 0;
  private distanceSamples: number[] = [];
  private abilitiesUsed = 0;
  private damageThisRun = 0;
  private valor = 0;
  private ashThisRun = 0;
  private emberThisRun = 0;
  private fragmentsThisRun = { iron: 0, arc: 0, edge: 0 };
  private materialsThisRun: { materialId: string; qty: number }[] = [];
  private gearDropsThisRun: import('@/components/game/gear').GearItem[] = [];
  private arenaMarksThisRun = 0;
  private _pendingEliteEmber = 0;
  private doctrineXPThisRun = { iron: 0, arc: 0, edge: 0 };

  constructor(deps: RunManagerDeps) {
    this.deps = deps;
  }

  /** Call on run start — generate floor 1 map and show it */
  start(): void {
    const map = generateFloorMap(this.floor);
    this.floorMap = map;
    this.deps.onShowFloorMap(map);
  }

  /** Called every tick when enemies are visible — tracks agent behavior for Trial floors */
  sampleBehavior(agentX: number, agentY: number, enemyPositions: { x: number; y: number }[]): void {
    this.behaviorFrameCount++;
    if (enemyPositions.length === 0 || this.behaviorFrameCount % 10 !== 0) return;
    let nearestDist = Infinity;
    enemyPositions.forEach(e => {
      const dx = e.x - agentX; const dy = e.y - agentY;
      nearestDist = Math.min(nearestDist, Math.sqrt(dx * dx + dy * dy));
    });
    if (nearestDist < Infinity) this.distanceSamples.push(nearestDist);
    if (this.distanceSamples.length > 200) this.distanceSamples.shift();
  }

  onAbilityUsed(): void { this.abilitiesUsed++; }
  onAgentDamaged(amount: number): void { this.damageThisRun += amount; }
  onValorEarned(amount: number): void { this.valor += amount; }
  onAshEarned(amount: number): void { this.ashThisRun += amount; }
  onEmberEarned(amount: number): void { this.emberThisRun += amount; }
  onFragmentEarned(doctrine: 'iron' | 'arc' | 'edge', amount: number): void { this.fragmentsThisRun[doctrine] += amount; }
  onMaterialsDropped(stacks: { materialId: string; qty: number }[]): void {
    stacks.forEach(s => {
      const ex = this.materialsThisRun.find(m => m.materialId === s.materialId);
      if (ex) ex.qty += s.qty; else this.materialsThisRun.push({ ...s });
    });
  }
  onGearDropped(item: import('@/components/game/gear').GearItem): void { this.gearDropsThisRun.push(item); }
  onArenaMarkEarned(amount: number): void { this.arenaMarksThisRun += amount; }
  
  // Track doctrine XP based on attack type
  onBasicAttackKill(): void {
    this.doctrineXPThisRun.iron += 3; // Basic attacks reward iron
  }
  
  // Track doctrine XP based on ability usage
  onAbilityDoctrineXP(key: 'Q' | 'E' | 'R' | 'F'): void {
    switch (key) {
      case 'Q': this.doctrineXPThisRun.edge += 2; break; // Dash -> Edge
      case 'E': this.doctrineXPThisRun.arc += 3; break;  // Blast -> Arc
      case 'R': this.doctrineXPThisRun.arc += 2; break;  // Projectile -> Arc
      case 'F': this.doctrineXPThisRun.iron += 2; break; // Heal -> Iron
    }
  }
  
  // Track doctrine XP on modifier pick
  onModifierPickedDoctrineXP(category: string): void {
    switch (category) {
      case 'amplifier': this.doctrineXPThisRun.iron += 5; break;
      case 'trigger': this.doctrineXPThisRun.edge += 5; break;
      case 'transmuter': this.doctrineXPThisRun.arc += 5; break;
    }
  }

  getFloor(): number { return this.floor; }
  getRoomsCompleted(): number { return this.roomsCompleted; }
  getValor(): number { return this.valor; }
  setValor(amount: number): void { this.valor = amount; }
  getDoctrineXPThisRun(): { iron: number; arc: number; edge: number } { return this.doctrineXPThisRun; }

  getBehaviorProfile(): BehaviorProfile {
    return {
      avgDistance: this.distanceSamples.length > 0
        ? this.distanceSamples.reduce((a, b) => a + b, 0) / this.distanceSamples.length
        : 100,
      abilityUsageRate: this.behaviorFrameCount > 0 ? this.abilitiesUsed / this.behaviorFrameCount : 0,
      totalDamage: this.damageThisRun,
    };
  }

  /** Called from GameBridge 'node:select' event */
  handleNodeSelect(node: FloorMapNode): void {
    this.currentNodeId = node.id;

    if (node.type === 'rest') {
      const agent = this.deps.getAgent();
      if (agent) {
        const heal = Math.floor(agent.state.maxHp * 0.4);
        agent.state.hp = Math.min(agent.state.maxHp, agent.state.hp + heal);
      }
      this.completedNode(node.id);
      return;
    }

    if (node.type === 'shop') {
      this.deps.onShowShop(this.valor);
      // onShopClose will be called when shop closes, which will update valor and complete the node
      return;
    }

    if (node.type === 'treasure') {
      const choices = getRandomModifiers(3, 'epic');
      this.deps.app.ticker.stop();
      this.deps.onShowModifierSelect(choices);
      return;
    }

    // combat / elite / exit — spawn enemies
    const isTrial = this.floorMap?.isTrial ?? false;
    const room = generateRoomForNodeType(
      node.type as 'combat' | 'elite' | 'exit',
      this.floor, node.id, isTrial, this.getBehaviorProfile()
    );
    // Elite rooms and trial floors drop Ember on clear
    if (node.type === 'elite' || isTrial) {
      this._pendingEliteEmber = 5 + Math.floor(Math.random() * 6); // 5-10
    }
    this.deps.combatManager.spawnRoom(room);
    this.deps.app.ticker.start();
  }

  /** Called from GameBridge 'modifier:select' event */
  handleModifierSelect(modifier: Modifier): void {
    applyModifier(modifier, this.deps.getActiveModifiers());
    this.modCategoriesUsed.add(modifier.category);
    this.onModifierPickedDoctrineXP(modifier.category);

    // If nodeId is a boss kill sentinel, advance floor after modifier
    const nodeId = this.currentNodeId;
    if (nodeId?.startsWith('boss_')) {
      this.advanceFloor();
      return;
    }

    const map = this.floorMap;
    if (!map || !nodeId) { this.deps.app.ticker.start(); return; }

    const currentNode = map.nodes.find(n => n.id === nodeId);
    this.roomsCompleted++;
    this.deps.onRoomCountChange(this.roomsCompleted);

    if (currentNode?.type === 'exit') {
      this.advanceFloor();
    } else {
      const updated = updateMapAfterClear(map, nodeId);
      this.floorMap = updated;
      this.deps.onShowFloorMap(updated);
    }
  }

  /** Called when room is cleared — show modifier selection and grant valor/ember bonus */
  onRoomCleared(): void {
    this.valor += 5; // +5 Valor per room clear
    // Bank any pending elite/trial Ember
    if (this._pendingEliteEmber > 0) {
      this.emberThisRun += this._pendingEliteEmber;
      this._pendingEliteEmber = 0;
    }
    this.deps.app.ticker.stop();
    const choices = getRandomModifiers(3);
    this.deps.onShowModifierSelect(choices);
  }

  /** Called when shop closes — update valor and complete node */
  onShopClose(remainingValor: number): void {
    this.valor = remainingValor;
    if (this.currentNodeId) this.completedNode(this.currentNodeId);
  }

  /** Called from GameBridge 'boss:start' event */
  startBossFight(): void {
    const { app, getAgent, setBoss, onDamageEvent } = this.deps;
    this.deps.combatManager.cleanup();

    const { Boss: BossClass } = require('../Boss');
    const boss = new BossClass(
      app.renderer.width / 2, app.renderer.height / 2,
      app.renderer.width, app.renderer.height, 16
    ) as Boss;
    app.stage.addChild(boss.container);
    setBoss(boss);

    boss.onSlam = (bx: number, by: number, radius: number, damage: number) => {
      const agent = getAgent();
      if (!agent) return;
      const dx = agent.state.x - bx; const dy = agent.state.y - by;
      if (Math.sqrt(dx * dx + dy * dy) <= radius) agent.takeDamage(damage);
    };
    boss.onSummon = (_bx: number, _by: number, count: number) => {
      const agent = getAgent();
      const { spawnEnemies } = require('../Enemy');
      const ax = agent?.state.x ?? 640, ay = agent?.state.y ?? 360;
      const minions = spawnEnemies(count, ax, ay, app.renderer.width, app.renderer.height, 16, 1, 1);
      // Add minions via a temporary enemies addition — use combatManager.spawnRoom would need a Room obj
      // For now, add to stage directly (boss fight minions are cosmetic; next refactor can clean up)
      minions.forEach((e: any) => app.stage.addChild(e.container));
    };

    app.ticker.start();
  }

  /** Check boss dead — call from ticker when boss is active */
  checkBossDead(): boolean {
    const boss = this.deps.getBoss();
    return !!boss?.dead;
  }

  /** Handle boss death — reward and advance */
  handleBossDead(): void {
    const { app, getBoss, setBoss } = this.deps;
    const boss = getBoss();
    if (!boss) return;
    app.stage.removeChild(boss.container);
    boss.destroy();
    setBoss(null);
    // Boss drops 10-15 Ember
    this.emberThisRun += 10 + Math.floor(Math.random() * 6);
    this.currentNodeId = `boss_${this.floor}`;
    const bossModifiers = getRandomModifiers(3, 'epic');
    app.ticker.stop();
    this.deps.onShowModifierSelect(bossModifiers);
  }

  /** Call when agent HP reaches 0 */
  handleRunEnd(): void {
    const loadoutStore = useAgentLoadout.getState();
    const currentSchool = loadoutStore.school ?? DEFAULT_SCHOOL;
    const runTime = Math.floor((Date.now() - this.deps.runStartTime()) / 1000);
    const xpEarned = calculateRunXP(this.floor, this.deps.getKills(), false, this.floor > loadoutStore.deepestFloor);
    const goldEarned = this.deps.getGold();

    const { newUnlocks } = loadoutStore.addRunRewards({
      goldEarned, accountXPEarned: xpEarned, materialsEarned: [],
      floorsCleared: this.floor, killsThisRun: this.deps.getKills(),
      schoolId: currentSchool.id,
      modifierCategories: Array.from(this.modCategoriesUsed),
      doctrineXPGains: this.doctrineXPThisRun,
      ashEarned: this.ashThisRun,
      emberEarned: this.emberThisRun,
      fragmentsEarned: { ...this.fragmentsThisRun },
      materialsEarnedV2: [...this.materialsThisRun],
      gearDrops: [...this.gearDropsThisRun],
      arenaMarksEarned: this.arenaMarksThisRun,
    });

    const newState = useAgentLoadout.getState();
    const nearest = findNearestUnlock(newState);

    this.deps.onRunEnd({
      floorsReached: this.floor,
      roomsCompleted: this.roomsCompleted,
      enemiesKilled: this.deps.getKills(),
      timeSeconds: runTime,
      goldEarned, accountXPEarned: xpEarned,
      ashEarned: this.ashThisRun,
      emberEarned: this.emberThisRun,
      fragmentsEarned: { ...this.fragmentsThisRun },
      materialsEarnedV2: [...this.materialsThisRun],
      gearDrops: [...this.gearDropsThisRun],
      arenaMarksEarned: this.arenaMarksThisRun,
      newAccountLevel: newState.accountLevel,
      newUnlocks,
      nearestUnlockLabel: nearest?.label,
      nearestUnlockProgress: nearest?.progress,
      nearestUnlockHint: nearest?.hint,
    });
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private advanceFloor(): void {
    this.floor++;
    this.deps.onFloorChange(this.floor);
    const newMap = generateFloorMap(this.floor);
    this.floorMap = newMap;
    if (newMap.isBoss) {
      setTimeout(() => this.deps.onShowBossAnnouncement(), 2200);
    } else {
      setTimeout(() => this.deps.onShowFloorMap(newMap), 2200);
    }
  }

  private completedNode(nodeId: string): void {
    const map = this.floorMap;
    if (!map) return;
    this.roomsCompleted++;
    this.deps.onRoomCountChange(this.roomsCompleted);
    const updated = updateMapAfterClear(map, nodeId);
    this.floorMap = updated;
    this.deps.onShowFloorMap(updated);
  }
}
