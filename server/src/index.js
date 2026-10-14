import { app } from './app.js';
import { config } from './config.js';
import { initDatabase, closeDatabase } from './db/database.js';

// 1. Initialize SQLite database and schema
try {
  initDatabase();
  console.log(`✅ SQLite database initialized at: ${config.databasePath}`);
} catch (err) {
  console.error('❌ Failed to initialize database:', err);
  process.exit(1);
}

// 2. Start HTTP server
const server = app.listen(config.port, () => {
  console.log('====================================================');
  console.log(`🚀 AccessGuard AI Backend Server running on port ${config.port}`);
  console.log(`🌐 Health Check: http://localhost:${config.port}/api/health`);
  console.log(`🔒 Environment:  ${config.nodeEnv}`);
  console.log('====================================================');
});

// Graceful shutdown
function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(() => {
    closeDatabase();
    console.log('Database connection closed. Process exited.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
