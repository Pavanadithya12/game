import { create } from 'zustand';
import {
  Room,
  RoomListItem,
  Game,
  GamePhase,
  Stroke,
  Tool,
  ChatMessage,
  TurnScore,
  RoundSummary
} from '../types';

interface NotificationData {
  id: string;
  message: string;
  type: string;
}

export interface GameState {
  // Connection
  playerId: string | null;
  username: string;
  isConnected: boolean;
  
  // Room
  room: Room | null;
  roomList: RoomListItem[];
  
  // Game
  game: Game | null;
  phase: GamePhase;
  currentDrawerId: string | null;
  wordHint: string;
  currentWord: string | null;
  timeLeft: number;
  wordChoices: any[] | null;
  
  // Drawing
  strokes: Stroke[];
  currentTool: Tool;
  currentColor: string;
  brushSize: number;
  
  // Chat
  messages: ChatMessage[];
  
  // Scores
  scores: Record<string, number>;
  turnScores: TurnScore[] | null;
  roundSummary: RoundSummary | null;
  countdownInfo: { secondsLeft: number; message: string } | null;
  finalResult: { finalScores: Record<string, number>; winner: { id: string; name: string; score: number } } | null;
  
  // Notifications  
  notifications: NotificationData[];
  
  // Actions
  setPlayerId: (id: string) => void;
  setUsername: (name: string) => void;
  setConnected: (connected: boolean) => void;
  setRoom: (room: Room | null) => void;
  setRoomList: (rooms: RoomListItem[]) => void;
  updateRoom: (room: Room) => void;
  setCountdownInfo: (info: { secondsLeft: number; message: string } | null) => void;
  setGame: (game: Game | null) => void;
  setPhase: (phase: GamePhase) => void;
  setCurrentDrawer: (id: string | null) => void;
  setWordHint: (hint: string) => void;
  setCurrentWord: (word: string | null) => void;
  setTimeLeft: (time: number) => void;
  setWordChoices: (choices: any[] | null) => void;
  addStroke: (stroke: Stroke) => void;
  removeLastStroke: (playerId: string) => void;
  clearStrokes: () => void;
  setTool: (tool: Tool) => void;
  setColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  addMessage: (message: ChatMessage) => void;
  setScores: (scores: Record<string, number>) => void;
  setTurnScores: (scores: TurnScore[] | null) => void;
  setRoundSummary: (summary: RoundSummary | null) => void;
  setFinalResult: (result: any) => void;
  addNotification: (message: string, type: string) => void;
  removeNotification: (id: string) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  playerId: null,
  username: localStorage.getItem('mawabro_username') || '',
  isConnected: false,
  
  room: null,
  roomList: [],
  
  game: null,
  phase: GamePhase.WAITING,
  currentDrawerId: null,
  wordHint: '',
  currentWord: null,
  timeLeft: 0,
  wordChoices: null,
  
  strokes: [],
  currentTool: Tool.PENCIL,
  currentColor: '#000000',
  brushSize: 8,
  
  messages: [],
  
  scores: {},
  turnScores: null,
  roundSummary: null,
  countdownInfo: null,
  finalResult: null,
  
  notifications: [],
  
  setPlayerId: (id) => set({ playerId: id }),
  setUsername: (name) => {
    localStorage.setItem('mawabro_username', name);
    set({ username: name });
  },
  setConnected: (connected) => set({ isConnected: connected }),
  
  setRoom: (room) => set({ room }),
  setRoomList: (rooms) => set({ roomList: rooms }),
  updateRoom: (room) => set({ room }),
  setCountdownInfo: (countdownInfo) => set({ countdownInfo }),
  
  setGame: (game) => set({ game }),
  setPhase: (phase) => set({ phase }),
  setCurrentDrawer: (id) => set({ currentDrawerId: id }),
  setWordHint: (hint) => set({ wordHint: hint }),
  setCurrentWord: (word) => set({ currentWord: word }),
  setTimeLeft: (time) => set({ timeLeft: time }),
  setWordChoices: (choices) => set({ wordChoices: choices }),
  
  addStroke: (stroke) => set((state) => ({ strokes: [...state.strokes, stroke] })),
  removeLastStroke: (playerId) => set((state) => {
    const userStrokes = state.strokes.filter(s => s.playerId === playerId);
    if (userStrokes.length === 0) return state;
    const strokeToRemove = userStrokes[userStrokes.length - 1];
    return { strokes: state.strokes.filter(s => s.id !== strokeToRemove.id) };
  }),
  clearStrokes: () => set({ strokes: [] }),
  setTool: (tool) => set({ currentTool: tool }),
  setColor: (color) => set({ currentColor: color }),
  setBrushSize: (size) => set({ brushSize: size }),
  
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  
  setScores: (scores) => set({ scores }),
  setTurnScores: (turnScores) => set({ turnScores }),
  setRoundSummary: (roundSummary) => set({ roundSummary }),
  setFinalResult: (finalResult) => set({ finalResult }),
  
  addNotification: (message, type) => set((state) => {
    const id = Math.random().toString(36).substring(7);
    return { notifications: [...state.notifications, { id, message, type }] };
  }),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
  
  resetGame: () => set({
    game: null,
    phase: GamePhase.WAITING,
    currentDrawerId: null,
    wordHint: '',
    timeLeft: 0,
    wordChoices: null,
    strokes: [],
    messages: [],
    scores: {},
    turnScores: null,
    roundSummary: null,
    countdownInfo: null,
    finalResult: null,
  })
}));
