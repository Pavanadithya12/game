import React, { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { getSocket } from '../hooks/useSocket';
import { Users, Plus, LogIn, Brush } from 'lucide-react';
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
      store.addNotification('Please enter a username first!', 'warning');
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
      store.addNotification('Please enter a username first!', 'warning');
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-10 left-10 text-accent opacity-20 animate-pulse">
        <Brush size={120} />
      </div>
      <div className="absolute bottom-20 right-20 text-primary opacity-20 animate-bounce" style={{ animationDuration: '3s' }}>
        <Brush size={80} className="transform rotate-180" />
      </div>

      <div className="z-10 w-full max-w-4xl flex flex-col items-center gap-8">
        <div className="text-center animate-slide-up">
          <h1 className="text-6xl md:text-8xl font-black mb-2 bg-gradient-to-r from-accent to-purple-500 text-transparent bg-clip-text drop-shadow-lg">
            MawaBro
          </h1>
          <p className="text-xl md:text-3xl font-medium text-gray-300 tracking-wide">
            Draw, Guess, Win!
          </p>
        </div>

        <div className="w-full max-w-md bg-surface p-8 rounded-2xl shadow-2xl border border-gray-700 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">
              Your Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username..."
              className="w-full bg-background text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-accent focus:ring-2 focus:ring-accent outline-none transition-all text-lg font-medium"
              maxLength={15}
            />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <form onSubmit={handleCreateRoom} className="space-y-4 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room Name"
                className="w-full bg-background text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-accent outline-none"
                maxLength={20}
              />
              <button
                type="submit"
                disabled={!username.trim() || !roomName.trim()}
                className="w-full bg-accent hover:bg-red-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={20} /> Create Room
              </button>
            </form>

            <form onSubmit={handleJoinSubmit} className="space-y-4 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
              <input
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="Room ID"
                className="w-full bg-background text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-primary outline-none"
              />
              <button
                type="submit"
                disabled={!username.trim() || !joinRoomId.trim()}
                className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogIn size={20} /> Join by ID
              </button>
            </form>
          </div>
        </div>

        {/* Room List */}
        <div className="w-full bg-surface p-6 rounded-2xl shadow-xl border border-gray-700 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Users size={24} className="text-accent" /> Available Rooms
            </h2>
            <button 
              onClick={() => socket?.emit('listRooms')}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Refresh
            </button>
          </div>
          
          {store.roomList.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No open rooms found. Create one to start playing!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {store.roomList.map(room => (
                <div key={room.id} className="bg-background p-4 rounded-xl border border-gray-700 hover:border-accent transition-colors group flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-lg mb-1 truncate">{room.name}</h3>
                    <p className="text-sm text-gray-400">Host: {room.hostName}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm bg-gray-800 px-2 py-1 rounded text-gray-300">
                        {room.playerCount}/{room.maxPlayers} Players
                      </span>
                      <span className={`text-sm px-2 py-1 rounded font-medium ${room.status === 'playing' ? 'bg-yellow-900/50 text-yellow-500' : 'bg-green-900/50 text-green-500'}`}>
                        {room.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleJoinRoom(room.id)}
                    disabled={room.playerCount >= room.maxPlayers || !username.trim()}
                    className="mt-4 w-full bg-gray-800 group-hover:bg-accent text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-gray-800"
                  >
                    Join Room
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
