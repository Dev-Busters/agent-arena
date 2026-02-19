'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgentLoadout } from '@/stores/agentLoadout';
import { DoctrineKey } from './doctrineTrees';
import { DOCTRINE_COLORS } from './doctrineAbilities';

// ── Shrine data ───────────────────────────────────────────────────────────────
export interface ShrineUpgrade {
  id: string;
  label: string;
  description: string;
  maxRanks: number;
  costPerRank: number; // Ember
  effect: string; // display string, e.g. "+2% dmg reduction per rank"
}

export interface ShrineSlot {
  slotId: string;
  doctrine: DoctrineKey;
  a: ShrineUpgrade;
  b: ShrineUpgrade;
}

export const SHRINE_SLOTS: ShrineSlot[] = [
  // ── IRON SHRINES ────────────────────────────────────────────────────────
  { slotId:'iron_s1', doctrine:'iron',
    a: { id:'iron_s1a', label:'Thick Hide',      description:'+2% damage reduction per rank', maxRanks:5, costPerRank:3, effect:'-2% dmg taken per rank' },
    b: { id:'iron_s1b', label:'Adrenaline Rush', description:'+3% damage when above 80% HP per rank', maxRanks:5, costPerRank:3, effect:'+3% dmg @>80% HP per rank' } },
  { slotId:'iron_s2', doctrine:'iron',
    a: { id:'iron_s2a', label:'Deep Pockets',    description:'+10% Valor from kills per rank', maxRanks:3, costPerRank:4, effect:'+10% Valor/kill per rank' },
    b: { id:'iron_s2b', label:'Scavenger',       description:'+5% Ash drop chance per rank', maxRanks:3, costPerRank:4, effect:'+5% Ash drops per rank' } },
  { slotId:'iron_s3', doctrine:'iron',
    a: { id:'iron_s3a', label:'Quick Learner',   description:'+10% Iron XP per rank', maxRanks:3, costPerRank:5, effect:'+10% Iron XP per rank' },
    b: { id:'iron_s3b', label:'Resilient',       description:'+5 max HP per rank', maxRanks:5, costPerRank:3, effect:'+5 max HP per rank' } },
  { slotId:'iron_s4', doctrine:'iron',
    a: { id:'iron_s4a', label:'Ironclad',        description:'+3% armor per rank', maxRanks:4, costPerRank:4, effect:'+3% armor per rank' },
    b: { id:'iron_s4b', label:'Battle-Worn',     description:'+2% melee damage per rank', maxRanks:5, costPerRank:3, effect:'+2% melee dmg per rank' } },
  { slotId:'iron_s5', doctrine:'iron',
    a: { id:'iron_s5a', label:'Blood Price',     description:'+1% lifesteal per rank', maxRanks:3, costPerRank:6, effect:'+1% lifesteal per rank' },
    b: { id:'iron_s5b', label:'Last Stand',      description:'+5% dmg when below 30% HP per rank', maxRanks:3, costPerRank:5, effect:'+5% dmg @<30% HP per rank' } },

  // ── ARC SHRINES ──────────────────────────────────────────────────────────
  { slotId:'arc_s1', doctrine:'arc',
    a: { id:'arc_s1a', label:'Overcharge',       description:'+4% ability damage per rank', maxRanks:5, costPerRank:3, effect:'+4% ability dmg per rank' },
    b: { id:'arc_s1b', label:'Surge Condenser',  description:'-5% ability cooldowns per rank', maxRanks:4, costPerRank:4, effect:'-5% cooldowns per rank' } },
  { slotId:'arc_s2', doctrine:'arc',
    a: { id:'arc_s2a', label:'Blast Radius',     description:'+5% blast radius per rank', maxRanks:4, costPerRank:3, effect:'+5% blast radius per rank' },
    b: { id:'arc_s2b', label:'Chain Reaction',   description:'+8% Arc XP per rank', maxRanks:3, costPerRank:5, effect:'+8% Arc XP per rank' } },
  { slotId:'arc_s3', doctrine:'arc',
    a: { id:'arc_s3a', label:'Energy Wells',     description:'+10% Valor from abilities per rank', maxRanks:3, costPerRank:4, effect:'+10% Valor from abilities' },
    b: { id:'arc_s3b', label:'Static Field',     description:'+3% dmg to nearby enemies per rank', maxRanks:4, costPerRank:4, effect:'+3% area dmg per rank' } },
  { slotId:'arc_s4', doctrine:'arc',
    a: { id:'arc_s4a', label:'Arcane Memory',    description:'+2% ability damage per room cleared per run', maxRanks:3, costPerRank:5, effect:'+2% ability dmg/room' },
    b: { id:'arc_s4b', label:'Pulse Amplifier',  description:'+6% projectile speed per rank', maxRanks:3, costPerRank:3, effect:'+6% projectile spd per rank' } },
  { slotId:'arc_s5', doctrine:'arc',
    a: { id:'arc_s5a', label:'Storm Attunement', description:'+5% dmg on first ability hit per room', maxRanks:4, costPerRank:4, effect:'+5% first-hit bonus' },
    b: { id:'arc_s5b', label:'Overloaded',       description:'+3% chance to double-fire abilities per rank', maxRanks:3, costPerRank:6, effect:'+3% double-fire chance' } },

  // ── EDGE SHRINES ─────────────────────────────────────────────────────────
  { slotId:'edge_s1', doctrine:'edge',
    a: { id:'edge_s1a', label:'Predator',        description:'+2% crit chance per rank', maxRanks:5, costPerRank:3, effect:'+2% crit chance per rank' },
    b: { id:'edge_s1b', label:'Razor Edge',      description:'+8% crit damage per rank', maxRanks:5, costPerRank:3, effect:'+8% crit dmg per rank' } },
  { slotId:'edge_s2', doctrine:'edge',
    a: { id:'edge_s2a', label:'Fleet Foot',      description:'+3% movement speed per rank', maxRanks:4, costPerRank:3, effect:'+3% move speed per rank' },
    b: { id:'edge_s2b', label:'Ghost Step',      description:'+4% dodge chance per rank', maxRanks:3, costPerRank:5, effect:'+4% dodge per rank' } },
  { slotId:'edge_s3', doctrine:'edge',
    a: { id:'edge_s3a', label:'Opportunist',     description:'+5% Edge XP per rank', maxRanks:3, costPerRank:5, effect:'+5% Edge XP per rank' },
    b: { id:'edge_s3b', label:'Hit & Run',       description:'+5% speed for 2s after kill per rank', maxRanks:3, costPerRank:4, effect:'+5% spd on kill per rank' } },
  { slotId:'edge_s4', doctrine:'edge',
    a: { id:'edge_s4a', label:'First Blood',     description:'+10% damage on first hit per enemy', maxRanks:3, costPerRank:4, effect:'+10% first-hit dmg' },
    b: { id:'edge_s4b', label:'Chain Killer',    description:'+3% dmg per kill this room (stacks)', maxRanks:3, costPerRank:5, effect:'+3% dmg per kill stack' } },
  { slotId:'edge_s5', doctrine:'edge',
    a: { id:'edge_s5a', label:'Shadow Walk',     description:'+2% crit chance after using Dash per rank', maxRanks:4, costPerRank:4, effect:'+2% crit after dash' },
    b: { id:'edge_s5b', label:'Blade Mastery',   description:'+4% attack speed per rank', maxRanks:4, costPerRank:4, effect:'+4% attack speed per rank' } },
];

const DOCTRINE_LABELS: Record<DoctrineKey, string> = { iron:'Iron', arc:'Arc', edge:'Edge' };
const DOCTRINE_ICONS: Record<DoctrineKey, string> = { iron:'🔴', arc:'🔵', edge:'🟢' };

// ── Store additions needed ────────────────────────────────────────────────────
// We store shrine investments in agentLoadout: shrineRanks: Record<string, number>
// This component reads/writes that via useAgentLoadout

interface DoctrineShrinesPanelProps {
  doctrine: DoctrineKey;
  ember: number;
  shrineRanks: Record<string, number>;
  onInvest: (upgradeId: string, cost: number) => boolean;
}

function ShrineSlotCard({ slot, shrineRanks, ember, onInvest }: {
  slot: ShrineSlot;
  shrineRanks: Record<string, number>;
  ember: number;
  onInvest: (id: string, cost: number) => boolean;
}) {
  const color = DOCTRINE_COLORS[slot.doctrine];
  const [chosen, setChosen] = useState<'a'|'b'|null>(() => {
    const ar = shrineRanks[slot.a.id] ?? 0;
    const br = shrineRanks[slot.b.id] ?? 0;
    if (ar > 0) return 'a';
    if (br > 0) return 'b';
    return null;
  });

  const tryInvest = (choice: 'a'|'b') => {
    const upgrade = choice === 'a' ? slot.a : slot.b;
    const currentRanks = shrineRanks[upgrade.id] ?? 0;
    if (currentRanks >= upgrade.maxRanks) return;
    if (ember < upgrade.costPerRank) return;
    const success = onInvest(upgrade.id, upgrade.costPerRank);
    if (success) setChosen(choice);
  };

  const renderOption = (choice: 'a'|'b') => {
    const upg = choice === 'a' ? slot.a : slot.b;
    const ranks = shrineRanks[upg.id] ?? 0;
    const maxed = ranks >= upg.maxRanks;
    const locked = chosen !== null && chosen !== choice;
    const canAfford = ember >= upg.costPerRank;
    const active = chosen === choice;

    return (
      <motion.button
        key={upg.id}
        onClick={() => !locked && !maxed && tryInvest(choice)}
        disabled={locked}
        whileHover={!locked && !maxed ? { scale: 1.02 } : {}}
        whileTap={!locked && !maxed ? { scale: 0.97 } : {}}
        className="flex-1 rounded-xl p-3 text-left relative overflow-hidden"
        style={{
          background: active ? `${color}18` : 'rgba(255,255,255,0.02)',
          border: `1px solid ${active ? color+'55' : locked ? '#1a1a2a' : '#2a2a3d'}`,
          opacity: locked ? 0.35 : 1,
          cursor: locked || maxed ? 'default' : 'pointer',
        }}
      >
        <div className="text-xs font-bold mb-1" style={{ color: active ? color : '#d0cdc8' }}>{upg.label}</div>
        <div className="text-[10px] mb-2 leading-snug" style={{ color: '#8a8478' }}>{upg.description}</div>
        <div className="flex items-center justify-between">
          <div className="font-mono text-[10px]" style={{ color: active ? color : '#5c574e' }}>
            {ranks}/{upg.maxRanks}
          </div>
          {!maxed && !locked && (
            <div className="flex items-center gap-1 text-[10px] font-mono"
              style={{ color: canAfford ? '#e67e22' : '#5c574e' }}>
              🔥{upg.costPerRank}
            </div>
          )}
          {maxed && <div className="text-[10px]" style={{ color }}>MAXED</div>}
        </div>
      </motion.button>
    );
  };

  return (
    <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid #1e1e2e' }}>
      <div className="text-[9px] uppercase tracking-widest mb-2" style={{ color: '#5c574e' }}>
        Choose one path
      </div>
      <div className="flex gap-2">
        {renderOption('a')}
        <div className="flex items-center" style={{ color: '#3a3a4a', fontSize: 10, fontWeight: 'bold' }}>OR</div>
        {renderOption('b')}
      </div>
    </div>
  );
}

export default function DoctrineShrinesPanel() {
  const loadout = useAgentLoadout();
  const [activeDoc, setActiveDoc] = useState<DoctrineKey>('iron');
  const ember = loadout.ember;
  const shrineRanks = (loadout as any).shrineRanks ?? {};

  const handleInvest = (upgradeId: string, cost: number): boolean => {
    return loadout.spendEmber(cost) ? (
      (loadout as any).investShrine?.(upgradeId), true
    ) : false;
  };

  const slots = SHRINE_SLOTS.filter(s => s.doctrine === activeDoc);
  const tabs: { key: DoctrineKey }[] = [{ key:'iron' }, { key:'arc' }, { key:'edge' }];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
      className="relative overflow-hidden rounded-2xl mb-4"
      style={{ background: 'linear-gradient(160deg, rgba(18,18,28,0.8) 0%, rgba(10,10,16,0.9) 100%)', border: '1px solid #2a2a3d', padding: '20px 24px' }}>
      <div className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: '#8a6d2b' }}>🔥 Doctrine Shrines</div>

      {/* Ember balance */}
      <div className="flex items-center gap-2 mb-4">
        <span style={{ color: '#e67e22', fontSize: 16 }}>🔥</span>
        <span className="font-mono font-bold text-lg" style={{ color: '#e67e22' }}>{ember}</span>
        <span className="text-xs" style={{ color: '#8a8478' }}>Ember available · earned from elites, bosses, trial floors</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveDoc(t.key)}
            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: activeDoc === t.key ? `${DOCTRINE_COLORS[t.key]}22` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${activeDoc === t.key ? DOCTRINE_COLORS[t.key] : '#2a2a3d'}`,
              color: activeDoc === t.key ? DOCTRINE_COLORS[t.key] : '#8a8478',
            }}>
            {DOCTRINE_ICONS[t.key]} {DOCTRINE_LABELS[t.key]}
          </button>
        ))}
      </div>

      {/* Shrine slots */}
      <div className="space-y-3">
        {slots.map(slot => (
          <ShrineSlotCard key={slot.slotId} slot={slot} shrineRanks={shrineRanks} ember={ember}
            onInvest={handleInvest} />
        ))}
      </div>
    </motion.div>
  );
}
