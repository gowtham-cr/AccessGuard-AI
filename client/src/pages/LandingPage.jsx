import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Cpu, 
  FileText, 
  Sparkles,
  ExternalLink,
  HeartHandshake
} from 'lucide-react';

export function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col justify-between selection:bg-purple-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-white/10 bg-slate-950/40 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-purple-500/30 border border-white/20">
              <ShieldCheck className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
                AccessGuard AI
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                Accessible by Default
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-3">
            <Link
              to="/citizen"
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 transition-all focus-visible:ring-2 focus-visible:ring-amber-400 flex items-center gap-1.5"
            >
              <HeartHandshake className="w-3.5 h-3.5 text-amber-400" />
              <span>Citizen Mode / ನಾಗರಿಕ ಮೋಡ್</span>
            </Link>

            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/30 border border-white/20 transition-all focus-visible:ring-2 focus-visible:ring-purple-400"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all focus-visible:ring-2 focus-visible:ring-purple-400"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/30 border border-white/20 transition-all focus-visible:ring-2 focus-visible:ring-purple-400"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 py-16 sm:py-24 text-center space-y-8 flex-1 flex flex-col justify-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-purple-300 text-xs font-mono shadow-inner mx-auto">
          <span>Automated Barrier Scanner & Citizen Service Guide</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Real Accessibility Audits. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-purple-300 via-indigo-200 to-cyan-300 bg-clip-text text-transparent">
            No Fabricated Compliance.
          </span>
        </h1>

        <p className="text-slate-300 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
          AccessGuard AI performs genuine Playwright browser audits using axe-core to identify accessibility barriers in public digital services, while providing direct, bilingual step-by-step guidance for citizens in English and Kannada.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            to={isAuthenticated ? "/dashboard" : "/register"}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-xl shadow-purple-500/35 border border-white/20 transition-all focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            <span>{isAuthenticated ? 'Open Audit Dashboard' : 'Get Started as Auditor'}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
          <Link
            to="/citizen"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 transition-all focus-visible:ring-2 focus-visible:ring-amber-400 shadow-md"
          >
            <HeartHandshake className="w-4 h-4 text-amber-400" aria-hidden="true" />
            <span>Open Citizen Mode / ನಾಗರಿಕ ಮೋಡ್</span>
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all focus-visible:ring-2 focus-visible:ring-purple-400"
          >
            <span>Sign In to Existing Account</span>
          </Link>
        </div>

        {/* 4 Core Integrity Pillars */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-12 text-left">
          <div className="p-5 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/15 shadow-xl space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-300 flex items-center justify-center">
              <Cpu className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="text-sm font-bold text-white">Genuine Browser Audit</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Real headless Chromium navigates and renders live DOM before axe-core audit. Zero simulated or fabricated results.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/15 shadow-xl space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-300 flex items-center justify-center">
              <FileText className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="text-sm font-bold text-white">No Fake Scores</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Reports actual barrier counts by impact (Critical, Serious, Moderate, Minor). Clearly documents automated testing limitations.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/15 shadow-xl space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-300 flex items-center justify-center">
              <Sparkles className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="text-sm font-bold text-white">Deterministic Guidance</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Built-in guidance is strictly derived from WCAG 2.1/2.2 AA techniques, explicitly labeled as deterministic rule-based advice.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/40 backdrop-blur-xl border border-white/15 shadow-xl space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-300 flex items-center justify-center">
              <Lock className="w-4 h-4" aria-hidden="true" />
            </div>
            <h2 className="text-sm font-bold text-white">SSRF Defense-in-Depth</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pre-flight DNS checks and Playwright route interception strictly block loopback, private networks, and cloud metadata APIs.
            </p>
          </div>
        </div>
      </main>

      {/* Accessible Footer */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-400">
        <p>AccessGuard AI — Automated Barrier Scanner for Public Digital Services</p>
      </footer>
    </div>
  );
}
