import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { formatDateLocal, formatTime, cn } from '@/lib/utils';
import { Search, Filter, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';

interface Appointment {
  id: string; date: string; timeSlot: string; status: string; notes?: string;
  user: { name: string; email: string; phone?: string };
  service: { name: string; duration: number; color: string };
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

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Debounce search so we don't fire a request on every keystroke
  const debouncedSearch = useDebounce(search, 400);

  // Track in-flight status updates to prevent double-clicking
  const updatingRef = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: page.toString(), limit: '10' });
      if (debouncedSearch) q.append('search', debouncedSearch);
      if (statusFilter) q.append('status', statusFilter);

      const res = await api.get<{ appointments: Appointment[]; total: number; totalPages: number }>(
        `/admin/appointments?${q}`,
      );
      setAppointments(res.appointments);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleStatusUpdate = async (id: string, status: 'ACCEPTED' | 'REJECTED') => {
    if (updatingRef.current.has(id)) return;
    const notes = status === 'REJECTED' ? prompt('Reason for rejection (optional):') : '';
    if (notes === null && status === 'REJECTED') return; // Cancelled prompt

    updatingRef.current.add(id);

    // Optimistic update — change status in UI immediately
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a)),
    );

    try {
      await api.patch(`/admin/appointments/${id}/status`, { status, adminNotes: notes });
    } catch (e: unknown) {
      // Rollback on error
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'PENDING' } : a)),
      );
      alert((e as Error).message);
    } finally {
      updatingRef.current.delete(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments</h1>
          <p className="text-slate-500 text-sm">Manage client bookings ({total} total)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search name or email..."
            className="input pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48 relative">
          <Filter className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <select
            className="input pl-9 appearance-none"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Client</th>
                <th className="px-6 py-4">Service</th>
                <th className="px-6 py-4">Date &amp; Time</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
              ) : appointments.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No appointments found.</td></tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">{a.user.name}</p>
                      <p className="text-slate-500 text-xs">{a.user.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: a.service.color }} />
                        {a.service.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div>{formatDateLocal(a.date)}</div>
                      <div className="text-xs text-slate-400">{formatTime(a.timeSlot)} ({a.service.duration}m)</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('badge', `badge-${a.status.toLowerCase()}`)}>{a.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {a.status === 'PENDING' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleStatusUpdate(a.id, 'ACCEPTED')}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Accept"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(a.id, 'REJECTED')}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between">
          <span className="text-sm text-slate-500">Page {page} of {totalPages || 1}</span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
