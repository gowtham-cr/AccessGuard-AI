import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateSarifReport,
  mapImpactToSarifLevel,
  SARIF_SCHEMA_URI,
  TOOL_NAME,
  TOOL_VERSION,
} from '../src/services/sarifService.js';

describe('SARIF 2.1.0 Export Service (sarifService)', () => {
  describe('mapImpactToSarifLevel()', () => {
    test('maps accessibility severities to valid SARIF 2.1.0 levels', () => {
      assert.equal(mapImpactToSarifLevel('critical'), 'error');
      assert.equal(mapImpactToSarifLevel('serious'), 'error');
      assert.equal(mapImpactToSarifLevel('moderate'), 'warning');
      assert.equal(mapImpactToSarifLevel('minor'), 'note');
      assert.equal(mapImpactToSarifLevel('unknown'), 'warning');
      assert.equal(mapImpactToSarifLevel(null), 'warning');
    });
  });

  describe('generateSarifReport()', () => {
    test('clean scan with zero violations: produces valid SARIF with empty rules and results', () => {
      const scan = {
        id: 42,
        url: 'https://clean-portal.gov.in',
        status: 'completed',
        wcag_version: 'WCAG 2.1 / 2.2 AA',
        wcag_score: 100,
        wcag_grade: 'A',
        completed_at: '2026-10-15T06:00:00.000Z',
      };

      const sarif = generateSarifReport(scan, [], []);

      assert.equal(sarif.version, '2.1.0');
      assert.equal(sarif.$schema, SARIF_SCHEMA_URI);
      assert.ok(Array.isArray(sarif.runs));
      assert.equal(sarif.runs.length, 1);

      const run = sarif.runs[0];
      assert.equal(run.tool.driver.name, TOOL_NAME);
      assert.equal(run.tool.driver.version, TOOL_VERSION);
      assert.deepEqual(run.tool.driver.rules, []);
      assert.deepEqual(run.results, []);
      assert.equal(run.properties.scanId, 42);
      assert.equal(run.properties.targetUrl, 'https://clean-portal.gov.in');
      assert.equal(run.properties.wcagScore, 100);
      assert.equal(run.properties.wcagGrade, 'A');
      assert.equal(run.properties.totalViolations, 0);
      assert.ok(run.properties.automatedTestingDisclaimer.includes('30-40% of WCAG'));
    });

    test('scan with genuine findings: creates unique rules, consistent levels, locations, and valid ruleIndex references', () => {
      const scan = {
        id: 101,
        url: 'https://civic.service.gov.in',
        status: 'completed',
        wcag_version: 'WCAG 2.1 / 2.2 AA',
        wcag_score: 83,
        wcag_grade: 'B',
        completed_at: '2026-10-15T06:30:00.000Z',
      };

      const violations = [
        {
          rule_id: 'image-alt',
          impact: 'critical',
          description: 'Images must have alternate text',
          help_text: 'Elements must have an alt attribute',
          help_url: 'https://dequeuniversity.com/rules/axe/4.10/image-alt',
          wcag_tags: 'wcag2a,wcag111',
          wcag_principle: 'perceivable',
          page_url: 'https://civic.service.gov.in/page1',
          selector: 'img#hero-banner',
          html_snippet: '<img id="hero-banner" src="/banner.png">',
          failure_summary: 'Fix all of the following: Element does not have an alt attribute',
          deterministic_guidance: 'Problem: Image missing alt text.\nRemediation: Provide a descriptive alt attribute.',
        },
        {
          rule_id: 'image-alt',
          impact: 'critical',
          description: 'Images must have alternate text',
          help_text: 'Elements must have an alt attribute',
          help_url: 'https://dequeuniversity.com/rules/axe/4.10/image-alt',
          wcag_tags: 'wcag2a,wcag111',
          wcag_principle: 'perceivable',
          page_url: 'https://civic.service.gov.in/page2',
          selector: 'img.footer-logo',
          html_snippet: '<img class="footer-logo" src="/footer.png">',
          failure_summary: 'Fix all of the following: Element does not have an alt attribute',
          deterministic_guidance: 'Problem: Image missing alt text.\nRemediation: Provide a descriptive alt attribute.',
        },
        {
          rule_id: 'color-contrast',
          impact: 'serious',
          description: 'Elements must have sufficient color contrast',
          help_text: 'Elements must have sufficient contrast ratio',
          help_url: 'https://dequeuniversity.com/rules/axe/4.10/color-contrast',
          wcag_tags: 'wcag2aa,wcag143',
          wcag_principle: 'perceivable',
          page_url: 'https://civic.service.gov.in/page1',
          selector: 'p.subtext',
          html_snippet: '<p class="subtext">Faint text</p>',
          failure_summary: 'Contrast ratio 2.5:1 is below requirement 4.5:1',
          deterministic_guidance: 'Remediation: Darken text color to #222222.',
        },
        {
          rule_id: 'duplicate-id-active',
          impact: 'minor',
          description: 'IDs of active elements must be unique',
          help_text: 'Active elements must have unique id values',
          help_url: 'https://dequeuniversity.com/rules/axe/4.10/duplicate-id-active',
          wcag_tags: 'wcag2a,wcag411',
          wcag_principle: 'robust',
          page_url: 'https://civic.service.gov.in/page1',
          selector: 'input#search-btn',
          html_snippet: '<input id="search-btn" type="submit">',
          failure_summary: 'Document has multiple active elements with id="search-btn"',
          deterministic_guidance: 'Remediation: Use unique IDs for each active button.',
        },
      ];

      const sarif = generateSarifReport(scan, violations, []);
      const run = sarif.runs[0];

      // 1. Validate rules are properly deduplicated (3 distinct rules from 4 violations)
      assert.equal(run.tool.driver.rules.length, 3);
      const ruleIds = run.tool.driver.rules.map((r) => r.id);
      assert.deepEqual(ruleIds, ['image-alt', 'color-contrast', 'duplicate-id-active']);

      // 2. Validate rule metadata
      const imageAltRule = run.tool.driver.rules.find((r) => r.id === 'image-alt');
      assert.equal(imageAltRule.defaultConfiguration.level, 'error');
      assert.equal(imageAltRule.properties.wcagPrinciple, 'perceivable');
      assert.ok(imageAltRule.properties.tags.includes('wcag111'));
      assert.ok(imageAltRule.properties.tags.includes('accessibility'));
      assert.ok(imageAltRule.help.text.includes('Remediation:'));
      assert.ok(imageAltRule.help.markdown.includes('### Remediation Guidance'));

      // 3. Validate results mapping
      assert.equal(run.results.length, 4);

      // Verify each result references the exact matching ruleIndex in driver.rules
      for (const res of run.results) {
        assert.ok(res.ruleIndex >= 0 && res.ruleIndex < run.tool.driver.rules.length);
        const referencedRule = run.tool.driver.rules[res.ruleIndex];
        assert.equal(referencedRule.id, res.ruleId);
        assert.ok(res.locations.length >= 1);
        assert.ok(res.locations[0].physicalLocation.artifactLocation.uri.startsWith('https://civic.service.gov.in'));
        assert.ok(res.locations[0].logicalLocations[0].fullyQualifiedName);
      }

      // Check severity level mapping
      assert.equal(run.results[0].level, 'error'); // critical -> error
      assert.equal(run.results[1].level, 'error'); // critical -> error
      assert.equal(run.results[2].level, 'error'); // serious -> error
      assert.equal(run.results[3].level, 'note');  // minor -> note
    });

    test('JSON serialization & special character resilience: safely escapes HTML snippets, quotes, and international characters', () => {
      const scan = {
        id: 777,
        url: 'https://multilingual-gov.in',
        status: 'completed',
        wcag_version: 'WCAG 2.1 / 2.2 AA',
        wcag_score: 90,
        wcag_grade: 'A',
      };

      const violations = [
        {
          rule_id: 'button-name',
          impact: 'critical',
          description: 'Buttons must have discernible text: "ಕನ್ನಡ ಸೇವೆ" & <special> chars',
          help_text: 'Buttons must contain accessible label',
          help_url: 'https://dequeuniversity.com/rules/axe/4.10/button-name?q=test&lang=kn',
          wcag_tags: 'wcag2a,wcag412',
          wcag_principle: 'robust',
          page_url: 'https://multilingual-gov.in/portal?query=search&category="public"',
          selector: 'button[data-action="submit & pay"]',
          html_snippet: '<button class="btn" onclick="alert(\'hello\')">\n  <span class="icon">&bull;</span>\n</button>',
          failure_summary: 'Element has no text: <button class="btn">\n"quotation" & <brackets>',
          deterministic_guidance: 'Remediation for "ಸಲ್ಲಿಸಿ" (Submit):\n1. Add aria-label="ಸಲ್ಲಿಸಿ / Submit"\n2. Ensure contrast >= 4.5:1',
        },
      ];

      const sarif = generateSarifReport(scan, violations, []);

      // Verify standard JSON serialization stringifies and parses back losslessly
      const jsonString = JSON.stringify(sarif, null, 2);
      assert.doesNotThrow(() => JSON.parse(jsonString));

      const parsed = JSON.parse(jsonString);
      assert.equal(parsed.version, '2.1.0');
      assert.equal(parsed.runs[0].results.length, 1);
      const res = parsed.runs[0].results[0];
      assert.ok(res.message.text.includes('"quotation" & <brackets>'));
      assert.ok(res.locations[0].physicalLocation.region.snippet.text.includes('<button class="btn"'));
      assert.ok(res.properties.remediationGuidance.includes('ಸಲ್ಲಿಸಿ'));
    });

    test('historical scan with stored Grade A and critical barriers: gates Grade A to Grade B in SARIF metadata', () => {
      // Historical scan stored with high score 95 and stale Grade A, but has critical count
      const historicalScan = {
        id: 888,
        url: 'https://legacy-audit.example.gov',
        status: 'completed',
        wcag_version: 'WCAG 2.1 / 2.2 AA',
        wcag_score: 95,
        wcag_grade: 'A', // Stale un-gated grade in legacy DB
        critical_count: 1,
        serious_count: 0,
        completed_at: '2026-10-15T06:00:00.000Z',
      };

      const violations = [
        {
          rule_id: 'image-alt',
          impact: 'critical',
          description: 'Image missing alt text',
          selector: 'img#hero',
        },
      ];

      // 1. Without caller options: sarifService defensively gates Grade A down to B
      const sarifDirect = generateSarifReport(historicalScan, violations, []);
      assert.equal(sarifDirect.runs[0].properties.wcagScore, 95);
      assert.equal(sarifDirect.runs[0].properties.wcagGrade, 'B', 'Direct invocation must gate Grade A down to B');
      assert.notEqual(sarifDirect.runs[0].properties.wcagGrade, 'A');

      // 2. With pre-calculated gatedGrade option from route caller: uses the provided gated grade
      const sarifWithOptions = generateSarifReport(historicalScan, violations, [], { gatedGrade: 'B' });
      assert.equal(sarifWithOptions.runs[0].properties.wcagScore, 95);
      assert.equal(sarifWithOptions.runs[0].properties.wcagGrade, 'B', 'Option-passed gated grade must be preserved');
      assert.notEqual(sarifWithOptions.runs[0].properties.wcagGrade, 'A');
    });

    test('scan without stored grade metadata: safely defaults properties to null without error', () => {
      const scanWithoutGrade = {
        id: 999,
        url: 'https://unscored-portal.gov.in',
        status: 'completed',
      };

      const sarif = generateSarifReport(scanWithoutGrade, [], []);
      const run = sarif.runs[0];

      assert.equal(run.properties.scanId, 999);
      assert.equal(run.properties.wcagScore, null);
      assert.equal(run.properties.wcagGrade, null);
      assert.equal(run.properties.totalViolations, 0);
    });
  });
});
