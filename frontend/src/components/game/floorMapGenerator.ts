/**
 * Floor Map Generator — Slay the Spire style node map
 * 3 columns (start → middle → exit), player picks one node per column
 */

export type NodeType = 'combat' | 'elite' | 'treasure' | 'rest' | 'shop' | 'exit';

export interface FloorMapNode {
  id: string;
  column: number;       // 0, 1, or 2
  row: number;          // position within column
  type: NodeType;
  connections: string[]; // IDs of nodes this connects to in the NEXT column
  cleared: boolean;
  active: boolean;      // clickable right now?
  current: boolean;     // player is here?
}

export interface FloorMap {
  floor: number;
  nodes: FloorMapNode[];
  playerPosition: string | null;
  isTrial: boolean;
  isBoss: boolean;
}

export function generateFloorMap(floorNumber: number): FloorMap {
  const isBoss = floorNumber % 10 === 0 && floorNumber > 0;
  const isTrial = floorNumber % 5 === 0 && !isBoss && floorNumber > 0;

  if (isBoss) {
    return { floor: floorNumber, nodes: [], playerPosition: null, isTrial: false, isBoss: true };
  }

  const nodes: FloorMapNode[] = [];

  // Column 0: 2 starting nodes (all active by default)
  const col0Types = getColTypes(0, floorNumber);
  const col0Nodes: FloorMapNode[] = col0Types.map((type, row) => ({
    id: `f${floorNumber}_c0_r${row}`,
    column: 0, row, type,
    connections: [], cleared: false, active: true, current: false,
  }));

  // Column 1: 2-3 middle nodes (locked until col0 cleared)
  const col1Count = Math.random() < 0.4 ? 3 : 2;
  const col1Types = getColTypes(1, floorNumber, col1Count);
  const col1Nodes: FloorMapNode[] = col1Types.map((type, row) => ({
    id: `f${floorNumber}_c1_r${row}`,
    column: 1, row, type,
    connections: [], cleared: false, active: false, current: false,
  }));

  // Column 2: Always 1 exit node
  const exitNode: FloorMapNode = {
    id: `f${floorNumber}_c2_r0`,
    column: 2, row: 0, type: 'exit',
    connections: [], cleared: false, active: false, current: false,
  };

  // Connect col0 → col1 (each col0 node connects to 1-2 col1 nodes)
  col0Nodes.forEach((node, i) => {
    node.connections.push(col1Nodes[i % col1Nodes.length].id);
    if (i === 0 && col1Nodes.length >= 2) {
      node.connections.push(col1Nodes[1].id);
    }
  });

  // Connect col1 → exit
  col1Nodes.forEach(node => node.connections.push(exitNode.id));

  nodes.push(...col0Nodes, ...col1Nodes, exitNode);
  return { floor: floorNumber, nodes, playerPosition: null, isTrial, isBoss: false };
}

function getColTypes(column: number, floor: number, count: number = 2): NodeType[] {
  const types: NodeType[] = [];

  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    if (column === 0) {
      // Start: mostly combat, some rest/shop on later floors
      if (floor >= 2 && rand < 0.20) types.push('rest');
      else if (floor >= 2 && rand < 0.35) types.push('shop');
      else types.push('combat');
    } else {
      // Middle: more variety
      if (floor >= 3 && rand < 0.22) types.push('elite');
      else if (floor >= 5 && rand < 0.12) types.push('treasure');
      else if (floor >= 2 && rand < 0.18) types.push('rest');
      else types.push('combat');
    }
  }
  return types;
}

/**
 * Mark a node as cleared and unlock connected nodes
 */
export function updateMapAfterClear(map: FloorMap, clearedNodeId: string): FloorMap {
  const clearedNode = map.nodes.find(n => n.id === clearedNodeId);
  if (!clearedNode) return map;

  const updated = map.nodes.map(node => {
    if (node.id === clearedNodeId) {
      return { ...node, cleared: true, current: false, active: false };
    }
    // Unlock nodes connected from the cleared node
    if (clearedNode.connections.includes(node.id)) {
      return { ...node, active: true };
    }
    return node;
  });

  return { ...map, nodes: updated, playerPosition: clearedNodeId };
}
