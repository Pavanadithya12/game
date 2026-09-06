import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { getSocket } from '../hooks/useSocket';
import { Tool, GamePhase } from '../types';
import { Pencil, Eraser, Undo2, Trash2 } from 'lucide-react';

const COLORS = [
  '#000000',
  '#808080',
  '#FFFFFF',
  '#FF0000',
  '#FF8C00',
  '#FFD700',
  '#00AA00',
  '#00CED1',
  '#0000FF',
  '#8B00FF',
  '#FF69B4',
  '#8B4513',
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
      className={`flex flex-wrap items-center justify-between gap-3 p-3 bg-surface rounded-2xl border border-gray-700 shadow-lg transition-opacity duration-200 ${
        isDrawer ? 'opacity-100' : 'opacity-40 pointer-events-none'
      }`}
    >
      {/* Tool Selection */}
      <div className="flex items-center gap-1.5 bg-gray-900/80 p-1.5 rounded-xl border border-gray-800">
        <button
          onClick={() => store.setTool(Tool.PENCIL)}
          title="Pencil"
          className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium ${
            store.currentTool === Tool.PENCIL
              ? 'bg-accent text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Pencil size={18} />
          <span className="hidden sm:inline">Pencil</span>
        </button>
        <button
          onClick={() => store.setTool(Tool.ERASER)}
          title="Eraser"
          className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium ${
            store.currentTool === Tool.ERASER
              ? 'bg-accent text-white shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <Eraser size={18} />
          <span className="hidden sm:inline">Eraser</span>
        </button>
      </div>

      {/* Brush Sizes */}
      <div className="flex items-center gap-1.5 bg-gray-900/80 p-1.5 rounded-xl border border-gray-800">
        {BRUSH_SIZES.map((b) => (
          <button
            key={b.size}
            onClick={() => store.setBrushSize(b.size)}
            title={`Brush size ${b.label}`}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              store.brushSize === b.size
                ? 'bg-gray-700 text-white font-bold border border-accent'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <div
              className="rounded-full bg-current"
              style={{ width: `${Math.max(4, b.size * 0.8)}px`, height: `${Math.max(4, b.size * 0.8)}px` }}
            />
          </button>
        ))}
      </div>

      {/* Colors */}
      <div className="flex items-center gap-1 bg-gray-900/80 p-1.5 rounded-xl border border-gray-800 overflow-x-auto max-w-full">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => {
              store.setColor(c);
              store.setTool(Tool.PENCIL);
            }}
            title={c}
            className={`w-6 h-6 rounded-md transition-transform hover:scale-110 flex-shrink-0 ${
              store.currentColor === c && store.currentTool === Tool.PENCIL
                ? 'scale-125 ring-2 ring-accent ring-offset-1 ring-offset-gray-900'
                : ''
            }`}
            style={{ backgroundColor: c, border: c === '#FFFFFF' ? '1px solid #4B5563' : undefined }}
          />
        ))}
      </div>

      {/* Actions: Undo / Clear */}
      <div className="flex items-center gap-1.5 bg-gray-900/80 p-1.5 rounded-xl border border-gray-800">
        <button
          onClick={handleUndo}
          title="Undo"
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <Undo2 size={18} />
        </button>
        <button
          onClick={handleClear}
          title="Clear Canvas"
          className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}
