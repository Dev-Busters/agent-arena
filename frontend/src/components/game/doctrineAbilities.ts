export type DoctrineKey = 'iron' | 'arc' | 'edge';
export type AbilityEffectType = 'dash' | 'blast' | 'projectile' | 'heal' | 'melee_burst' | 'placeholder';

export interface AbilityRankDef {
  description: string;
  cooldownMs?: number;
  effectParams?: { damage?: number; range?: number; healPercent?: number; count?: number };
}

export interface DoctrineAbility {
  id: string;
  name: string;
  description: string;
  doctrine: DoctrineKey;
  unlockLevel: 1 | 5 | 12 | 20;
  cooldownMs: number;
  icon: string;
  suggestedSlot: 'Q' | 'E' | 'R' | 'F';
  effectType: AbilityEffectType;
  effectParams: { damage?: number; range?: number; healPercent?: number; count?: number };
  rank2?: AbilityRankDef;
  rank3?: AbilityRankDef;
}

export const DOCTRINE_ABILITIES: DoctrineAbility[] = [
  // ── IRON ──────────────────────────────────────────────────────────────────
  {
    id:'iron_shield_bash', name:'Shield Bash', description:'Charge 80px forward, deal 20 dmg',
    doctrine:'iron', unlockLevel:1, cooldownMs:3000, icon:'🛡', suggestedSlot:'Q',
    effectType:'dash', effectParams:{ damage:20, range:80 },
    rank2:{ description:'30 dmg, knockback 1.2×, 1s stun after bash', effectParams:{ damage:30, range:80 } },
    rank3:{ description:'40 dmg, knockback 1.5×, 1.5s stun — reflects projectiles during bash', effectParams:{ damage:40, range:90 } },
  },
  {
    id:'iron_iron_skin', name:'Iron Skin', description:'Reduce damage taken by 50% for 2s',
    doctrine:'iron', unlockLevel:1, cooldownMs:8000, icon:'🔩', suggestedSlot:'F',
    effectType:'placeholder', effectParams:{},
    rank2:{ description:'Reduce damage 60% for 2.5s', cooldownMs:7500 },
    rank3:{ description:'Reduce damage 70% for 3s + reflect 20% of blocked damage back', cooldownMs:7000 },
  },
  {
    id:'iron_slam', name:'Slam', description:'Area burst 80px radius, 35 damage',
    doctrine:'iron', unlockLevel:5, cooldownMs:5000, icon:'💥', suggestedSlot:'E',
    effectType:'blast', effectParams:{ damage:35, range:80 },
    rank2:{ description:'45 dmg, 100px radius, brief slow on all enemies hit', effectParams:{ damage:45, range:100 } },
    rank3:{ description:'60 dmg, 120px radius, 1s stun — leaves a 2s damage zone', effectParams:{ damage:60, range:120 } },
  },
  {
    id:'iron_war_cry', name:'War Cry', description:'Heal 15% HP + +20% damage for 2s',
    doctrine:'iron', unlockLevel:5, cooldownMs:10000, icon:'📯', suggestedSlot:'F',
    effectType:'heal', effectParams:{ healPercent:0.15 },
    rank2:{ description:'Heal 20% HP + +30% damage for 2.5s', effectParams:{ healPercent:0.20 } },
    rank3:{ description:'Heal 25% HP + +40% damage for 3s — also grants +20% move speed', effectParams:{ healPercent:0.25 } },
  },
  { id:'iron_p12a', name:'Coming Soon', description:'Unlocks at Iron Level 12', doctrine:'iron', unlockLevel:12, cooldownMs:5000, icon:'🔒', suggestedSlot:'Q', effectType:'placeholder', effectParams:{} },
  { id:'iron_p12b', name:'Coming Soon', description:'Unlocks at Iron Level 12', doctrine:'iron', unlockLevel:12, cooldownMs:5000, icon:'🔒', suggestedSlot:'R', effectType:'placeholder', effectParams:{} },
  { id:'iron_p20a', name:'Coming Soon', description:'Unlocks at Iron Level 20', doctrine:'iron', unlockLevel:20, cooldownMs:5000, icon:'🔒', suggestedSlot:'Q', effectType:'placeholder', effectParams:{} },
  { id:'iron_p20b', name:'Coming Soon', description:'Unlocks at Iron Level 20', doctrine:'iron', unlockLevel:20, cooldownMs:5000, icon:'🔒', suggestedSlot:'E', effectType:'placeholder', effectParams:{} },

  // ── ARC ───────────────────────────────────────────────────────────────────
  {
    id:'arc_barrage', name:'Arcane Barrage', description:'Fire 3 projectiles in a spread (20 dmg each)',
    doctrine:'arc', unlockLevel:1, cooldownMs:5000, icon:'⚡', suggestedSlot:'R',
    effectType:'projectile', effectParams:{ damage:20, count:3 },
    rank2:{ description:'4 projectiles, 24 dmg each, slight homing', effectParams:{ damage:24, count:4 } },
    rank3:{ description:'5 projectiles, 28 dmg each, strong homing — hits chain to 1 nearby enemy', effectParams:{ damage:28, count:5 } },
  },
  {
    id:'arc_gravity', name:'Gravity Well', description:'Pull all enemies within 120px toward you',
    doctrine:'arc', unlockLevel:1, cooldownMs:8000, icon:'🌀', suggestedSlot:'E',
    effectType:'blast', effectParams:{ range:120, damage:10 },
    rank2:{ description:'140px pull radius, 15 dmg, pull duration +0.5s', effectParams:{ range:140, damage:15 } },
    rank3:{ description:'160px pull, 20 dmg — pulled enemies are briefly stunned 0.5s', effectParams:{ range:160, damage:20 } },
  },
  {
    id:'arc_chain', name:'Chain Lightning', description:'Blast that chains to 3 nearby enemies (25 dmg each)',
    doctrine:'arc', unlockLevel:5, cooldownMs:6000, icon:'🌩', suggestedSlot:'E',
    effectType:'blast', effectParams:{ damage:25, count:3 },
    rank2:{ description:'Chains to 4 enemies, 30 dmg each', effectParams:{ damage:30, count:4 } },
    rank3:{ description:'Chains to 5 enemies, 35 dmg each — chain explosions deal 10 AoE each', effectParams:{ damage:35, count:5 } },
  },
  {
    id:'arc_frost', name:'Frost Zone', description:'Slow all enemies 50% for 3s',
    doctrine:'arc', unlockLevel:5, cooldownMs:9000, icon:'❄️', suggestedSlot:'R',
    effectType:'blast', effectParams:{ range:150, damage:0 },
    rank2:{ description:'Slow 60% for 3.5s, 160px radius, 5 dmg on apply', effectParams:{ range:160, damage:5 } },
    rank3:{ description:'Slow 70% for 4s, 180px radius, 15 dmg on apply', effectParams:{ range:180, damage:15 } },
  },
  { id:'arc_p12a', name:'Coming Soon', description:'Unlocks at Arc Level 12', doctrine:'arc', unlockLevel:12, cooldownMs:5000, icon:'🔒', suggestedSlot:'Q', effectType:'placeholder', effectParams:{} },
  { id:'arc_p12b', name:'Coming Soon', description:'Unlocks at Arc Level 12', doctrine:'arc', unlockLevel:12, cooldownMs:5000, icon:'🔒', suggestedSlot:'R', effectType:'placeholder', effectParams:{} },
  { id:'arc_p20a', name:'Coming Soon', description:'Unlocks at Arc Level 20', doctrine:'arc', unlockLevel:20, cooldownMs:5000, icon:'🔒', suggestedSlot:'Q', effectType:'placeholder', effectParams:{} },
  { id:'arc_p20b', name:'Coming Soon', description:'Unlocks at Arc Level 20', doctrine:'arc', unlockLevel:20, cooldownMs:5000, icon:'🔒', suggestedSlot:'E', effectType:'placeholder', effectParams:{} },

  // ── EDGE ──────────────────────────────────────────────────────────────────
  {
    id:'edge_rapid', name:'Rapid Strike', description:'3 fast attacks in sequence (15 dmg each)',
    doctrine:'edge', unlockLevel:1, cooldownMs:3000, icon:'⚔️', suggestedSlot:'Q',
    effectType:'melee_burst', effectParams:{ damage:15, count:3 },
    rank2:{ description:'4 fast attacks, 18 dmg each', effectParams:{ damage:18, count:4 } },
    rank3:{ description:'5 attacks, 20 dmg each — final hit deals 2× damage', effectParams:{ damage:20, count:5 } },
  },
  {
    id:'edge_shadow', name:'Shadow Step', description:'Teleport behind nearest enemy + 25 dmg backstab',
    doctrine:'edge', unlockLevel:1, cooldownMs:5000, icon:'👤', suggestedSlot:'Q',
    effectType:'dash', effectParams:{ damage:25, range:200 },
    rank2:{ description:'35 dmg backstab + 1s invisibility after teleporting', effectParams:{ damage:35, range:220 } },
    rank3:{ description:'45 dmg backstab + 2s invisibility — next attack after teleport is guaranteed crit', effectParams:{ damage:45, range:240 } },
  },
  {
    id:'edge_crit_burst', name:'Crit Burst', description:'Next 3 attacks are guaranteed crits',
    doctrine:'edge', unlockLevel:5, cooldownMs:4000, icon:'💢', suggestedSlot:'E',
    effectType:'placeholder', effectParams:{},
    rank2:{ description:'Next 4 attacks are guaranteed crits + +20% crit damage', cooldownMs:3500 },
    rank3:{ description:'Next 5 attacks are guaranteed crits + +40% crit dmg — first crit explodes in AoE', cooldownMs:3000 },
  },
  {
    id:'edge_blade_dance', name:'Blade Dance', description:'Spin dealing 20 dmg to all within 60px',
    doctrine:'edge', unlockLevel:5, cooldownMs:7000, icon:'🌪', suggestedSlot:'E',
    effectType:'blast', effectParams:{ damage:20, range:60 },
    rank2:{ description:'28 dmg, 75px radius, slightly pulls enemies in during spin', effectParams:{ damage:28, range:75 } },
    rank3:{ description:'35 dmg, 90px radius, 2 full rotations — leaves a 1s damage trail', effectParams:{ damage:35, range:90 } },
  },
  { id:'edge_p12a', name:'Coming Soon', description:'Unlocks at Edge Level 12', doctrine:'edge', unlockLevel:12, cooldownMs:5000, icon:'🔒', suggestedSlot:'Q', effectType:'placeholder', effectParams:{} },
  { id:'edge_p12b', name:'Coming Soon', description:'Unlocks at Edge Level 12', doctrine:'edge', unlockLevel:12, cooldownMs:5000, icon:'🔒', suggestedSlot:'R', effectType:'placeholder', effectParams:{} },
  { id:'edge_p20a', name:'Coming Soon', description:'Unlocks at Edge Level 20', doctrine:'edge', unlockLevel:20, cooldownMs:5000, icon:'🔒', suggestedSlot:'Q', effectType:'placeholder', effectParams:{} },
  { id:'edge_p20b', name:'Coming Soon', description:'Unlocks at Edge Level 20', doctrine:'edge', unlockLevel:20, cooldownMs:5000, icon:'🔒', suggestedSlot:'E', effectType:'placeholder', effectParams:{} },
];

export const UNLOCK_LEVELS = [1, 5, 12, 20] as const;

export function getAbilityPair(doctrine: DoctrineKey, level: 1|5|12|20): [DoctrineAbility, DoctrineAbility] | null {
  const pair = DOCTRINE_ABILITIES.filter(a => a.doctrine === doctrine && a.unlockLevel === level);
  return pair.length >= 2 ? [pair[0], pair[1]] : null;
}

export function getAbilityById(id: string): DoctrineAbility | undefined {
  return DOCTRINE_ABILITIES.find(a => a.id === id);
}

export const DOCTRINE_COLORS: Record<DoctrineKey, string> = {
  iron: '#c0392b',
  arc:  '#2e86de',
  edge: '#27ae60',
};

/** Fragment cost to rank up: 1→2 costs 5, 2→3 costs 12 */
export const FRAGMENT_COSTS: Record<1 | 2, number> = { 1: 5, 2: 12 };

export const RANK_LABELS: Record<1 | 2 | 3, string> = { 1: 'I', 2: 'II', 3: 'III' };
