'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAgentLoadout } from '@/stores/agentLoadout';
import {
  CODEX_ENTRIES, CodexEntry, CodexEntryType, DoctrineColor,
  DOCTRINE_ENTRY_COLORS, getCodexProgress, getUnlockedEntries,
} from './codex';

const TYPE_ICONS: Record<CodexEntryType, string> = {
  ability: '⚡', modifier: '🔮', gear_blueprint: '🛠', enemy: '👾', room_variant: '🗺', title: '👑',
};
const TYPE_LABELS: Record<CodexEntryType, string> = {
  ability: 'Ability', modifier: 'Modifier', gear_blueprint: 'Blueprint', enemy: 'Enemy', room_variant: 'Room', title: 'Title',
};
const DOC_FILTERS: { key: DoctrineColor | 'all'; label: string }[] = [
  { key:'all', label:'All' }, { key:'iron', label:'🔴 Iron' },
  { key:'arc', label:'🔵 Arc' }, { key:'edge', label:'🟢 Edge' }, { key:'gold', label:'🟡 Gold' },
];

function EntryCard({ entry, isUnlocked }: { entry: CodexEntry; isUnlocked: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const color = DOCTRINE_ENTRY_COLORS[entry.doctrine];

  return (
    <motion.div
      layout
      onClick={() => setExpanded(e => !e)}
      className="rounded-xl overflow-hidden cursor-pointer"
      style={{
        background: isUnlocked ? `rgba(${hexToRgb(color)}, 0.06)` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isUnlocked ? color + '44' : '#1e1e2e'}`,
        filter: isUnlocked ? 'none' : 'grayscale(0.4)',
      }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Icon / silhouette */}
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: isUnlocked ? `${color}22` : 'rgba(255,255,255,0.04)', fontSize: 16, filter: isUnlocked ? 'none' : 'blur(1px) brightness(0.3)' }}>
          {TYPE_ICONS[entry.type]}
        </div>
        {/* Name + type */}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-xs truncate" style={{ color: isUnlocked ? '#f0ece4' : '#3a3a4a' }}>
            {isUnlocked ? entry.name : '???'}
          </div>
          <div className="text-[10px] font-mono" style={{ color: isUnlocked ? color + 'cc' : '#2a2a3a' }}>
            {TYPE_LABELS[entry.type]}
          </div>
        </div>
        {/* Status badge */}
        <div className="flex-shrink-0">
          {isUnlocked
            ? <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: `${color}22`, color }}>UNLOCKED</span>
            : <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(255,255,255,0.04)', color: '#3a3a4a' }}>🔒</span>
          }
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="border-t px-3 pb-3 pt-2"
          style={{ borderColor: isUnlocked ? color + '33' : '#1e1e2e' }}
        >
          {isUnlocked ? (
            <>
              <p className="text-xs mb-1" style={{ color: '#d0cdc8' }}>{entry.description}</p>
              <p className="text-[10px]" style={{ color: '#8a8478' }}>
                <span style={{ color: '#d4a843' }}>Reward:</span> {entry.reward}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs italic mb-1" style={{ color: '#3a3a4a' }}>{entry.hint}</p>
              <p className="text-[10px]" style={{ color: '#5c574e' }}>
                <span style={{ color: '#8a6d2b' }}>Unlock:</span> {entry.unlockCondition}
              </p>
            </>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

export default function CrucibleCodex() {
  const loadout = useAgentLoadout();
  const unlockedIds = new Set(getUnlockedEntries(loadout));
  const progress = getCodexProgress(loadout);
  const [filter, setFilter] = useState<DoctrineColor | 'all'>('all');
  const [showUnlocked, setShowUnlocked] = useState<boolean | null>(null); // null = all

  const filtered = CODEX_ENTRIES
    .filter(e => filter === 'all' || e.doctrine === filter)
    .filter(e => showUnlocked === null || (showUnlocked ? unlockedIds.has(e.id) : !unlockedIds.has(e.id)));

  // Sort: unlocked first
  const sorted = [...filtered].sort((a, b) => {
    const au = unlockedIds.has(a.id) ? 0 : 1;
    const bu = unlockedIds.has(b.id) ? 0 : 1;
    return au - bu;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
      className="relative overflow-hidden rounded-2xl mb-4"
      style={{ background: 'linear-gradient(160deg, rgba(18,18,28,0.8) 0%, rgba(10,10,16,0.9) 100%)', border: '1px solid #2a2a3d', padding: '20px 24px' }}>

      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: '#8a6d2b' }}>📖 Crucible Codex</div>
        <div className="font-mono text-xs" style={{ color: '#5c574e' }}>
          <span style={{ color: '#d4a843', fontWeight: 700 }}>{progress.unlocked}</span>/{progress.total} · {progress.pct}%
        </div>
      </div>

      {/* Progress bar */}
      <div className="rounded-full overflow-hidden mb-4" style={{ height: 3, background: 'rgba(0,0,0,0.4)', border: '1px solid #2a2a3d' }}>
        <motion.div className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #8a6d2b, #d4a843)' }}
          initial={{ width: 0 }} animate={{ width: `${progress.pct}%` }} transition={{ duration: 0.8, delay: 0.3 }} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-3">
        {DOC_FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="px-3 py-1 rounded-lg text-[10px] font-bold transition-all"
            style={{
              background: filter === f.key ? 'rgba(212,168,67,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${filter === f.key ? '#d4a843' : '#2a2a3d'}`,
              color: filter === f.key ? '#d4a843' : '#5c574e',
            }}>
            {f.label}
          </button>
        ))}
        <div className="flex gap-1 ml-auto">
          {[{ v: null, l:'All' }, { v: true, l:'✓ Unlocked' }, { v: false, l:'🔒 Locked' }].map(opt => (
            <button key={String(opt.v)} onClick={() => setShowUnlocked(opt.v as any)}
              className="px-3 py-1 rounded-lg text-[10px] transition-all"
              style={{
                background: showUnlocked === opt.v ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${showUnlocked === opt.v ? '#4a4a5a' : '#2a2a3d'}`,
                color: showUnlocked === opt.v ? '#d0cdc8' : '#5c574e',
              }}>
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      {/* Entry grid */}
      <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
        {sorted.map(entry => (
          <EntryCard key={entry.id} entry={entry} isUnlocked={unlockedIds.has(entry.id)} />
        ))}
        {sorted.length === 0 && (
          <div className="col-span-2 text-center py-6 text-xs italic" style={{ color: '#3a3a4a' }}>
            No entries match current filter
          </div>
        )}
      </div>
    </motion.div>
  );
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}
