'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';

export interface ShopEffect {
  healPct?: number;
  damagePctBonus?: number;
  speedPctBonus?: number;
  hpBonus?: number;
  goldBonus?: number;
  damageTakenPctBonus?: number;
}

interface ShopItem {
  id: string;
  name: string;
  desc: string;
  cost: number;
  icon: string;
  effect: ShopEffect;
}

const SHOP_ITEMS: ShopItem[] = [
  { id: 'mend', name: 'Mend Wounds', desc: 'Restore 30% max HP', cost: 25, icon: '💚', effect: { healPct: 0.3 } },
  { id: 'fury', name: 'Battle Fury', desc: '+25% attack damage this run', cost: 40, icon: '🔥', effect: { damagePctBonus: 0.25 } },
  { id: 'swift', name: 'Swiftfoot Elixir', desc: '+20% movement speed this run', cost: 35, icon: '💨', effect: { speedPctBonus: 0.2 } },
  { id: 'flask', name: 'Iron Flask', desc: '+25 max HP for this run', cost: 45, icon: '⚗️', effect: { hpBonus: 25 } },
  { id: 'cache', name: 'Valor Cache', desc: 'Convert 20 Valor → 5 gold', cost: 20, icon: '💰', effect: { goldBonus: 5 } },
  { id: 'armor', name: 'Armor Plating', desc: '-15% damage taken this run', cost: 50, icon: '🛡️', effect: { damageTakenPctBonus: -0.15 } },
];

interface CrucibleShopProps {
  valor: number;
  onPurchase: (itemId: string, cost: number, effect: ShopEffect) => void;
  onClose: () => void;
}

export default function CrucibleShop({ valor, onPurchase, onClose }: CrucibleShopProps) {
  const [remaining, setRemaining] = useState(valor);

  const handlePurchase = (item: ShopItem) => {
    if (remaining >= item.cost) {
      setRemaining(prev => prev - item.cost);
      onPurchase(item.id, item.cost, item.effect);
    }
  };

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-50 pointer-events-auto"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="rounded-2xl p-8 border border-purple-500/40"
        style={{
          background: 'linear-gradient(160deg, rgba(22,18,14,0.95) 0%, rgba(10,10,16,0.99) 100%)',
          maxWidth: 600,
          width: 'calc(100% - 32px)',
        }}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-purple-400 mb-1">⬡ CRUCIBLE SHOP</h2>
            <p className="text-xs text-slate-400">Spend Valor to enhance your run</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 uppercase">Valor Balance</div>
            <div className="text-2xl font-bold" style={{ color: '#c0c0c0' }}>⚡ {remaining}</div>
          </div>
        </div>

        {/* Shop grid: 2x3 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {SHOP_ITEMS.map(item => {
            const canAfford = remaining >= item.cost;
            return (
              <motion.button
                key={item.id}
                onClick={() => handlePurchase(item)}
                disabled={!canAfford}
                className={`p-4 rounded-lg border transition-all text-left ${
                  canAfford
                    ? 'border-purple-500/50 hover:border-purple-400 hover:bg-purple-900/20 cursor-pointer'
                    : 'border-slate-700/30 bg-slate-900/30 opacity-50 cursor-not-allowed'
                }`}
                whileHover={canAfford ? { scale: 1.02 } : {}}
                whileTap={canAfford ? { scale: 0.98 } : {}}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">{item.icon}</span>
                  <span className={`text-sm font-bold px-2 py-1 rounded ${
                    canAfford ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-700/20 text-slate-400'
                  }`}>
                    {item.cost}⚡
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mb-1">{item.name}</h3>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </motion.button>
            );
          })}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-700/40 hover:bg-slate-600/40 border border-slate-600/50 rounded-lg text-white font-semibold transition-colors"
        >
          Leave Shop
        </button>
      </motion.div>
    </motion.div>
  );
}
