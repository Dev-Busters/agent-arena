'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Material {
  materialId: string;
  name: string;
  rarity: string;
  type: string;
  quantity: number;
}

interface GearPiece {
  id: string;
  name: string;
  slot: string;
  rarity: string;
  stats: any;
  visualEffect?: string;
  equipped: boolean;
}

export default function CraftingPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [gear, setGear] = useState<GearPiece[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<{ materialId: string; quantity: number }[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<'weapon' | 'armor' | 'accessory'>('weapon');
  const [loading, setLoading] = useState(false);
  const [crafting, setCrafting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchData(token);
  }, []);

  const fetchData = async (token: string) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [materialsRes, gearRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/crafting/materials`, { headers }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/crafting/gear`, { headers })
      ]);

      setMaterials(materialsRes.data);
      setGear(gearRes.data);
    } catch (error) {
      console.error('Failed to fetch crafting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMaterial = (materialId: string) => {
    const existing = selectedMaterials.find(m => m.materialId === materialId);
    if (existing) {
      setSelectedMaterials(selectedMaterials.filter(m => m.materialId !== materialId));
    } else {
      const material = materials.find(m => m.materialId === materialId);
      if (material) {
        setSelectedMaterials([...selectedMaterials, { materialId, quantity: 1 }]);
      }
    }
  };

  const handleCraft = async () => {
    if (selectedMaterials.length === 0) {
      alert('Select at least one material');
      return;
    }

    setCrafting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/crafting/craft`,
        { slot: selectedSlot, materials: selectedMaterials },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert(`Crafted: ${response.data.gear.name}`);
        setSelectedMaterials([]);
        fetchData(token!);
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Crafting failed');
    } finally {
      setCrafting(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'text-gray-400',
      uncommon: 'text-green-400',
      rare: 'text-blue-400',
      epic: 'text-purple-400',
      legendary: 'text-yellow-400'
    };
    return colors[rarity] || 'text-white';
  };

  const getRarityBg = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'bg-gray-500/20 border-gray-500',
      uncommon: 'bg-green-500/20 border-green-500',
      rare: 'bg-blue-500/20 border-blue-500',
      epic: 'bg-purple-500/20 border-purple-500',
      legendary: 'bg-yellow-500/20 border-yellow-500'
    };
    return colors[rarity] || 'bg-slate-500/20 border-slate-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <h1 className="text-4xl font-bold text-white">🔨 Crafting Forge</h1>
          <Link href="/dashboard" className="text-purple-300 hover:text-white transition">
            ← Back to Dashboard
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Materials Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-4"
          >
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">📦 Available Materials</h2>

              {materials.length === 0 ? (
                <p className="text-slate-400">No materials yet. Explore dungeons to gather materials!</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {materials.map((material) => {
                    const isSelected = selectedMaterials.some(m => m.materialId === material.materialId);
                    return (
                      <motion.button
                        key={material.materialId}
                        onClick={() => toggleMaterial(material.materialId)}
                        whileHover={{ scale: 1.02 }}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${isSelected
                            ? 'border-purple-400 bg-purple-500/20'
                            : `${getRarityBg(material.rarity)} border-opacity-50`
                          }`}
                      >
                        <p className={`font-bold text-sm ${getRarityColor(material.rarity)}`}>
                          {material.name}
                        </p>
                        <p className="text-xs text-slate-300">x{material.quantity}</p>
                        <p className="text-xs text-slate-400 capitalize">{material.type}</p>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Crafting Panel */}
            <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">⚙️ Craft Gear</h2>

              {/* Slot Selection */}
              <div className="mb-4">
                <p className="text-purple-300 text-sm mb-2">Select Gear Slot:</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['weapon', 'armor', 'accessory'] as const).map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-lg border-2 transition-all capitalize font-bold ${selectedSlot === slot
                          ? 'border-purple-400 bg-purple-500/30 text-white'
                          : 'border-purple-500/30 bg-slate-800/30 text-purple-300 hover:bg-slate-800/50'
                        }`}
                    >
                      {slot === 'weapon' ? '⚔️' : slot === 'armor' ? '🛡️' : '💍'} {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selected Materials */}
              {selectedMaterials.length > 0 && (
                <div className="mb-4 p-3 rounded-lg bg-slate-800/30 border border-slate-700">
                  <p className="text-sm text-slate-300 mb-2">Selected Materials:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedMaterials.map((sm) => {
                      const mat = materials.find(m => m.materialId === sm.materialId);
                      return (
                        <span
                          key={sm.materialId}
                          className="px-2 py-1 bg-purple-600/50 rounded text-xs text-purple-300"
                        >
                          {mat?.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Craft Button */}
              <motion.button
                onClick={handleCraft}
                disabled={crafting || selectedMaterials.length === 0}
                whileHover={!crafting ? { scale: 1.02 } : {}}
                className={`w-full py-3 rounded-lg font-bold transition-all ${crafting || selectedMaterials.length === 0
                    ? 'bg-purple-600/50 text-purple-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/50'
                  }`}
              >
                {crafting ? '🔨 Crafting...' : '🔨 Craft Gear'}
              </motion.button>
            </div>
          </motion.div>

          {/* Gear Inventory */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6"
          >
            <h2 className="text-2xl font-bold text-white mb-4">⚔️ Your Gear</h2>

            {gear.length === 0 ? (
              <p className="text-slate-400">No gear yet. Start crafting!</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {gear.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.02 }}
                    className={`p-3 rounded-lg border-2 ${getRarityBg(item.rarity)}`}
                  >
                    <p className={`font-bold text-sm ${getRarityColor(item.rarity)}`}>{item.name}</p>
                    <p className="text-xs text-slate-400 capitalize mb-1">{item.slot}</p>
                    <div className="text-xs text-slate-300 space-y-1">
                      {Object.entries(item.stats).map(([key, value]: [string, unknown]) => (
                        <p key={key}>
                          +{String(value)} {key.toUpperCase()}
                        </p>
                      ))}
                    </div>
                    {item.equipped && <p className="text-xs text-yellow-400 mt-2">✓ Equipped</p>}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
