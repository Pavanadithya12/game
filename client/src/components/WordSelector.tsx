import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getSocket } from '../hooks/useSocket';
import { Star, Flame, Sparkles } from 'lucide-react';

const DIFFICULTY_CONFIG: Record<number, { label: string; badgeClass: string; starColor: string }> = {
  1: {
    label: 'Easy',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    starColor: 'text-emerald-400',
  },
  2: {
    label: 'Medium',
    badgeClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    starColor: 'text-cyan-400',
  },
  3: {
    label: 'Hard',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    starColor: 'text-amber-400',
  },
  4: {
    label: 'Master',
    badgeClass: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40 shadow-sm shadow-fuchsia-500/20',
    starColor: 'text-fuchsia-400',
  },
};

export default function WordSelector() {
  const store = useGameStore();
  const socket = getSocket();
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  const wordChoices = store.wordChoices || [];

  const handleSelectWord = (word: string) => {
    if (selectedWord) return; // Prevent double clicks
    setSelectedWord(word);
    if (socket) {
      socket.emit('selectWord', { word });
    }
  };

  if (wordChoices.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-surface border border-slate-700/80 rounded-3xl p-6 md:p-8 max-w-3xl w-full shadow-2xl text-center animate-scaleUp">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-3">
          <Sparkles size={14} /> Your Turn to Draw
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-white mb-2">Pick a Word!</h2>
        <p className="text-slate-400 text-xs md:text-sm mb-6 max-w-md mx-auto">
          Choose a word from Level 1 (Easy) to Level 4 (Master). Other players will try to guess your sketch!
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {wordChoices.map((choice) => {
            const isChosen = selectedWord === choice.word;
            const diffLevel = choice.difficulty || 1;
            const config = DIFFICULTY_CONFIG[diffLevel] || DIFFICULTY_CONFIG[1];

            return (
              <button
                key={choice.word}
                disabled={Boolean(selectedWord)}
                onClick={() => handleSelectWord(choice.word)}
                className={`group relative border-2 rounded-2xl p-4 flex flex-col items-center justify-between min-h-[140px] md:min-h-[160px] gap-2 transition-all transform cursor-pointer ${
                  isChosen
                    ? 'bg-cyan-500/20 border-cyan-400 scale-105 shadow-xl shadow-cyan-500/30'
                    : selectedWord
                    ? 'opacity-40 bg-slate-950 border-slate-800 cursor-not-allowed'
                    : 'bg-slate-950 hover:bg-slate-900 border-slate-800 hover:border-cyan-400 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/20'
                }`}
              >
                {/* Level / Difficulty Badge */}
                <div className={`px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${config.badgeClass}`}>
                  {diffLevel === 4 ? <Flame size={11} className="text-fuchsia-400 animate-pulse" /> : null}
                  <span>Lvl {diffLevel} • {config.label}</span>
                </div>

                {/* Word */}
                <div className="flex flex-col items-center">
                  <span className="text-lg md:text-xl font-black text-white group-hover:text-cyan-300 capitalize tracking-tight leading-snug">
                    {choice.word}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 mt-0.5">
                    {choice.category}
                  </span>
                </div>

                {/* Difficulty Stars */}
                <div className="flex items-center gap-1 mt-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Star
                      key={i}
                      size={13}
                      className={
                        i < diffLevel
                          ? `fill-current ${config.starColor}`
                          : 'text-slate-700 fill-slate-800'
                      }
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
