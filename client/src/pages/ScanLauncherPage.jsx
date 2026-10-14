import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { DisclaimerBanner } from '../components/DisclaimerBanner.jsx';
import { 
  Globe, 
  ShieldCheck, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  Lock, 
  Cpu
} from 'lucide-react';

export function ScanLauncherPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [maxPages, setMaxPages] = useState(5);
  const [maxDepth, setMaxDepth] = useState(2);
  const [scanning, setScanning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [scanStep, setScanStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState(null);

  // Timer while scanning
  useEffect(() => {
    let timer;
    if (scanning) {
      setElapsedSeconds(0);
      setScanStep(1);
      timer = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= 3 && next < 6) setScanStep(2);
          else if (next >= 6 && next < 12) setScanStep(3);
          else if (next >= 12) setScanStep(4);
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [scanning]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    let target = url.trim();
    if (!target) {
      setErrorMessage('Please enter a website URL to audit.');
      return;
    }

    if (!/^https?:\/\//i.test(target)) {
      target = `https://${target}`;
    }

    try {
      setScanning(true);
      const res = await api.launchScan(target, { maxPages, maxDepth });
      if (res?.scan?.id) {
        navigate(`/scans/${res.scan.id}`);
      } else {
        setErrorMessage('Scan completed but failed to retrieve scan ID.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'An error occurred during the accessibility audit.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          New Digital Service Accessibility Audit
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed">
          Launch a real, headless Playwright browser audit powered by axe-core. Audits the live DOM tree against official WCAG 2.1 & 2.2 Level AA success criteria.
        </p>
      </div>

      <DisclaimerBanner />

      {/* Main Form Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-navy-900 border border-navy-800 shadow-2xl space-y-6">
        {errorMessage && (
          <div 
            role="alert" 
            className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <strong className="block font-semibold">Audit Execution Error</strong>
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label 
              htmlFor="scan-url" 
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
            >
              Public Website Target URL
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Globe className="w-5 h-5" aria-hidden="true" />
              </div>
              <input
                id="scan-url"
                name="url"
                type="url"
                required
                disabled={scanning}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://service.gov or https://cityportal.org"
                aria-describedby="url-helper-text"
                className="block w-full pl-12 pr-4 py-3.5 rounded-xl bg-navy-950 border border-navy-800 text-white placeholder-slate-500 text-sm focus-visible:ring-2 focus-visible:ring-teal-400 disabled:opacity-50"
              />
            </div>
            <p id="url-helper-text" className="mt-2 text-xs text-slate-400">
              Enter any publicly accessible digital service URL. Both HTTP and HTTPS are supported.
            </p>
          </div>

          {/* Website-Wide Crawl Scope Settings */}
          <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-xl bg-navy-950/70 border border-navy-800">
            <div>
              <label 
                htmlFor="max-pages-select" 
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
              >
                Audit Scope (Page Budget)
              </label>
              <select
                id="max-pages-select"
                value={maxPages}
                disabled={scanning}
                onChange={(e) => setMaxPages(Number(e.target.value))}
                className="block w-full py-2.5 px-3 rounded-lg bg-navy-900 border border-navy-750 text-white text-xs focus-visible:ring-2 focus-visible:ring-teal-400 disabled:opacity-50"
              >
                <option value={1}>Single Page Audit (Root page only)</option>
                <option value={3}>Multi-Page Audit (Up to 3 pages)</option>
                <option value={5}>Standard Website Audit (Up to 5 pages — Recommended)</option>
                <option value={10}>Deep Website Audit (Up to 10 pages)</option>
              </select>
              <p className="mt-1.5 text-[11px] text-slate-400">
                Discovers internal HTML pages strictly matching the same origin.
              </p>
            </div>

            <div>
              <label 
                htmlFor="max-depth-select" 
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
              >
                Link Traversal Depth
              </label>
              <select
                id="max-depth-select"
                value={maxDepth}
                disabled={scanning}
                onChange={(e) => setMaxDepth(Number(e.target.value))}
                className="block w-full py-2.5 px-3 rounded-lg bg-navy-900 border border-navy-750 text-white text-xs focus-visible:ring-2 focus-visible:ring-teal-400 disabled:opacity-50"
              >
                <option value={1}>Depth 1: Direct links from target page</option>
                <option value={2}>Depth 2: Traversal up to 2 clicks deep</option>
                <option value={3}>Depth 3: Traversal up to 3 clicks deep</option>
              </select>
              <p className="mt-1.5 text-[11px] text-slate-400">
                Restricts how deep the internal crawler follows discovered links.
              </p>
            </div>
          </div>

          {/* Scanning Progress Visualizer */}
          {scanning && (
            <div 
              aria-live="polite"
              className="p-5 rounded-xl bg-navy-950 border border-teal-500/30 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Loader2 className="w-5 h-5 text-teal-400 animate-spin" aria-hidden="true" />
                  <span className="font-bold text-white text-sm">
                    {maxPages > 1 ? 'Running Website Crawler & Multi-Page Axe Audit...' : 'Running Live Playwright + axe-core Audit...'}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-teal-300 px-2.5 py-1 rounded-md bg-teal-500/10 border border-teal-500/20">
                  {elapsedSeconds}s elapsed
                </span>
              </div>

              {/* Progress Steps */}
              <div className="grid sm:grid-cols-4 gap-2 pt-2 border-t border-navy-800 text-xs">
                <div className={`flex items-center gap-2 p-2 rounded-lg ${scanStep >= 1 ? 'text-teal-300 bg-teal-500/10' : 'text-slate-500'}`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>1. SSRF & Pre-check</span>
                </div>
                <div className={`flex items-center gap-2 p-2 rounded-lg ${scanStep >= 2 ? 'text-teal-300 bg-teal-500/10' : 'text-slate-500'}`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>2. Page Discovery</span>
                </div>
                <div className={`flex items-center gap-2 p-2 rounded-lg ${scanStep >= 3 ? 'text-teal-300 bg-teal-500/10' : 'text-slate-500'}`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>3. Multi-Page Audit</span>
                </div>
                <div className={`flex items-center gap-2 p-2 rounded-lg ${scanStep >= 4 ? 'text-teal-300 bg-teal-500/10' : 'text-slate-500'}`}>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>4. Storing Evidence</span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={scanning || !url.trim()}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl text-sm font-bold bg-teal-500 hover:bg-teal-400 text-navy-950 shadow-lg shadow-teal-500/20 transition-all focus-visible:ring-2 focus-visible:ring-teal-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {scanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Auditing Live DOM...</span>
              </>
            ) : (
              <>
                <span>Launch Accessibility Audit</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        {/* Security & Integrity Safeguards Details */}
        <div className="pt-6 border-t border-navy-800 grid sm:grid-cols-3 gap-4 text-xs text-slate-400">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              <Lock className="w-3.5 h-3.5 text-teal-400" aria-hidden="true" />
              <span>SSRF Guard</span>
            </div>
            <p className="leading-relaxed">
              Pre-flight DNS checks block all loopback, RFC 1918 private IPs, and cloud metadata APIs.
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              <Cpu className="w-3.5 h-3.5 text-teal-400" aria-hidden="true" />
              <span>Real Chromium Engine</span>
            </div>
            <p className="leading-relaxed">
              Renders modern Single Page Applications (SPAs) and dynamic JavaScript components before auditing.
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" aria-hidden="true" />
              <span>Deterministic Guidance</span>
            </div>
            <p className="leading-relaxed">
              Every violation is paired with genuine WCAG 2.1 AA techniques and exact DOM node selectors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
