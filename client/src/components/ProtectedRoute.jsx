import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ShieldAlert, Loader2 } from 'lucide-react';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div 
        className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-4 text-center"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-10 h-10 text-teal-400 animate-spin mb-4" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-300">Verifying security credentials...</p>
        <span className="sr-only">Loading user session</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
