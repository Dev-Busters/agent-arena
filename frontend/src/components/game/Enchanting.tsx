'use client';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useAgentLoadout } from '@/stores/agentLoadout';
import { GearItem, GearSlot, RARITY_COLORS, DOCTRINE_GEAR_COLOR, SLOT_ICONS, SLOT_LABELS } from './gear';

const ALL_SLOTS: GearSlot[] = ['weapon','armor','helm','boots','accessory1','accessory2'];

// Sample enchantments that could have been extracted from in-run modifiers
const SAMPLE_ENCHANTMENTS = [
  { label:'Valor Surge',       effect:'valorSurge',      power:0.5, cost:5,  desc:'+50% Valor from kills (50% modifier power)' },
  { label:'Iron\'s Blessing',  effect:'ironXP',          power:0.5, cost:5,  desc:'+15% Iron XP gain per run' },
  { label:'Arc\'s Blessing',   effect:'arcXP',           power:0.5, cost:5,  desc:'+15% Arc XP gain per run' },
  { label:'Edge\'s Blessing',  effect:'edgeXP',          power:0.5, cost:5,  desc:'+15% Edge XP gain per run' },
  { label:'Ash Harvest',       effect:'ashBoost',        power:0.5, cost:8,  desc:'+30% Ash drop rate' },
  { label:'Ember Seeker',      effect:'emberBoost',      power:0.5, cost:10, desc:'+20% Ember drop chance from elites' },
  { label:'Crit Echo',         effect:'critBoost',       power:0.5, cost:8,  desc:'+10% critical hit chance' },
  { label:'Armor of Ruin',     effect:'armorRuin',       power:0.5, cost:10, desc:'-15% damage taken from elites' },
];

type EnchantDef = typeof SAMPLE_ENCHANTMENTS[number];

function GearSelectRow({ slot, item, selected, onSelect }: {
  slot: GearSlot; item: GearItem | null; selected: boolean; onSelect: () => void;
}) {
  const col = item ? RARITY_COLORS[item.rarity] : '#2a2a3d';
  return (
    <button onClick={onSelect} disabled={!item}
      className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-left transition-all"
      style={{
        background: selected ? `${col}18` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${selected ? col : '#1e1e2e'}`,
        opacity: item ? 1 : 0.4,
        cursor: item ? 'pointer' : 'not-allowed',
      }}>
      <span className="text-lg">{SLOT_ICONS[slot]}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[10px]" style={{ color:'#5c574e' }}>{SLOT_LABELS[slot]}</div>
        {item ? (
          <div className="text-xs font-bold truncate" style={{ color: col }}>{item.name}</div>
        ) : (
          <div className="text-[10px] italic" style={{ color:'#2a2a3a' }}>Empty</div>
        )}
        {item?.enchantment && (
          <div className="text-[10px] italic" style={{ color:'#d4a843' }}>✨ Already enchanted</div>
        )}
      </div>
      {selected && <span style={{ color: col }}>●</span>}
    </button>
  );
}

function EnchantCard({ ench, canAfford, onApply }: { ench: EnchantDef; canAfford: boolean; onApply: () => void }) {
  return (
    <div className="rounded-xl p-3" style={{ background:'rgba(255,255,255,0.02)', border:'1px solid #1e1e2e' }}>
      <div className="flex items-start justify-between mb-1">
        <span className="text-sm font-bold" style={{ color:'#d4a843' }}>✨ {ench.label}</span>
        <span className="text-[10px] font-mono" style={{ color:'#8a8478' }}>Ash ×{ench.cost}</span>
      </div>
      <p className="text-[10px] mb-2 italic" style={{ color:'#5c574e' }}>{ench.desc}</p>
      <motion.button
        whileHover={canAfford ? { scale: 1.03 } : {}}
        whileTap={canAfford ? { scale: 0.97 } : {}}
        onClick={onApply}
        disabled={!canAfford}
        className="w-full py-1.5 rounded-lg text-[10px] font-bold transition-all"
        style={{
          background: canAfford ? 'rgba(212,168,67,0.15)' : 'rgba(255,255,255,0.02)',
          border: `1px solid ${canAfford ? '#d4a843' : '#1e1e2e'}`,
          color: canAfford ? '#d4a843' : '#3a3a4a',
          cursor: canAfford ? 'pointer' : 'not-allowed',
        }}>
        Enchant
      </motion.button>
    </div>
  );
}

export default function Enchanting() {
  const loadout = useAgentLoadout();
  const [selectedSlot, setSelectedSlot] = useState<GearSlot | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedItem = selectedSlot ? (loadout.equipment[selectedSlot] as GearItem | null) : null;
  const alreadyEnchanted = selectedItem?.enchantment != null;

  const handleApply = (ench: EnchantDef) => {
    if (!selectedSlot || !selectedItem) return;
    if (alreadyEnchanted) { setFeedback('✗ Already enchanted — one enchantment per item'); setTimeout(() => setFeedback(null), 2000); return; }
    if (!loadout.spendAsh(ench.cost)) { setFeedback('✗ Not enough Ash'); setTimeout(() => setFeedback(null), 1500); return; }
    loadout.enchantGearItem(selectedItem.id, { label: ench.label, effect: ench.effect, power: ench.power });
    setFeedback(`✓ ${ench.label} applied to ${selectedItem.name}`);
    setTimeout(() => setFeedback(null), 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.30 }}
      className="relative overflow-hidden rounded-2xl mb-4"
      style={{ background:'linear-gradient(160deg,rgba(18,18,28,0.8) 0%,rgba(10,10,16,0.9) 100%)', border:'1px solid #2a2a3d', padding:'20px 24px' }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color:'#8a6d2b' }}>✨ Enchanting</div>
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <span style={{ color:'#c0c0c0' }}>Ash: {loadout.ash}</span>
          {feedback && <span style={{ color: feedback.startsWith('✓') ? '#27ae60' : '#c0392b' }}>{feedback}</span>}
        </div>
      </div>

      <p className="text-[11px] mb-4 italic" style={{ color:'#5c574e' }}>
        Bind permanent enchantments to equipped gear. Enchantments are extracted at 50% power from Crucible modifiers.
        One enchantment per item.
      </p>

      <div className="grid grid-cols-2 gap-4">
        {/* Left: gear slot selection */}
        <div>
          <div className="text-[9px] uppercase tracking-wider mb-2" style={{ color:'#5c574e' }}>Select Gear</div>
          <div className="space-y-1.5">
            {ALL_SLOTS.map(slot => (
              <GearSelectRow
                key={slot} slot={slot}
                item={loadout.equipment[slot] as GearItem | null}
                selected={selectedSlot === slot}
                onSelect={() => setSelectedSlot(slot)}
              />
            ))}
          </div>
        </div>

        {/* Right: enchantments */}
        <div>
          <div className="text-[9px] uppercase tracking-wider mb-2" style={{ color:'#5c574e' }}>
            {selectedItem ? `Enchant ${selectedItem.name}` : 'Select gear first'}
          </div>
          {alreadyEnchanted ? (
            <div className="rounded-xl p-4 text-center" style={{ background:'rgba(212,168,67,0.06)', border:'1px solid #d4a84333' }}>
              <div className="text-sm mb-1">✨ {selectedItem!.enchantment!.label}</div>
              <div className="text-[10px] italic" style={{ color:'#5c574e' }}>
                This item is already enchanted.
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {SAMPLE_ENCHANTMENTS.map(ench => (
                <EnchantCard
                  key={ench.effect}
                  ench={ench}
                  canAfford={!!(selectedSlot && selectedItem && !alreadyEnchanted && loadout.ash >= ench.cost)}
                  onApply={() => handleApply(ench)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
