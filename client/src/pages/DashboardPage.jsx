import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { DisclaimerBanner } from '../components/DisclaimerBanner.jsx';
import { EmptyState } from '../components/EmptyState.jsx';
import { 
  ShieldCheck, 
  PlayCircle, 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  Loader2, 
  ExternalLink,
  Search,
  Globe,
  Mic,
  Sparkles,
  ShieldAlert,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';


export function DashboardPage() {
  const navigate = useNavigate();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Quick scan input state
  const [quickUrl, setQuickUrl] = useState('');
  const [quickScanning, setQuickScanning] = useState(false);
  const [quickError, setQuickError] = useState(null);

  const fetchScans = async () => {
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

  useEffect(() => {
    fetchScans();
  }, []);

  const handleQuickScan = async (e) => {
    e.preventDefault();
    if (!quickUrl.trim()) return;

    let target = quickUrl.trim();
    if (!/^https?:\/\//i.test(target)) {
      target = `https://${target}`;
    }

    try {
      setQuickScanning(true);
      setQuickError(null);
      const res = await api.launchScan(target);
      if (res?.scan?.id) {
        navigate(`/scans/${res.scan.id}`);
      } else {
        await fetchScans();
      }
    } catch (err) {
      setQuickError(err.message || 'Failed to start accessibility audit.');
    } finally {
      setQuickScanning(false);
    }
  };

  // Derive genuine statistics strictly from actual API data
  const totalScans = scans.length;
  const completedScans = scans.filter((s) => s.status === 'completed');
  const totalBarriers = completedScans.reduce((acc, s) => acc + (s.total_violations || 0), 0);
  const criticalBarriers = completedScans.reduce((acc, s) => acc + (s.critical_count || 0), 0);
  const seriousBarriers = completedScans.reduce((acc, s) => acc + (s.serious_count || 0), 0);
  const totalPasses = completedScans.reduce((acc, s) => acc + (s.passes_count || 0), 0);

  return (
    <div className="space-y-8">
      {/* Page Title & Scope Banner */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-900 border border-navy-800 text-teal-300 text-xs font-mono">
          <span>Automated Barrier Scanner for Public Digital Services</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Accessibility Compliance Dashboard
        </h1>
        <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
          Real browser audits driven by Playwright & axe-core. Concrete barrier evidence, plain-language guidance, and zero synthetic scores.
        </p>
      </div>

      {/* Honest Audit Scope Disclaimer */}
      <DisclaimerBanner compact />

      {/* Quick Scan Launcher Card */}
      <section 
        aria-labelledby="quick-scan-title"
        className="p-6 rounded-2xl bg-navy-900 border border-teal-500/30 shadow-2xl space-y-4 relative overflow-hidden"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <PlayCircle className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 id="quick-scan-title" className="text-base font-bold text-white">
              Launch Public Website Audit
            </h2>
            <p className="text-xs text-slate-400">
              Evaluates live DOM against WCAG 2.1 & 2.2 AA success criteria
            </p>
          </div>
        </div>

        {quickError && (
          <div 
            role="alert" 
            className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs leading-relaxed"
          >
            <strong>Scan Rejected: </strong> {quickError}
          </div>
        )}

        <form onSubmit={handleQuickScan} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Globe className="w-4 h-4" aria-hidden="true" />
            </div>
            <input
              type="url"
              required
              value={quickUrl}
              onChange={(e) => setQuickUrl(e.target.value)}
              placeholder="https://example.gov or civic utility portal"
              aria-label="Target website URL for accessibility scan"
              className="block w-full pl-10 pr-3.5 py-3 rounded-xl bg-navy-950 border border-navy-800 text-white placeholder-slate-500 text-sm focus-visible:ring-2 focus-visible:ring-teal-400"
            />
          </div>
          <button
            type="submit"
            disabled={quickScanning}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold bg-teal-500 hover:bg-teal-400 text-navy-950 shadow-lg shadow-teal-500/20 transition-all focus-visible:ring-2 focus-visible:ring-teal-400 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {quickScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Auditing Website...</span>
              </>
            ) : (
              <>
                <span>Run Real Scan</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <p className="text-[11px] text-slate-500">
          🔒 Defense-in-depth SSRF protection is active. Private IP ranges, localhosts, and cloud metadata addresses are strictly blocked.
        </p>
      </section>

      {/* Genuine Statistics Grid */}
      <section aria-labelledby="metrics-title">
        <h2 id="metrics-title" className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          Genuine Audit Metrics (From Your Live Evaluations)
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Audits */}
          <div className="p-4 sm:p-5 rounded-2xl bg-navy-900 border border-navy-800 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Total Audits</span>
              <Clock className="w-4 h-4 text-slate-500" aria-hidden="true" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">
              {loading ? '—' : totalScans}
            </p>
            <p className="text-[11px] text-slate-500">Evaluations performed</p>
          </div>

          {/* Critical Barriers */}
          <div className="p-4 sm:p-5 rounded-2xl bg-navy-900 border border-red-500/20 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-red-300 text-xs">
              <span>Critical Barriers</span>
              <AlertOctagon className="w-4 h-4 text-red-400" aria-hidden="true" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-red-400">
              {loading ? '—' : criticalBarriers}
            </p>
            <p className="text-[11px] text-slate-500">High impact blockers</p>
          </div>

          {/* Serious Barriers */}
          <div className="p-4 sm:p-5 rounded-2xl bg-navy-900 border border-orange-500/20 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-orange-300 text-xs">
              <span>Serious Barriers</span>
              <AlertTriangle className="w-4 h-4 text-orange-400" aria-hidden="true" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-orange-400">
              {loading ? '—' : seriousBarriers}
            </p>
            <p className="text-[11px] text-slate-500">Substantial barriers</p>
          </div>

          {/* Passed Rules */}
          <div className="p-4 sm:p-5 rounded-2xl bg-navy-900 border border-teal-500/20 shadow-lg space-y-1">
            <div className="flex items-center justify-between text-teal-300 text-xs">
              <span>Passed Rules</span>
              <CheckCircle className="w-4 h-4 text-teal-400" aria-hidden="true" />
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-teal-300">
              {loading ? '—' : totalPasses}
            </p>
            <p className="text-[11px] text-slate-500">Axe algorithmic passes</p>
          </div>
        </div>
      </section>

      {/* AccessVoice AI Feature Banner */}
      <section 
        aria-labelledby="accessvoice-banner-title"
        className="p-6 rounded-2xl bg-gradient-to-r from-navy-900 via-navy-900 to-teal-950/40 border border-teal-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/40">
              <Sparkles className="w-3 h-3" />
              <span>New Module</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">Bilingual (English / ಕನ್ನಡ)</span>
          </div>
          <h2 id="accessvoice-banner-title" className="text-lg font-extrabold text-white">
            AccessVoice AI — Voice-Guided Scholarship Assistant
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Hands-free, voice-directed scholarship application module designed specifically for blind and visually impaired students. Step-by-step spoken guidance, microphone command controls, and privacy-first masked review.
          </p>
        </div>

        <Link
          to="/voice-assistant"
          className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold text-xs flex items-center gap-2 shadow-lg hover:shadow-teal-500/20 transition-all shrink-0 focus-visible:ring-2 focus-visible:ring-teal-400"
        >
          <Mic className="w-4 h-4" />
          <span>Launch Voice Assistant</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </section>

      {/* Senior Safety Shield Feature Card */}
      <section 
        aria-labelledby="safety-shield-title"
        className="p-6 rounded-2xl bg-gradient-to-r from-navy-900 via-navy-900 to-navy-950 border border-teal-500/30 shadow-xl space-y-4"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/40">
                <ShieldAlert className="w-3 h-3" />
                <span>Senior Safety</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">Bilingual (English / ಕನ್ನಡ)</span>
            </div>
            <h2 id="safety-shield-title" className="text-lg font-extrabold text-white">
              Senior Safety Shield
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Check suspicious messages, links, and online requests before taking action.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <Link
            to="/safety-shield?tab=message"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-navy-950 hover:bg-navy-800 border border-navy-800 hover:border-teal-500/40 text-slate-200 hover:text-white text-xs font-bold transition-all shadow-md focus-visible:ring-2 focus-visible:ring-teal-400"
          >
            <MessageSquare className="w-4 h-4 text-teal-400" aria-hidden="true" />
            <span>Check a Message</span>
          </Link>

          <Link
            to="/safety-shield?tab=website"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-navy-950 hover:bg-navy-800 border border-navy-800 hover:border-teal-500/40 text-slate-200 hover:text-white text-xs font-bold transition-all shadow-md focus-visible:ring-2 focus-visible:ring-teal-400"
          >
            <Globe className="w-4 h-4 text-teal-400" aria-hidden="true" />
            <span>Check a Website</span>
          </Link>

          <Link
            to="/safety-shield?tab=explain"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-navy-950 hover:bg-navy-800 border border-navy-800 hover:border-teal-500/40 text-slate-200 hover:text-white text-xs font-bold transition-all shadow-md focus-visible:ring-2 focus-visible:ring-teal-400"
          >
            <HelpCircle className="w-4 h-4 text-teal-400" aria-hidden="true" />
            <span>Explain a Warning</span>
          </Link>
        </div>
      </section>

      {/* Recent Scans Table / List */}
      <section aria-labelledby="recent-scans-title" className="space-y-4">

        <div className="flex items-center justify-between">
          <h2 id="recent-scans-title" className="text-lg font-bold text-white tracking-tight">
            Recent Accessibility Audits
          </h2>
          {scans.length > 0 && (
            <Link
              to="/history"
              className="text-xs font-semibold text-teal-300 hover:text-teal-200 inline-flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-teal-400 rounded"
            >
              <span>View full history</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center rounded-2xl bg-navy-900/40 border border-navy-800">
            <Loader2 className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-2" aria-hidden="true" />
            <p className="text-xs text-slate-400">Loading your audit records...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            {error}
          </div>
        ) : scans.length === 0 ? (
          <EmptyState
            icon="search"
            title="No accessibility audits performed yet"
            description="Enter a public service or municipal website URL above to initiate your first real Playwright + axe-core inspection."
            actionText="Launch Full Scan"
            actionLink="/scans/new"
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-navy-800 bg-navy-900 shadow-xl">
            <table className="w-full text-left text-xs" aria-label="Recent Accessibility Audits">
              <thead className="bg-navy-950/70 border-b border-navy-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th scope="col" className="px-5 py-3 font-bold">Target URL</th>
                  <th scope="col" className="px-4 py-3 font-bold">Status</th>
                  <th scope="col" className="px-4 py-3 font-bold">Total Barriers</th>
                  <th scope="col" className="px-4 py-3 font-bold">Severity Breakdown</th>
                  <th scope="col" className="px-4 py-3 font-bold">Audit Date</th>
                  <th scope="col" className="px-4 py-3 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800/80">
                {scans.slice(0, 5).map((scan) => (
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
                    <td className="px-4 py-4 font-bold text-slate-200">
                      {scan.total_violations}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="text-red-400" title="Critical">{scan.critical_count}C</span>
                        <span className="text-orange-400" title="Serious">{scan.serious_count}S</span>
                        <span className="text-amber-400" title="Moderate">{scan.moderate_count}M</span>
                        <span className="text-blue-400" title="Minor">{scan.minor_count}m</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-400 text-[11px]">
                      {new Date(scan.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        to={`/scans/${scan.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-navy-800 text-teal-300 hover:bg-navy-700 hover:text-white border border-navy-700 focus-visible:ring-2 focus-visible:ring-teal-400 transition-colors"
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
      </section>
    </div>
  );
}
