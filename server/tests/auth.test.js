import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../src/app.js';
import { initDatabase, closeDatabase, get } from '../src/db/database.js';

describe('Authentication API (/api/auth)', () => {
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

  test('POST /api/auth/register creates user with hashed password and returns token', async () => {
    const payload = {
      email: 'auditor@accessguard.gov',
      password: 'SecurePassword123!',
      name: 'Digital Accessibility Auditor',
    };

    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 201);
    const body = await res.json();

    assert.equal(body.message, 'Registration successful');
    assert.equal(body.user.email, 'auditor@accessguard.gov');
    assert.equal(body.user.name, 'Digital Accessibility Auditor');
    assert.equal(body.user.role, 'user');
    assert.ok(body.token, 'Token must be present in response');

    // Verify Set-Cookie header contains HttpOnly accessguard_token
    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Expected Set-Cookie header');
    assert.ok(setCookie.includes('accessguard_token='));
    assert.ok(setCookie.includes('HttpOnly') || setCookie.includes('httponly'));

    // SECURITY CHECK: Verify SQLite database does NOT contain plain-text password
    const userInDb = get('SELECT * FROM users WHERE email = ?', 'auditor@accessguard.gov');
    assert.notEqual(userInDb.password_hash, 'SecurePassword123!');
    assert.ok(
      userInDb.password_hash.startsWith('$2a$') || userInDb.password_hash.startsWith('$2b$'),
      'Password must be hashed with bcrypt'
    );
  });

  test('POST /api/auth/register rejects duplicate email with 409 Conflict', async () => {
    const payload = {
      email: 'auditor@accessguard.gov',
      password: 'AnotherPassword456!',
      name: 'Duplicate Auditor',
    };

    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 409);
    const body = await res.json();
    assert.ok(body.error.includes('already exists'));
  });

  test('POST /api/auth/register rejects weak password with 400 Bad Request', async () => {
    const payload = {
      email: 'weak@example.com',
      password: 'short',
      name: 'Weak User',
    };

    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, 'Validation failed');
    assert.ok(body.details.some((d) => d.includes('at least 8 characters')));
  });

  test('POST /api/auth/login succeeds with correct credentials and returns token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'auditor@accessguard.gov',
        password: 'SecurePassword123!',
      }),
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.message, 'Login successful');
    assert.equal(body.user.email, 'auditor@accessguard.gov');
    assert.ok(body.token);

    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie.includes('accessguard_token='));
  });

  test('POST /api/auth/login returns 401 with generic error on incorrect password', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'auditor@accessguard.gov',
        password: 'WrongPassword999!',
      }),
    });

    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error, 'Invalid email or password.');
  });

  test('POST /api/auth/login returns 401 with generic error on non-existent email', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ghost@nonexistent.gov',
        password: 'SomePassword123!',
      }),
    });

    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error, 'Invalid email or password.');
  });

  test('GET /api/auth/me returns current user profile when authenticated via Bearer token', async () => {
    // 1. Login to obtain token
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'auditor@accessguard.gov',
        password: 'SecurePassword123!',
      }),
    });
    const { token } = await loginRes.json();

    // 2. Query /api/auth/me with Bearer token
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    assert.equal(meRes.status, 200);
    const meBody = await meRes.json();
    assert.equal(meBody.user.email, 'auditor@accessguard.gov');
    assert.equal(meBody.user.password_hash, undefined, 'Must not return password_hash');
  });

  test('GET /api/auth/me returns current user profile when authenticated via Cookie', async () => {
    // 1. Login to obtain cookie header
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'auditor@accessguard.gov',
        password: 'SecurePassword123!',
      }),
    });
    const cookieHeader = loginRes.headers.get('set-cookie');

    // 2. Query /api/auth/me with Cookie header
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Cookie: cookieHeader,
      },
    });

    assert.equal(meRes.status, 200);
    const meBody = await meRes.json();
    assert.equal(meBody.user.email, 'auditor@accessguard.gov');
  });

  test('GET /api/auth/me returns 401 when no token or cookie is supplied', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.ok(body.error.includes('Authentication required'));
  });

  test('POST /api/auth/logout clears the authentication cookie', async () => {
    const res = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.message, 'Logged out successfully');

    const setCookie = res.headers.get('set-cookie');
    assert.ok(setCookie, 'Expected Set-Cookie header');
    assert.ok(
      setCookie.includes('accessguard_token=;') || setCookie.includes('Max-Age=0') || setCookie.includes('Expires='),
      'Cookie must be cleared'
    );
  });
});
