import express from 'express';
import { analyzeMessage, inspectWebsiteSafely } from '../services/shieldService.js';
import { config } from '../config.js';

export const shieldRouter = express.Router();

/**
 * POST /api/shield/check-message
 * Inspects a suspicious SMS, WhatsApp message, email, or payment demand.
 * Deterministic, explainable, and privacy-preserving (never stored or logged).
 */
shieldRouter.post('/check-message', (req, res) => {
  const { message } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'A valid "message" string is required.' });
  }

  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  if (trimmed.length > 5000) {
    return res.status(400).json({ error: 'Message exceeds maximum length of 5000 characters.' });
  }

  try {
    const analysis = analyzeMessage(trimmed);
    return res.status(200).json(analysis);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/shield/check-url
 * Safely inspects a URL with defense-in-depth SSRF protection.
 * Blocks private networks, cloud metadata, and unsafe redirects.
 * Does not execute JavaScript or click links.
 */
shieldRouter.post('/check-url', async (req, res) => {
  const { url } = req.body || {};

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'A valid "url" string is required.' });
  }

  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return res.status(400).json({ error: 'URL cannot be empty.' });
  }

  if (trimmed.length > 2048) {
    return res.status(400).json({ error: 'URL exceeds maximum length of 2048 characters.' });
  }

  try {
    const findings = await inspectWebsiteSafely(trimmed, {
      allowLocalhost: config.allowLocalhostScans,
      timeoutMs: 5000,
    });

    return res.status(200).json(findings);
  } catch (err) {
    console.error('Error in shield check-url:', err.message);
    return res.status(500).json({ error: 'Failed to inspect website.' });
  }
});
