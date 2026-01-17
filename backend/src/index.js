import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config/env.js';
import { checkConnection } from './config/database.js';
import { checkDockerConnection } from './config/docker.js';
import { logger } from './utils/logger.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import authRoutes from './modules/auth/auth.routes.js';
import projectsRoutes from './modules/projects/projects.routes.js';
import containersRoutes from './modules/containers/containers.routes.js';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: config.corsOrigin, methods: ['GET', 'POST'], credentials: true },
});

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: config.corsOrigin, credentials: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api', apiLimiter);

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => logger.debug(`${req.method} ${req.originalUrl}`, { status: res.statusCode, duration: `${Date.now() - start}ms` }));
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/containers', containersRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

io.on('connection', (socket) => {
  logger.debug('Socket connected', { id: socket.id });
  socket.on('disconnect', () => logger.debug('Socket disconnected', { id: socket.id }));
});

app.set('io', io);

async function startServer() {
  try {
    const dbConnected = await checkConnection();
    if (!dbConnected) throw new Error('Database connection failed');
    const dockerConnected = await checkDockerConnection();
    if (!dockerConnected) logger.warn('Docker connection failed');
    httpServer.listen(config.port, config.host, () => {
      logger.info(`VPS Center Backend running on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => { httpServer.close(() => process.exit(0)); });
process.on('SIGINT', () => { httpServer.close(() => process.exit(0)); });

startServer();

export { app, io };
