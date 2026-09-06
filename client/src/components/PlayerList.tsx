import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { Pencil, Check, Trophy } from 'lucide-react';

export default function PlayerList() {
  const store = useGameStore();

  if (!store.room) return null;

  // Sort players by score descending
  const sortedPlayers = [...store.room.players].sort((a, b) => {
    const scoreA = store.scores[a.id] ?? a.score ?? 0;
    const scoreB = store.scores[b.id] ?? b.score ?? 0;
    return scoreB - scoreA;
  });

  return (
    <div className="flex-1 flex flex-col bg-surface rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
      <div className="p-3 border-b border-gray-700 bg-gray-800/50 flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-1.5 text-sm text-gray-200">
          <Trophy size={16} className="text-yellow-400" /> Players
        </h3>
        <span className="text-xs text-gray-400 font-mono">
          {store.room.players.length} online
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {sortedPlayers.map((player, index) => {
          const isCurrentDrawer = player.id === store.currentDrawerId;
          const isSelf = player.id === store.playerId;
          const score = store.scores[player.id] ?? player.score ?? 0;
          const hasGuessed = store.turnScores?.some(
            (s) => s.playerId === player.id && s.pointsEarned > 0
          );

          return (
            <div
              key={player.id}
              className={`flex items-center gap-2 p-2 rounded-xl transition-all border ${
                isSelf
                  ? 'border-accent/50 bg-accent/10'
                  : 'border-gray-800 bg-background/60'
              }`}
            >
              {/* Rank */}
              <span className="text-xs font-mono font-bold text-gray-500 w-4 text-center">
                #{index + 1}
              </span>

              {/* Avatar */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow"
                style={{ backgroundColor: player.avatarColor }}
              >
                {player.username.charAt(0).toUpperCase()}
              </div>

              {/* Username */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate flex items-center gap-1">
                  <span>{player.username}</span>
                  {isSelf && <span className="text-[10px] text-gray-400">(You)</span>}
                </div>
                <div className="text-xs font-mono text-gray-400">{score} pts</div>
              </div>

              {/* Indicators: Drawing or Guessed */}
              <div className="flex items-center gap-1">
                {isCurrentDrawer && (
                  <span
                    className="flex items-center gap-1 text-[11px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-md font-medium"
                    title="Drawing now"
                  >
                    <Pencil size={12} className="animate-bounce" />
                    <span className="hidden sm:inline">Draw</span>
                  </span>
                )}
                {hasGuessed && (
                  <span
                    className="p-1 rounded-full bg-green-500/20 text-green-400"
                    title="Guessed correctly"
                  >
                    <Check size={14} />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
