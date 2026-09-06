import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { getSocket } from '../hooks/useSocket';
import { Tool, GamePhase } from '../types';
import { Pencil, Eraser, Undo2, Trash2 } from 'lucide-react';

const COLORS = [
  '#000000',
  '#64748B',
  '#FFFFFF',
  '#EF4444',
  '#F97316',
  '#FBBF24',
  '#10B981',
  '#06B6D4',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#78350F',
];

const BRUSH_SIZES = [
  { label: 'S', size: 4 },
  { label: 'M', size: 8 },
  { label: 'L', size: 16 },
  { label: 'XL', size: 24 },
];

export default function Toolbar() {
  const store = useGameStore();
  const socket = getSocket();

  const isDrawer = store.currentDrawerId === store.playerId && store.phase === GamePhase.DRAWING;

  const handleUndo = () => {
    if (!isDrawer || !socket) return;
    if (store.playerId) {
      store.removeLastStroke(store.playerId);
      socket.emit('undoStroke');
    }
  };

  const handleClear = () => {
    if (!isDrawer || !socket) return;
    store.clearStrokes();
    socket.emit('clearCanvas');
  };

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2.5 p-2.5 bg-white rounded-2xl border border-slate-300 shadow-md transition-all ${
        isDrawer ? 'opacity-100' : 'opacity-30 pointer-events-none'
      }`}
    >
      {/* Tool Buttons */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-300">
        <button
          onClick={() => store.setTool(Tool.PENCIL)}
          title="Pencil"
          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
            store.currentTool === Tool.PENCIL
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Pencil size={15} />
          <span>Draw</span>
        </button>
        <button
          onClick={() => store.setTool(Tool.ERASER)}
          title="Eraser"
          className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
            store.currentTool === Tool.ERASER
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          <Eraser size={15} />
          <span>Eraser</span>
        </button>
      </div>

      {/* Brush Sizes */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-300">
        {BRUSH_SIZES.map((b) => (
          <button
            key={b.size}
            onClick={() => store.setBrushSize(b.size)}
            title={`Brush size ${b.label}`}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              store.brushSize === b.size
                ? 'bg-white text-cyan-600 border border-cyan-500 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200'
            }`}
          >
            <div
              className="rounded-full bg-current"
              style={{ width: `${Math.max(4, b.size * 0.7)}px`, height: `${Math.max(4, b.size * 0.7)}px` }}
            />
          </button>
        ))}
      </div>

      {/* Color Swatches */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-300 overflow-x-auto max-w-full">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => {
              store.setColor(c);
              store.setTool(Tool.PENCIL);
            }}
            title={c}
            className={`w-5 h-5 rounded-md transition-all hover:scale-125 shrink-0 cursor-pointer ${
              store.currentColor === c && store.currentTool === Tool.PENCIL
                ? 'scale-125 ring-2 ring-cyan-500 ring-offset-1 ring-offset-white'
                : ''
            }`}
            style={{ backgroundColor: c, border: c === '#FFFFFF' ? '1px solid #cbd5e1' : undefined }}
          />
        ))}
      </div>

      {/* Undo & Clear */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-300">
        <button
          onClick={handleUndo}
          title="Undo"
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <Undo2 size={16} />
        </button>
        <button
          onClick={handleClear}
          title="Clear Canvas"
          className="p-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
