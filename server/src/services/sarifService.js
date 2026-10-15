/**
 * SARIF 2.1.0 (Static Analysis Results Interchange Format) Export Service
 * Produces standards-compliant OASIS SARIF 2.1.0 JSON payloads for integration
 * with GitHub Code Scanning, VS Code SARIF viewers, and CI/CD pipelines.
 */

import { AUTOMATED_TESTING_DISCLAIMER } from './scannerService.js';
import { getGrade } from './wcagScorer.js';

export const SARIF_SCHEMA_URI = 'https://json.schemastore.org/sarif-2.1.0.json';
export const TOOL_NAME = 'AccessGuard-AI';
export const TOOL_VERSION = '1.0.0';
export const TOOL_INFORMATION_URI = 'https://github.com/accessguard-ai/accessguard';

/**
 * Maps accessibility finding impact levels to official SARIF 2.1.0 result levels.
 *
 * SARIF standard levels:
 * - 'error': Critical & serious accessibility violations (failing WCAG criteria)
 * - 'warning': Moderate accessibility issues
 * - 'note': Minor issues, cosmetic flaws, or best-practice advisories
 *
 * @param {string} impact - 'critical' | 'serious' | 'moderate' | 'minor'
 * @returns {'error' | 'warning' | 'note'}
 */
export function mapImpactToSarifLevel(impact) {
  switch ((impact || '').toLowerCase()) {
    case 'critical':
    case 'serious':
      return 'error';
    case 'moderate':
      return 'warning';
    case 'minor':
      return 'note';
    default:
      return 'warning';
  }
}

/**
 * Parses comma-separated or array WCAG tags into a clean array of strings.
 *
 * @param {string[]|string} tags
 * @returns {string[]}
 */
export function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.map((t) => String(t).trim()).filter(Boolean);
  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Generates an official SARIF 2.1.0 JSON document from an AccessGuard scan and its saved findings.
 *
 * @param {object} scan - The persisted scan database record
 * @param {Array<object>} [violations=[]] - Confirmed normalized accessibility violations
 * @param {Array<object>} [manualChecks=[]] - Incomplete checks flagged for human review
 * @param {object} [options={}] - Optional metadata overrides including pre-calculated gatedGrade
 * @returns {object} Valid SARIF 2.1.0 document
 */
export function generateSarifReport(scan = {}, violations = [], manualChecks = [], options = {}) {
  const safeViolations = Array.isArray(violations) ? violations : [];
  const safeManualChecks = Array.isArray(manualChecks) ? manualChecks : [];

  // 1. Build distinct rules dictionary from actual violations
  const rulesMap = new Map();

  for (const v of safeViolations) {
    const ruleId = v.rule_id || 'accessibility-violation';
    if (!rulesMap.has(ruleId)) {
      const rawTags = normalizeTags(v.wcag_tags);
      const tags = Array.from(new Set(['accessibility', ...rawTags]));

      const shortDesc = v.help_text || v.description || ruleId;
      const fullDesc = v.description || v.help_text || ruleId;
      const guidance = v.deterministic_guidance || '';

      const ruleObj = {
        id: ruleId,
        name: ruleId,
        shortDescription: {
          text: shortDesc,
        },
        fullDescription: {
          text: fullDesc,
        },
        defaultConfiguration: {
          level: mapImpactToSarifLevel(v.impact),
        },
        properties: {
          problemSeverity: v.impact || 'moderate',
          tags,
        },
      };

      if (v.help_url) {
        ruleObj.helpUri = v.help_url;
      }

      if (v.wcag_principle) {
        ruleObj.properties.wcagPrinciple = v.wcag_principle;
      }

      if (guidance) {
        ruleObj.help = {
          text: guidance,
          markdown: `### Remediation Guidance\n\n${guidance}`,
        };
      }

      rulesMap.set(ruleId, ruleObj);
    }
  }

  const rules = Array.from(rulesMap.values());
  const ruleIndexMap = new Map();
  rules.forEach((r, idx) => {
    ruleIndexMap.set(r.id, idx);
  });

  // 2. Map actual saved findings to SARIF result objects
  const results = safeViolations.map((v) => {
    const ruleId = v.rule_id || 'accessibility-violation';
    const ruleIndex = ruleIndexMap.get(ruleId) ?? -1;
    const level = mapImpactToSarifLevel(v.impact);
    const tags = normalizeTags(v.wcag_tags);

    const targetUrl = v.page_url || scan.url || 'about:blank';
    const selector = v.selector || 'document';

    const location = {
      physicalLocation: {
        artifactLocation: {
          uri: targetUrl,
        },
      },
    };

    if (v.html_snippet) {
      location.physicalLocation.region = {
        snippet: {
          text: v.html_snippet,
        },
      };
    }

    if (selector) {
      location.logicalLocations = [
        {
          fullyQualifiedName: selector,
          kind: 'element',
        },
      ];
    }

    const failureDetails = v.failure_summary
      ? `${v.description || ruleId}: ${v.failure_summary}`
      : v.description || v.help_text || ruleId;

    const resultObj = {
      ruleId,
      ruleIndex,
      level,
      message: {
        text: failureDetails,
      },
      locations: [location],
      properties: {
        impact: v.impact || 'moderate',
        selector,
        wcagTags: tags,
        wcagPrinciple: v.wcag_principle || null,
        findingStatus: 'confirmed_violation',
      },
    };

    if (v.deterministic_guidance) {
      resultObj.properties.remediationGuidance = v.deterministic_guidance;
    }

    return resultObj;
  });

  // 3. Format completed/end timestamp safely
  let endTimeUtc;
  try {
    endTimeUtc = scan.completed_at ? new Date(scan.completed_at).toISOString() : new Date().toISOString();
  } catch {
    endTimeUtc = new Date().toISOString();
  }

  // 4. Resolve WCAG grade: prefer explicit option if provided by caller,
  // otherwise apply transparent grade gating to prevent stale historical grades
  let resolvedGrade = null;
  const score = scan.wcag_score ?? scan.wcagScore;
  if (options?.gatedGrade !== undefined) {
    resolvedGrade = options.gatedGrade;
  } else if (options?.wcagGrade !== undefined) {
    resolvedGrade = options.wcagGrade;
  } else if (score !== null && score !== undefined) {
    const criticalCount = scan.critical_count ?? scan.criticalCount ?? safeViolations.filter((v) => (v.impact || '').toLowerCase() === 'critical').length;
    const seriousCount = scan.serious_count ?? scan.seriousCount ?? safeViolations.filter((v) => (v.impact || '').toLowerCase() === 'serious').length;
    resolvedGrade = getGrade(score, criticalCount, seriousCount);
  } else {
    resolvedGrade = scan.wcag_grade ?? scan.wcagGrade ?? null;
  }

  // 5. Construct complete SARIF 2.1.0 document
  return {
    $schema: SARIF_SCHEMA_URI,
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: TOOL_NAME,
            version: TOOL_VERSION,
            informationUri: TOOL_INFORMATION_URI,
            rules,
          },
        },
        invocations: [
          {
            executionSuccessful: scan.status !== 'failed',
            endTimeUtc,
          },
        ],
        results,
        properties: {
          scanId: scan.id ?? null,
          targetUrl: scan.url ?? null,
          wcagVersion: scan.wcag_version || 'WCAG 2.1 / 2.2 AA',
          wcagScore: score ?? null,
          wcagGrade: resolvedGrade,
          totalViolations: safeViolations.length,
          manualReviewCount: safeManualChecks.length,
          automatedTestingDisclaimer: AUTOMATED_TESTING_DISCLAIMER,
        },
      },
    ],
  };
}
