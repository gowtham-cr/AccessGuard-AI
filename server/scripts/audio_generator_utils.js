import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

// Helper to chunk Kannada text respecting sentences and clause boundaries
export function splitTextIntoChunks(text, maxChars = 140) {
  if (!text || typeof text !== 'string') return [];
  // Split on periods, exclamation, question marks, commas, or semicolons
  const sentences = text
    .split(/([.!?।,\n]+)/)
    .reduce((acc, cur, idx) => {
      if (idx % 2 === 0) {
        if (cur.trim()) acc.push(cur.trim());
      } else {
        if (acc.length > 0) acc[acc.length - 1] += cur;
      }
      return acc;
    }, []);

  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    if (!sentence) continue;
    if ((current + ' ' + sentence).trim().length <= maxChars) {
      current = (current + ' ' + sentence).trim();
    } else {
      if (current) chunks.push(current);
      // If a single sentence is longer than maxChars, split on spaces
      if (sentence.length > maxChars) {
        const words = sentence.split(/\s+/);
        let wordChunk = '';
        for (const w of words) {
          if ((wordChunk + ' ' + w).trim().length <= maxChars) {
            wordChunk = (wordChunk + ' ' + w).trim();
          } else {
            if (wordChunk) chunks.push(wordChunk);
            wordChunk = w;
          }
        }
        if (wordChunk) current = wordChunk;
        else current = '';
      } else {
        current = sentence;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export function fetchKannadaTtsChunk(text) {
  return new Promise((resolve, reject) => {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=kn&client=tw-ob&q=${encodeURIComponent(text)}`;
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/',
      },
      timeout: 10000,
    };

    const req = https.get(url, options, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Google TTS request failed with HTTP ${res.statusCode}`));
      }
      const contentType = res.headers['content-type'] || '';
      if (!contentType.includes('audio') && !contentType.includes('mpeg')) {
        return reject(new Error(`Invalid content type from TTS: ${contentType}`));
      }
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        // Verify MP3 header/sync
        const isId3 = buffer.subarray(0, 3).toString('utf-8') === 'ID3';
        const isMpegFrame = buffer.length >= 2 && buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0;
        if (!isId3 && !isMpegFrame) {
          return reject(new Error('Returned audio buffer does not contain valid MP3 frame sync'));
        }
        resolve(buffer);
      });
      res.on('error', reject);
    });

    req.on('timeout', () => {
      req.destroy(new Error('TTS request timed out'));
    });
    req.on('error', reject);
  });
}

// Generate continuous audio by requesting chunks with polite delay and concatenating
export async function generateFullAudio(text, sectionName) {
  const chunks = splitTextIntoChunks(text);
  console.log(`Generating audio for [${sectionName}]: ${chunks.length} chunks...`);

  const audioBuffers = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`  Chunk ${i + 1}/${chunks.length} (${chunk.length} chars): "${chunk.slice(0, 40)}..."`);
    const buf = await fetchKannadaTtsChunk(chunk);
    audioBuffers.push(buf);
    // Polite delay between chunk requests (300ms)
    await new Promise((r) => setTimeout(r, 300));
  }

  const fullBuffer = Buffer.concat(audioBuffers);
  console.log(`  Combined audio for [${sectionName}]: ${fullBuffer.length} bytes`);
  return fullBuffer;
}
