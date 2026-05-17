import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import { formatDateLocal, formatTime, cn } from '@/lib/utils';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface Appointment {
  id: string; date: string; timeSlot: string; status: string; notes?: string;
  user: { name: string; email: string; phone?: string };
  service: { name: string; duration: number; color: string };
}

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

const STATUS_OPTIONS = [
  { value: '',          label: 'Todos los estados' },
  { value: 'PENDING',   label: 'Pendiente'   },
  { value: 'ACCEPTED',  label: 'Aceptada'  },
  { value: 'REJECTED',  label: 'Rechazada'  },
  { value: 'CANCELLED', label: 'Cancelada' },
];

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 400);
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

  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);
  useEffect(() => { load(); }, [load]);

  const handleStatusUpdate = async (id: string, status: 'ACCEPTED' | 'REJECTED') => {
    if (updatingRef.current.has(id)) return;
    const notes = status === 'REJECTED' ? prompt('Motivo del rechazo (opcional):') : '';
    if (notes === null && status === 'REJECTED') return;

    updatingRef.current.add(id);
    setUpdatingId(id);
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));

    try {
      await api.patch(`/admin/appointments/${id}/status`, { status, adminNotes: notes });
    } catch (e: unknown) {
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'PENDING' } : a)));
      alert((e as Error).message);
    } finally {
      updatingRef.current.delete(id);
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-5 animate-slide-up">

      <div className="page-header">
        <div>
          <h1 className="page-title">Citas</h1>
          <p className="page-subtitle">{total} reserva{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#5e5a55' }} />
            <input
              type="text"
              placeholder="Buscar por nombre o correo…"
              className="input pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="sm:w-44 relative">
            <SlidersHorizontal className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#5e5a55' }} />
            <select
              className="input pl-10 appearance-none cursor-pointer"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th className="table-header-cell">Cliente</th>
                <th className="table-header-cell">Servicio</th>
                <th className="table-header-cell">Fecha y Hora</th>
                <th className="table-header-cell">Estado</th>
                <th className="table-header-cell text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#c9b162' }} />
                      <span className="text-sm" style={{ color: '#5e5a55' }}>Cargando citas…</span>
                    </div>
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <Search className="w-5 h-5" style={{ color: '#48453f' }} />
                      </div>
                      <p className="text-sm" style={{ color: '#7c7872' }}>No se encontraron citas</p>
                      <p className="text-xs" style={{ color: '#48453f' }}>Intenta ajustar tu búsqueda o filtros</p>
                    </div>
                  </td>
                </tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a.id} className="table-row">
                    <td className="table-cell" data-label="Cliente">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs shrink-0"
                          style={{ backgroundColor: a.service.color || '#c9b162', fontWeight: 500 }}
                        >
                          {a.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-right sm:text-left" style={{ color: '#dedddb', fontWeight: 500 }}>{a.user.name}</p>
                          <p className="text-xs truncate text-right sm:text-left" style={{ color: '#5e5a55' }}>{a.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell" data-label="Servicio">
                      <div className="flex flex-col items-end sm:items-start">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: a.service.color }} />
                          <span style={{ color: '#c5c3c0', fontWeight: 500 }}>{a.service.name}</span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: '#5e5a55' }}>{a.service.duration} min</p>
                      </div>
                    </td>
                    <td className="table-cell" data-label="Fecha y Hora">
                      <div className="flex flex-col items-end sm:items-start">
                        <p style={{ color: '#dedddb', fontWeight: 500 }}>{formatDateLocal(a.date)}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#5e5a55' }}>{formatTime(a.timeSlot)}</p>
                      </div>
                    </td>
                    <td className="table-cell" data-label="Estado">
                      <span className={cn('badge', `badge-${a.status.toLowerCase()}`)}>
                        {a.status.charAt(0) + a.status.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="table-cell sm:text-right" data-label="Acciones">
                      {a.status === 'PENDING' && (
                        <div className="flex justify-end gap-1.5">
                          {updatingId === a.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#5e5a55' }} />
                          ) : (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(a.id, 'ACCEPTED')}
                                className="p-2 rounded-lg transition-colors"
                                title="Aceptar"
                                style={{ color: '#4ade80' }}
                              >
                                <CheckCircle2 className="w-4.5 h-4.5" />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(a.id, 'REJECTED')}
                                className="p-2 rounded-lg transition-colors"
                                title="Rechazar"
                                style={{ color: '#f87171' }}
                              >
                                <XCircle className="w-4.5 h-4.5" />
                              </button>
                            </>
                          )}
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
        <div className="card-footer flex items-center justify-between">
          <span className="text-sm" style={{ color: '#5e5a55' }}>
            Página <span style={{ color: '#c5c3c0', fontWeight: 500 }}>{page}</span> de{' '}
            <span style={{ color: '#c5c3c0', fontWeight: 500 }}>{totalPages || 1}</span>
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 rounded-lg disabled:opacity-30 transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.06)', color: '#7c7872' }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-lg disabled:opacity-30 transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.06)', color: '#7c7872' }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
