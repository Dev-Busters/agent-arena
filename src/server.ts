import express, { Express, Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

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
const SOCKET_PORT = process.env.SOCKET_IO_PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// TODO: Import and register route modules
// app.use('/api/auth', authRoutes);
// app.use('/api/agents', agentRoutes);
// app.use('/api/battles', battleRoutes);
// app.use('/api/users', userRoutes);

// Socket.io connection
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // TODO: Implement game socket handlers
  // - Join battle room
  // - Send action (attack, defend, etc.)
  // - Receive game state updates
  // - Disconnect/leave battle

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response) => {
  console.error(err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start servers
httpServer.listen(PORT, () => {
  console.log(`🎮 Agent Arena server running on port ${PORT}`);
  console.log(`📡 Socket.io listening on port ${SOCKET_PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { app, io };
