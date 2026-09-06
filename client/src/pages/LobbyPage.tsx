import React, { useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getSocket } from '../hooks/useSocket';
import { useNavigate, useParams } from 'react-router-dom';
import { Copy, Users, Settings, Play, LogOut, Star } from 'lucide-react';
import ChatPanel from '../components/ChatPanel';

export default function LobbyPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const store = useGameStore();
  const socket = getSocket();
  const navigate = useNavigate();

  const isHost = store.room?.hostId === store.playerId;

  useEffect(() => {
    if (!store.room && socket && store.username && roomId) {
      socket.emit('joinRoom', { username: store.username, roomId });
    } else if (!store.username || !socket) {
      navigate('/');
    }
  }, [store.room, socket, store.username, roomId, navigate]);

  if (!store.room) {
    return <div className="flex items-center justify-center h-screen bg-background">Loading...</div>;
  }

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

  return (
    <div className="h-screen bg-background flex flex-col p-4 md:p-8">
      <div className="max-w-6xl w-full mx-auto h-full flex flex-col gap-6">
        {/* Header */}
        <div className="bg-surface p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between border border-gray-700 shadow-xl">
          <div>
            <h1 className="text-3xl font-black text-white mb-2">{store.room.name}</h1>
            <div className="flex items-center gap-4">
              <button 
                onClick={copyRoomId}
                className="flex items-center gap-2 text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg transition-colors text-gray-300"
              >
                <Copy size={16} /> ID: <span className="font-mono text-accent">{store.room.id}</span>
              </button>
            </div>
          </div>

          <div className="mt-4 md:mt-0 flex gap-4">
            <button
              onClick={handleLeaveRoom}
              className="flex items-center gap-2 bg-gray-800 hover:bg-red-500/20 text-red-400 font-bold py-2.5 px-6 rounded-xl transition-colors border border-gray-700 hover:border-red-500/50"
            >
              <LogOut size={20} /> Leave Room
            </button>
            {isHost && (
              <button
                onClick={handleStartGame}
                disabled={store.room.players.length < 2}
                className="flex items-center gap-2 bg-accent hover:bg-red-500 text-white font-bold py-2.5 px-8 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
              >
                <Play size={20} className="fill-current" /> Start Game
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
          {/* Players List */}
          <div className="flex-1 bg-surface rounded-2xl border border-gray-700 overflow-hidden flex flex-col shadow-xl">
            <div className="p-4 border-b border-gray-700 bg-gray-800/50 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users size={20} className="text-accent" /> Players ({store.room.players.length}/{store.room.maxPlayers})
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 content-start">
              {store.room.players.map((player) => (
                <div 
                  key={player.id} 
                  className={`flex items-center gap-3 p-3 rounded-xl border ${player.id === store.playerId ? 'border-accent bg-accent/10' : 'border-gray-700 bg-background'}`}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner"
                    style={{ backgroundColor: player.avatarColor }}
                  >
                    {player.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 font-medium truncate">
                    {player.username}
                    {player.id === store.playerId && <span className="text-xs text-gray-400 ml-2">(You)</span>}
                  </div>
                  {player.isHost && (
                    <div className="bg-yellow-500/20 text-yellow-500 p-1.5 rounded-lg" title="Host">
                      <Star size={16} className="fill-current" />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Empty slots placeholders */}
              {Array.from({ length: store.room.maxPlayers - store.room.players.length }).map((_, i) => (
                <div key={`empty-${i}`} className="flex items-center gap-3 p-3 rounded-xl border border-gray-800 border-dashed bg-background/50 opacity-50">
                  <div className="w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-700 border-dashed"></div>
                  <div className="text-gray-500 font-medium italic text-sm">Waiting for player...</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Settings & Chat */}
          <div className="w-full md:w-96 flex flex-col gap-6 h-full">
            <div className="bg-surface rounded-2xl border border-gray-700 p-5 shadow-xl shrink-0">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Settings size={18} className="text-primary" /> Game Settings
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between p-2 bg-background rounded-lg border border-gray-800">
                  <span className="text-gray-400">Total Rounds</span>
                  <span className="font-bold">{store.room.totalRounds}</span>
                </div>
                <div className="flex justify-between p-2 bg-background rounded-lg border border-gray-800">
                  <span className="text-gray-400">Draw Time</span>
                  <span className="font-bold">{store.room.turnDuration}s</span>
                </div>
                {isHost && (
                  <p className="text-xs text-gray-500 mt-2 italic text-center">Settings currently fixed for beta.</p>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-0 bg-surface rounded-2xl border border-gray-700 shadow-xl overflow-hidden flex flex-col">
              <div className="p-3 border-b border-gray-700 bg-gray-800/50">
                <h3 className="font-bold">Lobby Chat</h3>
              </div>
              <ChatPanel inGame={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
