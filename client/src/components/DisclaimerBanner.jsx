import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

export function DisclaimerBanner({ text, compact = false }) {
  const defaultText = 
    'Automated barrier audits evaluate measurable algorithmic checks covering approximately 30-40% of WCAG criteria. A scan with zero automated violations does not guarantee full WCAG compliance. Comprehensive accessibility compliance requires manual keyboard navigation, screen reader testing, and cognitive walkthroughs.';

  return (
    <aside 
      aria-label="Automated Accessibility Testing Disclaimer"
      className={`rounded-xl border border-teal-500/30 bg-teal-950/20 text-slate-300 ${
        compact ? 'p-3 text-xs' : 'p-4 sm:p-5 text-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="p-1 rounded-lg bg-teal-500/10 text-teal-300 shrink-0 mt-0.5">
          <Info className="w-4 h-4" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-teal-300 uppercase tracking-wider text-[11px]">
              Honest Audit Scope & Limitations
            </span>
          </div>
          <p className="text-slate-300 leading-relaxed text-xs sm:text-[13px]">
            {text || defaultText}
          </p>
        </div>
      </div>
    </aside>
  );
}
