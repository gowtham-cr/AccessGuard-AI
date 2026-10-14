import { Router } from 'express';
import https from 'node:https';
import { splitTextIntoChunks, fetchKannadaTtsChunk } from '../../scripts/audio_generator_utils.js';

export const ttsRouter = Router();

/**
 * GET /api/tts/kannada?text=...
 * Authentically synthesizes Kannada speech for unmatched text using the validated Kannada TTS service.
 * Enforces strict input validation, length limits, SSRF prevention, and sets proper MPEG audio headers.
 */
ttsRouter.get('/kannada', async (req, res) => {
  try {
    const rawText = req.query.text;

    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      return res.status(400).json({ error: 'Query parameter "text" is required' });
    }

    const text = rawText.trim();

    if (text.length > 500) {
      return res.status(400).json({
        error: 'Text exceeds maximum allowed length of 500 characters',
      });
    }

    // Strip control characters (except normal space/newline)
    const sanitized = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    if (!sanitized) {
      return res.status(400).json({ error: 'Text contains only invalid control characters' });
    }

    // If text fits in a single chunk, fetch directly; otherwise split and concatenate
    const chunks = splitTextIntoChunks(sanitized, 140);
    if (chunks.length === 0) {
      return res.status(400).json({ error: 'Text cannot be empty' });
    }

    const audioBuffers = [];
    for (const chunk of chunks) {
      const buf = await fetchKannadaTtsChunk(chunk);
      audioBuffers.push(buf);
    }

    const combined = Buffer.concat(audioBuffers);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': combined.length,
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      'Accept-Ranges': 'bytes',
    });

    return res.status(200).send(combined);
  } catch (err) {
    console.error('TTS proxy error:', err.message);
    return res.status(502).json({
      error: 'Kannada TTS service currently unavailable',
      details: err.message,
    });
  }
});
