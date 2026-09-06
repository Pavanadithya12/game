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
    <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-800">
          <Trophy size={14} className="text-amber-500" /> Leaderboard
        </h3>
        <span className="text-[11px] text-cyan-800 font-mono font-bold bg-cyan-100 px-2 py-0.5 rounded-full border border-cyan-300">
          {store.room.players.length} Players
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
                  ? 'border-cyan-400 bg-cyan-50'
                  : 'border-slate-200 bg-slate-50 hover:border-slate-300'
              }`}
            >
              {/* Rank */}
              <span className="text-xs font-mono font-black text-slate-400 w-4 text-center">
                #{index + 1}
              </span>

              {/* Avatar */}
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-sm"
                style={{ backgroundColor: player.avatarColor }}
              >
                {player.username.charAt(0).toUpperCase()}
              </div>

              {/* Username & Score */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold truncate flex items-center gap-1 text-slate-800">
                  <span>{player.username}</span>
                  {isSelf && <span className="text-[10px] text-cyan-600 font-bold">(You)</span>}
                </div>
                <div className="text-[11px] font-mono font-bold text-slate-500">{score} pts</div>
              </div>

              {/* State Icons */}
              <div className="flex items-center gap-1">
                {isCurrentDrawer && (
                  <span
                    className="flex items-center gap-1 text-[10px] bg-cyan-100 text-cyan-800 border border-cyan-300 px-1.5 py-0.5 rounded-lg font-bold"
                    title="Drawing now"
                  >
                    <Pencil size={11} className="animate-bounce text-cyan-600" />
                    <span>Draw</span>
                  </span>
                )}
                {hasGuessed && (
                  <span
                    className="p-1 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-700"
                    title="Guessed correctly"
                  >
                    <Check size={12} />
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
