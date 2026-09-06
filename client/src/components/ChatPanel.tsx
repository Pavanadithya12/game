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
  const listContainerRef = useRef<HTMLDivElement | null>(null);

  const store = useGameStore();
  const socket = getSocket();

  const isDrawer = inGame && store.currentDrawerId === store.playerId;
  const isDrawingPhase = store.phase === GamePhase.DRAWING;

  const hasGuessedCorrectly =
    inGame &&
    store.turnScores?.some((s) => s.playerId === store.playerId && s.pointsEarned > 0);

  const scrollToBottom = () => {
    // Only scroll the internal message container, NEVER scroll the outer window or canvas!
    if (listContainerRef.current) {
      listContainerRef.current.scrollTop = listContainerRef.current.scrollHeight;
    }
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
    <div className="flex-1 flex flex-col h-full min-h-0 bg-surface/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-dark-card overflow-hidden">
      {/* Message List */}
      <div 
        ref={listContainerRef} 
        className="flex-1 min-h-0 p-3 overflow-y-auto space-y-2 text-xs overscroll-contain"
      >
        {store.messages.length === 0 ? (
          <div className="text-slate-500 text-xs italic text-center py-6">
            {inGame ? 'Type your guess in the box below!' : 'Welcome to the lobby!'}
          </div>
        ) : (
          store.messages.map((msg) => {
            if (msg.type === 'system') {
              return (
                <div
                  key={msg.id}
                  className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 p-2 rounded-xl text-xs flex items-center gap-1.5 font-bold animate-fadeIn"
                >
                  <CheckCircle2 size={13} className="shrink-0" />
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
                  className="bg-amber-500/15 border border-amber-500/30 text-amber-300 p-2 rounded-xl text-xs flex items-center gap-1.5 animate-fadeIn"
                >
                  <AlertCircle size={13} className="shrink-0" />
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
                  isOwn ? 'bg-slate-900/90 border border-slate-800' : 'bg-slate-950/60'
                }`}
              >
                <span className="font-bold text-cyan-400 mr-1.5">{msg.playerName}:</span>
                <span className="text-slate-200">{msg.text}</span>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-2 border-t border-slate-800 bg-slate-900/70 flex gap-2 shrink-0">
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
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        />
        <button
          type="submit"
          disabled={!text.trim() || Boolean(hasGuessedCorrectly && isDrawingPhase)}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-3 py-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed font-bold"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
