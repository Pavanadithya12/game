import React from 'react';
import { useGameStore } from '../stores/gameStore';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, RotateCcw, Home } from 'lucide-react';

export default function Leaderboard() {
  const store = useGameStore();
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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-surface border border-gray-700 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl text-center animate-scaleUp flex flex-col max-h-[90vh]">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-500/20 text-yellow-400 mx-auto mb-3 shadow-inner">
          <Trophy size={36} />
        </div>

        <h2 className="text-3xl font-black text-white">Game Over!</h2>
        <p className="text-gray-400 text-sm mt-1 mb-6">
          {winner ? `${winner.username} wins the match!` : 'Great game everyone!'}
        </p>

        {/* Podium / Player Scores */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mb-6">
          {rankedPlayers.map((player, idx) => {
            let medalColor = 'text-gray-500';
            let rankBg = 'bg-background border-gray-800';

            if (idx === 0) {
              medalColor = 'text-yellow-400';
              rankBg = 'bg-yellow-500/10 border-yellow-500/40';
            } else if (idx === 1) {
              medalColor = 'text-gray-300';
              rankBg = 'bg-gray-400/10 border-gray-400/30';
            } else if (idx === 2) {
              medalColor = 'text-amber-600';
              rankBg = 'bg-amber-700/10 border-amber-700/30';
            }

            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-2xl border ${rankBg} transition-transform hover:scale-[1.01]`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8">
                    {idx < 3 ? (
                      <Medal size={22} className={medalColor} />
                    ) : (
                      <span className="font-mono text-sm text-gray-500 font-bold">#{idx + 1}</span>
                    )}
                  </div>

                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: player.avatarColor }}
                  >
                    {player.username.charAt(0).toUpperCase()}
                  </div>

                  <span className="font-bold text-white text-sm">
                    {player.username}
                    {player.id === store.playerId && (
                      <span className="text-xs text-gray-400 ml-1.5">(You)</span>
                    )}
                  </span>
                </div>

                <span className="font-mono font-bold text-accent text-base">
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
            className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-red-500 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-accent/20"
          >
            <RotateCcw size={18} />
            <span>Play Again</span>
          </button>
          <button
            onClick={handleReturnHome}
            className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 px-4 rounded-xl transition-colors border border-gray-700"
          >
            <Home size={18} />
            <span className="hidden sm:inline">Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}
