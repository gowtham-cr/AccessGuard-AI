process.env.NODE_ENV = 'test';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../src/app.js';
import { initDatabase, closeDatabase, run, get, all } from '../src/db/database.js';
import { normalizeCrawlerUrl } from '../src/services/scannerService.js';

describe('Real Accessibility Scanning Engine (POST & GET /api/scans)', () => {
  let apiServer;
  let apiUrl;
  let fixtureServer;
  let fixtureUrl;
  let user1Token;
  let user2Token;
  let user1ScanId;
  let barrierScanId;

  before(async () => {
    // 1. In-memory database for complete test isolation
    process.env.NODE_ENV = 'test';
    initDatabase(':memory:');

    // 2. Start API Server on ephemeral port
    await new Promise((resolve) => {
      apiServer = http.createServer(app);
      apiServer.listen(0, () => {
        const port = apiServer.address().port;
        apiUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // 3. Start controlled local HTTP fixture server
    await new Promise((resolve) => {
      fixtureServer = http.createServer((req, res) => {
        if (req.url === '/accessible') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Accessible Civic Portal</title>
</head>
<body style="background-color: #ffffff; color: #111111;">
  <main>
    <h1>Accessible Civic Portal</h1>
    <p>Welcome to digital public services.</p>
    <img src="/logo.png" alt="Official portal logo">
    <button type="button" aria-label="Search records">Search</button>
  </main>
</body>
</html>`);
        } else if (req.url === '/with-violations') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<!DOCTYPE html>
<html>
<head>
  <!-- Barrier: Missing title and missing html lang -->
</head>
<body style="background-color: #ffffff; color: #111111;">
  <!-- Barrier: Missing alt on image -->
  <img src="/banner.png">

  <!-- Barrier: Form control without programmatic label -->
  <input type="text" id="citizen-account">

  <!-- Barrier: Insufficient color contrast -->
  <p style="background-color: #ffffff; color: #f4f4f4;">Practically invisible contrast text</p>

  <!-- Barrier: Button without discernible accessible name -->
  <button><svg width="10" height="10"></svg></button>
</body>
</html>`);
        } else if (req.url === '/controlled-barrier-fixture') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Controlled Barrier Test Page</title>
</head>
<body style="background-color: #ffffff; color: #111111;">
  <main>
    <h1>Controlled Accessibility Verification</h1>
    <!-- Barrier 1: Image missing alt text -->
    <img src="/broken-image.jpg" id="hero-img">

    <!-- Barrier 2: Input without accessible label -->
    <input type="text" id="citizen-input">

    <!-- Barrier 3: Insufficient color contrast (#e0e0e0 on #ffffff) -->
    <p id="low-contrast-text" style="color: #e0e0e0; background-color: #ffffff;">
      Low contrast text with ratio of only 1.3:1.
    </p>

    <!-- Passing element -->
    <button type="button" aria-label="Submit search">Search</button>
  </main>
</body>
</html>`);
        } else if (req.url === '/with-manual-review') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Manual Review Test Page</title>
</head>
<body style="background-color: #ffffff; color: #111111;">
  <main>
    <h1>Manual Review Verification</h1>
    <!-- Text over gradient background creates axe-core incomplete on color-contrast -->
    <div id="gradient-box" style="background: linear-gradient(to right, #000000, #ffffff); padding: 20px;">
      <p id="gradient-text" style="color: #888888; font-size: 16px;">
        Text on gradient requiring human contrast inspection.
      </p>
    </div>
  </main>
</body>
</html>`);
        } else if (req.url === '/site/home') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Portal Home</title>
</head>
<body style="background-color: #ffffff; color: #111111;">
  <main>
    <h1>Portal Home</h1>
    <nav>
      <a href="/site/about">About Team</a>
      <a href="/site/contact">Contact Us</a>
      <a href="/docs/guide.pdf">Download Guide PDF</a>
      <a href="https://external-forbidden.example.com/portal">External Resource</a>
      <a href="#page-section">Section Skip</a>
    </nav>
    <section id="page-section">
      <p>Welcome to the main entry point.</p>
    </section>
  </main>
</body>
</html>`);
        } else if (req.url === '/site/about') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>About Team</title>
</head>
<body style="background-color: #ffffff; color: #111111;">
  <main>
    <h1>About Team</h1>
    <nav>
      <a href="/site/home">Back to Home</a>
      <a href="/site/services">Services</a>
    </nav>
    <!-- Barrier: Image missing alt text -->
    <img src="/staff.jpg" id="team-staff-img">
  </main>
</body>
</html>`);
        } else if (req.url === '/site/contact') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Contact Portal</title>
</head>
<body style="background-color: #ffffff; color: #111111;">
  <main>
    <h1>Contact Portal</h1>
    <form>
      <!-- Barrier: Form control without label -->
      <input type="text" id="contact-field-inquiry">
      <button type="submit">Submit</button>
    </form>
    <a href="/site/missing-subpage">Unreachable Page</a>
  </main>
</body>
</html>`);
        } else if (req.url === '/site/services') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Services</title>
</head>
<body style="background-color: #ffffff; color: #111111;">
  <main>
    <h1>Services</h1>
    <p>Public services listing.</p>
  </main>
</body>
</html>`);
        } else if (req.url === '/barrier-site/entry') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Civic Services Entry</title>
</head>
<body style="background-color: #ffffff; color: #111111;">
  <main>
    <h1>Civic Services Portal</h1>
    <nav>
      <a href="/barrier-site/internal">Proceed to Form Services</a>
    </nav>
    <!-- Barrier 1: Informative image missing alt attribute -->
    <img src="/agency-banner.jpg" id="agency-hero-img">

    <!-- Barrier 2: Form input without accessible label -->
    <input type="text" id="citizen-account-number">

    <!-- Barrier 3: Text with insufficient color contrast (1.3:1 ratio) -->
    <p id="portal-contrast-warning" style="color: #e0e0e0; background-color: #ffffff;">
      Important notice regarding property taxes and renewal deadlines.
    </p>
  </main>
</body>
</html>`);
        } else if (req.url === '/barrier-site/internal') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Form Services Internal Page</title>
</head>
<body style="background-color: #ffffff; color: #111111;">
  <main>
    <h1>Department Internal Services</h1>
    <p>Citizen self-service operations.</p>
    <!-- Barrier 4 (on second internal page): Interactive button missing discernible accessible name -->
    <button id="icon-submit-button" type="button"><svg width="12" height="12"></svg></button>
  </main>
</body>
</html>`);
        } else if (req.url === '/site/missing-subpage') {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not found');
        } else if (req.url === '/redirect-to-metadata') {
          res.writeHead(302, { Location: 'http://169.254.169.254/latest/meta-data/' });
          res.end();
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not found');
        }
      });

      fixtureServer.listen(0, '127.0.0.1', () => {
        const port = fixtureServer.address().port;
        fixtureUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });

    // 4. Create and authenticate User 1
    const regRes1 = await fetch(`${apiUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'scanner.user1@accessguard.gov',
        password: 'Password123!',
        name: 'Auditor User 1',
      }),
    });
    const regData1 = await regRes1.json();
    user1Token = regData1.token;

    // 5. Create and authenticate User 2
    const regRes2 = await fetch(`${apiUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'scanner.user2@accessguard.gov',
        password: 'Password123!',
        name: 'Auditor User 2',
      }),
    });
    const regData2 = await regRes2.json();
    user2Token = regData2.token;
  });

  after(async () => {
    if (fixtureServer) await new Promise((r) => fixtureServer.close(r));
    if (apiServer) await new Promise((r) => apiServer.close(r));
    closeDatabase();
  });

  test('POST /api/scans requires authentication (returns 401)', async () => {
    const res = await fetch(`${apiUrl}/api/scans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: `${fixtureUrl}/accessible` }),
    });

    assert.equal(res.status, 401);
    const body = await res.json();
    assert.ok(body.error.includes('Authentication required'));
  });

  test('POST /api/scans rejects invalid URLs and non-HTTP protocols', async () => {
    const res = await fetch(`${apiUrl}/api/scans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ url: 'file:///etc/passwd' }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.error.includes('Forbidden protocol'));
  });

  test('POST /api/scans strictly blocks loopback and private networks by default (SSRF defense)', async () => {
    // Normal request without test localhost override must be BLOCKED
    const res = await fetch(`${apiUrl}/api/scans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ url: `${fixtureUrl}/accessible` }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(
      body.error.includes('forbidden') ||
      body.error.includes('prohibited') ||
      body.error.includes('reserved hostnames')
    );
  });

  test('POST /api/scans blocks cloud metadata endpoints (169.254.169.254)', async () => {
    const res = await fetch(`${apiUrl}/api/scans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
        'x-test-allow-localhost': 'true', // Even if test mode is set, metadata IP must be blocked!
      },
      body: JSON.stringify({ url: 'http://169.254.169.254/latest/meta-data/' }),
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.error.includes('forbidden') || body.error.includes('prohibited'));
  });

  test('POST /api/scans audits accessible test fixture with real Playwright & axe-core', async () => {
    const res = await fetch(`${apiUrl}/api/scans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
        'x-test-allow-localhost': 'true',
      },
      body: JSON.stringify({ url: `${fixtureUrl}/accessible` }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();

    assert.equal(body.message, 'Accessibility scan completed successfully');
    assert.ok(body.scan);
    assert.equal(body.scan.status, 'completed');
    assert.equal(body.scan.total_violations, 0, 'Accessible fixture should have 0 violations');
    assert.ok(body.scan.passes_count > 0, 'Expected passed axe-core rules');
    assert.ok(body.automatedTestingDisclaimer.includes('30-40% of WCAG'));

    user1ScanId = body.scan.id;
  });

  test('POST /api/scans detects genuine axe-core violations on barrier fixture with concrete evidence', async () => {
    const res = await fetch(`${apiUrl}/api/scans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
        'x-test-allow-localhost': 'true',
      },
      body: JSON.stringify({ url: `${fixtureUrl}/with-violations` }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();

    assert.equal(body.scan.status, 'completed');
    assert.ok(body.scan.total_violations > 0, 'Expected genuine accessibility barriers');
    assert.ok(body.violations.length > 0);

    barrierScanId = body.scan.id;

    // Verify concrete evidence returned for barriers
    const ruleIds = body.violations.map((v) => v.rule_id);
    assert.ok(ruleIds.includes('image-alt') || ruleIds.includes('html-has-lang') || ruleIds.includes('label'));

    const imageAltViolation = body.violations.find((v) => v.rule_id === 'image-alt');
    if (imageAltViolation) {
      assert.equal(imageAltViolation.impact, 'critical');
      assert.ok(imageAltViolation.selector.includes('img'));
      assert.ok(imageAltViolation.html_snippet.includes('/banner.png'));
      assert.ok(imageAltViolation.deterministic_guidance.includes('Deterministic WCAG Rule Guidance'));
      assert.equal(imageAltViolation.ai_explanation, null);
    }

    // Verify honest disclaimer
    assert.ok(body.automatedTestingDisclaimer.toLowerCase().includes('screen reader testing'));
  });

  test('POST /api/scans detects known accessibility problems on controlled fixture (image-alt, label, color-contrast)', async () => {
    const res = await fetch(`${apiUrl}/api/scans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
        'x-test-allow-localhost': 'true',
      },
      body: JSON.stringify({ url: `${fixtureUrl}/controlled-barrier-fixture` }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();

    assert.equal(body.scan.status, 'completed');
    assert.ok(body.scan.passes_count > 0, 'Passed rule count must be derived from actual axe-core passes');
    assert.ok(body.scan.inapplicable_count > 0, 'Inapplicable count must be derived from axe-core');

    const ruleIds = body.violations.map((v) => v.rule_id);
    assert.ok(ruleIds.includes('image-alt'), 'Must detect image missing alt text');
    assert.ok(ruleIds.includes('label'), 'Must detect form input missing accessible label');
    assert.ok(ruleIds.includes('color-contrast'), 'Must detect insufficient color contrast');

    // 1. Validate image-alt violation evidence & guidance
    const altViolation = body.violations.find((v) => v.rule_id === 'image-alt');
    assert.ok(altViolation, 'image-alt violation should exist');
    assert.equal(altViolation.impact, 'critical');
    assert.ok(altViolation.selector.includes('#hero-img'), 'Must capture genuine DOM selector');
    assert.ok(altViolation.html_snippet.includes('id="hero-img"'), 'Must capture genuine HTML evidence');
    assert.ok(altViolation.failure_summary, 'Must capture failure summary from axe-core');
    assert.ok(altViolation.deterministic_guidance.includes('Problem:'), 'Guidance must explain the problem');
    assert.ok(altViolation.deterministic_guidance.includes('Affected Users:'), 'Guidance must explain affected users');
    assert.ok(altViolation.deterministic_guidance.includes('Why It Matters:'), 'Guidance must explain why it matters');
    assert.ok(altViolation.deterministic_guidance.includes('Code Example:'), 'Guidance must include practical code fix');
    assert.equal(altViolation.ai_explanation, null, 'Deterministic guidance must not be AI');

    // 2. Validate label violation evidence & guidance
    const labelViolation = body.violations.find((v) => v.rule_id === 'label');
    assert.ok(labelViolation, 'label violation should exist');
    assert.equal(labelViolation.impact, 'critical');
    assert.ok(labelViolation.selector.includes('#citizen-input'));
    assert.ok(labelViolation.html_snippet.includes('id="citizen-input"'));
    assert.ok(labelViolation.failure_summary);
    assert.ok(labelViolation.deterministic_guidance.includes('Problem:'));
    assert.ok(labelViolation.deterministic_guidance.includes('Affected Users:'));

    // 3. Validate color-contrast violation evidence & guidance
    const contrastViolation = body.violations.find((v) => v.rule_id === 'color-contrast');
    assert.ok(contrastViolation, 'color-contrast violation should exist');
    assert.equal(contrastViolation.impact, 'serious');
    assert.ok(contrastViolation.selector.includes('#low-contrast-text'));
    assert.ok(contrastViolation.html_snippet.includes('id="low-contrast-text"'));
    assert.ok(contrastViolation.failure_summary);
    assert.ok(contrastViolation.deterministic_guidance.includes('Contrast (Minimum)'));

    // 4. Verify severity tally consistency
    const totalSeveritySum = 
      body.scan.critical_count + 
      body.scan.serious_count + 
      body.scan.moderate_count + 
      body.scan.minor_count;
    assert.equal(totalSeveritySum, body.scan.total_violations, 'Severity sums must equal total violations');
    assert.equal(body.scan.total_violations, body.violations.length);

    // 5. Verify database persistence in SQLite
    const dbScan = get('SELECT * FROM scans WHERE id = ?', body.scan.id);
    assert.equal(dbScan.id, body.scan.id);
    assert.equal(dbScan.status, 'completed');
    assert.equal(dbScan.total_violations, body.scan.total_violations);

    const dbViolations = all('SELECT * FROM scan_violations WHERE scan_id = ?', body.scan.id);
    assert.equal(dbViolations.length, body.violations.length);
    assert.ok(dbViolations.some((v) => v.rule_id === 'image-alt' && v.selector.includes('#hero-img')));
    assert.ok(dbViolations.some((v) => v.rule_id === 'label' && v.selector.includes('#citizen-input')));
    assert.ok(dbViolations.some((v) => v.rule_id === 'color-contrast' && v.selector.includes('#low-contrast-text')));

    // 6. Verify transparent grade gating: scan with critical barriers cannot receive Grade A
    if (body.scan.critical_count > 0) {
      assert.notEqual(body.scan.wcag_grade, 'A', 'Scans with critical barriers must not receive Grade A');
      assert.notEqual(body.scoring.grade, 'A', 'Scoring grade must not be Grade A when critical barriers exist');
      assert.equal(body.scoring.fullyCompliant, false);
      assert.equal(body.scoring.hasCriticalBarriers, true);
      assert.ok(body.scoring.criticalWarning);
    }
  });

  test('POST /api/scans collects and stores real axe-core incomplete checks into scan_manual_checks', async () => {
    const res = await fetch(`${apiUrl}/api/scans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
        'x-test-allow-localhost': 'true',
      },
      body: JSON.stringify({
        url: `${fixtureUrl}/with-manual-review`,
        maxPages: 1,
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();

    // Check scan record: violations strictly separated from manual review
    assert.equal(body.scan.status, 'completed');
    assert.equal(body.scan.total_violations, 0); // Must NOT be classified as violation
    assert.ok(body.scan.incomplete_count > 0, 'Expected scan.incomplete_count > 0');
    assert.ok(Array.isArray(body.manualChecks), 'Expected manualChecks array');
    assert.ok(body.manualChecks.length > 0, 'Expected manual checks to be returned');

    const contrastCheck = body.manualChecks.find((m) => m.rule_id === 'color-contrast');
    assert.ok(contrastCheck, 'Expected color-contrast manual review check');
    assert.ok(contrastCheck.selector.includes('#gradient-text'));
    assert.ok(contrastCheck.failure_summary.includes('gradient'));
    assert.ok(contrastCheck.review_guidance.includes('Manual verification required'));

    // Check scan_pages record has incomplete_count
    assert.equal(body.pages[0].incomplete_count, body.manualChecks.length);

    // Verify database persistence in scan_manual_checks table
    const dbManualChecks = all('SELECT * FROM scan_manual_checks WHERE scan_id = ?', body.scan.id);
    assert.equal(dbManualChecks.length, body.manualChecks.length);
    assert.equal(dbManualChecks[0].rule_id, 'color-contrast');

    // Verify GET /api/scans/:id returns manualChecks
    const getRes = await fetch(`${apiUrl}/api/scans/${body.scan.id}`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.ok(Array.isArray(getBody.manualChecks));
    assert.equal(getBody.manualChecks.length, body.manualChecks.length);

    // Verify JSON export includes manualChecks and manualReviewCount
    const jsonExportRes = await fetch(`${apiUrl}/api/scans/${body.scan.id}/export?format=json`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert.equal(jsonExportRes.status, 200);
    const jsonExport = await jsonExportRes.json();
    assert.equal(jsonExport.audit.summary.manualReviewCount, body.scan.incomplete_count);
    assert.equal(jsonExport.audit.manualChecks.length, body.manualChecks.length);
    assert.equal(jsonExport.audit.manualChecks[0].findingStatus, 'needs_manual_review');

    // Verify CSV export includes Finding Status column with Needs Manual Review
    const csvExportRes = await fetch(`${apiUrl}/api/scans/${body.scan.id}/export?format=csv`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert.equal(csvExportRes.status, 200);
    const csvText = await csvExportRes.text();
    assert.ok(csvText.includes('"Needs Manual Review"'));
    assert.ok(csvText.includes('"color-contrast"'));
  });

  test('GET /api/scans returns scan history for the authenticated user', async () => {
    const res = await fetch(`${apiUrl}/api/scans`, {
      headers: {
        Authorization: `Bearer ${user1Token}`,
      },
    });

    assert.equal(res.status, 200);
    const body = await res.json();

    assert.ok(Array.isArray(body.scans));
    assert.ok(body.scans.length >= 2);
    assert.equal(body.scans[0].user_id, body.scans[1].user_id);
    assert.ok(body.automatedTestingDisclaimer);
  });

  test('GET /api/scans/:id returns scan details and violations', async () => {
    const res = await fetch(`${apiUrl}/api/scans/${user1ScanId}`, {
      headers: {
        Authorization: `Bearer ${user1Token}`,
      },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.scan.id, user1ScanId);
    assert.ok(Array.isArray(body.violations));
  });

  test('GET /api/scans/:id enforces scan ownership (returns 404 for another users scan)', async () => {
    // User 2 attempts to query User 1's scan
    const res = await fetch(`${apiUrl}/api/scans/${user1ScanId}`, {
      headers: {
        Authorization: `Bearer ${user2Token}`,
      },
    });

    assert.equal(res.status, 404);
    const body = await res.json();
    assert.ok(body.error.includes('Scan not found'));
  });

  test('POST /api/scans returns 422 with clear error when website is offline/unreachable', async () => {
    // Request against an unused local port
    const res = await fetch(`${apiUrl}/api/scans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
        'x-test-allow-localhost': 'true',
      },
      body: JSON.stringify({ url: 'http://127.0.0.1:59999' }),
    });

    assert.equal(res.status, 422);
    const body = await res.json();
    assert.ok(body.error.includes('Unable to access website') || body.error.includes('Connection refused'));

    // Verify in database that scan status was marked as 'failed'
    const failedScan = get('SELECT * FROM scans WHERE id = ?', body.scanId);
    assert.equal(failedScan.status, 'failed');
    assert.ok(failedScan.error_message);
  });

  test('POST /api/scans rejects concurrent request when an active scan is legitimately running', async () => {
    // Insert a legitimately running scan created just now
    const user1 = get("SELECT id FROM users WHERE email = 'scanner.user1@accessguard.gov'");
    const activeInsert = run(
      "INSERT INTO scans (user_id, url, status, created_at) VALUES (?, 'https://concurrent.example.com', 'running', datetime('now'))",
      user1.id
    );

    try {
      const res = await fetch(`${apiUrl}/api/scans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user1Token}`,
        },
        body: JSON.stringify({ url: 'https://example.com' }),
      });

      assert.equal(res.status, 429);
      const body = await res.json();
      assert.ok(body.error.includes('already running for your account'));
      assert.equal(body.activeScanId, activeInsert.lastInsertRowid);
    } finally {
      // Clean up the active scan record so subsequent tests are unaffected
      run('DELETE FROM scans WHERE id = ?', activeInsert.lastInsertRowid);
    }
  });

  test('POST /api/scans auto-recovers stale running scan (>90s) and allows new scan to proceed', async () => {
    // Insert a stale running scan created 120 seconds ago
    const user1 = get("SELECT id FROM users WHERE email = 'scanner.user1@accessguard.gov'");
    const staleInsert = run(
      "INSERT INTO scans (user_id, url, status, created_at) VALUES (?, 'https://stale.example.com', 'running', datetime('now', '-120 seconds'))",
      user1.id
    );

    // Now attempt a new scan. It should auto-recover the stale scan and NOT block with 429.
    const res = await fetch(`${apiUrl}/api/scans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
        'x-test-allow-localhost': 'true',
      },
      body: JSON.stringify({ url: 'http://127.0.0.1:59999' }), // Will complete with 422 unreachable, proving it bypassed 429
    });

    assert.notEqual(res.status, 429, 'Expected request not to be blocked by 429');

    // Confirm that the stale scan was marked as failed
    const staleScan = get('SELECT * FROM scans WHERE id = ?', staleInsert.lastInsertRowid);
    assert.equal(staleScan.status, 'failed');
    assert.ok(staleScan.error_message.includes('Scan timed out or was interrupted'));
    assert.ok(staleScan.completed_at);
  });

  test('POST /api/scans crawls internal website pages up to maxPages and records page-level findings', async () => {
    const res = await fetch(`${apiUrl}/api/scans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
        'x-test-allow-localhost': 'true',
      },
      body: JSON.stringify({
        url: `${fixtureUrl}/site/home`,
        maxPages: 3,
        maxDepth: 2,
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();

    assert.equal(body.scan.status, 'completed');
    assert.equal(body.scan.pages_scanned, 3, 'Should have scanned exactly 3 internal pages');
    assert.equal(body.scan.pages_failed, 0, 'No pages should have failed');
    assert.ok(Array.isArray(body.pages));
    assert.equal(body.pages.length, 3);

    // Verify all pages are recorded in database scan_pages table
    const pageUrls = body.pages.map((p) => p.url);
    assert.ok(pageUrls.includes(`${fixtureUrl}/site/home`));
    assert.ok(pageUrls.includes(`${fixtureUrl}/site/about`));
    assert.ok(pageUrls.includes(`${fixtureUrl}/site/contact`));

    // Verify external links and non-HTML assets were strictly excluded
    assert.ok(!pageUrls.some((u) => u.includes('external-forbidden')));
    assert.ok(!pageUrls.some((u) => u.endsWith('.pdf')));

    // Verify page-level depth tracking
    const homePage = body.pages.find((p) => p.url === `${fixtureUrl}/site/home`);
    assert.equal(homePage.depth, 0);
    const aboutPage = body.pages.find((p) => p.url === `${fixtureUrl}/site/about`);
    assert.equal(aboutPage.depth, 1);
    const contactPage = body.pages.find((p) => p.url === `${fixtureUrl}/site/contact`);
    assert.equal(contactPage.depth, 1);

    // Verify page-specific violations are tagged with their respective page_url
    assert.ok(body.violations.length >= 2, 'Expected violations across multiple pages');
    const aboutViolation = body.violations.find((v) => v.rule_id === 'image-alt');
    assert.ok(aboutViolation, 'Must find image-alt violation on /site/about');
    assert.equal(aboutViolation.page_url, `${fixtureUrl}/site/about`);

    const contactViolation = body.violations.find((v) => v.rule_id === 'label');
    assert.ok(contactViolation, 'Must find label violation on /site/contact');
    assert.equal(contactViolation.page_url, `${fixtureUrl}/site/contact`);

    // Verify GET /api/scans/:id returns the scanned pages
    const detailRes = await fetch(`${apiUrl}/api/scans/${body.scan.id}`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert.equal(detailRes.status, 200);
    const detailBody = await detailRes.json();
    assert.ok(Array.isArray(detailBody.pages));
    assert.equal(detailBody.pages.length, 3);
  });

  test('POST /api/scans subpage failure (404) does not abort overall scan; records failed page record', async () => {
    const res = await fetch(`${apiUrl}/api/scans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
        'x-test-allow-localhost': 'true',
      },
      body: JSON.stringify({
        url: `${fixtureUrl}/site/contact`, // Contains link to /site/missing-subpage (404)
        maxPages: 3,
        maxDepth: 2,
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();

    assert.equal(body.scan.status, 'completed', 'Overall scan must complete despite subpage 404');
    assert.ok(body.scan.pages_scanned >= 1);
    assert.ok(body.scan.pages_failed >= 1);

    const failedPage = body.pages.find((p) => p.url.includes('/site/missing-subpage'));
    assert.ok(failedPage, 'Missing subpage should be captured in scan_pages');
    assert.equal(failedPage.status, 'failed');
    assert.equal(failedPage.http_status, 404);
  });

  test('POST /api/scans respects maxDepth and does not traverse beyond allowed link distance', async () => {
    // With maxDepth: 1, /site/services (which is depth 2, linked from /site/about) must not be crawled
    const res = await fetch(`${apiUrl}/api/scans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
        'x-test-allow-localhost': 'true',
      },
      body: JSON.stringify({
        url: `${fixtureUrl}/site/home`,
        maxPages: 10,
        maxDepth: 1, // Only root (0) and direct links (1)
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    const pageUrls = body.pages.map((p) => p.url);
    assert.ok(!pageUrls.includes(`${fixtureUrl}/site/services`), 'Depth 2 page should not be crawled when maxDepth is 1');
  });

  test('POST /api/scans verifies genuine multi-page accessibility detection across internal pages (image-alt, label, color-contrast, button-name)', async () => {
    const res = await fetch(`${apiUrl}/api/scans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
        'x-test-allow-localhost': 'true',
      },
      body: JSON.stringify({
        url: `${fixtureUrl}/barrier-site/entry`, // Links to /barrier-site/internal
        maxPages: 2,
        maxDepth: 1,
      }),
    });

    assert.equal(res.status, 201);
    const body = await res.json();

    assert.equal(body.scan.status, 'completed');
    assert.equal(body.scan.pages_scanned, 2, 'Must audit both /barrier-site/entry and /barrier-site/internal');
    assert.equal(body.scan.pages_failed, 0);

    // Verify both pages recorded in scan_pages
    const pageUrls = body.pages.map((p) => p.url);
    assert.ok(pageUrls.includes(`${fixtureUrl}/barrier-site/entry`));
    assert.ok(pageUrls.includes(`${fixtureUrl}/barrier-site/internal`));

    // Barrier 1: image-alt on /barrier-site/entry
    const imageAltFinding = body.violations.find((v) => v.rule_id === 'image-alt' && v.page_url === `${fixtureUrl}/barrier-site/entry`);
    assert.ok(imageAltFinding, 'Must detect image-alt violation on /barrier-site/entry');
    assert.equal(imageAltFinding.impact, 'critical');
    assert.ok(imageAltFinding.selector.includes('#agency-hero-img'));
    assert.ok(imageAltFinding.html_snippet.includes('id="agency-hero-img"'));
    assert.ok(imageAltFinding.deterministic_guidance.includes('WCAG 1.1.1'));

    // Barrier 2: label on /barrier-site/entry
    const labelFinding = body.violations.find((v) => v.rule_id === 'label' && v.page_url === `${fixtureUrl}/barrier-site/entry`);
    assert.ok(labelFinding, 'Must detect form input missing label on /barrier-site/entry');
    assert.equal(labelFinding.impact, 'critical');
    assert.ok(labelFinding.selector.includes('#citizen-account-number'));
    assert.ok(labelFinding.html_snippet.includes('id="citizen-account-number"'));

    // Barrier 3: color-contrast on /barrier-site/entry
    const contrastFinding = body.violations.find((v) => v.rule_id === 'color-contrast' && v.page_url === `${fixtureUrl}/barrier-site/entry`);
    assert.ok(contrastFinding, 'Must detect insufficient color contrast on /barrier-site/entry');
    assert.equal(contrastFinding.impact, 'serious');
    assert.ok(contrastFinding.selector.includes('#portal-contrast-warning'));
    assert.ok(contrastFinding.html_snippet.includes('id="portal-contrast-warning"'));

    // Barrier 4: button-name on second page (/barrier-site/internal)
    const buttonFinding = body.violations.find((v) => v.rule_id === 'button-name' && v.page_url === `${fixtureUrl}/barrier-site/internal`);
    assert.ok(buttonFinding, 'Must detect button missing accessible name on second page (/barrier-site/internal)');
    assert.equal(buttonFinding.impact, 'critical');
    assert.ok(buttonFinding.selector.includes('#icon-submit-button'));
    assert.ok(buttonFinding.html_snippet.includes('id="icon-submit-button"'));

    // Verify database persistence in SQLite
    const dbViolations = all('SELECT * FROM scan_violations WHERE scan_id = ?', body.scan.id);
    assert.equal(dbViolations.length, body.violations.length);
    assert.ok(dbViolations.some((v) => v.rule_id === 'image-alt' && v.page_url === `${fixtureUrl}/barrier-site/entry`));
    assert.ok(dbViolations.some((v) => v.rule_id === 'label' && v.page_url === `${fixtureUrl}/barrier-site/entry`));
    assert.ok(dbViolations.some((v) => v.rule_id === 'color-contrast' && v.page_url === `${fixtureUrl}/barrier-site/entry`));
    assert.ok(dbViolations.some((v) => v.rule_id === 'button-name' && v.page_url === `${fixtureUrl}/barrier-site/internal`));

    // Verify GET /api/scans/:id returns all 4 findings with page_url
    const detailRes = await fetch(`${apiUrl}/api/scans/${body.scan.id}`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert.equal(detailRes.status, 200);
    const detailData = await detailRes.json();
    assert.equal(detailData.violations.length, body.violations.length);
    assert.equal(detailData.pages.length, 2);
  });

  test('GET /api/scans/:id/export exports structured audit data in JSON format', async () => {
    const res = await fetch(`${apiUrl}/api/scans/${user1ScanId}/export?format=json`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.exportVersion, '1.0.0');
    assert.ok(body.audit);
    assert.equal(body.audit.id, user1ScanId);
    assert.ok(body.audit.summary);
    assert.ok(Array.isArray(body.audit.pages));
    assert.ok(Array.isArray(body.audit.violations));
    assert.ok(body.audit.automatedTestingDisclaimer.includes('30-40% of WCAG'));
  });

  test('GET /api/scans/:id/export exports audit data in RFC 4180 CSV format', async () => {
    const res = await fetch(`${apiUrl}/api/scans/${user1ScanId}/export?format=csv`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });

    assert.equal(res.status, 200);
    const contentType = res.headers.get('content-type');
    assert.ok(contentType.includes('text/csv'));
    const csvText = await res.text();
    assert.ok(csvText.includes('Scan ID,Finding Status,Target URL,Page URL,Rule ID,Impact'));
    assert.ok(csvText.includes('Automated testing evaluates ~30-40% of WCAG'));
  });

  test('GET /api/scans/:id/export enforces ownership (returns 404 for other user scan)', async () => {
    const res = await fetch(`${apiUrl}/api/scans/${user1ScanId}/export`, {
      headers: { Authorization: `Bearer ${user2Token}` },
    });

    assert.equal(res.status, 404);
  });

  test('GET /api/scans/:id/export?format=sarif exports clean scan with valid SARIF 2.1.0 and zero results', async () => {
    const res = await fetch(`${apiUrl}/api/scans/${user1ScanId}/export?format=sarif`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });

    assert.equal(res.status, 200);
    const contentType = res.headers.get('content-type');
    assert.ok(contentType.includes('application/sarif+json'));
    const disposition = res.headers.get('content-disposition');
    assert.ok(disposition.includes(`filename="accessguard-audit-${user1ScanId}.sarif"`));

    const sarif = await res.json();
    assert.equal(sarif.version, '2.1.0');
    assert.equal(sarif.$schema, 'https://json.schemastore.org/sarif-2.1.0.json');
    assert.ok(Array.isArray(sarif.runs));
    assert.equal(sarif.runs.length, 1);

    const run = sarif.runs[0];
    assert.equal(run.tool.driver.name, 'AccessGuard-AI');
    assert.equal(run.tool.driver.version, '1.0.0');
    assert.deepEqual(run.tool.driver.rules, []);
    assert.deepEqual(run.results, []);
    assert.equal(run.properties.scanId, user1ScanId);
    assert.equal(run.properties.totalViolations, 0);
  });

  test('GET /api/scans/:id/sarif exports scan with genuine fixture findings, proper rule indices, and remediation guidance', async () => {
    const res = await fetch(`${apiUrl}/api/scans/${barrierScanId}/sarif`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });

    assert.equal(res.status, 200);
    const contentType = res.headers.get('content-type');
    assert.ok(contentType.includes('application/sarif+json'));
    const disposition = res.headers.get('content-disposition');
    assert.ok(disposition.includes(`filename="accessguard-audit-${barrierScanId}.sarif"`));

    const sarif = await res.json();
    assert.equal(sarif.version, '2.1.0');
    assert.equal(sarif.$schema, 'https://json.schemastore.org/sarif-2.1.0.json');

    const run = sarif.runs[0];
    assert.equal(run.tool.driver.name, 'AccessGuard-AI');
    assert.ok(run.tool.driver.rules.length > 0, 'Must have rules derived from actual findings');
    assert.ok(run.results.length > 0, 'Must have results derived from actual findings');

    // Verify all results reference valid rules
    for (const result of run.results) {
      assert.ok(result.ruleId);
      assert.ok(result.ruleIndex >= 0 && result.ruleIndex < run.tool.driver.rules.length);
      const matchedRule = run.tool.driver.rules[result.ruleIndex];
      assert.equal(matchedRule.id, result.ruleId);
      assert.ok(['error', 'warning', 'note'].includes(result.level));
      assert.ok(result.locations.length >= 1);
      assert.ok(result.locations[0].physicalLocation.artifactLocation.uri);
      assert.ok(result.properties.impact);
      assert.equal(result.properties.findingStatus, 'confirmed_violation');
    }

    // Verify rule metadata & deterministic guidance
    const altRule = run.tool.driver.rules.find((r) => r.id === 'image-alt');
    if (altRule) {
      assert.equal(altRule.defaultConfiguration.level, 'error');
      assert.ok(altRule.properties.tags.includes('accessibility'));
      assert.ok(altRule.help.text.includes('Deterministic') || altRule.help.text.includes('alt') || altRule.help.text.includes('Problem'));
    }

    assert.ok(run.properties.automatedTestingDisclaimer.includes('30-40% of WCAG'));
  });

  test('GET /api/scans/:id/sarif validates scan ID and enforces authorization', async () => {
    // 1. Invalid scan ID
    const invalidRes = await fetch(`${apiUrl}/api/scans/not-a-number/sarif`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert.equal(invalidRes.status, 400);

    // 2. Non-existent scan ID
    const missingRes = await fetch(`${apiUrl}/api/scans/999999/sarif`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert.equal(missingRes.status, 404);

    // 3. Unauthorized access by another user
    const unauthRes = await fetch(`${apiUrl}/api/scans/${barrierScanId}/sarif`, {
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    assert.equal(unauthRes.status, 404);
  });

  test('GET /api/scans/compare compares baseline vs target scan and identifies resolved and remaining issues', async () => {
    // Run two scans of the test website:
    // Scan A (Baseline): audits /site/home (contains link to /site/about with image-alt and /site/contact with label)
    const scanARes = await fetch(`${apiUrl}/api/scans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
        'x-test-allow-localhost': 'true',
      },
      body: JSON.stringify({ url: `${fixtureUrl}/site/home`, maxPages: 3, maxDepth: 2 }),
    });
    const scanAData = await scanARes.json();
    const scanAId = scanAData.scan.id;

    // Scan B (Target): audits /site/about directly (only contains image-alt)
    const scanBRes = await fetch(`${apiUrl}/api/scans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
        'x-test-allow-localhost': 'true',
      },
      body: JSON.stringify({ url: `${fixtureUrl}/site/about`, maxPages: 1, maxDepth: 1 }),
    });
    const scanBData = await scanBRes.json();
    const scanBId = scanBData.scan.id;

    // Compare Scan A (base) vs Scan B (target)
    const compRes = await fetch(`${apiUrl}/api/scans/compare?baseId=${scanAId}&targetId=${scanBId}`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });

    assert.equal(compRes.status, 200);
    const compData = await compRes.json();
    assert.ok(compData.comparison);
    assert.ok(compData.comparison.remainingCount >= 1, 'image-alt finding on /site/about should remain');
    assert.ok(compData.comparison.scopeDifference, 'Scope differs (maxPages 3 vs 1)');
    // The label finding was on /site/contact, which was NOT audited in Scan B -> must be classified as unverified scope!
    assert.ok(compData.comparison.unverifiedResolvedCount >= 1, 'Unverified resolution should be detected when page was not re-scanned');
    assert.ok(compData.automatedTestingDisclaimer);
  });

  test('GET /api/scans/compare validates parameters and rejects identical scan comparison', async () => {
    const res = await fetch(`${apiUrl}/api/scans/compare?baseId=${user1ScanId}&targetId=${user1ScanId}`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.error.includes('Cannot compare a scan with itself'));
  });

  test('Historical scan compatibility: scans with critical violations never return Grade A in history, details, or export', async () => {
    // Insert a historical scan directly into SQLite with score 95 and grade A
    const historicalInsert = run(
      `INSERT INTO scans (
        user_id, url, status, total_violations, critical_count, serious_count,
        moderate_count, minor_count, passes_count, inapplicable_count, incomplete_count,
        wcag_score, wcag_grade, max_pages, max_depth, pages_scanned, pages_failed, created_at, completed_at
      ) VALUES (?, ?, 'completed', 1, 1, 0, 0, 0, 190, 10, 0, 95, 'A', 1, 1, 1, 0, datetime('now', '-2 days'), datetime('now', '-2 days'))`,
      1,
      'https://legacy-audit.example.gov'
    );
    const legacyScanId = historicalInsert.lastInsertRowid;

    // Insert normalized critical violation
    run(
      `INSERT INTO scan_violations (
        scan_id, page_url, rule_id, impact, description, selector, html_snippet
      ) VALUES (?, 'https://legacy-audit.example.gov', 'image-alt', 'critical', 'Image missing alt', 'img.hero', '<img src="hero.jpg">')`,
      legacyScanId
    );

    // 1. GET /api/scans/:id details endpoint
    const detailRes = await fetch(`${apiUrl}/api/scans/${legacyScanId}`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert.equal(detailRes.status, 200);
    const detailBody = await detailRes.json();
    assert.equal(detailBody.scan.wcag_score, 95);
    assert.equal(detailBody.scan.wcag_grade, 'B', 'Historical scan detail must gate Grade A down to B');
    assert.equal(detailBody.scoring.grade, 'B');
    assert.equal(detailBody.scoring.gradeGated, true);
    assert.equal(detailBody.scoring.hasCriticalBarriers, true);
    assert.equal(detailBody.scoring.fullyCompliant, false);
    assert.ok(detailBody.scoring.criticalWarning);

    // 2. GET /api/scans history list endpoint
    const historyRes = await fetch(`${apiUrl}/api/scans`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert.equal(historyRes.status, 200);
    const historyBody = await historyRes.json();
    const fetchedLegacyScan = historyBody.scans.find((s) => s.id === legacyScanId);
    assert.ok(fetchedLegacyScan);
    assert.equal(fetchedLegacyScan.wcag_score, 95);
    assert.equal(fetchedLegacyScan.wcag_grade, 'B', 'Scan history list must gate Grade A down to B for legacy scans');

    // 3. GET /api/scans/:id/export JSON export
    const exportRes = await fetch(`${apiUrl}/api/scans/${legacyScanId}/export?format=json`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert.equal(exportRes.status, 200);
    const exportBody = await exportRes.json();
    assert.equal(exportBody.audit.summary.wcagScore, 95);
    assert.equal(exportBody.audit.summary.wcagGrade, 'B', 'Export must gate Grade A down to B');

    // 4. GET /api/scans/:id/export?format=sarif SARIF export
    const sarifExportRes = await fetch(`${apiUrl}/api/scans/${legacyScanId}/export?format=sarif`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert.equal(sarifExportRes.status, 200);
    const sarifExportBody = await sarifExportRes.json();
    assert.equal(sarifExportBody.runs[0].properties.wcagScore, 95);
    assert.equal(sarifExportBody.runs[0].properties.wcagGrade, 'B', 'SARIF export format must gate Grade A down to B');
    assert.notEqual(sarifExportBody.runs[0].properties.wcagGrade, 'A');

    // 5. GET /api/scans/:id/sarif dedicated endpoint
    const dedicatedSarifRes = await fetch(`${apiUrl}/api/scans/${legacyScanId}/sarif`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    assert.equal(dedicatedSarifRes.status, 200);
    const dedicatedSarifBody = await dedicatedSarifRes.json();
    assert.equal(dedicatedSarifBody.runs[0].properties.wcagScore, 95);
    assert.equal(dedicatedSarifBody.runs[0].properties.wcagGrade, 'B', 'Dedicated SARIF endpoint must gate Grade A down to B');
    assert.notEqual(dedicatedSarifBody.runs[0].properties.wcagGrade, 'A');
  });
});

describe('Crawler URL Normalization & Filtering (normalizeCrawlerUrl)', () => {
  const base = 'https://civic.agency.gov/portal';

  test('strips hash fragments and anchors', () => {
    assert.equal(
      normalizeCrawlerUrl('/about#leadership', base),
      'https://civic.agency.gov/about'
    );
    assert.equal(normalizeCrawlerUrl('#main-content', base), null);
  });

  test('filters non-HTTP protocols (mailto, javascript, tel)', () => {
    assert.equal(normalizeCrawlerUrl('mailto:info@agency.gov', base), null);
    assert.equal(normalizeCrawlerUrl('javascript:void(0)', base), null);
    assert.equal(normalizeCrawlerUrl('tel:+18005550199', base), null);
  });

  test('filters static non-HTML assets (images, documents, archives, code)', () => {
    assert.equal(normalizeCrawlerUrl('/documents/annual-report.pdf', base), null);
    assert.equal(normalizeCrawlerUrl('/assets/banner.PNG', base), null);
    assert.equal(normalizeCrawlerUrl('/media/video.mp4', base), null);
    assert.equal(normalizeCrawlerUrl('/static/app.bundle.js', base), null);
    assert.equal(normalizeCrawlerUrl('/styles/theme.css', base), null);
    assert.equal(normalizeCrawlerUrl('/data/dataset.zip', base), null);
  });

  test('preserves valid HTML links and query parameters', () => {
    assert.equal(
      normalizeCrawlerUrl('/services?category=permits', base),
      'https://civic.agency.gov/services?category=permits'
    );
    assert.equal(
      normalizeCrawlerUrl('contact.html', base),
      'https://civic.agency.gov/contact.html'
    );
  });
});
