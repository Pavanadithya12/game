import React, { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getSocket } from '../hooks/useSocket';
import { Users, Plus, LogIn, Brush, Sparkles, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const store = useGameStore();
  const socket = getSocket();
  const navigate = useNavigate();
  const [username, setUsername] = useState(store.username);
  const [roomName, setRoomName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');

  useEffect(() => {
    socket.emit('listRooms');
    const interval = setInterval(() => {
      socket.emit('listRooms');
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUser = username.trim();
    const trimmedRoom = roomName.trim();
    if (!trimmedUser) {
      store.addNotification('Please enter your nickname first!', 'warning');
      return;
    }
    if (!trimmedRoom) {
      store.addNotification('Please enter a room name!', 'warning');
      return;
    }
    
    store.setUsername(trimmedUser);
    socket.emit('createRoom', { username: trimmedUser, roomName: trimmedRoom });
  };

  const handleJoinRoom = (roomId: string) => {
    const trimmedUser = username.trim();
    if (!trimmedUser) {
      store.addNotification('Please enter your nickname first!', 'warning');
      return;
    }
    
    store.setUsername(trimmedUser);
    socket.emit('joinRoom', { username: trimmedUser, roomId });
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedId = joinRoomId.trim();
    if (!trimmedId) {
      store.addNotification('Please enter a Room ID!', 'warning');
      return;
    }
    handleJoinRoom(trimmedId);
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden select-none">
      {/* Dark glowing backdrop accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="z-10 w-full max-w-4xl flex flex-col items-center gap-6 md:gap-8">
        {/* Title Header */}
        <div className="text-center animate-slide-up">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-3.5 py-1 rounded-full text-xs font-bold mb-3 shadow-sm">
            <Sparkles size={14} /> Real-Time Multiplayer Skribbl Game
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-2 text-white">
            Mawa<span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">Bro</span>
          </h1>
          <p className="text-base md:text-xl font-medium text-slate-400">
            Draw, Guess, and Battle with Friends!
          </p>
        </div>

        {/* Action Panel */}
        <div className="w-full max-w-md bg-surface/90 backdrop-blur-md p-6 md:p-8 rounded-3xl shadow-dark-card border border-slate-800 animate-slide-up">
          <div className="mb-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Your Player Nickname
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. DoodleMaster"
              className="w-full bg-slate-950 text-white px-4 py-3 rounded-2xl border border-slate-800 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none transition-all text-base font-semibold shadow-inner placeholder-slate-600"
              maxLength={15}
            />
          </div>

          <div className="space-y-4">
            {/* Create Room Form */}
            <form onSubmit={handleCreateRoom} className="space-y-2.5 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/80">
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="New Room Name (e.g. Party Zone)"
                className="w-full bg-slate-950 text-white text-sm px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-cyan-400 outline-none placeholder-slate-600"
                maxLength={20}
              />
              <button
                type="submit"
                disabled={!username.trim() || !roomName.trim()}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-neon-cyan disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-sm"
              >
                <Plus size={18} /> Create Room
              </button>
            </form>

            {/* Join Room Form */}
            <form onSubmit={handleJoinSubmit} className="space-y-2.5 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/80">
              <input
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="Paste Room ID (e.g. a1b2c3d4)"
                className="w-full bg-slate-950 text-white text-sm px-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-blue-400 outline-none placeholder-slate-600"
              />
              <button
                type="submit"
                disabled={!username.trim() || !joinRoomId.trim()}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-700 hover:border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-sm"
              >
                <LogIn size={18} /> Join with Room ID
              </button>
            </form>
          </div>
        </div>

        {/* Active Open Rooms List */}
        <div className="w-full bg-surface/90 backdrop-blur-md p-6 rounded-3xl shadow-dark-card border border-slate-800 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-200">
              <Users size={18} className="text-cyan-400" /> 
              <span>Active Public Rooms</span>
            </h2>
            <button 
              onClick={() => socket?.emit('listRooms')}
              className="text-xs text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1 font-semibold"
            >
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
          
          {store.roomList.length === 0 ? (
            <p className="text-slate-500 text-center py-6 text-sm">No open rooms found right now. Create one above to play!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {store.roomList.map(room => (
                <div key={room.id} className="bg-slate-900/70 p-4 rounded-2xl border border-slate-800 hover:border-cyan-500/50 transition-all group flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-white mb-1 truncate">{room.name}</h3>
                    <p className="text-xs text-slate-400">Host: {room.hostName}</p>
                    <div className="flex items-center gap-2 mt-2.5">
                      <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded-lg text-slate-300 border border-slate-700">
                        {room.playerCount}/{room.maxPlayers} Players
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg ${
                        room.status === 'playing' 
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' 
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {room.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoinRoom(room.id)}
                    disabled={room.playerCount >= room.maxPlayers || !username.trim()}
                    className="mt-4 w-full bg-slate-800 group-hover:bg-cyan-500 group-hover:text-slate-950 text-slate-200 font-bold py-2 rounded-xl transition-all disabled:opacity-40 text-xs border border-slate-700 group-hover:border-cyan-400 cursor-pointer"
                  >
                    Join Game
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
