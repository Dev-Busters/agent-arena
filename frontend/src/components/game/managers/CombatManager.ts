import { Application, Graphics } from 'pixi.js';
import { Agent } from '../Agent';
import { Enemy, spawnEnemies } from '../Enemy';
import { Boss } from '../Boss';
import { ParticleSystem } from '../Particles';
import { XPOrb } from '../XPOrb';
import { Loot, randomLootType } from '../Loot';
import { GoldCoin } from '../GoldCoin';
import { Room } from '../Room';
import { ActiveModifier, calculateDamageMultiplier } from '../Modifier';
import type { DamageEvent } from '../ArenaCanvas';
import type { SoundManager } from '../Sound';
import { rollMaterialDrop, rollEnemyGearDrop } from '../gear';

const WALL = 16;
const COLLISION_RANGE = 40;

export interface CombatManagerDeps {
  app: Application;
  getAgent: () => Agent | null;
  getEnemies: () => Enemy[];
  setEnemies: (enemies: Enemy[]) => void;
  getBoss: () => Boss | null;
  onEnemyKilled: () => void;
  onAgentDamaged: (amount: number) => void;
  onRoomCleared: () => void;
  onDamageEvent: (event: DamageEvent) => void;
  onGoldCollected: (amount: number) => void;
  onValorEarned: (amount: number) => void;
  onAshEarned: (amount: number) => void;
  onEmberEarned: (amount: number) => void;
  onFragmentEarned: (doctrine: 'iron' | 'arc' | 'edge', amount: number) => void;
  onMaterialsDropped: (stacks: { materialId: string; qty: number }[]) => void;
  onGearDropped: (item: import('@/components/game/gear').GearItem) => void;
  onArenaMarkEarned: (amount: number) => void;
  getCurrentFloor: () => number;
  particles: ParticleSystem;
  sound: SoundManager;
  getActiveModifiers: () => ActiveModifier[];
  getIsTrial: () => boolean;
  onAbilityUsed: () => void;
}

export class CombatManager {
  private deps: CombatManagerDeps;
  private xpOrbs: XPOrb[] = [];
  private lootItems: Loot[] = [];
  private goldCoins: GoldCoin[] = [];
  private gameStarted = false;
  private roomTransitioning = false;

  constructor(deps: CombatManagerDeps) {
    this.deps = deps;
  }

  /** Wire agent attack/blast/projectile callbacks — call once after agent is created */
  setupAgentCallbacks(): void {
    const agent = this.deps.getAgent();
    if (!agent) return;

    agent.onAttack = (px, py, range, damage) => {
      this.deps.onAbilityUsed();
      this.deps.sound.playAttack();
      this.processMeleeHit(px, py, range, damage);
      this.processBossHit(px, py, range, damage);
    };

    agent.onBlast = (px, py, range, damage) => {
      this.deps.onAbilityUsed();
      this.deps.sound.playAttack();
      this.processBlastHit(px, py, range, damage);
      this.processBossHit(px, py, range, damage);
      this.deps.particles.burst(px, py, 0xffff00);
    };

    agent.onProjectile = (px, py, targetX, targetY, damage) => {
      this.deps.onAbilityUsed();
      this.deps.sound.playAttack();
      this.spawnProjectile(px, py, targetX, targetY, damage);
    };
  }

  /** Spawn enemies for a room and add to stage */
  spawnRoom(room: Room): void {
    const { app, setEnemies, getAgent, getIsTrial } = this.deps;
    const agent = getAgent();
    const agentX = agent?.state.x ?? 640;
    const agentY = agent?.state.y ?? 360;

    const trialBonus = getIsTrial() ? 1.5 : 1.0;
    const hpMult = (1 + (room.floor - 1) * 0.1) * trialBonus;
    const dmgMult = (1 + (room.floor - 1) * 0.05) * trialBonus;

    const newEnemies: Enemy[] = [];
    room.enemySpawns.forEach(spawn => {
      const group = spawnEnemies(spawn.count, agentX, agentY,
        app.renderer.width, app.renderer.height, WALL, hpMult, dmgMult);
      newEnemies.push(...group);
    });

    newEnemies.forEach(e => app.stage.addChild(e.container));
    setEnemies(newEnemies);
    this.gameStarted = true;
    this.roomTransitioning = false;
  }

  /** Call once per ticker tick — handles all collision, pickups, room clear */
  updateCombat(delta: number): void {
    const agent = this.deps.getAgent();
    if (!agent) return;

    this.updateEnemyCollisions(agent, delta);
    this.updateBossCollisions(agent, delta);
    this.updatePickups(agent, delta);
    this.checkRoomClear();
  }

  /** Remove all enemies and pickups from stage (e.g. on floor advance) */
  cleanup(): void {
    const { app, getEnemies, setEnemies } = this.deps;
    getEnemies().forEach(e => { app.stage.removeChild(e.container); e.destroy(); });
    setEnemies([]);
    this.xpOrbs.forEach(o => { app.stage.removeChild(o.container); o.destroy(); });
    this.xpOrbs = [];
    this.goldCoins.forEach(c => { app.stage.removeChild(c.container); c.destroy(); });
    this.goldCoins = [];
    this.lootItems.forEach(l => { app.stage.removeChild(l.container); l.destroy(); });
    this.lootItems = [];
    this.gameStarted = false;
    this.roomTransitioning = false;
  }

  setRoomTransitioning(v: boolean) { this.roomTransitioning = v; }

  // ── Private helpers ────────────────────────────────────────────────────────

  private dmMult(): number {
    return calculateDamageMultiplier(this.deps.getActiveModifiers());
  }

  private killEnemy(enemy: Enemy): void {
    const { app, getEnemies, setEnemies, particles, sound, onEnemyKilled, onValorEarned, onAshEarned, onEmberEarned, onFragmentEarned, onMaterialsDropped, onGearDropped, onArenaMarkEarned, getIsTrial, getCurrentFloor } = this.deps;
    enemy.dead = true;
    onEnemyKilled();
    sound.playDeath();

    const deathColor = enemy.state.type === 'charger' ? 0xff4444
      : enemy.state.type === 'ranger' ? 0xa855f7 : 0x22c55e;
    particles.burst(enemy.state.x, enemy.state.y, deathColor);

    const xp = new XPOrb(enemy.state.x, enemy.state.y, 10);
    this.xpOrbs.push(xp);
    app.stage.addChild(xp.container);

    const coin = new GoldCoin(enemy.state.x, enemy.state.y, 5);
    this.goldCoins.push(coin);
    app.stage.addChild(coin.container);

    // Drop Valor: regular enemies drop 2-5 Valor (in-run only)
    const valorDrop = 2 + Math.floor(Math.random() * 4);
    onValorEarned(valorDrop);

    // Drop Ash: all enemies drop 1-3 (persistent currency)
    const ashDrop = 1 + Math.floor(Math.random() * 3);
    onAshEarned(ashDrop);

    // Elite enemies (high HP) drop 1-3 Ember + 1-2 Fragments
    const isElite = (enemy.state.maxHp ?? 0) > 80;
    if (isElite) {
      const emberDrop = 1 + Math.floor(Math.random() * 3);
      onEmberEarned(emberDrop);
      // Elites and trial floor enemies drop 1-2 Technique Fragments (doctrine-matched to enemy type)
      const fragDoctrine = enemy.state.type === 'charger' ? 'iron'
        : enemy.state.type === 'ranger' ? 'arc' : 'edge';
      onFragmentEarned(fragDoctrine, 1 + Math.floor(Math.random() * 2));
    } else if (getIsTrial()) {
      // All enemies on trial floors drop 1 fragment
      const fragDoctrine = enemy.state.type === 'charger' ? 'iron'
        : enemy.state.type === 'ranger' ? 'arc' : 'edge';
      onFragmentEarned(fragDoctrine, 1);
    }

    // Phase I: Material drops
    const matDoctrine: 'iron' | 'arc' | 'edge' = enemy.state.type === 'charger' ? 'iron'
      : enemy.state.type === 'ranger' ? 'arc' : 'edge';
    const mats = rollMaterialDrop(matDoctrine, isElite);
    if (mats.length > 0) onMaterialsDropped(mats);
    // Gear drop from elites only
    if (isElite) {
      const floor = getCurrentFloor();
      const gearDrop = rollEnemyGearDrop(floor, matDoctrine);
      if (gearDrop) onGearDropped(gearDrop);
      // Arena Marks: rare drop from elites (15% chance)
      if (Math.random() < 0.15) onArenaMarkEarned(1);
    }

    if (Math.random() < 0.2) {
      const loot = new Loot(enemy.state.x, enemy.state.y, randomLootType());
      this.lootItems.push(loot);
      app.stage.addChild(loot.container);
    }

    if (enemy.container) app.stage.removeChild(enemy.container);
    enemy.destroy();
    setEnemies(getEnemies().filter(e => e.state.hp > 0));
  }

  private processMeleeHit(px: number, py: number, range: number, damage: number): void {
    const agent = this.deps.getAgent()!;
    this.deps.getEnemies().forEach(enemy => {
      const dx = enemy.state.x - px;
      const dy = enemy.state.y - py;
      if (Math.sqrt(dx * dx + dy * dy) > range) return;

      const critChance = (10 + (agent.getSchoolConfig()?.stats.critBonus ?? 0)) / 100;
      const isCrit = Math.random() < critChance;
      const tHpPct = enemy.state.hp / enemy.state.maxHp;
      const finalDmg = (isCrit ? damage * 2 : damage)
        * this.dmMult()
        * agent.getLiveDamageMultiplier()
        * agent.getExecutionerBonus(tHpPct);

      enemy.state.hp -= finalDmg;
      this.deps.particles.hit(enemy.state.x, enemy.state.y);
      this.deps.sound.playHit();
      this.deps.onDamageEvent({ damage: finalDmg, x: enemy.state.x, y: enemy.state.y, isCrit });

      if (enemy.state.hp <= 0) this.killEnemy(enemy);
    });
  }

  private processBlastHit(px: number, py: number, range: number, damage: number): void {
    this.deps.getEnemies().forEach(enemy => {
      const dx = enemy.state.x - px;
      const dy = enemy.state.y - py;
      if (Math.sqrt(dx * dx + dy * dy) > range) return;

      const finalDmg = damage * this.dmMult();
      enemy.state.hp -= finalDmg;
      this.deps.particles.hit(enemy.state.x, enemy.state.y);
      this.deps.onDamageEvent({ damage: finalDmg, x: enemy.state.x, y: enemy.state.y, isCrit: false });

      if (enemy.state.hp <= 0) this.killEnemy(enemy);
    });
  }

  private processBossHit(px: number, py: number, range: number, damage: number): void {
    const boss = this.deps.getBoss();
    if (!boss || boss.dead) return;
    const dx = boss.state.x - px;
    const dy = boss.state.y - py;
    if (Math.sqrt(dx * dx + dy * dy) <= range) {
      boss.takeDamage(damage * this.dmMult());
    }
  }

  private spawnProjectile(px: number, py: number, tx: number, ty: number, damage: number): void {
    const { app, particles, sound } = this.deps;
    const g = new Graphics();
    g.beginFill(0xff8800); g.drawCircle(0, 0, 8); g.endFill();
    g.x = px; g.y = py;
    app.stage.addChild(g);

    const dist = Math.sqrt((tx - px) ** 2 + (ty - py) ** 2);
    const vx = ((tx - px) / dist) * 10;
    const vy = ((ty - py) / dist) * 10;
    let traveled = 0;

    const tick = () => {
      g.x += vx; g.y += vy; traveled += 10;
      let hit = false;
      for (const enemy of this.deps.getEnemies()) {
        const ex = enemy.state.x - g.x;
        const ey = enemy.state.y - g.y;
        if (Math.sqrt(ex * ex + ey * ey) < 30) {
          const finalDmg = damage * this.dmMult();
          enemy.state.hp -= finalDmg;
          particles.hit(enemy.state.x, enemy.state.y);
          sound.playHit();
          this.deps.onDamageEvent({ damage: finalDmg, x: enemy.state.x, y: enemy.state.y, isCrit: false });
          if (enemy.state.hp <= 0) this.killEnemy(enemy);
          hit = true; break;
        }
      }
      if (hit || traveled >= 400) {
        app.ticker.remove(tick);
        app.stage.removeChild(g); g.destroy();
      }
    };
    app.ticker.add(tick);
  }

  private updateEnemyCollisions(agent: Agent, delta: number): void {
    this.deps.getEnemies().forEach(enemy => {
      enemy.update(agent.state.x, agent.state.y, delta);
      const dx = enemy.state.x - agent.state.x;
      const dy = enemy.state.y - agent.state.y;
      if (Math.sqrt(dx * dx + dy * dy) < COLLISION_RANGE) {
        const dmg = 0.2 * agent.getDamageTakenMult();
        agent.takeDamage(dmg);
        this.deps.onAgentDamaged(dmg);
      }
    });
  }

  private updateBossCollisions(agent: Agent, _delta: number): void {
    const boss = this.deps.getBoss();
    if (!boss || boss.dead) return;
    const dx = boss.state.x - agent.state.x;
    const dy = boss.state.y - agent.state.y;
    if (Math.sqrt(dx * dx + dy * dy) < 80) {
      agent.takeDamage(0.8);
      this.deps.onAgentDamaged(0.8);
    }
  }

  private updatePickups(agent: Agent, delta: number): void {
    const { app } = this.deps;

    for (let i = this.xpOrbs.length - 1; i >= 0; i--) {
      const orb = this.xpOrbs[i];
      orb.setTarget(agent.state.x, agent.state.y);
      if (orb.update()) {
        agent.gainXP(orb.getValue());
        app.stage.removeChild(orb.container); orb.destroy();
        this.xpOrbs.splice(i, 1);
      }
    }

    for (let i = this.goldCoins.length - 1; i >= 0; i--) {
      const coin = this.goldCoins[i];
      if (coin.update(delta, agent.state.x, agent.state.y)) {
        this.deps.onGoldCollected(coin.value);
        app.stage.removeChild(coin.container); coin.destroy();
        this.goldCoins.splice(i, 1);
      }
    }

    for (let i = this.lootItems.length - 1; i >= 0; i--) {
      const loot = this.lootItems[i];
      if (loot.update(agent.state.x, agent.state.y)) {
        app.stage.removeChild(loot.container); loot.destroy();
        this.lootItems.splice(i, 1);
      }
    }
  }

  private checkRoomClear(): void {
    if (!this.gameStarted || this.roomTransitioning) return;
    if (this.deps.getEnemies().length === 0) {
      this.roomTransitioning = true;
      this.deps.onRoomCleared();
    }
  }
}
