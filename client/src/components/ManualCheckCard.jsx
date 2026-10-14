import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Code, Compass, BookOpen, AlertTriangle, Eye } from 'lucide-react';
import { SeverityBadge } from './SeverityBadge.jsx';

export function ManualCheckCard({ check, index }) {
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedSelector, setCopiedSelector] = useState(false);

  const handleCopy = (text, setCopied) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tagsList = check.wcag_tags 
    ? check.wcag_tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <article 
      aria-labelledby={`manual-check-${index}-title`}
      className="p-5 sm:p-6 rounded-2xl bg-navy-900 border border-amber-500/30 shadow-xl space-y-4 transition-all hover:border-amber-500/50"
    >
      {/* Header: Rule ID, Review Status, Help Link */}
      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-navy-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/40">
              <Eye className="w-3 h-3" aria-hidden="true" />
              <span>Needs Manual Review</span>
            </span>
            {check.impact && (
              <span className="text-[11px] font-mono text-slate-400 capitalize">
                (Impact: {check.impact})
              </span>
            )}
            <h3 
              id={`manual-check-${index}-title`}
              className="text-base sm:text-lg font-bold font-mono text-white tracking-tight"
            >
              {check.rule_id}
            </h3>
            {check.page_url && (
              <span 
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-slate-300 bg-navy-950 border border-navy-800 truncate max-w-sm"
                title={check.page_url}
              >
                <span className="text-amber-400 font-semibold">Page:</span> {check.page_url}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-300 font-medium">
            {check.description}
          </p>
        </div>

        {check.help_url && (
          <a
            href={check.help_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Official axe documentation for ${check.rule_id} (opens in new tab)`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-navy-800 text-amber-300 hover:bg-navy-700 hover:text-amber-200 border border-amber-500/30 focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <span>Rule Docs</span>
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

      {/* Why axe flagged this for manual review */}
      {check.failure_summary && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Why Algorithmic Audit Requires Human Inspection:</span>
          </div>
          <p className="font-mono text-[11px] whitespace-pre-wrap text-amber-100/90 pl-5">
            {check.failure_summary}
          </p>
        </div>
      )}

      {/* Evidence: Selector & HTML */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
        {/* CSS Selector */}
        {check.selector && (
          <div className="p-3 rounded-xl bg-navy-950 border border-navy-800 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-semibold flex items-center gap-1">
                <Code className="w-3.5 h-3.5" aria-hidden="true" />
                Target Element Selector
              </span>
              <button
                type="button"
                onClick={() => handleCopy(check.selector, setCopiedSelector)}
                aria-label="Copy element selector"
                className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
              >
                {copiedSelector ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSelector ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <code className="block p-2 rounded bg-navy-900 border border-navy-850 font-mono text-[11px] text-teal-300 break-all select-all">
              {check.selector}
            </code>
          </div>
        )}

        {/* HTML Snippet */}
        {check.html_snippet && (
          <div className="p-3 rounded-xl bg-navy-950 border border-navy-800 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="font-semibold flex items-center gap-1">
                <Code className="w-3.5 h-3.5" aria-hidden="true" />
                DOM Node Snippet
              </span>
              <button
                type="button"
                onClick={() => handleCopy(check.html_snippet, setCopiedSnippet)}
                aria-label="Copy HTML snippet"
                className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors"
              >
                {copiedSnippet ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSnippet ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-2 rounded bg-navy-900 border border-navy-850 font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap break-all max-h-32">
              <code>{check.html_snippet}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Manual Verification Guidance */}
      {check.review_guidance && (
        <div className="p-4 rounded-xl bg-navy-950 border border-navy-750 space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Compass className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Auditor Verification Steps:</span>
          </div>
          <p className="text-slate-300 leading-relaxed pl-5 font-medium">
            {check.review_guidance}
          </p>
        </div>
      )}
    </article>
  );
}
