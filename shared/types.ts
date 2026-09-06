// ========================
// MawaBro — Shared Types
// ========================

// --- Enums ---

export enum GamePhase {
  WAITING = 'waiting',
  PICKING_WORD = 'picking_word',
  DRAWING = 'drawing',
  ROUND_END = 'round_end',
  GAME_END = 'game_end',
}

export enum RoomStatus {
  LOBBY = 'lobby',
  PLAYING = 'playing',
  FINISHED = 'finished',
}

export enum GuessResult {
  CORRECT = 'correct',
  CLOSE = 'close',
  WRONG = 'wrong',
}

export enum Tool {
  PENCIL = 'pencil',
  ERASER = 'eraser',
}

// --- Entities ---

export interface User {
  id: string;
  username: string;
  avatarColor: string;
  isHost: boolean;
  score: number;
  isConnected: boolean;
}

export interface RoomSettings {
  maxPlayers?: number;
  totalRounds?: number;
  turnDuration?: number; // seconds: 60, 70, 80, 90, etc.
  maxClues?: number; // number of clues/hints: 3, 4, 5, 6
  selectedCategories?: string[];
  customWords?: string[];
  onlyCustomWords?: boolean;
}

export interface Room {
  id: string;
  name: string;
  hostId: string;
  status: RoomStatus;
  maxPlayers: number;
  totalRounds: number;
  turnDuration: number; // seconds
  maxClues?: number; // number of clues/hints: 3, 4, 5, 6
  selectedCategories?: string[];
  customWords?: string[];
  onlyCustomWords?: boolean;
  players: User[];
  createdAt: string;
}

export interface Game {
  id: string;
  roomId: string;
  currentRound: number;
  totalRounds: number;
  phase: GamePhase;
  currentDrawerId: string | null;
  currentWord: string | null; // only sent to drawer
  wordHint: string; // e.g. "_ _ _ _ _" sent to guessers
  turnEndTime: number | null; // timestamp
  drawOrder: string[]; // player IDs in drawing order
  drawOrderIndex: number;
  scores: Record<string, number>;
}

export interface Round {
  roundNumber: number;
  drawerId: string;
  word: string;
  guesses: Guess[];
  startedAt: string;
  endedAt?: string;
}

export interface Guess {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  result: GuessResult;
  timestamp: number;
}

export interface Word {
  id: number;
  word: string;
  category: string;
  difficulty: number; // 1=easy, 2=medium, 3=hard
}

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  playerId: string;
  tool: Tool;
  color: string;
  brushSize: number;
  points: Point[];
}

export interface StrokeSegment {
  strokeId: string;
  playerId: string;
  tool: Tool;
  color: string;
  brushSize: number;
  from: Point;
  to: Point;
}

// --- Chat ---

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
  type: 'chat' | 'guess' | 'system';
  guessResult?: GuessResult;
  timestamp: number;
}

// --- Room List ---

export interface RoomListItem {
  id: string;
  name: string;
  hostName: string;
  playerCount: number;
  maxPlayers: number;
  status: RoomStatus;
}

// --- Word Selection ---

export interface WordChoice {
  word: string;
  category: string;
  difficulty: number;
}

// --- Score Summary ---

export interface TurnScore {
  playerId: string;
  playerName: string;
  pointsEarned: number;
  guessTimeMs?: number;
}

export interface RoundSummary {
  roundNumber: number;
  word: string;
  drawerId: string;
  drawerName: string;
  scores: TurnScore[];
}

// --- Socket.IO Event Maps ---

export interface ClientToServerEvents {
  // Room & Settings
  createRoom: (data: { username: string; roomName: string }) => void;
  joinRoom: (data: { username: string; roomId: string }) => void;
  leaveRoom: () => void;
  listRooms: () => void;
  updateRoomSettings: (settings: RoomSettings) => void;

  // Game
  startGame: () => void;
  selectWord: (data: { word: string }) => void;

  // Drawing
  sendStroke: (stroke: Stroke) => void;
  sendStrokeSegment: (segment: StrokeSegment) => void;
  undoStroke: () => void;
  clearCanvas: () => void;

  // Guessing & Chat
  submitGuess: (data: { text: string }) => void;
  chatMessage: (data: { text: string }) => void;
}

export interface ServerToClientEvents {
  // Connection
  connected: (data: { playerId: string }) => void;
  error: (data: { message: string }) => void;

  // Room
  roomCreated: (room: Room) => void;
  roomJoined: (room: Room) => void;
  roomUpdated: (room: Room) => void;
  playerJoined: (player: User) => void;
  playerLeft: (data: { playerId: string; newHostId?: string }) => void;
  roomList: (rooms: RoomListItem[]) => void;

  // Game Flow
  gameStarted: (game: Game) => void;
  pickWord: (choices: WordChoice[]) => void;
  turnStarted: (data: {
    drawerId: string;
    drawerName: string;
    wordHint: string;
    word?: string; // sent to drawer so they know what to draw
    turnEndTime: number;
    roundNumber: number;
  }) => void;
  wordHintUpdated: (data: { wordHint: string }) => void;
  turnEnded: (data: {
    word: string;
    scores: TurnScore[];
  }) => void;
  roundEnded: (summary: RoundSummary) => void;
  roundCountdown: (data: { secondsLeft: number; message: string }) => void;
  gameEnded: (data: {
    finalScores: Record<string, number>;
    winner: { id: string; name: string; score: number };
  }) => void;
  timerUpdate: (data: { timeLeft: number }) => void;

  // Drawing
  strokeReceived: (stroke: Stroke) => void;
  strokeSegmentReceived: (segment: StrokeSegment) => void;
  strokeUndone: (data: { playerId: string }) => void;
  canvasCleared: () => void;

  // Chat & Guessing
  chatMessageReceived: (message: ChatMessage) => void;
  correctGuess: (data: {
    playerId: string;
    playerName: string;
    pointsEarned: number;
  }) => void;

  // Notifications
  notification: (data: { message: string; type: 'info' | 'success' | 'warning' }) => void;
}
