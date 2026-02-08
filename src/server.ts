// Set up global error handlers BEFORE anything else
process.on('uncaughtException', (err) => {
  console.error('❌ [FATAL] Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ [FATAL] Unhandled Promise Rejection:', reason);
});

console.log('🚀 [STARTUP] Loading modules...');

import express, { Express, Request, Response, ErrorRequestHandler } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

console.log('🚀 [STARTUP] Loading dotenv...');
dotenv.config();
console.log('🚀 [STARTUP] DATABASE_URL set:', !!process.env.DATABASE_URL);
console.log('🚀 [STARTUP] NODE_ENV:', process.env.NODE_ENV);

import authRoutes from './api/routes/auth.routes';
import oauthRoutes from './api/routes/oauth.routes';
import agentRoutes from './api/routes/agent.routes';
import battleRoutes from './api/routes/battle.routes';
import leaderboardRoutes from './api/routes/leaderboard.routes';
import costRoutes from './api/routes/costs.routes';
import progressionRoutes from './api/routes/progression.routes';
import craftingRoutes from './api/routes/crafting.routes';

console.log('🚀 [STARTUP] Loading socket handlers...');
import { setupGameSockets } from './sockets/game.socket';
import { setupDungeonSockets } from './sockets/dungeon.socket';

console.log('🚀 [STARTUP] Loading game modules...');
import { matchmakingQueue, updateLeaderboard } from './game/matchmaking';
import { verifyToken } from './api/auth';

console.log('🚀 [STARTUP] All modules loaded successfully');

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

// CORS middleware
app.use((req: Request, res: Response, next: Function) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Socket.io authentication middleware
io.use((socket: any, next) => {
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

// Health check - must be extremely simple and reliable
let serverReady = false;

// Simple ping endpoint for basic connectivity checks
app.get('/ping', (req: Request, res: Response) => {
  res.status(200).send('pong');
});

// Detailed health check
app.get('/health', (req: Request, res: Response) => {
  try {
    const healthData: any = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      server_ready: serverReady
    };
    
    // Try to include queue size if available
    try {
      if (matchmakingQueue && typeof matchmakingQueue.getQueueSize === 'function') {
        healthData.queue_size = matchmakingQueue.getQueueSize();
      }
    } catch (e) {
      // Ignore errors getting queue size
    }
    
    res.status(200).json(healthData);
  } catch (err) {
    console.error('❌ Health check error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed'
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', oauthRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/battles', battleRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/costs', costRoutes);
app.use('/api/progression', progressionRoutes);
app.use('/api/crafting', craftingRoutes);

// TODO: More routes
// app.use('/api/users', userRoutes);

// Setup Socket.io game handlers
setupGameSockets(io);
setupDungeonSockets(io);

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

// Start servers with error handling
httpServer.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

httpServer.listen(PORT, () => {
  serverReady = true; // Mark server as ready after listening
  
  console.log(`✅ [READY] Agent Arena server running on port ${PORT}`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready for connections`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\n📊 API endpoints:`);
  console.log(`   Health & Status:`);
  console.log(`     GET  /ping   (simple connectivity check)`);
  console.log(`     GET  /health (detailed health status)`);
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
  console.log(`   Battle: join_queue, leave_queue, start_battle, action, surrender`);
  console.log(`   Dungeon: start_dungeon, enter_room, dungeon_action, flee_encounter, next_floor, abandon_dungeon\n`);
});

// Start matchmaking service
try {
  console.log('🔄 Starting matchmaking service...');
  matchmakingQueue.startMatchmaking(5000); // Match every 5 seconds
  console.log('✅ Matchmaking service started successfully');
} catch (err) {
  console.error('❌ Failed to start matchmaking service:', err);
  // Don't exit - this is not critical to health check
}

// Update leaderboard every 5 minutes
try {
  console.log('📊 Setting up leaderboard update timer...');
  setInterval(async () => {
    try {
      await updateLeaderboard();
    } catch (err) {
      console.error('⚠️  Leaderboard update error:', err);
    }
  }, 5 * 60 * 1000);
  console.log('✅ Leaderboard update timer initialized');
} catch (err) {
  console.error('❌ Failed to set up leaderboard updates:', err);
  // Don't exit - this is not critical
}

console.log('✅ [STARTUP] Server fully initialized and ready to receive requests');

export { app, io };
