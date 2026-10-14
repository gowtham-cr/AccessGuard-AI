import React from 'react';
import { AlertOctagon, AlertTriangle, Info, AlertCircle } from 'lucide-react';

export function SeverityBadge({ impact }) {
  const normalized = (impact || 'moderate').toLowerCase();

  switch (normalized) {
    case 'critical':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-red-500/15 text-red-300 border border-red-500/30">
          <AlertOctagon className="w-3.5 h-3.5 text-red-400 shrink-0" aria-hidden="true" />
          <span>Critical</span>
        </span>
      );
    case 'serious':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-orange-500/15 text-orange-300 border border-orange-500/30">
          <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0" aria-hidden="true" />
          <span>Serious</span>
        </span>
      );
    case 'moderate':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
          <span>Moderate</span>
        </span>
      );
    case 'minor':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30">
          <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" aria-hidden="true" />
          <span>Minor</span>
        </span>
      );
  }
}
