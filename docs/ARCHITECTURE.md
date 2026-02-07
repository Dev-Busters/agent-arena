# Agent Arena - System Architecture

## Overview

Agent Arena is a multiplayer MMORPG where AI agents battle, level up, equip gear, and compete on leaderboards. This document outlines the technical architecture and design decisions.

## Tech Stack

### Frontend
- **Framework**: Next.js 14+ (React)
- **3D Rendering**: Three.js or Babylon.js
- **UI**: Shadcn/ui + Tailwind CSS
- **State Management**: Zustand
- **Real-time**: Socket.io client
- **Hosting**: Vercel (free tier)

### Backend
- **Runtime**: Node.js (Express.js)
- **Real-time**: Socket.io WebSockets
- **API**: REST + WebSockets
- **Language**: TypeScript
- **Hosting**: Railway or Render free tier

### Database & Storage
- **Primary DB**: PostgreSQL (Supabase)
- **Cache**: Redis (Railway)
- **File Storage**: Supabase Storage (1GB free)
- **Backups**: Automated via Supabase

### Security & DevOps
- **Auth**: JWT tokens with NextAuth.js
- **Rate Limiting**: express-rate-limit
- **Input Validation**: Zod schemas
- **Encryption**: bcrypt + TLS
- **DDoS Protection**: Cloudflare free tier
- **CI/CD**: GitHub Actions
- **Error Tracking**: Sentry free tier
- **CDN**: Vercel edge network

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│  Next.js + React + Three.js + Socket.io                         │
│  - Agent creation & management UI                               │
│  - Battle visualization                                         │
│  - Real-time leaderboard                                        │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP/WebSocket
                     │
┌────────────────────▼────────────────────────────────────────────┐
│              CLOUDFLARE CDN (Free Tier)                         │
│              DDoS Protection + Caching                          │
└────────────────────┬────────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                      BACKEND SERVER                             │
│  Express.js + TypeScript on Railway/Render                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌──────────────┐  ┌────────────────┐     │
│  │  REST API       │  │ Socket.io    │  │ Auth Middleware│     │
│  │  Routes         │  │ Game Logic   │  │ Rate Limiting  │     │
│  └────────┬────────┘  └──────┬───────┘  └────────────────┘     │
│           │                  │                                  │
│  ┌────────▼──────────────────▼────────────────────────┐         │
│  │  Game Engine & Logic                              │         │
│  │  - Battle system (turn-based calculation)         │         │
│  │  - Matchmaking algorithm                          │         │
│  │  - Leaderboard calculations                       │         │
│  │  - Progression & leveling                         │         │
│  └────────┬──────────────────┬──────────────────────┘         │
│           │                  │                                 │
│  ┌────────▼──────────┐  ┌──────▼──────────────┐               │
│  │ PostgreSQL Client │  │ Redis Client        │               │
│  └────────┬──────────┘  │ (Cache & Sessions)  │               │
│           │             └──────┬──────────────┘               │
└───────────┼────────────────────┼───────────────────────────────┘
            │                    │
┌───────────▼──────┐  ┌──────────▼──────────┐
│  SUPABASE        │  │  RAILWAY REDIS      │
│  PostgreSQL      │  │  Session Cache      │
│  - Users         │  │  - Active sessions  │
│  - Agents        │  │  - Leaderboard      │
│  - Battles       │  │  - Rate limits      │
│  - Items         │  └─────────────────────┘
│  - Leaderboard   │
└──────────────────┘
```

## Database Schema

### Core Tables

#### Users
```sql
users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  username VARCHAR(50) UNIQUE,
  password_hash VARCHAR(255),
  level INT DEFAULT 1,
  experience INT DEFAULT 0,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  gold INT DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  last_login TIMESTAMP
)
```

#### Agents
```sql
agents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(100),
  class ENUM ('warrior', 'mage', 'rogue', 'paladin'),
  level INT DEFAULT 1,
  experience INT DEFAULT 0,
  max_hp INT,
  current_hp INT,
  attack INT,
  defense INT,
  speed INT,
  accuracy INT,
  evasion INT,
  created_at TIMESTAMP
)
```

#### Battles
```sql
battles (
  id UUID PRIMARY KEY,
  agent1_id UUID REFERENCES agents(id),
  agent2_id UUID REFERENCES agents(id),
  winner_id UUID REFERENCES agents(id),
  battle_log TEXT,
  duration_ms INT,
  experience_awarded INT,
  gold_awarded INT,
  created_at TIMESTAMP,
  completed_at TIMESTAMP,
  status ENUM ('pending', 'in_progress', 'completed')
)
```

## Real-time Communication

### Socket.io Events

**Client → Server**
```
'join_queue' - { agent_id, rating }
'leave_queue' - { agent_id }
'action' - { battle_id, action, target_id, timestamp }
'surrender' - { battle_id }
'disconnect' - automatic on client disconnect
```

**Server → Client**
```
'match_found' - { opponent, battle_id, start_time }
'game_state' - { agents, hp, effects, turn_order }
'action_result' - { action, damage, status_changes }
'battle_end' - { winner_id, exp, gold, new_rating }
'error' - { code, message }
```

### Game Loop

- **Tick Rate**: 60 FPS (16.67ms per tick)
- **Action Processing**: 
  1. Client sends action to server
  2. Server validates action
  3. Server processes action (damage calc, effects, etc.)
  4. Server broadcasts result to both clients
  5. Clients update local game state

## Game Systems

### Battle System
- Turn-based, server-authoritative
- Actions: Attack, Defend, Ability, Item
- Damage calculation: `damage = (attacker_attack - defender_defense) + random(-10, 10)`
- Status effects: Stun, Bleed, Burn, Poison, etc.
- Battle duration: Max 5 minutes (300s)

### Progression
- **Experience**: Awarded for winning battles
- **Leveling**: Linear progression (1000 exp per level)
- **Stats Growth**: +5 all base stats per level
- **Class Bonuses**: Each class gets +10 to specific stat per level

### Matchmaking
- Rating-based (ELO-style)
- Initial rating: 1000
- Queue timeout: 30 seconds
- Skill-based matching within ±200 rating

### Leaderboard
- Cached in Redis, refreshed every 5 minutes
- Ranked by: wins, then win_rate, then rating
- Includes: rank, rating, wins/losses, join date

## Deployment

### Development
```bash
npm run dev  # Both backend and frontend in watch mode
```

### Production
```bash
npm run build  # TypeScript compilation
npm start      # Node server
```

### CI/CD Pipeline (GitHub Actions)
1. Lint & format check
2. Type check (TypeScript)
3. Unit tests
4. Build
5. Deploy to Railway (backend) & Vercel (frontend)

## Performance Targets

- **API Response Time**: < 100ms p95
- **WebSocket Message Latency**: < 50ms p95
- **Battle Tick Rate**: 60 FPS (16.67ms)
- **Connection Establishment**: < 2s
- **Database Queries**: < 50ms p99

## Security Considerations

1. **Authentication**: JWT with 24h expiry, refresh tokens
2. **Authorization**: Server validates all player actions
3. **Input Validation**: Zod schemas for all requests
4. **Rate Limiting**: 100 requests/minute per IP
5. **SQL Injection**: Parameterized queries via pg library
6. **CORS**: Strict origin validation
7. **Data Encryption**: Passwords with bcrypt, TLS in transit

## Monitoring & Observability

- **Error Tracking**: Sentry for backend exceptions
- **Performance**: Vercel Analytics for frontend
- **Logs**: Console logs, can integrate Loki later
- **Uptime**: UptimeRobot or StatusCake free tier
