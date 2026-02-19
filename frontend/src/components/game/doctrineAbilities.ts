export type DoctrineKey = 'iron' | 'arc' | 'edge';
export type AbilityEffectType = 'dash' | 'blast' | 'projectile' | 'heal' | 'melee_burst' | 'placeholder';

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
}

export const DOCTRINE_ABILITIES: DoctrineAbility[] = [
  // ── IRON ──────────────────────────────────────────────────────────
  { id:'iron_shield_bash', name:'Shield Bash',   description:'Charge 80px forward, deal 20 dmg',           doctrine:'iron', unlockLevel:1,  cooldownMs:3000,  icon:'🛡',  suggestedSlot:'Q', effectType:'dash',        effectParams:{ damage:20, range:80 } },
  { id:'iron_iron_skin',   name:'Iron Skin',      description:'Reduce damage taken by 50% for 2s',          doctrine:'iron', unlockLevel:1,  cooldownMs:8000,  icon:'🔩',  suggestedSlot:'F', effectType:'placeholder',  effectParams:{} },
  { id:'iron_slam',        name:'Slam',           description:'Area burst 80px radius, 35 damage',          doctrine:'iron', unlockLevel:5,  cooldownMs:5000,  icon:'💥',  suggestedSlot:'E', effectType:'blast',        effectParams:{ damage:35, range:80 } },
  { id:'iron_war_cry',     name:'War Cry',        description:'Heal 15% HP + +20% damage for 2s',           doctrine:'iron', unlockLevel:5,  cooldownMs:10000, icon:'📯',  suggestedSlot:'F', effectType:'heal',         effectParams:{ healPercent:0.15 } },
  { id:'iron_p12a',        name:'Coming Soon',    description:'Unlocks at Iron Level 12',                   doctrine:'iron', unlockLevel:12, cooldownMs:5000,  icon:'🔒',  suggestedSlot:'Q', effectType:'placeholder',  effectParams:{} },
  { id:'iron_p12b',        name:'Coming Soon',    description:'Unlocks at Iron Level 12',                   doctrine:'iron', unlockLevel:12, cooldownMs:5000,  icon:'🔒',  suggestedSlot:'R', effectType:'placeholder',  effectParams:{} },
  { id:'iron_p20a',        name:'Coming Soon',    description:'Unlocks at Iron Level 20',                   doctrine:'iron', unlockLevel:20, cooldownMs:5000,  icon:'🔒',  suggestedSlot:'Q', effectType:'placeholder',  effectParams:{} },
  { id:'iron_p20b',        name:'Coming Soon',    description:'Unlocks at Iron Level 20',                   doctrine:'iron', unlockLevel:20, cooldownMs:5000,  icon:'🔒',  suggestedSlot:'E', effectType:'placeholder',  effectParams:{} },

  // ── ARC ───────────────────────────────────────────────────────────
  { id:'arc_barrage',      name:'Arcane Barrage', description:'Fire 3 projectiles in a spread (20 dmg each)', doctrine:'arc', unlockLevel:1,  cooldownMs:5000,  icon:'⚡',  suggestedSlot:'R', effectType:'projectile',  effectParams:{ damage:20, count:3 } },
  { id:'arc_gravity',      name:'Gravity Well',   description:'Pull all enemies within 120px toward you',     doctrine:'arc', unlockLevel:1,  cooldownMs:8000,  icon:'🌀',  suggestedSlot:'E', effectType:'blast',        effectParams:{ range:120, damage:10 } },
  { id:'arc_chain',        name:'Chain Lightning',description:'Blast that chains to 3 nearby enemies (25 dmg each)', doctrine:'arc', unlockLevel:5, cooldownMs:6000, icon:'🌩', suggestedSlot:'E', effectType:'blast', effectParams:{ damage:25, count:3 } },
  { id:'arc_frost',        name:'Frost Zone',     description:'Slow all enemies 50% for 3s',                 doctrine:'arc', unlockLevel:5,  cooldownMs:9000,  icon:'❄️',  suggestedSlot:'R', effectType:'blast',        effectParams:{ range:150, damage:0 } },
  { id:'arc_p12a',         name:'Coming Soon',    description:'Unlocks at Arc Level 12',                     doctrine:'arc', unlockLevel:12, cooldownMs:5000,  icon:'🔒',  suggestedSlot:'Q', effectType:'placeholder',  effectParams:{} },
  { id:'arc_p12b',         name:'Coming Soon',    description:'Unlocks at Arc Level 12',                     doctrine:'arc', unlockLevel:12, cooldownMs:5000,  icon:'🔒',  suggestedSlot:'R', effectType:'placeholder',  effectParams:{} },
  { id:'arc_p20a',         name:'Coming Soon',    description:'Unlocks at Arc Level 20',                     doctrine:'arc', unlockLevel:20, cooldownMs:5000,  icon:'🔒',  suggestedSlot:'Q', effectType:'placeholder',  effectParams:{} },
  { id:'arc_p20b',         name:'Coming Soon',    description:'Unlocks at Arc Level 20',                     doctrine:'arc', unlockLevel:20, cooldownMs:5000,  icon:'🔒',  suggestedSlot:'E', effectType:'placeholder',  effectParams:{} },

  // ── EDGE ──────────────────────────────────────────────────────────
  { id:'edge_rapid',       name:'Rapid Strike',   description:'3 fast attacks in sequence (15 dmg each)',   doctrine:'edge', unlockLevel:1,  cooldownMs:3000,  icon:'⚔️',  suggestedSlot:'Q', effectType:'melee_burst',  effectParams:{ damage:15, count:3 } },
  { id:'edge_shadow',      name:'Shadow Step',    description:'Teleport behind nearest enemy + 25 dmg backstab', doctrine:'edge', unlockLevel:1, cooldownMs:5000, icon:'👤', suggestedSlot:'Q', effectType:'dash', effectParams:{ damage:25, range:200 } },
  { id:'edge_crit_burst',  name:'Crit Burst',     description:'Next 3 attacks are guaranteed crits',        doctrine:'edge', unlockLevel:5,  cooldownMs:4000,  icon:'💢',  suggestedSlot:'E', effectType:'placeholder',  effectParams:{} },
  { id:'edge_blade_dance', name:'Blade Dance',    description:'Spin dealing 20 dmg to all within 60px',     doctrine:'edge', unlockLevel:5,  cooldownMs:7000,  icon:'🌪',  suggestedSlot:'E', effectType:'blast',        effectParams:{ damage:20, range:60 } },
  { id:'edge_p12a',        name:'Coming Soon',    description:'Unlocks at Edge Level 12',                   doctrine:'edge', unlockLevel:12, cooldownMs:5000,  icon:'🔒',  suggestedSlot:'Q', effectType:'placeholder',  effectParams:{} },
  { id:'edge_p12b',        name:'Coming Soon',    description:'Unlocks at Edge Level 12',                   doctrine:'edge', unlockLevel:12, cooldownMs:5000,  icon:'🔒',  suggestedSlot:'R', effectType:'placeholder',  effectParams:{} },
  { id:'edge_p20a',        name:'Coming Soon',    description:'Unlocks at Edge Level 20',                   doctrine:'edge', unlockLevel:20, cooldownMs:5000,  icon:'🔒',  suggestedSlot:'Q', effectType:'placeholder',  effectParams:{} },
  { id:'edge_p20b',        name:'Coming Soon',    description:'Unlocks at Edge Level 20',                   doctrine:'edge', unlockLevel:20, cooldownMs:5000,  icon:'🔒',  suggestedSlot:'E', effectType:'placeholder',  effectParams:{} },
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
