import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getSocket } from '../hooks/useSocket';
import { Star } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-surface border border-gray-700 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl text-center animate-scaleUp">
        <h2 className="text-3xl font-black text-white mb-2">Pick a Word!</h2>
        <p className="text-gray-400 text-sm mb-6">
          Choose a word to draw for this turn. The other players will try to guess it.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {wordChoices.map((choice) => {
            const isChosen = selectedWord === choice.word;
            return (
              <button
                key={choice.word}
                disabled={Boolean(selectedWord)}
                onClick={() => handleSelectWord(choice.word)}
                className={`group relative border-2 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all transform cursor-pointer ${
                  isChosen
                    ? 'bg-accent/30 border-accent scale-105 shadow-xl shadow-accent/30'
                    : selectedWord
                    ? 'opacity-40 bg-background border-gray-800 cursor-not-allowed'
                    : 'bg-background hover:bg-accent/15 border-gray-700 hover:border-accent hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/20'
                }`}
              >
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {choice.category}
                </span>
                <span className="text-xl font-bold text-white group-hover:text-accent capitalize">
                  {choice.word}
                </span>

                {/* Difficulty Stars */}
                <div className="flex items-center gap-1 text-yellow-400 mt-1">
                  {Array.from({ length: choice.difficulty || 1 }).map((_, i) => (
                    <Star key={i} size={12} className="fill-current" />
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
