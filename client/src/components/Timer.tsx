import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { Clock } from 'lucide-react';

export default function Timer() {
  const timeLeft = useGameStore((state) => state.timeLeft);

  const isUrgent = timeLeft <= 15 && timeLeft > 5;
  const isCritical = timeLeft <= 5 && timeLeft > 0;

  let colorClasses = 'bg-slate-900 text-cyan-400 border-slate-700 shadow-sm';
  if (isCritical) {
    colorClasses = 'bg-rose-950/80 text-rose-400 border-rose-500 shadow-neon-pink animate-pulse';
  } else if (isUrgent) {
    colorClasses = 'bg-amber-950/80 text-amber-400 border-amber-500';
  }

  return (
    <div
      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border font-mono font-black transition-all ${colorClasses}`}
    >
      <Clock size={16} className={isCritical ? 'animate-spin text-rose-400' : 'text-cyan-400'} />
      <span className="text-xl min-w-[2ch] text-center tracking-tight">{Math.max(0, timeLeft)}</span>
      <span className="text-xs text-slate-500 font-sans font-bold">s</span>
    </div>
  );
}
