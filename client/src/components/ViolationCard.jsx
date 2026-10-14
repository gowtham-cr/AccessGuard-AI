import React, { useState } from 'react';
import { SeverityBadge } from './SeverityBadge.jsx';
import { ExternalLink, Copy, Check, Code, Compass, BookOpen } from 'lucide-react';

export function ViolationCard({ violation, index }) {
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedSelector, setCopiedSelector] = useState(false);

  const handleCopy = (text, setCopied) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tagsList = violation.wcag_tags 
    ? violation.wcag_tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <article 
      aria-labelledby={`violation-${index}-title`}
      className="p-5 sm:p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-xl space-y-4 transition-all hover:border-navy-700"
    >
      {/* Header: Rule ID, Impact, Help Link */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-navy-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <SeverityBadge impact={violation.impact} />
            <h3 
              id={`violation-${index}-title`}
              className="text-base sm:text-lg font-bold font-mono text-white tracking-tight"
            >
              {violation.rule_id}
            </h3>
            {violation.page_url && (
              <span 
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-slate-300 bg-navy-950 border border-navy-800 truncate max-w-sm"
                title={violation.page_url}
              >
                <span className="text-teal-400 font-semibold">Page:</span> {violation.page_url}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-300 font-medium">
            {violation.description}
          </p>
        </div>

        {violation.help_url && (
          <a
            href={violation.help_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Official axe documentation for ${violation.rule_id} (opens in new tab)`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-navy-800 text-teal-300 hover:bg-navy-700 hover:text-teal-200 border border-navy-700 focus-visible:ring-2 focus-visible:ring-teal-400"
          >
            <span>WCAG Docs</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        )}
      </div>

      {/* WCAG Tags */}
      {tagsList.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            Tags:
          </span>
          {tagsList.map((tag) => (
            <span 
              key={tag}
              className="px-2 py-0.5 rounded-md bg-navy-800 text-slate-300 font-mono text-[11px] border border-navy-750"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Target DOM Element Selector */}
      {violation.selector && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-teal-400" aria-hidden="true" />
              Target Element Selector
            </span>
            <button
              type="button"
              onClick={() => handleCopy(violation.selector, setCopiedSelector)}
              aria-label="Copy element selector"
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-teal-300 transition-colors focus-visible:ring-2 focus-visible:ring-teal-400 rounded px-1.5 py-0.5"
            >
              {copiedSelector ? (
                <>
                  <Check className="w-3 h-3 text-teal-400" aria-hidden="true" />
                  <span className="text-teal-400 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" aria-hidden="true" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <div className="p-2.5 rounded-lg bg-navy-950 border border-navy-800 font-mono text-xs text-teal-300 overflow-x-auto select-all">
            {violation.selector}
          </div>
        </div>
      )}

      {/* HTML Evidence Snippet */}
      {violation.html_snippet && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-teal-400" aria-hidden="true" />
              HTML Evidence Snippet
            </span>
            <button
              type="button"
              onClick={() => handleCopy(violation.html_snippet, setCopiedSnippet)}
              aria-label="Copy HTML snippet"
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-teal-300 transition-colors focus-visible:ring-2 focus-visible:ring-teal-400 rounded px-1.5 py-0.5"
            >
              {copiedSnippet ? (
                <>
                  <Check className="w-3 h-3 text-teal-400" aria-hidden="true" />
                  <span className="text-teal-400 font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" aria-hidden="true" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3 rounded-lg bg-navy-950 border border-navy-800 font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
            <code>{violation.html_snippet}</code>
          </pre>
        </div>
      )}

      {/* Failure Summary */}
      {violation.failure_summary && (
        <div className="p-3 rounded-lg bg-navy-950/60 border border-navy-800/80 text-xs text-slate-300 leading-relaxed">
          <strong className="text-slate-200 block mb-1">Algorithmic Failure Summary:</strong>
          <p className="whitespace-pre-line text-slate-300 font-mono text-[11px]">
            {violation.failure_summary}
          </p>
        </div>
      )}

      {/* Deterministic Rule-Based Guidance */}
      {violation.deterministic_guidance && (
        <div className="p-4 sm:p-5 rounded-xl bg-teal-950/25 border border-teal-500/30 text-xs text-slate-200 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-teal-500/20">
            <span className="flex items-center gap-2 text-teal-300 font-bold uppercase tracking-wider text-[11px]">
              Deterministic WCAG Remediation Guidance
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 font-mono">
              Standards-Based (Not AI)
            </span>
          </div>
          <div className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-sans">
            {violation.deterministic_guidance
              .replace('[Deterministic WCAG Rule Guidance — Standards Based (Not AI)]', '')
              .replace('[Deterministic WCAG Rule Guidance]', '')
              .trim()}
          </div>
        </div>
      )}
    </article>
  );
}
