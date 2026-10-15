import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ShieldCheck, Lock, Mail, User, AlertCircle, Loader2, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Real-time password criteria
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isFormValid = name.trim().length >= 2 && email.includes('@') && hasMinLength && hasLetter && hasNumberOrSymbol && passwordsMatch;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('Full name must be at least 2 characters long.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }
    if (!hasMinLength || !hasLetter || !hasNumberOrSymbol) {
      setErrorMessage('Password does not meet the security requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await register(email.trim(), password, name.trim());
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <Link 
          to="/"
          className="inline-flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-purple-400 rounded-xl p-1"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-purple-500/30 border border-white/20">
            <ShieldCheck className="w-7 h-7 text-white" aria-hidden="true" />
          </div>
        </Link>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white">
          Create Auditor Account
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          Join AccessGuard AI to audit public digital services
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

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <label 
                htmlFor="register-name" 
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1"
              >
                Auditor Name
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="register-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-white/15 text-white placeholder-slate-400 text-sm focus-visible:ring-2 focus-visible:ring-purple-400"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label 
                htmlFor="register-email" 
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1"
              >
                Work Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane.doe@agency.gov"
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-white/15 text-white placeholder-slate-400 text-sm focus-visible:ring-2 focus-visible:ring-purple-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label 
                htmlFor="register-password" 
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1"
              >
                Secure Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="register-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-white/15 text-white placeholder-slate-400 text-sm focus-visible:ring-2 focus-visible:ring-purple-400"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label 
                htmlFor="register-confirm-password" 
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1"
              >
                Confirm Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="block w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-white/15 text-white placeholder-slate-400 text-sm focus-visible:ring-2 focus-visible:ring-purple-400"
                />
              </div>
            </div>

            {/* Password Criteria Checklist */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1.5 text-[11px]">
              <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Security Checklist
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-teal-300' : 'text-slate-400'}`}>
                  {hasMinLength ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-500" />}
                  <span>8+ characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLetter ? 'text-teal-300' : 'text-slate-400'}`}>
                  {hasLetter ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-500" />}
                  <span>Includes letter</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumberOrSymbol ? 'text-teal-300' : 'text-slate-400'}`}>
                  {hasNumberOrSymbol ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-500" />}
                  <span>Number/symbol</span>
                </div>
                <div className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-teal-300' : 'text-slate-400'}`}>
                  {passwordsMatch ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> : <XCircle className="w-3.5 h-3.5 text-slate-500" />}
                  <span>Passwords match</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-500/30 border border-white/20 transition-all focus-visible:ring-2 focus-visible:ring-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Registering Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-slate-300">
              Already have an auditor account?{' '}
              <Link 
                to="/login" 
                className="font-semibold text-purple-300 hover:text-purple-200 underline focus-visible:ring-2 focus-visible:ring-purple-400 rounded"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
