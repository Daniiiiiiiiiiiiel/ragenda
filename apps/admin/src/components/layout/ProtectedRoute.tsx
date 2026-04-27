import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAdminAuth } from '@/contexts/AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAdminAuth();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
