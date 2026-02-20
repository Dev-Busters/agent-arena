import type { DoctrineKey } from './doctrineTrees';

// ── Core types ───────────────────────────────────────────────────────────────
export type GearSlot = 'weapon' | 'armor' | 'helm' | 'boots' | 'accessory1' | 'accessory2';
export type GearRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type GearStat = 'Might' | 'Arcana' | 'Fortitude' | 'Agility' | 'Vitality';

export interface GearEnchantment {
  label: string;
  effect: string;
  power: number; // 0–1 (50% of original modifier)
}

export interface GearItem {
  id: string;
  name: string;
  slot: GearSlot;
  rarity: GearRarity;
  doctrine: DoctrineKey | 'universal';
  stats: Partial<Record<GearStat, number>>;
  enchantment?: GearEnchantment;
  blueprintId?: string; // set if crafted
  acquiredAt: number;   // Date.now()
}

export interface GearBlueprint {
  id: string;
  name: string;
  slot: GearSlot;
  doctrine: DoctrineKey | 'universal';
  rarity: GearRarity;
  description: string;
  ashCost: number;
  markCost?: number; // Arena Marks cost (high-end only)
  materials: { materialId: string; qty: number }[];
  unlockCondition: string;
  primaryStats: GearStat[];
}

export interface GearMaterial {
  id: string;
  name: string;
  icon: string;
  doctrine: DoctrineKey | 'universal';
  description: string;
}

// ── Constants ────────────────────────────────────────────────────────────────
export const SLOT_LABELS: Record<GearSlot, string> = {
  weapon:     'Weapon',
  armor:      'Chest',
  helm:       'Helm',
  boots:      'Boots',
  accessory1: 'Ring',
  accessory2: 'Amulet',
};

export const SLOT_ICONS: Record<GearSlot, string> = {
  weapon:     '⚔️',
  armor:      '🛡',
  helm:       '🪖',
  boots:      '👢',
  accessory1: '💍',
  accessory2: '📿',
};

export const RARITY_COLORS: Record<GearRarity, string> = {
  common:    '#8a8478',
  uncommon:  '#27ae60',
  rare:      '#2e86de',
  epic:      '#9b59b6',
  legendary: '#d4a843',
};

export const RARITY_LABEL: Record<GearRarity, string> = {
  common:    'Common',
  uncommon:  'Uncommon',
  rare:      'Rare',
  epic:      'Epic',
  legendary: 'Legendary',
};

export const DOCTRINE_GEAR_COLOR: Record<DoctrineKey | 'universal', string> = {
  iron:      '#c0392b',
  arc:       '#2e86de',
  edge:      '#27ae60',
  universal: '#d4a843',
};

// ── Stat ranges by rarity ────────────────────────────────────────────────────
const STAT_RANGES: Record<GearRarity, { min: number; max: number }> = {
  common:    { min:  3, max:  8 },
  uncommon:  { min:  6, max: 14 },
  rare:      { min: 10, max: 22 },
  epic:      { min: 16, max: 35 },
  legendary: { min: 25, max: 50 },
};

// ── Materials ────────────────────────────────────────────────────────────────
export const MATERIALS: GearMaterial[] = [
  { id:'iron_ore',       name:'Iron Ore',         icon:'🔩', doctrine:'iron',      description:'Salvaged from armored enemies. Used in Iron gear crafting.'    },
  { id:'blood_shard',    name:'Blood Shard',       icon:'🔴', doctrine:'iron',      description:'Crystallized drops from high-HP enemies. Powers Iron relics.'   },
  { id:'arc_crystal',    name:'Arc Crystal',       icon:'💠', doctrine:'arc',       description:'Resonant fragment dropped by Arc-type enemies.'                 },
  { id:'void_dust',      name:'Void Dust',         icon:'🌀', doctrine:'arc',       description:'Shimmering residue from Arc blasts. Unstable but potent.'       },
  { id:'edge_shard',     name:'Edge Shard',        icon:'💚', doctrine:'edge',      description:'Razor fragment from fast-moving enemies.'                        },
  { id:'phantom_silk',   name:'Phantom Silk',      icon:'🕸', doctrine:'edge',      description:'Near-weightless material from Wraith-class enemies.'            },
  { id:'bone_fragment',  name:'Bone Fragment',     icon:'🦴', doctrine:'universal', description:'Common drop. Used in basic crafting across all Doctrines.'      },
  { id:'ember_core',     name:'Ember Core',        icon:'🔥', doctrine:'universal', description:'Dense Ember residue. Rare drop from elites, used in Forge.'     },
];

// ── Blueprints ───────────────────────────────────────────────────────────────
export const GEAR_BLUEPRINTS: GearBlueprint[] = [
  // ── Iron (4 blueprints) ──
  {
    id:'iron_war_axe', name:"Warlord's War Axe", slot:'weapon', doctrine:'iron', rarity:'uncommon',
    description:'A heavy axe that favors raw Might over finesse.',
    ashCost:20, materials:[{ materialId:'iron_ore', qty:2 },{ materialId:'bone_fragment', qty:1 }],
    unlockCondition:'Slay 25 enemies in a single run',
    primaryStats:['Might','Fortitude'],
  },
  {
    id:'iron_bulwark', name:'Iron Bulwark', slot:'armor', doctrine:'iron', rarity:'rare',
    description:'Dense plate forged from battlefield scraps. Fortitude-focused.',
    ashCost:35, materials:[{ materialId:'iron_ore', qty:3 },{ materialId:'blood_shard', qty:1 }],
    unlockCondition:'Survive to Floor 8',
    primaryStats:['Fortitude','Vitality'],
  },
  {
    id:'iron_warhelm', name:'Warhelm of the Warden', slot:'helm', doctrine:'iron', rarity:'rare',
    description:'Provides clarity in battle. Boosts both Vitality and Might.',
    ashCost:30, materials:[{ materialId:'iron_ore', qty:2 },{ materialId:'blood_shard', qty:2 }],
    unlockCondition:'Reach Iron Level 5',
    primaryStats:['Might','Vitality'],
  },
  {
    id:'iron_greaves', name:"Juggernaut's Greaves", slot:'boots', doctrine:'iron', rarity:'epic',
    description:'Heavy boots that trade speed for Fortitude and Vitality.',
    ashCost:50, markCost:2, materials:[{ materialId:'iron_ore', qty:4 },{ materialId:'ember_core', qty:1 }],
    unlockCondition:'Invest 10 points in the Iron Skill Tree',
    primaryStats:['Fortitude','Vitality','Might'],
  },

  // ── Arc (4 blueprints) ──
  {
    id:'arc_focus_orb', name:'Stormcaller\'s Orb', slot:'accessory1', doctrine:'arc', rarity:'uncommon',
    description:'A resonant orb that amplifies Arcana.',
    ashCost:20, materials:[{ materialId:'arc_crystal', qty:2 },{ materialId:'bone_fragment', qty:1 }],
    unlockCondition:'Kill 3 enemies with a single blast',
    primaryStats:['Arcana'],
  },
  {
    id:'arc_conductor', name:'Conductor Robe', slot:'armor', doctrine:'arc', rarity:'rare',
    description:'Silk woven with resonant threads. Maximizes Arcana output.',
    ashCost:35, materials:[{ materialId:'arc_crystal', qty:2 },{ materialId:'void_dust', qty:2 }],
    unlockCondition:'Reach Arc Level 5',
    primaryStats:['Arcana','Agility'],
  },
  {
    id:'arc_void_crown', name:'Void Crown', slot:'helm', doctrine:'arc', rarity:'epic',
    description:'A circlet of compressed Arc energy. High Arcana, moderate Agility.',
    ashCost:50, markCost:2, materials:[{ materialId:'arc_crystal', qty:3 },{ materialId:'void_dust', qty:2 },{ materialId:'ember_core', qty:1 }],
    unlockCondition:'Invest 10 points in the Arc Skill Tree',
    primaryStats:['Arcana','Agility'],
  },
  {
    id:'arc_signet', name:'Arcane Signet', slot:'accessory2', doctrine:'arc', rarity:'rare',
    description:'A ring pulsing with Arc energy. Boosts Arcana and Agility.',
    ashCost:30, materials:[{ materialId:'void_dust', qty:3 },{ materialId:'bone_fragment', qty:1 }],
    unlockCondition:'Use 50 total abilities across all runs',
    primaryStats:['Arcana','Agility'],
  },

  // ── Edge (4 blueprints) ──
  {
    id:'edge_blade', name:"Phantom's Edge", slot:'weapon', doctrine:'edge', rarity:'uncommon',
    description:'A razor-thin blade favoring Agility and precision.',
    ashCost:20, materials:[{ materialId:'edge_shard', qty:2 },{ materialId:'bone_fragment', qty:1 }],
    unlockCondition:'Land 10 critical hits in a single run',
    primaryStats:['Agility','Might'],
  },
  {
    id:'edge_wraith_boots', name:"Wraith Striders", slot:'boots', doctrine:'edge', rarity:'rare',
    description:'Featherlight boots that maximize Agility above all else.',
    ashCost:35, materials:[{ materialId:'edge_shard', qty:2 },{ materialId:'phantom_silk', qty:2 }],
    unlockCondition:'Reach Edge Level 5',
    primaryStats:['Agility','Vitality'],
  },
  {
    id:'edge_shadow_wrap', name:'Shadowwrap', slot:'armor', doctrine:'edge', rarity:'rare',
    description:'A light leather wrap that enhances Agility and Might.',
    ashCost:30, materials:[{ materialId:'phantom_silk', qty:3 },{ materialId:'edge_shard', qty:1 }],
    unlockCondition:'Complete 5 runs as Edge Doctrine',
    primaryStats:['Agility','Might'],
  },
  {
    id:'edge_tempest_ring', name:'Tempest Ring', slot:'accessory1', doctrine:'edge', rarity:'epic',
    description:'Vibrates at high frequency. Extreme Agility focus.',
    ashCost:50, markCost:2, materials:[{ materialId:'edge_shard', qty:4 },{ materialId:'phantom_silk', qty:2 },{ materialId:'ember_core', qty:1 }],
    unlockCondition:'Invest 10 points in the Edge Skill Tree',
    primaryStats:['Agility','Might'],
  },

  // ── Universal (2 blueprints, high cost) ──
  {
    id:'universal_crest', name:"The Arbiter's Crest", slot:'accessory2', doctrine:'universal', rarity:'legendary',
    description:'A gold-bordered amulet of unparalleled balance. Works for any Doctrine.',
    ashCost:80, markCost:8, materials:[{ materialId:'ember_core', qty:3 },{ materialId:'iron_ore', qty:2 },{ materialId:'arc_crystal', qty:2 },{ materialId:'edge_shard', qty:2 }],
    unlockCondition:'Reach Level 10 in all three Doctrines',
    primaryStats:['Might','Arcana','Fortitude','Agility','Vitality'],
  },
  {
    id:'universal_helm', name:'Helm of the Crucible', slot:'helm', doctrine:'universal', rarity:'epic',
    description:'Forged in the deepest Crucible floors. Boosts all stats.',
    ashCost:60, markCost:5, materials:[{ materialId:'ember_core', qty:2 },{ materialId:'bone_fragment', qty:3 }],
    unlockCondition:'Reach Floor 20',
    primaryStats:['Fortitude','Vitality','Might'],
  },
];

// ── Random gear generation ───────────────────────────────────────────────────
function rollStat(rarity: GearRarity): number {
  const { min, max } = STAT_RANGES[rarity];
  return Math.floor(min + Math.random() * (max - min + 1));
}

function randomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Generate a random GearItem from a blueprint */
export function craftGearFromBlueprint(bp: GearBlueprint): GearItem {
  const stats: Partial<Record<GearStat, number>> = {};
  // Primary stats always get values; add 1-2 secondary stats at 60% of range
  bp.primaryStats.forEach(stat => { stats[stat] = rollStat(bp.rarity); });
  const allStats: GearStat[] = ['Might','Arcana','Fortitude','Agility','Vitality'];
  const secondaries = allStats.filter(s => !bp.primaryStats.includes(s));
  // 1-2 secondary stats at half power
  const numSec = Math.random() < 0.5 ? 1 : 2;
  for (let i = 0; i < numSec && i < secondaries.length; i++) {
    const s = secondaries[Math.floor(Math.random() * secondaries.length)];
    const base = rollStat(bp.rarity);
    stats[s] = Math.max(1, Math.floor(base * 0.5));
  }
  return {
    id: `gear_${randomId()}`,
    name: bp.name,
    slot: bp.slot,
    rarity: bp.rarity,
    doctrine: bp.doctrine,
    stats,
    blueprintId: bp.id,
    acquiredAt: Date.now(),
  };
}

/** Generate a random enemy drop (no blueprint) */
export function rollEnemyGearDrop(floor: number, doctrine: DoctrineKey): GearItem | null {
  // Only ~10% chance of gear drop from elites, scaled by floor
  if (Math.random() > 0.10 + floor * 0.005) return null;
  const slots: GearSlot[] = ['weapon','armor','helm','boots','accessory1','accessory2'];
  const slot = slots[Math.floor(Math.random() * slots.length)];
  const rarityRoll = Math.random();
  const rarity: GearRarity = floor >= 15 && rarityRoll > 0.92 ? 'epic'
    : floor >= 10 && rarityRoll > 0.80 ? 'rare'
    : rarityRoll > 0.55 ? 'uncommon' : 'common';

  const allStats: GearStat[] = ['Might','Arcana','Fortitude','Agility','Vitality'];
  const docStat: GearStat = doctrine === 'iron' ? 'Might' : doctrine === 'arc' ? 'Arcana' : 'Agility';
  const stats: Partial<Record<GearStat, number>> = {};
  stats[docStat] = rollStat(rarity);
  const others = allStats.filter(s => s !== docStat);
  const numExtra = rarity === 'common' ? 1 : rarity === 'uncommon' ? 1 : 2;
  for (let i = 0; i < numExtra; i++) {
    const s = others[Math.floor(Math.random() * others.length)];
    stats[s] = Math.max(1, Math.floor(rollStat(rarity) * 0.6));
  }
  const docNames: Record<DoctrineKey, string[]> = {
    iron:  ['Ironclad','Warlord\'s','Crimson','Soldier\'s','Fortress'],
    arc:   ['Arcane','Stormbound','Conductor\'s','Resonant','Void-Touched'],
    edge:  ['Phantom','Wraith\'s','Shadow','Tempest','Blade-Kissed'],
  };
  const slotNames: Record<GearSlot, string[]> = {
    weapon:     ['Blade','Axe','Crusher','Slicer','Edge'],
    armor:      ['Plate','Robe','Wrap','Vest','Chestguard'],
    helm:       ['Helm','Crown','Visor','Cap','Cowl'],
    boots:      ['Greaves','Striders','Treads','Boots','Stompers'],
    accessory1: ['Ring','Band','Signet','Loop','Circlet'],
    accessory2: ['Amulet','Pendant','Charm','Locket','Token'],
  };
  const prefix = docNames[doctrine][Math.floor(Math.random() * docNames[doctrine].length)];
  const suffix = slotNames[slot][Math.floor(Math.random() * slotNames[slot].length)];
  const name = `${prefix} ${suffix}`;

  return { id:`gear_${randomId()}`, name, slot, rarity, doctrine, stats, acquiredAt: Date.now() };
}

/** Roll material drops from an enemy kill */
export function rollMaterialDrop(doctrine: DoctrineKey, isElite: boolean): { materialId: string; qty: number }[] {
  const drops: { materialId: string; qty: number }[] = [];
  const docMat: Record<DoctrineKey, string> = { iron:'iron_ore', arc:'arc_crystal', edge:'edge_shard' };
  const docRare: Record<DoctrineKey, string> = { iron:'blood_shard', arc:'void_dust', edge:'phantom_silk' };
  // Base material: 50% chance of 1, elite: 80% chance of 1-2
  if (Math.random() < (isElite ? 0.80 : 0.50)) {
    drops.push({ materialId: docMat[doctrine], qty: isElite ? (Math.random() < 0.5 ? 2 : 1) : 1 });
  }
  // Rare material: only from elites, 30% chance
  if (isElite && Math.random() < 0.30) drops.push({ materialId: docRare[doctrine], qty: 1 });
  // Bone fragment: 30% chance from any enemy
  if (Math.random() < 0.30) drops.push({ materialId:'bone_fragment', qty:1 });
  // Ember core: very rare, only from elites
  if (isElite && Math.random() < 0.08) drops.push({ materialId:'ember_core', qty:1 });
  return drops;
}
