'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Mountain, Search } from 'lucide-react';
import type { LeaderboardEntry } from '@/lib/api';

type DocFilter = 'all' | 'iron' | 'arc' | 'edge';

const DOC_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  iron:      { icon: '🔴', color: '#c0392b', label: 'Iron' },
  arc:       { icon: '🔵', color: '#2e86de', label: 'Arc' },
  edge:      { icon: '🟢', color: '#27ae60', label: 'Edge' },
  universal: { icon: '✨', color: '#d4a843', label: '?' },
};

function docColor(doctrine: string | null): string {
  return DOC_CONFIG[doctrine ?? '']?.color ?? '#5c574e';
}

function AgentAvatar({ doctrine, size = 48 }: { doctrine: string | null; size?: number }) {
  const cfg = DOC_CONFIG[doctrine ?? ''] ?? { icon: '⚔️', color: '#5c574e' };
  return (
    <div className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{ width:size, height:size, background:`${cfg.color}18`, border:`2px solid ${cfg.color}55`, fontSize:size*0.38 }}>
      {cfg.icon}
    </div>
  );
}

function PodiumCard({ entry, pos }: { entry: LeaderboardEntry; pos: 1|2|3 }) {
  const badge = pos === 1 ? '👑' : pos === 2 ? '🥈' : '🥉';
  const isFirst = pos === 1;
  const col = docColor(entry.doctrine);
  return (
    <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ delay: pos * 0.1 }}
      whileHover={{ y:-4 }}
      className="rounded-2xl flex flex-col items-center text-center"
      style={{ padding: isFirst ? '24px 20px' : '20px 16px', marginTop: isFirst ? 0 : 24,
        background:`${col}08`, border:`1px solid ${col}44`,
        boxShadow: isFirst ? `0 0 30px ${col}22` : undefined }}>
      <motion.span className="text-2xl mb-2" animate={isFirst ? { y:[0,-4,0] } : {}} transition={{ duration:2, repeat:Infinity }}>
        {badge}
      </motion.span>
      <AgentAvatar doctrine={entry.doctrine} size={isFirst ? 72 : 52} />
      <div className="font-bold mt-2 text-sm" style={{ color:'#f0ece4' }}>{entry.agentName}</div>
      <div className="text-[10px] mb-1" style={{ color:'#5c574e' }}>{entry.username}</div>
      <div className="font-mono font-bold text-xl" style={{ color: col }}>{entry.deepestFloor}</div>
      <div className="text-[10px]" style={{ color:'#5c574e' }}>deepest floor</div>
      <div className="font-mono text-[11px] mt-1" style={{ color:'#8a8478' }}>{entry.totalKills} kills · {entry.totalRuns} runs</div>
      <div className="flex gap-1 mt-2 text-[9px] font-mono">
        <span style={{ color:'#c0392b' }}>Iron {entry.doctrineLevel.iron}</span>
        <span style={{ color:'#2e86de' }}>Arc {entry.doctrineLevel.arc}</span>
        <span style={{ color:'#27ae60' }}>Edge {entry.doctrineLevel.edge}</span>
      </div>
    </motion.div>
  );
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [docFilter, setDocFilter] = useState<DocFilter>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const url = docFilter === 'all' ? '/api/leaderboard?limit=50' : `/api/leaderboard?limit=50&doctrine=${docFilter}`;
    setLoading(true);
    setError(null);
    fetch(url)
      .then(r => {
        if (!r.ok) {
          setError('Backend unavailable — try again later');
          return [];
        }
        return r.json();
      })
      .then(data => { setEntries(Array.isArray(data) ? data : []); })
      .catch(() => {
        setError('Failed to load leaderboard');
        setEntries([]);
      })
      .finally(() => setLoading(false));
  }, [docFilter]);

  const filtered = entries.filter(e =>
    !search || e.agentName.toLowerCase().includes(search.toLowerCase()) || e.username.toLowerCase().includes(search.toLowerCase())
  );
  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="text-center space-y-2">
          <motion.span className="text-5xl inline-block" animate={{ y:[0,-6,0] }} transition={{ duration:3, repeat:Infinity }}>🏆</motion.span>
          <motion.h1 initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
            className="text-[2.5rem] font-bold" style={{ color:'#d4a843', textShadow:'0 0 30px rgba(212,168,67,0.3)' }}>
            Hall of Champions
          </motion.h1>
          <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.3 }}
            className="text-[10px] uppercase tracking-[0.3em] italic" style={{ color:'#8a6d2b' }}>
            Greatest warriors to descend into the Crucible
          </motion.p>
        </motion.div>

        {/* Doctrine filter + search */}
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
          className="flex justify-center items-center gap-3 flex-wrap">
          {(['all','iron','arc','edge'] as DocFilter[]).map(d => {
            const cfg = d === 'all' ? { icon:'⚔️', color:'#d4a843', label:'All' } : { ...DOC_CONFIG[d], label: DOC_CONFIG[d].label };
            return (
              <button key={d} onClick={() => setDocFilter(d)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{ background: docFilter === d ? `${cfg.color}22` : 'rgba(255,255,255,0.03)', border:`1px solid ${docFilter === d ? cfg.color : '#2a2a3d'}`, color: docFilter === d ? cfg.color : '#5c574e' }}>
                {cfg.icon} {cfg.label}
              </button>
            );
          })}
          <div className="relative">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:'#5c574e' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search champions..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg w-44 focus:outline-none"
              style={{ background:'rgba(255,255,255,0.03)', border:'1px solid #1e1e2e', color:'#d0cdc8' }} />
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <motion.div animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:'linear' }}
              className="w-8 h-8 rounded-full" style={{ border:'2px solid #1e1e2e', borderTopColor:'#d4a843' }} />
          </div>
        ) : (
          <>
            {/* Podium */}
            {top3.length >= 3 && (
              <div className="grid gap-4 items-end max-w-3xl mx-auto" style={{ gridTemplateColumns:'1fr 1.25fr 1fr' }}>
                <PodiumCard entry={top3[1]} pos={2} />
                <PodiumCard entry={top3[0]} pos={1} />
                <PodiumCard entry={top3[2]} pos={3} />
              </div>
            )}

            {/* Separator */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.04)' }} />
              <span className="text-[9px] uppercase tracking-[0.2em]" style={{ color:'#5c574e' }}>Full Rankings</span>
              <div className="flex-1 h-px" style={{ background:'rgba(255,255,255,0.04)' }} />
            </div>

            {/* Table */}
            <div className="space-y-1">
              {rest.map((entry, idx) => {
                const col = docColor(entry.doctrine);
                return (
                  <motion.div key={entry.userId} initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
                    transition={{ delay: 0.05 * idx }}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all"
                    style={{ background:'rgba(255,255,255,0.015)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')}>
                    <span className="w-7 font-mono font-bold text-sm text-center flex-shrink-0" style={{ color:'#5c574e' }}>#{entry.rank}</span>
                    <AgentAvatar doctrine={entry.doctrine} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate" style={{ color:'#f0ece4' }}>{entry.agentName}</div>
                      <div className="text-[10px]" style={{ color:'#5c574e' }}>{entry.username}</div>
                    </div>
                    <div className="flex items-center gap-6 font-mono text-sm">
                      <span className="flex items-center gap-1" style={{ color: col }}>
                        <Mountain size={12} /> {entry.deepestFloor}
                      </span>
                      <span style={{ color:'#8a8478' }}>{entry.totalKills} kills</span>
                      <span style={{ color:'#5c574e' }}>{entry.totalRuns} runs</span>
                      <div className="flex gap-1 text-[9px]">
                        <span style={{ color:'#c0392b' }}>Fe{entry.doctrineLevel.iron}</span>
                        <span style={{ color:'#2e86de' }}>Ar{entry.doctrineLevel.arc}</span>
                        <span style={{ color:'#27ae60' }}>Ed{entry.doctrineLevel.edge}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {filtered.length === 0 && !error && (
              <div className="text-center py-10 text-sm italic" style={{ color:'#3a3a4a' }}>
                No champions found. Be the first to descend! 🗡️
              </div>
            )}

            {error && (
              <div className="text-center py-10 text-sm" style={{ color:'#c0392b' }}>
                ⚠️ {error}
              </div>
            )}

            <p className="text-center text-[10px] italic" style={{ color:'#3a3a4a' }}>
              Rankings by deepest floor reached · Updated after every run
            </p>
          </>
        )}
      </div>
    </div>
  );
}
