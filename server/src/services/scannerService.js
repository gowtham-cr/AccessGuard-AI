import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { validateScanUrl, isRequestSafe } from './ssrfValidator.js';
import { getDeterministicGuidance } from './deterministicGuidance.js';

export const AUTOMATED_TESTING_DISCLAIMER = 
  'Automated barrier audits evaluate measurable algorithmic checks covering approximately 30-40% of WCAG success criteria. A scan with zero automated violations does not guarantee full WCAG compliance. Comprehensive accessibility compliance requires manual keyboard navigation, screen reader testing, and cognitive review.';

// Non-HTML asset extensions to exclude from crawler discovery
const NON_HTML_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico', '.bmp', '.tiff',
  '.pdf', '.zip', '.tar', '.gz', '.7z', '.rar',
  '.mp4', '.mp3', '.wav', '.ogg', '.webm', '.avi', '.mov',
  '.css', '.js', '.mjs', '.json', '.xml', '.csv', '.tsv',
  '.woff', '.woff2', '.ttf', '.eot', '.otf',
  '.exe', '.dmg', '.apk', '.bin', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
]);

/**
 * Normalizes an internal hyperlink URL, stripping hash fragments and filtering non-HTML assets.
 * 
 * @param {string} rawHref 
 * @param {string} baseUrl 
 * @returns {string|null} Normalized absolute URL string or null if invalid/non-HTML
 */
export function normalizeCrawlerUrl(rawHref, baseUrl) {
  if (!rawHref || typeof rawHref !== 'string') return null;
  const trimmed = rawHref.trim();
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('javascript:') || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) {
    return null;
  }

  try {
    const parsed = new URL(trimmed, baseUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    parsed.hash = ''; // Remove fragments

    const pathname = parsed.pathname.toLowerCase();
    const lastSlash = pathname.lastIndexOf('/');
    const lastSegment = lastSlash !== -1 ? pathname.slice(lastSlash) : pathname;
    const dotIndex = lastSegment.lastIndexOf('.');
    if (dotIndex !== -1) {
      const ext = lastSegment.slice(dotIndex);
      if (NON_HTML_EXTENSIONS.has(ext)) {
        return null;
      }
    }

    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Transforms axe-core raw violations for a specific page into structured records.
 */
function processAxeViolations(axeResults, pageUrl) {
  const structuredViolations = [];
  let criticalCount = 0;
  let seriousCount = 0;
  let moderateCount = 0;
  let minorCount = 0;

  for (const v of (axeResults.violations || [])) {
    const impact = (v.impact || 'moderate').toLowerCase();
    const wcagTags = (v.tags || [])
      .filter((t) => t.toLowerCase().startsWith('wcag'))
      .join(', ');

    const guidance = getDeterministicGuidance(v.id, v.help, v.helpUrl);

    if (v.nodes && v.nodes.length > 0) {
      for (const node of v.nodes) {
        if (impact === 'critical') criticalCount++;
        else if (impact === 'serious') seriousCount++;
        else if (impact === 'moderate') moderateCount++;
        else if (impact === 'minor') minorCount++;

        const selector = Array.isArray(node.target) ? node.target.join(' ') : String(node.target || '');
        const htmlSnippet = (node.html || '').trim().slice(0, 1000);

        structuredViolations.push({
          page_url: pageUrl,
          rule_id: v.id,
          impact,
          description: v.description,
          help_text: v.help,
          help_url: v.helpUrl,
          wcag_tags: wcagTags,
          selector,
          html_snippet: htmlSnippet,
          failure_summary: node.failureSummary || null,
          deterministic_guidance: guidance,
          ai_explanation: null,
          ai_code_fix: null,
        });
      }
    } else {
      if (impact === 'critical') criticalCount++;
      else if (impact === 'serious') seriousCount++;
      else if (impact === 'moderate') moderateCount++;
      else if (impact === 'minor') minorCount++;

      structuredViolations.push({
        page_url: pageUrl,
        rule_id: v.id,
        impact,
        description: v.description,
        help_text: v.help,
        help_url: v.helpUrl,
        wcag_tags: wcagTags,
        selector: 'document',
        html_snippet: '',
        failure_summary: null,
        deterministic_guidance: guidance,
        ai_explanation: null,
        ai_code_fix: null,
      });
    }
  }

  const structuredManualChecks = [];
  for (const inc of (axeResults.incomplete || [])) {
    const impact = (inc.impact || 'moderate').toLowerCase();
    const wcagTags = (inc.tags || [])
      .filter((t) => t.toLowerCase().startsWith('wcag'))
      .join(', ');

    const baseGuidance = `Manual review required for ${inc.id}: ${inc.help || inc.description}. Automated engines cannot conclusively verify this check on dynamic or complex elements.`;

    if (inc.nodes && inc.nodes.length > 0) {
      for (const node of inc.nodes) {
        const selector = Array.isArray(node.target) ? node.target.join(' ') : String(node.target || '');
        const htmlSnippet = (node.html || '').trim().slice(0, 1000);
        const failureSummary = node.failureSummary || null;

        const guidance = failureSummary
          ? `Manual verification required: ${failureSummary.split('\n')[0].replace(/^Fix (any|all) of the following:\s*/i, '')}. Test with assistive technology or specialized verification tools.`
          : baseGuidance;

        structuredManualChecks.push({
          page_url: pageUrl,
          rule_id: inc.id,
          impact,
          description: inc.description,
          help_text: inc.help,
          help_url: inc.helpUrl,
          wcag_tags: wcagTags,
          selector,
          html_snippet: htmlSnippet,
          failure_summary: failureSummary,
          review_guidance: guidance,
        });
      }
    } else {
      structuredManualChecks.push({
        page_url: pageUrl,
        rule_id: inc.id,
        impact,
        description: inc.description,
        help_text: inc.help,
        help_url: inc.helpUrl,
        wcag_tags: wcagTags,
        selector: 'document',
        html_snippet: '',
        failure_summary: null,
        review_guidance: baseGuidance,
      });
    }
  }

  return {
    structuredViolations,
    criticalCount,
    seriousCount,
    moderateCount,
    minorCount,
    passesCount: (axeResults.passes || []).length,
    inapplicableCount: (axeResults.inapplicable || []).length,
    structuredManualChecks,
    incompleteCount: structuredManualChecks.length,
  };
}

/**
 * Runs a website-wide accessibility audit discovering internal pages on the same origin.
 * 
 * @param {string} targetUrl - Initial website entry point URL
 * @param {object} options
 * @param {number} [options.maxPages=1] - Maximum number of pages to discover and audit (clamped 1-15)
 * @param {number} [options.maxDepth=1] - Maximum link depth from root (clamped 1-4)
 * @param {number} [options.timeoutMs=25000] - Navigation timeout per page in milliseconds
 * @param {boolean} [options.allowLocalhost=false] - Permits loopback exclusively for local test fixtures
 * @param {function} [options.onPageDiscovered] - Callback when an internal page is discovered
 * @param {function} [options.onPageStarted] - Callback when an internal page audit starts
 * @param {function} [options.onPageCompleted] - Callback when a page audit completes
 * @param {function} [options.onPageFailed] - Callback when a page navigation/audit fails
 * @returns {Promise<object>} Comprehensive website audit results with page-level findings
 */
export async function runWebsiteAccessibilityScan(targetUrl, options = {}) {
  const maxPages = Math.min(15, Math.max(1, typeof options.maxPages === 'number' ? options.maxPages : 1));
  const maxDepth = Math.min(4, Math.max(1, typeof options.maxDepth === 'number' ? options.maxDepth : 1));
  const timeoutMs = typeof options.timeoutMs === 'number' ? options.timeoutMs : 25000;
  const allowLocalhost = Boolean(options.allowLocalhost);

  // 1. SSRF Pre-flight Validation of Initial Root Target
  const rootValidation = await validateScanUrl(targetUrl, { allowLocalhost });
  if (!rootValidation.valid) {
    const error = new Error(rootValidation.reason);
    error.code = 'SSRF_VALIDATION_FAILED';
    error.statusCode = 400;
    throw error;
  }

  const rootUrl = rootValidation.sanitizedUrl;
  const rootOrigin = new URL(rootUrl).origin.toLowerCase();

  let browser = null;
  let context = null;

  try {
    // 2. Launch Chromium in headless mode
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    // 3. Isolated browser context
    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 AccessGuard-AI-Auditor/1.0',
      viewport: { width: 1280, height: 800 },
      ignoreHTTPSErrors: false,
    });

    // 4. In-flight Request Interception for SSRF Defense
    let ssrfAbortReason = null;
    await context.route('**/*', async (route) => {
      try {
        const reqUrl = route.request().url();
        const safe = await isRequestSafe(reqUrl, { allowLocalhost });
        if (!safe) {
          ssrfAbortReason = `Network request to prohibited destination was blocked: ${reqUrl}`;
          await route.abort('blockedbyclient').catch(() => {});
        } else {
          await route.continue().catch(() => {});
        }
      } catch {
        await route.abort('blockedbyclient').catch(() => {});
      }
    });

    // 5. Crawler BFS state
    const queue = [{ url: rootUrl, depth: 0 }];
    const visitedSet = new Set([rootUrl]);
    const discoveredList = [{ url: rootUrl, depth: 0 }];

    if (options.onPageDiscovered) {
      options.onPageDiscovered({ url: rootUrl, depth: 0 });
    }

    const pagesResult = [];
    const allViolations = [];
    const allManualChecks = [];
    let totalCritical = 0;
    let totalSerious = 0;
    let totalModerate = 0;
    let totalMinor = 0;
    let totalPasses = 0;
    let totalInapplicable = 0;
    let totalIncomplete = 0;

    // 6. Crawl loop enforcing maxPages limit
    while (queue.length > 0 && pagesResult.length < maxPages) {
      const currentItem = queue.shift();
      const currentUrl = currentItem.url;
      const currentDepth = currentItem.depth;

      if (options.onPageStarted) {
        options.onPageStarted({ url: currentUrl, depth: currentDepth });
      }

      // Pre-flight SSRF check for every discovered URL before navigation
      if (currentUrl !== rootUrl) {
        const pageValidation = await validateScanUrl(currentUrl, { allowLocalhost });
        if (!pageValidation.valid) {
          const pageRecord = {
            url: currentUrl,
            status: 'failed',
            http_status: null,
            depth: currentDepth,
            error_message: `SSRF Security Policy: ${pageValidation.reason}`,
            total_violations: 0,
            passes_count: 0,
          };
          pagesResult.push(pageRecord);
          if (options.onPageFailed) options.onPageFailed(pageRecord);
          continue;
        }
      }

      const page = await context.newPage();
      page.setDefaultNavigationTimeout(timeoutMs);
      page.setDefaultTimeout(timeoutMs);

      let navSuccess = false;
      let httpStatus = 200;
      let navErrorMessage = null;

      try {
        const response = await page.goto(currentUrl, {
          waitUntil: 'domcontentloaded',
          timeout: timeoutMs,
        });

        if (response) {
          httpStatus = response.status();
        }

        if (httpStatus >= 400) {
          navErrorMessage = `Target server responded with HTTP error ${httpStatus}`;
        } else {
          navSuccess = true;
        }
      } catch (navErr) {
        if (ssrfAbortReason) {
          navErrorMessage = `Security restriction: Request or redirect blocked. ${ssrfAbortReason}`;
        } else if (navErr.message?.includes('Timeout') || navErr.name === 'TimeoutError') {
          navErrorMessage = `Page navigation timed out after ${timeoutMs / 1000} seconds.`;
        } else if (navErr.message?.includes('ERR_CONNECTION_REFUSED')) {
          navErrorMessage = 'Connection refused by the target server.';
        } else if (navErr.message?.includes('ERR_NAME_NOT_RESOLVED')) {
          navErrorMessage = 'Unable to resolve the domain name.';
        } else {
          navErrorMessage = `Unable to access page: ${navErr.message}`;
        }
      }

      // If initial root page fails completely, throw error as before
      if (!navSuccess && currentDepth === 0 && pagesResult.length === 0) {
        await page.close().catch(() => {});
        const err = new Error(navErrorMessage || 'Root page unreachable');
        err.code = ssrfAbortReason ? 'SSRF_BLOCKED' : 'TARGET_UNREACHABLE';
        err.statusCode = ssrfAbortReason ? 400 : 422;
        throw err;
      }

      // If subpage navigation failed, record page failure and continue crawler
      if (!navSuccess) {
        await page.close().catch(() => {});
        const pageRecord = {
          url: currentUrl,
          status: 'failed',
          http_status: httpStatus || null,
          depth: currentDepth,
          error_message: navErrorMessage,
          total_violations: 0,
          passes_count: 0,
        };
        pagesResult.push(pageRecord);
        if (options.onPageFailed) options.onPageFailed(pageRecord);
        continue;
      }

      // Stabilize DOM
      await page.waitForTimeout(300);

      // 7. Discover internal links on same origin if within depth & page budget
      if (currentDepth + 1 <= maxDepth && (visitedSet.size) < maxPages) {
        try {
          const rawAnchors = await page.$$eval('a[href]', (anchors) =>
            anchors.map((a) => a.getAttribute('href'))
          ).catch(() => []);

          for (const rawHref of rawAnchors) {
            const normalized = normalizeCrawlerUrl(rawHref, page.url());
            if (normalized) {
              try {
                const parsed = new URL(normalized);
                if (parsed.origin.toLowerCase() === rootOrigin) {
                  if (!visitedSet.has(normalized) && visitedSet.size < maxPages) {
                    visitedSet.add(normalized);
                    queue.push({ url: normalized, depth: currentDepth + 1 });
                    discoveredList.push({ url: normalized, depth: currentDepth + 1 });
                    if (options.onPageDiscovered) {
                      options.onPageDiscovered({ url: normalized, depth: currentDepth + 1 });
                    }
                  }
                }
              } catch {}
            }
          }
        } catch {}
      }

      // 8. Run genuine axe-core audit on current page
      try {
        const axeResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();

        const processed = processAxeViolations(axeResults, currentUrl);

        allViolations.push(...processed.structuredViolations);
        allManualChecks.push(...processed.structuredManualChecks);
        totalCritical += processed.criticalCount;
        totalSerious += processed.seriousCount;
        totalModerate += processed.moderateCount;
        totalMinor += processed.minorCount;
        totalPasses += processed.passesCount;
        totalInapplicable += processed.inapplicableCount;
        totalIncomplete += processed.incompleteCount;

        const pageRecord = {
          url: currentUrl,
          status: 'completed',
          http_status: httpStatus,
          depth: currentDepth,
          error_message: null,
          total_violations: processed.structuredViolations.length,
          passes_count: processed.passesCount,
          incomplete_count: processed.incompleteCount,
        };
        pagesResult.push(pageRecord);

        if (options.onPageCompleted) {
          options.onPageCompleted({
            ...pageRecord,
            violations: processed.structuredViolations,
            manualChecks: processed.structuredManualChecks,
          });
        }
      } catch (axeErr) {
        const pageRecord = {
          url: currentUrl,
          status: 'failed',
          http_status: httpStatus,
          depth: currentDepth,
          error_message: `Axe accessibility analysis error: ${axeErr.message}`,
          total_violations: 0,
          passes_count: 0,
          incomplete_count: 0,
        };
        pagesResult.push(pageRecord);
        if (options.onPageFailed) options.onPageFailed(pageRecord);
      } finally {
        await page.close().catch(() => {});
      }
    }

    const pagesScanned = pagesResult.filter((p) => p.status === 'completed').length;
    const pagesFailed = pagesResult.filter((p) => p.status === 'failed').length;

    return {
      url: rootUrl,
      status: pagesScanned > 0 ? 'completed' : 'failed',
      totalViolations: allViolations.length,
      criticalCount: totalCritical,
      seriousCount: totalSerious,
      moderateCount: totalModerate,
      minorCount: totalMinor,
      passesCount: totalPasses,
      inapplicableCount: totalInapplicable,
      incompleteCount: totalIncomplete,
      pagesScanned,
      pagesFailed,
      maxPages,
      maxDepth,
      pages: pagesResult,
      violations: allViolations,
      manualChecks: allManualChecks,
      wcagVersion: 'WCAG 2.1 / 2.2 AA',
      automatedTestingDisclaimer: AUTOMATED_TESTING_DISCLAIMER,
    };
  } finally {
    // 9. Guarantee cleanup of browser resources
    if (context) {
      await context.close().catch(() => {});
    }
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

/**
 * Backward-compatible single or multi-page accessibility scan entry point.
 */
export async function runAccessibilityScan(targetUrl, options = {}) {
  return runWebsiteAccessibilityScan(targetUrl, options);
}
