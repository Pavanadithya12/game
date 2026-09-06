import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { Clock } from 'lucide-react';

export default function Timer() {
  const timeLeft = useGameStore((state) => state.timeLeft);

  // Determine timer color state
  const isUrgent = timeLeft <= 15;
  const isCritical = timeLeft <= 5;

  let colorClasses = 'bg-gray-800 text-white border-gray-700';
  if (isCritical) {
    colorClasses = 'bg-red-950/80 text-red-400 border-red-500 animate-pulse';
  } else if (isUrgent) {
    colorClasses = 'bg-yellow-950/80 text-yellow-400 border-yellow-500';
  }

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-bold shadow-md transition-colors ${colorClasses}`}
    >
      <Clock size={18} className={isCritical ? 'animate-spin' : ''} />
      <span className="text-xl min-w-[2ch] text-center">{Math.max(0, timeLeft)}</span>
      <span className="text-xs text-gray-400 font-sans font-normal">s</span>
    </div>
  );
}
