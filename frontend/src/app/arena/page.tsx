'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArenaCanvas, GameHUD, GameStats, GameState, DamageEvent } from '@/components/game';
import DamageNumber from '@/components/game/DamageNumber';
import SchoolSelection from '@/components/game/SchoolSelection';
import DisciplineSelection from '@/components/game/DisciplineSelection';
import TenetSelection from '@/components/game/TenetSelection';
import { useAgentLoadout, getTenetSlots } from '@/stores/agentLoadout';
import { SchoolConfig, DEFAULT_SCHOOL } from '@/components/game/schools';
import { Discipline } from '@/components/game/disciplines';
import { Tenet } from '@/components/game/tenets';

type DoctrineStep = 'school' | 'disciplines' | 'tenets' | 'confirm' | 'playing';

interface DamageNumberData {
  id: string; damage: number; x: number; y: number; isCrit: boolean; isHeal: boolean;
}

// ── Compact loadout review before descending ─────────────────────────────────
function LoadoutConfirm({ school, disciplines, tenets, onEnter, onReconfigure }: {
  school: SchoolConfig; disciplines: Discipline[]; tenets: Tenet[];
  onEnter: () => void; onReconfigure: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: '#0a0a0f' }}
    >
      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(80,40,10,0.12) 0%, transparent 65%)' }} />

      <div className="z-10 flex flex-col items-center gap-6 px-8 max-w-lg w-full">
        {/* Header */}
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.5em] mb-2" style={{ color: '#8a6d2b' }}>⚔ Doctrine Sealed</p>
          <h1 className="font-display text-4xl font-bold tracking-wide" style={{ color: '#e8e6e3' }}>Ready to Descend</h1>
          <p className="text-sm mt-1" style={{ color: '#6b6660' }}>Review your build, then commit</p>
        </div>

        {/* School */}
        <div className="w-full rounded-lg px-5 py-4 flex items-center gap-4"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,168,67,0.25)' }}>
          <span className="text-3xl">{school.icon}</span>
          <div>
            <div className="font-display text-lg font-semibold" style={{ color: '#d4a843' }}>{school.name}</div>
            <div className="text-xs mt-0.5" style={{ color: '#8a8478' }}>{school.tagline}</div>
          </div>
        </div>

        {/* Disciplines */}
        <div className="w-full">
          <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: '#6b6660' }}>Disciplines</p>
          {disciplines.length === 0
            ? <p className="text-xs italic" style={{ color: '#4a4a4a' }}>None selected</p>
            : <div className="flex gap-3">
                {disciplines.map(d => (
                  <div key={d.id} className="flex items-center gap-2 rounded px-3 py-2"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span className="text-lg">{d.icon}</span>
                    <div>
                      <div className="text-xs font-semibold" style={{ color: '#e8e6e3' }}>{d.name}</div>
                      <div className="text-[10px]" style={{ color: '#6b6660' }}>{d.tagline}</div>
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Tenets */}
        <div className="w-full">
          <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: '#6b6660' }}>Tenets</p>
          {tenets.length === 0
            ? <p className="text-xs italic" style={{ color: '#4a4a4a' }}>None selected</p>
            : <div className="flex flex-wrap gap-2">
                {tenets.map(t => (
                  <span key={t.id} className="flex items-center gap-1.5 text-xs rounded-full px-3 py-1"
                    style={{ background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.2)', color: '#c9a43e' }}>
                    {t.icon} {t.name}
                  </span>
                ))}
              </div>
          }
        </div>

        {/* Gold divider */}
        <div className="w-full h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,168,67,0.3), transparent)' }} />

        {/* Actions */}
        <div className="flex flex-col items-center gap-3 w-full">
          <button onClick={onEnter}
            className="w-full py-4 rounded-lg font-display text-lg font-bold tracking-widest uppercase transition-all duration-200 hover:brightness-110 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #d4a843 0%, #8a6d2b 100%)', color: '#0a0a0f' }}>
            ⚔ Descend into the Crucible
          </button>
          <button onClick={onReconfigure}
            className="text-xs transition-colors hover:opacity-80"
            style={{ color: '#6b6660' }}>
            ↩ Reconfigure Doctrine
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ArenaPage() {
  const loadout = useAgentLoadout();
  const activeSchool = loadout.school ?? DEFAULT_SCHOOL;
  const tenetSlots = getTenetSlots(loadout.accountLevel ?? 1);

  // Skip straight to playing if already configured, otherwise school selection
  const [step, setStep] = useState<DoctrineStep>(() =>
    loadout.school ? 'playing' : 'school'
  );

  const [gameState, setGameState] = useState<GameState>({
    playerHp: 100, playerMaxHp: 100, playerLevel: 1, playerXP: 0,
    playerXPToNext: 100, kills: 0, gold: 0, valor: 0, floor: 1,
    roomsCompleted: 0, enemiesRemaining: 0,
    abilities: {
      dash: { cooldown: 3000, lastUsed: 0 }, blast: { cooldown: 6000, lastUsed: 0 },
      projectile: { cooldown: 5000, lastUsed: 0 }, heal: { cooldown: 12000, lastUsed: 0 }
    },
    isPaused: false
  });

  const [damageNumbers, setDamageNumbers] = useState<DamageNumberData[]>([]);

  const handleGameStateChange = useCallback((stats: GameStats) => {
    setGameState(prev => ({ ...prev, ...stats }));
  }, []);

  const handlePause   = useCallback(() => setGameState(prev => ({ ...prev, isPaused: true })), []);
  const handleResume  = useCallback(() => setGameState(prev => ({ ...prev, isPaused: false })), []);

  const handleDamage = useCallback((event: DamageEvent) => {
    const id = `dmg-${Date.now()}-${Math.random()}`;
    setDamageNumbers(prev => [...prev, { id, damage: event.damage, x: event.x, y: event.y, isCrit: event.isCrit, isHeal: false }]);
  }, []);

  const removeDamageNumber = useCallback((id: string) => {
    setDamageNumbers(prev => prev.filter(d => d.id !== id));
  }, []);

  // ── Selection handlers ────────────────────────────────────────────────────
  const onSchoolSelect = (school: SchoolConfig) => {
    loadout.setSchool(school);
    setStep('disciplines');
  };

  const onDisciplinesConfirm = (disciplines: Discipline[]) => {
    loadout.setDisciplines(disciplines);
    setStep('tenets');
  };

  const onTenetsConfirm = (tenets: Tenet[]) => {
    loadout.setTenets(tenets);
    setStep('confirm');
  };

  const onEnterCrucible = () => {
    setStep('playing');
  };

  const onReconfigure = () => {
    setStep('school');
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (step === 'playing') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center">
        <div className="relative border border-[#2a2a3d] rounded-lg overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
          <ArenaCanvas
            width={1280} height={720}
            onGameStateChange={handleGameStateChange}
            onDamage={handleDamage}
            isPaused={gameState.isPaused}
          />
          <GameHUD gameState={{ ...gameState, doctrineLevel: loadout.doctrineLevel }} onPause={handlePause} onResume={handleResume} />
          {damageNumbers.map(dmg => (
            <DamageNumber key={dmg.id} damage={dmg.damage} x={dmg.x} y={dmg.y}
              isCrit={dmg.isCrit} isHeal={dmg.isHeal}
              onComplete={() => removeDamageNumber(dmg.id)} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {step === 'school' && (
        <SchoolSelection key="school" onSelect={onSchoolSelect} />
      )}
      {step === 'disciplines' && (
        <DisciplineSelection key="disciplines"
          school={activeSchool}
          onConfirm={onDisciplinesConfirm}
          onClose={() => setStep('school')}
          preSelected={loadout.disciplines}
        />
      )}
      {step === 'tenets' && (
        <TenetSelection key="tenets"
          onConfirm={onTenetsConfirm}
          onClose={() => setStep('disciplines')}
          maxSlots={Math.max(tenetSlots, 2)}
          preSelected={loadout.tenets}
        />
      )}
      {step === 'confirm' && (
        <LoadoutConfirm key="confirm"
          school={activeSchool}
          disciplines={loadout.disciplines}
          tenets={loadout.tenets}
          onEnter={onEnterCrucible}
          onReconfigure={onReconfigure}
        />
      )}
    </AnimatePresence>
  );
}
