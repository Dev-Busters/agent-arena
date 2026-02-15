// Set up global error handlers BEFORE anything else
import dns from 'dns';
try {
    dns.setDefaultResultOrder('ipv4first');
    console.log('✅ [NETWORK] Set default DNS result order to ipv4first');
}
catch (e) {
    console.warn('⚠️ [NETWORK] Could not set default DNS result order (Node version likely too old)');
}
process.on('uncaughtException', (err) => {
    console.error('❌ [FATAL] Uncaught Exception:', err);
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    console.error('❌ [FATAL] Unhandled Promise Rejection:', reason);
});
console.log('🚀 [STARTUP] Loading modules...');
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
console.log('🚀 [STARTUP] Loading dotenv...');
dotenv.config();
console.log('🚀 [STARTUP] DATABASE_URL set:', !!process.env.DATABASE_URL);
console.log('🚀 [STARTUP] NODE_ENV:', process.env.NODE_ENV);
import authRoutes from './api/routes/auth.routes.js';
import oauthRoutes from './api/routes/oauth.routes.js';
import agentRoutes from './api/routes/agent.routes.js';
import battleRoutes from './api/routes/battle.routes.js';
import leaderboardRoutes from './api/routes/leaderboard.routes.js';
import costRoutes from './api/routes/costs.routes.js';
import progressionRoutes from './api/routes/progression.routes.js';
import craftingRoutes from './api/routes/crafting.routes.js';
console.log('🚀 [STARTUP] Loading socket handlers...');
import { setupGameSockets } from './sockets/game.socket.js';
import { setupDungeonSockets } from './sockets/dungeon.socket.js';
console.log('🚀 [STARTUP] Loading game modules...');
import { matchmakingQueue, updateLeaderboard } from './game/matchmaking.js';
import { verifyToken } from './api/auth.js';
import { query as executeQuery } from './database/connection.js';
console.log('🚀 [STARTUP] All modules loaded successfully');
const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: process.env.SOCKET_IO_CORS_ORIGIN || '*',
        methods: ['GET', 'POST']
    }
});
const PORT = process.env.PORT || 3000;
import cors from 'cors';
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        const allowed = process.env.SOCKET_IO_CORS_ORIGIN || process.env.CORS_ORIGIN || '*';
        if (allowed === '*' || !origin || origin === allowed) {
            callback(null, true);
        }
        else {
            console.warn(`⚠️ [CORS] Rejected: ${origin}. Expected: ${allowed}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
};
app.use(cors(corsOptions));
// Explicitly handle OPTIONS for preflight comfort
app.options('*', cors(corsOptions));
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
    }
    catch (err) {
        next(new Error('Invalid token'));
    }
});
// Request logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});
// Health check - must be extremely simple and reliable
let serverReady = false;
// Simple ping endpoint for basic connectivity checks
app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});
// Detailed health check
app.get('/health', (req, res) => {
    try {
        const healthData = {
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
        }
        catch (e) {
            // Ignore errors getting queue size
        }
        res.status(200).json(healthData);
    }
    catch (err) {
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
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});
// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};
app.use(errorHandler);
// Start servers with error handling
httpServer.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
    }
    else {
        console.error('❌ Server error:', err);
    }
    process.exit(1);
});
httpServer.listen(PORT, () => {
    serverReady = true; // Mark server as ready after listening
    console.log(`✅ [READY] Agent Arena server running on port ${PORT}`);
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
}
catch (err) {
    console.error('❌ Failed to start matchmaking service:', err);
    // Don't exit - this is not critical to health check
}
// Update leaderboard every 5 minutes
try {
    console.log('📊 Setting up leaderboard update timer...');
    setInterval(async () => {
        try {
            await updateLeaderboard();
        }
        catch (err) {
            console.error('⚠️  Leaderboard update error:', err);
        }
    }, 5 * 60 * 1000);
    console.log('✅ Leaderboard update timer initialized');
}
catch (err) {
    console.error('❌ Failed to set up leaderboard updates:', err);
    // Don't exit - this is not critical
}
console.log('✅ [STARTUP] Server fully initialized and ready to receive requests');
// Run schema cleanup on startup (drop and recreate dungeon tables)
(async () => {
    try {
        console.log('🔄 [STARTUP] Running schema cleanup for dungeon tables...');
        // Drop dependent tables first
        await executeQuery('DROP TABLE IF EXISTS dungeon_progress CASCADE');
        console.log('✓ Dropped dungeon_progress table');
        await executeQuery('DROP TABLE IF EXISTS loot_drops CASCADE');
        console.log('✓ Dropped loot_drops table');
        await executeQuery('DROP TABLE IF EXISTS encounters CASCADE');
        console.log('✓ Dropped encounters table');
        await executeQuery('DROP TABLE IF EXISTS dungeons CASCADE');
        console.log('✓ Dropped dungeons table');
        // Recreate tables without bad constraints (execute each statement individually)
        await executeQuery(`
      CREATE TABLE IF NOT EXISTS dungeons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
        difficulty dungeon_difficulty DEFAULT 'normal',
        seed INT NOT NULL,
        depth INT DEFAULT 1,
        max_depth INT DEFAULT 1,
        gold_collected INT DEFAULT 0,
        experience_earned INT DEFAULT 0,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        abandoned_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✓ Created dungeons table');
        await executeQuery('CREATE INDEX IF NOT EXISTS idx_dungeons_user_id ON dungeons(user_id)');
        await executeQuery('CREATE INDEX IF NOT EXISTS idx_dungeons_agent_id ON dungeons(agent_id)');
        await executeQuery('CREATE INDEX IF NOT EXISTS idx_dungeons_difficulty ON dungeons(difficulty)');
        await executeQuery(`
      CREATE TABLE IF NOT EXISTS encounters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        dungeon_id UUID NOT NULL REFERENCES dungeons(id) ON DELETE CASCADE,
        room_id INT NOT NULL,
        enemy_type VARCHAR(50) NOT NULL,
        enemy_level INT DEFAULT 1,
        enemy_hp INT NOT NULL,
        enemy_max_hp INT NOT NULL,
        enemy_attack INT NOT NULL,
        enemy_defense INT NOT NULL,
        enemy_speed INT NOT NULL,
        enemy_loot_table JSONB DEFAULT '{}',
        encountered_at TIMESTAMP,
        defeated_at TIMESTAMP,
        victory BOOLEAN,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✓ Created encounters table');
        await executeQuery('CREATE INDEX IF NOT EXISTS idx_encounters_dungeon_id ON encounters(dungeon_id)');
        await executeQuery('CREATE INDEX IF NOT EXISTS idx_encounters_room_id ON encounters(room_id)');
        await executeQuery(`
      CREATE TABLE IF NOT EXISTS loot_drops (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        dungeon_id UUID NOT NULL REFERENCES dungeons(id) ON DELETE CASCADE,
        encounter_id UUID REFERENCES encounters(id) ON DELETE SET NULL,
        item_id UUID REFERENCES items(id),
        gold INT DEFAULT 0,
        experience INT DEFAULT 0,
        found_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        collected BOOLEAN DEFAULT FALSE,
        collected_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✓ Created loot_drops table');
        await executeQuery('CREATE INDEX IF NOT EXISTS idx_loot_drops_dungeon_id ON loot_drops(dungeon_id)');
        await executeQuery('CREATE INDEX IF NOT EXISTS idx_loot_drops_encounter_id ON loot_drops(encounter_id)');
        await executeQuery(`
      CREATE TABLE IF NOT EXISTS dungeon_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        dungeon_id UUID NOT NULL REFERENCES dungeons(id) ON DELETE CASCADE UNIQUE,
        map_data JSONB NOT NULL DEFAULT '{}',
        current_room_id INT DEFAULT 1,
        visited_rooms INT[] DEFAULT ARRAY[]::INT[],
        discovered_rooms INT[] DEFAULT ARRAY[]::INT[],
        player_x INT DEFAULT 0,
        player_y INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✓ Created dungeon_progress table');
        await executeQuery('CREATE INDEX IF NOT EXISTS idx_dungeon_progress_dungeon_id ON dungeon_progress(dungeon_id)');
        console.log('✅ [STARTUP] Dungeon tables recreated successfully (no bad constraints)');
    }
    catch (err) {
        console.error('⚠️  [STARTUP] Schema cleanup warning (may be okay):', err.message);
        // Don't exit - this is cleanup, not critical
    }
})();
export { app, io };
//# sourceMappingURL=server.js.map