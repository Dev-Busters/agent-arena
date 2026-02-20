'use client';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useAgentLoadout } from '@/stores/agentLoadout';
import { GearSlot, GearItem, SLOT_LABELS, SLOT_ICONS, RARITY_COLORS, RARITY_LABEL, DOCTRINE_GEAR_COLOR } from './gear';

const ALL_SLOTS: GearSlot[] = ['weapon','armor','helm','boots','accessory1','accessory2'];

function GearTooltip({ item }: { item: GearItem }) {
  const col = RARITY_COLORS[item.rarity];
  const docColor = DOCTRINE_GEAR_COLOR[item.doctrine];
  return (
    <div className="absolute z-50 left-full ml-2 top-0 w-52 rounded-xl p-3 pointer-events-none"
      style={{ background:'rgba(12,12,20,0.97)', border:`1px solid ${col}`, boxShadow:`0 0 12px ${col}33` }}>
      <div className="font-bold text-sm mb-1" style={{ color: col }}>{item.name}</div>
      <div className="text-[10px] mb-2 font-mono" style={{ color: docColor }}>
        {RARITY_LABEL[item.rarity]} · {item.doctrine.charAt(0).toUpperCase() + item.doctrine.slice(1)}
      </div>
      {Object.entries(item.stats).map(([stat, val]) => (
        <div key={stat} className="flex justify-between text-[11px] font-mono">
          <span style={{ color: '#8a8478' }}>{stat}</span>
          <span style={{ color: '#f0ece4', fontWeight: 700 }}>+{val}</span>
        </div>
      ))}
      {item.enchantment && (
        <div className="mt-2 pt-2 text-[10px] italic" style={{ borderTop:'1px solid #2a2a3d', color:'#d4a843' }}>
          ✨ {item.enchantment.label}
        </div>
      )}
    </div>
  );
}

function GearSlotCell({ slot }: { slot: GearSlot }) {
  const { equipment, unequipGear } = useAgentLoadout();
  const item = equipment[slot] as GearItem | null;
  const [hovered, setHovered] = useState(false);
  const rarityCol = item ? RARITY_COLORS[item.rarity] : '#2a2a3d';
  const docColor = item ? DOCTRINE_GEAR_COLOR[item.doctrine] : '#2a2a3d';

  return (
    <div className="relative">
      <motion.div
        whileHover={{ scale: 1.03 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="rounded-xl p-3 flex items-center gap-3 cursor-default"
        style={{
          background: item ? `${docColor}0f` : 'rgba(255,255,255,0.02)',
          border: `1px solid ${item ? rarityCol : '#1e1e2e'}`,
          minHeight: 60,
        }}
      >
        {/* Slot icon */}
        <div className="text-xl w-8 text-center flex-shrink-0"
          style={{ filter: item ? 'none' : 'grayscale(1) opacity(0.3)' }}>
          {SLOT_ICONS[slot]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-[9px] uppercase tracking-wider mb-0.5" style={{ color: '#5c574e' }}>
            {SLOT_LABELS[slot]}
          </div>
          {item ? (
            <>
              <div className="text-xs font-bold truncate" style={{ color: rarityCol }}>{item.name}</div>
              <div className="text-[10px] font-mono" style={{ color: '#8a8478' }}>
                {Object.entries(item.stats).slice(0, 2).map(([s, v]) => `${s} +${v}`).join(' · ')}
              </div>
            </>
          ) : (
            <div className="text-[10px] italic" style={{ color: '#2a2a3d' }}>Empty slot</div>
          )}
        </div>

        {/* Unequip */}
        {item && (
          <button onClick={() => unequipGear(slot)}
            className="text-[10px] px-2 py-1 rounded-lg flex-shrink-0 hover:opacity-80 transition-opacity"
            style={{ background:'rgba(255,255,255,0.04)', border:'1px solid #2a2a3d', color:'#5c574e' }}>
            ✕
          </button>
        )}
      </motion.div>

      {hovered && item && (
        <GearTooltip item={item} />
      )}
    </div>
  );
}

export default function GearSlots() {
  const loadout = useAgentLoadout();
  // Total stat summary
  const totals: Record<string, number> = {};
  for (const slot of ALL_SLOTS) {
    const item = loadout.equipment[slot] as GearItem | null;
    if (!item) continue;
    for (const [stat, val] of Object.entries(item.stats)) {
      totals[stat] = (totals[stat] ?? 0) + (val ?? 0);
    }
  }
  const equipped = ALL_SLOTS.filter(s => (loadout.equipment[s] as GearItem | null) !== null).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl mb-4"
      style={{ background:'linear-gradient(160deg,rgba(18,18,28,0.8) 0%,rgba(10,10,16,0.9) 100%)', border:'1px solid #2a2a3d', padding:'20px 24px' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color:'#8a6d2b' }}>⚔️ Equipment Slots</div>
        <div className="text-[10px] font-mono" style={{ color:'#5c574e' }}>{equipped}/{ALL_SLOTS.length} equipped</div>
      </div>

      {/* Slots grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {ALL_SLOTS.map(slot => <GearSlotCell key={slot} slot={slot} />)}
      </div>

      {/* Stat totals */}
      {Object.keys(totals).length > 0 && (
        <div className="rounded-xl p-3" style={{ background:'rgba(0,0,0,0.3)', border:'1px solid #1e1e2e' }}>
          <div className="text-[9px] uppercase tracking-wider mb-2" style={{ color:'#5c574e' }}>Total Bonuses</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {Object.entries(totals).map(([stat, val]) => (
              <span key={stat} className="text-[11px] font-mono">
                <span style={{ color:'#8a8478' }}>{stat}</span>
                <span style={{ color:'#f0ece4', fontWeight:700 }}> +{val}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
