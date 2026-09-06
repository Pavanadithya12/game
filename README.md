# 🎨 MawaBro — Multiplayer Drawing & Guessing Game

MawaBro is a real-time multiplayer drawing and guessing game where players take turns drawing words while others try to guess them. Think Pictionary meets the internet!

## 🎮 How to Play

1. **Create or Join a Room** — Enter your username and create a new room or join an existing one
2. **Wait in the Lobby** — Chat with other players while waiting for the host to start
3. **Draw!** — When it's your turn, pick a word and draw it on the canvas
4. **Guess!** — When someone else is drawing, type your guesses in the chat
5. **Score!** — Faster guesses earn more points. Highest score wins!

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Zustand |
| **Backend** | Node.js, Express, Socket.IO, TypeScript |
| **Database** | PostgreSQL 16 |
| **DevOps** | Docker, Docker Compose |

## 🚀 Quick Start (Docker)

The easiest way to run MawaBro:

```bash
cd mawabro
docker-compose up -d --build
```

Then open **http://localhost:5173** in multiple browser windows to play!

### Services:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001
- **PostgreSQL**: localhost:5432

## 🛠️ Development Setup (Without Docker)

### Prerequisites
- Node.js 20+
- PostgreSQL 16+

### 1. Install Dependencies

```bash
# Server
cd server && npm install

# Client
cd ../client && npm install
```

### 2. Setup Database

```bash
# Create the database
createdb mawabro

# Run migrations
cd server
npx tsx src/db/setup.ts

# Seed words
npx tsx src/db/seedRunner.ts
```

### 3. Start Development Servers

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

Open **http://localhost:5173** in your browser.

## 🎯 Game Rules

| Feature | Details |
|---------|---------|
| **Players** | 2–8 per room |
| **Rounds** | 3 rounds (configurable) |
| **Turn Timer** | 60 seconds per turn |
| **Word Selection** | Drawer picks 1 of 3 random words |
| **Scoring** | Faster guesses = more points (100–500) |
| **Hints** | Letters revealed at 50% and 25% time remaining |

## 📁 Project Structure

```
mawabro/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── pages/       # Route pages
│   │   └── stores/      # Zustand state management
│   └── Dockerfile
├── server/              # Node.js backend
│   ├── src/
│   │   ├── db/          # Database schema, seeds, connection
│   │   ├── managers/    # Game logic (RoomManager)
│   │   └── socket/      # Socket.IO event handlers
│   └── Dockerfile
├── shared/              # Shared TypeScript types
│   └── types.ts
├── docker-compose.yml
└── README.md
```

## 🎨 Features

- **Real-time Drawing** — Smooth HTML5 Canvas with pencil, eraser, colors, brush sizes
- **Live Multiplayer** — See drawings appear in real-time via WebSocket
- **Smart Scoring** — Speed-based points with bonus for drawers
- **Word Hints** — Progressive letter reveals keep the game exciting
- **Chat System** — Combined chat and guess input with color-coded feedback
- **Room Management** — Create, join, and manage game rooms
- **Dark Theme** — Beautiful dark UI designed for gaming sessions
- **300+ Words** — Across 8 categories for endless fun

## 📝 License

MIT
