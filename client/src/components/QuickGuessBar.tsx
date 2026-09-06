import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getSocket } from '../hooks/useSocket';
import { GamePhase } from '../types';
import { Send, CheckCircle2 } from 'lucide-react';

export default function QuickGuessBar() {
  const [guess, setGuess] = useState('');
  const store = useGameStore();
  const socket = getSocket();

  const isDrawer = store.currentDrawerId === store.playerId;
  const isDrawingPhase = store.phase === GamePhase.DRAWING;
  const hasGuessedCorrectly =
    store.turnScores?.some((s) => s.playerId === store.playerId && s.pointsEarned > 0);

  if (!isDrawingPhase || isDrawer) {
    return null;
  }

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = guess.trim();
    if (!trimmed || !socket || hasGuessedCorrectly) return;

    socket.emit('submitGuess', { text: trimmed });
    setGuess('');
  };

  return (
    <div className="w-full bg-surface/95 backdrop-blur-md rounded-2xl border border-slate-800 p-2 shadow-dark-card transition-all">
      {hasGuessedCorrectly ? (
        <div className="flex items-center justify-center gap-2 py-2 px-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 font-bold text-xs sm:text-sm animate-fadeIn text-center">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>You guessed the word! Relax and watch the sketch! 🎉</span>
        </div>
      ) : (
        <form onSubmit={handleGuessSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder="Type your guess here (e.g. apple, car)..."
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50 shadow-inner"
          />
          <button
            type="submit"
            disabled={!guess.trim()}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black px-4 py-2 sm:py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-neon-cyan shrink-0 text-xs sm:text-sm"
          >
            <span>Guess</span>
            <Send size={14} />
          </button>
        </form>
      )}
    </div>
  );
}
