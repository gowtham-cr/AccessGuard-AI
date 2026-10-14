import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';
import { validateScanUrl } from './ssrfValidator.js';

/**
 * Senior Safety Shield — Backend Service
 * 
 * Provides:
 * 1. analyzeMessage(text): Deterministic, explainable rule-based scam & phishing detection.
 *    - Never logs or stores submitted message contents.
 * 2. inspectWebsiteSafely(url, options): SSRF-guarded, unprivileged website inspection.
 *    - Reuses validateScanUrl for strict DNS/IP validation.
 *    - Validates redirects before following.
 *    - Does not execute page JavaScript, submit forms, or click links.
 */

// Heuristic patterns for message analysis
const URGENCY_PATTERNS = [
  { id: 'urgent_deadline', regex: /\b(within|in)\s+(\d+|one|two|three|four|five|ten|twentyfour)\s+(hours?|hrs?|minutes?|mins?)\b/i, label: 'Strict Time Limit Pressure' },
  { id: 'immediate_action', regex: /\b(immediately|urgent(ly)?|act now|today only|last chance|hurry)\b/i, label: 'Urgent Action Demand' },
  { id: 'utility_threat', regex: /\b(electricity|power|bescom|bwssb|water bill|gas connection)\s+(will be\s+)?(cut|disconnected|stopped)\s*(tonight|today|by \d+)?\b/i, label: 'Utility Disconnection Threat' },
  { id: 'account_threat', regex: /\b(account|sim|card|service|pan card|aadhaar)\s+(will be\s+)?(blocked|suspended|deactivated|closed|frozen)\b/i, label: 'Service / Account Suspension Threat' },
  { id: 'legal_threat', regex: /\b(arrest( warrant)?|police case|legal action|court notice|penalty of rs|digital arrest)\b/i, label: 'Legal Coercion / Threat' },
];

const CREDENTIAL_PATTERNS = [
  { id: 'otp_request', regex: /\b(share|send|tell|enter|forward|give)\s+(the\s+)?(otp|one[\s-]time[\s-]password|verification code)\b/i, label: 'OTP Solicitation' },
  { id: 'pin_password', regex: /\b(pin|mpin|upi[\s-]pin|atm[\s-]pin|banking password|cvv|security code)\b/i, label: 'Banking PIN or Password Request' },
  { id: 'kyc_update', regex: /\b(update|link|verify)\s+(your\s+)?(kyc|pan card|aadhaar|bank details|netbanking)\b/i, label: 'Unsolicited KYC / Identity Update' },
  { id: 'kyc_expired', regex: /\b(kyc\s+(has\s+)?expired|pan\s+card\s+blocked|aadhaar\s+suspended)\b/i, label: 'Fake Document Expiry Notice' },
];

const SUSPICIOUS_URL_PATTERNS = [
  { id: 'shortener', regex: /\b(?:https?:\/\/)?(bit\.ly|tinyurl\.com|is\.gd|t\.co|cutt\.ly|rb\.gy|shorturl\.at|goo\.gl|ow\.ly)\/[a-zA-Z0-9_-]+/i, label: 'Obfuscated Shortened Link' },
  { id: 'ip_url', regex: /\bhttps?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?(?:\/[^\s]*)?/i, label: 'Direct IP Address Link (No Domain Name)' },
  { id: 'suspicious_tld', regex: /\bhttps?:\/\/[a-zA-Z0-9.-]+\.(top|xyz|club|work|click|buzz|cam|loan|gq|cf|ml)\b/i, label: 'High-Abuse Domain Extension' },
  { id: 'spoofed_domain', regex: /\bhttps?:\/\/[a-zA-Z0-9.-]*(sbi|hdfc|icici|paytm|rbi|gov-in|epfo)[\w.-]*\.(?!gov\.in|nic\.in)[a-zA-Z]{2,}(?:\/[^\s]*)?/i, label: 'Deceptive Lookalike Subdomain or Brand Spoof' },
];

const IMPERSONATION_PATTERNS = [
  { id: 'bank_name', regex: /\b(state bank of india|sbi|hdfc bank|icici bank|axis bank|punjab national bank|pnb|canara bank|reserve bank of india|rbi)\b/i, label: 'Bank or Financial Institution Claim' },
  { id: 'utility_name', regex: /\b(bescom|bwssb|kptcl|electricity board|discom|mahanagar gas|electricity power bill)\b/i, label: 'Civic Utility Provider Claim' },
  { id: 'gov_agency', regex: /\b(income tax department|epfo|provident fund|trai|telecom regulatory|india post|speed post|cyber police)\b/i, label: 'Government / Regulatory Authority Claim' },
  { id: 'fake_lottery', regex: /\b(congratulations you (have )?won|lottery winner|lucky draw|kaun banega crorepati|kbc|cash prize|cashback of rs|prize money)\b/i, label: 'Unsolicited Lottery / Prize Claim' },
];

const PAYMENT_DEMAND_PATTERNS = [
  { id: 'payment_demand', regex: /\b(pay (your\s+)?(pending\s+)?(bill|amount|fee|dues)|call\s+\d{10}\s+immediately\s+to\s+pay|transfer rs|unpaid bill)\b/i, label: 'Unsolicited Payment or Call Pressure' },
];

/**
 * Analyze an incoming message text using deterministic rules.
 * Never logs or stores submitted message contents.
 *
 * @param {string} text - Message content to inspect
 * @returns {object} Analysis findings, risk level, and guidance
 */
export function analyzeMessage(text) {
  if (typeof text !== 'string') {
    throw new Error('Message text is required and must be a string.');
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new Error('Message text cannot be empty.');
  }

  if (trimmed.length > 5000) {
    throw new Error('Message text exceeds maximum allowed length of 5000 characters.');
  }

  const warningSigns = [];
  const seenIds = new Set();

  function scanCategory(patterns, category, defaultDescription) {
    for (const pat of patterns) {
      if (seenIds.has(pat.id)) continue;
      const match = trimmed.match(pat.regex);
      if (match) {
        seenIds.add(pat.id);
        warningSigns.push({
          id: pat.id,
          category,
          title: pat.label,
          evidence: match[0],
          description: pat.description || defaultDescription,
        });
      }
    }
  }

  scanCategory(URGENCY_PATTERNS, 'Urgency & Pressure', 'Scammers frequently create artificial emergencies to induce panic and bypass careful verification.');
  scanCategory(CREDENTIAL_PATTERNS, 'Sensitive Credentials', 'Legitimate organizations like banks and utility boards never ask for your OTP, PIN, password, or CVV over SMS or WhatsApp.');
  scanCategory(SUSPICIOUS_URL_PATTERNS, 'Suspicious Links', 'The message contains a link that hides its destination or uses an unusual domain name instead of an official portal.');
  scanCategory(IMPERSONATION_PATTERNS, 'Entity Claim / Impersonation', 'The sender claims to represent a recognized organization or offers unearned prizes or refunds.');
  scanCategory(PAYMENT_DEMAND_PATTERNS, 'Payment Demands', 'The message demands urgent payment or money transfer, a common pressure tactic in utility and impersonation scams.');

  // Determine Risk Level
  const hasCredentials = warningSigns.some(w => w.category === 'Sensitive Credentials');
  const hasUrgency = warningSigns.some(w => w.category === 'Urgency & Pressure');
  const hasLink = warningSigns.some(w => w.category === 'Suspicious Links');
  const hasImpersonation = warningSigns.some(w => w.category === 'Entity Claim / Impersonation');
  const hasPaymentDemand = warningSigns.some(w => w.category === 'Payment Demands');
  const hasSevereThreat = warningSigns.some(w => ['utility_threat', 'account_threat', 'legal_threat'].includes(w.id));

  let riskLevel = 'No Obvious Warning Signs';
  let explanation = 'No typical scam or phishing patterns were detected in this message. However, always exercise care: never share banking PINs, OTPs, or passwords with anyone.';
  const safeNextSteps = [
    'Always verify unsolicited requests through official contact numbers found on printed bills or passbooks.',
    'Never share your OTP or UPI PIN with anyone, even if they claim to work for customer support.',
    'If in doubt, show the message to a trusted family member or call your local bank branch.',
  ];

  if (hasCredentials || hasSevereThreat || (hasUrgency && (hasImpersonation || hasLink || hasPaymentDemand))) {
    riskLevel = 'High Risk';
    explanation = 'This message exhibits strong warning signs of a scam. Genuine banks, electricity providers, and government agencies will never ask for your OTP or password, nor will they threaten immediate service cutoffs through casual SMS or WhatsApp messages.';
    safeNextSteps.unshift(
      'DO NOT click any link in this message.',
      'DO NOT reply, send money, or share any verification code (OTP).',
      'If you are concerned about your account or service, call the official phone number printed on your physical bill, card, or passbook.'
    );
  } else if (warningSigns.length >= 1) {
    riskLevel = 'Needs Verification';
    explanation = 'This message contains elements that warrant caution. It may be an unverified commercial alert or an attempt to direct you away from official channels. Do not take immediate action until verified.';
    safeNextSteps.unshift(
      'Pause before responding or clicking.',
      'Contact the alleged organization using verified contact details from their official website, not numbers provided in this text.'
    );
  }

  return {
    riskLevel,
    warningSigns,
    explanation,
    safeNextSteps,
    disclaimer: 'This automated check highlights identifiable scam patterns. It cannot guarantee any message is authentic or fraud-free. Always confirm independently.',
  };
}

/**
 * Safely inspect a website without executing page scripts or clicking links.
 * Employs defense-in-depth SSRF prevention via validateScanUrl.
 *
 * @param {string} rawUrl - Target URL to inspect
 * @param {object} options - Options (e.g. timeout, allowLocalhost, lookupFn, fetchFn)
 * @returns {Promise<object>} Diagnostic findings and risk evaluation
 */
export async function inspectWebsiteSafely(rawUrl, options = {}) {
  // 1. Strict SSRF and URL format validation using existing validator
  const valResult = await validateScanUrl(rawUrl, {
    allowLocalhost: Boolean(options.allowLocalhost),
    lookupFn: options.lookupFn,
  });

  if (!valResult.valid) {
    const isDnsFailure = valResult.reason && (
      valResult.reason.includes('DNS lookup failed') ||
      valResult.reason.includes('Unable to resolve hostname')
    );

    if (isDnsFailure) {
      return {
        url: rawUrl,
        valid: false,
        riskLevel: 'Unable to verify',
        status: 'Unable to verify',
        reason: valResult.reason,
        findings: [
          {
            id: 'dns_unresolvable',
            title: 'Unable to Resolve Address',
            severity: 'Medium',
            description: valResult.reason,
          },
        ],
        explanation: 'The website address could not be resolved via DNS or reached online. It may be offline, misspelled, or inaccessible.',
        limitations: 'Websites that cannot be reached cannot be inspected.',
        safeNextSteps: [
          'Double-check the website address for spelling errors.',
          'Verify if the service is currently operating using known official channels.',
        ],
      };
    }

    return {
      url: rawUrl,
      valid: false,
      riskLevel: 'High Risk',
      status: 'Blocked Destination',
      reason: valResult.reason,
      findings: [
        {
          id: 'ssrf_blocked',
          title: 'Dangerous Destination Blocked',
          severity: 'Critical',
          description: valResult.reason,
        },
      ],
      explanation: 'Access to this address was blocked by AccessGuard-AI safety controls. It targets a local, private, or restricted internal address space (SSRF defense).',
      limitations: 'Local and private network targets cannot be audited through this public safety tool.',
      safeNextSteps: [
        'Do not visit or trust internal or private IP addresses received from external sources.',
      ],
    };
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(valResult.sanitizedUrl || rawUrl.trim());
  } catch {
    return {
      url: rawUrl,
      valid: false,
      riskLevel: 'High Risk',
      status: 'Malformed URL',
      reason: 'URL could not be parsed.',
      findings: [{ id: 'malformed_url', title: 'Malformed URL', severity: 'Critical', description: 'Invalid URL structure' }],
      explanation: 'The provided address is not a valid web URL.',
      limitations: 'Malformed addresses cannot be inspected.',
      safeNextSteps: ['Check for typing mistakes and ensure the address includes https://'],
    };
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const isHttps = parsedUrl.protocol === 'https:';
  const findings = [];

  // Observable Domain Analysis (Passive checks)
  // Check 1: Unencrypted HTTP
  if (!isHttps) {
    findings.push({
      id: 'no_https',
      title: 'Unencrypted Connection (HTTP)',
      severity: 'Medium',
      description: 'This address uses plain HTTP without encryption. Any data entered could be intercepted on public or Wi-Fi networks.',
    });
  } else {
    findings.push({
      id: 'https_present',
      title: 'Encrypted Transport (HTTPS)',
      severity: 'Info',
      description: 'Transport encryption is present. NOTE: HTTPS only means the connection is encrypted; it does not guarantee the site owner is legitimate.',
    });
  }

  // Check 2: Raw IP hostname
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    findings.push({
      id: 'raw_ip_host',
      title: 'Direct Numeric IP Address',
      severity: 'High',
      description: 'The link directs to a numeric IP address rather than a registered domain name. Legitimate public services almost never use raw IP links.',
    });
  }

  // Check 3: Suspicious TLD
  if (/\.(top|xyz|club|work|click|buzz|cam|loan|gq|cf|ml)$/i.test(hostname)) {
    findings.push({
      id: 'suspicious_tld',
      title: 'Uncommon or High-Abuse Domain Extension',
      severity: 'Medium',
      description: `The domain ends with .${hostname.split('.').pop()}, which is frequently associated with disposable scam sites.`,
    });
  }

  // Check 4: Excessive subdomains or hyphens
  const parts = hostname.split('.');
  if (parts.length > 4) {
    findings.push({
      id: 'excessive_subdomains',
      title: 'Unusually Complex Subdomain Structure',
      severity: 'Medium',
      description: 'The website uses multiple subdomains, which can be an attempt to obscure the true domain name.',
    });
  }

  // Check 5: Internationalized Domain Name (Punycode / Homoglyph risk)
  if (hostname.includes('xn--')) {
    findings.push({
      id: 'punycode_domain',
      title: 'Punycode / Special Character Domain',
      severity: 'High',
      description: 'This address uses encoded characters that look identical to regular letters (homoglyphs) to impersonate trusted sites.',
    });
  }

  // 2. Perform safe, unprivileged network fetch (HEAD/GET with redirect validation)
  const networkFindings = await performSafeFetch(parsedUrl.href, {
    timeoutMs: options.timeoutMs || 5000,
    allowLocalhost: Boolean(options.allowLocalhost),
    lookupFn: options.lookupFn,
    fetchFn: options.fetchFn, // Optional dependency injection for testing
  });

  findings.push(...networkFindings.findings);

  // Determine overall risk level
  const hasCritical = findings.some(f => f.severity === 'Critical');
  const hasHigh = findings.some(f => f.severity === 'High');
  const hasMedium = findings.some(f => f.severity === 'Medium');

  let riskLevel = 'No Obvious Warning Signs';
  let explanation = 'Basic security checks succeeded. The connection uses HTTPS, and no obvious domain anomalies were observed.';

  if (networkFindings.status === 'Unable to verify') {
    riskLevel = 'Unable to verify';
    explanation = 'The website could not be reliably verified because the server timed out, was unreachable, or rejected automated diagnostic checks.';
  } else if (hasCritical || hasHigh) {
    riskLevel = 'High Risk';
    explanation = 'Multiple high-risk indicators were detected. Extreme caution is advised: do not submit personal or financial credentials on this page.';
  } else if (hasMedium || !isHttps) {
    riskLevel = 'Needs Verification';
    explanation = 'Certain warning signs were noted (such as unencrypted HTTP, an unusual domain ending, or missing security headers). Exercise caution.';
  }

  return {
    url: parsedUrl.href,
    hostname,
    valid: true,
    riskLevel,
    status: networkFindings.status || 'Verified',
    findings,
    httpsEnabled: isHttps,
    securityHeaders: networkFindings.securityHeaders || {},
    explanation,
    limitations: 'Automated inspection analyzes domain patterns, encryption headers, and connection parameters. It cannot evaluate whether content is fraudulent. Always confirm the identity of organizations independently.',
    safeNextSteps: [
      'Look for the official website through a trusted search engine or bookmarks.',
      'Never enter banking passwords, UPI PINs, or OTPs on unverified sites.',
      'If you suspect a phishing attempt, report it to the National Cyber Crime Reporting Portal at cybercrime.gov.in.',
    ],
  };
}

/**
 * Performs a safe HTTP/HTTPS probe with strict redirect validation against SSRF.
 */
async function performSafeFetch(targetUrl, options = {}) {
  const timeoutMs = options.timeoutMs || 5000;
  const allowLocalhost = Boolean(options.allowLocalhost);
  const maxRedirects = 3;
  let currentUrl = targetUrl;

  const findings = [];
  let securityHeaders = {};

  if (options.fetchFn) {
    return options.fetchFn(targetUrl, options);
  }

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount++) {
    let parsed;
    try {
      parsed = new URL(currentUrl);
    } catch {
      return { status: 'Unable to verify', findings: [{ id: 'redirect_error', title: 'Invalid Redirect', severity: 'High', description: 'Invalid redirect target URL' }] };
    }

    const client = parsed.protocol === 'https:' ? https : http;

    try {
      const probeResult = await new Promise((resolve, reject) => {
        const req = client.request(parsed, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AccessGuard-Shield/1.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
          timeout: timeoutMs,
        }, (res) => {
          // Immediately abort downloading large body payloads
          res.destroy();

          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
          });
        });

        req.on('timeout', () => {
          req.destroy(new Error('Connection timed out'));
        });

        req.on('error', (err) => {
          reject(err);
        });

        req.end();
      });

      // Handle Redirects
      if ([301, 302, 303, 307, 308].includes(probeResult.statusCode)) {
        const location = probeResult.headers.location;
        if (!location) {
          break;
        }

        const nextUrl = new URL(location, currentUrl).href;

        // CRITICAL DEFENSE: Validate the redirect destination against SSRF!
        const redirectCheck = await validateScanUrl(nextUrl, {
          allowLocalhost,
          lookupFn: options.lookupFn,
        });

        if (!redirectCheck.valid) {
          findings.push({
            id: 'unsafe_redirect_ssrf',
            title: 'Unsafe Redirect to Forbidden Address',
            severity: 'Critical',
            description: `Website attempted to redirect to an unsafe or private destination: ${redirectCheck.reason}`,
          });
          return { status: 'Blocked Redirect', findings, securityHeaders };
        }

        currentUrl = nextUrl;
        continue;
      }

      // Record Security Headers from final destination
      securityHeaders = {
        hsts: Boolean(probeResult.headers['strict-transport-security']),
        csp: Boolean(probeResult.headers['content-security-policy']),
        xfo: Boolean(probeResult.headers['x-frame-options']),
        xcto: Boolean(probeResult.headers['x-content-type-options']),
      };

      if (!securityHeaders.hsts && parsed.protocol === 'https:') {
        findings.push({
          id: 'missing_hsts',
          title: 'Strict-Transport-Security (HSTS) Header Absent',
          severity: 'Info',
          description: 'The site does not enforce HSTS, which helps prevent downgrade attacks.',
        });
      }

      return {
        status: 'Reachable',
        findings,
        securityHeaders,
      };
    } catch (err) {
      return {
        status: 'Unable to verify',
        findings: [
          {
            id: 'unreachable',
            title: 'Site Unreachable or Timed Out',
            severity: 'Medium',
            description: `Could not connect to host within ${timeoutMs / 1000} seconds: ${err.message}`,
          },
        ],
        securityHeaders: {},
      };
    }
  }

  findings.push({
    id: 'too_many_redirects',
    title: 'Excessive Redirects',
    severity: 'Medium',
    description: 'The page redirected more than 3 times without settling.',
  });

  return {
    status: 'Unable to verify',
    findings,
    securityHeaders,
  };
}
