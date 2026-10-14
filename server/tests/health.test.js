import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../src/app.js';
import { initDatabase, closeDatabase } from '../src/db/database.js';

describe('Health API Endpoint (/api/health)', () => {
  let server;
  let baseUrl;

  before(async () => {
    // Use in-memory SQLite database for test isolation
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

  test('GET /api/health returns 200 with ok status and connected database', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.database, 'connected');
    assert.equal(body.version, '1.0.0');
    assert.ok(typeof body.timestamp === 'string');
    assert.ok(typeof body.aiConfigured === 'boolean');

    // Security check: Must NEVER expose sensitive keys in health check
    assert.equal(body.aiApiKey, undefined);
    assert.equal(body.jwtSecret, undefined);
  });

  test('GET /api/nonexistent returns 404 for unmapped endpoints', async () => {
    const res = await fetch(`${baseUrl}/api/nonexistent-endpoint`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.ok(body.error.includes('not found'));
  });
});
