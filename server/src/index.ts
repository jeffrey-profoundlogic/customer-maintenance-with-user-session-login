import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import dotenv from 'dotenv';

import customerRoutes from './routes/customerRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { sessionPoolManager } from './services/sessionPoolManager.js';
import redisClient from './config/redis.js';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const SESSION_TIMEOUT_MS = parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30', 10) * 60 * 1000;

await redisClient.connect();
sessionPoolManager.startCleanup(SESSION_TIMEOUT_MS);

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: SESSION_TIMEOUT_MS,
    sameSite: 'lax',
  },
}));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/customers', customerRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api/v1`);
  console.log(`Session timeout: ${process.env.SESSION_TIMEOUT_MINUTES || '30'} minutes`);
});

async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    console.log('HTTP server closed');

    try {
      sessionPoolManager.destroyAll();
      await redisClient.disconnect();
      console.log('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
