import express, { Router } from 'express';
import { config } from '../config.js';
import { transcribeAudioWithSarvam } from '../services/sarvamService.js';

export const sttRouter = Router();

/**
 * GET /api/stt/status
 * Returns public configuration availability without exposing API keys or credentials.
 */
sttRouter.get('/status', (req, res) => {
  const isConfigured = Boolean(
    config.sarvamApiKey &&
    !config.sarvamApiKey.includes('your_') &&
    !config.sarvamApiKey.includes('placeholder')
  );

  return res.json({
    service: 'Sarvam AI Speech-to-Text',
    configured: isConfigured,
    supportedLanguages: ['en-IN', 'kn-IN'],
  });
});

/**
 * POST /api/stt/transcribe
 * Accepts raw binary audio data and calls Sarvam STT if configured.
 * Query params: ?lang=en (default) or ?lang=kn
 */
sttRouter.post(
  '/transcribe',
  express.raw({ type: ['audio/*', 'application/octet-stream'], limit: '10mb' }),
  async (req, res) => {
    try {
      const isConfigured = Boolean(
        config.sarvamApiKey &&
        !config.sarvamApiKey.includes('your_') &&
        !config.sarvamApiKey.includes('placeholder')
      );

      if (!isConfigured) {
        return res.status(503).json({
          error: 'Sarvam Speech-to-Text is not configured with a valid subscription key. Browser speech recognition will be used as fallback.',
          configured: false,
        });
      }

      const audioBuffer = req.body;
      if (!audioBuffer || !Buffer.isBuffer(audioBuffer) || audioBuffer.length === 0) {
        return res.status(400).json({ error: 'Valid audio payload is required' });
      }

      const langParam = req.query.lang;
      const languageCode = langParam === 'kn' ? 'kn-IN' : 'en-IN';

      const transcript = await transcribeAudioWithSarvam(audioBuffer, 'recording.wav', languageCode);
      return res.json({ transcript, language: languageCode });
    } catch (err) {
      console.warn('STT service error:', err.message);
      return res.status(502).json({
        error: 'Sarvam STT service currently unavailable',
        details: err.message,
      });
    }
  }
);
