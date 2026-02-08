import express, { Express, Request, Response, ErrorRequestHandler } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import authRoutes from './api/routes/auth.routes.js';
import agentRoutes from './api/routes/agent.routes.js';
import battleRoutes from './api/routes/battle.routes.js';
import leaderboardRoutes from './api/routes/leaderboard.routes.js';
import costRoutes from './api/routes/costs.routes.js';
import { setupGameSockets } from './sockets/game.socket.js';
import { matchmakingQueue, updateLeaderboard } from './game/matchmaking.js';
import { verifyToken } from './api/auth.js';

dotenv.config();

const app: Express = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.SOCKET_IO_CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const user = verifyToken(token);
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// Request logging
app.use((req: Request, res: Response, next: Function) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    queue_size: matchmakingQueue.getQueueSize()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/battles', battleRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/costs', costRoutes);

// TODO: More routes
// app.use('/api/users', userRoutes);

// Setup Socket.io game handlers
setupGameSockets(io);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling middleware
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

app.use(errorHandler);

// Start servers
httpServer.listen(PORT, () => {
  console.log(`🎮 Agent Arena server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for connections`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\n📊 API endpoints:`);
  console.log(`   Auth:`);
  console.log(`     POST /api/auth/register`);
  console.log(`     POST /api/auth/login`);
  console.log(`   Agents:`);
  console.log(`     POST /api/agents`);
  console.log(`     GET  /api/agents/me/current`);
  console.log(`     GET  /api/agents/:id`);
  console.log(`   Battles:`);
  console.log(`     GET  /api/battles/:id`);
  console.log(`     GET  /api/battles/user/history`);
  console.log(`     POST /api/battles/simulate`);
  console.log(`   Leaderboard:`);
  console.log(`     GET  /api/leaderboard`);
  console.log(`     GET  /api/leaderboard/user/:user_id`);
  console.log(`     GET  /api/leaderboard/top/:count`);
  console.log(`\n🎮 Socket.io events:`);
  console.log(`   join_queue, leave_queue, start_battle, action, surrender\n`);
});

// Start matchmaking service
matchmakingQueue.startMatchmaking(5000); // Match every 5 seconds

// Update leaderboard every 5 minutes
setInterval(async () => {
  try {
    await updateLeaderboard();
  } catch (err) {
    console.error('Leaderboard update error:', err);
  }
}, 5 * 60 * 1000);

export { app, io };
