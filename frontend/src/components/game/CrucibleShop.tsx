'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ShopEffect {
  healPct?: number;
  damagePctBonus?: number;
  speedPctBonus?: number;
  hpBonus?: number;
  goldBonus?: number;
  damageTakenPctBonus?: number;
}

export interface ShopItem {
  id: string;
  name: string;
  desc: string;
  cost: number;
  icon: string;
  effect: ShopEffect;
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'mend',   name: 'Mend Wounds',     desc: 'Restore 30% max HP',             cost: 25, icon: '💚', effect: { healPct: 0.3 } },
  { id: 'fury',   name: 'Battle Fury',     desc: '+25% attack damage this run',    cost: 40, icon: '🔥', effect: { damagePctBonus: 0.25 } },
  { id: 'swift',  name: 'Swiftfoot Elixir',desc: '+20% movement speed this run',   cost: 35, icon: '💨', effect: { speedPctBonus: 0.2 } },
  { id: 'flask',  name: 'Iron Flask',       desc: '+25 max HP for this run',        cost: 45, icon: '⚗️', effect: { hpBonus: 25 } },
  { id: 'cache',  name: 'Valor Cache',      desc: 'Convert 20 Valor → 5 gold',      cost: 20, icon: '💰', effect: { goldBonus: 5 } },
  { id: 'armor',  name: 'Armor Plating',    desc: '-15% damage taken this run',     cost: 50, icon: '🛡️', effect: { damageTakenPctBonus: -0.15 } },
];

interface CrucibleShopProps {
  valor: number;
  onPurchase: (item: ShopItem, newValor: number) => void;
  onClose: () => void;
}

export default function CrucibleShop({ valor: initialValor, onPurchase, onClose }: CrucibleShopProps) {
  const [currentValor, setCurrentValor] = useState(initialValor);
  const [purchased, setPurchased] = useState<Set<string>>(new Set());

  const handleBuy = (item: ShopItem) => {
    if (currentValor < item.cost || purchased.has(item.id)) return;
    const newValor = currentValor - item.cost;
    setCurrentValor(newValor);
    setPurchased(prev => new Set([...prev, item.id]));
    onPurchase(item, newValor);
  };

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75" onClick={onClose} />

      {/* Shop Panel */}
      <motion.div
        className="relative z-10 rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, rgba(20,18,26,0.98) 0%, rgba(10,10,18,0.99) 100%)',
          border: '1px solid rgba(192,192,255,0.15)',
          boxShadow: '0 0 40px rgba(192,192,255,0.08)',
          width: 480,
          maxHeight: '90vh',
        }}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Top edge shimmer */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(192,192,255,0.4), transparent)' }} />

        <div style={{ padding: '20px 24px' }}>
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="font-display text-xl font-bold" style={{ color: '#e8e6f0' }}>Crucible Shop</h2>
              <p className="text-xs mt-0.5" style={{ color: '#8a8aaa' }}>Spend Valor — it's lost on death</p>
            </div>
            {/* Valor badge */}
            <div className="flex items-center gap-2 rounded-full px-4 py-1.5"
              style={{ background: 'rgba(192,192,255,0.1)', border: '1px solid rgba(192,192,255,0.25)' }}>
              <span style={{ color: '#a0a0d0', fontSize: 14 }}>⚡</span>
              <span className="font-mono font-bold" style={{ color: '#c8c8f0', fontSize: 18 }}>{currentValor}</span>
              <span className="text-xs" style={{ color: '#8a8aaa' }}>Valor</span>
            </div>
          </div>

          {/* Items grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {SHOP_ITEMS.map(item => {
              const canAfford = currentValor >= item.cost;
              const isBought = purchased.has(item.id);
              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleBuy(item)}
                  disabled={!canAfford || isBought}
                  whileHover={canAfford && !isBought ? { scale: 1.02 } : {}}
                  whileTap={canAfford && !isBought ? { scale: 0.98 } : {}}
                  className="relative text-left rounded-xl overflow-hidden transition-all"
                  style={{
                    background: isBought
                      ? 'rgba(61,186,111,0.1)'
                      : canAfford
                        ? 'rgba(192,192,255,0.06)'
                        : 'rgba(255,255,255,0.02)',
                    border: isBought
                      ? '1px solid rgba(61,186,111,0.4)'
                      : canAfford
                        ? '1px solid rgba(192,192,255,0.2)'
                        : '1px solid rgba(255,255,255,0.06)',
                    padding: '12px',
                    cursor: canAfford && !isBought ? 'pointer' : 'default',
                    opacity: !canAfford && !isBought ? 0.5 : 1,
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span style={{ fontSize: 22, lineHeight: 1 }}>{isBought ? '✅' : item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs truncate" style={{ color: isBought ? '#3dba6f' : '#e8e6f0' }}>
                        {isBought ? 'Purchased' : item.name}
                      </div>
                      <div className="text-xs mt-0.5 leading-snug" style={{ color: '#8a8aaa' }}>{item.desc}</div>
                    </div>
                  </div>
                  {!isBought && (
                    <div className="flex items-center gap-1 mt-2">
                      <span style={{ color: '#a0a0d0', fontSize: 11 }}>⚡</span>
                      <span className="font-mono font-bold text-sm" style={{ color: canAfford ? '#c8c8f0' : '#666' }}>
                        {item.cost}
                      </span>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Close */}
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-xl py-2.5 font-bold text-sm uppercase tracking-widest"
            style={{
              background: 'rgba(192,192,255,0.08)',
              border: '1px solid rgba(192,192,255,0.2)',
              color: '#a0a0d0',
            }}
          >
            Leave Shop
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
