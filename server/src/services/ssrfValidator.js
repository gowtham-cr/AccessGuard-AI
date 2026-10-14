import dns from 'node:dns/promises';
import ipaddr from 'ipaddr.js';

/**
 * SSRF Protection Architecture & Validator
 * 
 * Public Digital Service Scanner Security Requirements:
 * When scanning public websites, the scanner MUST NOT be leveraged as an SSRF proxy
 * to probe internal infrastructure, loopback endpoints, cloud metadata APIs,
 * or private networks.
 * 
 * Defense-in-depth Strategy:
 * 1. Pre-Scan Validation:
 *    - Scheme check (strictly http: and https:)
 *    - Hostname check (disallowing localhost, numeric IPs, etc.)
 *    - DNS pre-resolution to all A/AAAA records
 *    - CIDR range inspection using ipaddr.js against all private/reserved ranges
 * 
 * 2. In-Scan Browser Interception:
 *    - Playwright context.route to intercept ALL navigation, subresources, and redirect requests
 *    - Validates every redirect target (protecting against DNS rebinding and open redirect SSRF)
 *    - Aborts requests attempting to reach private IPs or forbidden schemes
 */

// Forbidden IP ranges across IPv4 and IPv6
const FORBIDDEN_RANGES = [
  'unspecified',      // 0.0.0.0/8, ::/128
  'loopback',         // 127.0.0.0/8, ::1
  'private',          // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
  'linkLocal',        // 169.254.0.0/16, fe80::/10 (includes AWS/GCP/Azure metadata 169.254.169.254)
  'carrierGradeNat',  // 100.64.0.0/10
  'broadcast',        // 255.255.255.255
  'multicast',        // 224.0.0.0/4, ff00::/8
  'reserved',         // 240.0.0.0/4
  'uniqueLocal',      // fc00::/7
];

const FORBIDDEN_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'broadcasthost',
  'metadata.google.internal',
  'instance-data',
]);

// Transient DNS error codes that warrant a retry on network glitches
const TRANSIENT_DNS_ERRORS = new Set([
  'ENOTFOUND',
  'ETIMEDOUT',
  'EAI_AGAIN',
]);

// Lightweight DNS cache to avoid repeated lookups during browser resource fetches
const dnsCache = new Map();
const DNS_CACHE_TTL_MS = 60 * 1000;

export function clearDnsCache() {
  dnsCache.clear();
}

/**
 * Lightweight DNS lookup with caching and transient error retry.
 * Performs up to 2 retries on transient resolver errors (ENOTFOUND, ETIMEDOUT, EAI_AGAIN)
 * with exponential backoff (~250ms, ~500ms).
 */
export async function cachedDnsLookup(hostname, options = {}) {
  const cached = dnsCache.get(hostname);
  const now = Date.now();
  if (cached && now - cached.timestamp < DNS_CACHE_TTL_MS) {
    return cached.records;
  }

  const lookupFn = options.lookupFn || dns.lookup;
  const backoffs = options.backoffs || [250, 500]; // Max 2 retries after initial lookup
  let lastError;

  for (let attempt = 0; attempt <= backoffs.length; attempt++) {
    try {
      const records = await lookupFn(hostname, { all: true });
      dnsCache.set(hostname, { records, timestamp: Date.now() });
      return records;
    } catch (err) {
      lastError = err;
      const isTransient = err && TRANSIENT_DNS_ERRORS.has(err.code);
      if (!isTransient || attempt >= backoffs.length) {
        break;
      }
      const delayMs = backoffs[attempt];
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

/**
 * Checks if a given IP address string is in a forbidden private/reserved range.
 * @param {string} ipString
 * @param {object} options
 * @param {boolean} options.allowLocalhost - If true, only loopback is permitted (used exclusively for local test fixtures)
 * @returns {boolean} True if the IP is forbidden
 */
export function isForbiddenIp(ipString, options = {}) {
  const allowLocalhost = Boolean(options.allowLocalhost);

  try {
    const addr = ipaddr.parse(ipString);
    const range = addr.range();

    if (allowLocalhost && range === 'loopback') {
      return false;
    }

    if (FORBIDDEN_RANGES.includes(range)) {
      return true;
    }

    // Explicit check for IPv4 mapped into IPv6 (e.g. ::ffff:127.0.0.1)
    if (addr.kind() === 'ipv6' && addr.isIPv4MappedAddress()) {
      const v4Addr = addr.toIPv4Address();
      const v4Range = v4Addr.range();
      if (allowLocalhost && v4Range === 'loopback') {
        return false;
      }
      return FORBIDDEN_RANGES.includes(v4Range);
    }

    return false;
  } catch {
    // If it cannot be parsed, treat as unsafe
    return true;
  }
}

/**
 * Validates a target URL against SSRF vulnerabilities.
 * @param {string} rawUrl
 * @param {object} options
 * @param {boolean} options.allowLocalhost
 * @returns {Promise<{ valid: boolean, sanitizedUrl?: string, reason?: string }>}
 */
export async function validateScanUrl(rawUrl, options = {}) {
  const allowLocalhost = Boolean(options.allowLocalhost);

  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, reason: 'A valid URL string is required.' };
  }

  const trimmed = rawUrl.trim();
  if (trimmed.length > 2048) {
    return { valid: false, reason: 'URL exceeds maximum length of 2048 characters.' };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    return { valid: false, reason: 'Malformed URL format. Please include protocol, e.g. https://example.com' };
  }

  // 1. Strict Protocol check
  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return {
      valid: false,
      reason: `Forbidden protocol "${parsedUrl.protocol}". Only http: and https: are permitted.`,
    };
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  // 2. Disallow credentials in URL
  if (parsedUrl.username || parsedUrl.password) {
    return { valid: false, reason: 'URLs containing user credentials are not permitted.' };
  }

  // 3. Disallow forbidden hostnames
  if (!allowLocalhost) {
    if (FORBIDDEN_HOSTNAMES.has(hostname) || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
      return { valid: false, reason: 'Targeting local or reserved hostnames is prohibited.' };
    }
  } else {
    // Even in local fixture mode, cloud metadata and internal hostnames are strictly blocked
    if (hostname === 'metadata.google.internal' || hostname === 'instance-data') {
      return { valid: false, reason: 'Targeting cloud metadata endpoints is strictly prohibited.' };
    }
  }

  // 4. Disallow raw IP inputs if they are in private/reserved ranges
  if (ipaddr.isValid(hostname)) {
    if (isForbiddenIp(hostname, { allowLocalhost })) {
      return { valid: false, reason: 'Targeting private or local IP addresses is prohibited.' };
    }
  }

  // 5. DNS Resolution check (Pre-scan resolution)
  try {
    const lookupResults = await cachedDnsLookup(hostname, options);

    if (!lookupResults || lookupResults.length === 0) {
      return { valid: false, reason: 'Unable to resolve hostname via DNS.' };
    }

    for (const record of lookupResults) {
      if (isForbiddenIp(record.address, { allowLocalhost })) {
        return {
          valid: false,
          reason: `Security violation: Domain resolves to forbidden address (${record.address}). Private networks and cloud metadata endpoints cannot be scanned.`,
        };
      }
    }
  } catch (dnsErr) {
    return {
      valid: false,
      reason: `DNS lookup failed for hostname "${hostname}": ${dnsErr.message}`,
    };
  }

  return {
    valid: true,
    sanitizedUrl: parsedUrl.toString(),
  };
}

/**
 * Validates individual requests and redirects intercepted inside Playwright browser sessions.
 * @param {string} targetUrl
 * @param {object} options
 * @param {boolean} options.allowLocalhost
 * @returns {Promise<boolean>} True if safe, false if blocked
 */
export async function isRequestSafe(targetUrl, options = {}) {
  try {
    const parsed = new URL(targetUrl);

    // Allow inlined assets (data: images/fonts, blob: objects)
    if (parsed.protocol === 'data:' || parsed.protocol === 'blob:') {
      return true;
    }

    // Only http: and https: allowed for network traffic
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    const allowLocalhost = Boolean(options.allowLocalhost);

    if (!allowLocalhost) {
      if (FORBIDDEN_HOSTNAMES.has(hostname) || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
        return false;
      }
    } else {
      if (hostname === 'metadata.google.internal' || hostname === 'instance-data') {
        return false;
      }
    }

    // If direct IP literal
    if (ipaddr.isValid(hostname)) {
      if (isForbiddenIp(hostname, { allowLocalhost })) {
        return false;
      }
    }

    // DNS pre-check for network connection
    const lookupResults = await cachedDnsLookup(hostname, options);
    for (const record of lookupResults) {
      if (isForbiddenIp(record.address, { allowLocalhost })) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}
