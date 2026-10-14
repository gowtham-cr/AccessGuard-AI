import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { healthRouter } from './routes/healthRoutes.js';
import { authRouter } from './routes/authRoutes.js';
import { scanRouter } from './routes/scanRoutes.js';
import { ttsRouter } from './routes/ttsRoutes.js';
import { sttRouter } from './routes/sttRoutes.js';
import { shieldRouter } from './routes/shieldRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');
const indexHtmlPath = path.join(clientDistPath, 'index.html');

export const app = express();

// Security and CORS configuration
const allowedOrigins = [
  config.clientUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Allow during development
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Mount API routes
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/scans', scanRouter);
app.use('/api/tts', ttsRouter);
app.use('/api/stt', sttRouter);
app.use('/api/shield', shieldRouter);

// 404 handler for unmapped API endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `Endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Serve static frontend assets from client/dist (HTML, JS, CSS, Kannada audio)
app.use(express.static(clientDistPath));

// SPA catch-all route: serves index.html for client-side routing (excluding /api)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }

  // Prevent any attempt to request sensitive files or directory traversal
  if (req.path.includes('.env') || req.path.includes('.db') || req.path.includes('..')) {
    return res.status(404).send('Not Found');
  }

  if (fs.existsSync(indexHtmlPath)) {
    return res.sendFile(indexHtmlPath, (err) => {
      if (err) {
        next(err);
      }
    });
  }

  return res.status(404).json({
    error: 'Frontend build not found. Run npm run build in client directory.',
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : undefined,
  });
});

