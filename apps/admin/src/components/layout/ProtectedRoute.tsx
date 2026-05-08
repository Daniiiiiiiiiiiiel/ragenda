import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAdminAuth } from '@/contexts/AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useAdminAuth();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#121110' }}>
      <div className="w-10 h-10 border-[3px] border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(201,177,98,0.2)', borderTopColor: '#c9b162' }} />
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
