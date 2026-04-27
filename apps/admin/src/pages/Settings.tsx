import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Edit2, Plus, Trash2, Clock, DollarSign, X, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  name: string;
  duration: number;
  description?: string;
  price?: number;
  color: string;
  isActive: boolean;
}

interface ServiceForm {
  name: string;
  duration: string;
  description: string;
  price: string;
  color: string;
  isActive: boolean;
}

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#0ea5e9', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#14b8a6',
];

const EMPTY_FORM: ServiceForm = {
  name: '',
  duration: '60',
  description: '',
  price: '',
  color: '#6366f1',
  isActive: true,
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

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get<Service[]>('/admin/services');
      setServices(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Focus name input when modal opens
  useEffect(() => {
    if (modalOpen) setTimeout(() => nameRef.current?.focus(), 50);
  }, [modalOpen]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (svc: Service) => {
    setEditingId(svc.id);
    setForm(toForm(svc));
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setFormError('');
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('Name is required.'); return; }
    const dur = parseInt(form.duration);
    if (isNaN(dur) || dur < 5 || dur > 480) { setFormError('Duration must be between 5 and 480 minutes.'); return; }
    const price = form.price.trim() ? parseFloat(form.price) : undefined;
    if (price !== undefined && (isNaN(price) || price <= 0)) { setFormError('Price must be a positive number.'); return; }

    setSaving(true);
    setFormError('');
    const payload = {
      name: form.name.trim(),
      duration: dur,
      description: form.description.trim() || undefined,
      price,
      color: form.color,
      isActive: form.isActive,
    };

    try {
      if (editingId) {
        const updated = await api.patch<Service>(`/admin/services?id=${editingId}`, payload);
        // Optimistic update in-place
        setServices((prev) => prev.map((s) => (s.id === editingId ? updated : s)));
      } else {
        const created = await api.post<Service>('/admin/services', payload);
        setServices((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      }
      closeModal();
    } catch (e: unknown) {
      setFormError((e as Error).message ?? 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    // Optimistic update immediately
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, isActive: !current } : s)),
    );
    try {
      await api.patch<Service>(`/admin/services?id=${id}`, { isActive: !current });
    } catch (e: unknown) {
      // Rollback on error
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive: current } : s)),
      );
      alert((e as Error).message);
    }
  };

  const set = (field: keyof ServiceForm, value: string | boolean) =>
    setForm((f) => ({ ...f, [field]: value }));

  return (
    <>
      {/* ── Main page ──────────────────────────────────────────────── */}
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-500 text-sm">Manage services and general configuration</p>
        </div>

        <div className="card">
          <div className="card-body border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-lg text-slate-900">Services Configuration</h2>
            <button className="btn-primary btn-sm flex items-center gap-1.5" onClick={openCreate}>
              <Plus className="w-4 h-4" /> New Service
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-slate-400">Loading...</div>
            ) : services.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                No services configured.{' '}
                <button className="text-brand-600 font-semibold hover:underline" onClick={openCreate}>
                  Add one now.
                </button>
              </div>
            ) : (
              services.map((svc) => (
                <div
                  key={svc.id}
                  className={cn(
                    'p-6 flex flex-col sm:flex-row gap-4 justify-between transition-opacity duration-200',
                    !svc.isActive && 'opacity-60 grayscale',
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm"
                      style={{ backgroundColor: svc.color }}
                    >
                      {svc.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        {svc.name}
                        {!svc.isActive && <span className="badge badge-rejected">Inactive</span>}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1 max-w-lg">
                        {svc.description || 'No description provided.'}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-xs font-semibold text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> {svc.duration} minutes
                        </span>
                        {svc.price != null && (
                          <span className="flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-slate-400" /> ${svc.price}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-start">
                    <button
                      onClick={() => openEdit(svc)}
                      className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(svc.id, svc.isActive)}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        svc.isActive
                          ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                          : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50',
                      )}
                      title={svc.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {svc.isActive ? <Trash2 className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Modal ──────────────────────────────────────────────────── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

          {/* Panel */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? 'Edit Service' : 'New Service'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={nameRef}
                  type="text"
                  maxLength={80}
                  className="input"
                  placeholder="e.g. Deep Tissue Massage"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                />
              </div>

              {/* Duration + Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Duration (min) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={480}
                    className="input"
                    value={form.duration}
                    onChange={(e) => set('duration', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Price ($)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className="input"
                    placeholder="Optional"
                    value={form.price}
                    onChange={(e) => set('price', e.target.value)}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                <textarea
                  rows={3}
                  maxLength={500}
                  className="input resize-none"
                  placeholder="Short description visible to clients..."
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set('color', c)}
                      className={cn(
                        'w-8 h-8 rounded-lg transition-all',
                        form.color === c ? 'ring-2 ring-offset-2 ring-slate-600 scale-110' : 'hover:scale-105',
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  {/* Custom hex */}
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => set('color', e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                    title="Custom color"
                  />
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.isActive}
                  onClick={() => set('isActive', !form.isActive)}
                  className={cn(
                    'relative w-11 h-6 rounded-full transition-colors',
                    form.isActive ? 'bg-brand-600' : 'bg-slate-200',
                  )}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                      form.isActive && 'translate-x-5',
                    )}
                  />
                </button>
                <span className="text-sm font-medium text-slate-700">Active</span>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                  {formError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
              <button
                type="button"
                onClick={closeModal}
                className="btn-secondary flex-1"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex-1"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Save Changes' : 'Create Service'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
