'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
type ItemSlot = 'weapon' | 'armor' | 'accessory' | 'module';

interface Item {
  id: string;
  name: string;
  slot: ItemSlot;
  rarity: ItemRarity;
  stats: { [key: string]: number };
  equipped: boolean;
  description?: string;
}

const rarityConfig: Record<ItemRarity, { label: string; color: string; border: string; bg: string; glow: string }> = {
  common:    { label: 'Common',    color: 'text-rarity-common',    border: 'border-rarity-common/30',    bg: 'bg-rarity-common/5',    glow: '' },
  uncommon:  { label: 'Uncommon',  color: 'text-rarity-uncommon',  border: 'border-rarity-uncommon/30',  bg: 'bg-rarity-uncommon/5',  glow: '' },
  rare:      { label: 'Rare',      color: 'text-rarity-rare',      border: 'border-rarity-rare/30',      bg: 'bg-rarity-rare/5',      glow: '' },
  epic:      { label: 'Epic',      color: 'text-rarity-epic',      border: 'border-rarity-epic/40',      bg: 'bg-rarity-epic/5',      glow: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]' },
  legendary: { label: 'Legendary', color: 'text-rarity-legendary', border: 'border-rarity-legendary/40', bg: 'bg-rarity-legendary/5', glow: 'shadow-[0_0_15px_rgba(249,115,22,0.15)]' },
};

const slotConfig: Record<ItemSlot, { icon: string; label: string }> = {
  weapon:    { icon: '⚔️', label: 'Weapon' },
  armor:     { icon: '🛡️', label: 'Armor' },
  accessory: { icon: '💍', label: 'Accessory' },
  module:    { icon: '⚙️', label: 'Module' },
};

const statLabels: Record<string, { name: string; color: string }> = {
  attack:  { name: 'MIGHT',      color: 'text-fire' },
  defense: { name: 'FORTITUDE',  color: 'text-ice' },
  speed:   { name: 'AGILITY',    color: 'text-gold' },
  hp:      { name: 'VITALITY',   color: 'text-venom' },
};

const mockItems: Item[] = [
  { id: '1', name: 'Iron Sword',     slot: 'weapon',    rarity: 'common',    stats: { attack: 5 }, equipped: true, description: 'A simple blade, battle-worn but reliable.' },
  { id: '2', name: 'Leather Armor',  slot: 'armor',     rarity: 'common',    stats: { defense: 3 }, equipped: true, description: 'Hardened leather. It has seen better days.' },
  { id: '3', name: 'Steel Blade',    slot: 'weapon',    rarity: 'uncommon',  stats: { attack: 8, speed: 2 }, equipped: false, description: 'Folded steel with a keen edge.' },
  { id: '4', name: 'Chain Mail',     slot: 'armor',     rarity: 'uncommon',  stats: { defense: 6, hp: 10 }, equipped: false, description: 'Interlocking rings of tempered iron.' },
  { id: '5', name: 'Shadow Dagger',  slot: 'weapon',    rarity: 'rare',      stats: { attack: 12, speed: 5 }, equipped: false, description: 'Whispers in the dark. Strikes before they see you.' },
  { id: '6', name: 'Power Ring',     slot: 'accessory', rarity: 'rare',      stats: { attack: 4, defense: 2 }, equipped: false, description: 'Hums with ancient power when worn.' },
  { id: '7', name: 'Dragon Plate',   slot: 'armor',     rarity: 'epic',      stats: { defense: 15, hp: 30 }, equipped: false, description: 'Forged from the scales of a fallen wyrm.' },
  { id: '8', name: 'AI Core v2',     slot: 'module',    rarity: 'epic',      stats: { speed: 8, hp: 20 }, equipped: false, description: 'Neural pathways accelerated beyond mortal limits.' },
];

export default function InventoryPage() {
  const [items, setItems] = useState(mockItems);
  
  const equipped: Record<ItemSlot, Item | undefined> = {
    weapon:    items.find(i => i.slot === 'weapon' && i.equipped),
    armor:     items.find(i => i.slot === 'armor' && i.equipped),
    accessory: items.find(i => i.slot === 'accessory' && i.equipped),
    module:    items.find(i => i.slot === 'module' && i.equipped),
  };
  
  const handleEquip = (itemId: string) => {
    setItems(prev => prev.map(item => {
      const clickedItem = prev.find(i => i.id === itemId);
      if (!clickedItem) return item;
      if (item.slot === clickedItem.slot && item.id !== itemId) {
        return { ...item, equipped: false };
      }
      if (item.id === itemId) {
        return { ...item, equipped: !item.equipped };
      }
      return item;
    }));
  };
  
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-display text-5xl font-bold text-[#e8e6e3] tracking-wide">
            The Armory
          </h1>
          <p className="text-[#9ca3af] italic mt-2">Forge your legend</p>
          <div className="divider-gold max-w-xs mt-4" />
        </motion.div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Equipped Gear — Left Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="game-card p-6">
              <h2 className="font-display text-lg font-semibold text-gold uppercase tracking-wider mb-4">
                Equipped Gear
              </h2>
              <div className="divider-gold mb-4" />
              
              <div className="space-y-3">
                {(['weapon', 'armor', 'accessory', 'module'] as ItemSlot[]).map(slot => {
                  const item = equipped[slot];
                  const slotInfo = slotConfig[slot];
                  
                  return (
                    <div key={slot} className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-[#6b7280] uppercase tracking-widest font-bold">
                        <span>{slotInfo.icon}</span>
                        <span>{slotInfo.label}</span>
                      </div>
                      
                      {item ? (
                        <div className={`
                          rounded-lg p-3 border-l-[3px] bg-arena-elevated/50
                          ${rarityConfig[item.rarity].border.replace('/30', '').replace('/40', '')}
                          ${rarityConfig[item.rarity].glow}
                        `}
                        style={{ borderLeftColor: `var(--rarity-${item.rarity})` }}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-medium text-sm ${rarityConfig[item.rarity].color}`}>
                              {item.name}
                            </span>
                          </div>
                          <div className="flex gap-3 mt-1">
                            {Object.entries(item.stats).map(([stat, val]) => {
                              const info = statLabels[stat] || { name: stat, color: 'text-[#9ca3af]' };
                              return (
                                <span key={stat} className={`text-xs font-mono ${info.color}`}>
                                  +{val} {info.name}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg p-3 border border-dashed border-border-warm text-center">
                          <span className="text-[#6b7280] text-xs italic">Awaiting a worthy relic</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
          
          {/* Vault — Right Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-2"
          >
            <div className="game-card p-6">
              <h2 className="font-display text-lg font-semibold text-gold uppercase tracking-wider mb-4">
                The Vault
              </h2>
              <div className="divider-gold mb-4" />
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {items.map((item, idx) => {
                  const rc = rarityConfig[item.rarity];
                  const slotInfo = slotConfig[item.slot];
                  
                  return (
                    <motion.button
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + idx * 0.04 }}
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleEquip(item.id)}
                      className={`
                        relative rounded-lg p-3 text-left transition-all border
                        ${rc.border} ${rc.bg} ${rc.glow}
                        hover:border-opacity-60
                        ${item.equipped ? 'ring-1 ring-gold/40' : ''}
                      `}
                    >
                      {/* Rarity left accent */}
                      <div 
                        className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full"
                        style={{ backgroundColor: `var(--rarity-${item.rarity})` }}
                      />
                      
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-sm">{slotInfo.icon}</span>
                        <span className={`text-[10px] uppercase tracking-wider ${rc.color} font-bold`}>
                          {rc.label}
                        </span>
                      </div>
                      
                      <div className={`font-medium text-sm text-[#e8e6e3] mb-1`}>{item.name}</div>
                      
                      <div className="space-y-0.5">
                        {Object.entries(item.stats).map(([stat, val]) => {
                          const info = statLabels[stat] || { name: stat, color: 'text-[#9ca3af]' };
                          return (
                            <div key={stat} className={`text-xs font-mono ${info.color}`}>
                              +{val} {info.name}
                            </div>
                          );
                        })}
                      </div>
                      
                      {item.equipped && (
                        <div className="mt-2 text-[10px] text-gold font-bold uppercase tracking-wider">
                          ✦ WIELDED
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
        
      </div>
    </div>
  );
}
