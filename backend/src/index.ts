import 'reflect-metadata';
import 'dotenv/config';
import fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';

// Import container configuration
import './container';

// Import routes
import { contentRoutes } from './presentation/routes/contentRoutes';
import { analysisRoutes } from './presentation/routes/analysisRoutes';
import { reportRoutes } from './presentation/routes/reportRoutes';
import { statsRoutes } from './presentation/routes/statsRoutes';

// Import error handler
import { errorHandler } from './presentation/middlewares/errorHandler';

const server = fastify({
  logger: true,
  ajv: {
    customOptions: {
      removeAdditional: 'all',
      useDefaults: true,
      coerceTypes: true,
    },
  },
});

// Register plugins
server.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

server.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  errorResponseBuilder: () => ({
    error: 'Too many requests',
    statusCode: 429,
  }),
});

server.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key',
});

// Register error handler
errorHandler(server);

// Register routes
server.register(contentRoutes);
server.register(analysisRoutes);
server.register(reportRoutes);
server.register(statsRoutes);

// Health check endpoint
server.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Root endpoint
server.get('/', async () => {
  return {
    message: 'AI Content Analytics Platform API',
    version: '1.0.0',
    endpoints: {
      scrape: 'POST /api/scrape',
      content: 'GET /api/content/:id',
      analyze: 'POST /api/analyze',
      reports: 'GET /api/reports',
      generateReport: 'POST /api/reports/generate',
      stats: 'GET /api/stats',
      health: 'GET /health',
    },
  };
});

// Start server
const PORT = parseInt(process.env.PORT || '3001');
const HOST = process.env.HOST || '0.0.0.0';

const start = async () => {
  try {
    await server.listen({ port: PORT, host: HOST });
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server...');
  await server.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down server...');
  await server.close();
  process.exit(0);
});

start();