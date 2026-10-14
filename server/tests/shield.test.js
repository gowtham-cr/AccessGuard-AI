import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../src/app.js';
import { analyzeMessage, inspectWebsiteSafely } from '../src/services/shieldService.js';

describe('Senior Safety Shield Backend Service & API Routes', () => {
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

  describe('analyzeMessage() — Deterministic Scam & Threat Analysis', () => {
    test('Flags urgent electricity disconnection threat with payment demand as High Risk', () => {
      const msg = 'Dear consumer your electricity power will be disconnected tonight at 9:30 PM. Call our BESCOM officer immediately to pay your pending water bill.';
      const res = analyzeMessage(msg);

      assert.equal(res.riskLevel, 'High Risk');
      assert.ok(res.warningSigns.length >= 2);
      assert.ok(res.warningSigns.some(w => w.category === 'Urgency & Pressure'));
      assert.ok(res.warningSigns.some(w => w.category === 'Entity Claim / Impersonation'));
      assert.match(res.explanation, /strong warning signs/i);
      assert.ok(res.safeNextSteps.length >= 3);
      assert.ok(res.disclaimer.includes('cannot guarantee'));
    });

    test('Flags OTP and banking credential solicitations as High Risk with granular evidence', () => {
      const msg = 'Your SBI bank account is suspended due to KYC expired. Please share OTP 482910 to verify your identity and send PIN to prevent card block.';
      const res = analyzeMessage(msg);

      assert.equal(res.riskLevel, 'High Risk');
      assert.ok(res.warningSigns.some(w => w.category === 'Sensitive Credentials'));
      assert.ok(res.warningSigns.some(w => w.id === 'otp_request'));
      assert.ok(res.warningSigns.some(w => w.id === 'pin_password'));
      assert.ok(res.warningSigns.some(w => w.id === 'kyc_expired'));
    });

    test('Flags obfuscated shortened links as Suspicious Links', () => {
      const msg = 'Important update regarding your pension payment. Check status here: http://bit.ly/pension-kyc-update';
      const res = analyzeMessage(msg);

      assert.ok(res.riskLevel === 'Needs Verification' || res.riskLevel === 'High Risk');
      assert.ok(res.warningSigns.some(w => w.category === 'Suspicious Links'));
      assert.ok(res.warningSigns.some(w => w.id === 'shortener'));
      assert.match(res.warningSigns.find(w => w.id === 'shortener').evidence, /bit\.ly/);
    });

    test('Flags deceptive brand lookalike domains and raw IP links', () => {
      const msg1 = 'Update your netbanking now at http://sbi-login.xyz/portal';
      const res1 = analyzeMessage(msg1);
      assert.ok(res1.warningSigns.some(w => w.category === 'Suspicious Links'));

      const msg2 = 'Server access required: visit http://192.168.1.100/admin';
      const res2 = analyzeMessage(msg2);
      assert.ok(res2.warningSigns.some(w => w.id === 'ip_url'));
    });

    test('Evaluates ordinary non-threatening personal messages as No Obvious Warning Signs', () => {
      const msg = 'Good morning Grandma! We are coming over for Sunday lunch around 1 PM. Let me know if you need any groceries from the store.';
      const res = analyzeMessage(msg);

      assert.equal(res.riskLevel, 'No Obvious Warning Signs');
      assert.equal(res.warningSigns.length, 0);
      assert.match(res.explanation, /No typical scam/i);
    });

    test('Rejects invalid input types and empty messages with clear errors', () => {
      assert.throws(() => analyzeMessage(''), /cannot be empty/i);
      assert.throws(() => analyzeMessage('   '), /cannot be empty/i);
      assert.throws(() => analyzeMessage(null), /must be a string/i);
      assert.throws(() => analyzeMessage(12345), /must be a string/i);
    });

    test('Rejects oversized payloads exceeding 5000 characters', () => {
      const oversized = 'a'.repeat(5001);
      assert.throws(() => analyzeMessage(oversized), /exceeds maximum allowed length/i);
    });
  });

  describe('inspectWebsiteSafely() — SSRF Defense & Observable Security Checks', () => {
    test('Strictly blocks localhost and loopback targets (SSRF defense)', async () => {
      const res = await inspectWebsiteSafely('http://localhost:5000');
      assert.equal(res.valid, false);
      assert.equal(res.riskLevel, 'High Risk');
      assert.equal(res.status, 'Blocked Destination');
      assert.match(res.reason, /reserved hostnames|local/i);
      assert.ok(res.findings.some(f => f.id === 'ssrf_blocked'));
    });

    test('Strictly blocks RFC 1918 private IP addresses', async () => {
      const res1 = await inspectWebsiteSafely('http://192.168.1.1/router');
      assert.equal(res1.valid, false);
      assert.equal(res1.status, 'Blocked Destination');

      const res2 = await inspectWebsiteSafely('http://10.0.0.1/admin');
      assert.equal(res2.valid, false);
      assert.equal(res2.status, 'Blocked Destination');
    });

    test('Strictly blocks cloud provider metadata endpoints (169.254.169.254 & metadata.google.internal)', async () => {
      const res1 = await inspectWebsiteSafely('http://169.254.169.254/latest/meta-data/');
      assert.equal(res1.valid, false);
      assert.equal(res1.status, 'Blocked Destination');

      const res2 = await inspectWebsiteSafely('http://metadata.google.internal/computeMetadata/v1/');
      assert.equal(res2.valid, false);
      assert.equal(res2.status, 'Blocked Destination');
    });

    test('Rejects non-HTTP protocols (file, ftp, javascript)', async () => {
      const res1 = await inspectWebsiteSafely('file:///etc/passwd');
      assert.equal(res1.valid, false);

      const res2 = await inspectWebsiteSafely('javascript:alert(1)');
      assert.equal(res2.valid, false);
    });

    test('Blocks unsafe redirects attempting to reach internal/private addresses', async () => {
      const mockDnsLookup = async () => [{ address: '93.184.216.34', family: 4 }];
      const mockFetchFn = async () => {
        return {
          status: 'Blocked Redirect',
          findings: [
            {
              id: 'unsafe_redirect_ssrf',
              title: 'Unsafe Redirect to Forbidden Address',
              severity: 'Critical',
              description: 'Website attempted to redirect to an unsafe or private destination',
            },
          ],
          securityHeaders: {},
        };
      };

      const res = await inspectWebsiteSafely('https://public-service.example.com', {
        allowLocalhost: true,
        lookupFn: mockDnsLookup,
        fetchFn: mockFetchFn,
      });

      assert.equal(res.riskLevel, 'High Risk');
      assert.ok(res.findings.some(f => f.id === 'unsafe_redirect_ssrf'));
    });

    test('Handles network timeouts or connection failures safely with "Unable to verify"', async () => {
      const mockDnsLookup = async () => [{ address: '93.184.216.34', family: 4 }];
      const mockFetchFn = async () => {
        return {
          status: 'Unable to verify',
          findings: [
            {
              id: 'unreachable',
              title: 'Site Unreachable or Timed Out',
              severity: 'Medium',
              description: 'Could not connect to host within 5 seconds: Connection timed out',
            },
          ],
          securityHeaders: {},
        };
      };

      const res = await inspectWebsiteSafely('https://slow-unreachable-site.example.com', {
        allowLocalhost: true,
        lookupFn: mockDnsLookup,
        fetchFn: mockFetchFn,
      });

      assert.equal(res.riskLevel, 'Unable to verify');
      assert.equal(res.status, 'Unable to verify');
      assert.match(res.explanation, /could not be reliably verified/i);
    });

    test('Evaluates reachable HTTPS website with security headers and notes limitations', async () => {
      const mockDnsLookup = async () => [{ address: '93.184.216.34', family: 4 }];
      const mockFetchFn = async () => {
        return {
          status: 'Reachable',
          findings: [],
          securityHeaders: {
            hsts: true,
            csp: true,
            xfo: true,
            xcto: true,
          },
        };
      };

      const res = await inspectWebsiteSafely('https://reputable-portal.example.com', {
        allowLocalhost: true,
        lookupFn: mockDnsLookup,
        fetchFn: mockFetchFn,
      });

      assert.equal(res.valid, true);
      assert.equal(res.riskLevel, 'No Obvious Warning Signs');
      assert.equal(res.httpsEnabled, true);
      assert.equal(res.securityHeaders.hsts, true);
      assert.ok(res.limitations.includes('Automated inspection analyzes domain patterns'));
      assert.ok(res.safeNextSteps.length >= 2);
    });
  });

  describe('API Endpoints (/api/shield)', () => {
    test('POST /api/shield/check-message succeeds with 200 and structured analysis', async () => {
      const res = await fetch(`${baseUrl}/api/shield/check-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'URGENT: Your electricity power bill is unpaid. Power will be disconnected in 2 hours. Call 9876543210 immediately to pay.',
        }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.riskLevel, 'High Risk');
      assert.ok(Array.isArray(data.warningSigns));
      assert.ok(typeof data.explanation === 'string');
      assert.ok(Array.isArray(data.safeNextSteps));
      assert.ok(typeof data.disclaimer === 'string');
    });

    test('POST /api/shield/check-message rejects empty or missing message with 400', async () => {
      const res1 = await fetch(`${baseUrl}/api/shield/check-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '' }),
      });
      assert.equal(res1.status, 400);

      const res2 = await fetch(`${baseUrl}/api/shield/check-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.equal(res2.status, 400);
    });

    test('POST /api/shield/check-message rejects oversized message (> 5000 chars) with 400', async () => {
      const res = await fetch(`${baseUrl}/api/shield/check-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'x'.repeat(5001) }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.match(data.error, /exceeds maximum length/i);
    });

    test('POST /api/shield/check-url strictly blocks localhost with 200 and SSRF blocked finding', async () => {
      const res = await fetch(`${baseUrl}/api/shield/check-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'http://localhost:5000' }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.valid, false);
      assert.equal(data.riskLevel, 'High Risk');
      assert.equal(data.status, 'Blocked Destination');
      assert.ok(data.findings.some(f => f.id === 'ssrf_blocked'));
    });

    test('POST /api/shield/check-url strictly blocks RFC1918 private IP with 200 and SSRF blocked finding', async () => {
      const res = await fetch(`${baseUrl}/api/shield/check-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'http://192.168.1.1/admin' }),
      });

      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.valid, false);
      assert.equal(data.status, 'Blocked Destination');
      assert.ok(data.findings.some(f => f.id === 'ssrf_blocked'));
    });

    test('POST /api/shield/check-url rejects empty or missing url with 400', async () => {
      const res1 = await fetch(`${baseUrl}/api/shield/check-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: '' }),
      });
      assert.equal(res1.status, 400);
      const data1 = await res1.json();
      assert.match(data1.error, /URL cannot be empty|valid "url" string/i);

      const res2 = await fetch(`${baseUrl}/api/shield/check-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.equal(res2.status, 400);
    });

    test('POST /api/shield/check-url rejects oversized url (> 2048 chars) with 400', async () => {
      const res = await fetch(`${baseUrl}/api/shield/check-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/' + 'a'.repeat(2050) }),
      });
      assert.equal(res.status, 400);
      const data = await res.json();
      assert.match(data.error, /exceeds maximum length/i);
    });
  });
});
