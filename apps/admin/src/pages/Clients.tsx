import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDateLocal } from '@/lib/utils';
import { Search, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';

interface Client {
  id: string; name: string; email: string; phone?: string;
  isActive: boolean; emailVerified: boolean; createdAt: string;
  _count: { appointments: number };
}

/** Defers a value update until `delay` ms after the last change */
function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const debouncedSearch = useDebounce(search, 400);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: page.toString() });
      if (debouncedSearch) q.append('search', debouncedSearch);
      const res = await api.get<{ clients: Client[]; total: number; page: number }>(
        `/admin/clients?${q}`,
      );
      setClients(res.clients);
      setTotal(res.total);
    } finally { setLoading(false); }
  }, [page, debouncedSearch]);

  // Reset to page 1 when search changes
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / 20) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-slate-500 text-sm">Manage registered users ({total} total)</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="max-w-md relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search name or email..."
            className="input pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Registered</th>
                <th className="px-6 py-4">Appointments</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No clients found.</td></tr>
              ) : (
                clients.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <div className="font-medium text-slate-900">{c.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-600">{c.email}</div>
                      <div className="text-xs text-slate-400">{c.phone || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{formatDateLocal(c.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-semibold text-xs">
                        {c._count.appointments}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {c.emailVerified ? (
                          <div title="Email Verified"><CheckCircle className="w-4 h-4 text-emerald-500" /></div>
                        ) : (
                          <div title="Email Not Verified"><XCircle className="w-4 h-4 text-slate-300" /></div>
                        )}
                        <span className={`badge ${c.isActive ? 'badge-accepted' : 'badge-rejected'}`}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between">
          <span className="text-sm text-slate-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-2 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="p-2 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
