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

## 📊 Dashboard

**View the live dashboard**: [Buster's Task Dashboard](https://dev-busters.github.io/agent-arena/dashboard.html)

Track tasks, priorities, progress, and token usage in real-time. The dashboard pulls from GitHub Projects and updates with token tracking data.

### Dashboard Features

- 📋 **Task Management** - See all active tasks, priorities, and progress
- 🔢 **Token Tracking** - Monitor Haiku model token usage per session and project
- 📈 **Progress Metrics** - Overall completion percentage and per-task progress bars
- 🎯 **Priority Filtering** - Filter by critical, high, medium priority or in-progress status
- 💾 **Data Sources** - Pulls from GitHub Projects API and `token-tracker.json`

### Token Tracking

Update `docs/token-tracker.json` to keep the dashboard in sync with current token usage. Format:

```json
{
  "sessions": {
    "main": {
      "currentTokens": 27000,
      "model": "haiku"
    }
  }
}
```

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
