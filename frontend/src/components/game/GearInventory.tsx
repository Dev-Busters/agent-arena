'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useAgentLoadout } from '@/stores/agentLoadout';
import { GearItem, SLOT_ICONS, RARITY_COLORS, RARITY_LABEL, DOCTRINE_GEAR_COLOR, MATERIALS } from './gear';

function ItemCard({ item, onEquip, onDiscard }: { item: GearItem; onEquip: () => void; onDiscard: () => void }) {
  const [hovered, setHovered] = useState(false);
  const rarityCol = RARITY_COLORS[item.rarity];
  const docColor = DOCTRINE_GEAR_COLOR[item.doctrine];

  return (
    <div className="relative">
      <motion.div
        whileHover={{ scale: 1.04 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="rounded-xl p-2.5 cursor-pointer"
        style={{
          background: `${docColor}0c`,
          border: `1px solid ${rarityCol}55`,
          boxShadow: hovered ? `0 0 8px ${rarityCol}44` : 'none',
          transition: 'box-shadow 0.15s',
        }}
      >
        {/* Slot icon + rarity dot */}
        <div className="flex items-start justify-between mb-1">
          <span className="text-lg">{SLOT_ICONS[item.slot]}</span>
          <span className="w-2 h-2 rounded-full mt-0.5" style={{ background: rarityCol }} />
        </div>
        {/* Name */}
        <div className="text-[10px] font-bold leading-tight mb-1 line-clamp-2" style={{ color: rarityCol }}>
          {item.name}
        </div>
        {/* Top stat */}
        {Object.entries(item.stats)[0] && (
          <div className="text-[9px] font-mono" style={{ color: '#8a8478' }}>
            {Object.entries(item.stats)[0][0]} +{Object.entries(item.stats)[0][1]}
          </div>
        )}
      </motion.div>

      {/* Hover tooltip with actions */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="absolute z-50 bottom-full mb-2 left-0 w-52 rounded-xl p-3 pointer-events-none"
            style={{ background:'rgba(12,12,20,0.97)', border:`1px solid ${rarityCol}`, boxShadow:`0 0 12px ${rarityCol}33` }}
          >
            <div className="font-bold text-sm mb-0.5" style={{ color: rarityCol }}>{item.name}</div>
            <div className="text-[10px] mb-2 font-mono" style={{ color: docColor }}>
              {RARITY_LABEL[item.rarity]} · {item.doctrine.charAt(0).toUpperCase() + item.doctrine.slice(1)}
            </div>
            {Object.entries(item.stats).map(([stat, val]) => (
              <div key={stat} className="flex justify-between text-[11px] font-mono">
                <span style={{ color:'#8a8478' }}>{stat}</span>
                <span style={{ color:'#f0ece4', fontWeight:700 }}>+{val}</span>
              </div>
            ))}
            {item.enchantment && (
              <div className="mt-2 pt-2 text-[10px] italic" style={{ borderTop:'1px solid #2a2a3d', color:'#d4a843' }}>
                ✨ {item.enchantment.label}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons below card */}
      <div className="flex gap-1 mt-1">
        <button onClick={onEquip} className="flex-1 text-[9px] font-bold py-1 rounded-lg transition-all hover:opacity-90"
          style={{ background:`${docColor}22`, border:`1px solid ${docColor}44`, color:docColor }}>
          Equip
        </button>
        <button onClick={onDiscard} className="text-[9px] px-2 py-1 rounded-lg transition-all hover:opacity-80"
          style={{ background:'rgba(255,255,255,0.03)', border:'1px solid #1e1e2e', color:'#3a3a4a' }}>
          ✕
        </button>
      </div>
    </div>
  );
}

function MaterialsRow() {
  const { materialStacks } = useAgentLoadout();
  if (!materialStacks.length) return null;
  const matMap = new Map(MATERIALS.map(m => [m.id, m]));
  return (
    <div className="rounded-xl p-3 mb-4" style={{ background:'rgba(0,0,0,0.3)', border:'1px solid #1e1e2e' }}>
      <div className="text-[9px] uppercase tracking-wider mb-2" style={{ color:'#5c574e' }}>🧱 Crafting Materials</div>
      <div className="flex flex-wrap gap-2">
        {materialStacks.map(s => {
          const mat = matMap.get(s.materialId);
          return (
            <div key={s.materialId} className="flex items-center gap-1 px-2 py-1 rounded-lg"
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid #1e1e2e' }}>
              <span>{mat?.icon ?? '📦'}</span>
              <span className="text-[10px]" style={{ color:'#d0cdc8' }}>{mat?.name ?? s.materialId}</span>
              <span className="text-[10px] font-bold font-mono" style={{ color:'#d4a843' }}>×{s.qty}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GearInventory() {
  const { gearInventory, equipGear, removeFromInventory } = useAgentLoadout();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
      className="relative overflow-hidden rounded-2xl mb-4"
      style={{ background:'linear-gradient(160deg,rgba(18,18,28,0.8) 0%,rgba(10,10,16,0.9) 100%)', border:'1px solid #2a2a3d', padding:'20px 24px' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color:'#8a6d2b' }}>🎒 Inventory</div>
        <div className="text-[10px] font-mono" style={{ color:'#5c574e' }}>{gearInventory.length}/20</div>
      </div>

      <MaterialsRow />

      {gearInventory.length === 0 ? (
        <div className="text-center py-8 text-xs italic" style={{ color:'#2a2a3a' }}>
          No gear in inventory — explore The Crucible to find drops!
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {gearInventory.map(item => (
            <ItemCard key={item.id} item={item}
              onEquip={() => equipGear(item)}
              onDiscard={() => removeFromInventory(item.id)}
            />
          ))}
        </div>
      )}

      {gearInventory.length >= 18 && (
        <div className="mt-3 text-[10px] text-center" style={{ color:'#e67e22' }}>
          ⚠️ Inventory nearly full ({gearInventory.length}/20) — equip or discard gear
        </div>
      )}
    </motion.div>
  );
}
