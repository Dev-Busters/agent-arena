'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAgentLoadout } from '@/stores/agentLoadout';
import { DOCTRINE_TREES, DoctrineKey } from './doctrineTrees';
import { DOCTRINE_COLORS } from './doctrineAbilities';

const SHARD_COLORS = {
  iron:      '#c0392b',
  arc:       '#2e86de',
  edge:      '#27ae60',
  prismatic: '#d4a843',
};

const DOCTRINE_LABELS: Record<DoctrineKey, string> = { iron: '🔴 Iron', arc: '🔵 Arc', edge: '🟢 Edge' };

function ShardBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
      style={{ background: `${color}11`, border: `1px solid ${color}33` }}>
      <span className="font-mono font-bold text-sm" style={{ color }}>{count}</span>
      <span className="text-[10px]" style={{ color: '#8a8478' }}>{label}</span>
    </div>
  );
}

export default function RespecPanel() {
  const loadout = useAgentLoadout();
  const [activeDoc, setActiveDoc] = useState<DoctrineKey>('iron');
  const [feedback, setFeedback] = useState<string | null>(null);

  const { respecShards, doctrineInvestedRanks, respecDoctrineNode } = loadout;
  const tree = DOCTRINE_TREES[activeDoc];
  const docColor = DOCTRINE_COLORS[activeDoc];

  // Nodes with at least 1 rank invested for this doctrine
  const investedNodes = tree.nodes.filter(
    n => (doctrineInvestedRanks[n.id] ?? 0) > 0
  );

  const handleRespec = (nodeId: string) => {
    const success = respecDoctrineNode(nodeId, activeDoc);
    if (success) {
      setFeedback('✓ Point refunded');
      setTimeout(() => setFeedback(null), 1500);
    } else {
      setFeedback('✗ No matching shards');
      setTimeout(() => setFeedback(null), 1500);
    }
  };

  const canRespec = respecShards[activeDoc] > 0 || respecShards.prismatic > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62 }}
      className="relative overflow-hidden rounded-2xl mb-4"
      style={{
        background: 'linear-gradient(160deg, rgba(18,18,28,0.8) 0%, rgba(10,10,16,0.9) 100%)',
        border: '1px solid #2a2a3d', padding: '20px 24px',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: '#8a6d2b' }}>⚗ Respec Workshop</div>
        {feedback && (
          <span className="text-[10px] font-mono" style={{ color: feedback.startsWith('✓') ? '#27ae60' : '#c0392b' }}>
            {feedback}
          </span>
        )}
      </div>

      {/* Shard balances */}
      <div className="flex flex-wrap gap-2 mb-4">
        <ShardBadge label="Iron Shards"     count={respecShards.iron}      color={SHARD_COLORS.iron} />
        <ShardBadge label="Arc Shards"      count={respecShards.arc}       color={SHARD_COLORS.arc} />
        <ShardBadge label="Edge Shards"     count={respecShards.edge}      color={SHARD_COLORS.edge} />
        <ShardBadge label="Prismatic"       count={respecShards.prismatic} color={SHARD_COLORS.prismatic} />
      </div>

      <p className="text-xs mb-4" style={{ color: '#5c574e' }}>
        Spend 1 matching shard (or 1 Prismatic) to refund 1 invested node rank. Shards drop from elites, bosses, and Codex milestones.
      </p>

      {/* Doctrine tabs */}
      <div className="flex gap-2 mb-4">
        {(['iron', 'arc', 'edge'] as DoctrineKey[]).map(doc => (
          <button key={doc} onClick={() => setActiveDoc(doc)}
            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: activeDoc === doc ? `${DOCTRINE_COLORS[doc]}22` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${activeDoc === doc ? DOCTRINE_COLORS[doc] : '#2a2a3d'}`,
              color: activeDoc === doc ? DOCTRINE_COLORS[doc] : '#8a8478',
            }}>
            {DOCTRINE_LABELS[doc]}
          </button>
        ))}
      </div>

      {/* Invested nodes list */}
      {investedNodes.length === 0 ? (
        <div className="text-center py-4 text-xs italic" style={{ color: '#3a3a4a' }}>
          No points invested in {DOCTRINE_LABELS[activeDoc]} yet.
        </div>
      ) : (
        <div className="space-y-1.5">
          {investedNodes.map(node => {
            const ranks = doctrineInvestedRanks[node.id] ?? 0;
            return (
              <div key={node.id}
                className="flex items-center justify-between rounded-lg px-3 py-2"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1e1e2e' }}>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold" style={{ color: '#d0cdc8' }}>{node.label}</span>
                  <span className="font-mono text-[10px] ml-2" style={{ color: docColor }}>{ranks}/{node.maxRanks}</span>
                </div>
                <motion.button
                  whileHover={canRespec ? { scale: 1.05 } : {}}
                  whileTap={canRespec ? { scale: 0.95 } : {}}
                  onClick={() => handleRespec(node.id)}
                  disabled={!canRespec}
                  className="text-[10px] font-bold px-3 py-1 rounded-lg ml-3 transition-all"
                  style={{
                    background: canRespec ? 'rgba(212,168,67,0.12)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${canRespec ? '#d4a843' : '#2a2a3d'}`,
                    color: canRespec ? '#d4a843' : '#3a3a4a',
                    cursor: canRespec ? 'pointer' : 'not-allowed',
                  }}>
                  Respec
                </motion.button>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
