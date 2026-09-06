import { Server, Socket } from 'socket.io';
import { RoomManager } from '../managers/RoomManager.js';
import { ClientToServerEvents, ServerToClientEvents, GuessResult } from '../types.js';

export function registerHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  roomManager: RoomManager,
  playerId: string
) {
  
  socket.on('createRoom', ({ username, roomName }) => {
    try {
      const room = roomManager.createRoom(playerId, username, roomName);
      socket.join(room.id);
      socket.emit('roomCreated', room);
    } catch (err: any) {
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('joinRoom', ({ username, roomId }) => {
    try {
      const room = roomManager.joinRoom(playerId, username, roomId);
      if (room) {
        socket.join(roomId);
        socket.emit('roomJoined', room);
        
        const player = room.players.find(p => p.id === playerId);
        if (player) {
          socket.to(roomId).emit('playerJoined', player);
        }
      } else {
        socket.emit('error', { message: 'Room not found' });
      }
    } catch (err: any) {
      socket.emit('error', { message: err.message });
    }
  });

  const handleDisconnect = () => {
    try {
      const res = roomManager.leaveRoom(playerId);
      if (res.room && !res.isDeleted) {
        socket.leave(res.room.id);
        socket.to(res.room.id).emit('playerLeft', { 
          playerId, 
          newHostId: res.newHostId 
        });
      }
    } catch (err) {
      console.error('Error leaving room', err);
    }
  };

  socket.on('leaveRoom', handleDisconnect);
  socket.on('disconnect', handleDisconnect);

  socket.on('listRooms', () => {
    socket.emit('roomList', roomManager.listRooms());
  });

  socket.on('startGame', () => {
    try {
      const game = roomManager.startGame(playerId);
      const room = roomManager.getRoom(game.roomId);
      if (room) {
        io.to(game.roomId).emit('gameStarted', game);
        // Delay startNextTurn to give clients time to navigate to game page
        setTimeout(() => {
          roomManager.startNextTurn(game.roomId);
        }, 1000);
      }
    } catch (err: any) {
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('selectWord', ({ word }) => {
    try {
      roomManager.selectWord(playerId, word);
    } catch (err: any) {
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('submitGuess', ({ text }) => {
    try {
      const { result, pointsEarned, message } = roomManager.submitGuess(playerId, text);
      const player = roomManager.getPlayerBySocketId(playerId);
      const roomId = roomManager.getPlayerRoomId(playerId);
      
      if (roomId && player) {
        if (result === GuessResult.CORRECT) {
          io.to(roomId).emit('chatMessageReceived', {
            id: Math.random().toString(36).substr(2, 9),
            playerId,
            playerName: player.username,
            text: 'guessed the word!',
            type: 'system',
            timestamp: Date.now()
          });
          io.to(roomId).emit('correctGuess', {
            playerId,
            playerName: player.username,
            pointsEarned
          });
        } else {
          // Broadcast wrong/close guess to room
          io.to(roomId).emit('chatMessageReceived', {
            id: Math.random().toString(36).substr(2, 9),
            playerId,
            playerName: player.username,
            text: message,
            type: 'guess',
            guessResult: result,
            timestamp: Date.now()
          });
        }
      }
    } catch (err: any) {
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('chatMessage', ({ text }) => {
    const player = roomManager.getPlayerBySocketId(playerId);
    const roomId = roomManager.getPlayerRoomId(playerId);
    if (roomId && player) {
      io.to(roomId).emit('chatMessageReceived', {
        id: Math.random().toString(36).substr(2, 9),
        playerId,
        playerName: player.username,
        text,
        type: 'chat',
        timestamp: Date.now()
      });
    }
  });

  socket.on('sendStroke', (stroke) => {
    const roomId = roomManager.getPlayerRoomId(playerId);
    if (roomId) {
      socket.to(roomId).emit('strokeReceived', stroke);
    }
  });

  socket.on('undoStroke', () => {
    const roomId = roomManager.getPlayerRoomId(playerId);
    if (roomId) {
      socket.to(roomId).emit('strokeUndone', { playerId });
    }
  });

  socket.on('clearCanvas', () => {
    const roomId = roomManager.getPlayerRoomId(playerId);
    if (roomId) {
      socket.to(roomId).emit('canvasCleared');
    }
  });
}
