import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../stores/gameStore';
import { ServerToClientEvents, ClientToServerEvents } from '../types';
import { useNavigate } from 'react-router-dom';

// Auto-detect: if served from Express (port 3001), connect to same origin
// If Vite dev server (port 5173), connect to localhost:3001
const url = import.meta.env.PROD
  ? window.location.origin
  : 'http://localhost:3001';

console.log('[Socket] Connecting to:', url);

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(url, {
  transports: ['websocket', 'polling'],
  autoConnect: true,
});

export const getSocket = () => socket;

let listenersAttached = false;

export function useSocket() {
  const store = useGameStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (listenersAttached) return;
    listenersAttached = true;

    socket.on('connect', () => {
      console.log('Socket connected successfully:', socket.id);
      store.setConnected(true);
      socket.emit('listRooms');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      store.setConnected(false);
    });

    socket.on('connected', (data) => {
      console.log('Player ID assigned:', data.playerId);
      store.setPlayerId(data.playerId);
    });

    socket.on('error', (data) => {
      store.addNotification(data.message, 'warning');
    });

    socket.on('roomCreated', (room) => {
      store.setRoom(room);
      navigate(`/lobby/${room.id}`);
    });

    socket.on('roomJoined', (room) => {
      store.setRoom(room);
      navigate(`/lobby/${room.id}`);
    });

    socket.on('roomUpdated', (room) => {
      store.updateRoom(room);
    });

    socket.on('playerJoined', (player) => {
      store.addNotification(`${player.username} joined the room`, 'info');
      const currentRoom = useGameStore.getState().room;
      if (currentRoom) {
        store.updateRoom({ ...currentRoom, players: [...currentRoom.players, player] });
      }
    });

    socket.on('playerLeft', ({ playerId, newHostId }) => {
      const currentRoom = useGameStore.getState().room;
      if (currentRoom) {
        const player = currentRoom.players.find(p => p.id === playerId);
        if (player) {
          store.addNotification(`${player.username} left the room`, 'info');
        }
        
        let newPlayers = currentRoom.players.filter(p => p.id !== playerId);
        if (newHostId) {
          newPlayers = newPlayers.map(p => p.id === newHostId ? { ...p, isHost: true } : p);
        }
        
        store.updateRoom({ ...currentRoom, players: newPlayers });
      }
    });

    socket.on('roomList', (rooms) => {
      store.setRoomList(rooms);
    });

    socket.on('gameStarted', (game) => {
      console.log('[CLIENT] gameStarted received, phase:', game.phase, 'drawerId:', game.currentDrawerId);
      store.setGame(game);
      store.setPhase(game.phase);
      if (game.currentDrawerId) {
        store.setCurrentDrawer(game.currentDrawerId);
      }
      store.setScores(game.scores);
      const currentRoom = useGameStore.getState().room;
      if (currentRoom) {
        console.log('[CLIENT] Navigating to /game/' + currentRoom.id);
        navigate(`/game/${currentRoom.id}`);
      }
    });

    socket.on('pickWord', (choices) => {
      console.log('[CLIENT] pickWord received with choices:', choices);
      store.setWordChoices(choices);
      store.setPhase('picking_word' as any);
      const myId = useGameStore.getState().playerId;
      console.log('[CLIENT] Setting drawer to myId:', myId);
      if (myId) {
        store.setCurrentDrawer(myId);
      }
    });

    socket.on('turnStarted', (data) => {
      store.setCurrentDrawer(data.drawerId);
      store.setWordHint(data.wordHint);
      if (data.word) {
        store.setCurrentWord(data.word);
      } else {
        store.setCurrentWord(null);
      }
      store.setTimeLeft(Math.floor((data.turnEndTime - Date.now()) / 1000));
      store.setPhase('drawing' as any);
      store.setWordChoices(null);
      store.setCountdownInfo(null);
      store.clearStrokes();
      store.setTurnScores(null);
    });

    socket.on('wordHintUpdated', (data) => {
      store.setWordHint(data.wordHint);
    });

    socket.on('turnEnded', (data) => {
      store.setTurnScores(data.scores);
      store.setPhase('round_end' as any);
      store.setWordHint(data.word);
      store.setCurrentWord(null);
    });

    socket.on('roundEnded', (summary) => {
      store.setRoundSummary(summary);
    });

    socket.on('roundCountdown', (data) => {
      store.setCountdownInfo(data);
    });

    socket.on('gameEnded', (data) => {
      store.setFinalResult(data);
      store.setPhase('game_end' as any);
      store.setCountdownInfo(null);
    });

    socket.on('timerUpdate', (data) => {
      store.setTimeLeft(data.timeLeft);
    });

    socket.on('strokeReceived', (stroke) => {
      store.addStroke(stroke);
    });

    socket.on('strokeUndone', (data) => {
      store.removeLastStroke(data.playerId);
    });

    socket.on('canvasCleared', () => {
      store.clearStrokes();
    });

    socket.on('chatMessageReceived', (message) => {
      store.addMessage(message);
    });

    socket.on('correctGuess', (data) => {
      store.addNotification(`${data.playerName} guessed the word!`, 'success');
      const currentScores = useGameStore.getState().scores;
      if (currentScores) {
        store.setScores({ ...currentScores, [data.playerId]: (currentScores[data.playerId] || 0) + data.pointsEarned });
      }
    });

    socket.on('notification', (data) => {
      store.addNotification(data.message, data.type);
    });

    // Check if already connected at mount time
    if (socket.connected) {
      store.setConnected(true);
      socket.emit('listRooms');
    }
  }, [store, navigate]);

  return socket;
}
