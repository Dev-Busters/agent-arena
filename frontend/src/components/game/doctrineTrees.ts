export type NodeTier = 'root' | 'minor' | 'gate' | 'keystone' | 'bridge';
export type DoctrineKey = 'iron' | 'arc' | 'edge';

export interface TreeNode {
  id: string;
  label: string;
  description: string;
  tier: NodeTier;
  x: number; // 0–1 normalized
  y: number; // 0–1 normalized (>1 allowed for deep nodes)
  connections: string[]; // IDs this node points TO
  maxRanks: number;
  doctrine: DoctrineKey;
  bridgeTo?: DoctrineKey; // for bridge nodes
  effect: Partial<{
    hpPct: number; damagePct: number; speedPct: number;
    critPct: number; critMult: number; damageTakenPct: number;
    lifeStealPct: number; regenPct: number; abilityDamagePct: number;
    cooldownPct: number; blastRadiusPct: number; attackSpeedPct: number;
    armorPct: number; blockChancePct: number; dodgePct: number;
  }>;
}

export interface DoctrineTree {
  doctrine: DoctrineKey;
  name: string;
  color: string;
  nodes: TreeNode[];
}

// ── IRON TREE (Crimson) ────────────────────────────────────────────────────
const IRON_NODES: TreeNode[] = [
  // Tier 1
  { id:'iron_root',     label:'Iron Constitution', description:'+5% max HP — foundation of the Iron Doctrine',   tier:'root',  x:0.50, y:0.05, connections:['iron_thick','iron_heavy','iron_fortify'], maxRanks:1, doctrine:'iron', effect:{ hpPct:5 } },
  { id:'iron_thick',    label:'Thick Skin',         description:'+3% max HP per rank',                            tier:'minor', x:0.18, y:0.28, connections:['iron_endure'],    maxRanks:3, doctrine:'iron', effect:{ hpPct:3 } },
  { id:'iron_heavy',    label:'Heavy Hands',         description:'+4% melee damage per rank',                     tier:'minor', x:0.50, y:0.28, connections:['iron_bloodlust'], maxRanks:3, doctrine:'iron', effect:{ damagePct:4 } },
  { id:'iron_fortify',  label:'Fortify',             description:'-2% damage taken per rank',                     tier:'minor', x:0.82, y:0.28, connections:['iron_hardened'], maxRanks:3, doctrine:'iron', effect:{ damageTakenPct:2 } },
  { id:'iron_endure',   label:'Endurance',           description:'+5% health regen per rank',                     tier:'minor', x:0.18, y:0.50, connections:['iron_gate'],     maxRanks:3, doctrine:'iron', effect:{ regenPct:5 } },
  { id:'iron_bloodlust',label:'Bloodlust',           description:'+1.5% lifesteal per rank',                      tier:'minor', x:0.50, y:0.50, connections:['iron_gate'],     maxRanks:2, doctrine:'iron', effect:{ lifeStealPct:1.5 } },
  { id:'iron_hardened', label:'Battle Hardened',     description:'+5% max HP per rank',                           tier:'minor', x:0.82, y:0.50, connections:['iron_gate'],     maxRanks:2, doctrine:'iron', effect:{ hpPct:5 } },
  { id:'iron_gate',     label:'Iron Will',           description:'+15% max HP — unlocks deeper Iron mastery',     tier:'gate',  x:0.50, y:0.72, connections:['iron_fort1','iron_jug1','iron_ward1'], maxRanks:1, doctrine:'iron', effect:{ hpPct:15 } },

  // ── Tier 2: Fortress (LEFT — pure tank) ──
  { id:'iron_fort1',    label:'Stone Walls',         description:'+4% armor per rank',                            tier:'minor', x:0.12, y:0.85, connections:['iron_fort2'],       maxRanks:3, doctrine:'iron', effect:{ armorPct:4 } },
  { id:'iron_fort2',    label:'Rampart',             description:'+3% block chance per rank',                     tier:'minor', x:0.08, y:1.00, connections:['iron_fort3'],       maxRanks:3, doctrine:'iron', effect:{ blockChancePct:3 } },
  { id:'iron_fort3',    label:'Thorns',              description:'Reflect 5% melee damage back per rank',         tier:'minor', x:0.12, y:1.15, connections:['iron_fortress_ks'], maxRanks:3, doctrine:'iron', effect:{ damageTakenPct:1 } },
  { id:'iron_fortress_ks', label:'Unbreakable',      description:'When HP drops below 20%, become invulnerable for 2s (90s cooldown)', tier:'keystone', x:0.10, y:1.32, connections:[], maxRanks:1, doctrine:'iron', effect:{ hpPct:5 } },

  // ── Tier 2: Juggernaut (CENTER — offensive melee) ──
  { id:'iron_jug1',     label:'Heavy Impact',        description:'+5% melee damage per rank',                     tier:'minor', x:0.50, y:0.85, connections:['iron_jug2'],        maxRanks:3, doctrine:'iron', effect:{ damagePct:5 } },
  { id:'iron_jug2',     label:'Unstoppable',         description:'+4% attack speed per rank',                     tier:'minor', x:0.44, y:1.00, connections:['iron_jug3'],        maxRanks:3, doctrine:'iron', effect:{ attackSpeedPct:4 } },
  { id:'iron_jug3',     label:'Vampiric Strikes',    description:'+2% lifesteal per rank',                        tier:'minor', x:0.50, y:1.15, connections:['iron_jug_ks'],      maxRanks:3, doctrine:'iron', effect:{ lifeStealPct:2 } },
  { id:'iron_jug_ks',   label:'Blood Frenzy',        description:'Each melee kill within 3s grants +15% attack speed (stacks 5×, resets on damage)', tier:'keystone', x:0.48, y:1.32, connections:[], maxRanks:1, doctrine:'iron', effect:{ attackSpeedPct:10 } },

  // ── Tier 2: Warden (RIGHT — defensive utility) ──
  { id:'iron_ward1',    label:'Resolute',            description:'+6% max HP per rank',                           tier:'minor', x:0.88, y:0.85, connections:['iron_ward2'],       maxRanks:3, doctrine:'iron', effect:{ hpPct:6 } },
  { id:'iron_ward2',    label:'Steadfast',           description:'-4% damage taken per rank',                     tier:'minor', x:0.92, y:1.00, connections:['iron_ward3'],       maxRanks:3, doctrine:'iron', effect:{ damageTakenPct:4 } },
  { id:'iron_ward3',    label:'Second Wind',         description:'Regen 3% HP/sec for 3s after taking a hit per rank', tier:'minor', x:0.88, y:1.15, connections:['iron_ward_ks'], maxRanks:3, doctrine:'iron', effect:{ regenPct:3 } },
  { id:'iron_ward_ks',  label:'Iron Bastion',        description:'Each second at full HP grants +1% damage (stacks 10×, resets on damage)', tier:'keystone', x:0.90, y:1.32, connections:[], maxRanks:1, doctrine:'iron', effect:{ damagePct:5 } },

  // ── Bridge: Iron → Edge (Rapid Assault) ──
  { id:'iron_bridge_edge', label:'Rapid Assault',   description:'+3% attack speed per rank — bridge to Edge Tempest', tier:'bridge', x:0.72, y:1.22, connections:['edge_temp1'], maxRanks:2, doctrine:'iron', bridgeTo:'edge', effect:{ attackSpeedPct:3 } },
];

// ── ARC TREE (Blue) ────────────────────────────────────────────────────────
const ARC_NODES: TreeNode[] = [
  // Tier 1
  { id:'arc_root',      label:'Arcane Affinity',    description:'+5% ability damage — foundation of the Arc Doctrine', tier:'root',  x:0.50, y:0.05, connections:['arc_over','arc_focus','arc_shock'], maxRanks:1, doctrine:'arc', effect:{ abilityDamagePct:5 } },
  { id:'arc_over',      label:'Overcharge',         description:'+4% ability damage per rank',                    tier:'minor', x:0.18, y:0.28, connections:['arc_conduit'],   maxRanks:3, doctrine:'arc', effect:{ abilityDamagePct:4 } },
  { id:'arc_focus',     label:'Focus',              description:'-5% cooldown duration per rank',                 tier:'minor', x:0.50, y:0.28, connections:['arc_resonance'], maxRanks:3, doctrine:'arc', effect:{ cooldownPct:5 } },
  { id:'arc_shock',     label:'Shockwave',          description:'+3% blast radius per rank',                      tier:'minor', x:0.82, y:0.28, connections:['arc_cascade'],   maxRanks:3, doctrine:'arc', effect:{ blastRadiusPct:3 } },
  { id:'arc_conduit',   label:'Conduit',            description:'+6% ability damage per rank',                    tier:'minor', x:0.18, y:0.50, connections:['arc_gate'],      maxRanks:2, doctrine:'arc', effect:{ abilityDamagePct:6 } },
  { id:'arc_resonance', label:'Resonance',          description:'-8% cooldown duration per rank',                 tier:'minor', x:0.50, y:0.50, connections:['arc_gate'],      maxRanks:2, doctrine:'arc', effect:{ cooldownPct:8 } },
  { id:'arc_cascade',   label:'Cascade',            description:'+5% blast radius per rank',                      tier:'minor', x:0.82, y:0.50, connections:['arc_gate'],      maxRanks:2, doctrine:'arc', effect:{ blastRadiusPct:5 } },
  { id:'arc_gate',      label:'Storm Caller',       description:'+15% ability damage — unlocks deeper Arc mastery', tier:'gate', x:0.50, y:0.72, connections:['arc_art1','arc_cond1','arc_surge1'], maxRanks:1, doctrine:'arc', effect:{ abilityDamagePct:15 } },

  // ── Tier 2: Artillery (LEFT — raw damage) ──
  { id:'arc_art1',      label:'High Caliber',       description:'+6% projectile damage per rank',                 tier:'minor', x:0.12, y:0.85, connections:['arc_art2'],      maxRanks:3, doctrine:'arc', effect:{ abilityDamagePct:6 } },
  { id:'arc_art2',      label:'Piercing Shot',      description:'Projectiles pierce 1 extra enemy per rank',      tier:'minor', x:0.08, y:1.00, connections:['arc_art3'],      maxRanks:2, doctrine:'arc', effect:{ abilityDamagePct:4 } },
  { id:'arc_art3',      label:'Salvo Prep',         description:'+8% chance for bonus projectile per rank',       tier:'minor', x:0.12, y:1.15, connections:['arc_art_ks'],    maxRanks:3, doctrine:'arc', effect:{ abilityDamagePct:5 } },
  { id:'arc_art_ks',    label:'Salvo',              description:'Projectile abilities fire 3 shots in a spread — each deals 60% damage', tier:'keystone', x:0.10, y:1.32, connections:[], maxRanks:1, doctrine:'arc', effect:{ abilityDamagePct:10 } },

  // ── Tier 2: Conduit (CENTER — area control) ──
  { id:'arc_cond1',     label:'Resonant Field',     description:'+5% blast radius per rank',                      tier:'minor', x:0.50, y:0.85, connections:['arc_cond2'],     maxRanks:3, doctrine:'arc', effect:{ blastRadiusPct:5 } },
  { id:'arc_cond2',     label:'Gravity Lens',       description:'+10% pull radius per rank',                      tier:'minor', x:0.44, y:1.00, connections:['arc_cond3'],     maxRanks:3, doctrine:'arc', effect:{ blastRadiusPct:4 } },
  { id:'arc_cond3',     label:'Static Zone',        description:'Blast zones persist 1s longer per rank',         tier:'minor', x:0.50, y:1.15, connections:['arc_cond_ks'],   maxRanks:3, doctrine:'arc', effect:{ cooldownPct:3 } },
  { id:'arc_cond_ks',   label:'Singularity',        description:'Blast abilities pull enemies inward before detonating', tier:'keystone', x:0.48, y:1.32, connections:[], maxRanks:1, doctrine:'arc', effect:{ blastRadiusPct:10 } },

  // ── Tier 2: Overcharge (RIGHT — ability cycling) ──
  { id:'arc_surge1',    label:'Surge Protocol',     description:'-6% cooldown per rank',                          tier:'minor', x:0.88, y:0.85, connections:['arc_surge2'],    maxRanks:3, doctrine:'arc', effect:{ cooldownPct:6 } },
  { id:'arc_surge2',    label:'Power Surge',        description:'+8% ability damage on 2nd+ cast per room',       tier:'minor', x:0.92, y:1.00, connections:['arc_surge3'],    maxRanks:3, doctrine:'arc', effect:{ abilityDamagePct:8 } },
  { id:'arc_surge3',    label:'Overload',           description:'+5% damage on abilities with <50% cooldown per rank', tier:'minor', x:0.88, y:1.15, connections:['arc_surge_ks'], maxRanks:3, doctrine:'arc', effect:{ abilityDamagePct:5 } },
  { id:'arc_surge_ks',  label:'Storm Protocol',     description:'Every 4th ability cast deals +100% damage and creates a lightning explosion', tier:'keystone', x:0.90, y:1.32, connections:[], maxRanks:1, doctrine:'arc', effect:{ abilityDamagePct:15 } },

  // ── Bridge: Arc → Iron (Fortified Conduit) ──
  { id:'arc_bridge_iron', label:'Fortified Conduit', description:'+3% damage reduction per rank — bridge to Iron Fortress', tier:'bridge', x:0.28, y:1.22, connections:['iron_fort1'], maxRanks:2, doctrine:'arc', bridgeTo:'iron', effect:{ damageTakenPct:3 } },
];

// ── EDGE TREE (Green) ──────────────────────────────────────────────────────
const EDGE_NODES: TreeNode[] = [
  // Tier 1
  { id:'edge_root',     label:'Killer Instinct',    description:'+3% crit chance — foundation of the Edge Doctrine', tier:'root',  x:0.50, y:0.05, connections:['edge_pred','edge_sharp','edge_haste'], maxRanks:1, doctrine:'edge', effect:{ critPct:3 } },
  { id:'edge_pred',     label:'Predator',           description:'+2% crit chance per rank',                       tier:'minor', x:0.18, y:0.28, connections:['edge_ambush'],   maxRanks:3, doctrine:'edge', effect:{ critPct:2 } },
  { id:'edge_sharp',    label:'Sharpened',          description:'+8% crit multiplier per rank',                   tier:'minor', x:0.50, y:0.28, connections:['edge_finish'],   maxRanks:3, doctrine:'edge', effect:{ critMult:8 } },
  { id:'edge_haste',    label:'Haste',              description:'+3% movement speed per rank',                    tier:'minor', x:0.82, y:0.28, connections:['edge_ghost'],    maxRanks:3, doctrine:'edge', effect:{ speedPct:3 } },
  { id:'edge_ambush',   label:'Ambush',             description:'+10% damage per rank',                           tier:'minor', x:0.18, y:0.50, connections:['edge_gate'],     maxRanks:2, doctrine:'edge', effect:{ damagePct:10 } },
  { id:'edge_finish',   label:'Finisher',           description:'+5% damage per rank',                            tier:'minor', x:0.50, y:0.50, connections:['edge_gate'],     maxRanks:2, doctrine:'edge', effect:{ damagePct:5 } },
  { id:'edge_ghost',    label:'Ghost Step',         description:'+5% movement speed per rank',                    tier:'minor', x:0.82, y:0.50, connections:['edge_gate'],     maxRanks:2, doctrine:'edge', effect:{ speedPct:5 } },
  { id:'edge_gate',     label:'Edge of Ruin',       description:'+10% crit mult, +5% crit chance — unlocks deeper Edge mastery', tier:'gate', x:0.50, y:0.72, connections:['edge_ass1','edge_wraith1','edge_temp1'], maxRanks:1, doctrine:'edge', effect:{ critMult:10, critPct:5 } },

  // ── Tier 2: Assassin (LEFT — burst damage) ──
  { id:'edge_ass1',     label:'Lethal Edge',        description:'+3% crit chance per rank',                       tier:'minor', x:0.12, y:0.85, connections:['edge_ass2'],     maxRanks:3, doctrine:'edge', effect:{ critPct:3 } },
  { id:'edge_ass2',     label:'Backstab',           description:'+15% damage vs enemies above 70% HP per rank',   tier:'minor', x:0.08, y:1.00, connections:['edge_ass3'],     maxRanks:2, doctrine:'edge', effect:{ damagePct:8 } },
  { id:'edge_ass3',     label:'Execute',            description:'+5% damage vs enemies below 30% HP per rank',    tier:'minor', x:0.12, y:1.15, connections:['edge_ass_ks'],   maxRanks:3, doctrine:'edge', effect:{ damagePct:5 } },
  { id:'edge_ass_ks',   label:'Killing Blow',       description:'Crits against enemies below 30% HP deal 3× damage', tier:'keystone', x:0.10, y:1.32, connections:[], maxRanks:1, doctrine:'edge', effect:{ critMult:20 } },

  // ── Tier 2: Wraith (CENTER — evasion) ──
  { id:'edge_wraith1',  label:'Phase Shift',        description:'+4% dodge chance per rank',                      tier:'minor', x:0.50, y:0.85, connections:['edge_wraith2'],  maxRanks:3, doctrine:'edge', effect:{ dodgePct:4 } },
  { id:'edge_wraith2',  label:'Ghostly',            description:'+2% chance to ignore incoming hit per rank',     tier:'minor', x:0.44, y:1.00, connections:['edge_wraith3'],  maxRanks:3, doctrine:'edge', effect:{ dodgePct:2 } },
  { id:'edge_wraith3',  label:'Shadow Veil',        description:'+10% speed for 1s after dodge per rank',         tier:'minor', x:0.50, y:1.15, connections:['edge_wraith_ks'], maxRanks:3, doctrine:'edge', effect:{ speedPct:4 } },
  { id:'edge_wraith_ks',label:'Afterimage',         description:'Dash leaves a decoy that enemies target for 2s, then explodes for 30 dmg', tier:'keystone', x:0.48, y:1.32, connections:[], maxRanks:1, doctrine:'edge', effect:{ dodgePct:5 } },

  // ── Tier 2: Tempest (RIGHT — speed/combos) ──
  { id:'edge_temp1',    label:'Gale Force',         description:'+3% movement speed per rank',                    tier:'minor', x:0.88, y:0.85, connections:['edge_temp2'],    maxRanks:3, doctrine:'edge', effect:{ speedPct:3 } },
  { id:'edge_temp2',    label:'Blur',               description:'+4% attack speed per rank',                      tier:'minor', x:0.92, y:1.00, connections:['edge_temp3'],    maxRanks:3, doctrine:'edge', effect:{ attackSpeedPct:4 } },
  { id:'edge_temp3',    label:'Combo Chain',        description:'+3% damage per consecutive hit (stacks 5×) per rank', tier:'minor', x:0.88, y:1.15, connections:['edge_temp_ks'], maxRanks:3, doctrine:'edge', effect:{ damagePct:3 } },
  { id:'edge_temp_ks',  label:'Whirlwind',          description:'After 5 consecutive hits without taking damage, next attack hits all enemies within 80px', tier:'keystone', x:0.90, y:1.32, connections:[], maxRanks:1, doctrine:'edge', effect:{ attackSpeedPct:8 } },

  // ── Bridge: Edge → Arc (Energized Strikes) ──
  { id:'edge_bridge_arc', label:'Energized Strikes', description:'+4% ability damage per rank — bridge to Arc Overcharge', tier:'bridge', x:0.72, y:1.22, connections:['arc_surge1'], maxRanks:2, doctrine:'edge', bridgeTo:'arc', effect:{ abilityDamagePct:4 } },
];

export const DOCTRINE_TREES: Record<DoctrineKey, DoctrineTree> = {
  iron: { doctrine:'iron', name:'Iron', color:'#c0392b', nodes: IRON_NODES },
  arc:  { doctrine:'arc',  name:'Arc',  color:'#2e86de', nodes: ARC_NODES  },
  edge: { doctrine:'edge', name:'Edge', color:'#27ae60', nodes: EDGE_NODES },
};

/** Returns true if a node's prerequisites are met */
export function isNodeAvailable(nodeId: string, tree: DoctrineTree, invested: Record<string, number>): boolean {
  const node = tree.nodes.find(n => n.id === nodeId);
  if (!node) return false;
  if (node.tier === 'root') return true;
  return tree.nodes.some(n => n.connections.includes(nodeId) && (invested[n.id] ?? 0) > 0);
}
