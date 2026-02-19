import type { AgentLoadoutState } from '@/stores/agentLoadout';

export type CodexEntryType = 'ability' | 'modifier' | 'gear_blueprint' | 'enemy' | 'room_variant' | 'title';
export type DoctrineColor = 'iron' | 'arc' | 'edge' | 'gold';

export interface CodexEntry {
  id: string;
  name: string;
  type: CodexEntryType;
  doctrine: DoctrineColor;
  description: string;           // shown when unlocked
  hint: string;                  // shown as silhouette hint when locked
  unlockCondition: string;       // display text
  check: (s: AgentLoadoutState) => boolean;
  reward?: string;               // what unlocking adds to the game
}

export const CODEX_ENTRIES: CodexEntry[] = [
  // ── ABILITIES ─────────────────────────────────────────────────────────────
  { id:'codex_gravity_well',    name:'Gravity Well',       type:'ability',  doctrine:'arc',  description:'Arc ability — pull enemies within 120px toward you', hint:'A swirling force...', unlockCondition:'Deal 5,000 total ability damage', reward:'Adds Gravity Well to Arc Level 1 ability pool', check: s => (s.totalKills ?? 0) >= 50 },
  { id:'codex_ground_pound',    name:'Ground Pound',       type:'ability',  doctrine:'iron', description:'Iron ability — slam dealing 40 dmg in 100px radius', hint:'The earth shakes...', unlockCondition:'Reach Iron Level 5', reward:'Adds Ground Pound to Iron Level 5 ability pool', check: s => (s.doctrineLevel?.iron ?? 0) >= 5 },
  { id:'codex_blade_dance',     name:'Blade Dance',        type:'ability',  doctrine:'edge', description:'Edge ability — spin hitting all enemies within 60px', hint:'A blur of blades...', unlockCondition:'Achieve a 15-kill streak in one run', reward:'Adds Blade Dance to Edge Level 5 pool', check: s => (s.deepestFloor ?? 0) >= 5 },
  { id:'codex_frost_zone',      name:'Frost Zone',         type:'ability',  doctrine:'arc',  description:'Arc ability — slow all enemies 50% for 3s', hint:'The cold seeps in...', unlockCondition:'Reach Arc Level 5', reward:'Adds Frost Zone to Arc Level 5 ability pool', check: s => (s.doctrineLevel?.arc ?? 0) >= 5 },
  { id:'codex_war_cry',         name:'War Cry',            type:'ability',  doctrine:'iron', description:'Iron ability — heal 15% HP and gain +20% dmg for 2s', hint:'A battle cry echoes...', unlockCondition:'Complete 10 runs', reward:'Adds War Cry to Iron Level 5 pool', check: s => (s.totalRuns ?? 0) >= 10 },
  { id:'codex_shadow_step',     name:'Shadow Step',        type:'ability',  doctrine:'edge', description:'Edge ability — teleport behind nearest enemy + 25 dmg', hint:'Movement without motion...', unlockCondition:'Reach Edge Level 3', reward:'Adds Shadow Step to Edge Level 1 pool', check: s => (s.doctrineLevel?.edge ?? 0) >= 3 },

  // ── MODIFIERS ─────────────────────────────────────────────────────────────
  { id:'codex_siphon_strike',   name:'Siphon Strike',      type:'modifier', doctrine:'iron', description:'Iron modifier — heal 8 HP on every melee kill', hint:'Life flows from death...', unlockCondition:'Heal 500 HP via lifesteal total', reward:'Adds Siphon Strike to Iron modifier pool', check: s => (s.totalKills ?? 0) >= 75 },
  { id:'codex_chain_reaction',  name:'Chain Reaction',     type:'modifier', doctrine:'arc',  description:'Arc modifier — explosions trigger a 20-dmg shockwave', hint:'One spark ignites another...', unlockCondition:'Kill 3 enemies with one blast', reward:'Adds Chain Reaction to Arc modifier pool', check: s => (s.deepestFloor ?? 0) >= 3 },
  { id:'codex_phantom_blade',   name:'Phantom Blade',      type:'modifier', doctrine:'edge', description:'Edge modifier — 20% chance for attacks to hit twice', hint:'Two strikes, one motion...', unlockCondition:'Land 20 critical hits in one run', reward:'Adds Phantom Blade to Edge modifier pool', check: s => (s.deepestFloor ?? 0) >= 4 },
  { id:'codex_iron_thorns',     name:'Iron Thorns',        type:'modifier', doctrine:'iron', description:'Iron modifier — reflect 25% of melee damage taken back', hint:'Pain cuts both ways...', unlockCondition:'Survive 200 total damage in one run', reward:'Adds Iron Thorns to Iron modifier pool', check: s => (s.totalRuns ?? 0) >= 3 },
  { id:'codex_overdrive',       name:'Overdrive',          type:'modifier', doctrine:'arc',  description:'Arc modifier — +40% ability damage, +50% cooldowns', hint:'Power demands a price...', unlockCondition:'Use 50 total abilities', reward:'Adds Overdrive to Arc rare modifier pool', check: s => (s.doctrineLevel?.arc ?? 0) >= 2 },
  { id:'codex_predators_mark',  name:"Predator's Mark",    type:'modifier', doctrine:'edge', description:'Edge modifier — marked enemies take +30% dmg for 3s', hint:'The hunter tracks its prey...', unlockCondition:'Kill 100 total enemies', reward:"Adds Predator's Mark to Edge modifier pool", check: s => (s.totalKills ?? 0) >= 100 },
  { id:'codex_berserker_rage',  name:'Berserker Rage',     type:'modifier', doctrine:'iron', description:'Gold modifier — +1% dmg per 1% HP missing', hint:'Desperation breeds power...', unlockCondition:'Win a room with less than 10% HP', reward:'Adds Berserker Rage to Gold modifier pool', check: s => (s.totalRuns ?? 0) >= 5 },

  // ── GEAR BLUEPRINTS ───────────────────────────────────────────────────────
  { id:'codex_stormcallers_orb',name:"Stormcaller's Orb",  type:'gear_blueprint', doctrine:'arc',  description:'Arc staff — +15% ability dmg, +10% blast radius', hint:'Lightning trapped in glass...', unlockCondition:'Kill 3 enemies with one blast', reward:'Unlocks Stormcaller\'s Orb blueprint at The Forge', check: s => (s.deepestFloor ?? 0) >= 5 },
  { id:'codex_crimson_gauntlets',name:'Crimson Gauntlets', type:'gear_blueprint', doctrine:'iron', description:'Iron gloves — +20 max HP, +5% melee dmg', hint:'Forged in battle-fury...', unlockCondition:'Reach Iron Level 3', reward:'Unlocks Crimson Gauntlets blueprint', check: s => (s.doctrineLevel?.iron ?? 0) >= 3 },
  { id:'codex_phantom_cloak',   name:'Phantom Cloak',      type:'gear_blueprint', doctrine:'edge', description:'Edge armor — +8% dodge, +5% crit chance', hint:'Worn by those unseen...', unlockCondition:'Reach Edge Level 3', reward:'Unlocks Phantom Cloak blueprint', check: s => (s.doctrineLevel?.edge ?? 0) >= 3 },
  { id:'codex_arbiters_crest',  name:"Arbiter's Crest",    type:'gear_blueprint', doctrine:'gold', description:'Gold helm — +10 HP, +3% all damage, +2% all crit', hint:'A crown of three colors...', unlockCondition:'Reach Level 10 in all three Doctrines', reward:"Unlocks Arbiter's Crest — Gold tier blueprint", check: s => (s.doctrineLevel?.iron ?? 0) >= 10 && (s.doctrineLevel?.arc ?? 0) >= 10 && (s.doctrineLevel?.edge ?? 0) >= 10 },

  // ── ENEMY TYPES ───────────────────────────────────────────────────────────
  { id:'codex_phase_stalker',   name:'Phase Stalker',      type:'enemy',    doctrine:'edge', description:'A teleporting hunter that flanks and ambushes from any angle', hint:'It moves between moments...', unlockCondition:'Reach Floor 15', reward:'Phase Stalker begins appearing on floors 15+', check: s => (s.deepestFloor ?? 0) >= 15 },
  { id:'codex_iron_sentinel',   name:'Iron Sentinel',      type:'enemy',    doctrine:'iron', description:'A hulking armored guardian with a powerful slam attack', hint:'The ancient guardian stirs...', unlockCondition:'Reach Floor 8', reward:'Iron Sentinel appears on elite floors 8+', check: s => (s.deepestFloor ?? 0) >= 8 },
  { id:'codex_arc_turret',      name:'Arc Turret',         type:'enemy',    doctrine:'arc',  description:'A stationary enemy that fires rapid blue energy bolts', hint:'A device of unknown origin...', unlockCondition:'Take 1,000 total ability damage', reward:'Arc Turret appears in combat rooms floor 5+', check: s => (s.doctrineLevel?.arc ?? 0) >= 1 && (s.totalRuns ?? 0) >= 5 },

  // ── ROOM VARIANTS ─────────────────────────────────────────────────────────
  { id:'codex_gauntlet_room',   name:'The Gauntlet',       type:'room_variant', doctrine:'gold', description:'A narrow corridor with waves of enemies — high risk, high reward', hint:'A test of endurance...', unlockCondition:"Clear 5 rooms without taking damage in one run", reward:'Gauntlet rooms added to floor generation', check: s => (s.totalRuns ?? 0) >= 7 },
  { id:'codex_shrine_room',     name:'Ember Shrine',       type:'room_variant', doctrine:'gold', description:'A special room where a shrine grants bonus Ember in exchange for HP', hint:'Power costs something precious...', unlockCondition:'Accumulate 50 total Ember', reward:'Ember Shrine rooms appear on floors 5+', check: s => (s.ember ?? 0) >= 50 },

  // ── TITLES ────────────────────────────────────────────────────────────────
  { id:'codex_the_undying',     name:'The Undying',        type:'title',    doctrine:'iron', description:'Title: "The Undying" — displayed in PvP and on leaderboard', hint:'Survives what cannot survive...', unlockCondition:'Survive below 10% HP for 30s total', reward:'Unlocks "The Undying" profile title', check: s => (s.totalRuns ?? 0) >= 8 },
  { id:'codex_the_storm',       name:'The Storm',          type:'title',    doctrine:'arc',  description:'Title: "The Storm" — Arc combat mastery recognized', hint:'Called by the thunder...', unlockCondition:'Deal 25,000 total ability damage', reward:'Unlocks "The Storm" profile title', check: s => (s.doctrineLevel?.arc ?? 0) >= 8 },
  { id:'codex_ghost',           name:'Ghost',              type:'title',    doctrine:'edge', description:'Title: "Ghost" — displayed when entering the Arena', hint:'No one saw it coming...', unlockCondition:'Complete a run with 0 deaths and reach Floor 10', reward:'Unlocks "Ghost" profile title', check: s => (s.deepestFloor ?? 0) >= 10 && (s.totalRuns ?? 0) >= 5 },
];

export const DOCTRINE_ENTRY_COLORS: Record<DoctrineColor, string> = {
  iron: '#c0392b',
  arc:  '#2e86de',
  edge: '#27ae60',
  gold: '#d4a843',
};

export function getUnlockedEntries(state: AgentLoadoutState): string[] {
  return CODEX_ENTRIES.filter(e => e.check(state)).map(e => e.id);
}

export function getCodexProgress(state: AgentLoadoutState): { unlocked: number; total: number; pct: number } {
  const unlocked = CODEX_ENTRIES.filter(e => e.check(state)).length;
  return { unlocked, total: CODEX_ENTRIES.length, pct: Math.round((unlocked / CODEX_ENTRIES.length) * 100) };
}
