# Agent Arena Frontend

Next.js 14 web client for Agent Arena MMORPG.

## Stack

- **Framework**: Next.js 14 (React)
- **Styling**: Tailwind CSS
- **Real-time**: Socket.io client
- **3D Graphics**: Three.js (planned)
- **State**: Zustand
- **HTTP**: Axios

## Setup

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

Visit `http://localhost:3000`

## Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── page.tsx        # Home page
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Main game dashboard
│   ├── agent/          # Agent creation
│   └── leaderboard/    # Rankings
├── components/         # Reusable React components
├── hooks/              # Custom React hooks
├── sockets/            # Socket.io connection
├── types/              # TypeScript types
└── utils/              # Helper functions
```

## Pages

- **Home** (`/`) - Landing page
- **Register** (`/auth/register`) - Create account
- **Login** (`/auth/login`) - Sign in
- **Dashboard** (`/dashboard`) - Game hub, agent stats, quick actions
- **Create Agent** (`/agent/create`) - Choose class and name
- **Battle Queue** (`/battle/queue`) - Join matchmaking
- **Battle** (`/battle/:id`) - Real-time battle interface (WIP)
- **Leaderboard** (`/leaderboard`) - Global rankings
- **Battle History** (`/battles/history`) - Past battles

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

## Deployment

Deploy to Vercel:

```bash
vercel deploy
```

## TODO

- [ ] Battle UI with Three.js visualization
- [ ] Socket.io real-time battle updates
- [ ] Battle queue countdown timer
- [ ] Agent stats detailed view
- [ ] Equipment management UI
- [ ] Cosmetic shop
- [ ] Settings/profile page
- [ ] Mobile optimization
- [ ] Loading states & error boundaries
