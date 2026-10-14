import React from 'react';
import { Search, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function EmptyState({ 
  icon = 'search', 
  title = 'No items found', 
  description = 'No data currently available.',
  actionText,
  actionLink
}) {
  const renderIcon = () => {
    switch (icon) {
      case 'success':
        return <CheckCircle2 className="w-10 h-10 text-teal-400" aria-hidden="true" />;
      case 'alert':
        return <ShieldAlert className="w-10 h-10 text-amber-400" aria-hidden="true" />;
      case 'search':
      default:
        return <Search className="w-10 h-10 text-slate-500" aria-hidden="true" />;
    }
  };

  return (
    <div className="p-12 text-center rounded-2xl bg-navy-900/60 border border-navy-800/80 flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 rounded-2xl bg-navy-850 border border-navy-800 flex items-center justify-center">
        {renderIcon()}
      </div>
      <div className="max-w-md space-y-1.5">
        <h3 className="text-base font-bold text-white">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{description}</p>
      </div>
      {actionText && actionLink && (
        <Link
          to={actionLink}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-navy-950 shadow-md transition-all focus-visible:ring-2 focus-visible:ring-teal-400"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
}
