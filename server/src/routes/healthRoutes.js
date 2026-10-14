import express from 'express';
import { get } from '../db/database.js';
import { config } from '../config.js';

export const healthRouter = express.Router();

/**
 * GET /api/health
 * Public health check endpoint verifying database connectivity and operational status.
 */
healthRouter.get('/health', (req, res) => {
  try {
    // Verify database connectivity
    const dbCheck = get('SELECT 1 AS ok');
    const isDbConnected = Boolean(dbCheck && dbCheck.ok === 1);

    return res.status(200).json({
      status: 'ok',
      message: 'AccessGuard AI Backend Service is healthy and operational',
      version: '1.0.0',
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: isDbConnected ? 'connected' : 'disconnected',
      // Boolean indicator only — secret API key is strictly maintained on backend
      aiConfigured: Boolean(config.aiApiKey),
    });
  } catch (err) {
    console.error('Health check database error:', err);
    return res.status(503).json({
      status: 'degraded',
      message: 'Database check failed',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: err.message,
    });
  }
});
