/**
 * Agent Arena — Agent Loadout Store
 * Persistent player state: school, disciplines, tenets, doctrine progression, abilities.
 * Persists to localStorage. Supabase sync in Phase J.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SchoolConfig, DEFAULT_SCHOOL } from '@/components/game/schools';
import { Discipline } from '@/components/game/disciplines';
import { Tenet } from '@/components/game/tenets';
import { DOCTRINE_TREES, DoctrineKey } from '@/components/game/doctrineTrees';
import { DOCTRINE_ABILITIES, getAbilityPair, UNLOCK_LEVELS } from '@/components/game/doctrineAbilities';

// ── Stub types for Phase I ───────────────────────────────────────────────────
export interface Equipment {
  id: string; name: string;
  slot: 'weapon' | 'armor' | 'helm' | 'boots' | 'accessory1' | 'accessory2';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  stats: Record<string, number>;
}
export interface Material { id: string; name: string; quantity: number; }

// ── Doctrine XP helpers ──────────────────────────────────────────────────────
/** Cumulative XP required to REACH level N (0-indexed check: totalXP >= threshold) */
export function doctrineXPForLevel(level: number): number {
  if (level <= 0) return 0;
  if (level <= 10) return level * 200;
  if (level <= 25) return 2000 + (level - 10) * 400;
  if (level <= 40) return 8000 + (level - 25) * 700;
  return 18500 + (level - 40) * 1200;
}
export function xpToDoctrineLevel(totalXP: number): number {
  let lvl = 0;
  for (let i = 1; i <= 50; i++) {
    if (totalXP >= doctrineXPForLevel(i)) lvl = i; else break;
  }
  return lvl;
}

// ── Unlock conditions ────────────────────────────────────────────────────────
export const SCHOOL_UNLOCK_CONDITIONS: Record<string, { label: string; check: (s: AgentLoadoutState) => boolean }> = {
  vanguard: { label: 'Default',       check: () => true },
  invoker:  { label: 'Reach Floor 5', check: s => s.deepestFloor >= 5 },
  phantom:  { label: 'Reach Floor 10',check: s => s.deepestFloor >= 10 },
};
export const TENET_UNLOCK_CONDITIONS: Record<string, { label: string; check: (s: AgentLoadoutState) => boolean }> = {
  'strike-wounded':   { label: 'Default',                      check: () => true },
  'executioner':      { label: 'Default',                      check: () => true },
  'glass-cannon':     { label: 'Kill 50 total enemies',        check: s => s.totalKills >= 50 },
  'chaos-doctrine':   { label: 'Complete a run with 3+ modifier categories', check: s => s.totalRuns >= 1 },
  'iron-resolve':     { label: 'Survive to Floor 10',          check: s => s.deepestFloor >= 10 },
  'swift-execution':  { label: 'Kill 5 enemies in a single room', check: s => s.totalKills >= 25 },
  'berserkers-rage':  { label: 'Win a room with <10% HP',      check: s => s.totalRuns >= 3 },
  'arcane-efficiency':{ label: 'Use all 4 abilities in one room', check: s => s.totalRuns >= 5 },
};
export const getDisciplineUnlockCondition = (i: 0|1|2, schoolId: string): string => {
  if (i === 0) return `Complete 3 runs as ${schoolId}`;
  if (i === 1) return `Complete 7 runs as ${schoolId}`;
  return `Reach Floor 15 as ${schoolId}`;
};

// ── Account level ────────────────────────────────────────────────────────────
export const LEVEL_THRESHOLDS = [0,200,500,900,1400,2000,2800,3800,5000,6500,8500];
export function xpToLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  return 1;
}
export function xpForNextLevel(level: number): number {
  return LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 2000;
}
export function getTenetSlots(accountLevel: number): number {
  if (accountLevel >= 12) return 4;
  if (accountLevel >= 7)  return 3;
  if (accountLevel >= 3)  return 2;
  if (accountLevel >= 1)  return 1;
  return 0;
}

// ── RunRewards ────────────────────────────────────────────────────────────────
export interface RunRewards {
  goldEarned: number; accountXPEarned: number; materialsEarned: Material[];
  floorsCleared: number; killsThisRun: number; schoolId: string;
  modifierCategories: string[];
  doctrineXPGains?: { iron: number; arc: number; edge: number };
}

// ── Store shape ───────────────────────────────────────────────────────────────
export interface AgentLoadoutState {
  school: SchoolConfig | null;
  disciplines: Discipline[];
  tenets: Tenet[];
  equipment: { weapon: Equipment|null; armor: Equipment|null; helm: Equipment|null; boots: Equipment|null; accessory1: Equipment|null; accessory2: Equipment|null };
  unlocks: { schools: string[]; disciplines: string[]; tenets: string[]; recipes: string[] };
  gold: number;
  materials: Material[];
  accountLevel: number;
  accountXP: number;
  deepestFloor: number;
  totalKills: number;
  totalRuns: number;
  runsPerSchool: Record<string, number>;
  deepestFloorPerSchool: Record<string, number>;

  // ── Phase F: Doctrine progression ──
  doctrineXP: { iron: number; arc: number; edge: number };
  doctrineLevel: { iron: number; arc: number; edge: number };
  doctrinePoints: { iron: number; arc: number; edge: number }; // spendable = level - spent
  doctrineInvestedRanks: Record<string, number>; // nodeId → ranks

  // ── Phase F: Ability system ──
  unlockedAbilities: string[];
  equippedAbilities: { Q: string|null; E: string|null; R: string|null; F: string|null };
  pendingAbilityUnlock: { doctrine: DoctrineKey; level: number; options: [string, string] } | null;

  // ── Actions ──
  setSchool: (s: SchoolConfig) => void;
  setDisciplines: (d: Discipline[]) => void;
  setTenets: (t: Tenet[]) => void;
  addGold: (n: number) => void;
  spendGold: (n: number) => boolean;
  unlockSchool: (id: string) => void;
  unlockDiscipline: (id: string) => void;
  unlockTenet: (id: string) => void;
  addRunRewards: (r: RunRewards) => { newUnlocks: string[] };
  computeUnlocks: () => void;
  addDoctrineXP: (gains: { iron: number; arc: number; edge: number }) => { levelUps: { iron: number; arc: number; edge: number } };
  investDoctrineNode: (nodeId: string, doctrine: DoctrineKey) => boolean;
  unlockAbility: (id: string) => void;
  equipAbility: (slot: 'Q'|'E'|'R'|'F', abilityId: string|null) => void;
  setPendingAbilityUnlock: (data: { doctrine: DoctrineKey; level: number; options: [string, string] } | null) => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────
export const useAgentLoadout = create<AgentLoadoutState>()(
  persist(
    (set, get) => ({
      school: null, disciplines: [], tenets: [],
      equipment: { weapon:null, armor:null, helm:null, boots:null, accessory1:null, accessory2:null },
      unlocks: { schools:['vanguard'], disciplines:[], tenets:['strike-wounded','executioner'], recipes:[] },
      gold: 0, materials: [],
      accountLevel: 0, accountXP: 0,
      deepestFloor: 0, totalKills: 0, totalRuns: 0,
      runsPerSchool: {}, deepestFloorPerSchool: {},
      // Phase F init
      doctrineXP: { iron:0, arc:0, edge:0 },
      doctrineLevel: { iron:0, arc:0, edge:0 },
      doctrinePoints: { iron:0, arc:0, edge:0 },
      doctrineInvestedRanks: {},
      unlockedAbilities: [],
      equippedAbilities: { Q:null, E:null, R:null, F:null },
      pendingAbilityUnlock: null,

      setSchool: (school) => set({ school }),
      setDisciplines: (disciplines) => set({ disciplines }),
      setTenets: (tenets) => set({ tenets }),
      addGold: (n) => set(s => ({ gold: s.gold + n })),
      spendGold: (n) => { if (get().gold < n) return false; set(s => ({ gold: s.gold - n })); return true; },
      unlockSchool:     (id) => set(s => ({ unlocks: { ...s.unlocks, schools:     [...new Set([...s.unlocks.schools, id])] } })),
      unlockDiscipline: (id) => set(s => ({ unlocks: { ...s.unlocks, disciplines: [...new Set([...s.unlocks.disciplines, id])] } })),
      unlockTenet:      (id) => set(s => ({ unlocks: { ...s.unlocks, tenets:      [...new Set([...s.unlocks.tenets, id])] } })),
      unlockAbility:    (id) => set(s => ({ unlockedAbilities: [...new Set([...s.unlockedAbilities, id])] })),
      equipAbility:     (slot, id) => set(s => ({ equippedAbilities: { ...s.equippedAbilities, [slot]: id } })),
      setPendingAbilityUnlock: (data) => set({ pendingAbilityUnlock: data }),

      addDoctrineXP: (gains) => {
        const state = get();
        const newXP = {
          iron: state.doctrineXP.iron + gains.iron,
          arc:  state.doctrineXP.arc  + gains.arc,
          edge: state.doctrineXP.edge + gains.edge,
        };
        const newLevels = {
          iron: xpToDoctrineLevel(newXP.iron),
          arc:  xpToDoctrineLevel(newXP.arc),
          edge: xpToDoctrineLevel(newXP.edge),
        };
        const levelUps = {
          iron: Math.max(0, newLevels.iron - state.doctrineLevel.iron),
          arc:  Math.max(0, newLevels.arc  - state.doctrineLevel.arc),
          edge: Math.max(0, newLevels.edge - state.doctrineLevel.edge),
        };

        // Compute new spendable points (total level - total ranks spent in that doctrine)
        const spentRanks = (doctrine: DoctrineKey) => {
          const tree = DOCTRINE_TREES[doctrine];
          return tree.nodes.reduce((sum, n) => sum + (state.doctrineInvestedRanks[n.id] ?? 0), 0);
        };
        const newPoints = {
          iron: newLevels.iron - spentRanks('iron'),
          arc:  newLevels.arc  - spentRanks('arc'),
          edge: newLevels.edge - spentRanks('edge'),
        };

        // Check for ability unlock triggers
        let pendingUnlock = state.pendingAbilityUnlock;
        for (const doc of ['iron', 'arc', 'edge'] as DoctrineKey[]) {
          if (levelUps[doc] > 0) {
            const oldLvl = state.doctrineLevel[doc];
            const newLvl = newLevels[doc];
            for (const threshold of UNLOCK_LEVELS) {
              if (oldLvl < threshold && newLvl >= threshold) {
                const pair = getAbilityPair(doc, threshold);
                if (pair) {
                  pendingUnlock = { doctrine: doc, level: threshold, options: [pair[0].id, pair[1].id] };
                }
                break; // handle one unlock at a time
              }
            }
          }
        }

        set({ doctrineXP: newXP, doctrineLevel: newLevels, doctrinePoints: newPoints, pendingAbilityUnlock: pendingUnlock });
        return { levelUps };
      },

      investDoctrineNode: (nodeId, doctrine) => {
        const state = get();
        const tree = DOCTRINE_TREES[doctrine];
        const node = tree.nodes.find(n => n.id === nodeId);
        if (!node) return false;
        const currentRanks = state.doctrineInvestedRanks[nodeId] ?? 0;
        if (currentRanks >= node.maxRanks) return false;
        if (state.doctrinePoints[doctrine] <= 0) return false;
        const { isNodeAvailable } = require('@/components/game/doctrineTrees');
        if (!isNodeAvailable(nodeId, tree, state.doctrineInvestedRanks)) return false;
        const newRanks = { ...state.doctrineInvestedRanks, [nodeId]: currentRanks + 1 };
        const newPoints = { ...state.doctrinePoints, [doctrine]: state.doctrinePoints[doctrine] - 1 };
        set({ doctrineInvestedRanks: newRanks, doctrinePoints: newPoints });
        return true;
      },

      addRunRewards: (rewards) => {
        const state = get();
        const newXP = state.accountXP + rewards.accountXPEarned;
        const newLevel = Math.max(1, xpToLevel(newXP));
        const newKills = state.totalKills + rewards.killsThisRun;
        const newRuns = state.totalRuns + 1;
        const newDeepest = Math.max(state.deepestFloor, rewards.floorsCleared);
        const newRunsPerSchool = { ...state.runsPerSchool, [rewards.schoolId]: (state.runsPerSchool[rewards.schoolId] ?? 0) + 1 };
        const newDeepestPerSchool = { ...state.deepestFloorPerSchool, [rewards.schoolId]: Math.max(state.deepestFloorPerSchool[rewards.schoolId] ?? 0, rewards.floorsCleared) };
        const updated = { accountXP: newXP, accountLevel: newLevel, gold: state.gold + rewards.goldEarned, materials: mergeMaterials(state.materials, rewards.materialsEarned), totalKills: newKills, totalRuns: newRuns, deepestFloor: newDeepest, runsPerSchool: newRunsPerSchool, deepestFloorPerSchool: newDeepestPerSchool };
        const simulatedState = { ...state, ...updated };
        const newUnlocks: string[] = [];
        const updatedUnlocks = { ...state.unlocks };
        for (const [id, cond] of Object.entries(SCHOOL_UNLOCK_CONDITIONS)) {
          if (!updatedUnlocks.schools.includes(id) && cond.check(simulatedState as AgentLoadoutState)) { updatedUnlocks.schools = [...updatedUnlocks.schools, id]; newUnlocks.push(`SCHOOL:${id}`); }
        }
        for (const [id, cond] of Object.entries(TENET_UNLOCK_CONDITIONS)) {
          if (!updatedUnlocks.tenets.includes(id) && cond.check(simulatedState as AgentLoadoutState)) { updatedUnlocks.tenets = [...updatedUnlocks.tenets, id]; newUnlocks.push(`TENET:${id}`); }
        }
        set({ ...updated, unlocks: updatedUnlocks });
        // Apply doctrine XP if provided
        if (rewards.doctrineXPGains) get().addDoctrineXP(rewards.doctrineXPGains);
        return { newUnlocks };
      },

      computeUnlocks: () => {
        const state = get();
        const updatedUnlocks = { ...state.unlocks };
        for (const [id, cond] of Object.entries(SCHOOL_UNLOCK_CONDITIONS)) { if (!updatedUnlocks.schools.includes(id) && cond.check(state)) updatedUnlocks.schools = [...updatedUnlocks.schools, id]; }
        for (const [id, cond] of Object.entries(TENET_UNLOCK_CONDITIONS)) { if (!updatedUnlocks.tenets.includes(id) && cond.check(state)) updatedUnlocks.tenets = [...updatedUnlocks.tenets, id]; }
        set({ unlocks: updatedUnlocks });
      },
    }),
    { name: 'agent-arena-loadout-v2' } // v2 to avoid migration issues with old schema
  )
);

// ── Helpers ────────────────────────────────────────────────────────────────────
function mergeMaterials(existing: Material[], incoming: Material[]): Material[] {
  const map = new Map<string, Material>(existing.map(m => [m.id, { ...m }]));
  for (const mat of incoming) { const ex = map.get(mat.id); if (ex) ex.quantity += mat.quantity; else map.set(mat.id, { ...mat }); }
  return Array.from(map.values());
}
export function calculateRunXP(floors: number, kills: number, bossKilled: boolean, newRecord: boolean): number {
  return 50 + (floors * 20) + (kills * 2) + (bossKilled ? 200 : 0) + (newRecord ? 100 : 0);
}

const UNLOCK_PROGRESS: Record<string, (s: AgentLoadoutState) => [number, number, string]> = {
  invoker:            s => [s.deepestFloor, 5,  'Reach Floor 5'],
  phantom:            s => [s.deepestFloor, 10, 'Reach Floor 10'],
  'glass-cannon':     s => [s.totalKills,   50, 'Kill 50 enemies total'],
  'chaos-doctrine':   s => [s.totalRuns,    1,  'Complete 1 run'],
  'iron-resolve':     s => [s.deepestFloor, 10, 'Survive to Floor 10'],
  'swift-execution':  s => [s.totalKills,   25, 'Kill 25 enemies total'],
  'berserkers-rage':  s => [s.totalRuns,    3,  'Complete 3 runs'],
  'arcane-efficiency':s => [s.totalRuns,    5,  'Complete 5 runs'],
};
export function findNearestUnlock(state: AgentLoadoutState): { label: string; progress: string; percent: number; hint: string } | null {
  let best: { label: string; progress: string; percent: number; hint: string } | null = null;
  for (const [id, cond] of Object.entries(SCHOOL_UNLOCK_CONDITIONS)) {
    if (state.unlocks.schools.includes(id)) continue;
    const prog = UNLOCK_PROGRESS[id]?.(state);
    if (!prog) continue;
    const [cur, target, hint] = prog;
    const percent = Math.min(cur / target, 0.99);
    if (!best || percent > best.percent) best = { label: `${cond.label} (${id.charAt(0).toUpperCase()+id.slice(1)} School)`, progress: `${cur} / ${target}`, percent, hint };
  }
  for (const [id, cond] of Object.entries(TENET_UNLOCK_CONDITIONS)) {
    if (state.unlocks.tenets.includes(id)) continue;
    const prog = UNLOCK_PROGRESS[id]?.(state);
    if (!prog) continue;
    const [cur, target, hint] = prog;
    const percent = Math.min(cur / target, 0.99);
    if (!best || percent > best.percent) best = { label: `${cond.label} Tenet`, progress: `${cur} / ${target}`, percent, hint };
  }
  return best;
}
