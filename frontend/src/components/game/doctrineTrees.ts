export type NodeTier = 'root' | 'minor' | 'gate';
export type DoctrineKey = 'iron' | 'arc' | 'edge';

export interface TreeNode {
  id: string;
  label: string;
  description: string;
  tier: NodeTier;
  x: number; // 0–1 normalized
  y: number; // 0–1 normalized
  connections: string[]; // IDs this node points TO
  maxRanks: number;
  doctrine: DoctrineKey;
  effect: Partial<{
    hpPct: number; damagePct: number; speedPct: number;
    critPct: number; critMult: number; damageTakenPct: number;
    lifeStealPct: number; regenPct: number; abilityDamagePct: number;
    cooldownPct: number; blastRadiusPct: number; attackSpeedPct: number;
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
  { id:'iron_root',     label:'Iron Constitution', description:'+5% max HP — foundation of the Iron Doctrine', tier:'root', x:0.5, y:0.05, connections:['iron_thick','iron_heavy','iron_fortify'], maxRanks:1, doctrine:'iron', effect:{ hpPct:5 } },
  { id:'iron_thick',    label:'Thick Skin',         description:'+3% max HP per rank', tier:'minor', x:0.18, y:0.28, connections:['iron_endure'], maxRanks:3, doctrine:'iron', effect:{ hpPct:3 } },
  { id:'iron_heavy',    label:'Heavy Hands',         description:'+4% melee damage per rank', tier:'minor', x:0.5, y:0.28, connections:['iron_bloodlust'], maxRanks:3, doctrine:'iron', effect:{ damagePct:4 } },
  { id:'iron_fortify',  label:'Fortify',             description:'-2% damage taken per rank', tier:'minor', x:0.82, y:0.28, connections:['iron_hardened'], maxRanks:3, doctrine:'iron', effect:{ damageTakenPct:2 } },
  { id:'iron_endure',   label:'Endurance',           description:'+5% health regen per rank', tier:'minor', x:0.18, y:0.5, connections:['iron_gate'], maxRanks:3, doctrine:'iron', effect:{ regenPct:5 } },
  { id:'iron_bloodlust',label:'Bloodlust',           description:'+1.5% lifesteal per rank', tier:'minor', x:0.5, y:0.5, connections:['iron_gate'], maxRanks:2, doctrine:'iron', effect:{ lifeStealPct:1.5 } },
  { id:'iron_hardened', label:'Battle Hardened',     description:'+5% max HP per rank', tier:'minor', x:0.82, y:0.5, connections:['iron_gate'], maxRanks:2, doctrine:'iron', effect:{ hpPct:5 } },
  { id:'iron_gate',     label:'Iron Will',           description:'+15% max HP — unlocks deeper Iron mastery', tier:'gate', x:0.5, y:0.72, connections:['iron_b1','iron_b2'], maxRanks:1, doctrine:'iron', effect:{ hpPct:15 } },
  { id:'iron_b1',       label:'Fortified Strikes',   description:'+3% all damage per rank', tier:'minor', x:0.28, y:0.88, connections:[], maxRanks:3, doctrine:'iron', effect:{ damagePct:3 } },
  { id:'iron_b2',       label:'Iron Bulwark',        description:'-3% damage taken per rank', tier:'minor', x:0.72, y:0.88, connections:[], maxRanks:3, doctrine:'iron', effect:{ damageTakenPct:3 } },
];

// ── ARC TREE (Blue) ────────────────────────────────────────────────────────
const ARC_NODES: TreeNode[] = [
  { id:'arc_root',      label:'Arcane Affinity',    description:'+5% ability damage — foundation of the Arc Doctrine', tier:'root', x:0.5, y:0.05, connections:['arc_over','arc_focus','arc_shock'], maxRanks:1, doctrine:'arc', effect:{ abilityDamagePct:5 } },
  { id:'arc_over',      label:'Overcharge',         description:'+4% ability damage per rank', tier:'minor', x:0.18, y:0.28, connections:['arc_conduit'], maxRanks:3, doctrine:'arc', effect:{ abilityDamagePct:4 } },
  { id:'arc_focus',     label:'Focus',              description:'-5% cooldown duration per rank', tier:'minor', x:0.5, y:0.28, connections:['arc_resonance'], maxRanks:3, doctrine:'arc', effect:{ cooldownPct:5 } },
  { id:'arc_shock',     label:'Shockwave',          description:'+3% blast radius per rank', tier:'minor', x:0.82, y:0.28, connections:['arc_cascade'], maxRanks:3, doctrine:'arc', effect:{ blastRadiusPct:3 } },
  { id:'arc_conduit',   label:'Conduit',            description:'+6% ability damage per rank', tier:'minor', x:0.18, y:0.5, connections:['arc_gate'], maxRanks:2, doctrine:'arc', effect:{ abilityDamagePct:6 } },
  { id:'arc_resonance', label:'Resonance',          description:'-8% cooldown duration per rank', tier:'minor', x:0.5, y:0.5, connections:['arc_gate'], maxRanks:2, doctrine:'arc', effect:{ cooldownPct:8 } },
  { id:'arc_cascade',   label:'Cascade',            description:'+5% blast radius per rank', tier:'minor', x:0.82, y:0.5, connections:['arc_gate'], maxRanks:2, doctrine:'arc', effect:{ blastRadiusPct:5 } },
  { id:'arc_gate',      label:'Storm Caller',       description:'+15% ability damage — unlocks deeper Arc mastery', tier:'gate', x:0.5, y:0.72, connections:['arc_b1','arc_b2'], maxRanks:1, doctrine:'arc', effect:{ abilityDamagePct:15 } },
  { id:'arc_b1',        label:'Arcane Surge',       description:'-5% cooldown duration per rank', tier:'minor', x:0.28, y:0.88, connections:[], maxRanks:3, doctrine:'arc', effect:{ cooldownPct:5 } },
  { id:'arc_b2',        label:'Widened Blast',      description:'+4% blast radius per rank', tier:'minor', x:0.72, y:0.88, connections:[], maxRanks:3, doctrine:'arc', effect:{ blastRadiusPct:4 } },
];

// ── EDGE TREE (Green) ──────────────────────────────────────────────────────
const EDGE_NODES: TreeNode[] = [
  { id:'edge_root',     label:'Killer Instinct',    description:'+3% crit chance — foundation of the Edge Doctrine', tier:'root', x:0.5, y:0.05, connections:['edge_pred','edge_sharp','edge_haste'], maxRanks:1, doctrine:'edge', effect:{ critPct:3 } },
  { id:'edge_pred',     label:'Predator',           description:'+2% crit chance per rank', tier:'minor', x:0.18, y:0.28, connections:['edge_ambush'], maxRanks:3, doctrine:'edge', effect:{ critPct:2 } },
  { id:'edge_sharp',    label:'Sharpened',          description:'+8% crit multiplier per rank', tier:'minor', x:0.5, y:0.28, connections:['edge_finish'], maxRanks:3, doctrine:'edge', effect:{ critMult:8 } },
  { id:'edge_haste',    label:'Haste',              description:'+3% movement speed per rank', tier:'minor', x:0.82, y:0.28, connections:['edge_ghost'], maxRanks:3, doctrine:'edge', effect:{ speedPct:3 } },
  { id:'edge_ambush',   label:'Ambush',             description:'+10% damage per rank', tier:'minor', x:0.18, y:0.5, connections:['edge_gate'], maxRanks:2, doctrine:'edge', effect:{ damagePct:10 } },
  { id:'edge_finish',   label:'Finisher',           description:'+5% damage per rank', tier:'minor', x:0.5, y:0.5, connections:['edge_gate'], maxRanks:2, doctrine:'edge', effect:{ damagePct:5 } },
  { id:'edge_ghost',    label:'Ghost Step',         description:'+5% movement speed per rank', tier:'minor', x:0.82, y:0.5, connections:['edge_gate'], maxRanks:2, doctrine:'edge', effect:{ speedPct:5 } },
  { id:'edge_gate',     label:'Edge of Ruin',       description:'+10% crit mult, +5% crit chance — unlocks deeper Edge mastery', tier:'gate', x:0.5, y:0.72, connections:['edge_b1','edge_b2'], maxRanks:1, doctrine:'edge', effect:{ critMult:10, critPct:5 } },
  { id:'edge_b1',       label:"Predator's Eye",     description:'+3% crit chance per rank', tier:'minor', x:0.28, y:0.88, connections:[], maxRanks:3, doctrine:'edge', effect:{ critPct:3 } },
  { id:'edge_b2',       label:'Phantom Steps',      description:'+4% movement speed per rank', tier:'minor', x:0.72, y:0.88, connections:[], maxRanks:3, doctrine:'edge', effect:{ speedPct:4 } },
];

export const DOCTRINE_TREES: Record<DoctrineKey, DoctrineTree> = {
  iron: { doctrine:'iron', name:'Iron', color:'#c0392b', nodes: IRON_NODES },
  arc:  { doctrine:'arc',  name:'Arc',  color:'#2e86de', nodes: ARC_NODES },
  edge: { doctrine:'edge', name:'Edge', color:'#27ae60', nodes: EDGE_NODES },
};

/** Returns true if a node's prerequisites are met (parent with a connection to this node is invested) */
export function isNodeAvailable(nodeId: string, tree: DoctrineTree, invested: Record<string, number>): boolean {
  const node = tree.nodes.find(n => n.id === nodeId);
  if (!node) return false;
  if (node.tier === 'root') return true;
  // A node is available if any node whose connections[] includes this nodeId has ranks > 0
  return tree.nodes.some(n => n.connections.includes(nodeId) && (invested[n.id] ?? 0) > 0);
}
