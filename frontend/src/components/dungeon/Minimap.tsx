'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Room {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MinimapProps {
  rooms: Room[];
  visitedRooms: number[];
  currentRoomId: number | null;
  mapWidth?: number;
  mapHeight?: number;
  collapsed?: boolean;
  onToggle?: () => void;
}

// Color palette
const COLORS = {
  background: '#0f0e1a',
  wall: '#1a1930',
  gridLine: '#1e1d35',
  unexplored: '#2a2945',
  unexploredBorder: '#3d3b65',
  explored: '#1e3a5f',
  exploredBorder: '#3388cc',
  current: '#00ff88',
  currentGlow: 'rgba(0, 255, 136, 0.3)',
  corridor: '#222240',
  exit: '#ff6644',
  playerDot: '#00ff88',
  playerGlow: 'rgba(0, 255, 136, 0.6)',
  fogOfWar: 'rgba(10, 10, 20, 0.7)',
};

export default function Minimap({
  rooms,
  visitedRooms,
  currentRoomId,
  mapWidth = 80,
  mapHeight = 24,
  collapsed = false,
  onToggle,
}: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const [hoverRoom, setHoverRoom] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const CANVAS_W = isExpanded ? 400 : 220;
  const CANVAS_H = isExpanded ? 180 : 100;

  const drawMinimap = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dt = timestamp - timeRef.current;
    timeRef.current = timestamp;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_W * dpr;
    canvas.height = CANVAS_H * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Calculate scale to fit all rooms
    if (rooms.length === 0) {
      ctx.fillStyle = '#666';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No map data', CANVAS_W / 2, CANVAS_H / 2);
      return;
    }

    const padding = 8;
    const maxX = Math.max(...rooms.map(r => r.x + r.width));
    const maxY = Math.max(...rooms.map(r => r.y + r.height));
    const minX = Math.min(...rooms.map(r => r.x));
    const minY = Math.min(...rooms.map(r => r.y));

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const scaleX = (CANVAS_W - padding * 2) / rangeX;
    const scaleY = (CANVAS_H - padding * 2) / rangeY;
    const scale = Math.min(scaleX, scaleY);

    const offsetX = padding + ((CANVAS_W - padding * 2) - rangeX * scale) / 2;
    const offsetY = padding + ((CANVAS_H - padding * 2) - rangeY * scale) / 2;

    const toCanvas = (x: number, y: number) => ({
      cx: offsetX + (x - minX) * scale,
      cy: offsetY + (y - minY) * scale,
    });

    // Draw corridors between adjacent rooms (approximate connections)
    ctx.strokeStyle = COLORS.corridor;
    ctx.lineWidth = Math.max(1, scale * 0.3);
    ctx.setLineDash([2, 2]);
    for (let i = 0; i < rooms.length - 1; i++) {
      const r1 = rooms[i];
      const r2 = rooms[i + 1];
      const c1 = toCanvas(r1.x + r1.width / 2, r1.y + r1.height / 2);
      const c2 = toCanvas(r2.x + r2.width / 2, r2.y + r2.height / 2);

      const isVisible = visitedRooms.includes(r1.id) || visitedRooms.includes(r2.id);
      if (isVisible) {
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(c1.cx, c1.cy);
        ctx.lineTo(c2.cx, c2.cy);
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = 1.0;

    // Draw rooms
    const pulsePhase = (timestamp / 1000) % (Math.PI * 2);

    rooms.forEach((room) => {
      const isVisited = visitedRooms.includes(room.id);
      const isCurrent = room.id === currentRoomId;
      const isHovered = room.id === hoverRoom;
      const isLast = room.id === rooms[rooms.length - 1]?.id;

      const pos = toCanvas(room.x, room.y);
      const w = room.width * scale;
      const h = room.height * scale;

      // Fog of war for unvisited rooms not adjacent to visited
      const isAdjacent = rooms.some((adj) => {
        if (adj.id === room.id) return false;
        if (!visitedRooms.includes(adj.id)) return false;
        const dist = Math.sqrt(
          Math.pow(room.x - adj.x, 2) + Math.pow(room.y - adj.y, 2)
        );
        return dist < 30; // rough adjacency threshold
      });

      if (!isVisited && !isAdjacent && !isCurrent) {
        // Deep fog - barely visible
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = COLORS.unexplored;
        ctx.fillRect(pos.cx, pos.cy, w, h);
        ctx.globalAlpha = 1.0;
        return;
      }

      // Room fill
      if (isCurrent) {
        // Current room glow
        const glowSize = 3 + Math.sin(pulsePhase * 2) * 1.5;
        ctx.shadowColor = COLORS.currentGlow;
        ctx.shadowBlur = glowSize * 2;
        ctx.fillStyle = COLORS.current;
        ctx.globalAlpha = 0.25;
        ctx.fillRect(pos.cx - 2, pos.cy - 2, w + 4, h + 4);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
      }

      ctx.fillStyle = isVisited ? COLORS.explored : COLORS.unexplored;
      ctx.globalAlpha = isVisited ? 0.8 : 0.4;
      ctx.fillRect(pos.cx, pos.cy, w, h);
      ctx.globalAlpha = 1.0;

      // Room border
      ctx.strokeStyle = isCurrent
        ? COLORS.current
        : isVisited
        ? COLORS.exploredBorder
        : COLORS.unexploredBorder;
      ctx.lineWidth = isCurrent ? 1.5 : 0.8;
      ctx.globalAlpha = isCurrent ? 1.0 : isVisited ? 0.7 : 0.3;
      ctx.strokeRect(pos.cx, pos.cy, w, h);
      ctx.globalAlpha = 1.0;

      // Exit marker on last room
      if (isLast && (isVisited || isAdjacent)) {
        const ecx = pos.cx + w / 2;
        const ecy = pos.cy + h / 2;
        ctx.fillStyle = COLORS.exit;
        ctx.globalAlpha = 0.6 + Math.sin(pulsePhase * 3) * 0.3;
        ctx.beginPath();
        ctx.arc(ecx, ecy, Math.max(2, scale * 0.4), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Hover highlight
      if (isHovered && !isVisited) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        ctx.strokeRect(pos.cx - 1, pos.cy - 1, w + 2, h + 2);
        ctx.globalAlpha = 1.0;
      }
    });

    // Draw player dot on current room
    if (currentRoomId !== null) {
      const currentRoom = rooms.find(r => r.id === currentRoomId);
      if (currentRoom) {
        const pos = toCanvas(
          currentRoom.x + currentRoom.width / 2,
          currentRoom.y + currentRoom.height / 2
        );

        // Pulsing outer glow
        const pulseSize = 4 + Math.sin(pulsePhase * 3) * 1.5;
        ctx.fillStyle = COLORS.playerGlow;
        ctx.beginPath();
        ctx.arc(pos.cx, pos.cy, pulseSize, 0, Math.PI * 2);
        ctx.fill();

        // Inner dot
        ctx.fillStyle = COLORS.playerDot;
        ctx.shadowColor = COLORS.playerGlow;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(pos.cx, pos.cy, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Legend (bottom-right, small)
    if (isExpanded) {
      const legendX = CANVAS_W - 90;
      const legendY = CANVAS_H - 42;
      ctx.font = '9px monospace';
      ctx.textAlign = 'left';

      // Explored
      ctx.fillStyle = COLORS.exploredBorder;
      ctx.fillRect(legendX, legendY, 6, 6);
      ctx.fillStyle = '#88aacc';
      ctx.fillText('Explored', legendX + 10, legendY + 6);

      // Current
      ctx.fillStyle = COLORS.current;
      ctx.fillRect(legendX, legendY + 12, 6, 6);
      ctx.fillStyle = '#88aacc';
      ctx.fillText('Current', legendX + 10, legendY + 18);

      // Exit
      ctx.fillStyle = COLORS.exit;
      ctx.beginPath();
      ctx.arc(legendX + 3, legendY + 27, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#88aacc';
      ctx.fillText('Exit', legendX + 10, legendY + 30);
    }

    animFrameRef.current = requestAnimationFrame(drawMinimap);
  }, [rooms, visitedRooms, currentRoomId, hoverRoom, isExpanded, CANVAS_W, CANVAS_H]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(drawMinimap);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [drawMinimap]);

  // Handle hover detection on canvas
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (rooms.length === 0) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const padding = 8;
      const maxX = Math.max(...rooms.map(r => r.x + r.width));
      const maxY = Math.max(...rooms.map(r => r.y + r.height));
      const minX = Math.min(...rooms.map(r => r.x));
      const minY = Math.min(...rooms.map(r => r.y));
      const rangeX = maxX - minX || 1;
      const rangeY = maxY - minY || 1;
      const scaleX = (CANVAS_W - padding * 2) / rangeX;
      const scaleY = (CANVAS_H - padding * 2) / rangeY;
      const scale = Math.min(scaleX, scaleY);
      const offsetX = padding + ((CANVAS_W - padding * 2) - rangeX * scale) / 2;
      const offsetY = padding + ((CANVAS_H - padding * 2) - rangeY * scale) / 2;

      let found: number | null = null;
      for (const room of rooms) {
        const cx = offsetX + (room.x - minX) * scale;
        const cy = offsetY + (room.y - minY) * scale;
        const w = room.width * scale;
        const h = room.height * scale;
        if (mx >= cx && mx <= cx + w && my >= cy && my <= cy + h) {
          found = room.id;
          break;
        }
      }
      setHoverRoom(found);
    },
    [rooms, CANVAS_W, CANVAS_H]
  );

  if (collapsed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative"
    >
      {/* Container */}
      <div
        className={`backdrop-blur-xl border rounded-xl overflow-hidden transition-all duration-300 ${
          isExpanded
            ? 'bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-purple-500/40 shadow-lg shadow-purple-500/10'
            : 'bg-gradient-to-br from-slate-900/80 to-slate-950/80 border-slate-700/50'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700/30">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
              🗺️ Map
            </span>
            <span className="text-[9px] text-slate-600 font-mono">
              {visitedRooms.length}/{rooms.length}
            </span>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors font-mono"
          >
            {isExpanded ? '⊟ Shrink' : '⊞ Expand'}
          </button>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ width: CANVAS_W, height: CANVAS_H }}
          className="cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverRoom(null)}
        />

        {/* Hover tooltip */}
        <AnimatePresence>
          {hoverRoom !== null && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800/95 border border-slate-600/50 rounded text-[10px] text-slate-300 font-mono whitespace-nowrap backdrop-blur-sm"
            >
              Room {hoverRoom + 1} •{' '}
              {visitedRooms.includes(hoverRoom)
                ? '✅ Explored'
                : hoverRoom === currentRoomId
                ? '📍 Current'
                : '❓ Unexplored'}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
