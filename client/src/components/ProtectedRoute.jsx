import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-950"><div className="flex items-center gap-3 text-sm font-medium text-slate-300"><span className="spinner h-5 w-5 border-cyan-400/30 border-t-cyan-400" />Restoring your workspace…</div></div>;
  return isAuthenticated ? <Outlet /> : <Navigate replace state={{ from: location }} to="/login" />;
}
