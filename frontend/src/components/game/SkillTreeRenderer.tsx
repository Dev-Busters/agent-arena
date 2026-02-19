'use client';
import { useState } from 'react';
import { DoctrineTree, TreeNode, isNodeAvailable } from './doctrineTrees';

interface SkillTreeRendererProps {
  tree: DoctrineTree;
  investedRanks: Record<string, number>;
  availablePoints: number;
  onInvest: (nodeId: string) => void;
}

type NodeState = 'locked' | 'available' | 'invested' | 'maxed';

const W = 400;
const H = 720; // taller to accommodate Tier 2 branches

function nodeState(node: TreeNode, invested: Record<string, number>, tree: DoctrineTree): NodeState {
  const ranks = invested[node.id] ?? 0;
  if (ranks >= node.maxRanks) return 'maxed';
  if (ranks > 0) return 'invested';
  if (isNodeAvailable(node.id, tree, invested)) return 'available';
  return 'locked';
}

function nodeRadius(tier: TreeNode['tier']): number {
  if (tier === 'root') return 26;
  if (tier === 'gate') return 22;
  if (tier === 'keystone') return 20;
  if (tier === 'bridge') return 14;
  return 16;
}

// y values can exceed 1.0 for Tier 2 nodes — map to extended canvas height
function toPixel(x: number, y: number): [number, number] {
  return [x * (W - 40) + 20, y * (H - 60) + 20];
}

function effectLabel(effect: TreeNode['effect'], ranks: number): string {
  const lines: string[] = [];
  const r = Math.max(ranks, 1);
  if (effect.hpPct)           lines.push(`+${(effect.hpPct * r).toFixed(0)}% max HP`);
  if (effect.damagePct)       lines.push(`+${(effect.damagePct * r).toFixed(0)}% damage`);
  if (effect.speedPct)        lines.push(`+${(effect.speedPct * r).toFixed(0)}% speed`);
  if (effect.critPct)         lines.push(`+${(effect.critPct * r).toFixed(0)}% crit chance`);
  if (effect.critMult)        lines.push(`+${(effect.critMult * r).toFixed(0)}% crit damage`);
  if (effect.damageTakenPct)  lines.push(`-${(effect.damageTakenPct * r).toFixed(0)}% dmg taken`);
  if (effect.lifeStealPct)    lines.push(`+${(effect.lifeStealPct * r).toFixed(1)}% lifesteal`);
  if (effect.regenPct)        lines.push(`+${(effect.regenPct * r).toFixed(0)}% regen`);
  if (effect.abilityDamagePct)lines.push(`+${(effect.abilityDamagePct * r).toFixed(0)}% ability dmg`);
  if (effect.cooldownPct)     lines.push(`-${(effect.cooldownPct * r).toFixed(0)}% cooldowns`);
  if (effect.blastRadiusPct)  lines.push(`+${(effect.blastRadiusPct * r).toFixed(0)}% blast radius`);
  return lines.join(' · ') || 'No effect';
}

export default function SkillTreeRenderer({ tree, investedRanks, availablePoints, onInvest }: SkillTreeRendererProps) {
  const [tooltip, setTooltip] = useState<{ node: TreeNode; mx: number; my: number } | null>(null);
  const color = tree.color;

  // Build pixel positions map
  const positions = new Map<string, [number, number]>();
  tree.nodes.forEach(n => positions.set(n.id, toPixel(n.x, n.y)));

  return (
    <div className="relative select-none" style={{ width: W, height: H }}>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {/* Connection lines */}
        {tree.nodes.map(node =>
          node.connections.map(targetId => {
            const [x1, y1] = positions.get(node.id)!;
            const targetInTree = tree.nodes.find(n => n.id === targetId);
            // Cross-tree bridge connections — render as a short dashed arc pointing out of frame
            if (!targetInTree) {
              const isBridgeSrc = node.tier === 'bridge';
              return (
                <line key={`${node.id}-${targetId}`}
                  x1={x1} y1={y1} x2={x1} y2={y1 + 20}
                  stroke="#7a6d9a" strokeWidth={1.5} strokeOpacity={0.4}
                  strokeDasharray="3 3" strokeLinecap="round"
                />
              );
            }
            const [x2, y2] = positions.get(targetId) ?? [x1, y1];
            const srcInvested = (investedRanks[node.id] ?? 0) > 0;
            const tgtState = nodeState(targetInTree, investedRanks, tree);
            const opacity = srcInvested ? 0.6 : 0.2;
            const isBridgeLine = node.tier === 'bridge' || targetInTree.tier === 'bridge';
            const stroke = isBridgeLine ? '#7a6d9a' : tgtState === 'locked' ? '#444' : color;
            return (
              <line key={`${node.id}-${targetId}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={stroke} strokeWidth={2} strokeOpacity={opacity}
                strokeLinecap="round"
                strokeDasharray={isBridgeLine ? '5 3' : undefined}
              />
            );
          })
        )}

        {/* Nodes */}
        {tree.nodes.map(node => {
          const [cx, cy] = positions.get(node.id)!;
          const r = nodeRadius(node.tier);
          const state = nodeState(node, investedRanks, tree);
          const ranks = investedRanks[node.id] ?? 0;
          const canInvest = state !== 'locked' && state !== 'maxed' && availablePoints > 0;

          const isKeystone = node.tier === 'keystone';
          const isBridge = node.tier === 'bridge';
          const keystoneColor = '#d4a843';

          const fill = state === 'maxed'    ? (isKeystone ? keystoneColor : color)
                     : state === 'invested' ? (isKeystone ? `${keystoneColor}44` : `${color}44`)
                     : state === 'available'? 'rgba(30,30,40,0.9)'
                     : 'rgba(20,20,28,0.9)';
          const stroke = isBridge   ? '#7a6d9a'
                       : isKeystone ? keystoneColor
                       : state === 'locked' ? '#333' : color;
          const strokeOpacity = state === 'locked' ? 0.3 : state === 'available' ? 0.9 : 1;
          const strokeWidth = isKeystone ? 3 : node.tier === 'gate' ? 3 : 2;
          const glowFilter = state === 'available'
            ? `drop-shadow(0 0 6px ${isKeystone ? keystoneColor : color})`
            : isKeystone && state === 'maxed'
            ? `drop-shadow(0 0 10px ${keystoneColor})`
            : undefined;

          return (
            <g key={node.id}
              style={{ cursor: canInvest ? 'pointer' : 'default', filter: glowFilter }}
              onClick={() => canInvest && onInvest(node.id)}
              onMouseEnter={() => setTooltip({ node, mx: cx, my: cy - r - 8 })}
              onMouseLeave={() => setTooltip(null)}
            >
              <circle cx={cx} cy={cy} r={r}
                fill={fill} stroke={stroke} strokeWidth={strokeWidth}
                strokeOpacity={strokeOpacity}
                strokeDasharray={isBridge ? '4 2' : undefined}
              />
              {/* Keystone diamond overlay */}
              {isKeystone && (
                <polygon
                  points={`${cx},${cy - r + 4} ${cx + r - 4},${cy} ${cx},${cy + r - 4} ${cx - r + 4},${cy}`}
                  fill="none" stroke={keystoneColor} strokeWidth={1} strokeOpacity={state === 'locked' ? 0.2 : 0.6}
                />
              )}
              {/* Bridge ⇌ icon */}
              {isBridge && (
                <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
                  fill={state === 'locked' ? '#444' : '#7a6d9a'} fontSize={8}>⇌</text>
              )}
              {/* Label (skip for bridge — icon is enough) */}
              {!isBridge && (
                <text x={cx} y={cy - (node.maxRanks > 1 ? 4 : 0)}
                  textAnchor="middle" dominantBaseline="middle"
                  fill={state === 'locked' ? '#555' : (isKeystone ? '#f5d98a' : '#e8e6f0')}
                  fontSize={node.tier === 'root' ? 8 : 7}
                  fontWeight={node.tier !== 'minor' ? 'bold' : 'normal'}
                >
                  {node.label.split(' ').map((w, i) => (
                    <tspan key={i} x={cx} dy={i === 0 ? 0 : 8}>{w}</tspan>
                  ))}
                </text>
              )}
              {/* Rank counter */}
              {node.maxRanks > 1 && !isBridge && (
                <text x={cx} y={cy + r - 4}
                  textAnchor="middle" dominantBaseline="middle"
                  fill={state === 'locked' ? '#444' : (isKeystone ? keystoneColor : color)} fontSize={7} fontWeight="bold"
                >
                  {ranks}/{node.maxRanks}
                </text>
              )}
              {/* Gate star */}
              {node.tier === 'gate' && (
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                  fill={state === 'maxed' ? '#fff' : color} fontSize={10}>★</text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div className="absolute pointer-events-none z-20 rounded-lg px-3 py-2"
          style={{
            left: Math.min(tooltip.mx - 80, W - 200),
            top: Math.max(tooltip.my - 70, 0),
            width: 200,
            background: 'rgba(12,12,20,0.96)',
            border: `1px solid ${color}55`,
            boxShadow: `0 0 12px ${color}22`,
          }}
        >
          <div className="font-bold text-xs mb-0.5" style={{ color }}>{tooltip.node.label}</div>
          <div className="text-xs mb-1" style={{ color: '#8a8478' }}>{tooltip.node.description}</div>
          <div className="text-xs font-mono" style={{ color: '#c0c0d0' }}>
            {effectLabel(tooltip.node.effect, tooltip.node.maxRanks)}
          </div>
          {tooltip.node.maxRanks > 1 && (
            <div className="text-xs mt-1" style={{ color: '#5c574e' }}>
              Click to invest (max {tooltip.node.maxRanks} ranks)
            </div>
          )}
        </div>
      )}
    </div>
  );
}
