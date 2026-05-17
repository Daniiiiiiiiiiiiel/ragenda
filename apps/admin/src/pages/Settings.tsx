import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Edit2, Plus, Clock, DollarSign, X, Check, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Service {
  id: string; name: string; duration: number;
  description?: string; price?: number; color: string; isActive: boolean;
}

interface ServiceForm {
  name: string; duration: string; description: string;
  price: string; color: string; isActive: boolean;
}

const PRESET_COLORS = [
  '#c9b162', '#a3843a', '#7c7872', '#4ade80',
  '#f5c842', '#f87171', '#ec4899', '#5e5a55',
];

const EMPTY_FORM: ServiceForm = {
  name: '', duration: '60', description: '', price: '', color: '#c9b162', isActive: true,
};

function toForm(svc: Service): ServiceForm {
  return {
    name: svc.name,
    duration: String(svc.duration),
    description: svc.description ?? '',
    price: svc.price != null ? String(svc.price) : '',
    color: svc.color,
    isActive: svc.isActive,
  };
}

export default function Settings() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try { setServices(await api.get<Service[]>('/admin/services')); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (modalOpen) setTimeout(() => nameRef.current?.focus(), 50); }, [modalOpen]);

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setFormError(''); setModalOpen(true); };
  const openEdit   = (svc: Service) => { setEditingId(svc.id); setForm(toForm(svc)); setFormError(''); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingId(null); setFormError(''); };

  const set = (field: keyof ServiceForm, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('El nombre del servicio es obligatorio.'); return; }
    const dur = parseInt(form.duration);
    if (isNaN(dur) || dur < 5 || dur > 480) { setFormError('La duración debe estar entre 5 y 480 minutos.'); return; }
    const price = form.price.trim() ? parseFloat(form.price) : undefined;
    if (price !== undefined && (isNaN(price) || price <= 0)) { setFormError('El precio debe ser un número positivo.'); return; }

    setSaving(true); setFormError('');
    const payload = {
      name: form.name.trim(), duration: dur,
      description: form.description.trim() || undefined,
      price, color: form.color, isActive: form.isActive,
    };

    try {
      if (editingId) {
        const updated = await api.patch<Service>(`/admin/services?id=${editingId}`, payload);
        setServices((prev) => prev.map((s) => (s.id === editingId ? updated : s)));
      } else {
        const created = await api.post<Service>('/admin/services', payload);
        setServices((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      }
      closeModal();
    } catch (e: unknown) {
      setFormError((e as Error).message ?? 'Ocurrió un error inesperado.');
    } finally { setSaving(false); }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: !current } : s)));
    try {
      await api.patch<Service>(`/admin/services?id=${id}`, { isActive: !current });
    } catch (e: unknown) {
      setServices((prev) => prev.map((s) => (s.id === id ? { ...s, isActive: current } : s)));
      alert((e as Error).message);
    }
  };

  return (
    <>
      <div className="space-y-5 animate-slide-up max-w-4xl">

        <div className="page-header">
          <div>
            <h1 className="page-title">Configuración</h1>
            <p className="page-subtitle">Administra los servicios y preferencias generales</p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.15rem', fontWeight: 500, color: '#f7f7f6' }}>
                Services
              </h2>
              <p className="text-xs mt-0.5" style={{ color: '#5e5a55' }}>
                {services.length} servicio{services.length !== 1 ? 's' : ''} configurado{services.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button onClick={openCreate} className="btn-primary btn-sm gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Nuevo Servicio
            </button>
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#c9b162' }} />
              <span className="text-sm" style={{ color: '#5e5a55' }}>Cargando servicios…</span>
            </div>
          ) : services.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(201,177,98,0.06)' }}>
                <Sparkles className="w-6 h-6" style={{ color: '#c9b162' }} />
              </div>
              <p className="text-sm" style={{ color: '#a09d98', fontWeight: 500 }}>Sin servicios aún</p>
              <button onClick={openCreate} className="text-sm hover:underline" style={{ color: '#c9b162', fontWeight: 500 }}>
                Crear tu primer servicio →
              </button>
            </div>
          ) : (
            <div>
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className={cn(
                    'p-5 flex flex-col sm:flex-row gap-4 sm:items-center transition-opacity duration-200',
                    !svc.isActive && 'opacity-40 grayscale',
                  )}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div
                      className="w-11 h-11 rounded-lg flex items-center justify-center text-white text-base shrink-0"
                      style={{ backgroundColor: svc.color, fontWeight: 500 }}
                    >
                      {svc.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 style={{ color: '#f7f7f6', fontWeight: 600, fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.05rem' }}>
                          {svc.name}
                        </h3>
                        {!svc.isActive && <span className="badge badge-rejected">Inactivo</span>}
                      </div>
                      <p className="text-sm mt-0.5 line-clamp-1" style={{ color: '#7c7872' }}>
                        {svc.description || 'Sin descripción.'}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1.5 text-xs" style={{ color: '#5e5a55', fontWeight: 500 }}>
                          <Clock className="w-3.5 h-3.5" />
                          {svc.duration} min
                        </span>
                        {svc.price != null && (
                          <span className="flex items-center gap-1.5 text-xs" style={{ color: '#5e5a55', fontWeight: 500 }}>
                            <DollarSign className="w-3.5 h-3.5" />
                            ${svc.price}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:ml-auto flex-shrink-0">
                    <button onClick={() => openEdit(svc)} className="btn-secondary btn-sm gap-1.5">
                      <Edit2 className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      onClick={() => handleToggleActive(svc.id, svc.isActive)}
                      className="btn-sm btn gap-1.5"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: svc.isActive ? '1px solid rgba(239,68,68,0.15)' : '1px solid rgba(74,222,128,0.15)',
                        color: svc.isActive ? '#f87171' : '#4ade80',
                      }}
                    >
                      {svc.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative rounded-xl w-full max-w-lg animate-scale-in"
            style={{
              background: '#1e1d1a',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.15rem', fontWeight: 500, color: '#f7f7f6' }}>
                {editingId ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-md transition-colors"
                style={{ color: '#5e5a55' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="label">Nombre del Servicio <span style={{ color: '#f87171' }}>*</span></label>
                <input
                  ref={nameRef}
                  type="text" maxLength={80} className="input"
                  placeholder="Ej. Masaje de tejido profundo"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Duración (min) <span style={{ color: '#f87171' }}>*</span></label>
                  <input
                    type="number" min={5} max={480} className="input"
                    value={form.duration}
                    onChange={(e) => set('duration', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Precio ($)</label>
                  <input
                    type="number" min={0} step={0.01} className="input"
                    placeholder="Opcional"
                    value={form.price}
                    onChange={(e) => set('price', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Descripción</label>
                <textarea
                  rows={3} maxLength={500} className="input resize-none"
                  placeholder="Descripción corta visible para los clientes…"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              </div>

              {/* Color picker */}
              <div>
                <label className="label">Color</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c} type="button" onClick={() => set('color', c)}
                      className={cn(
                        'w-7 h-7 rounded-md transition-all',
                        form.color === c ? 'ring-2 ring-offset-2 ring-offset-[#1e1d1a] scale-110' : 'hover:scale-105',
                      )}
                      style={{
                        backgroundColor: c,
                        ...(form.color === c ? { ringColor: '#c9b162' } : {}),
                      }}
                    />
                  ))}
                  <input
                    type="color" value={form.color}
                    onChange={(e) => set('color', e.target.value)}
                    className="w-7 h-7 rounded-md cursor-pointer"
                    style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                    title="Custom color"
                  />
                  <div
                    className="ml-2 h-7 px-3 rounded-md flex items-center text-white text-sm"
                    style={{ backgroundColor: form.color, fontWeight: 500 }}
                  >
                    {form.name.charAt(0).toUpperCase() || '?'}
                  </div>
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button" role="switch" aria-checked={form.isActive}
                  onClick={() => set('isActive', !form.isActive)}
                  className={cn('toggle')}
                  style={{ background: form.isActive ? '#c9b162' : 'rgba(255,255,255,0.08)' }}
                >
                  <span className={cn('toggle-thumb', form.isActive && 'translate-x-5')} />
                </button>
                <span className="text-sm" style={{ color: '#c5c3c0', fontWeight: 500 }}>
                  {form.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {formError && (
                <div
                  className="rounded-lg p-3 text-sm"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', color: '#f87171' }}
                >
                  {formError}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex gap-3 px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <button type="button" onClick={closeModal} className="btn-secondary flex-1" disabled={saving}>
                Cancelar
              </button>
              <button type="button" onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : editingId
                  ? <><Check className="w-4 h-4" /> Guardar Cambios</>
                  : <><Plus className="w-4 h-4" /> Crear Servicio</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
