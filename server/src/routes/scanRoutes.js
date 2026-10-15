import express from 'express';
import { run, get, all, transaction } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { runAccessibilityScan, AUTOMATED_TESTING_DISCLAIMER } from '../services/scannerService.js';
import { calculateWcagScore, getGrade } from '../services/wcagScorer.js';
import { generateSarifReport } from '../services/sarifService.js';
import { config } from '../config.js';

export const scanRouter = express.Router();

// Base duration for a single scan lifecycle; scales dynamically with maxPages
const BASE_SCAN_DURATION_SECONDS = 90;

/**
 * POST /api/scans
 * Initiates an authentic accessibility audit of a public website using Playwright & axe-core.
 * Supports multi-page website discovery and crawling with configurable page limits.
 */
scanRouter.post('/', requireAuth, async (req, res) => {
  const { url, maxPages: rawMaxPages, maxDepth: rawMaxDepth } = req.body || {};

  // 1. Validate URL parameter
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'A valid website URL string is required.' });
  }

  const trimmedUrl = url.trim();
  if (trimmedUrl.length > 2048) {
    return res.status(400).json({ error: 'URL exceeds maximum permitted length of 2048 characters.' });
  }

  // Parse and constrain crawl bounds
  const parsedMaxPages = parseInt(rawMaxPages, 10);
  const maxPages = !isNaN(parsedMaxPages) && parsedMaxPages >= 1 
    ? Math.min(15, parsedMaxPages) 
    : 5; // Default 5 pages for website audit

  const parsedMaxDepth = parseInt(rawMaxDepth, 10);
  const maxDepth = !isNaN(parsedMaxDepth) && parsedMaxDepth >= 1
    ? Math.min(4, parsedMaxDepth)
    : 2;

  // Maximum anticipated crawl duration scales with number of pages
  const maxDurationThreshold = Math.max(BASE_SCAN_DURATION_SECONDS, maxPages * 25);

  // 2. Prevent concurrent scanning abuse per user, auto-recovering stale/interrupted scans
  const activeScan = get(
    `SELECT id, max_pages, created_at, 
            (strftime('%s', 'now') - strftime('%s', created_at)) AS elapsed_seconds 
     FROM scans 
     WHERE user_id = ? AND status = 'running'`,
    req.user.id
  );

  if (activeScan) {
    const elapsed = typeof activeScan.elapsed_seconds === 'number' 
      ? activeScan.elapsed_seconds 
      : 0;

    const activeThreshold = Math.max(
      BASE_SCAN_DURATION_SECONDS,
      (activeScan.max_pages || 1) * 25
    );

    if (elapsed > activeThreshold) {
      // Auto-recover stale running scan that exceeded maximum duration
      run(
        `UPDATE scans 
         SET status = 'failed',
             error_message = 'Scan timed out or was interrupted.',
             completed_at = datetime('now')
         WHERE id = ? AND status = 'running'`,
        activeScan.id
      );
    } else {
      return res.status(429).json({
        error: 'An accessibility scan is already running for your account. Please wait for it to complete.',
        activeScanId: activeScan.id,
      });
    }
  }

  // 3. Create initial scan record in database
  const insertResult = run(
    `INSERT INTO scans (user_id, url, status, max_pages, max_depth, pages_scanned, pages_failed) 
     VALUES (?, ?, 'running', ?, ?, 0, 0)`,
    req.user.id,
    trimmedUrl,
    maxPages,
    maxDepth
  );
  const scanId = insertResult.lastInsertRowid;

  // Evaluate allowLocalhost (strictly disabled in production; only usable in test environment)
  const isTest = config.nodeEnv === 'test' || process.env.NODE_ENV === 'test';
  const allowLocalhost = Boolean(
    config.allowLocalhostScans ||
    (isTest && req.headers['x-test-allow-localhost'] === 'true')
  );

  try {
    // Real-time page discovery & audit tracking callbacks
    const onPageDiscovered = (pageInfo) => {
      try {
        const existing = get(
          'SELECT id FROM scan_pages WHERE scan_id = ? AND url = ?',
          scanId,
          pageInfo.url
        );
        if (!existing) {
          run(
            `INSERT INTO scan_pages (scan_id, url, status, depth) 
             VALUES (?, ?, 'pending', ?)`,
            scanId,
            pageInfo.url,
            pageInfo.depth || 0
          );
        }
      } catch {}
    };

    const onPageStarted = (pageInfo) => {
      try {
        const existing = get(
          'SELECT id FROM scan_pages WHERE scan_id = ? AND url = ?',
          scanId,
          pageInfo.url
        );
        if (existing) {
          run("UPDATE scan_pages SET status = 'running' WHERE id = ?", existing.id);
        } else {
          run(
            `INSERT INTO scan_pages (scan_id, url, status, depth) 
             VALUES (?, ?, 'running', ?)`,
            scanId,
            pageInfo.url,
            pageInfo.depth || 0
          );
        }
      } catch {}
    };

    const onPageCompleted = (pageRecord) => {
      try {
        const existing = get(
          'SELECT id FROM scan_pages WHERE scan_id = ? AND url = ?',
          scanId,
          pageRecord.url
        );
        if (existing) {
          run(
            `UPDATE scan_pages 
             SET status = 'completed',
                 http_status = ?,
                 total_violations = ?,
                 passes_count = ?,
                 incomplete_count = ?,
                 completed_at = datetime('now')
             WHERE id = ?`,
            pageRecord.http_status || 200,
            pageRecord.total_violations || 0,
            pageRecord.passes_count || 0,
            pageRecord.incomplete_count || 0,
            existing.id
          );
        } else {
          run(
            `INSERT INTO scan_pages (scan_id, url, status, http_status, depth, total_violations, passes_count, incomplete_count, completed_at) 
             VALUES (?, ?, 'completed', ?, ?, ?, ?, ?, datetime('now'))`,
            scanId,
            pageRecord.url,
            pageRecord.http_status || 200,
            pageRecord.depth || 0,
            pageRecord.total_violations || 0,
            pageRecord.passes_count || 0,
            pageRecord.incomplete_count || 0
          );
        }
      } catch {}
    };

    const onPageFailed = (pageRecord) => {
      try {
        const existing = get(
          'SELECT id FROM scan_pages WHERE scan_id = ? AND url = ?',
          scanId,
          pageRecord.url
        );
        if (existing) {
          run(
            `UPDATE scan_pages 
             SET status = 'failed',
                 http_status = ?,
                 error_message = ?,
                 completed_at = datetime('now')
             WHERE id = ?`,
            pageRecord.http_status || null,
            pageRecord.error_message || 'Page navigation failed',
            existing.id
          );
        } else {
          run(
            `INSERT INTO scan_pages (scan_id, url, status, http_status, depth, error_message, completed_at) 
             VALUES (?, ?, 'failed', ?, ?, ?, datetime('now'))`,
            scanId,
            pageRecord.url,
            pageRecord.http_status || null,
            pageRecord.depth || 0,
            pageRecord.error_message || 'Page navigation failed'
          );
        }
      } catch {}
    };

    // 4. Execute authentic browser website crawl
    const scanResult = await runAccessibilityScan(trimmedUrl, {
      maxPages,
      maxDepth,
      timeoutMs: 25000,
      allowLocalhost,
      onPageDiscovered,
      onPageStarted,
      onPageCompleted,
      onPageFailed,
    });

    // 5. Atomically update scan summary and persist violations
    transaction(() => {
      run(
        `UPDATE scans 
         SET url = ?,
             status = 'completed',
             total_violations = ?,
             critical_count = ?,
             serious_count = ?,
             moderate_count = ?,
             minor_count = ?,
             passes_count = ?,
             inapplicable_count = ?,
             incomplete_count = ?,
             wcag_score = ?,
             wcag_grade = ?,
             pages_scanned = ?,
             pages_failed = ?,
             completed_at = datetime('now')
         WHERE id = ?`,
        scanResult.url,
        scanResult.totalViolations,
        scanResult.criticalCount,
        scanResult.seriousCount,
        scanResult.moderateCount,
        scanResult.minorCount,
        scanResult.passesCount,
        scanResult.inapplicableCount,
        scanResult.incompleteCount || 0,
        scanResult.score ?? null,
        scanResult.grade ?? null,
        scanResult.pagesScanned || 1,
        scanResult.pagesFailed || 0,
        scanId
      );

      // 6. Persist concrete violations with page_url, wcag_principle, and deterministic guidance
      for (const v of scanResult.violations) {
        run(
          `INSERT INTO scan_violations (
            scan_id, page_url, rule_id, impact, description, help_text, help_url,
            wcag_tags, wcag_principle, selector, html_snippet, failure_summary, deterministic_guidance
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          scanId,
          v.page_url || scanResult.url,
          v.rule_id,
          v.impact,
          v.description,
          v.help_text,
          v.help_url,
          v.wcag_tags,
          v.wcag_principle || null,
          v.selector,
          v.html_snippet,
          v.failure_summary,
          v.deterministic_guidance
        );
      }

      // 6.b Persist real manual-review checks (axe-core incomplete results)
      for (const m of (scanResult.manualChecks || [])) {
        run(
          `INSERT INTO scan_manual_checks (
            scan_id, page_url, rule_id, impact, description, help_text, help_url,
            wcag_tags, wcag_principle, selector, html_snippet, failure_summary, review_guidance
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          scanId,
          m.page_url || scanResult.url,
          m.rule_id,
          m.impact || null,
          m.description,
          m.help_text || null,
          m.help_url || null,
          m.wcag_tags || null,
          m.wcag_principle || null,
          m.selector || '',
          m.html_snippet || '',
          m.failure_summary || null,
          m.review_guidance || null
        );
      }
    });

    const savedScan = get('SELECT * FROM scans WHERE id = ?', scanId);
    const savedPages = all('SELECT * FROM scan_pages WHERE scan_id = ? ORDER BY id ASC', scanId);
    const savedViolations = all('SELECT * FROM scan_violations WHERE scan_id = ? ORDER BY id ASC', scanId);
    const savedManualChecks = all('SELECT * FROM scan_manual_checks WHERE scan_id = ? ORDER BY id ASC', scanId);

    const scoring = calculateWcagScore(
      savedViolations,
      savedScan.passes_count || 0,
      savedScan.incomplete_count || savedManualChecks.length || 0
    );

    return res.status(201).json({
      message: 'Accessibility scan completed successfully',
      scan: {
        ...savedScan,
        wcag_score: savedScan.wcag_score ?? scoring.overallScore,
        wcag_grade: scoring.grade,
      },
      pages: savedPages,
      violations: savedViolations,
      manualChecks: savedManualChecks,
      scoring,
      automatedTestingDisclaimer: AUTOMATED_TESTING_DISCLAIMER,
    });
  } catch (err) {
    // Record scan failure in database
    const errorMessage = err.message || 'Scan failed due to an unexpected error.';
    run(
      `UPDATE scans 
       SET status = 'failed',
           error_message = ?,
           completed_at = datetime('now')
       WHERE id = ?`,
      errorMessage,
      scanId
    );

    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      error: errorMessage,
      scanId,
      code: err.code || 'SCAN_FAILED',
    });
  }
});

/**
 * GET /api/scans
 * Returns scan history for the authenticated user with consistent grade gating.
 */
scanRouter.get('/', requireAuth, (req, res) => {
  const scans = all(
    'SELECT * FROM scans WHERE user_id = ? ORDER BY id DESC LIMIT 50',
    req.user.id
  );

  const normalizedScans = scans.map((s) => ({
    ...s,
    wcag_grade: s.wcag_score !== null && s.wcag_score !== undefined
      ? getGrade(s.wcag_score, s.critical_count, s.serious_count)
      : (s.wcag_grade ?? null),
  }));

  return res.status(200).json({
    scans: normalizedScans,
    automatedTestingDisclaimer: AUTOMATED_TESTING_DISCLAIMER,
  });
});

/**
 * Helper to escape CSV cell contents safely according to RFC 4180.
 */
function escapeCsvCell(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * GET /api/scans/compare
 * Compares two audits belonging to the user, identifying resolved, remaining, and new findings.
 */
scanRouter.get('/compare', requireAuth, (req, res) => {
  const { baseId: rawBaseId, targetId: rawTargetId } = req.query;
  const baseId = parseInt(rawBaseId, 10);
  const targetId = parseInt(rawTargetId, 10);

  if (isNaN(baseId) || isNaN(targetId)) {
    return res.status(400).json({ error: 'Both baseId and targetId query parameters must be valid integers.' });
  }

  if (baseId === targetId) {
    return res.status(400).json({ error: 'Cannot compare a scan with itself. Please select two distinct scans.' });
  }

  const baseScan = get('SELECT * FROM scans WHERE id = ?', baseId);
  const targetScan = get('SELECT * FROM scans WHERE id = ?', targetId);

  if (!baseScan || baseScan.user_id !== req.user.id) {
    return res.status(404).json({ error: `Base scan #${baseId} not found or not owned by your account.` });
  }
  if (!targetScan || targetScan.user_id !== req.user.id) {
    return res.status(404).json({ error: `Target scan #${targetId} not found or not owned by your account.` });
  }

  const basePages = all('SELECT * FROM scan_pages WHERE scan_id = ? ORDER BY id ASC', baseId);
  const targetPages = all('SELECT * FROM scan_pages WHERE scan_id = ? ORDER BY id ASC', targetId);

  const baseViolations = all('SELECT * FROM scan_violations WHERE scan_id = ? ORDER BY id ASC', baseId);
  const targetViolations = all('SELECT * FROM scan_violations WHERE scan_id = ? ORDER BY id ASC', targetId);

  // Check origin match
  let differentOriginWarning = false;
  try {
    const baseOrigin = new URL(baseScan.url).origin.toLowerCase();
    const targetOrigin = new URL(targetScan.url).origin.toLowerCase();
    if (baseOrigin !== targetOrigin) {
      differentOriginWarning = true;
    }
  } catch {}

  const scopeDifference = 
    baseScan.max_pages !== targetScan.max_pages || 
    baseScan.max_depth !== targetScan.max_depth;

  const targetAuditedPageUrls = new Set(
    targetPages
      .filter((p) => p.status === 'completed')
      .map((p) => p.url)
  );

  // Stable key: rule_id + page_url + selector
  const makeFindingKey = (v) => `${v.rule_id}:::${v.page_url || ''}:::${v.selector || ''}`;

  const targetFindingMap = new Map();
  for (const v of targetViolations) {
    targetFindingMap.set(makeFindingKey(v), v);
  }

  const baseFindingMap = new Map();
  for (const v of baseViolations) {
    baseFindingMap.set(makeFindingKey(v), v);
  }

  const verifiedResolved = [];
  const unverifiedResolved = [];
  const remaining = [];
  const newFindings = [];

  for (const [key, bVal] of baseFindingMap.entries()) {
    if (targetFindingMap.has(key)) {
      remaining.push({
        baseViolation: bVal,
        targetViolation: targetFindingMap.get(key),
      });
    } else {
      // It is not in target scan. Did target scan actually audit that page?
      const wasPageAudited = targetAuditedPageUrls.has(bVal.page_url);
      if (wasPageAudited) {
        verifiedResolved.push({
          ...bVal,
          verified: true,
          resolutionStatus: 'Resolved and verified across re-audited page',
        });
      } else {
        unverifiedResolved.push({
          ...bVal,
          verified: false,
          resolutionStatus: 'Unverified: Origin page was not included in target crawl scope',
        });
      }
    }
  }

  for (const [key, tVal] of targetFindingMap.entries()) {
    if (!baseFindingMap.has(key)) {
      newFindings.push(tVal);
    }
  }

  return res.status(200).json({
    baseScan: {
      id: baseScan.id,
      url: baseScan.url,
      status: baseScan.status,
      created_at: baseScan.created_at,
      completed_at: baseScan.completed_at,
      total_violations: baseScan.total_violations,
      pages_scanned: baseScan.pages_scanned,
      pages_failed: baseScan.pages_failed,
      max_pages: baseScan.max_pages,
      max_depth: baseScan.max_depth,
    },
    targetScan: {
      id: targetScan.id,
      url: targetScan.url,
      status: targetScan.status,
      created_at: targetScan.created_at,
      completed_at: targetScan.completed_at,
      total_violations: targetScan.total_violations,
      pages_scanned: targetScan.pages_scanned,
      pages_failed: targetScan.pages_failed,
      max_pages: targetScan.max_pages,
      max_depth: targetScan.max_depth,
    },
    comparison: {
      resolvedCount: verifiedResolved.length,
      unverifiedResolvedCount: unverifiedResolved.length,
      remainingCount: remaining.length,
      newCount: newFindings.length,
      netViolationChange: targetScan.total_violations - baseScan.total_violations,
      basePagesCount: baseScan.pages_scanned,
      targetPagesCount: targetScan.pages_scanned,
      scopeDifference,
      differentOriginWarning,
      verifiedResolved,
      unverifiedResolved,
      remaining,
      newFindings,
    },
    automatedTestingDisclaimer: AUTOMATED_TESTING_DISCLAIMER,
  });
});

/**
 * GET /api/scans/:id/export
 * Exports complete audit data in JSON, CSV, or SARIF 2.1.0 format with strict escaping and honesty disclaimers.
 */
scanRouter.get('/:id/export', requireAuth, (req, res) => {
  const scanId = parseInt(req.params.id, 10);
  if (isNaN(scanId)) {
    return res.status(400).json({ error: 'Invalid scan ID.' });
  }

  const scan = get('SELECT * FROM scans WHERE id = ?', scanId);
  if (!scan || scan.user_id !== req.user.id) {
    return res.status(404).json({ error: 'Scan not found.' });
  }

  const pages = all('SELECT * FROM scan_pages WHERE scan_id = ? ORDER BY id ASC', scanId);
  const violations = all('SELECT * FROM scan_violations WHERE scan_id = ? ORDER BY id ASC', scanId);
  const manualChecks = all('SELECT * FROM scan_manual_checks WHERE scan_id = ? ORDER BY id ASC', scanId);

  const format = (req.query.format || 'json').toLowerCase();

  if (format === 'sarif') {
    const gatedGrade = scan.wcag_score !== null && scan.wcag_score !== undefined
      ? getGrade(scan.wcag_score, scan.critical_count, scan.serious_count)
      : (scan.wcag_grade ?? null);
    const sarifPayload = generateSarifReport(scan, violations, manualChecks, { gatedGrade });
    res.setHeader('Content-Type', 'application/sarif+json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="accessguard-audit-${scan.id}.sarif"`);
    return res.status(200).send(JSON.stringify(sarifPayload, null, 2));
  }

  if (format === 'csv') {
    const headers = [
      'Scan ID',
      'Finding Status',
      'Target URL',
      'Page URL',
      'Rule ID',
      'Impact',
      'WCAG Criteria',
      'Description',
      'Element Selector',
      'HTML Snippet',
      'Review Details / Failure Summary',
      'Guidance',
      'Help URL',
    ];

    const rows = [headers.join(',')];

    if (violations.length === 0 && manualChecks.length === 0) {
      rows.push([
        escapeCsvCell(scan.id),
        escapeCsvCell('No Barriers Detected'),
        escapeCsvCell(scan.url),
        escapeCsvCell(scan.url),
        escapeCsvCell('NONE'),
        escapeCsvCell('info'),
        escapeCsvCell('N/A'),
        escapeCsvCell('Zero automated accessibility violations detected'),
        escapeCsvCell(''),
        escapeCsvCell(''),
        escapeCsvCell(''),
        escapeCsvCell('Automated testing evaluates ~30-40% of WCAG. Comprehensive manual audit required.'),
        escapeCsvCell(''),
      ].join(','));
    } else {
      // Confirmed automated violations
      for (const v of violations) {
        rows.push([
          escapeCsvCell(scan.id),
          escapeCsvCell('Confirmed Violation'),
          escapeCsvCell(scan.url),
          escapeCsvCell(v.page_url || scan.url),
          escapeCsvCell(v.rule_id),
          escapeCsvCell(v.impact),
          escapeCsvCell(v.wcag_tags || ''),
          escapeCsvCell(v.description),
          escapeCsvCell(v.selector || ''),
          escapeCsvCell(v.html_snippet || ''),
          escapeCsvCell(v.failure_summary || ''),
          escapeCsvCell(v.deterministic_guidance || ''),
          escapeCsvCell(v.help_url || ''),
        ].join(','));
      }

      // Items requiring human review
      for (const m of manualChecks) {
        rows.push([
          escapeCsvCell(scan.id),
          escapeCsvCell('Needs Manual Review'),
          escapeCsvCell(scan.url),
          escapeCsvCell(m.page_url || scan.url),
          escapeCsvCell(m.rule_id),
          escapeCsvCell(m.impact || 'review'),
          escapeCsvCell(m.wcag_tags || ''),
          escapeCsvCell(m.description),
          escapeCsvCell(m.selector || ''),
          escapeCsvCell(m.html_snippet || ''),
          escapeCsvCell(m.failure_summary || ''),
          escapeCsvCell(m.review_guidance || ''),
          escapeCsvCell(m.help_url || ''),
        ].join(','));
      }
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="accessguard-audit-${scan.id}.csv"`);
    return res.status(200).send(rows.join('\r\n'));
  }

  // JSON export
  const exportPayload = {
    exportVersion: '1.0.0',
    exportedAt: new Date().toISOString(),
    audit: {
      id: scan.id,
      targetUrl: scan.url,
      status: scan.status,
      wcagVersion: scan.wcag_version,
      startedAt: scan.created_at,
      completedAt: scan.completed_at,
      durationSeconds: scan.completed_at && scan.created_at
        ? Math.max(1, Math.round((new Date(scan.completed_at) - new Date(scan.created_at)) / 1000))
        : null,
      scope: {
        maxPages: scan.max_pages,
        maxDepth: scan.max_depth,
        pagesDiscovered: pages.length,
        pagesScanned: scan.pages_scanned,
        pagesFailed: scan.pages_failed,
        partialCoverageNotice: scan.pages_failed > 0 || pages.length >= scan.max_pages,
      },
      summary: {
        totalViolations: scan.total_violations,
        critical: scan.critical_count,
        serious: scan.serious_count,
        moderate: scan.moderate_count,
        minor: scan.minor_count,
        manualReviewCount: scan.incomplete_count || manualChecks.length || 0,
        passesCount: scan.passes_count,
        inapplicableCount: scan.inapplicable_count,
        wcagScore: scan.wcag_score ?? null,
        wcagGrade: scan.wcag_score !== null && scan.wcag_score !== undefined
          ? getGrade(scan.wcag_score, scan.critical_count, scan.serious_count)
          : (scan.wcag_grade ?? null),
      },
      pages: pages.map((p) => ({
        url: p.url,
        status: p.status,
        httpStatus: p.http_status,
        depth: p.depth,
        violationsCount: p.total_violations,
        passesCount: p.passes_count,
        manualReviewCount: p.incomplete_count || 0,
        errorMessage: p.error_message,
      })),
      violations: violations.map((v) => ({
        pageUrl: v.page_url,
        ruleId: v.rule_id,
        impact: v.impact,
        description: v.description,
        helpText: v.help_text,
        helpUrl: v.help_url,
        wcagTags: v.wcag_tags,
        wcagPrinciple: v.wcag_principle || null,
        selector: v.selector,
        htmlSnippet: v.html_snippet,
        failureSummary: v.failure_summary,
        remediationGuidance: v.deterministic_guidance,
        findingStatus: 'confirmed_violation',
      })),
      manualChecks: manualChecks.map((m) => ({
        pageUrl: m.page_url,
        ruleId: m.rule_id,
        impact: m.impact,
        description: m.description,
        helpText: m.help_text,
        helpUrl: m.help_url,
        wcagTags: m.wcag_tags,
        selector: m.selector,
        htmlSnippet: m.html_snippet,
        failureSummary: m.failure_summary,
        reviewGuidance: m.review_guidance,
        findingStatus: 'needs_manual_review',
      })),
      automatedTestingDisclaimer: AUTOMATED_TESTING_DISCLAIMER,
    },
  };

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="accessguard-audit-${scan.id}.json"`);
  return res.status(200).json(exportPayload);
});

/**
 * GET /api/scans/:id/sarif
 * Dedicated convenience endpoint for SARIF 2.1.0 static analysis export.
 */
scanRouter.get('/:id/sarif', requireAuth, (req, res) => {
  const scanId = parseInt(req.params.id, 10);
  if (isNaN(scanId)) {
    return res.status(400).json({ error: 'Invalid scan ID.' });
  }

  const scan = get('SELECT * FROM scans WHERE id = ?', scanId);
  if (!scan || scan.user_id !== req.user.id) {
    return res.status(404).json({ error: 'Scan not found.' });
  }

  const violations = all('SELECT * FROM scan_violations WHERE scan_id = ? ORDER BY id ASC', scanId);
  const manualChecks = all('SELECT * FROM scan_manual_checks WHERE scan_id = ? ORDER BY id ASC', scanId);

  const gatedGrade = scan.wcag_score !== null && scan.wcag_score !== undefined
    ? getGrade(scan.wcag_score, scan.critical_count, scan.serious_count)
    : (scan.wcag_grade ?? null);
  const sarifPayload = generateSarifReport(scan, violations, manualChecks, { gatedGrade });
  res.setHeader('Content-Type', 'application/sarif+json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="accessguard-audit-${scan.id}.sarif"`);
  return res.status(200).send(JSON.stringify(sarifPayload, null, 2));
});

/**
 * GET /api/scans/:id
 * Returns a specific scan along with its scanned pages, concrete violations, and manual-review checks.
 */
scanRouter.get('/:id', requireAuth, (req, res) => {
  const scanId = parseInt(req.params.id, 10);
  if (isNaN(scanId)) {
    return res.status(400).json({ error: 'Invalid scan ID.' });
  }

  const scan = get('SELECT * FROM scans WHERE id = ?', scanId);
  if (!scan || scan.user_id !== req.user.id) {
    return res.status(404).json({ error: 'Scan not found.' });
  }

  const pages = all('SELECT * FROM scan_pages WHERE scan_id = ? ORDER BY id ASC', scanId);
  const violations = all('SELECT * FROM scan_violations WHERE scan_id = ? ORDER BY id ASC', scanId);
  const manualChecks = all('SELECT * FROM scan_manual_checks WHERE scan_id = ? ORDER BY id ASC', scanId);

  const scoring = calculateWcagScore(
    violations,
    scan.passes_count || 0,
    scan.incomplete_count || manualChecks.length || 0
  );

  return res.status(200).json({
    scan: {
      ...scan,
      wcag_score: scan.wcag_score ?? scoring.overallScore,
      wcag_grade: scoring.grade,
    },
    pages,
    violations,
    manualChecks,
    scoring,
    automatedTestingDisclaimer: AUTOMATED_TESTING_DISCLAIMER,
  });
});
