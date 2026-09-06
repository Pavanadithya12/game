import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/pool.js';
import {
  Room, RoomStatus, Game, GamePhase, User, GuessResult,
  TurnScore, RoomListItem, WordChoice, ClientToServerEvents, ServerToClientEvents, RoundSummary
} from '../types.js';
import { WORDS_DATASET } from '../db/wordsDataset.js';

interface RoomState {
  room: Room;
  game?: Game;
  turnTimer?: NodeJS.Timeout;
  countdownTimer?: NodeJS.Timeout;
  guessedCorrectly: Set<string>; // playerIds who guessed correctly in current turn
}

const COLORS = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF3', '#FF33A8', '#FF8C33', '#8C33FF'];

export class RoomManager {
  private rooms = new Map<string, RoomState>();
  private playerToRoom = new Map<string, string>();
  private io: Server<ClientToServerEvents, ServerToClientEvents>;

  constructor(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;
  }

  public getPlayerRoomId(socketId: string): string | undefined {
    return this.playerToRoom.get(socketId);
  }

  public getPlayerBySocketId(socketId: string): User | undefined {
    const roomId = this.playerToRoom.get(socketId);
    if (!roomId) return undefined;
    const roomState = this.rooms.get(roomId);
    if (!roomState) return undefined;
    return roomState.room.players.find(p => p.id === socketId);
  }

  public getRoom(roomId: string): RoomState | undefined {
    return this.rooms.get(roomId);
  }

  public listRooms(): RoomListItem[] {
    const list: RoomListItem[] = [];
    for (const [id, state] of this.rooms.entries()) {
      const host = state.room.players.find(p => p.id === state.room.hostId);
      list.push({
        id,
        name: state.room.name,
        hostName: host?.username || 'Unknown',
        playerCount: state.room.players.length,
        maxPlayers: state.room.maxPlayers,
        status: state.room.status
      });
    }
    return list;
  }

  public createRoom(socketId: string, username: string, roomName: string): Room {
    const roomId = uuidv4().substring(0, 8);
    const host: User = {
      id: socketId,
      username,
      avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)],
      isHost: true,
      score: 0,
      isConnected: true
    };

    const room: Room = {
      id: roomId,
      name: roomName,
      hostId: socketId,
      status: RoomStatus.LOBBY,
      maxPlayers: 8,
      totalRounds: 3,
      turnDuration: 60,
      players: [host],
      createdAt: new Date().toISOString()
    };

    this.rooms.set(roomId, { room, guessedCorrectly: new Set() });
    this.playerToRoom.set(socketId, roomId);

    // Save to DB
    pool.query(
      `INSERT INTO rooms (id, name, host_id, max_players, total_rounds, turn_duration) VALUES ($1, $2, $3, $4, $5, $6)`,
      [roomId, roomName, socketId, room.maxPlayers, room.totalRounds, room.turnDuration]
    ).catch(console.error);

    return room;
  }

  public joinRoom(socketId: string, username: string, roomId: string): Room | null {
    const state = this.rooms.get(roomId);
    if (!state) return null;
    
    if (state.room.players.length >= state.room.maxPlayers) {
      throw new Error('Room is full');
    }

    const player: User = {
      id: socketId,
      username,
      avatarColor: COLORS[Math.floor(Math.random() * COLORS.length)],
      isHost: false,
      score: 0,
      isConnected: true
    };

    state.room.players.push(player);
    this.playerToRoom.set(socketId, roomId);
    
    return state.room;
  }

  public leaveRoom(socketId: string): { room?: Room, player?: User, newHostId?: string, isDeleted: boolean } {
    const roomId = this.playerToRoom.get(socketId);
    if (!roomId) return { isDeleted: false };

    const state = this.rooms.get(roomId);
    if (!state) return { isDeleted: false };

    const playerIdx = state.room.players.findIndex(p => p.id === socketId);
    if (playerIdx === -1) return { isDeleted: false };

    const [player] = state.room.players.splice(playerIdx, 1);
    this.playerToRoom.delete(socketId);
    
    let newHostId: string | undefined;

    if (state.room.players.length === 0) {
      this.clearTimers(roomId);
      this.rooms.delete(roomId);
      return { room: state.room, player, isDeleted: true };
    } else {
      if (player.isHost) {
        state.room.players[0].isHost = true;
        state.room.hostId = state.room.players[0].id;
        newHostId = state.room.hostId;
      }
      return { room: state.room, player, newHostId, isDeleted: false };
    }
  }

  public startGame(socketId: string): Game {
    const roomId = this.playerToRoom.get(socketId);
    if (!roomId) throw new Error('Not in a room');
    
    const state = this.rooms.get(roomId);
    if (!state) throw new Error('Room not found');
    
    if (state.room.hostId !== socketId) throw new Error('Only host can start the game');
    if (state.room.players.length < 2) throw new Error('Need at least 2 players');

    state.room.status = RoomStatus.PLAYING;
    const drawOrder = [...state.room.players.map(p => p.id)];
    // Shuffle draw order
    for (let i = drawOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [drawOrder[i], drawOrder[j]] = [drawOrder[j], drawOrder[i]];
    }

    const gameId = uuidv4();
    const game: Game = {
      id: gameId,
      roomId,
      currentRound: 1,
      totalRounds: state.room.totalRounds,
      phase: GamePhase.WAITING,
      currentDrawerId: null,
      currentWord: null,
      wordHint: '',
      turnEndTime: null,
      drawOrder,
      drawOrderIndex: 0,
      scores: {}
    };
    for (const p of state.room.players) {
      game.scores[p.id] = 0;
      p.score = 0;
    }

    state.game = game;
    
    // Save to DB
    pool.query(
      `INSERT INTO games (id, room_id, current_round, phase, draw_order, draw_order_index) VALUES ($1, $2, $3, $4, $5, $6)`,
      [game.id, roomId, game.currentRound, game.phase, JSON.stringify(drawOrder), game.drawOrderIndex]
    ).catch(console.error);

    return game;
  }

  public async getRandomWords(count = 3): Promise<WordChoice[]> {
    try {
      const res = await pool.query('SELECT word, category, difficulty FROM words ORDER BY RANDOM() LIMIT $1', [count]);
      if (res.rows && res.rows.length >= count) {
        return res.rows;
      }
    } catch (err) {
      // Use in-memory curated dataset
    }

    const easy = WORDS_DATASET.filter(w => w.difficulty === 1);
    const med = WORDS_DATASET.filter(w => w.difficulty === 2);
    const hard = WORDS_DATASET.filter(w => w.difficulty === 3);

    const pickRandom = (arr: WordChoice[]) => arr[Math.floor(Math.random() * arr.length)];

    const choices: WordChoice[] = [
      pickRandom(easy),
      pickRandom(med),
      pickRandom(hard.length > 0 ? hard : med)
    ];

    return choices;
  }

  public async startNextTurn(roomId: string) {
    const state = this.rooms.get(roomId);
    if (!state || !state.game) return;
    
    this.clearTimers(roomId);
    state.guessedCorrectly.clear();
    const game = state.game;
    
    let drawerId = game.drawOrder[game.drawOrderIndex];
    // Check if player is still connected, if not, skip
    let loops = 0;
    while (!state.room.players.find(p => p.id === drawerId) && loops < game.drawOrder.length) {
      game.drawOrderIndex++;
      if (game.drawOrderIndex >= game.drawOrder.length) {
        game.drawOrderIndex = 0;
        game.currentRound++;
      }
      drawerId = game.drawOrder[game.drawOrderIndex];
      loops++;
    }

    if (game.currentRound > game.totalRounds) {
      this.endGame(roomId);
      return;
    }

    game.currentDrawerId = drawerId;
    game.phase = GamePhase.PICKING_WORD;
    game.currentWord = null;
    // Broadcast the updated game state (phase change to PICKING_WORD)
    this.io.to(roomId).emit('gameStarted', { ...game });

    // Fetch and send word choices to drawer immediately
    const words = await this.getRandomWords(3);
    console.log(`[pickWord] Sending ${words.length} words to drawer ${drawerId}:`, words.map(w => w.word));
    this.io.to(drawerId).emit('pickWord', words);

    // Auto-pick fallback after 15 seconds if drawer doesn't choose
    state.turnTimer = setTimeout(() => {
      if (state.game && state.game.phase === GamePhase.PICKING_WORD && state.game.currentDrawerId === drawerId) {
        console.log(`[auto-pick] Drawer ${drawerId} idle, auto-picking "${words[0].word}"`);
        try {
          this.selectWord(drawerId, words[0].word);
        } catch (err) {
          console.error('[auto-pick error]', err);
        }
      }
    }, 15000);
  }

  public selectWord(socketId: string, word: string) {
    const roomId = this.playerToRoom.get(socketId);
    if (!roomId) throw new Error('Not in a room');
    
    const state = this.rooms.get(roomId);
    if (!state || !state.game) throw new Error('No active game');
    
    const game = state.game;
    if (game.currentDrawerId !== socketId) throw new Error('Not your turn');

    // If word is already selected (duplicate click or network retry), ignore smoothly
    if (game.phase === GamePhase.DRAWING && game.currentWord) {
      console.log(`[selectWord] Redundant selectWord ignored for ${socketId}`);
      return;
    }

    if (game.phase !== GamePhase.PICKING_WORD) throw new Error('Invalid phase');

    // Clear any active picker timer
    this.clearTimers(roomId);

    game.currentWord = word;
    game.wordHint = word.replace(/[a-zA-Z0-9]/g, '_');
    game.phase = GamePhase.DRAWING;
    game.turnEndTime = Date.now() + (state.room.turnDuration * 1000);

    const drawerName = state.room.players.find(p => p.id === socketId)?.username || 'Unknown';

    this.io.to(roomId).emit('turnStarted', {
      drawerId: socketId,
      drawerName,
      wordHint: game.wordHint,
      turnEndTime: game.turnEndTime,
      roundNumber: game.currentRound
    });

    this.setupTimers(roomId);
  }

  private setupTimers(roomId: string) {
    const state = this.rooms.get(roomId);
    if (!state || !state.game) return;
    const game = state.game;
    if (!game.turnEndTime) return;
    
    const durationLeft = game.turnEndTime - Date.now();
    const durationSec = Math.floor(durationLeft / 1000);

    state.turnTimer = setTimeout(() => {
      this.endTurn(roomId);
    }, durationLeft);

    let secLeft = durationSec;
    state.countdownTimer = setInterval(() => {
      secLeft--;
      this.io.to(roomId).emit('timerUpdate', { timeLeft: secLeft });
      
      // Hint logic
      if (game.currentWord) {
        if (secLeft === Math.floor(state.room.turnDuration / 2)) {
          this.revealLetter(game);
          this.io.to(roomId).emit('wordHintUpdated', { wordHint: game.wordHint });
        } else if (secLeft === Math.floor(state.room.turnDuration / 4)) {
          this.revealLetter(game);
          this.io.to(roomId).emit('wordHintUpdated', { wordHint: game.wordHint });
        }
      }
      
      if (secLeft <= 0 && state.countdownTimer) {
        clearInterval(state.countdownTimer);
      }
    }, 1000);
  }

  private revealLetter(game: Game) {
    if (!game.currentWord) return;
    const hiddenIndices = [];
    for (let i = 0; i < game.wordHint.length; i++) {
      if (game.wordHint[i] === '_') hiddenIndices.push(i);
    }
    if (hiddenIndices.length === 0) return;
    const idx = hiddenIndices[Math.floor(Math.random() * hiddenIndices.length)];
    const arr = game.wordHint.split('');
    arr[idx] = game.currentWord[idx];
    game.wordHint = arr.join('');
  }

  private clearTimers(roomId: string) {
    const state = this.rooms.get(roomId);
    if (state) {
      if (state.turnTimer) clearTimeout(state.turnTimer);
      if (state.countdownTimer) clearInterval(state.countdownTimer);
      state.turnTimer = undefined;
      state.countdownTimer = undefined;
    }
  }

  public submitGuess(socketId: string, text: string): { result: GuessResult, pointsEarned: number, message: string } {
    const roomId = this.playerToRoom.get(socketId);
    if (!roomId) throw new Error('Not in a room');
    
    const state = this.rooms.get(roomId);
    if (!state || !state.game) throw new Error('No active game');
    
    const game = state.game;
    if (game.phase !== GamePhase.DRAWING) throw new Error('Not drawing phase');
    if (game.currentDrawerId === socketId) throw new Error('Drawer cannot guess');
    if (state.guessedCorrectly.has(socketId)) return { result: GuessResult.WRONG, pointsEarned: 0, message: '' }; // Already guessed

    const word = game.currentWord || '';
    const normalizedGuess = text.trim().toLowerCase();
    const normalizedWord = word.trim().toLowerCase();

    let result = GuessResult.WRONG;
    let pointsEarned = 0;

    if (normalizedGuess === normalizedWord) {
      result = GuessResult.CORRECT;
      const timeLeft = game.turnEndTime ? Math.max(0, game.turnEndTime - Date.now()) : 0;
      const maxPoints = 500;
      pointsEarned = Math.max(100, Math.round(maxPoints * ((timeLeft / 1000) / state.room.turnDuration)));
      state.guessedCorrectly.add(socketId);
      
      game.scores[socketId] = (game.scores[socketId] || 0) + pointsEarned;
      const player = state.room.players.find(p => p.id === socketId);
      if (player) player.score = game.scores[socketId];

      // Check if all guessers got it
      const guessers = state.room.players.filter(p => p.id !== game.currentDrawerId);
      if (state.guessedCorrectly.size === guessers.length && guessers.length > 0) {
        // End turn early
        this.clearTimers(roomId);
        setTimeout(() => this.endTurn(roomId), 1000); // end after 1 sec
      }
    } else {
      // Check for close guess (Levenshtein or simple include)
      if (normalizedGuess.length >= 3 && (normalizedWord.includes(normalizedGuess) || normalizedGuess.includes(normalizedWord))) {
        result = GuessResult.CLOSE;
      }
    }

    return { result, pointsEarned, message: text };
  }

  public endTurn(roomId: string) {
    const state = this.rooms.get(roomId);
    if (!state || !state.game) return;
    const game = state.game;

    this.clearTimers(roomId);
    game.phase = GamePhase.ROUND_END;
    
    // Calculate drawer points (avg of guessers)
    let totalGuesserPoints = 0;
    for (const p of state.room.players) {
      if (state.guessedCorrectly.has(p.id)) {
        totalGuesserPoints += 500; // rough approximation or we can track actual points per user in this turn
      }
    }
    // We should track actual turn points, let's just do a simple math based on set size for now since we added to global score.
    // Drawer gets points based on how many people guessed correctly
    let drawerPoints = 0;
    if (state.guessedCorrectly.size > 0 && game.currentDrawerId) {
       drawerPoints = Math.round((state.guessedCorrectly.size / (state.room.players.length - 1)) * 300);
       game.scores[game.currentDrawerId] = (game.scores[game.currentDrawerId] || 0) + drawerPoints;
       const drawer = state.room.players.find(p => p.id === game.currentDrawerId);
       if (drawer) drawer.score = game.scores[game.currentDrawerId];
    }

    const scores: TurnScore[] = state.room.players.map(p => {
      let earned = 0;
      if (p.id === game.currentDrawerId) earned = drawerPoints;
      // We don't have perfect per-turn guesser points stored, just an approximation for UI
      else if (state.guessedCorrectly.has(p.id)) earned = 200; // placeholder for UI
      return {
        playerId: p.id,
        playerName: p.username,
        pointsEarned: earned
      };
    });

    this.io.to(roomId).emit('turnEnded', {
      word: game.currentWord || '',
      scores
    });

    // Move to next player
    game.drawOrderIndex++;
    if (game.drawOrderIndex >= game.drawOrder.length) {
      // Round end
      const summary: RoundSummary = {
        roundNumber: game.currentRound,
        word: game.currentWord || '',
        drawerId: game.currentDrawerId || '',
        drawerName: state.room.players.find(p => p.id === game.currentDrawerId)?.username || '',
        scores
      };
      this.io.to(roomId).emit('roundEnded', summary);
      
      game.drawOrderIndex = 0;
      game.currentRound++;
    }

    setTimeout(() => {
      this.startNextTurn(roomId);
    }, 5000); // 5 sec break between turns
  }

  private endGame(roomId: string) {
    const state = this.rooms.get(roomId);
    if (!state || !state.game) return;
    const game = state.game;
    
    game.phase = GamePhase.GAME_END;
    state.room.status = RoomStatus.FINISHED;

    let winner = { id: '', name: '', score: -1 };
    for (const p of state.room.players) {
      if (p.score > winner.score) {
        winner = { id: p.id, name: p.username, score: p.score };
      }
    }

    this.io.to(roomId).emit('gameEnded', {
      finalScores: game.scores,
      winner
    });

    // Reset for next game maybe
    state.game = undefined;
  }
}
