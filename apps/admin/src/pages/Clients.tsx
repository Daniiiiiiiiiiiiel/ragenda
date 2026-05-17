import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDateLocal } from '@/lib/utils';
import { Search, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Loader2, Mail, Phone } from 'lucide-react';

interface Client {
  id: string; name: string; email: string; phone?: string;
  isActive: boolean; emailVerified: boolean; createdAt: string;
  _count: { appointments: number };
}

function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// Deterministic color from name initials
function nameToColor(name: string) {
  const colors = ['#c9b162', '#a3843a', '#7c7872', '#866a31', '#dccb8a', '#5e5a55', '#b89b47', '#48453f'];
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return colors[Math.abs(hash) % colors.length];
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const debouncedSearch = useDebounce(search, 400);
  const totalPages = Math.ceil(total / 20) || 1;

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

  useEffect(() => { setPage(1); }, [debouncedSearch]);
  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5 animate-slide-up">

      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{total} usuario{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="max-w-sm relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#5e5a55' }} />
          <input
            type="text"
            placeholder="Buscar por nombre o correo…"
            className="input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th className="table-header-cell">Cliente</th>
                <th className="table-header-cell">Contacto</th>
                <th className="table-header-cell">Registro</th>
                <th className="table-header-cell text-center">Citas</th>
                <th className="table-header-cell text-right">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#c9b162' }} />
                      <span className="text-sm" style={{ color: '#5e5a55' }}>Cargando clientes…</span>
                    </div>
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <Search className="w-5 h-5" style={{ color: '#48453f' }} />
                      </div>
                      <p className="text-sm" style={{ color: '#7c7872' }}>No se encontraron clientes</p>
                    </div>
                  </td>
                </tr>
              ) : (
                clients.map((c) => {
                  const color = nameToColor(c.name);
                  const initials = c.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
                  return (
                    <tr key={c.id} className="table-row">
                      <td className="table-cell" data-label="Cliente">
                        <div className="flex items-center gap-3 justify-end sm:justify-start">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs shrink-0"
                            style={{ backgroundColor: color, fontWeight: 500 }}
                          >
                            {initials}
                          </div>
                          <div>
                            <p className="text-right sm:text-left" style={{ color: '#dedddb', fontWeight: 500 }}>{c.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell" data-label="Contacto">
                        <div className="flex flex-col items-end sm:items-start gap-1">
                          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#a09d98' }}>
                            <Mail className="w-3 h-3 flex-shrink-0" style={{ color: '#5e5a55' }} />
                            <span className="truncate max-w-[200px]">{c.email}</span>
                          </div>
                          {c.phone && (
                            <div className="flex items-center gap-1.5 text-xs" style={{ color: '#5e5a55' }}>
                              <Phone className="w-3 h-3 flex-shrink-0" />
                              {c.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="table-cell" data-label="Registro" style={{ color: '#a09d98' }}>
                        {formatDateLocal(c.createdAt)}
                      </td>
                      <td className="table-cell sm:text-center" data-label="Citas">
                        <span
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-xs"
                          style={{
                            background: 'rgba(201,177,98,0.08)',
                            color: '#c9b162',
                            fontWeight: 600,
                          }}
                        >
                          {c._count.appointments}
                        </span>
                      </td>
                      <td className="table-cell" data-label="Estado">
                        <div className="flex items-center justify-end gap-2">
                          <div title={c.emailVerified ? 'Correo verificado' : 'Correo no verificado'}>
                            {c.emailVerified
                              ? <CheckCircle2 className="w-4 h-4" style={{ color: '#4ade80' }} />
                              : <XCircle className="w-4 h-4" style={{ color: '#48453f' }} />
                            }
                          </div>
                          <span className={`badge ${c.isActive ? 'badge-accepted' : 'badge-rejected'}`}>
                            {c.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="card-footer flex items-center justify-between">
          <span className="text-sm" style={{ color: '#5e5a55' }}>
            Página <span style={{ color: '#c5c3c0', fontWeight: 500 }}>{page}</span> de{' '}
            <span style={{ color: '#c5c3c0', fontWeight: 500 }}>{totalPages}</span>
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
