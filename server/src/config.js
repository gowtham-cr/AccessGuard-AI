import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from server root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  get nodeEnv() {
    return process.env.NODE_ENV || 'development';
  },
  jwtSecret: process.env.JWT_SECRET || 'accessguard_ai_dev_secret_key_change_in_production_987654321',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  get databasePath() {
    return process.env.DATABASE_PATH 
      ? path.resolve(__dirname, '..', process.env.DATABASE_PATH)
      : path.resolve(__dirname, '../data/accessguard.db');
  },
  // Kept strictly on the backend, never sent to or exposed on the frontend
  aiApiKey: process.env.AI_API_KEY || null,
  get sarvamApiKey() {
    try {
      dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
    } catch {}
    return process.env.SARVAM_API_KEY || null;
  },
  cookieName: 'accessguard_token',
  jwtExpiresIn: '7d',
  cookieMaxAgeMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  // Strictly false by default; can only be enabled in test environment
  get allowLocalhostScans() {
    return process.env.ALLOW_LOCALHOST_SCANS === 'true';
  },
};

if (config.nodeEnv === 'production' && config.jwtSecret.includes('dev_secret_key')) {
  console.warn('⚠️ WARNING: Using default development JWT_SECRET in production environment!');
}
