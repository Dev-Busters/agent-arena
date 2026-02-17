'use client';

import { motion } from 'framer-motion';
import { FloorMap, FloorMapNode, NodeType } from './floorMapGenerator';

interface FloorMapProps {
  floorMap: FloorMap;
  onNodeSelect: (node: FloorMapNode) => void;
}

// Fixed pixel positions in the 1280px-wide map area
// Map area height is ~480px (720px canvas - 140px title - 100px ability HUD)
const COL_X: Record<number, number> = { 0: 260, 1: 640, 2: 1020 };
const ROW_Y: Record<number, number[]> = {
  1: [240],
  2: [160, 320],
  3: [100, 240, 380],
};

const NODE_ICONS: Record<NodeType, string> = {
  combat: '⚔️', elite: '👑', treasure: '💎',
  rest: '🛡️', shop: '🏪', exit: '🚪',
};
const NODE_LABELS: Record<NodeType, string> = {
  combat: 'Combat', elite: 'Elite', treasure: 'Treasure',
  rest: 'Rest', shop: 'Shop', exit: 'Exit',
};

function toRoman(n: number): string {
  const vals = [50, 40, 10, 9, 5, 4, 1];
  const syms = ['L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let r = '';
  vals.forEach((v, i) => { while (n >= v) { r += syms[i]; n -= v; } });
  return r;
}

/** Calculate x/y center of a node in the map area (580px tall) */
function nodePos(node: FloorMapNode, colNodes: FloorMapNode[]): { x: number; y: number } {
  const ys = ROW_Y[colNodes.length] || ROW_Y[2];
  return { x: COL_X[node.column], y: ys[node.row] ?? 290 };
}

export default function FloorMapComponent({ floorMap, onNodeSelect }: FloorMapProps) {
  const { floor, nodes, isTrial } = floorMap;

  // Build position map
  const posMap: Record<string, { x: number; y: number }> = {};
  [0, 1, 2].forEach(col => {
    const colNodes = nodes.filter(n => n.column === col);
    colNodes.forEach(node => {
      posMap[node.id] = nodePos(node, colNodes);
    });
  });

  // Build SVG lines
  const lines: { x1: number; y1: number; x2: number; y2: number; dimmed: boolean }[] = [];
  nodes.forEach(node => {
    const from = posMap[node.id];
    if (!from) return;
    node.connections.forEach(targetId => {
      const to = posMap[targetId];
      if (!to) return;
      lines.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y, dimmed: !node.active && !node.cleared });
    });
  });

  const bgColor = isTrial ? 'bg-red-950/95' : 'bg-slate-950/95';
  const titleColor = isTrial ? 'text-red-400' : 'text-purple-400';
  const title = isTrial ? `⚠️ TRIAL FLOOR ${toRoman(floor)}` : `FLOOR ${floor}`;
  const subtitle = isTrial ? 'The dungeon adapts to your tactics' : 'Choose your path through the dungeon';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`absolute inset-0 ${bgColor} z-40 flex flex-col pointer-events-auto`}
    >
      {/* Title */}
      <div className="text-center pt-6 pb-2 flex-shrink-0">
        <motion.h2
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`text-5xl font-bold ${titleColor} drop-shadow-lg`}
        >
          {title}
        </motion.h2>
        <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
      </div>

      {/* Map area — fixed 1280×580 coordinate space */}
      <div className="flex-1 relative overflow-hidden">
        {/* SVG connection lines */}
        <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
          {lines.map((l, i) => (
            <line
              key={i}
              x1={`${(l.x1 / 1280) * 100}%`}
              y1={`${(l.y1 / 580) * 100}%`}
              x2={`${(l.x2 / 1280) * 100}%`}
              y2={`${(l.y2 / 580) * 100}%`}
              stroke={l.dimmed ? '#374151' : '#6b7280'}
              strokeWidth="2"
              strokeDasharray={l.dimmed ? '6,4' : ''}
              opacity={l.dimmed ? 0.4 : 0.7}
            />
          ))}
        </svg>

        {/* Nodes */}
        {nodes.map(node => {
          const pos = posMap[node.id];
          if (!pos) return null;
          return (
            <MapNode
              key={node.id}
              node={node}
              x={pos.x}
              y={pos.y}
              onSelect={onNodeSelect}
            />
          );
        })}
      </div>
    </motion.div>
  );
}

function MapNode({ node, x, y, onSelect }: {
  node: FloorMapNode;
  x: number;
  y: number;
  onSelect: (n: FloorMapNode) => void;
}) {
  const pctX = `${(x / 1280) * 100}%`;
  const pctY = `${(y / 580) * 100}%`;
  const isClickable = node.active && !node.cleared;

  const borderColor = node.cleared ? 'border-slate-700'
    : !node.active ? 'border-slate-800'
    : node.type === 'elite' ? 'border-orange-400'
    : node.type === 'exit' ? 'border-red-400'
    : node.type === 'rest' ? 'border-green-400'
    : node.type === 'treasure' ? 'border-yellow-400'
    : node.type === 'shop' ? 'border-blue-400'
    : 'border-purple-500';

  const opacity = node.cleared ? 0.5 : !node.active ? 0.25 : 1;

  // Wrap in a plain div for positioning so Framer Motion's whileHover scale
  // doesn't clobber the translate(-50%,-50%) centering transform.
  return (
    <div style={{ position: 'absolute', left: pctX, top: pctY, transform: 'translate(-50%, -50%)', opacity }}>
      <motion.div
        whileHover={isClickable ? { scale: 1.15 } : {}}
        onClick={isClickable ? () => onSelect(node) : undefined}
        className={`w-20 h-20 rounded-full border-2 ${borderColor} bg-slate-900
          flex flex-col items-center justify-center
          ${isClickable ? 'cursor-pointer' : 'cursor-default'} relative`}
      >
        <span className="text-2xl leading-none">{NODE_ICONS[node.type]}</span>
        <span className="text-[10px] text-slate-300 mt-1">{NODE_LABELS[node.type]}</span>

        {/* Cleared checkmark */}
        {node.cleared && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <span className="text-green-400 text-xl">✓</span>
          </div>
        )}

        {/* Pulse ring for active nodes */}
        {isClickable && (
          <motion.div
            className={`absolute inset-0 rounded-full border-2 ${borderColor}`}
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.div>
    </div>
  );
}
