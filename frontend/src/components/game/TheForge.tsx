'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useAgentLoadout } from '@/stores/agentLoadout';
import { GEAR_BLUEPRINTS, MATERIALS, GearBlueprint, RARITY_COLORS, RARITY_LABEL, DOCTRINE_GEAR_COLOR, craftGearFromBlueprint } from './gear';

type DocFilter = 'all' | 'iron' | 'arc' | 'edge' | 'universal';

const DOC_TABS: { key: DocFilter; label: string; color: string }[] = [
  { key:'all',       label:'All',       color:'#8a8478' },
  { key:'iron',      label:'🔴 Iron',   color:'#c0392b' },
  { key:'arc',       label:'🔵 Arc',    color:'#2e86de' },
  { key:'edge',      label:'🟢 Edge',   color:'#27ae60' },
  { key:'universal', label:'✨ Gold',   color:'#d4a843' },
];

function BlueprintCard({ bp, canCraft, locked, onCraft }: {
  bp: GearBlueprint; canCraft: boolean; locked: boolean; onCraft: () => void;
}) {
  const [flash, setFlash] = useState<'success' | 'error' | null>(null);
  const rarityCol = RARITY_COLORS[bp.rarity];
  const docColor = DOCTRINE_GEAR_COLOR[bp.doctrine];
  const matMap = new Map(MATERIALS.map(m => [m.id, m]));

  const handleCraft = () => {
    if (!canCraft || locked) { setFlash('error'); setTimeout(() => setFlash(null), 800); return; }
    onCraft();
    setFlash('success');
    setTimeout(() => setFlash(null), 1000);
  };

  return (
    <motion.div
      layout
      className="rounded-xl p-4"
      style={{
        background: locked ? 'rgba(10,10,14,0.6)' : `${docColor}08`,
        border: `1px solid ${flash === 'success' ? '#27ae60' : flash === 'error' ? '#c0392b' : locked ? '#1e1e2e' : rarityCol + '55'}`,
        transition: 'border-color 0.2s',
        opacity: locked ? 0.55 : 1,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-bold text-sm" style={{ color: locked ? '#3a3a4a' : rarityCol }}>{bp.name}</div>
          <div className="text-[10px] font-mono mt-0.5" style={{ color: docColor }}>
            {RARITY_LABEL[bp.rarity]} · {bp.doctrine.charAt(0).toUpperCase() + bp.doctrine.slice(1)} · {bp.slot}
          </div>
        </div>
        {locked && <span className="text-[10px] px-2 py-0.5 rounded-lg" style={{ background:'rgba(255,255,255,0.04)', color:'#3a3a4a' }}>🔒</span>}
      </div>

      {/* Description */}
      <p className="text-[11px] mb-3 italic" style={{ color:'#5c574e' }}>{bp.description}</p>

      {/* Costs */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg"
          style={{ background:'rgba(192,192,192,0.08)', border:'1px solid #2a2a3d', color:'#c0c0c0' }}>
          Ash ×{bp.ashCost}
        </span>
        {bp.markCost && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg"
            style={{ background:'rgba(212,168,67,0.08)', border:'1px solid #d4a84333', color:'#d4a843' }}>
            ⚜️ ×{bp.markCost}
          </span>
        )}
        {bp.materials.map(req => {
          const mat = matMap.get(req.materialId);
          return (
            <span key={req.materialId} className="text-[10px] font-mono px-2 py-0.5 rounded-lg"
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid #1e1e2e', color:'#8a8478' }}>
              {mat?.icon} {mat?.name} ×{req.qty}
            </span>
          );
        })}
      </div>

      {/* Unlock condition if locked */}
      {locked && (
        <div className="text-[10px] italic mb-3" style={{ color:'#3a3a4a' }}>
          Unlock: {bp.unlockCondition}
        </div>
      )}

      {/* Craft button */}
      <motion.button
        whileHover={(!locked && canCraft) ? { scale: 1.02 } : {}}
        whileTap={(!locked && canCraft) ? { scale: 0.98 } : {}}
        onClick={handleCraft}
        disabled={locked || !canCraft}
        className="w-full py-2 rounded-xl text-xs font-bold transition-all"
        style={{
          background: locked ? 'rgba(255,255,255,0.02)' : canCraft ? `${docColor}22` : 'rgba(255,255,255,0.04)',
          border: `1px solid ${locked ? '#1e1e2e' : canCraft ? docColor : '#2a2a3d'}`,
          color: locked ? '#2a2a3a' : canCraft ? docColor : '#3a3a4a',
          cursor: (!locked && canCraft) ? 'pointer' : 'not-allowed',
        }}
      >
        {locked ? '🔒 Blueprint Locked' : canCraft ? '⚒ Craft' : '⚒ Insufficient Resources'}
      </motion.button>
    </motion.div>
  );
}

export default function TheForge() {
  const loadout = useAgentLoadout();
  const [docFilter, setDocFilter] = useState<DocFilter>('all');
  const [feedback, setFeedback] = useState<string | null>(null);

  const filtered = GEAR_BLUEPRINTS.filter(bp =>
    docFilter === 'all' || bp.doctrine === docFilter
  );

  const canCraftBp = (bp: GearBlueprint): boolean => {
    if (loadout.ash < bp.ashCost) return false;
    if (bp.markCost && loadout.arenaMarks < bp.markCost) return false;
    return bp.materials.every(req => {
      const stack = loadout.materialStacks.find(m => m.materialId === req.materialId);
      return (stack?.qty ?? 0) >= req.qty;
    });
  };

  const isUnlocked = (bp: GearBlueprint): boolean => {
    return loadout.unlockedBlueprints.includes(bp.id);
  };

  const handleCraft = (bp: GearBlueprint) => {
    if (!isUnlocked(bp)) return;
    if (!canCraftBp(bp)) return;
    // Spend resources
    const ok = loadout.spendMaterials(bp.materials.map(m => ({ materialId: m.materialId, qty: m.qty })));
    if (!ok) return;
    loadout.spendAsh(bp.ashCost);
    if (bp.markCost) loadout.spendArenaMarks(bp.markCost);
    // Craft and add to inventory
    const item = craftGearFromBlueprint(bp);
    const added = loadout.addToInventory(item);
    setFeedback(added ? `✓ Crafted: ${item.name}` : '✗ Inventory full! (20/20)');
    setTimeout(() => setFeedback(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
      className="relative overflow-hidden rounded-2xl mb-4"
      style={{ background:'linear-gradient(160deg,rgba(18,18,28,0.8) 0%,rgba(10,10,16,0.9) 100%)', border:'1px solid #2a2a3d', padding:'20px 24px' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color:'#8a6d2b' }}>⚒ The Forge</div>
        <div className="flex items-center gap-4 font-mono text-[10px]">
          <span style={{ color:'#c0c0c0' }}>Ash: {loadout.ash}</span>
          <span style={{ color:'#d4a843' }}>⚜️ Marks: {loadout.arenaMarks}</span>
          {feedback && <span style={{ color: feedback.startsWith('✓') ? '#27ae60' : '#c0392b' }}>{feedback}</span>}
        </div>
      </div>

      <p className="text-[11px] mb-4 italic" style={{ color:'#5c574e' }}>
        Craft Doctrine-aligned gear from materials and Ash. Unlock blueprints through the Crucible Codex.
      </p>

      {/* Doctrine filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {DOC_TABS.map(t => (
          <button key={t.key} onClick={() => setDocFilter(t.key)}
            className="px-3 py-1 rounded-lg text-[10px] font-bold transition-all"
            style={{
              background: docFilter === t.key ? `${t.color}22` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${docFilter === t.key ? t.color : '#2a2a3d'}`,
              color: docFilter === t.key ? t.color : '#5c574e',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Blueprints grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map(bp => (
          <BlueprintCard key={bp.id} bp={bp}
            canCraft={canCraftBp(bp)}
            locked={!isUnlocked(bp)}
            onCraft={() => handleCraft(bp)}
          />
        ))}
      </div>
    </motion.div>
  );
}
