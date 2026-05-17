import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Clock, CalendarDays, Users, Save, Loader2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduleConfig {
  workDays: number[];
  startTime: string;
  endTime: string;
  intervalMinutes: number;
  maxCapacity: number;
  bookingWindowDays: number;
  breakStart?: string | null;
  breakEnd?: string | null;
}

// All days ordered Mon–Sun for display
const DAYS_OF_WEEK = [
  { id: 1, label: 'Lunes' },
  { id: 2, label: 'Martes' },
  { id: 3, label: 'Miércoles' },
  { id: 4, label: 'Jueves' },
  { id: 5, label: 'Viernes' },
  { id: 6, label: 'Sábado' },
  { id: 0, label: 'Domingo' },
];

const INTERVAL_OPTIONS = [15, 20, 30, 45, 60];

export default function Availability() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ScheduleConfig | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api.get<ScheduleConfig>('/admin/schedule')
      .then(setConfig)
      .catch((e) => setMessage({ type: 'error', text: e.message }))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleDay = (dayId: number) => {
    if (!config) return;
    const isSelected = config.workDays.includes(dayId);
    if (isSelected && config.workDays.length === 1) return; // mínimo 1 día
    const newDays = isSelected
      ? config.workDays.filter((d) => d !== dayId)
      : [...config.workDays, dayId].sort((a, b) => a - b);
    setConfig({ ...config, workDays: newDays });
  };

  const validate = (): string | null => {
    if (!config) return 'Sin configuración';
    const [sh, sm] = config.startTime.split(':').map(Number);
    const [eh, em] = config.endTime.split(':').map(Number);
    if (eh * 60 + em <= sh * 60 + sm) return 'La hora de cierre debe ser posterior a la hora de apertura.';
    if (config.breakStart && config.breakEnd) {
      const [bsh, bsm] = config.breakStart.split(':').map(Number);
      const [beh, bem] = config.breakEnd.split(':').map(Number);
      if (beh * 60 + bem <= bsh * 60 + bsm) return 'El fin del descanso debe ser posterior al inicio.';
    }
    if (config.maxCapacity < 1 || config.maxCapacity > 50) return 'La capacidad debe estar entre 1 y 50.';
    if (config.bookingWindowDays < 1 || config.bookingWindowDays > 365) return 'La ventana de reserva debe estar entre 1 y 365 días.';
    return null;
  };

  const handleSave = async () => {
    if (!config) return;
    const validationError = validate();
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      // CRÍTICO: El backend sólo admite PUT (no PATCH) — esto corrige el error "Method Not Allowed"
      const res = await api.put<{ config: ScheduleConfig; slotsGenerated: number }>('/admin/schedule', config);
      setConfig(res.config);
      setMessage({
        type: 'success',
        text: `Configuración guardada correctamente. Se regeneraron ${res.slotsGenerated} slots de disponibilidad futura.`,
      });
    } catch (e: unknown) {
      setMessage({ type: 'error', text: (e as Error).message });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 6000);
    }
  };

  if (loading || !config) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#c9b162' }} />
        <p className="mt-4 text-sm" style={{ color: '#a09d98' }}>Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up max-w-4xl">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Disponibilidad y Horarios</h1>
          <p className="page-subtitle">Configura tus días de atención, horarios, intervalos y capacidad</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary gap-2 px-6">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>

      {/* Feedback message */}
      {message && (
        <div
          className={cn(
            'px-4 py-3 rounded-lg text-sm flex items-center gap-2',
            message.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20',
          )}
        >
          {message.text}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* ── Días laborables ────────────────────────────────────────── */}
        <div className="card md:col-span-2">
          <div className="card-header border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5">
                <CalendarDays className="w-4 h-4 text-[#c9b162]" />
              </div>
              <div>
                <h3 className="font-medium text-[#f7f7f6]">Días de Atención</h3>
                <p className="text-xs text-[#a09d98] mt-0.5">
                  Selecciona los días en que atiendes clientes. Los días desactivados no aparecerán en el sitio web.
                </p>
              </div>
            </div>
          </div>
          <div className="card-body py-5">
            <div className="flex flex-wrap gap-3">
              {DAYS_OF_WEEK.map((day) => {
                const isActive = config.workDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    onClick={() => handleToggleDay(day.id)}
                    title={isActive ? 'Clic para desactivar este día' : 'Clic para activar este día'}
                    className={cn(
                      'px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border',
                      isActive
                        ? 'bg-[#c9b162] text-slate-900 border-[#c9b162] shadow-lg shadow-[#c9b162]/20'
                        : 'bg-transparent text-[#a09d98] border-white/10 hover:border-white/20 hover:bg-white/5',
                    )}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#5e5a55] mt-3">
              {config.workDays.length} día{config.workDays.length !== 1 ? 's' : ''} activo
              {config.workDays.length !== 1 ? 's' : ''}. Se requiere al menos 1 día.
            </p>
          </div>
        </div>

        {/* ── Horario de atención ─────────────────────────────────────── */}
        <div className="card">
          <div className="card-header border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5">
                <Clock className="w-4 h-4 text-[#c9b162]" />
              </div>
              <div>
                <h3 className="font-medium text-[#f7f7f6]">Horario de Atención</h3>
                <p className="text-xs text-[#a09d98] mt-0.5">Hora de apertura y cierre diaria.</p>
              </div>
            </div>
          </div>
          <div className="card-body py-5 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#a09d98] mb-1.5 uppercase tracking-wider">
                  Apertura
                </label>
                <input
                  type="time"
                  value={config.startTime}
                  onChange={(e) => setConfig({ ...config, startTime: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#a09d98] mb-1.5 uppercase tracking-wider">
                  Cierre
                </label>
                <input
                  type="time"
                  value={config.endTime}
                  onChange={(e) => setConfig({ ...config, endTime: e.target.value })}
                  className="input w-full"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <h4 className="text-sm font-medium text-[#dedddb] mb-4">Descanso / Almuerzo (opcional)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#a09d98] mb-1.5 uppercase tracking-wider">
                    Inicio descanso
                  </label>
                  <input
                    type="time"
                    value={config.breakStart || ''}
                    onChange={(e) => setConfig({ ...config, breakStart: e.target.value || null })}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#a09d98] mb-1.5 uppercase tracking-wider">
                    Fin descanso
                  </label>
                  <input
                    type="time"
                    value={config.breakEnd || ''}
                    onChange={(e) => setConfig({ ...config, breakEnd: e.target.value || null })}
                    className="input w-full"
                  />
                </div>
              </div>
              <p className="text-[11px] text-[#5e5a55] mt-2">
                Los horarios de descanso no estarán disponibles para reservar.
              </p>
            </div>
          </div>
        </div>

        {/* ── Reglas de reserva ──────────────────────────────────────── */}
        <div className="card">
          <div className="card-header border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5">
                <Users className="w-4 h-4 text-[#c9b162]" />
              </div>
              <div>
                <h3 className="font-medium text-[#f7f7f6]">Reglas de Reserva</h3>
                <p className="text-xs text-[#a09d98] mt-0.5">Capacidad, intervalos y ventana de reserva.</p>
              </div>
            </div>
          </div>
          <div className="card-body py-5 space-y-5">
            <div>
              <label className="block text-xs font-medium text-[#a09d98] mb-1.5 uppercase tracking-wider">
                Intervalo entre Citas
              </label>
              <div className="grid grid-cols-5 gap-2">
                {INTERVAL_OPTIONS.map((interval) => (
                  <button
                    key={interval}
                    onClick={() => setConfig({ ...config, intervalMinutes: interval })}
                    className={cn(
                      'py-2 rounded-lg text-xs font-medium transition-all duration-200 border',
                      config.intervalMinutes === interval
                        ? 'bg-[#c9b162]/10 text-[#c9b162] border-[#c9b162]/30'
                        : 'bg-transparent text-[#a09d98] border-white/10 hover:border-white/20 hover:bg-white/5',
                    )}
                  >
                    {interval}min
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#5e5a55] mt-1.5">
                Cada cuántos minutos aparece un horario disponible.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div>
                <label className="block text-xs font-medium text-[#a09d98] mb-1.5 uppercase tracking-wider">
                  Capacidad Máxima
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5e5a55]" />
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={config.maxCapacity}
                    onChange={(e) => setConfig({ ...config, maxCapacity: parseInt(e.target.value) || 1 })}
                    className="input w-full pl-9"
                  />
                </div>
                <p className="text-[11px] text-[#5e5a55] mt-1.5">Clientes por slot</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#a09d98] mb-1.5 uppercase tracking-wider">
                  Ventana de Reserva
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5e5a55]" />
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={config.bookingWindowDays}
                    onChange={(e) =>
                      setConfig({ ...config, bookingWindowDays: parseInt(e.target.value) || 60 })
                    }
                    className="input w-full pl-9"
                  />
                </div>
                <p className="text-[11px] text-[#5e5a55] mt-1.5">Días de anticipación permitidos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
