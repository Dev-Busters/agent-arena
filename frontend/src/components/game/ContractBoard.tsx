'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Contract, ALL_CONTRACTS, TIER_COLORS, TIER_LABELS, getActiveContracts } from './contracts';
import { DOCTRINE_ENTRY_COLORS } from './codex';
import { useAgentLoadout } from '@/stores/agentLoadout';

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

interface ContractCardProps {
  contract: Contract;
  isActive: boolean;
  onActivate: (id: string) => void;
  onAbandon: (id: string) => void;
}

function ContractCard({ contract, isActive, onActivate, onAbandon }: ContractCardProps) {
  const [expanded, setExpanded] = useState(false);
  const docColor = DOCTRINE_ENTRY_COLORS[contract.doctrine];
  const tierColor = TIER_COLORS[contract.tier];

  return (
    <motion.div
      layout
      className="rounded-xl overflow-hidden"
      style={{
        background: isActive ? `rgba(${hexToRgb(docColor)}, 0.08)` : 'rgba(255,255,255,0.025)',
        border: `1px solid ${isActive ? docColor + '55' : '#2a2a3d'}`,
        boxShadow: isActive ? `0 0 16px ${docColor}18` : 'none',
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className="flex-shrink-0 w-2 h-2 rounded-full" style={{ background: docColor, boxShadow: `0 0 6px ${docColor}` }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-sm" style={{ color: '#f0ece4' }}>{contract.title}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold"
              style={{ background: `${tierColor}22`, color: tierColor }}>
              {TIER_LABELS[contract.tier].toUpperCase()}
            </span>
          </div>
          <p className="text-xs truncate" style={{ color: '#8a8478' }}>{contract.constraint}</p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          {isActive && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${docColor}22`, color: docColor }}>ACTIVE</span>
          )}
          <span style={{ color: '#5c574e', fontSize: 10 }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t px-4 pb-4 pt-3"
            style={{ borderColor: isActive ? docColor + '33' : '#1e1e2e' }}
          >
            <p className="text-xs mb-3" style={{ color: '#c0bdb6' }}>{contract.description}</p>

            {/* Rewards */}
            <div className="rounded-lg p-2 mb-3"
              style={{ background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.15)' }}>
              <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: '#8a6d2b' }}>Rewards</div>
              <div className="text-xs font-mono font-bold" style={{ color: '#d4a843' }}>{contract.rewardDisplay}</div>
            </div>

            {/* Action button */}
            {isActive ? (
              <button onClick={() => onAbandon(contract.id)}
                className="w-full text-xs py-2 rounded-lg transition-all hover:opacity-80"
                style={{ background: 'rgba(255,60,60,0.08)', border: '1px solid rgba(255,60,60,0.25)', color: '#ff6060' }}>
                Abandon Contract
              </button>
            ) : (
              <motion.button onClick={() => onActivate(contract.id)}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full text-xs py-2 rounded-lg font-bold transition-all"
                style={{ background: `${docColor}22`, border: `1px solid ${docColor}55`, color: docColor }}>
                Accept Contract
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ContractBoard() {
  const loadout = useAgentLoadout();
  const [activeContracts, setActiveContracts] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  const displayed = showAll ? ALL_CONTRACTS : getActiveContracts();

  const handleActivate = (id: string) => {
    setActiveContracts(prev => new Set([...prev, id]));
  };
  const handleAbandon = (id: string) => {
    setActiveContracts(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const bronzeCount = displayed.filter(c => c.tier === 'bronze').length;
  const silverCount = displayed.filter(c => c.tier === 'silver').length;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
      className="relative overflow-hidden rounded-2xl mb-4"
      style={{ background: 'linear-gradient(160deg, rgba(18,18,28,0.8) 0%, rgba(10,10,16,0.9) 100%)', border: '1px solid #2a2a3d', padding: '20px 24px' }}>

      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: '#8a6d2b' }}>⚔ Arena Contracts</div>
        <div className="flex items-center gap-2">
          {activeContracts.size > 0 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(212,168,67,0.15)', color: '#d4a843' }}>
              {activeContracts.size} active
            </span>
          )}
          <button onClick={() => setShowAll(v => !v)}
            className="text-[10px] transition-colors"
            style={{ color: '#5c574e' }}>
            {showAll ? 'Show active' : `View all (${ALL_CONTRACTS.length})`}
          </button>
        </div>
      </div>

      <p className="text-xs mb-4" style={{ color: '#5c574e' }}>
        Voluntary challenges. Accept a contract to set a goal for your next run — complete it for bonus rewards.
      </p>

      {/* Tier legend */}
      <div className="flex gap-3 mb-4">
        {[{ tier:'bronze' as const, count: bronzeCount }, { tier:'silver' as const, count: silverCount }].map(({ tier, count }) => (
          count > 0 && (
            <div key={tier} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: TIER_COLORS[tier] }} />
              <span className="text-[10px]" style={{ color: TIER_COLORS[tier] }}>{TIER_LABELS[tier]} ({count})</span>
            </div>
          )
        ))}
      </div>

      {/* Contract list */}
      <div className="space-y-2">
        {displayed.map(contract => (
          <ContractCard
            key={contract.id}
            contract={contract}
            isActive={activeContracts.has(contract.id)}
            onActivate={handleActivate}
            onAbandon={handleAbandon}
          />
        ))}
      </div>

      <p className="text-[10px] mt-4 text-center italic" style={{ color: '#3a3a4a' }}>
        Contracts rotate every 12 hours · Complete lower tiers to unlock higher challenges
      </p>
    </motion.div>
  );
}
