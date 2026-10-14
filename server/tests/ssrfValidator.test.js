import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { validateScanUrl, isForbiddenIp, cachedDnsLookup, clearDnsCache } from '../src/services/ssrfValidator.js';

describe('SSRF Protection Validator', () => {
  beforeEach(() => {
    clearDnsCache();
  });

  describe('isForbiddenIp()', () => {
    test('Flags loopback IPv4 and IPv6 as forbidden', () => {
      assert.equal(isForbiddenIp('127.0.0.1'), true);
      assert.equal(isForbiddenIp('127.0.1.1'), true);
      assert.equal(isForbiddenIp('::1'), true);
      assert.equal(isForbiddenIp('0.0.0.0'), true);
    });

    test('Flags RFC 1918 private IP spaces as forbidden', () => {
      assert.equal(isForbiddenIp('10.0.0.1'), true);
      assert.equal(isForbiddenIp('10.254.1.99'), true);
      assert.equal(isForbiddenIp('172.16.0.1'), true);
      assert.equal(isForbiddenIp('172.31.255.254'), true);
      assert.equal(isForbiddenIp('192.168.0.1'), true);
      assert.equal(isForbiddenIp('192.168.1.254'), true);
    });

    test('Flags cloud provider metadata and link-local as forbidden', () => {
      assert.equal(isForbiddenIp('169.254.169.254'), true); // AWS / GCP / Azure metadata endpoint
      assert.equal(isForbiddenIp('fe80::1'), true);
    });

    test('Allows public routable IP addresses', () => {
      assert.equal(isForbiddenIp('93.184.216.34'), false); // example.com
      assert.equal(isForbiddenIp('8.8.8.8'), false);
      assert.equal(isForbiddenIp('1.1.1.1'), false);
    });
  });

  describe('validateScanUrl()', () => {
    test('Rejects non-HTTP/HTTPS protocols', async () => {
      const fileRes = await validateScanUrl('file:///etc/passwd');
      assert.equal(fileRes.valid, false);
      assert.ok(fileRes.reason.includes('Forbidden protocol'));

      const ftpRes = await validateScanUrl('ftp://example.com/file');
      assert.equal(ftpRes.valid, false);
      assert.ok(ftpRes.reason.includes('Forbidden protocol'));

      const jsRes = await validateScanUrl('javascript:alert(1)');
      assert.equal(jsRes.valid, false);
    });

    test('Rejects localhost and reserved domain names', async () => {
      const res1 = await validateScanUrl('http://localhost:3000');
      assert.equal(res1.valid, false);
      assert.ok(res1.reason.includes('reserved hostnames'));

      const res2 = await validateScanUrl('http://metadata.google.internal');
      assert.equal(res2.valid, false);
    });

    test('Rejects private IP targets directly in URL', async () => {
      const res = await validateScanUrl('http://192.168.1.1/admin');
      assert.equal(res.status || res.valid, false);
    });

    test('Rejects cloud metadata IP directly in URL', async () => {
      const res = await validateScanUrl('http://169.254.169.254/latest/meta-data/');
      assert.equal(res.valid, false);
    });

    test('Accepts valid public websites', async () => {
      const res = await validateScanUrl('https://example.com');
      assert.equal(res.valid, true);
      assert.equal(res.sanitizedUrl, 'https://example.com/');
    });
  });

  describe('cachedDnsLookup() & Transient DNS Retry Resilience', () => {
    test('Transient ENOTFOUND on first attempt succeeds on retry 1', async () => {
      let callCount = 0;
      const mockLookup = async (hostname) => {
        callCount++;
        if (callCount === 1) {
          const err = new Error(`getaddrinfo ENOTFOUND ${hostname}`);
          err.code = 'ENOTFOUND';
          throw err;
        }
        return [{ address: '93.184.216.34', family: 4 }];
      };

      const records = await cachedDnsLookup('transient1.example.com', {
        lookupFn: mockLookup,
        backoffs: [10, 20],
      });

      assert.equal(callCount, 2);
      assert.equal(records.length, 1);
      assert.equal(records[0].address, '93.184.216.34');
    });

    test('Transient ETIMEDOUT on attempt 1 and 2 succeeds on retry 2', async () => {
      let callCount = 0;
      const mockLookup = async (hostname) => {
        callCount++;
        if (callCount <= 2) {
          const err = new Error(`queryA ETIMEDOUT ${hostname}`);
          err.code = 'ETIMEDOUT';
          throw err;
        }
        return [{ address: '93.184.216.34', family: 4 }];
      };

      const records = await cachedDnsLookup('transient2.example.com', {
        lookupFn: mockLookup,
        backoffs: [10, 20],
      });

      assert.equal(callCount, 3);
      assert.equal(records[0].address, '93.184.216.34');
    });

    test('Retries exhausted: fails after maximum of 2 retries on persistent ENOTFOUND', async () => {
      let callCount = 0;
      const mockLookup = async (hostname) => {
        callCount++;
        const err = new Error(`getaddrinfo ENOTFOUND ${hostname}`);
        err.code = 'ENOTFOUND';
        throw err;
      };

      await assert.rejects(
        async () => {
          await cachedDnsLookup('failing.example.com', {
            lookupFn: mockLookup,
            backoffs: [10, 20],
          });
        },
        (err) => {
          assert.equal(err.code, 'ENOTFOUND');
          return true;
        }
      );

      // Total attempts = initial (1) + 2 retries = 3
      assert.equal(callCount, 3);
    });

    test('Permanent non-transient error (e.g. EINVAL) fails immediately without retrying', async () => {
      let callCount = 0;
      const mockLookup = async () => {
        callCount++;
        const err = new Error('Invalid DNS argument');
        err.code = 'EINVAL';
        throw err;
      };

      await assert.rejects(
        async () => {
          await cachedDnsLookup('invalid.example.com', {
            lookupFn: mockLookup,
            backoffs: [10, 20],
          });
        },
        (err) => {
          assert.equal(err.code, 'EINVAL');
          return true;
        }
      );

      // Must NOT retry permanent error
      assert.equal(callCount, 1);
    });

    test('validateScanUrl() succeeds when transient DNS error recovers within retries', async () => {
      let callCount = 0;
      const mockLookup = async () => {
        callCount++;
        if (callCount === 1) {
          const err = new Error('getaddrinfo EAI_AGAIN');
          err.code = 'EAI_AGAIN';
          throw err;
        }
        return [{ address: '93.184.216.34', family: 4 }];
      };

      const res = await validateScanUrl('https://recovering-host.example.com', {
        lookupFn: mockLookup,
        backoffs: [10, 20],
      });

      assert.equal(res.valid, true);
      assert.equal(res.sanitizedUrl, 'https://recovering-host.example.com/');
      assert.equal(callCount, 2);
    });

    test('validateScanUrl() safely rejects URL when DNS retries are completely exhausted', async () => {
      let callCount = 0;
      const mockLookup = async () => {
        callCount++;
        const err = new Error('getaddrinfo ENOTFOUND');
        err.code = 'ENOTFOUND';
        throw err;
      };

      const res = await validateScanUrl('https://exhausted-dns.example.com', {
        lookupFn: mockLookup,
        backoffs: [10, 20],
      });

      assert.equal(res.valid, false);
      assert.ok(res.reason.includes('DNS lookup failed for hostname'));
      assert.equal(callCount, 3);
    });

    test('validateScanUrl() does not bypass security when resolved IP is in private range', async () => {
      // Even if DNS succeeds, private IP must be rejected immediately without retrying
      let callCount = 0;
      const mockLookup = async () => {
        callCount++;
        return [{ address: '192.168.1.100', family: 4 }];
      };

      const res = await validateScanUrl('https://malicious-private.example.com', {
        lookupFn: mockLookup,
        backoffs: [10, 20],
      });

      assert.equal(res.valid, false);
      assert.ok(res.reason.includes('Security violation: Domain resolves to forbidden address'));
      assert.equal(callCount, 1);
    });
  });
});
