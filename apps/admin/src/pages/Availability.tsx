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

const DAYS_OF_WEEK = [
  { id: 1, label: 'Monday' },
  { id: 2, label: 'Tuesday' },
  { id: 3, label: 'Wednesday' },
  { id: 4, label: 'Thursday' },
  { id: 5, label: 'Friday' },
  { id: 6, label: 'Saturday' },
  { id: 0, label: 'Sunday' },
];

const INTERVAL_OPTIONS = [15, 20, 30, 45, 60];

export default function Availability() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ScheduleConfig | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    api.get<ScheduleConfig>('/admin/schedule')
      .then(setConfig)
      .catch((e) => setMessage({ type: 'error', text: e.message }))
      .finally(() => setLoading(false));
  }, []);

  const handleToggleDay = (dayId: number) => {
    if (!config) return;
    const isSelected = config.workDays.includes(dayId);
    let newDays: number[];
    if (isSelected) {
      if (config.workDays.length === 1) return; // Must have at least 1 day
      newDays = config.workDays.filter((d) => d !== dayId);
    } else {
      newDays = [...config.workDays, dayId].sort();
    }
    setConfig({ ...config, workDays: newDays });
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await api.patch<{ config: ScheduleConfig, slotsGenerated: number }>('/admin/schedule', config);
      setConfig(res.config);
      setMessage({ type: 'success', text: `Schedule updated successfully. Regenerated future availability slots.` });
    } catch (e: unknown) {
      setMessage({ type: 'error', text: (e as Error).message });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  if (loading || !config) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#c9b162' }} />
        <p className="mt-4 text-sm" style={{ color: '#a09d98' }}>Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up max-w-4xl">
      <div className="page-header">
        <div>
          <h1 className="page-title">Availability & Schedule</h1>
          <p className="page-subtitle">Configure your business hours, intervals, and capacity</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary gap-2 px-6"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {message && (
        <div className={cn(
          "px-4 py-3 rounded-lg text-sm flex items-center gap-2",
          message.type === 'success' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
        )}>
          {message.text}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Working Days */}
        <div className="card md:col-span-2">
          <div className="card-header border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5">
                <CalendarDays className="w-4 h-4 text-[#c9b162]" />
              </div>
              <div>
                <h3 className="font-medium text-[#f7f7f6]">Working Days</h3>
                <p className="text-xs text-[#a09d98] mt-0.5">Select the days you are open for business.</p>
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
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border",
                      isActive 
                        ? "bg-[#c9b162] text-slate-900 border-[#c9b162] shadow-lg shadow-[#c9b162]/20" 
                        : "bg-transparent text-[#a09d98] border-white/10 hover:border-white/20 hover:bg-white/5"
                    )}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Business Hours */}
        <div className="card">
          <div className="card-header border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5">
                <Clock className="w-4 h-4 text-[#c9b162]" />
              </div>
              <div>
                <h3 className="font-medium text-[#f7f7f6]">Business Hours</h3>
                <p className="text-xs text-[#a09d98] mt-0.5">Daily opening and closing times.</p>
              </div>
            </div>
          </div>
          <div className="card-body py-5 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#a09d98] mb-1.5 uppercase tracking-wider">Opening Time</label>
                <input
                  type="time"
                  value={config.startTime}
                  onChange={(e) => setConfig({ ...config, startTime: e.target.value })}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#a09d98] mb-1.5 uppercase tracking-wider">Closing Time</label>
                <input
                  type="time"
                  value={config.endTime}
                  onChange={(e) => setConfig({ ...config, endTime: e.target.value })}
                  className="input w-full"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <h4 className="text-sm font-medium text-[#dedddb] mb-4">Break Time (Optional)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#a09d98] mb-1.5 uppercase tracking-wider">Break Start</label>
                  <input
                    type="time"
                    value={config.breakStart || ''}
                    onChange={(e) => setConfig({ ...config, breakStart: e.target.value || null })}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#a09d98] mb-1.5 uppercase tracking-wider">Break End</label>
                  <input
                    type="time"
                    value={config.breakEnd || ''}
                    onChange={(e) => setConfig({ ...config, breakEnd: e.target.value || null })}
                    className="input w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Rules */}
        <div className="card">
          <div className="card-header border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5">
                <Users className="w-4 h-4 text-[#c9b162]" />
              </div>
              <div>
                <h3 className="font-medium text-[#f7f7f6]">Booking Rules</h3>
                <p className="text-xs text-[#a09d98] mt-0.5">Capacity, intervals and booking window.</p>
              </div>
            </div>
          </div>
          <div className="card-body py-5 space-y-5">
            <div>
              <label className="block text-xs font-medium text-[#a09d98] mb-1.5 uppercase tracking-wider">Slot Interval</label>
              <div className="grid grid-cols-5 gap-2">
                {INTERVAL_OPTIONS.map((interval) => (
                  <button
                    key={interval}
                    onClick={() => setConfig({ ...config, intervalMinutes: interval })}
                    className={cn(
                      "py-2 rounded-lg text-xs font-medium transition-all duration-200 border",
                      config.intervalMinutes === interval
                        ? "bg-[#c9b162]/10 text-[#c9b162] border-[#c9b162]/30"
                        : "bg-transparent text-[#a09d98] border-white/10 hover:border-white/20 hover:bg-white/5"
                    )}
                  >
                    {interval}m
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#5e5a55] mt-1.5">How often slots appear (e.g. every 30 mins)</p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div>
                <label className="block text-xs font-medium text-[#a09d98] mb-1.5 uppercase tracking-wider">Max Capacity</label>
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
                <p className="text-[11px] text-[#5e5a55] mt-1.5">Clients per slot</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#a09d98] mb-1.5 uppercase tracking-wider">Booking Window</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5e5a55]" />
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={config.bookingWindowDays}
                    onChange={(e) => setConfig({ ...config, bookingWindowDays: parseInt(e.target.value) || 60 })}
                    className="input w-full pl-9"
                  />
                </div>
                <p className="text-[11px] text-[#5e5a55] mt-1.5">Days in advance</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
