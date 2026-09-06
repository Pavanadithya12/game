import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getSocket } from '../hooks/useSocket';
import { GuessResult, GamePhase } from '../types';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface ChatPanelProps {
  inGame?: boolean;
}

export default function ChatPanel({ inGame = false }: ChatPanelProps) {
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const store = useGameStore();
  const socket = getSocket();

  const isDrawer = inGame && store.currentDrawerId === store.playerId;
  const isDrawingPhase = store.phase === GamePhase.DRAWING;

  // Check if player has already guessed correctly in this turn
  const hasGuessedCorrectly =
    inGame &&
    store.turnScores?.some((s) => s.playerId === store.playerId && s.pointsEarned > 0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [store.messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !socket) return;

    if (inGame && !isDrawer && isDrawingPhase) {
      socket.emit('submitGuess', { text: trimmed });
    } else {
      socket.emit('chatMessage', { text: trimmed });
    }

    setText('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-surface rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
      {/* Message List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2 text-sm">
        {store.messages.length === 0 ? (
          <div className="text-gray-500 text-xs italic text-center py-4">
            {inGame ? 'Type your guesses here!' : 'Welcome to the chat!'}
          </div>
        ) : (
          store.messages.map((msg) => {
            if (msg.type === 'system') {
              return (
                <div
                  key={msg.id}
                  className="bg-green-500/10 border border-green-500/30 text-green-400 p-2 rounded-xl text-xs flex items-center gap-1.5 font-medium animate-fadeIn"
                >
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>
                    <strong className="text-white">{msg.playerName}</strong> {msg.text}
                  </span>
                </div>
              );
            }

            if (msg.guessResult === GuessResult.CLOSE) {
              return (
                <div
                  key={msg.id}
                  className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 p-2 rounded-xl text-xs flex items-center gap-1.5 animate-fadeIn"
                >
                  <AlertCircle size={14} className="shrink-0" />
                  <span>
                    <strong className="text-white">{msg.playerName}</strong>: {msg.text} (so close!)
                  </span>
                </div>
              );
            }

            const isOwn = msg.playerId === store.playerId;

            return (
              <div
                key={msg.id}
                className={`p-2 rounded-xl break-words transition-all ${
                  isOwn ? 'bg-gray-800/80 border border-gray-700' : 'bg-background/80'
                }`}
              >
                <span className="font-bold text-accent mr-1.5">{msg.playerName}:</span>
                <span className="text-gray-200">{msg.text}</span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-2 border-t border-gray-700 bg-gray-800/60 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={Boolean(hasGuessedCorrectly && isDrawingPhase)}
          placeholder={
            hasGuessedCorrectly && isDrawingPhase
              ? 'You guessed the word! 🎉'
              : isDrawer
              ? 'Chat with players (cannot guess)'
              : inGame && isDrawingPhase
              ? 'Type your guess here...'
              : 'Type a message...'
          }
          className="flex-1 bg-background border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
          maxLength={100}
        />
        <button
          type="submit"
          disabled={!text.trim() || Boolean(hasGuessedCorrectly && isDrawingPhase)}
          className="bg-accent hover:bg-red-500 text-white p-2 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-md shadow-accent/20"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
