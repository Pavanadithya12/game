import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import Notification from './components/Notification';
import { useSocket } from './hooks/useSocket';

function App() {
  useSocket(); // Initialize global socket connection

  return (
    <div className="w-full h-screen relative bg-background text-white">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/lobby/:roomId" element={<LobbyPage />} />
        <Route path="/game/:roomId" element={<GamePage />} />
      </Routes>
      <Notification />
    </div>
  );
}

export default App;
