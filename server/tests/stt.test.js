import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../src/app.js';

describe('Speech-to-Text API Endpoint (/api/stt)', () => {
  let server;
  let baseUrl;

  before(async () => {
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
  });

  test('GET /api/stt/status returns service info and configured status safely', async () => {
    const res = await fetch(`${baseUrl}/api/stt/status`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.service, 'Sarvam AI Speech-to-Text');
    assert.equal(typeof body.configured, 'boolean');
    assert.deepEqual(body.supportedLanguages, ['en-IN', 'kn-IN']);
  });

  test('POST /api/stt/transcribe returns 503 when Sarvam key is not a valid subscription key', async () => {
    const res = await fetch(`${baseUrl}/api/stt/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'audio/wav',
      },
      body: Buffer.from([0, 1, 2, 3]),
    });

    assert.equal(res.status, 503);
    const body = await res.json();
    assert.match(body.error, /Sarvam Speech-to-Text is not configured/i);
    assert.equal(body.configured, false);
  });
});
