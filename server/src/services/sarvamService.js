import https from 'node:https';
import { config } from '../config.js';

/**
 * Transcribe audio using Sarvam AI's official Speech-to-Text API
 * Endpoint: POST https://api.sarvam.ai/speech-to-text
 * Authentication Header: api-subscription-key
 *
 * @param {Buffer} audioBuffer - Audio buffer (WAV/MP3)
 * @param {string} filename - Filename with extension (default 'audio.wav')
 * @param {string} languageCode - Language code, e.g. 'en-IN' or 'kn-IN'
 * @returns {Promise<string>} Transcribed text
 */
export async function transcribeAudioWithSarvam(audioBuffer, filename = 'audio.wav', languageCode = 'en-IN') {
  if (!config.sarvamApiKey || config.sarvamApiKey.includes('your_') || config.sarvamApiKey.includes('placeholder')) {
    throw new Error('SARVAM_API_KEY is not configured with a valid subscription key');
  }

  return new Promise((resolve, reject) => {
    const boundary = '----SarvamBoundary' + Date.now();
    const contentType = filename.endsWith('.mp3') ? 'audio/mpeg' : 'audio/wav';

    const headerPart = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      `Content-Type: ${contentType}\r\n\r\n`
    );
    const langPart = Buffer.from(
      `\r\n--${boundary}\r\n` +
      `Content-Disposition: form-data; name="language_code"\r\n\r\n` +
      `${languageCode}`
    );
    const footerPart = Buffer.from(`\r\n--${boundary}--\r\n`);
    const fullPayload = Buffer.concat([headerPart, audioBuffer, langPart, footerPart]);

    const req = https.request({
      hostname: 'api.sarvam.ai',
      port: 443,
      path: '/speech-to-text',
      method: 'POST',
      headers: {
        'api-subscription-key': config.sarvamApiKey,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': fullPayload.length,
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const data = JSON.parse(body);
            resolve(data.transcript || data.text || '');
          } catch {
            reject(new Error('Invalid JSON response from Sarvam STT service'));
          }
        } else {
          let errDetail = `Sarvam STT failed with HTTP ${res.statusCode}`;
          try {
            const errObj = JSON.parse(body);
            errDetail = errObj.message || errObj.error || errDetail;
          } catch {}
          reject(new Error(errDetail));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(fullPayload);
    req.end();
  });
}
