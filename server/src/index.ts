import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

import { registerHandlers } from './socket/handlers.js';
import { RoomManager } from './managers/RoomManager.js';
import { ClientToServerEvents, ServerToClientEvents } from './types.js';
import { setupDb } from './db/setup.js';
import { seedDb } from './db/seedRunner.js';

// Load .env from mawabro root
dotenv.config({ path: join(process.cwd(), '..', '.env') });
dotenv.config({ path: join(process.cwd(), '.env') });

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve client static files
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const clientDistPath = join(__dirname, '..', '..', 'client', 'dist');
if (existsSync(clientDistPath)) {
  console.log(`Serving static files from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));
}

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager(io);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// List rooms endpoint
app.get('/api/rooms', (req, res) => {
  res.json(roomManager.listRooms());
});

io.on('connection', (socket) => {
  const playerId = uuidv4();
  socket.join(playerId);
  
  console.log(`[Server] Player connected: ${playerId} (socket: ${socket.id})`);
  socket.emit('connected', { playerId });

  registerHandlers(io, socket, roomManager, playerId);
});

// SPA catch-all - serve index.html for any non-API route (React Router support)
if (existsSync(clientDistPath)) {
  app.get('*', (req, res) => {
    res.sendFile(join(clientDistPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    console.log('Initializing database...');
    await setupDb();
    await seedDb();
    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Database initialization note (non-critical, game works without DB):', (err as Error).message || err);
  }

  httpServer.listen(PORT, () => {
    console.log(`\n🎨 MawaBro is running!`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Open in browser to play!\n`);
  });
}

startServer();
