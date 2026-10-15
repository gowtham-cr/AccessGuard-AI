import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ShieldCheck, Lock, Mail, AlertCircle, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please provide both your email address and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        {/* Brand Header */}
        <Link 
          to="/"
          className="inline-flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-purple-400 rounded-xl p-1"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-purple-500/30 border border-white/20">
            <ShieldCheck className="w-7 h-7 text-white" aria-hidden="true" />
          </div>
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white">
          Sign In to AccessGuard AI
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Automated barrier scanner for public digital services
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-950/40 backdrop-blur-2xl border border-white/15 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl">
          {errorMessage && (
            <div 
              role="alert" 
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-3"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" aria-hidden="true" />
              <p className="leading-relaxed">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email Field */}
            <div>
              <label 
                htmlFor="login-email" 
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="auditor@agency.gov"
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-white/15 text-white placeholder-slate-400 text-sm focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label 
                  htmlFor="login-password" 
                  className="block text-xs font-semibold text-slate-300 uppercase tracking-wider"
                >
                  Password
                </label>
              </div>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/60 border border-white/15 text-white placeholder-slate-400 text-sm focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-teal-400 rounded"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/30 border border-white/20 transition-all focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* Registration Link */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-slate-300">
              Don't have an auditor account?{' '}
              <Link 
                to="/register" 
                className="font-semibold text-purple-300 hover:text-purple-200 underline focus-visible:ring-2 focus-visible:ring-purple-400 rounded"
              >
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
