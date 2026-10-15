import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapTagToPrinciple,
  getPrincipleLabel,
  normalizeSelector,
  getPrimaryWcagTag,
  deduplicateViolations,
  calculateWcagScore,
  getGrade,
  IMPACT_WEIGHTS,
} from '../src/services/wcagScorer.js';

describe('WCAG Scoring, Principle Mapping & Finding Deduplication Engine', () => {
  describe('mapTagToPrinciple()', () => {
    test('correctly maps WCAG 1.x tags to Perceivable', () => {
      assert.equal(mapTagToPrinciple(['wcag111']), 'perceivable');
      assert.equal(mapTagToPrinciple(['wcag143', 'wcag2a']), 'perceivable');
      assert.equal(mapTagToPrinciple('wcag121, cat.color'), 'perceivable');
    });

    test('correctly maps WCAG 2.x tags to Operable', () => {
      assert.equal(mapTagToPrinciple(['wcag211']), 'operable');
      assert.equal(mapTagToPrinciple(['wcag244', 'wcag2aa']), 'operable');
      assert.equal(mapTagToPrinciple('wcag221, keyboard'), 'operable');
    });

    test('correctly maps WCAG 3.x tags to Understandable', () => {
      assert.equal(mapTagToPrinciple(['wcag311']), 'understandable');
      assert.equal(mapTagToPrinciple(['wcag332', 'wcag2a']), 'understandable');
    });

    test('correctly maps WCAG 4.x tags to Robust', () => {
      assert.equal(mapTagToPrinciple(['wcag412']), 'robust');
      assert.equal(mapTagToPrinciple(['wcag411']), 'robust');
    });

    test('defaults to best-practice when no WCAG criterion tag is present', () => {
      assert.equal(mapTagToPrinciple(['best-practice']), 'best-practice');
      assert.equal(mapTagToPrinciple([]), 'best-practice');
      assert.equal(mapTagToPrinciple(null), 'best-practice');
      assert.equal(mapTagToPrinciple('aria-valid-attr'), 'best-practice');
    });
  });

  describe('getPrincipleLabel()', () => {
    test('returns official capitalized W3C principle labels', () => {
      assert.equal(getPrincipleLabel('perceivable'), 'Perceivable');
      assert.equal(getPrincipleLabel('operable'), 'Operable');
      assert.equal(getPrincipleLabel('understandable'), 'Understandable');
      assert.equal(getPrincipleLabel('robust'), 'Robust');
      assert.equal(getPrincipleLabel('best-practice'), 'Best Practice');
      assert.equal(getPrincipleLabel('unknown'), 'Best Practice');
    });
  });

  describe('normalizeSelector()', () => {
    test('trims, lowercases, and collapses irregular whitespace', () => {
      assert.equal(normalizeSelector('  DIV.Header > P.text  '), 'div.header > p.text');
      assert.equal(normalizeSelector('button[type = "submit"]'), 'button[type = "submit"]');
      assert.equal(normalizeSelector(''), 'document');
      assert.equal(normalizeSelector(null), 'document');
    });
  });

  describe('getPrimaryWcagTag()', () => {
    test('extracts the specific wcag tag from mixed tags', () => {
      assert.equal(getPrimaryWcagTag(['cat.color', 'wcag143', 'wcag2aa']), 'wcag143');
      assert.equal(getPrimaryWcagTag(['best-practice']), 'best-practice');
      assert.equal(getPrimaryWcagTag([]), 'unknown');
    });
  });

  describe('getGrade()', () => {
    test('correctly determines letter grades according to standard thresholds', () => {
      assert.equal(getGrade(100), 'A');
      assert.equal(getGrade(90), 'A');
      assert.equal(getGrade(89), 'B');
      assert.equal(getGrade(70), 'B');
      assert.equal(getGrade(69), 'C');
      assert.equal(getGrade(50), 'C');
      assert.equal(getGrade(49), 'D');
      assert.equal(getGrade(30), 'D');
      assert.equal(getGrade(29), 'F');
      assert.equal(getGrade(0), 'F');
    });

    test('transparently caps Grade A to Grade B when one or more critical violations exist', () => {
      assert.equal(getGrade(100, 1), 'B');
      assert.equal(getGrade(95, 1), 'B');
      assert.equal(getGrade(90, 2), 'B');
    });

    test('transparently caps to Grade C when severe critical violations (>=3) exist', () => {
      assert.equal(getGrade(95, 3), 'C');
      assert.equal(getGrade(90, 5), 'C');
    });

    test('transparently caps Grade A to Grade B when systemic serious violations (>=3) exist', () => {
      // Systemic serious violations (>=3) capped at B
      assert.equal(getGrade(95, 0, 3), 'B');
      assert.equal(getGrade(95, 0, 5), 'B');
      // Pervasive serious violations (>=6) capped at C
      assert.equal(getGrade(95, 0, 6), 'C');
      // Isolated serious violations (<3) without critical violations do not trigger systemic cap
      assert.equal(getGrade(95, 0, 1), 'A');
      assert.equal(getGrade(95, 0, 2), 'A');
    });

    test('does not artificially elevate low scores regardless of gating rules', () => {
      assert.equal(getGrade(45, 1, 0), 'D');
      assert.equal(getGrade(20, 1, 0), 'F');
      assert.equal(getGrade(45, 0, 4), 'D');
      assert.equal(getGrade(15, 0, 5), 'F');
    });

    test('supports options object parameter for historical and caller compatibility', () => {
      assert.equal(getGrade(95, { criticalCount: 1 }), 'B');
      assert.equal(getGrade(95, { critical: 1, serious: 0 }), 'B');
      assert.equal(getGrade(95, { seriousCount: 3 }), 'B');
      assert.equal(getGrade(95, { criticalCount: 0, seriousCount: 0 }), 'A');
      assert.equal(getGrade(95, {}), 'A');
      assert.equal(getGrade(95, null), 'A');
      assert.equal(getGrade(95, undefined), 'A');
    });
  });

  describe('deduplicateViolations()', () => {
    test('eliminates redundant findings for same selector and rule, keeping higher severity', () => {
      const input = [
        {
          page_url: 'http://example.com/page1',
          rule_id: 'color-contrast',
          selector: 'span.button-text',
          impact: 'minor',
          description: 'Low contrast',
        },
        {
          page_url: 'http://example.com/page1',
          rule_id: 'color-contrast',
          selector: ' span.button-text ',
          impact: 'serious',
          description: 'Low contrast on text',
        },
      ];

      const deduped = deduplicateViolations(input);
      assert.equal(deduped.length, 1);
      assert.equal(deduped[0].impact, 'serious');
      assert.equal(deduped[0].description, 'Low contrast on text');
    });

    test('preserves distinct findings across different selectors, rules, or pages', () => {
      const input = [
        {
          page_url: 'http://example.com/page1',
          rule_id: 'image-alt',
          selector: 'img#hero',
          impact: 'critical',
        },
        {
          page_url: 'http://example.com/page1',
          rule_id: 'color-contrast',
          selector: 'img#hero',
          impact: 'serious',
        },
        {
          page_url: 'http://example.com/page2',
          rule_id: 'image-alt',
          selector: 'img#hero',
          impact: 'critical',
        },
      ];

      const deduped = deduplicateViolations(input);
      assert.equal(deduped.length, 3);
    });

    test('handles empty or non-array inputs safely', () => {
      assert.deepEqual(deduplicateViolations([]), []);
      assert.deepEqual(deduplicateViolations(null), []);
    });
  });

  describe('calculateWcagScore()', () => {
    test('clean scan: computes perfect 100/A score when zero violations exist', () => {
      const result = calculateWcagScore([], 40, 0);
      assert.equal(result.overallScore, 100);
      assert.equal(result.grade, 'A');
      assert.equal(result.rawGrade, 'A');
      assert.equal(result.gradeGated, false);
      assert.equal(result.gradeGatingReason, null);
      assert.equal(result.hasCriticalBarriers, false);
      assert.equal(result.criticalWarning, null);
      assert.equal(result.fullyCompliant, true);
      assert.equal(result.totalViolations, 0);
      assert.equal(result.totalPasses, 40);
      assert.ok(result.scoringDisclaimer.includes('deterministic'));
    });

    test('high numerical score with at least one critical violation: caps Grade A to Grade B', () => {
      // 1 critical barrier (weight 10) vs 200 passes (weight 1 each = 200)
      // weightedPassed = 200
      // weightedTotal = 10 + 200 = 210
      // overallScore = Math.round((200 / 210) * 100) = 95
      const result = calculateWcagScore(
        [{ impact: 'critical', wcag_tags: 'wcag111', wcag_principle: 'perceivable' }],
        200,
        0
      );
      assert.equal(result.overallScore, 95);
      assert.equal(result.rawGrade, 'A');
      assert.equal(result.grade, 'B'); // Capped from A to B!
      assert.equal(result.gradeGated, true);
      assert.equal(result.hasCriticalBarriers, true);
      assert.ok(result.criticalWarning.includes('critical accessibility barrier'));
      assert.ok(result.criticalWarning.includes('95/100'));
      assert.ok(result.gradeGatingReason.includes('capped at B'));
      assert.equal(result.fullyCompliant, false); // Never marked compliant
    });

    test('low score with multiple serious violations: retains low grade and is not artificially elevated', () => {
      // 4 serious violations (weight 7 each = 28) vs 15 passes (weight 1 each = 15)
      // weightedPassed = 15
      // weightedTotal = 28 + 15 = 43
      // overallScore = Math.round((15 / 43) * 100) = 35 (Grade D)
      const violations = [
        { impact: 'serious', wcag_tags: 'wcag211', wcag_principle: 'operable' },
        { impact: 'serious', wcag_tags: 'wcag244', wcag_principle: 'operable' },
        { impact: 'serious', wcag_tags: 'wcag311', wcag_principle: 'understandable' },
        { impact: 'serious', wcag_tags: 'wcag412', wcag_principle: 'robust' },
      ];
      const result = calculateWcagScore(violations, 15, 0);
      assert.equal(result.overallScore, 35);
      assert.equal(result.rawGrade, 'D');
      assert.equal(result.grade, 'D');
      assert.equal(result.gradeGated, false);
      assert.equal(result.fullyCompliant, false);
      assert.equal(result.hasCriticalBarriers, false);
      assert.equal(result.criticalWarning, null);
    });

    test('high score with systemic serious violations (>=3): caps Grade A to Grade B', () => {
      // 3 serious violations (weight 7 each = 21) vs 300 passes (weight 1 each = 300)
      // weightedPassed = 300
      // weightedTotal = 21 + 300 = 321
      // overallScore = Math.round((300 / 321) * 100) = 93
      const violations = [
        { impact: 'serious', wcag_tags: 'wcag211', wcag_principle: 'operable' },
        { impact: 'serious', wcag_tags: 'wcag244', wcag_principle: 'operable' },
        { impact: 'serious', wcag_tags: 'wcag311', wcag_principle: 'understandable' },
      ];
      const result = calculateWcagScore(violations, 300, 0);
      assert.equal(result.overallScore, 93);
      assert.equal(result.rawGrade, 'A');
      assert.equal(result.grade, 'B'); // Capped to B due to systemic serious violations
      assert.equal(result.gradeGated, true);
      assert.ok(result.gradeGatingReason.includes('systemic'));
      assert.equal(result.fullyCompliant, false);
    });

    test('handles empty results and incomplete checks safely', () => {
      // Completely empty scan
      const emptyResult = calculateWcagScore([], 0, 0);
      assert.equal(emptyResult.overallScore, 100);
      assert.equal(emptyResult.grade, 'A');
      assert.equal(emptyResult.fullyCompliant, true);
      assert.equal(emptyResult.totalViolations, 0);
      assert.equal(emptyResult.totalIncomplete, 0);

      // Incomplete manual review checks without violations
      const incompleteResult = calculateWcagScore([], 0, 12);
      assert.equal(incompleteResult.overallScore, 100);
      assert.equal(incompleteResult.grade, 'A');
      assert.equal(incompleteResult.fullyCompliant, true);
      assert.equal(incompleteResult.totalIncomplete, 12);

      // Severe violations with zero passes and incomplete checks
      const severeIncomplete = calculateWcagScore(
        [{ impact: 'critical' }, { impact: 'critical' }],
        0,
        5
      );
      assert.equal(severeIncomplete.overallScore, 0);
      assert.equal(severeIncomplete.grade, 'F');
      assert.equal(severeIncomplete.fullyCompliant, false);
      assert.equal(severeIncomplete.totalIncomplete, 5);
    });

    test('computes weighted score penalizing critical barriers more heavily than minor ones', () => {
      // 1 critical barrier (weight 10) vs 50 passes (weight 1 each = 50)
      // weightedPassed = 50 * 1 = 50
      // weightedTotal = (10 * 1) + (50 * 1) = 60
      // score = (50 / 60) * 100 = 83 (Grade B)
      const criticalResult = calculateWcagScore(
        [{ impact: 'critical', wcag_tags: 'wcag111', wcag_principle: 'perceivable' }],
        50,
        0
      );
      assert.equal(criticalResult.overallScore, 83);
      assert.equal(criticalResult.grade, 'B');

      // 1 minor barrier (weight 1) vs 50 passes (weight 1 each = 50)
      // weightedPassed = 50
      // weightedTotal = 1 + 50 = 51
      // score = (50 / 51) * 100 = 98 (Grade A)
      const minorResult = calculateWcagScore(
        [{ impact: 'minor', wcag_tags: 'wcag143', wcag_principle: 'perceivable' }],
        50,
        0
      );
      assert.equal(minorResult.overallScore, 98);
      assert.equal(minorResult.grade, 'A');
      assert.ok(minorResult.overallScore > criticalResult.overallScore);
    });

    test('generates breakdown across all 4 WCAG principles', () => {
      const violations = [
        { impact: 'critical', wcag_tags: 'wcag111', wcag_principle: 'perceivable' },
        { impact: 'serious', wcag_tags: 'wcag211', wcag_principle: 'operable' },
        { impact: 'moderate', wcag_tags: 'wcag311', wcag_principle: 'understandable' },
        { impact: 'minor', wcag_tags: 'wcag412', wcag_principle: 'robust' },
      ];

      const result = calculateWcagScore(violations, 20, 2);
      assert.ok(result.principleScores.perceivable);
      assert.ok(result.principleScores.operable);
      assert.ok(result.principleScores.understandable);
      assert.ok(result.principleScores.robust);

      assert.equal(result.principleScores.perceivable.violationCount, 1);
      assert.equal(result.principleScores.operable.violationCount, 1);
      assert.equal(result.principleScores.understandable.violationCount, 1);
      assert.equal(result.principleScores.robust.violationCount, 1);
      assert.equal(result.totalIncomplete, 2);
    });
  });
});
