const BASE = import.meta.env.VITE_API_URL ?? '/api';

let adminToken: string | null = null;

export function setAdminToken(token: string | null) {
  adminToken = token;
}

async function refreshToken(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/admin/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (!res.ok) return null;
    const { data } = await res.json();
    adminToken = data.accessToken;
    return adminToken;
  } catch { return null; }
}

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;

  // Add searchParams to path for consistent cache keys if needed, 
  // but we already use the full path with query string in our calls.

  const res = await fetch(`${BASE}${path}`, { ...options, headers, credentials: 'include' });

  if (res.status === 401 && retry) {
    const t = await refreshToken();
    if (t) return request<T>(path, options, false);
    throw new Error('UNAUTHORIZED');
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
  return body.data as T;
}

const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 30000; // 30 seconds

export const api = {
  get: async <T>(path: string) => {
    const cached = cache.get(path);
    if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data as T;
    const data = await request<T>(path, { method: 'GET' });
    cache.set(path, { data, ts: Date.now() });
    return data;
  },
  post: async <T>(path: string, data?: unknown) => {
    cache.clear();
    return request<T>(path, { method: 'POST', body: JSON.stringify(data) });
  },
  patch: async <T>(path: string, data?: unknown) => {
    cache.clear();
    return request<T>(path, { method: 'PATCH', body: JSON.stringify(data) });
  },
  delete: async <T>(path: string) => {
    cache.clear();
    return request<T>(path, { method: 'DELETE' });
  },
};
