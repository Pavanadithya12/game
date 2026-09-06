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
import { Clock, Layers, MessageSquare, Users, Sparkles, Pencil } from 'lucide-react';

export default function GamePage() {
  const store = useGameStore();
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const [mobileTab, setMobileTab] = useState<'chat' | 'players'>('chat');
  const [isTyping, setIsTyping] = useState(false);

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
    <div className="h-[100dvh] max-h-[100dvh] bg-slate-100 text-slate-900 flex flex-col overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="h-14 sm:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 shrink-0 z-10 shadow-sm gap-2">
        {/* Brand & Round Badge */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-white shadow-sm text-sm sm:text-base">
            M
          </div>
          <span className="font-black text-base sm:text-lg tracking-wider text-slate-900 hidden md:inline">MawaBro</span>
          <span className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-bold font-mono text-cyan-800 border border-cyan-300 bg-cyan-50 px-2 sm:px-2.5 py-1 rounded-xl shadow-sm">
            <Layers size={12} /> R{store.game.currentRound}/{store.game.totalRounds}
          </span>
        </div>
        
        {/* Center Hint / Word Display */}
        <div className="flex-1 flex justify-center px-1 min-w-0">
          {store.phase === GamePhase.DRAWING && (
            <div className="bg-slate-900 text-white border border-slate-800 px-3 sm:px-5 py-1 rounded-2xl text-center shadow-md flex flex-col items-center max-w-full truncate">
              <span className="text-[9px] sm:text-[10px] font-bold text-cyan-400 uppercase tracking-widest leading-none mb-0.5">
                {isDrawer ? '🎨 You are Drawing' : 'Guess the Word'}
              </span>
              <span className="font-mono text-sm sm:text-2xl font-black tracking-[0.2em] sm:tracking-[0.35em] text-white truncate">
                {isDrawer && store.currentWord ? store.currentWord.toUpperCase() : store.wordHint}
              </span>
            </div>
          )}
          {store.phase === GamePhase.PICKING_WORD && (
            <div className="text-xs sm:text-sm font-bold text-slate-700 animate-pulse bg-white border border-slate-300 px-3 sm:px-4 py-1.5 rounded-xl text-center truncate shadow-sm">
              {isDrawer ? '🎨 Choose a word to draw!' : `⏳ Waiting for ${drawerName} to pick...`}
            </div>
          )}
        </div>

        {/* Top Right Corner: Drawer Word Display & Timer */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Drawer word badge at top right corner */}
          {isDrawer && store.currentWord && store.phase === GamePhase.DRAWING && (
            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-xl shadow-sm animate-pulse">
              <Pencil size={14} className="text-emerald-600" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-[8px] uppercase tracking-widest font-bold text-emerald-600">Word</span>
                <span className="text-xs sm:text-sm font-black text-slate-900 capitalize">{store.currentWord}</span>
              </div>
            </div>
          )}

          <Timer />
        </div>
      </div>

      {/* Main Game Screen */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden relative">
        
        {/* Left Side: Canvas & Toolbar / QuickGuess */}
        <div className="flex-1 flex flex-col min-w-0 p-2 sm:p-3 md:p-4 gap-2 sm:gap-3 overflow-hidden">
          {/* Canvas Wrapper - dynamically responsive for mobile typing */}
          <div className={`min-h-0 bg-slate-200 rounded-2xl shadow-md overflow-hidden relative border border-slate-300 flex items-center justify-center p-1 sm:p-2 transition-all ${
            isTyping ? 'h-[30vh] max-h-[200px] shrink-0' : 'flex-1'
          }`}>
            <Canvas />
            
            {/* Overlay for Turn Transitions & Waiting */}
            {store.phase !== GamePhase.DRAWING && !showGameEnd && (
              <div className="absolute inset-0 bg-slate-900/75 backdrop-blur-md z-20 flex items-center justify-center p-4 animate-fadeIn">
                {store.phase === GamePhase.WAITING && (
                  <h2 className="text-xl sm:text-2xl font-black text-white animate-pulse">Waiting for next turn...</h2>
                )}
                
                {store.phase === GamePhase.ROUND_END && (
                  <div className="text-center animate-slide-up bg-white border border-slate-200 p-5 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full text-slate-900">
                    <h2 className="text-2xl sm:text-3xl font-black text-cyan-600 mb-1">Turn Ended!</h2>
                    <p className="text-slate-600 text-xs sm:text-sm mb-3">
                      The word was: <span className="font-mono font-black text-slate-900 text-lg sm:text-xl tracking-wider capitalize">{store.wordHint}</span>
                    </p>

                    {/* Countdown to next turn/round */}
                    {store.countdownInfo && (
                      <div className="mb-3 inline-flex items-center gap-2 text-cyan-800 font-mono font-bold text-xs bg-cyan-100 py-1.5 px-4 rounded-full border border-cyan-300 animate-pulse">
                        <Clock size={14} />
                        <span>{store.countdownInfo.message} ({store.countdownInfo.secondsLeft}s)</span>
                      </div>
                    )}
                    
                    {store.turnScores && (
                      <div className="space-y-1.5 max-h-36 sm:max-h-44 overflow-y-auto pr-1">
                        {store.turnScores.map((score, index) => (
                          <div key={score.playerId} className="flex justify-between items-center bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm">
                            <span className="font-bold flex items-center gap-2">
                              <span className="text-slate-400 text-xs">#{index + 1}</span> 
                              <span>{score.playerName}</span>
                            </span>
                            <span className="font-mono font-bold text-emerald-600">+{score.pointsEarned} pts</span>
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
              <QuickGuessBar onFocusChange={setIsTyping} />
            ) : null}
          </div>

          {/* Mobile Tabbed View (Chat / Players) below Canvas - auto-hides when typing to keep canvas 100% visible! */}
          <div className={`md:hidden flex flex-col h-44 sm:h-52 shrink-0 border-t border-slate-200 pt-2 min-h-0 transition-all ${
            isTyping ? 'hidden' : 'flex'
          }`}>
            <div className="flex items-center gap-2 mb-2 shrink-0">
              <button
                onClick={() => setMobileTab('chat')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  mobileTab === 'chat'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-300'
                }`}
              >
                <MessageSquare size={13} />
                <span>Chat & Guesses</span>
              </button>
              <button
                onClick={() => setMobileTab('players')}
                className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  mobileTab === 'players'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-300'
                }`}
              >
                <Users size={13} />
                <span>Players ({store.room.players.length})</span>
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden bg-white rounded-2xl border border-slate-200 p-2 shadow-sm">
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
        <div className="hidden md:flex w-80 lg:w-96 flex-col gap-3 p-4 border-l border-slate-200 bg-white overflow-hidden min-h-0 shrink-0">
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
