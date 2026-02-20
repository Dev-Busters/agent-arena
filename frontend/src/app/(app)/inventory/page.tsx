'use client';
import { motion } from 'framer-motion';
import GearSlots from '@/components/game/GearSlots';
import GearInventory from '@/components/game/GearInventory';
import TheForge from '@/components/game/TheForge';
import Enchanting from '@/components/game/Enchanting';

export default function InventoryPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen p-6" style={{ background:'linear-gradient(180deg,rgba(10,10,16,0.8) 0%,rgba(5,5,10,0.9) 100%)' }}>
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color:'#f5f0e8' }}>⚔️ Armory</h1>
          <p className="text-sm italic" style={{ color:'#8a8478' }}>Manage your equipment, craft new gear, and enhance your arsenal</p>
        </motion.div>

        <div className="space-y-4">
          <GearSlots />
          <GearInventory />
          <TheForge />
          <Enchanting />
        </div>
      </div>
    </motion.div>
  );
}
