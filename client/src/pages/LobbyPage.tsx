import React, { useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getSocket } from '../hooks/useSocket';
import { useNavigate, useParams } from 'react-router-dom';
import { Copy, Users, Settings, Play, LogOut, Star, Clock, Layers, Sparkles, Check } from 'lucide-react';
import ChatPanel from '../components/ChatPanel';

const DRAW_TIMES = [30, 45, 60, 70, 80, 90, 100, 120];
const ROUNDS_OPTIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10];
const PLAYER_LIMITS = [2, 4, 6, 8, 10, 12, 16];
const CLUES_OPTIONS = [3, 4, 5, 6];

const CATEGORIES = [
  { id: 'All', label: '🌟 All Categories' },
  { id: 'Daily Life', label: '🏠 Daily Life & Home' },
  { id: 'Kitchen', label: '🍳 Kitchen & Dining' },
  { id: 'Fashion', label: '👕 Clothes & Accessories' },
  { id: 'School & Office', label: '🎒 School & Work' },
  { id: 'City & Places', label: '🏙️ City & Places' },
  { id: 'Jobs', label: '💼 Jobs & Professions' },
  { id: 'Maps', label: '🗺️ Maps & World' },
  { id: 'Fruits', label: '🍓 Fruits' },
  { id: 'Vegetables', label: '🥦 Vegetables' },
  { id: 'Cars', label: '🏎️ Cars & Vehicles' },
  { id: 'Symbols', label: '☮️ Symbols & Logos' },
  { id: 'Pop Culture', label: '🦸 Pop Culture' },
  { id: 'Animals', label: '🦁 Animals' },
  { id: 'Food', label: '🍕 Food & Snacks' },
  { id: 'Sci-Fi', label: '🚀 Sci-Fi & Tech' },
  { id: 'Actions', label: '🕺 Funny Actions' },
  { id: 'Objects', label: '📦 Everyday Tools' },
];

export default function LobbyPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const store = useGameStore();
  const socket = getSocket();
  const navigate = useNavigate();

  const isHost = store.room?.hostId === store.playerId;
  const [customWordsInput, setCustomWordsInput] = useState('');
  const [showCustomWords, setShowCustomWords] = useState(false);

  useEffect(() => {
    if (!store.room && socket && store.username && roomId) {
      socket.emit('joinRoom', { username: store.username, roomId });
    } else if (!store.username || !socket) {
      navigate('/');
    }
  }, [store.room, socket, store.username, roomId, navigate]);

  if (!store.room) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-cyan-400 font-bold text-xl animate-pulse">
        Connecting to MawaBro room...
      </div>
    );
  }

  const handleUpdateSettings = (partial: any) => {
    if (isHost && socket) {
      socket.emit('updateRoomSettings', partial);
    }
  };

  const handleStartGame = () => {
    if (isHost && socket) {
      socket.emit('startGame');
    }
  };

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leaveRoom');
      store.setRoom(null);
      navigate('/');
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(store.room!.id);
    store.addNotification('Room ID copied to clipboard!', 'success');
  };

  const currentCategories = store.room.selectedCategories || ['All'];

  const toggleCategory = (catId: string) => {
    if (!isHost) return;
    if (catId === 'All') {
      handleUpdateSettings({ selectedCategories: ['All'] });
      return;
    }

    let next = currentCategories.filter(c => c !== 'All');
    if (next.includes(catId)) {
      next = next.filter(c => c !== catId);
      if (next.length === 0) next = ['All'];
    } else {
      next.push(catId);
    }
    handleUpdateSettings({ selectedCategories: next });
  };

  const handleCustomWordsSave = () => {
    const words = customWordsInput.split(',').map(w => w.trim()).filter(w => w.length > 0);
    handleUpdateSettings({ customWords: words });
    store.addNotification(`Saved ${words.length} custom words!`, 'success');
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col p-4 md:p-6 select-none">
      <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col gap-5">
        
        {/* Top Header Card */}
        <div className="bg-surface/90 backdrop-blur-md p-5 md:p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between border border-slate-800 shadow-dark-card gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-black text-2xl text-white shadow-neon-cyan">
              M
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">{store.room.name}</h1>
                <span className="bg-cyan-500/20 text-cyan-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                  Lobby
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button 
                  onClick={copyRoomId}
                  className="flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-lg transition-colors text-slate-300 border border-slate-700 hover:border-cyan-500"
                >
                  <Copy size={13} /> Room Code: <span className="font-mono font-bold text-cyan-400">{store.room.id}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              onClick={handleLeaveRoom}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-rose-500/20 text-rose-400 font-bold py-2.5 px-5 rounded-2xl transition-all border border-slate-700 hover:border-rose-500/40 text-sm"
            >
              <LogOut size={16} /> Leave
            </button>
            {isHost && (
              <button
                onClick={handleStartGame}
                disabled={store.room.players.length < 2}
                className="flex-1 md:flex-initial flex items-center justify-center gap-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold py-3 px-8 rounded-2xl transition-all shadow-neon-cyan disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-base transform hover:scale-[1.02]"
              >
                <Play size={18} className="fill-current" /> Start Game
              </button>
            )}
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0">
          
          {/* Left Column: Player Roster (4 Cols) */}
          <div className="lg:col-span-4 flex flex-col bg-surface/90 backdrop-blur-md rounded-3xl border border-slate-800 shadow-dark-card overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <h2 className="font-bold flex items-center gap-2 text-slate-200">
                <Users size={18} className="text-cyan-400" /> 
                <span>Players</span>
              </h2>
              <span className="text-xs font-mono bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-full border border-cyan-500/20 font-bold">
                {store.room.players.length} / {store.room.maxPlayers}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[500px] lg:max-h-none">
              {store.room.players.map((player) => {
                const isMe = player.id === store.playerId;
                return (
                  <div 
                    key={player.id} 
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isMe 
                        ? 'border-cyan-500/40 bg-cyan-500/10 shadow-sm' 
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div 
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-md shrink-0 ring-2 ring-white/10"
                        style={{ backgroundColor: player.avatarColor }}
                      >
                        {player.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate font-semibold text-slate-200 text-sm">
                        {player.username}
                        {isMe && <span className="text-xs text-cyan-400 font-bold ml-1.5">(You)</span>}
                      </div>
                    </div>

                    {player.isHost && (
                      <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold px-2 py-1 rounded-xl">
                        <Star size={12} className="fill-current" /> Host
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Waiting slots */}
              {Array.from({ length: Math.max(0, store.room.maxPlayers - store.room.players.length) }).map((_, i) => (
                <div key={`slot-${i}`} className="flex items-center gap-3 p-3 rounded-2xl border border-dashed border-slate-800/80 bg-slate-900/20 opacity-40">
                  <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-600 text-xs">?</div>
                  <span className="text-xs text-slate-500 font-medium italic">Empty Slot</span>
                </div>
              ))}
            </div>
          </div>

          {/* Middle Column: Host Game Settings (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col bg-surface/90 backdrop-blur-md rounded-3xl border border-slate-800 shadow-dark-card overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
              <h2 className="font-bold flex items-center gap-2 text-slate-200">
                <Settings size={18} className="text-cyan-400" />
                <span>Game Settings</span>
              </h2>
              {!isHost && (
                <span className="text-xs text-slate-400 italic">Host-managed</span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* 1. Draw Time Settings */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Clock size={14} className="text-cyan-400" /> Draw Time (Seconds)
                  </label>
                  <span className="text-sm font-black text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                    {store.room.turnDuration}s
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[60, 70, 80, 90].map((sec) => (
                    <button
                      key={sec}
                      disabled={!isHost}
                      onClick={() => handleUpdateSettings({ turnDuration: sec })}
                      className={`py-2 rounded-xl text-xs font-bold font-mono transition-all border ${
                        store.room!.turnDuration === sec
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-neon-cyan font-black scale-105'
                          : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800 disabled:opacity-60'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[30, 45, 100, 120].map((sec) => (
                    <button
                      key={sec}
                      disabled={!isHost}
                      onClick={() => handleUpdateSettings({ turnDuration: sec })}
                      className={`py-1.5 rounded-xl text-xs font-semibold font-mono transition-all border ${
                        store.room!.turnDuration === sec
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-neon-cyan font-bold scale-105'
                          : 'bg-slate-900/40 hover:bg-slate-800 text-slate-400 border-slate-800/80 disabled:opacity-40'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Rounds Adjustment */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Layers size={14} className="text-cyan-400" /> Total Rounds
                  </label>
                  <span className="text-sm font-black text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                    {store.room.totalRounds} Rounds
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {ROUNDS_OPTIONS.map((rnd) => (
                    <button
                      key={rnd}
                      disabled={!isHost}
                      onClick={() => handleUpdateSettings({ totalRounds: rnd })}
                      className={`py-2 rounded-xl text-xs font-bold font-mono transition-all border ${
                        store.room!.totalRounds === rnd
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-neon-cyan font-black scale-105'
                          : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800 disabled:opacity-60'
                      }`}
                    >
                      {rnd}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Player Limits */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Users size={14} className="text-cyan-400" /> Max Players
                  </label>
                  <span className="text-sm font-black text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                    {store.room.maxPlayers}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PLAYER_LIMITS.map((limit) => (
                    <button
                      key={limit}
                      disabled={!isHost}
                      onClick={() => handleUpdateSettings({ maxPlayers: limit })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all border ${
                        store.room!.maxPlayers === limit
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                          : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 border-slate-800 disabled:opacity-50'
                      }`}
                    >
                      {limit}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Number of Clues (Hints) */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-cyan-400" /> Clues / Hints (4, 5, or 6)
                  </label>
                  <span className="text-sm font-black text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                    {store.room.maxClues || 4} Clues
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {CLUES_OPTIONS.map((clue) => (
                    <button
                      key={clue}
                      disabled={!isHost}
                      onClick={() => handleUpdateSettings({ maxClues: clue })}
                      className={`py-2 rounded-xl text-xs font-bold font-mono transition-all border ${
                        (store.room!.maxClues || 4) === clue
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-neon-cyan font-black scale-105'
                          : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800 disabled:opacity-60'
                      }`}
                    >
                      {clue} Clues
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Exciting Word Categories */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2.5">
                  <Sparkles size={14} className="text-cyan-400" /> Word Categories
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => {
                    const active = currentCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        disabled={!isHost}
                        onClick={() => toggleCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 ${
                          active
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500 shadow-sm'
                            : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700 disabled:opacity-50'
                        }`}
                      >
                        {active && <Check size={12} />}
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Custom Words Option */}
              {isHost && (
                <div className="pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => setShowCustomWords(!showCustomWords)}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    {showCustomWords ? '▾ Hide Custom Words' : '▸ Add Custom Words (Optional)'}
                  </button>

                  {showCustomWords && (
                    <div className="mt-3 space-y-2 animate-fadeIn">
                      <textarea
                        rows={2}
                        value={customWordsInput}
                        onChange={(e) => setCustomWordsInput(e.target.value)}
                        placeholder="e.g. avatar, pikachu, ferrari, matrix, tacos"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                      />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(store.room.onlyCustomWords)}
                            onChange={(e) => handleUpdateSettings({ onlyCustomWords: e.target.checked })}
                            className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                          />
                          <span>Use custom words exclusively</span>
                        </label>
                        <button
                          onClick={handleCustomWordsSave}
                          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Save Words
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Lobby Chat (3 Cols) */}
          <div className="lg:col-span-3 flex flex-col bg-surface/90 backdrop-blur-md rounded-3xl border border-slate-800 shadow-dark-card overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-900/50">
              <h2 className="font-bold text-sm text-slate-300">Lobby Chat</h2>
            </div>
            <div className="flex-1 min-h-[300px] flex flex-col">
              <ChatPanel inGame={false} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
