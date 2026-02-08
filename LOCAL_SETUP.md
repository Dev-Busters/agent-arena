# Local Development Setup

## Quick Start

### Prerequisites
- Node.js 18+ (`node -v`)
- PostgreSQL running locally OR Supabase account
- Environment variables configured

---

## Backend Setup

### 1. Install Dependencies
```bash
cd /Users/theharrowed/.openclaw/workspace/agent-arena
npm install
```

### 2. Configure Environment
Create `.env` in the repo root:
```
# Database (use Supabase or local PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/agent_arena"

# Or Supabase:
DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres"

# Server
PORT=3000
NODE_ENV=development

# CORS (allow frontend)
SOCKET_IO_CORS_ORIGIN=http://localhost:3000

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here
```

### 3. Run Database Migrations
```bash
npm run migrate
```

This creates all tables (users, agents, battles, token_usage, etc.)

### 4. Start Backend Server
```bash
npm run dev
```

You should see:
```
🎮 Game server listening on port 3000
✅ Socket.io ready for connections
```

---

## Frontend Setup

### 1. Install Dependencies
```bash
cd /Users/theharrowed/.openclaw/workspace/agent-arena/frontend
npm install
```

### 2. Configure Environment
Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

### 3. Start Frontend Dev Server
```bash
npm run dev
```

You should see:
```
▲ Next.js 14.0.0
- Local: http://localhost:3001
```

---

## Testing the Full Flow

### 1. Open Both Servers
- **Backend:** http://localhost:3000/health (should say `ok`)
- **Frontend:** http://localhost:3001

### 2. Create an Account
- Go to http://localhost:3001
- Click "Sign Up"
- Create test account (email: test@local.dev, password: anything)

### 3. Create an Agent
- Go to Dashboard
- Click "Create Your First Agent"
- Pick a class (Warrior, Mage, Rogue, Paladin)
- Name it something cool

### 4. Test Battle
- Go to http://localhost:3001/battle/test
- Click "Load Agents"
- Select same agent twice (we don't have multiple yet)
- Click "Simulate Auto Battle"
- You'll get a battle ID
- Click "Watch battle" link
- **See the battle UI with animations!**

---

## Troubleshooting

**"Cannot connect to database"**
- Check DATABASE_URL is correct
- Verify PostgreSQL/Supabase is running
- Try running migrations again

**"Socket.io connection failed"**
- Check backend is running on port 3000
- Verify SOCKET_IO_CORS_ORIGIN includes frontend URL
- Check browser console for CORS errors

**"Agent not found"**
- You need to create an agent first (Step 3 above)
- Try creating a different agent and selecting it

**Port already in use**
- Backend: Change PORT in .env
- Frontend: Change port in `npm run dev` (it prompts)

---

## What to Look For

✅ **Agent Avatar** — Shows class emoji, level, equipment with rarity colors  
✅ **Equipment Display** — Weapon, armor, accessory with badges  
✅ **Legendary Glow** — If equipment is rare/epic, avatar glows  
✅ **Battle Log** — Actions appear in bottom-left  
✅ **Damage Numbers** — Float up from agents when hit  
✅ **HP Bar** — Depletes as agents take damage  
✅ **Turn System** — Buttons appear when it's your turn  

---

## Next Steps

Once testing locally is working:
1. We can identify any bugs
2. Fix them with Haiku (cheap)
3. Then deploy to production (Railway + Vercel)
4. Then call in Opus for balance tuning

Good luck! Let me know when you get it running.
