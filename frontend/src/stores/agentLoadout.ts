/**
 * Agent Arena — Agent Loadout Store
 * Persistent player state: school, disciplines, tenets, gold, progression, unlocks.
 * Persists to localStorage. Supabase sync comes in Phase H.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SchoolConfig, DEFAULT_SCHOOL } from '@/components/game/schools';
import { Discipline } from '@/components/game/disciplines';
import { Tenet } from '@/components/game/tenets';

// ── Stub types for Phase G ──────────────────────────────────────────────────
export interface Equipment {
  id: string;
  name: string;
  slot: 'weapon' | 'armor' | 'helm' | 'boots' | 'accessory1' | 'accessory2';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  stats: Record<string, number>;
}

export interface Material {
  id: string;
  name: string;
  quantity: number;
}

// ── Unlock keys ─────────────────────────────────────────────────────────────
export const SCHOOL_UNLOCK_CONDITIONS: Record<string, { label: string; check: (s: AgentLoadoutState) => boolean }> = {
  vanguard: { label: 'Default',          check: () => true },
  invoker:  { label: 'Reach Floor 5',    check: s => s.deepestFloor >= 5 },
  phantom:  { label: 'Reach Floor 10',   check: s => s.deepestFloor >= 10 },
};

export const TENET_UNLOCK_CONDITIONS: Record<string, { label: string; check: (s: AgentLoadoutState) => boolean }> = {
  'strike-wounded': { label: 'Default',                      check: () => true },
  'executioner':    { label: 'Default',                      check: () => true },
  'glass-cannon':   { label: 'Kill 50 total enemies',        check: s => s.totalKills >= 50 },
  'chaos-doctrine': { label: 'Complete a run with 3+ modifier categories', check: s => s.totalRuns >= 1 }, // simplified
  'iron-resolve':   { label: 'Survive to Floor 10',          check: s => s.deepestFloor >= 10 },
  'swift-execution':{ label: 'Kill 5 enemies in a single room (automatic)', check: s => s.totalKills >= 25 },
  'berserkers-rage':{ label: 'Win a room with <10% HP (automatic)', check: s => s.totalRuns >= 3 },
  'arcane-efficiency': { label: 'Use all 4 abilities in one room (automatic)', check: s => s.totalRuns >= 5 },
};

// Discipline unlock: 3 per school, progressive
export const getDisciplineUnlockCondition = (disciplineIndex: 0 | 1 | 2, schoolId: string): string => {
  if (disciplineIndex === 0) return `Complete 3 runs as ${schoolId}`;
  if (disciplineIndex === 1) return `Complete 7 runs as ${schoolId}`;
  return `Reach Floor 15 as ${schoolId}`;
};

// ── Account level XP thresholds ─────────────────────────────────────────────
export const LEVEL_THRESHOLDS = [0, 200, 500, 900, 1400, 2000, 2800, 3800, 5000, 6500, 8500];
export function xpToLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}
export function xpForNextLevel(level: number): number {
  return LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 2000;
}

// ── Tenet slot count by account level ───────────────────────────────────────
export function getTenetSlots(accountLevel: number): number {
  if (accountLevel >= 12) return 4;
  if (accountLevel >= 7)  return 3;
  if (accountLevel >= 3)  return 2;
  if (accountLevel >= 1)  return 1;
  return 0; // no tenets before first run
}

// ── RunRewards ───────────────────────────────────────────────────────────────
export interface RunRewards {
  goldEarned: number;
  accountXPEarned: number;
  materialsEarned: Material[];
  floorsCleared: number;
  killsThisRun: number;
  schoolId: string;
  modifierCategories: string[]; // for chaos-doctrine unlock check
}

// ── Store shape ──────────────────────────────────────────────────────────────
export interface AgentLoadoutState {
  // Current loadout
  school: SchoolConfig | null;
  disciplines: Discipline[];
  tenets: Tenet[];

  // Equipment — Phase G stubs
  equipment: {
    weapon:     Equipment | null;
    armor:      Equipment | null;
    helm:       Equipment | null;
    boots:      Equipment | null;
    accessory1: Equipment | null;
    accessory2: Equipment | null;
  };

  // Unlocks
  unlocks: {
    schools:     string[];  // starts: ['vanguard']
    disciplines: string[];  // starts: []
    tenets:      string[];  // starts: ['strike-wounded', 'executioner']
    recipes:     string[];
  };

  // Persistent currency + materials
  gold: number;
  materials: Material[];

  // Progression
  accountLevel: number;
  accountXP: number;
  deepestFloor: number;
  totalKills: number;
  totalRuns: number;

  // Runs-per-school tracking (for discipline unlocks)
  runsPerSchool: Record<string, number>;
  deepestFloorPerSchool: Record<string, number>;

  // ── Actions ──
  setSchool: (school: SchoolConfig) => void;
  setDisciplines: (disciplines: Discipline[]) => void;
  setTenets: (tenets: Tenet[]) => void;
  addGold: (amount: number) => void;
  spendGold: (amount: number) => boolean;
  unlockSchool:      (id: string) => void;
  unlockDiscipline:  (id: string) => void;
  unlockTenet:       (id: string) => void;
  addRunRewards:     (rewards: RunRewards) => { newUnlocks: string[] };
  computeUnlocks:    () => void; // re-evaluates all unlock conditions
}

// ── Store ────────────────────────────────────────────────────────────────────
export const useAgentLoadout = create<AgentLoadoutState>()(
  persist(
    (set, get) => ({
      // Defaults — new player starts as Vanguard, no disciplines/tenets
      school:      null, // null = use DEFAULT_SCHOOL (Vanguard)
      disciplines: [],
      tenets:      [],
      equipment: { weapon: null, armor: null, helm: null, boots: null, accessory1: null, accessory2: null },
      unlocks: {
        schools:     ['vanguard'],
        disciplines: [],
        tenets:      ['strike-wounded', 'executioner'],
        recipes:     [],
      },
      gold: 0,
      materials: [],
      accountLevel: 0, // 0 = hasn't completed first run yet
      accountXP: 0,
      deepestFloor: 0,
      totalKills: 0,
      totalRuns: 0,
      runsPerSchool: {},
      deepestFloorPerSchool: {},

      setSchool: (school) => set({ school }),
      setDisciplines: (disciplines) => set({ disciplines }),
      setTenets: (tenets) => set({ tenets }),
      addGold: (amount) => set(s => ({ gold: s.gold + amount })),
      spendGold: (amount) => {
        const { gold } = get();
        if (gold < amount) return false;
        set({ gold: gold - amount });
        return true;
      },
      unlockSchool:     (id) => set(s => ({ unlocks: { ...s.unlocks, schools: [...new Set([...s.unlocks.schools, id])] } })),
      unlockDiscipline: (id) => set(s => ({ unlocks: { ...s.unlocks, disciplines: [...new Set([...s.unlocks.disciplines, id])] } })),
      unlockTenet:      (id) => set(s => ({ unlocks: { ...s.unlocks, tenets: [...new Set([...s.unlocks.tenets, id])] } })),

      addRunRewards: (rewards) => {
        const state = get();
        const newXP = state.accountXP + rewards.accountXPEarned;
        const newLevel = Math.max(1, xpToLevel(newXP));
        const newKills = state.totalKills + rewards.killsThisRun;
        const newRuns = state.totalRuns + 1;
        const newDeepest = Math.max(state.deepestFloor, rewards.floorsCleared);
        const newRunsPerSchool = { ...state.runsPerSchool, [rewards.schoolId]: (state.runsPerSchool[rewards.schoolId] ?? 0) + 1 };
        const newDeepestPerSchool = { ...state.deepestFloorPerSchool, [rewards.schoolId]: Math.max(state.deepestFloorPerSchool[rewards.schoolId] ?? 0, rewards.floorsCleared) };

        const updated = {
          accountXP: newXP, accountLevel: newLevel,
          gold: state.gold + rewards.goldEarned,
          materials: mergeMaterials(state.materials, rewards.materialsEarned),
          totalKills: newKills, totalRuns: newRuns,
          deepestFloor: newDeepest,
          runsPerSchool: newRunsPerSchool,
          deepestFloorPerSchool: newDeepestPerSchool,
        };

        // Re-evaluate unlocks against updated state
        const simulatedState = { ...state, ...updated };
        const newUnlocks: string[] = [];
        const updatedUnlocks = { ...state.unlocks };

        // School unlocks
        for (const [id, cond] of Object.entries(SCHOOL_UNLOCK_CONDITIONS)) {
          if (!updatedUnlocks.schools.includes(id) && cond.check(simulatedState as AgentLoadoutState)) {
            updatedUnlocks.schools = [...updatedUnlocks.schools, id];
            newUnlocks.push(`SCHOOL:${id}`);
          }
        }
        // Tenet unlocks
        for (const [id, cond] of Object.entries(TENET_UNLOCK_CONDITIONS)) {
          if (!updatedUnlocks.tenets.includes(id) && cond.check(simulatedState as AgentLoadoutState)) {
            updatedUnlocks.tenets = [...updatedUnlocks.tenets, id];
            newUnlocks.push(`TENET:${id}`);
          }
        }

        set({ ...updated, unlocks: updatedUnlocks });
        return { newUnlocks };
      },

      computeUnlocks: () => {
        const state = get();
        const updatedUnlocks = { ...state.unlocks };
        for (const [id, cond] of Object.entries(SCHOOL_UNLOCK_CONDITIONS)) {
          if (!updatedUnlocks.schools.includes(id) && cond.check(state)) {
            updatedUnlocks.schools = [...updatedUnlocks.schools, id];
          }
        }
        for (const [id, cond] of Object.entries(TENET_UNLOCK_CONDITIONS)) {
          if (!updatedUnlocks.tenets.includes(id) && cond.check(state)) {
            updatedUnlocks.tenets = [...updatedUnlocks.tenets, id];
          }
        }
        set({ unlocks: updatedUnlocks });
      },
    }),
    { name: 'agent-arena-loadout' }
  )
);

// ── Helpers ───────────────────────────────────────────────────────────────────
function mergeMaterials(existing: Material[], incoming: Material[]): Material[] {
  const map = new Map<string, Material>(existing.map(m => [m.id, { ...m }]));
  for (const mat of incoming) {
    const ex = map.get(mat.id);
    if (ex) ex.quantity += mat.quantity;
    else map.set(mat.id, { ...mat });
  }
  return Array.from(map.values());
}

// Calculate account XP for a run
export function calculateRunXP(floors: number, kills: number, bossKilled: boolean, newRecord: boolean): number {
  return 50 + (floors * 20) + (kills * 2) + (bossKilled ? 200 : 0) + (newRecord ? 100 : 0);
}
