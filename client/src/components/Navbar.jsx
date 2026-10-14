import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ShieldCheck, LogOut, User, Activity, Menu, X, HeartHandshake } from 'lucide-react';
import { api } from '../services/api.js';

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState('online');

  useEffect(() => {
    api.getHealth()
      .then((res) => {
        setHealthStatus(res.database === 'connected' ? 'online' : 'degraded');
      })
      .catch(() => {
        setHealthStatus('offline');
      });
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="border-b border-navy-800 bg-navy-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link 
          to={isAuthenticated ? "/dashboard" : "/"} 
          className="flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-teal-400 rounded-lg p-1 -ml-1 transition-opacity hover:opacity-90"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-700 flex items-center justify-center shadow-md border-glow-teal text-navy-950 font-black">
            <ShieldCheck className="w-5 h-5 text-navy-950" aria-hidden="true" />
          </div>
          <div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-teal-300 via-teal-100 to-white bg-clip-text text-transparent">
              AccessGuard AI
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
              Audit Engine
            </span>
          </div>
        </Link>

        {/* Center / Right status & user navigation */}
        <div className="hidden md:flex items-center gap-4">
          {/* Citizen Mode Link */}
          <Link
            to="/citizen"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all focus-visible:ring-2 focus-visible:ring-amber-400 shadow-sm"
            title="Open Citizen Digital Service Guidance (ಕನ್ನಡ / English)"
          >
            <HeartHandshake className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span>Citizen Mode / ನಾಗರಿಕ ಮೋಡ್</span>
          </Link>

          {/* Real Backend Health Indicator */}
          <div 
            className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-navy-950 border border-navy-800 text-xs font-mono"
            title={`Backend status: ${healthStatus}`}
          >
            <span 
              className={`w-2 h-2 rounded-full ${
                healthStatus === 'online' ? 'bg-teal-400 animate-pulse' : 'bg-red-400'
              }`}
            />
            <span className="text-slate-400">Engine:</span>
            <span className={healthStatus === 'online' ? 'text-teal-300 font-semibold' : 'text-red-400 font-semibold'}>
              {healthStatus.toUpperCase()}
            </span>
          </div>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 pl-3 border-l border-navy-800">
                <div className="w-8 h-8 rounded-full bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300 font-semibold text-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left text-xs">
                  <p className="font-bold text-white leading-tight truncate max-w-[140px]">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{user?.email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                aria-label="Log out of AccessGuard"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-navy-850 hover:bg-navy-800 border border-navy-750 transition-colors focus-visible:ring-2 focus-visible:ring-teal-400"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                <span>Log out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white bg-navy-850 hover:bg-navy-800 border border-navy-750 transition-all focus-visible:ring-2 focus-visible:ring-teal-400"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-navy-950 transition-all shadow-md focus-visible:ring-2 focus-visible:ring-teal-400"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
            className="p-2 rounded-lg bg-navy-850 text-slate-300 hover:text-white border border-navy-800 focus-visible:ring-2 focus-visible:ring-teal-400"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-navy-800 bg-navy-900 px-4 py-4 space-y-3">
          {isAuthenticated ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-3 border-b border-navy-800">
                <div className="w-8 h-8 rounded-full bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300 font-semibold text-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left text-xs">
                  <p className="font-bold text-white">{user?.name}</p>
                  <p className="text-[11px] text-slate-400">{user?.email}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  to="/citizen"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 flex items-center gap-2"
                >
                  <HeartHandshake className="w-4 h-4 text-amber-400" />
                  <span>Citizen Mode / ನಾಗರಿಕ ಮೋಡ್</span>
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 bg-navy-850 hover:bg-navy-800"
                >
                  Dashboard
                </Link>
                <Link
                  to="/scans/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-teal-300 bg-teal-950/40 border border-teal-500/30"
                >
                  New Scan
                </Link>
                <Link
                  to="/history"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 bg-navy-850 hover:bg-navy-800"
                >
                  Audit History
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-red-400 bg-navy-950 border border-red-500/20"
                >
                  Log out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                to="/citizen"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 flex items-center justify-center gap-2"
              >
                <HeartHandshake className="w-4 h-4 text-amber-400" />
                <span>Citizen Mode / ನಾಗರಿಕ ಮೋಡ್</span>
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 rounded-lg text-xs font-semibold text-slate-200 bg-navy-850"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 rounded-lg text-xs font-semibold bg-teal-500 text-navy-950"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
