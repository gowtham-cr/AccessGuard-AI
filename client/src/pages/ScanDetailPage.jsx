import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { ViolationCard } from '../components/ViolationCard.jsx';
import { ManualCheckCard } from '../components/ManualCheckCard.jsx';
import { SeverityBadge } from '../components/SeverityBadge.jsx';
import { DisclaimerBanner } from '../components/DisclaimerBanner.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { 
  ArrowLeft, 
  Globe, 
  Calendar, 
  CheckCircle, 
  AlertOctagon, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Loader2, 
  ExternalLink,
  Search,
  Filter,
  Layers,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  GitCompare,
  TrendingDown,
  TrendingUp,
  Minus,
  Eye
} from 'lucide-react';

export function ScanDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isPollingRef = useRef(false);

  // Filters
  const [activeFindingsTab, setActiveFindingsTab] = useState('violations'); // 'violations' | 'manual'
  const [severityFilter, setSeverityFilter] = useState('all');
  const [pageFilter, setPageFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Before-and-After Comparison State
  const [showCompare, setShowCompare] = useState(false);
  const [availableScans, setAvailableScans] = useState([]);
  const [baseCompareId, setBaseCompareId] = useState('');
  const [comparisonData, setComparisonData] = useState(null);
  const [comparingLoading, setComparingLoading] = useState(false);
  const [compareError, setCompareError] = useState(null);
  const [compareTab, setCompareTab] = useState('resolved');
  const [exporting, setExporting] = useState(false);

  // Initial fetch
  useEffect(() => {
    let isMounted = true;

    const fetchScanDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.getScanById(id);
        if (isMounted) {
          setData(res);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to retrieve scan details.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchScanDetail();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Bounded polling while status is 'running'
  useEffect(() => {
    const currentStatus = data?.scan?.status;
    if (currentStatus !== 'running') {
      return;
    }

    let isMounted = true;
    let pollCount = 0;
    const MAX_POLLS = 60; // 60 * 2.5s = 150 seconds maximum polling window
    const POLL_INTERVAL_MS = 2500;

    const intervalId = setInterval(async () => {
      if (!isMounted) return;
      if (isPollingRef.current) return; // Prevent duplicate concurrent requests
      if (++pollCount > MAX_POLLS) {
        clearInterval(intervalId);
        return;
      }

      try {
        isPollingRef.current = true;
        const res = await api.getScanById(id);
        if (!isMounted) return;

        setData(res);
        if (res?.scan?.status === 'completed' || res?.scan?.status === 'failed') {
          clearInterval(intervalId);
        }
      } catch {
        // Tolerant to transient network blips; will retry on next poll tick
      } finally {
        isPollingRef.current = false;
      }
    }, POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [id, data?.scan?.status]);

  if (loading) {
    return (
      <div 
        className="p-16 text-center rounded-2xl bg-navy-900 border border-navy-800"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-10 h-10 text-teal-400 animate-spin mx-auto mb-3" aria-hidden="true" />
        <h2 className="text-base font-bold text-white">Loading Audit Evidence...</h2>
        <p className="text-xs text-slate-400 mt-1">Retrieving axe-core violations, discovered pages and node snippets from database.</p>
      </div>
    );
  }

  if (error || !data?.scan) {
    return (
      <div className="space-y-4">
        <Link 
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-300 hover:text-teal-200"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <div role="alert" className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 space-y-2">
          <h2 className="text-base font-bold">Audit Not Available</h2>
          <p className="text-xs leading-relaxed">{error || 'The requested scan could not be found or you do not have permission to view it.'}</p>
        </div>
      </div>
    );
  }

  const { scan, pages = [], violations = [], manualChecks = [], automatedTestingDisclaimer } = data;

  const scannedPagesCount = scan.pages_scanned || pages.filter(p => p.status === 'completed').length || 1;
  const failedPagesCount = scan.pages_failed || pages.filter(p => p.status === 'failed').length || 0;
  const maxPagesAllowed = scan.max_pages || 1;

  // Comparison Handlers
  const handleToggleCompare = async () => {
    if (!showCompare && availableScans.length === 0) {
      try {
        const res = await api.getScans();
        const otherScans = (res.scans || []).filter((s) => String(s.id) !== String(id) && s.status === 'completed');
        setAvailableScans(otherScans);
        if (otherScans.length > 0) {
          setBaseCompareId(String(otherScans[0].id));
        }
      } catch (err) {
        setCompareError('Unable to load past scans for comparison.');
      }
    }
    setShowCompare((prev) => !prev);
  };

  const handleRunComparison = async () => {
    if (!baseCompareId) return;
    try {
      setComparingLoading(true);
      setCompareError(null);
      const res = await api.compareScans(baseCompareId, id);
      setComparisonData(res);
    } catch (err) {
      setCompareError(err.message || 'Comparison failed.');
    } finally {
      setComparingLoading(false);
    }
  };

  const handleExportJson = async () => {
    try {
      setExporting(true);
      const res = await api.exportScanJson(id);
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' });
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = `accessguard-audit-${id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(dlUrl);
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleExportCsv = () => {
    const csvUrl = api.getExportUrl(id, 'csv');
    window.open(csvUrl, '_blank');
  };

  // Filter violations by severity, page, and search query
  const filteredViolations = violations.filter((v) => {
    const matchesSeverity = 
      severityFilter === 'all' || 
      (v.impact || '').toLowerCase() === severityFilter.toLowerCase();
    
    const matchesPage =
      pageFilter === 'all' ||
      (v.page_url || scan.url) === pageFilter;

    const query = searchQuery.trim().toLowerCase();
    const matchesQuery = 
      !query || 
      v.rule_id.toLowerCase().includes(query) ||
      (v.description || '').toLowerCase().includes(query) ||
      (v.selector || '').toLowerCase().includes(query) ||
      (v.page_url || '').toLowerCase().includes(query);

    return matchesSeverity && matchesPage && matchesQuery;
  });

  // Filter manual checks by page and search query
  const filteredManualChecks = manualChecks.filter((m) => {
    const matchesPage =
      pageFilter === 'all' ||
      (m.page_url || scan.url) === pageFilter;

    const query = searchQuery.trim().toLowerCase();
    const matchesQuery = 
      !query || 
      m.rule_id.toLowerCase().includes(query) ||
      (m.description || '').toLowerCase().includes(query) ||
      (m.selector || '').toLowerCase().includes(query) ||
      (m.page_url || '').toLowerCase().includes(query) ||
      (m.failure_summary || '').toLowerCase().includes(query);

    return matchesPage && matchesQuery;
  });

  return (
    <div className="space-y-8">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link 
          to="/history"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-teal-300 transition-colors focus-visible:ring-2 focus-visible:ring-teal-400 rounded px-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Audit History</span>
        </Link>
        <span className="text-xs font-mono text-slate-500">Scan ID #{scan.id}</span>
      </div>

      {/* Header Summary Card */}
      <section 
        aria-labelledby="scan-header-title"
        className="p-6 sm:p-8 rounded-2xl bg-navy-900 border border-navy-800 shadow-xl space-y-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span 
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  scan.status === 'completed'
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                    : scan.status === 'failed'
                    ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}
              >
                {scan.status}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {scan.wcag_version || 'WCAG 2.1 / 2.2 AA'}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-navy-950 border border-navy-750 text-xs font-mono text-teal-400">
                <Layers className="w-3 h-3" />
                <span>{scannedPagesCount} / {maxPagesAllowed} Pages Audited</span>
              </span>
            </div>

            <h1 id="scan-header-title" className="text-xl sm:text-2xl font-extrabold text-white font-mono break-all">
              {scan.url}
            </h1>

            <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                {new Date(scan.created_at).toLocaleString()}
              </span>
              {scan.completed_at && (
                <span className="text-slate-500">
                  Completed in {Math.max(1, Math.round((new Date(scan.completed_at) - new Date(scan.created_at)) / 1000))}s
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleToggleCompare}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors focus-visible:ring-2 focus-visible:ring-purple-400 ${
                showCompare 
                  ? 'bg-purple-900/40 text-purple-300 border-purple-500/40' 
                  : 'bg-navy-850 hover:bg-navy-800 text-purple-300 border-navy-750'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{showCompare ? 'Hide Comparison' : 'Compare Audit'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              disabled={exporting || scan.status !== 'completed'}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-navy-850 hover:bg-navy-800 text-teal-300 border border-navy-750 transition-colors focus-visible:ring-2 focus-visible:ring-teal-400 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Export JSON</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={scan.status !== 'completed'}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-navy-850 hover:bg-navy-800 text-teal-300 border border-navy-750 transition-colors focus-visible:ring-2 focus-visible:ring-teal-400 disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Export CSV</span>
            </button>

            <a
              href={scan.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-navy-850 hover:bg-navy-800 text-slate-300 border border-navy-750 transition-colors focus-visible:ring-2 focus-visible:ring-teal-400"
            >
              <span>Visit Target</span>
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* Before-and-After Comparison Panel */}
        {showCompare && (
          <div className="p-5 rounded-2xl bg-navy-950/90 border border-purple-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-purple-400" />
                  <span>Before-and-After Audit Comparison</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Select a baseline audit of this website to compute resolved, remaining, and newly detected barriers.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                {availableScans.length > 0 ? (
                  <>
                    <select
                      value={baseCompareId}
                      onChange={(e) => setBaseCompareId(e.target.value)}
                      className="text-xs bg-navy-900 border border-navy-750 text-white rounded-lg px-2.5 py-1.5 focus-visible:ring-2 focus-visible:ring-purple-400"
                    >
                      {availableScans.map((s) => (
                        <option key={s.id} value={s.id}>
                          Scan #{s.id} ({new Date(s.created_at).toLocaleDateString()} — {s.total_violations} barriers, {s.pages_scanned} pages)
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleRunComparison}
                      disabled={comparingLoading || !baseCompareId}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {comparingLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Compare</span>
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-slate-400 italic">No other completed scans found</span>
                )}
              </div>
            </div>

            {compareError && (
              <div role="alert" className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                {compareError}
              </div>
            )}

            {comparisonData && (
              <div className="space-y-4 pt-3 border-t border-navy-800">
                {/* Disclosures & Warnings */}
                {comparisonData.comparison.differentOriginWarning && (
                  <div role="alert" className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <span>Warning: Compared audits target different domain origins ({comparisonData.baseScan.url} vs {comparisonData.targetScan.url}). Findings may not directly correlate.</span>
                  </div>
                )}

                {comparisonData.comparison.scopeDifference && (
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0 text-blue-400" />
                    <span>Scope Notice: Crawl configuration differed between runs (Baseline: max {comparisonData.baseScan.max_pages} pages, depth {comparisonData.baseScan.max_depth} vs Current: max {comparisonData.targetScan.max_pages} pages, depth {comparisonData.targetScan.max_depth}).</span>
                  </div>
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
                  <div className="p-2.5 rounded-xl bg-navy-900 border border-navy-800">
                    <span className="text-[10px] text-slate-400 font-semibold block uppercase">Net Change</span>
                    <span className={`text-lg font-black flex items-center justify-center gap-1 ${
                      comparisonData.comparison.netViolationChange < 0 
                        ? 'text-teal-400' 
                        : comparisonData.comparison.netViolationChange > 0 
                        ? 'text-red-400' 
                        : 'text-slate-300'
                    }`}>
                      {comparisonData.comparison.netViolationChange < 0 ? (
                        <TrendingDown className="w-4 h-4" />
                      ) : comparisonData.comparison.netViolationChange > 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <Minus className="w-4 h-4" />
                      )}
                      {comparisonData.comparison.netViolationChange > 0 ? `+${comparisonData.comparison.netViolationChange}` : comparisonData.comparison.netViolationChange}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-navy-900 border border-teal-500/30">
                    <span className="text-[10px] text-teal-300 font-semibold block uppercase">Verified Resolved</span>
                    <span className="text-lg font-black text-teal-400">{comparisonData.comparison.resolvedCount}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-navy-900 border border-amber-500/30">
                    <span className="text-[10px] text-amber-300 font-semibold block uppercase">Unverified Scope</span>
                    <span className="text-lg font-black text-amber-400">{comparisonData.comparison.unverifiedResolvedCount}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-navy-900 border border-orange-500/30">
                    <span className="text-[10px] text-orange-300 font-semibold block uppercase">Remaining</span>
                    <span className="text-lg font-black text-orange-400">{comparisonData.comparison.remainingCount}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-navy-900 border border-red-500/30 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-red-300 font-semibold block uppercase">New Findings</span>
                    <span className="text-lg font-black text-red-400">{comparisonData.comparison.newCount}</span>
                  </div>
                </div>

                {/* Tabs for findings */}
                <div className="flex items-center gap-2 border-b border-navy-800 pb-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setCompareTab('resolved')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                      compareTab === 'resolved' 
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Resolved ({comparisonData.comparison.resolvedCount + comparisonData.comparison.unverifiedResolvedCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompareTab('remaining')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                      compareTab === 'remaining' 
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Remaining ({comparisonData.comparison.remainingCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompareTab('new')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                      compareTab === 'new' 
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    New ({comparisonData.comparison.newCount})
                  </button>
                </div>

                {/* Tab content */}
                <div className="space-y-2 text-xs max-h-60 overflow-y-auto pr-1">
                  {compareTab === 'resolved' && (
                    <>
                      {comparisonData.comparison.verifiedResolved.map((item, idx) => (
                        <div key={`res-${idx}`} className="p-2.5 rounded-lg bg-navy-900 border border-teal-500/20 flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-teal-300">{item.rule_id}</span>
                              <span className="px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[10px] uppercase font-bold">Verified Fixed</span>
                            </div>
                            <p className="text-slate-300 mt-0.5">{item.description}</p>
                            <span className="text-[11px] text-slate-500 font-mono block mt-1">{item.page_url} &bull; {item.selector}</span>
                          </div>
                        </div>
                      ))}
                      {comparisonData.comparison.unverifiedResolved.map((item, idx) => (
                        <div key={`unres-${idx}`} className="p-2.5 rounded-lg bg-navy-900 border border-amber-500/20 flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-amber-300">{item.rule_id}</span>
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] uppercase font-bold">Scope Excluded</span>
                            </div>
                            <p className="text-slate-300 mt-0.5">{item.description}</p>
                            <span className="text-[11px] text-amber-400/80 font-mono block mt-1">Page not re-crawled in target audit: {item.page_url}</span>
                          </div>
                        </div>
                      ))}
                      {comparisonData.comparison.resolvedCount === 0 && comparisonData.comparison.unverifiedResolvedCount === 0 && (
                        <p className="text-slate-400 italic py-2">No resolved findings between these two audits.</p>
                      )}
                    </>
                  )}

                  {compareTab === 'remaining' && (
                    <>
                      {comparisonData.comparison.remaining.map((item, idx) => (
                        <div key={`rem-${idx}`} className="p-2.5 rounded-lg bg-navy-900 border border-orange-500/20">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-orange-300">{item.baseViolation.rule_id}</span>
                            <SeverityBadge impact={item.baseViolation.impact} />
                          </div>
                          <p className="text-slate-300 mt-0.5">{item.baseViolation.description}</p>
                          <span className="text-[11px] text-slate-500 font-mono block mt-1">{item.baseViolation.page_url} &bull; {item.baseViolation.selector}</span>
                        </div>
                      ))}
                      {comparisonData.comparison.remainingCount === 0 && (
                        <p className="text-slate-400 italic py-2">No remaining findings common to both audits.</p>
                      )}
                    </>
                  )}

                  {compareTab === 'new' && (
                    <>
                      {comparisonData.comparison.newFindings.map((item, idx) => (
                        <div key={`new-${idx}`} className="p-2.5 rounded-lg bg-navy-900 border border-red-500/20">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-red-300">{item.rule_id}</span>
                            <SeverityBadge impact={item.impact} />
                          </div>
                          <p className="text-slate-300 mt-0.5">{item.description}</p>
                          <span className="text-[11px] text-slate-500 font-mono block mt-1">{item.page_url} &bull; {item.selector}</span>
                        </div>
                      ))}
                      {comparisonData.comparison.newCount === 0 && (
                        <p className="text-slate-400 italic py-2">Zero new findings introduced in target audit.</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {scan.status === 'failed' && (
          <div 
            role="alert" 
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-3"
          >
            <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <strong className="block font-semibold">Audit Execution Incomplete</strong>
              <p className="leading-relaxed">
                {scan.error_message || 'The scan encountered an unexpected issue and could not complete.'}
              </p>
            </div>
          </div>
        )}

        {scan.status === 'running' && (
          <div 
            role="status" 
            aria-live="polite"
            className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs flex items-center gap-3"
          >
            <Loader2 className="w-5 h-5 text-teal-400 animate-spin shrink-0" aria-hidden="true" />
            <div>
              <strong className="block font-semibold">Audit In Progress</strong>
              <p className="text-slate-300 text-[11px]">Running live Playwright crawler and axe-core audit across internal pages. This page automatically updates upon completion.</p>
            </div>
          </div>
        )}

        {/* Breakdown Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-6 border-t border-navy-800/80">
          <div className="p-3 rounded-xl bg-navy-950 border border-navy-800 text-center">
            <span className="text-[11px] font-semibold text-slate-400 block">Total Barriers</span>
            <span className="text-xl font-extrabold text-white">{scan.total_violations}</span>
          </div>
          <div className="p-3 rounded-xl bg-navy-950 border border-red-500/20 text-center">
            <span className="text-[11px] font-semibold text-red-300 block">Critical</span>
            <span className="text-xl font-extrabold text-red-400">{scan.critical_count}</span>
          </div>
          <div className="p-3 rounded-xl bg-navy-950 border border-orange-500/20 text-center">
            <span className="text-[11px] font-semibold text-orange-300 block">Serious</span>
            <span className="text-xl font-extrabold text-orange-400">{scan.serious_count}</span>
          </div>
          <div className="p-3 rounded-xl bg-navy-950 border border-amber-500/20 text-center">
            <span className="text-[11px] font-semibold text-amber-300 block">Moderate</span>
            <span className="text-xl font-extrabold text-amber-400">{scan.moderate_count}</span>
          </div>
          <div className="p-3 rounded-xl bg-navy-950 border border-blue-500/20 text-center">
            <span className="text-[11px] font-semibold text-blue-300 block">Minor</span>
            <span className="text-xl font-extrabold text-blue-400">{scan.minor_count}</span>
          </div>
          <div className="p-3 rounded-xl bg-navy-950 border border-amber-500/40 text-center">
            <span className="text-[11px] font-semibold text-amber-300 block">Needs Review</span>
            <span className="text-xl font-extrabold text-amber-400">{scan.incomplete_count ?? manualChecks.length ?? 0}</span>
          </div>
          <div className="p-3 rounded-xl bg-navy-950 border border-teal-500/20 text-center">
            <span className="text-[11px] font-semibold text-teal-300 block">Passed Checks</span>
            <span className="text-xl font-extrabold text-teal-400">{scan.passes_count}</span>
            <span className="text-[9px] text-slate-400 block -mt-0.5" title="Aggregated rule evaluations across scanned pages, not unique WCAG rules">
              (across pages)
            </span>
          </div>
          <div className="p-3 rounded-xl bg-navy-950 border border-purple-500/20 text-center col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-purple-300 block">Pages Crawled</span>
            <span className="text-xl font-extrabold text-purple-400">
              {scannedPagesCount}
              {failedPagesCount > 0 && <span className="text-xs text-red-400 ml-1">({failedPagesCount} fail)</span>}
            </span>
          </div>
        </div>
      </section>

      {/* Crawled Pages & Internal Link Discovery Section */}
      {pages.length > 0 && (
        <section aria-labelledby="pages-heading" className="space-y-4 p-6 rounded-2xl bg-navy-900 border border-navy-800 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 id="pages-heading" className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-400" />
                <span>Audited Internal Pages ({pages.length})</span>
              </h2>
              <p className="text-xs text-slate-400">
                Discovered and evaluated HTML pages on the same origin (depth 0 to {scan.max_depth || 2}).
              </p>
            </div>
            {pageFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setPageFilter('all')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-navy-800 text-teal-300 hover:text-white border border-navy-700"
              >
                Reset Page Filter (Showing all)
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-navy-800 bg-navy-950">
            <table className="w-full text-left text-xs" aria-label="Audited Pages Breakdown">
              <thead className="bg-navy-900 border-b border-navy-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-bold">Page URL</th>
                  <th scope="col" className="px-3 py-2.5 font-bold">Status</th>
                  <th scope="col" className="px-3 py-2.5 font-bold">Depth</th>
                  <th scope="col" className="px-3 py-2.5 font-bold">HTTP</th>
                  <th scope="col" className="px-3 py-2.5 font-bold">Barriers</th>
                  <th scope="col" className="px-3 py-2.5 font-bold">Needs Review</th>
                  <th scope="col" className="px-3 py-2.5 font-bold">Passed Checks</th>
                  <th scope="col" className="px-3 py-2.5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/80">
                {pages.map((p) => {
                  const isSelected = pageFilter === p.url;
                  return (
                    <tr 
                      key={p.id || p.url} 
                      className={`hover:bg-navy-900/60 transition-colors ${isSelected ? 'bg-teal-500/10' : ''}`}
                    >
                      <td className="px-4 py-3 font-mono font-medium text-white max-w-sm truncate" title={p.url}>
                        {p.url}
                      </td>
                      <td className="px-3 py-3">
                        <span 
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            p.status === 'completed'
                              ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                              : p.status === 'failed'
                              ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-mono text-slate-400 text-[11px]">
                        Depth {p.depth}
                      </td>
                      <td className="px-3 py-3 font-mono text-[11px]">
                        {p.http_status ? (
                          <span className={p.http_status < 400 ? 'text-teal-300' : 'text-red-400'}>
                            {p.http_status}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-3 font-bold font-mono text-white">
                        {p.total_violations}
                      </td>
                      <td className="px-3 py-3 font-mono text-amber-300 font-semibold">
                        {p.incomplete_count || 0}
                      </td>
                      <td className="px-3 py-3 font-mono text-teal-300">
                        {p.passes_count}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setPageFilter(isSelected ? 'all' : p.url)}
                          className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-teal-400 ${
                            isSelected 
                              ? 'bg-teal-500 text-navy-950 font-bold' 
                              : 'bg-navy-850 hover:bg-navy-800 text-teal-300 border border-navy-750'
                          }`}
                        >
                          {isSelected ? 'Viewing' : 'View Findings'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Partial Coverage & Traversal Boundaries Disclosure */}
          <div className="p-3.5 rounded-xl bg-navy-950/80 border border-navy-800 text-[11px] text-slate-400 space-y-1">
            <strong className="text-slate-300 block">Website Crawl Boundaries & Partial Coverage Disclosure</strong>
            <p className="leading-relaxed">
              The internal crawler strictly evaluates HTML documents matching <code className="text-teal-300">{scan.url}</code> up to traversal depth {scan.max_depth || 2} and a max limit of {maxPagesAllowed} pages.
              Private intranets, authentication-guarded portals, non-HTML documents (.pdf, .doc), and external domains are excluded from automated crawls.
            </p>
          </div>
        </section>
      )}

      {/* Honest Testing Limitation Disclaimer */}
      <DisclaimerBanner text={automatedTestingDisclaimer} />

      {/* Findings Explorer with Distinct Barrier and Manual Review Views */}
      <section aria-labelledby="findings-heading" className="space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 id="findings-heading" className="text-lg font-bold text-white tracking-tight">
              Audit Findings Explorer
            </h2>
            <p className="text-xs text-slate-400">
              {pageFilter !== 'all' ? (
                <span>Filtering findings on: <strong className="text-teal-300 font-mono">{pageFilter}</strong></span>
              ) : (
                'Separate verification pipelines for confirmed automated barriers versus items requiring human review.'
              )}
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rule ID, selector, text..."
              aria-label="Filter findings by keyword"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-navy-900 border border-navy-800 text-xs text-white placeholder-slate-500 focus-visible:ring-2 focus-visible:ring-teal-400"
            />
          </div>
        </div>

        {/* Primary Category Switcher: Confirmed Barriers vs Needs Manual Review */}
        <div className="flex items-center gap-3 border-b border-navy-800 pb-3" role="tablist" aria-label="Findings Category">
          <button
            type="button"
            role="tab"
            aria-selected={activeFindingsTab === 'violations'}
            onClick={() => setActiveFindingsTab('violations')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-red-400 ${
              activeFindingsTab === 'violations'
                ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
                : 'bg-navy-900 text-slate-400 hover:text-white border border-navy-800'
            }`}
          >
            <AlertOctagon className="w-4 h-4 text-red-400" />
            <span>Confirmed Barriers ({violations.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeFindingsTab === 'manual'}
            onClick={() => setActiveFindingsTab('manual')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-amber-400 ${
              activeFindingsTab === 'manual'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-navy-900 text-slate-400 hover:text-white border border-navy-800'
            }`}
          >
            <Eye className="w-4 h-4 text-amber-400" />
            <span>Needs Manual Review ({manualChecks.length})</span>
          </button>
        </div>

        {/* Confirmed Violations View */}
        {activeFindingsTab === 'violations' && (
          <div className="space-y-4">
            {/* Severity Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs font-semibold" role="tablist">
              {[
                { id: 'all', label: 'All Barriers', count: scan.total_violations },
                { id: 'critical', label: 'Critical', count: scan.critical_count },
                { id: 'serious', label: 'Serious', count: scan.serious_count },
                { id: 'moderate', label: 'Moderate', count: scan.moderate_count },
                { id: 'minor', label: 'Minor', count: scan.minor_count },
              ].map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={severityFilter === tab.id}
                  onClick={() => setSeverityFilter(tab.id)}
                  className={`px-3.5 py-2 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-teal-400 whitespace-nowrap flex items-center gap-1.5 ${
                    severityFilter === tab.id
                      ? 'bg-teal-500 text-navy-950 font-bold shadow-md'
                      : 'bg-navy-900 text-slate-300 hover:text-white hover:bg-navy-850 border border-navy-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    severityFilter === tab.id ? 'bg-navy-950 text-teal-300' : 'bg-navy-950 text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Violations List */}
            {filteredViolations.length === 0 ? (
              violations.length === 0 ? (
                scan.status === 'failed' ? (
                  <EmptyState
                    icon="search"
                    title="Audit Failed Before Evidence Could Be Captured"
                    description={scan.error_message || 'The accessibility scan was interrupted before DOM violations could be evaluated.'}
                  />
                ) : scan.status === 'running' ? (
                  <EmptyState
                    icon="search"
                    title="Auditing Live DOM Tree..."
                    description="Evaluating accessibility rules against WCAG Level AA criteria across internal pages. Findings will appear once complete."
                  />
                ) : (
                  <EmptyState
                    icon="success"
                    title="Zero Algorithmic Barriers Detected on Audited Pages!"
                    description="Axe-core automated checks found no algorithmic violations on the audited pages. Note: Items flagged under 'Needs Manual Review' still require human verification to ensure compliance."
                  />
                )
              ) : (
                <EmptyState
                  icon="search"
                  title="No barriers match the active filter"
                  description={`There are no ${severityFilter !== 'all' ? severityFilter : ''} violations matching your criteria.`}
                />
              )
            ) : (
              <div className="space-y-4">
                {filteredViolations.map((violation, index) => (
                  <ViolationCard
                    key={`${violation.id || violation.rule_id}-${violation.page_url || ''}-${index}`}
                    violation={violation}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Manual Review View */}
        {activeFindingsTab === 'manual' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-3">
              <Eye className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <strong className="block font-semibold text-amber-300">About Manual Review Checks</strong>
                <p className="leading-relaxed text-slate-300">
                  These items were flagged by axe-core because automated algorithms cannot definitively determine a pass or failure (e.g. contrast over background images/gradients or ambiguous context). They are <strong>never</strong> counted as confirmed violations or passes. Human inspection is required.
                </p>
              </div>
            </div>

            {filteredManualChecks.length === 0 ? (
              manualChecks.length === 0 ? (
                <EmptyState
                  icon="success"
                  title="No Checks Flagged for Manual Review"
                  description="Axe-core did not flag any ambiguous elements requiring human inspection on the audited pages."
                />
              ) : (
                <EmptyState
                  icon="search"
                  title="No manual review checks match the active search/page filter"
                  description="Try adjusting your search query or reset the page filter above."
                />
              )
            ) : (
              <div className="space-y-4">
                {filteredManualChecks.map((check, index) => (
                  <ManualCheckCard
                    key={`manual-${check.id || check.rule_id}-${check.page_url || ''}-${index}`}
                    check={check}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
