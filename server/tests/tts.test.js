import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../src/app.js';
import { initDatabase, closeDatabase } from '../src/db/database.js';

describe('Kannada TTS API Endpoint (/api/tts/kannada)', () => {
  let server;
  let baseUrl;

  before(async () => {
    initDatabase(':memory:');

    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    closeDatabase();
  });

  test('GET /api/tts/kannada without text query returns 400', async () => {
    const res = await fetch(`${baseUrl}/api/tts/kannada`);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /required/i);
  });

  test('GET /api/tts/kannada with whitespace-only text returns 400', async () => {
    const res = await fetch(`${baseUrl}/api/tts/kannada?text=%20%20%20`);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /required/i);
  });

  test('GET /api/tts/kannada with text exceeding 500 chars returns 400', async () => {
    const longText = 'ಕ'.repeat(501);
    const res = await fetch(`${baseUrl}/api/tts/kannada?text=${encodeURIComponent(longText)}`);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.match(body.error, /exceeds maximum allowed length/i);
  });

  test('GET /api/tts/kannada with valid Kannada text returns 200 audio/mpeg', async () => {
    const text = 'ನಮಸ್ಕಾರ, ಆಕ್ಸೆಸ್‌ಗಾರ್ಡ್ ಪರೀಕ್ಷೆ.';
    const res = await fetch(`${baseUrl}/api/tts/kannada?text=${encodeURIComponent(text)}`);
    assert.equal(res.status, 200);

    const contentType = res.headers.get('content-type');
    assert.ok(contentType?.includes('audio/mpeg'), `Expected audio/mpeg, got: ${contentType}`);

    const buffer = Buffer.from(await res.arrayBuffer());
    assert.ok(buffer.length > 5000, `Audio buffer length should be > 5000, got ${buffer.length}`);

    // Verify MPEG audio sync word (11 bits = 0xFFE0 mask)
    const isMpegFrameSync = buffer.length >= 2 && buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0;
    assert.ok(isMpegFrameSync, 'Response must be valid MPEG audio with frame sync');
  });
});
