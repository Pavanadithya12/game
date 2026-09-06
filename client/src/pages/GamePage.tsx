import React, { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { GamePhase } from '../types';
import Canvas from '../components/Canvas';
import Toolbar from '../components/Toolbar';
import QuickGuessBar from '../components/QuickGuessBar';
import ChatPanel from '../components/ChatPanel';
import PlayerList from '../components/PlayerList';
import Timer from '../components/Timer';
import WordSelector from '../components/WordSelector';
import Leaderboard from '../components/Leaderboard';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, Layers, MessageSquare, Users } from 'lucide-react';

export default function GamePage() {
  const store = useGameStore();
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const [mobileTab, setMobileTab] = useState<'chat' | 'players'>('chat');

  useEffect(() => {
    if (!store.game || !store.room) {
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

  const showGameEnd = store.phase === GamePhase.GAME_END;

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-background text-slate-100 flex flex-col overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="h-14 sm:h-16 bg-surface/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-3 sm:px-6 shrink-0 z-10 shadow-dark-card">
        {/* Brand & Round Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-white shadow-neon-cyan text-sm sm:text-base">
            M
          </div>
          <span className="font-black text-base sm:text-lg tracking-wider text-white hidden sm:inline">MawaBro</span>
          <span className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold font-mono text-cyan-300 border border-cyan-500/30 bg-cyan-500/10 px-2 sm:px-2.5 py-1 rounded-xl shadow-sm">
            <Layers size={12} /> R{store.game.currentRound}/{store.game.totalRounds}
          </span>
        </div>
        
        {/* Center Hint / Word Display */}
        <div className="flex-1 flex justify-center px-2">
          {store.phase === GamePhase.DRAWING && (
            <div className="bg-slate-950/90 border border-slate-800 px-3 sm:px-5 py-1 sm:py-1.5 rounded-2xl text-center shadow-inner flex flex-col items-center">
              <span className="text-[9px] sm:text-[10px] font-bold text-cyan-400 uppercase tracking-widest leading-none mb-0.5 sm:mb-1">
                {isDrawer ? 'Your Word to Draw' : 'Guess the Word'}
              </span>
              <span className="font-mono text-base sm:text-2xl font-black tracking-[0.25em] sm:tracking-[0.35em] text-white">
                {store.wordHint}
              </span>
            </div>
          )}
          {store.phase === GamePhase.PICKING_WORD && (
            <div className="text-xs sm:text-base font-bold text-slate-300 animate-pulse bg-slate-950/80 border border-slate-800 px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl text-center">
              {isDrawer ? '🎨 Choose a word to draw!' : `⏳ Waiting for ${drawerName} to pick...`}
            </div>
          )}
        </div>

        {/* Timer */}
        <div>
          <Timer />
        </div>
      </div>

      {/* Main Game Screen */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden relative">
        
        {/* Left Side: Canvas & Toolbar / QuickGuess */}
        <div className="flex-1 flex flex-col min-w-0 p-2 sm:p-3 md:p-4 gap-2 sm:gap-3 overflow-hidden">
          {/* Canvas Wrapper */}
          <div className="flex-1 min-h-0 bg-slate-950 rounded-2xl shadow-dark-card overflow-hidden relative border border-slate-800/80 flex items-center justify-center p-1 sm:p-2">
            <Canvas />
            
            {/* Overlay for Turn Transitions & Waiting */}
            {store.phase !== GamePhase.DRAWING && !showGameEnd && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-20 flex items-center justify-center p-4 animate-fadeIn">
                {store.phase === GamePhase.WAITING && (
                  <h2 className="text-xl sm:text-2xl font-black text-white animate-pulse">Waiting for next turn...</h2>
                )}
                
                {store.phase === GamePhase.ROUND_END && (
                  <div className="text-center animate-slide-up bg-surface/95 border border-slate-800 p-5 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full">
                    <h2 className="text-2xl sm:text-3xl font-black text-cyan-400 mb-1">Turn Ended!</h2>
                    <p className="text-slate-400 text-xs sm:text-sm mb-4">
                      The word was: <span className="font-mono font-black text-white text-lg sm:text-xl tracking-wider capitalize">{store.wordHint}</span>
                    </p>

                    {/* Countdown to next turn/round */}
                    {store.countdownInfo && (
                      <div className="mb-4 inline-flex items-center gap-2 text-cyan-300 font-mono font-bold text-xs bg-cyan-500/10 py-1.5 px-4 rounded-full border border-cyan-500/25 animate-pulse">
                        <Clock size={14} />
                        <span>{store.countdownInfo.message} ({store.countdownInfo.secondsLeft}s)</span>
                      </div>
                    )}
                    
                    {store.turnScores && (
                      <div className="space-y-2 max-h-40 sm:max-h-48 overflow-y-auto pr-1">
                        {store.turnScores.map((score, index) => (
                          <div key={score.playerId} className="flex justify-between items-center bg-slate-900/80 p-2 sm:p-2.5 rounded-xl border border-slate-800 text-xs sm:text-sm">
                            <span className="font-bold flex items-center gap-2">
                              <span className="text-slate-500 text-xs">#{index + 1}</span> 
                              <span>{score.playerName}</span>
                            </span>
                            <span className="font-mono font-bold text-emerald-400">+{score.pointsEarned} pts</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Below Canvas: Drawer gets Toolbar, Guesser gets Quick Guess Bar */}
          <div className="shrink-0">
            {isDrawer ? (
              <Toolbar />
            ) : store.phase === GamePhase.DRAWING ? (
              <QuickGuessBar />
            ) : null}
          </div>

          {/* Mobile Tabbed View (Chat / Players) below Canvas - only on mobile */}
          <div className="md:hidden flex flex-col h-44 sm:h-52 shrink-0 border-t border-slate-800/80 pt-2 min-h-0">
            <div className="flex items-center gap-2 mb-2 shrink-0">
              <button
                onClick={() => setMobileTab('chat')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  mobileTab === 'chat'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 border border-slate-800'
                }`}
              >
                <MessageSquare size={13} />
                <span>Chat & Guesses</span>
              </button>
              <button
                onClick={() => setMobileTab('players')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  mobileTab === 'players'
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 border border-slate-800'
                }`}
              >
                <Users size={13} />
                <span>Players ({store.room.players.length})</span>
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
              {mobileTab === 'chat' ? (
                <ChatPanel inGame={true} />
              ) : (
                <div className="h-full overflow-y-auto">
                  <PlayerList />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Right Side: Players List & Chat Panel */}
        <div className="hidden md:flex w-80 lg:w-96 flex-col gap-3 p-4 border-l border-slate-800/80 bg-surface/60 overflow-hidden min-h-0 shrink-0">
          <div className="h-2/5 min-h-[160px] flex flex-col">
            <PlayerList />
          </div>
          <div className="flex-1 min-h-[220px] flex flex-col">
            <ChatPanel inGame={true} />
          </div>
        </div>
      </div>

      {/* Popups & Modals */}
      {showWordSelector && <WordSelector />}
      {showGameEnd && <Leaderboard />}
    </div>
  );
}
