import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, RotateCcw, Home } from 'lucide-react';
import { getSocket } from '../hooks/useSocket';

export default function Leaderboard() {
  const store = useGameStore();
  const socket = getSocket();
  const navigate = useNavigate();

  const finalResult = store.finalResult;
  const players = store.room?.players || [];

  // Sort players by final score
  const rankedPlayers = [...players]
    .map((p) => ({
      ...p,
      finalScore: finalResult?.finalScores[p.id] ?? store.scores[p.id] ?? p.score ?? 0,
    }))
    .sort((a, b) => b.finalScore - a.finalScore);

  const winner = rankedPlayers[0];

  const handleReturnToLobby = () => {
    if (store.room) {
      if (store.room.hostId === store.playerId && socket) {
        socket.emit('updateRoomSettings', { totalRounds: store.room.totalRounds });
      }
      store.resetGame();
      navigate(`/lobby/${store.room.id}`);
    } else {
      navigate('/');
    }
  };

  const handleReturnHome = () => {
    store.resetGame();
    store.setRoom(null);
    navigate('/');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none">
      <div className="bg-surface/95 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-dark-card text-center animate-scaleUp flex flex-col max-h-[90vh]">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto mb-3 shadow-neon-yellow border border-amber-500/30">
          <Trophy size={34} />
        </div>

        <h2 className="text-3xl font-black text-white tracking-tight">Game Over!</h2>
        <p className="text-slate-400 text-sm mt-1 mb-6">
          {winner ? <span className="text-cyan-400 font-bold">{winner.username} wins the match!</span> : 'Great match everyone!'}
        </p>

        {/* Podium / Player Scores */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mb-6">
          {rankedPlayers.map((player, idx) => {
            let medalColor = 'text-slate-500';
            let rankBg = 'bg-slate-900/60 border-slate-800';

            if (idx === 0) {
              medalColor = 'text-amber-400';
              rankBg = 'bg-amber-500/10 border-amber-500/40 shadow-sm';
            } else if (idx === 1) {
              medalColor = 'text-slate-300';
              rankBg = 'bg-slate-800/40 border-slate-700/50';
            } else if (idx === 2) {
              medalColor = 'text-amber-600';
              rankBg = 'bg-amber-700/10 border-amber-700/30';
            }

            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-2xl border ${rankBg} transition-transform`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8">
                    {idx < 3 ? (
                      <Medal size={22} className={medalColor} />
                    ) : (
                      <span className="font-mono text-xs text-slate-500 font-black">#{idx + 1}</span>
                    )}
                  </div>

                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-sm ring-1 ring-white/10"
                    style={{ backgroundColor: player.avatarColor }}
                  >
                    {player.username.charAt(0).toUpperCase()}
                  </div>

                  <span className="font-bold text-slate-200 text-sm">
                    {player.username}
                    {player.id === store.playerId && (
                      <span className="text-xs text-cyan-400 ml-1.5 font-bold">(You)</span>
                    )}
                  </span>
                </div>

                <span className="font-mono font-black text-cyan-400 text-base">
                  {player.finalScore} pts
                </span>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleReturnToLobby}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black py-3 px-4 rounded-2xl transition-all shadow-neon-cyan text-sm cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>Play Again</span>
          </button>
          <button
            onClick={handleReturnHome}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold py-3 px-5 rounded-2xl transition-colors border border-slate-800 text-sm cursor-pointer"
          >
            <Home size={16} />
            <span>Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}
