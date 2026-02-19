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
const H = 560;

function nodeState(node: TreeNode, invested: Record<string, number>, tree: DoctrineTree): NodeState {
  const ranks = invested[node.id] ?? 0;
  if (ranks >= node.maxRanks) return 'maxed';
  if (ranks > 0) return 'invested';
  if (isNodeAvailable(node.id, tree, invested)) return 'available';
  return 'locked';
}

function nodeRadius(tier: TreeNode['tier']): number {
  return tier === 'root' ? 26 : tier === 'gate' ? 22 : 16;
}

function toPixel(x: number, y: number): [number, number] {
  return [x * (W - 40) + 20, y * (H - 40) + 20];
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
            const [x2, y2] = positions.get(targetId) ?? [x1, y1];
            const srcInvested = (investedRanks[node.id] ?? 0) > 0;
            const tgtState = nodeState(tree.nodes.find(n => n.id === targetId)!, investedRanks, tree);
            const opacity = srcInvested ? 0.6 : 0.2;
            const stroke = tgtState === 'locked' ? '#444' : color;
            return (
              <line key={`${node.id}-${targetId}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={stroke} strokeWidth={2} strokeOpacity={opacity}
                strokeLinecap="round"
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

          const fill = state === 'maxed'    ? color
                     : state === 'invested' ? `${color}44`
                     : state === 'available'? 'rgba(30,30,40,0.9)'
                     : 'rgba(20,20,28,0.9)';
          const stroke = state === 'locked'    ? '#333'
                       : state === 'available'  ? color
                       : color;
          const strokeOpacity = state === 'locked' ? 0.3 : state === 'available' ? 0.9 : 1;
          const glowFilter = state === 'available' ? `drop-shadow(0 0 6px ${color})` : undefined;

          return (
            <g key={node.id}
              style={{ cursor: canInvest ? 'pointer' : 'default', filter: glowFilter }}
              onClick={() => canInvest && onInvest(node.id)}
              onMouseEnter={(e) => {
                const rect = (e.currentTarget.closest('div') as HTMLElement)?.getBoundingClientRect();
                setTooltip({ node, mx: cx, my: cy - r - 8 });
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <circle cx={cx} cy={cy} r={r}
                fill={fill} stroke={stroke} strokeWidth={node.tier === 'gate' ? 3 : 2}
                strokeOpacity={strokeOpacity}
              />
              {/* Label */}
              <text x={cx} y={cy - (node.maxRanks > 1 ? 4 : 0)}
                textAnchor="middle" dominantBaseline="middle"
                fill={state === 'locked' ? '#555' : '#e8e6f0'}
                fontSize={node.tier === 'root' ? 8 : 7}
                fontWeight={node.tier !== 'minor' ? 'bold' : 'normal'}
              >
                {node.label.split(' ').map((w, i) => (
                  <tspan key={i} x={cx} dy={i === 0 ? 0 : 8}>{w}</tspan>
                ))}
              </text>
              {/* Rank counter */}
              {node.maxRanks > 1 && (
                <text x={cx} y={cy + r - 4}
                  textAnchor="middle" dominantBaseline="middle"
                  fill={state === 'locked' ? '#444' : color} fontSize={7} fontWeight="bold"
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
