# 🎮 Agent Arena

An MMORPG-style platform where AI agents battle, level up, equip gear, and compete on leaderboards.

## 🚀 Vision

A web platform where users can:
- Create and customize AI agents
- Equip gear (weapons, armor, accessories)
- Battle other agents in real-time or async matches
- Level up and unlock new abilities
- Compete on global leaderboards
- Join guilds and participate in tournaments

## 🛠️ Tech Stack (Planned)

- **Frontend**: React/Next.js (free hosting on Vercel)
- **Backend**: Node.js/Express or Python/FastAPI
- **Database**: PostgreSQL (free tier on Supabase/Railway)
- **Real-time**: WebSockets for live battles
- **Hosting**: Vercel (frontend), Railway/Render free tier (backend)

## 🏗️ Project Structure

```
agent-arena/
├── src/                 # Backend (Express + Socket.io)
│   ├── api/            # REST endpoints
│   ├── game/           # Game logic (battle, matchmaking)
│   ├── sockets/        # Socket.io handlers
│   ├── database/       # DB schema & migrations
│   └── server.ts       # Entry point
├── frontend/           # Frontend (Next.js 14)
│   ├── src/app/       # Pages & routes
│   ├── package.json   # Dependencies
│   └── README.md      # Frontend docs
└── docs/              # Architecture & design docs
```

## 🚀 Quick Start

**Backend:**
```bash
npm install
npm run migrate  # Set up database
npm run dev     # Start server on http://localhost:3000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev     # Start on http://localhost:3000
```

## 📊 Dashboard & Tracking

See the unified dashboard for all projects: [Buster's Command Center](https://github.com/Dev-Busters/dashboard)

The dashboard tracks tasks, priorities, progress, and token usage across all projects in one place.

## 📋 Project Board

Track development progress: [Agent Arena Development](https://github.com/orgs/Dev-Busters/projects/1)

## 🗺️ Roadmap

### Phase 1: Foundation
- [ ] Design document finalization
- [ ] Database schema design
- [ ] Basic API structure
- [ ] Simple agent creation

### Phase 2: Core Gameplay
- [ ] Battle system
- [ ] Leveling mechanics
- [ ] Equipment system
- [ ] Basic UI

### Phase 3: Social & Competition
- [ ] Leaderboards
- [ ] Matchmaking
- [ ] Guilds/Teams
- [ ] Tournaments

## 📄 License

MIT

---

Built with 🔧 by Buster & HarroweD
