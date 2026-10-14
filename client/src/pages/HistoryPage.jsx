import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { EmptyState } from '../components/EmptyState.jsx';
import { DisclaimerBanner } from '../components/DisclaimerBanner.jsx';
import { 
  History, 
  Search, 
  ArrowRight, 
  ExternalLink, 
  Loader2, 
  Calendar, 
  AlertOctagon, 
  CheckCircle,
  PlusCircle 
} from 'lucide-react';

export function HistoryPage() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadScans = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.getScans();
        setScans(res?.scans || []);
      } catch (err) {
        setError(err.message || 'Failed to retrieve scan history.');
      } finally {
        setLoading(false);
      }
    };

    loadScans();
  }, []);

  const filteredScans = scans.filter((s) =>
    (s.url || '').toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Audit History & Records
          </h1>
          <p className="text-slate-400 text-sm">
            Complete archive of your real Playwright & axe-core digital service evaluations.
          </p>
        </div>

        <Link
          to="/scans/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-500 hover:bg-teal-400 text-navy-950 shadow-md transition-all focus-visible:ring-2 focus-visible:ring-teal-400"
        >
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          <span>New Audit</span>
        </Link>
      </div>

      <DisclaimerBanner compact />

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" aria-hidden="true" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by audited website URL..."
            aria-label="Filter audit history by URL"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-navy-900 border border-navy-800 text-xs text-white placeholder-slate-500 focus-visible:ring-2 focus-visible:ring-teal-400"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Showing {filteredScans.length} of {scans.length} audits
        </span>
      </div>

      {/* Table Section */}
      {loading ? (
        <div className="p-16 text-center rounded-2xl bg-navy-900 border border-navy-800">
          <Loader2 className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-2" aria-hidden="true" />
          <p className="text-xs text-slate-400">Loading audit history records...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
          {error}
        </div>
      ) : filteredScans.length === 0 ? (
        scans.length === 0 ? (
          <EmptyState
            icon="search"
            title="No audit history yet"
            description="You haven't run any accessibility audits yet. Start by entering a public digital service URL."
            actionText="Launch First Audit"
            actionLink="/scans/new"
          />
        ) : (
          <EmptyState
            icon="search"
            title="No matching audits"
            description={`No past scans match the search filter "${searchQuery}".`}
          />
        )
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-navy-800 bg-navy-900 shadow-xl">
          <table className="w-full text-left text-xs" aria-label="Accessibility Audit History">
            <thead className="bg-navy-950/70 border-b border-navy-800 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th scope="col" className="px-5 py-3 font-bold">Audited Target</th>
                <th scope="col" className="px-4 py-3 font-bold">Status</th>
                <th scope="col" className="px-4 py-3 font-bold">Barriers</th>
                <th scope="col" className="px-4 py-3 font-bold">Critical / Serious</th>
                <th scope="col" className="px-4 py-3 font-bold">Passed Checks</th>
                <th scope="col" className="px-4 py-3 font-bold">Timestamp</th>
                <th scope="col" className="px-4 py-3 font-bold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800/80">
              {filteredScans.map((scan) => (
                <tr key={scan.id} className="hover:bg-navy-850/50 transition-colors">
                  <td className="px-5 py-4 font-mono font-medium text-white max-w-xs truncate">
                    <span title={scan.url}>{scan.url}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span 
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        scan.status === 'completed'
                          ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                          : scan.status === 'failed'
                          ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {scan.status}
                    </span>
                    {scan.pages_scanned > 1 && (
                      <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                        {scan.pages_scanned} pages
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 font-bold text-white">
                    {scan.total_violations}
                  </td>
                  <td className="px-4 py-4 font-mono text-[11px]">
                    <span className="text-red-400 font-bold">{scan.critical_count} critical</span>
                    <span className="text-slate-500 mx-1.5">•</span>
                    <span className="text-orange-400 font-bold">{scan.serious_count} serious</span>
                  </td>
                  <td className="px-4 py-4 text-teal-300 font-bold font-mono">
                    {scan.passes_count}
                  </td>
                  <td className="px-4 py-4 text-slate-400 text-[11px]">
                    {new Date(scan.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      to={`/scans/${scan.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-navy-800 text-teal-300 hover:bg-navy-700 hover:text-white border border-navy-750 focus-visible:ring-2 focus-visible:ring-teal-400 transition-colors"
                    >
                      <span>Inspect</span>
                      <ArrowRight className="w-3 h-3" aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
