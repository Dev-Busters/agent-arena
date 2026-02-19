'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAgentLoadout } from '@/stores/agentLoadout';
import { DOCTRINE_ABILITIES, DOCTRINE_COLORS, FRAGMENT_COSTS, RANK_LABELS, DoctrineKey } from './doctrineAbilities';

const DOCTRINE_TABS: { key: DoctrineKey; label: string; fragColor: string }[] = [
  { key: 'iron', label: '🔴 Iron',  fragColor: '#c0392b' },
  { key: 'arc',  label: '🔵 Arc',   fragColor: '#2e86de' },
  { key: 'edge', label: '🟢 Edge',  fragColor: '#27ae60' },
];

function RankPip({ filled, color }: { filled: boolean; color: string }) {
  return (
    <div className="w-2 h-2 rounded-full" style={{
      background: filled ? color : 'transparent',
      border: `1px solid ${filled ? color : '#3a3a4a'}`,
    }} />
  );
}

export default function AbilityRankUp() {
  const loadout = useAgentLoadout();
  const [activeDoc, setActiveDoc] = useState<DoctrineKey>('iron');

  const docColor = DOCTRINE_COLORS[activeDoc];
  const fragBalance = loadout.techniqueFragments[activeDoc];

  const unlockedAbilities = DOCTRINE_ABILITIES.filter(
    a => a.doctrine === activeDoc
      && a.effectType !== 'placeholder'
      && loadout.unlockedAbilities.includes(a.id)
  );

  const handleRankUp = (abilityId: string) => {
    loadout.rankUpAbility(abilityId);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
      className="relative overflow-hidden rounded-2xl mb-4"
      style={{
        background: 'linear-gradient(160deg, rgba(18,18,28,0.8) 0%, rgba(10,10,16,0.9) 100%)',
        border: '1px solid #2a2a3d', padding: '20px 24px',
      }}
    >
      <div className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: '#8a6d2b' }}>
        ⚗ Ability Rank-Up
      </div>

      {/* Doctrine tabs */}
      <div className="flex gap-2 mb-4">
        {DOCTRINE_TABS.map(t => (
          <button key={t.key} onClick={() => setActiveDoc(t.key)}
            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: activeDoc === t.key ? `${DOCTRINE_COLORS[t.key]}22` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${activeDoc === t.key ? DOCTRINE_COLORS[t.key] : '#2a2a3d'}`,
              color: activeDoc === t.key ? DOCTRINE_COLORS[t.key] : '#8a8478',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Fragment balance */}
      <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${docColor}33` }}>
        <span style={{ color: docColor, fontSize: 14 }}>◈</span>
        <span className="font-mono font-bold" style={{ color: docColor }}>{fragBalance}</span>
        <span className="text-xs" style={{ color: '#5c574e' }}>
          {activeDoc.charAt(0).toUpperCase() + activeDoc.slice(1)} Fragments available
          · Rank I→II costs 5 · Rank II→III costs 12
        </span>
      </div>

      {/* Ability list */}
      {unlockedAbilities.length === 0 ? (
        <div className="text-center py-6 text-xs italic" style={{ color: '#3a3a4a' }}>
          No abilities unlocked for this Doctrine yet — earn XP to unlock them.
        </div>
      ) : (
        <div className="space-y-2">
          {unlockedAbilities.map(ability => {
            const rank = (loadout.abilityRanks[ability.id] ?? 1) as 1 | 2 | 3;
            const isMax = rank >= 3;
            const cost = isMax ? null : FRAGMENT_COSTS[rank as 1 | 2];
            const canAfford = cost !== null && fragBalance >= cost;
            const rankDef = rank === 1 ? null : rank === 2 ? ability.rank2 : ability.rank3;
            const nextRankDef = rank === 1 ? ability.rank2 : rank === 2 ? ability.rank3 : null;

            return (
              <div key={ability.id} className="rounded-xl p-3"
                style={{
                  background: `rgba(${docColor === '#c0392b' ? '192,57,43' : docColor === '#2e86de' ? '46,134,222' : '39,174,96'}, 0.06)`,
                  border: `1px solid ${docColor}33`,
                }}>
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">{ability.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-sm" style={{ color: '#f0ece4' }}>{ability.name}</span>
                      {/* Rank pips */}
                      <div className="flex gap-1">
                        {([1, 2, 3] as const).map(r => (
                          <RankPip key={r} filled={rank >= r} color={docColor} />
                        ))}
                      </div>
                      <span className="text-xs font-mono font-bold" style={{ color: docColor }}>
                        {isMax ? 'MAX' : `Rank ${RANK_LABELS[rank]}`}
                      </span>
                    </div>
                    <p className="text-xs mb-1" style={{ color: '#8a8478' }}>
                      {rankDef?.description ?? ability.description}
                    </p>
                    {nextRankDef && (
                      <p className="text-[10px] italic" style={{ color: '#5c574e' }}>
                        Next: {nextRankDef.description}
                      </p>
                    )}
                  </div>
                  {/* Rank-up button */}
                  <div className="flex-shrink-0">
                    {isMax ? (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg"
                        style={{ background: `${docColor}22`, color: docColor }}>
                        ★ MAX
                      </span>
                    ) : (
                      <motion.button
                        whileHover={canAfford ? { scale: 1.05 } : {}}
                        whileTap={canAfford ? { scale: 0.95 } : {}}
                        onClick={() => canAfford && handleRankUp(ability.id)}
                        disabled={!canAfford}
                        className="flex flex-col items-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                        style={{
                          background: canAfford ? `${docColor}22` : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${canAfford ? docColor : '#2a2a3d'}`,
                          color: canAfford ? docColor : '#3a3a4a',
                          cursor: canAfford ? 'pointer' : 'not-allowed',
                        }}>
                        <span>Rank Up</span>
                        <span className="font-mono text-[10px] mt-0.5">◈{cost}</span>
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
