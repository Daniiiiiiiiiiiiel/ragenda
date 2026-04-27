import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api, setAdminToken } from '@/lib/api';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN';
}

interface AuthState { user: AdminUser | null; isLoading: boolean; isAuthenticated: boolean; }
interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<(AuthState & AuthActions) | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const init = useCallback(async () => {
    try {
      // 1) Try to get a new access token from the refresh cookie
      const data = await api.post<{ accessToken: string }>('/admin/auth/refresh');
      setAdminToken(data.accessToken);
      // 2) Then fetch the current user profile
      const me = await api.get<AdminUser>('/admin/auth/me');
      setUser(me);
    } catch {
      // No valid session — stay logged out, no error thrown to the UI
      setAdminToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { init(); }, [init]);

  const login = async (email: string, password: string) => {
    const data = await api.post<{ user: AdminUser; accessToken: string }>('/admin/auth/login', { email, password });
    setAdminToken(data.accessToken);
    setUser(data.user);
  };

  const logout = async () => {
    try { await api.post('/admin/auth/logout'); } catch { /* ignore */ }
    setAdminToken(null);
    setUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return ctx;
}
