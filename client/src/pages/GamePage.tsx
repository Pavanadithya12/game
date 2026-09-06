import React, { useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { GamePhase } from '../types';
import Canvas from '../components/Canvas';
import Toolbar from '../components/Toolbar';
import ChatPanel from '../components/ChatPanel';
import PlayerList from '../components/PlayerList';
import Timer from '../components/Timer';
import WordSelector from '../components/WordSelector';
import Leaderboard from '../components/Leaderboard';
import { useNavigate, useParams } from 'react-router-dom';
import { Brush } from 'lucide-react';

export default function GamePage() {
  const store = useGameStore();
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();

  useEffect(() => {
    if (!store.game || !store.room) {
      // Trying to access game page without active game state
      navigate('/');
    }
  }, [store.game, store.room, navigate]);

  if (!store.game || !store.room) return null;

  const effectiveDrawerId = store.currentDrawerId || store.game.currentDrawerId;
  const hasWordChoices = Boolean(store.wordChoices && store.wordChoices.length > 0);
  const isDrawer = Boolean(
    effectiveDrawerId && store.playerId && effectiveDrawerId === store.playerId
  );

  const showWordSelector = 
    (store.phase === GamePhase.PICKING_WORD || store.game.phase === GamePhase.PICKING_WORD) &&
    isDrawer &&
    hasWordChoices;

  const drawerPlayer = store.room.players.find(p => p.id === effectiveDrawerId);
  const drawerName = drawerPlayer ? drawerPlayer.username : 'drawer';

  const showTurnEnd = store.phase === GamePhase.ROUND_END;
  const showGameEnd = store.phase === GamePhase.GAME_END;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="h-16 bg-surface border-b border-gray-700 flex items-center justify-between px-4 md:px-8 shrink-0 z-10 shadow-md">
        <div className="flex items-center gap-2">
          <Brush className="text-accent" />
          <span className="font-black text-xl tracking-wider text-white">MawaBro</span>
          <span className="ml-4 text-sm font-medium text-gray-400 border border-gray-700 bg-gray-800 px-2 py-1 rounded">
            Round {store.game.currentRound}/{store.game.totalRounds}
          </span>
        </div>
        
        {/* Center Hint/Word */}
        <div className="flex-1 flex justify-center">
          {store.phase === GamePhase.DRAWING && (
            <div className="bg-gray-900 border border-gray-700 px-6 py-2 rounded-xl text-center shadow-inner">
              <span className="text-sm text-gray-400 uppercase tracking-widest block mb-1">
                {isDrawer ? 'Draw this' : 'Guess the word'}
              </span>
              <span className="font-mono text-2xl font-bold tracking-[0.3em] text-white">
                {store.wordHint}
              </span>
            </div>
          )}
          {store.phase === GamePhase.PICKING_WORD && (
            <div className="text-lg font-bold text-gray-300 animate-pulse">
              {isDrawer ? 'Choose a word to draw!' : `Waiting for ${drawerName} to pick a word...`}
            </div>
          )}
        </div>

        <div>
          <Timer />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden relative">
        
        {/* Left Side: Canvas & Toolbar */}
        <div className="flex-1 flex flex-col min-w-0 p-4">
          <div className="flex-1 bg-white rounded-2xl shadow-xl overflow-hidden relative border border-gray-700 group flex items-center justify-center">
            <Canvas />
            
            {/* Overlay for non-drawing phases */}
            {store.phase !== GamePhase.DRAWING && !showGameEnd && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex items-center justify-center">
                {store.phase === GamePhase.WAITING && (
                  <h2 className="text-3xl font-bold text-white animate-pulse">Waiting for next turn...</h2>
                )}
                {store.phase === GamePhase.ROUND_END && store.turnScores && (
                  <div className="text-center animate-slide-up bg-surface p-8 rounded-2xl border border-gray-700 shadow-2xl">
                    <h2 className="text-4xl font-black text-accent mb-2">Turn Ended!</h2>
                    <p className="text-xl text-gray-300 mb-6">The word was: <span className="font-mono font-bold text-white text-2xl tracking-widest">{store.wordHint}</span></p>
                    
                    <div className="max-w-md mx-auto space-y-3">
                      {store.turnScores.map((score, index) => (
                        <div key={score.playerId} className="flex justify-between items-center bg-background p-3 rounded-xl border border-gray-700">
                          <span className="font-bold flex items-center gap-2">
                            <span className="text-gray-500">#{index + 1}</span> {score.playerName}
                          </span>
                          <span className="font-mono font-bold text-green-400">+{score.pointsEarned}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="mt-4 shrink-0">
            <Toolbar />
          </div>
        </div>

        {/* Right Side: Players & Chat */}
        <div className="w-full md:w-80 lg:w-96 flex flex-col gap-4 p-4 border-t md:border-t-0 md:border-l border-gray-800 bg-surface/50 overflow-hidden">
          <div className="h-1/3 min-h-[200px] flex flex-col">
            <PlayerList />
          </div>
          <div className="flex-1 min-h-[300px] flex flex-col">
            <ChatPanel inGame={true} />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showWordSelector && <WordSelector />}
      {showGameEnd && <Leaderboard />}
    </div>
  );
}
