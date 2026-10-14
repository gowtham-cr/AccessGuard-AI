import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SeverityBadge } from '../components/SeverityBadge.jsx';
import { DisclaimerBanner } from '../components/DisclaimerBanner.jsx';
import { ViolationCard } from '../components/ViolationCard.jsx';
import { ManualCheckCard } from '../components/ManualCheckCard.jsx';
import { EmptyState } from '../components/EmptyState.jsx';

describe('Frontend Accessibility Components', () => {
  describe('SeverityBadge', () => {
    it('renders Critical impact badge correctly', () => {
      render(<SeverityBadge impact="critical" />);
      expect(screen.getByText(/critical/i)).toBeInTheDocument();
    });

    it('renders Serious impact badge correctly', () => {
      render(<SeverityBadge impact="serious" />);
      expect(screen.getByText(/serious/i)).toBeInTheDocument();
    });

    it('renders Moderate impact badge correctly', () => {
      render(<SeverityBadge impact="moderate" />);
      expect(screen.getByText(/moderate/i)).toBeInTheDocument();
    });

    it('renders Minor impact badge correctly', () => {
      render(<SeverityBadge impact="minor" />);
      expect(screen.getByText(/minor/i)).toBeInTheDocument();
    });
  });

  describe('DisclaimerBanner', () => {
    it('renders the honest automated audit disclosure text', () => {
      render(<DisclaimerBanner />);
      expect(screen.getByText(/Honest Audit Scope & Limitations/i)).toBeInTheDocument();
      expect(screen.getByText(/30-40% of WCAG criteria/i)).toBeInTheDocument();
      expect(screen.getByText(/screen reader testing/i)).toBeInTheDocument();
    });
  });

  describe('ViolationCard', () => {
    const mockViolation = {
      rule_id: 'image-alt',
      impact: 'critical',
      description: 'Images must have alternate text',
      help_url: 'https://dequeuniversity.com/rules/axe/4.13/image-alt',
      wcag_tags: 'wcag2a, wcag111',
      selector: 'img#banner-logo',
      html_snippet: '<img id="banner-logo" src="/logo.png">',
      failure_summary: 'Element does not have an alt attribute',
      deterministic_guidance: '[Deterministic WCAG Rule Guidance] Provide a descriptive alt attribute.',
    };

    it('renders rule title, impact, selector, snippet, and deterministic guidance', () => {
      render(<ViolationCard violation={mockViolation} index={0} />);

      expect(screen.getByText('image-alt')).toBeInTheDocument();
      expect(screen.getByText(/Critical/i)).toBeInTheDocument();
      expect(screen.getByText('img#banner-logo')).toBeInTheDocument();
      expect(screen.getByText(/Deterministic WCAG Remediation Guidance/i)).toBeInTheDocument();
      expect(screen.getByText(/Standards-Based \(Not AI\)/i)).toBeInTheDocument();
    });

    it('renders page_url badge when present on violation', () => {
      const violationWithPage = {
        ...mockViolation,
        page_url: 'https://example.gov/services/apply',
      };
      render(<ViolationCard violation={violationWithPage} index={1} />);
      expect(screen.getByText('https://example.gov/services/apply')).toBeInTheDocument();
      expect(screen.getByText(/Page:/i)).toBeInTheDocument();
    });
  });

  describe('ManualCheckCard', () => {
    const mockCheck = {
      rule_id: 'color-contrast',
      impact: 'serious',
      description: 'Elements must have sufficient color contrast',
      help_url: 'https://dequeuniversity.com/rules/axe/4.13/color-contrast',
      wcag_tags: 'wcag2aa, wcag143',
      selector: '#gradient-text',
      html_snippet: '<p id="gradient-text">Gradient text</p>',
      failure_summary: "Element's background color could not be determined due to a background gradient",
      review_guidance: 'Manual verification required: Test with assistive technology or specialized verification tools.',
      page_url: 'https://example.gov/portal',
    };

    it('renders Needs Manual Review badge, selector, failure summary, and guidance', () => {
      render(<ManualCheckCard check={mockCheck} index={0} />);

      expect(screen.getByText('color-contrast')).toBeInTheDocument();
      expect(screen.getByText(/Needs Manual Review/i)).toBeInTheDocument();
      expect(screen.getByText('#gradient-text')).toBeInTheDocument();
      expect(screen.getByText(/Why Algorithmic Audit Requires Human Inspection/i)).toBeInTheDocument();
      expect(screen.getByText(/Element's background color could not be determined/i)).toBeInTheDocument();
      expect(screen.getByText(/Auditor Verification Steps/i)).toBeInTheDocument();
    });
  });

  describe('EmptyState', () => {
    it('renders title, description, and action button', () => {
      render(
        <BrowserRouter>
          <EmptyState
            title="No Audits Performed"
            description="Start by scanning a civic service."
            actionText="Launch Audit"
            actionLink="/scans/new"
          />
        </BrowserRouter>
      );

      expect(screen.getByText('No Audits Performed')).toBeInTheDocument();
      expect(screen.getByText('Start by scanning a civic service.')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Launch Audit/i })).toHaveAttribute('href', '/scans/new');
    });
  });
});
