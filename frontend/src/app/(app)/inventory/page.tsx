'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

// Mock equipment data
type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
type ItemSlot = 'weapon' | 'armor' | 'accessory' | 'module';

interface Item {
  id: string;
  name: string;
  slot: ItemSlot;
  rarity: ItemRarity;
  stats: { [key: string]: number };
  equipped: boolean;
}

const rarityColors = {
  common: 'border-slate-500 bg-slate-500/10',
  uncommon: 'border-green-500 bg-green-500/10',
  rare: 'border-blue-500 bg-blue-500/10',
  epic: 'border-purple-500 bg-purple-500/10',
  legendary: 'border-orange-500 bg-orange-500/10',
};

const mockItems: Item[] = [
  { id: '1', name: 'Iron Sword', slot: 'weapon', rarity: 'common', stats: { attack: 5 }, equipped: true },
  { id: '2', name: 'Leather Armor', slot: 'armor', rarity: 'common', stats: { defense: 3 }, equipped: true },
  { id: '3', name: 'Steel Blade', slot: 'weapon', rarity: 'uncommon', stats: { attack: 8, speed: 2 }, equipped: false },
  { id: '4', name: 'Chain Mail', slot: 'armor', rarity: 'uncommon', stats: { defense: 6, hp: 10 }, equipped: false },
  { id: '5', name: 'Shadow Dagger', slot: 'weapon', rarity: 'rare', stats: { attack: 12, speed: 5 }, equipped: false },
  { id: '6', name: 'Power Ring', slot: 'accessory', rarity: 'rare', stats: { attack: 4, defense: 2 }, equipped: false },
  { id: '7', name: 'Dragon Plate', slot: 'armor', rarity: 'epic', stats: { defense: 15, hp: 30 }, equipped: false },
  { id: '8', name: 'AI Core', slot: 'module', rarity: 'epic', stats: { speed: 8, hp: 20 }, equipped: false },
];

export default function InventoryPage() {
  const [items, setItems] = useState(mockItems);
  
  const equipped = {
    weapon: items.find(i => i.slot === 'weapon' && i.equipped),
    armor: items.find(i => i.slot === 'armor' && i.equipped),
    accessory: items.find(i => i.slot === 'accessory' && i.equipped),
    module: items.find(i => i.slot === 'module' && i.equipped),
  };
  
  const handleEquip = (itemId: string) => {
    setItems(prev => prev.map(item => {
      const clickedItem = prev.find(i => i.id === itemId);
      if (!clickedItem) return item;
      
      // Unequip others in same slot
      if (item.slot === clickedItem.slot && item.id !== itemId) {
        return { ...item, equipped: false };
      }
      // Toggle clicked item
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
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Inventory</h1>
          <p className="text-slate-400">Manage your equipment and items</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Equipment Slots (Paper Doll) */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Equipped</h2>
              <div className="space-y-3">
                {(['weapon', 'armor', 'accessory', 'module'] as ItemSlot[]).map(slot => {
                  const item = equipped[slot];
                  return (
                    <div key={slot} className="bg-slate-800/50 rounded-lg p-3">
                      <div className="text-xs text-slate-500 uppercase mb-2">{slot}</div>
                      {item ? (
                        <div className={`border-2 ${rarityColors[item.rarity]} rounded-lg p-3`}>
                          <div className="text-white font-medium mb-1">{item.name}</div>
                          <div className="text-xs text-slate-400 space-x-2">
                            {Object.entries(item.stats).map(([stat, val]) => (
                              <span key={stat}>+{val} {stat}</span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-slate-700 rounded-lg p-3 text-slate-600 text-center text-sm">
                          Empty
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Inventory Grid */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Backpack</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {items.map((item) => (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEquip(item.id)}
                    className={`
                      border-2 rounded-lg p-3 text-left transition-all
                      ${rarityColors[item.rarity]}
                      ${item.equipped ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-900' : ''}
                      hover:shadow-lg
                    `}
                  >
                    <div className="text-white font-medium text-sm mb-2">{item.name}</div>
                    <div className="text-xs text-slate-400 mb-1 capitalize">{item.slot}</div>
                    <div className="text-xs text-slate-500 space-x-1">
                      {Object.entries(item.stats).map(([stat, val]) => (
                        <span key={stat}>+{val} {stat}</span>
                      ))}
                    </div>
                    {item.equipped && (
                      <div className="mt-2 text-xs text-purple-400 font-bold">EQUIPPED</div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
