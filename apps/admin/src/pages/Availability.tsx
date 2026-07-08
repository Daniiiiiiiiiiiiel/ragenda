import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDateLocal, cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Ban, Settings2, Loader2 } from 'lucide-react';

interface Slot {
  id: string; date: string; time: string; maxCapacity: number; currentBookings: number; isBlocked: boolean;
}

export default function Availability() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [blockingDate, setBlockingDate] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const m = format(currentMonth, 'yyyy-MM');
      const data = await api.get<Slot[]>(`/admin/availability?month=${m}`);
      setSlots(data);
    } finally { setLoading(false); }
  }, [currentMonth]);

  useEffect(() => { load(); }, [load]);

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });

  const getDayStatus = (d: Date) => {
    const dStr = format(d, 'yyyy-MM-dd');
    const daySlots = slots.filter((s) => s.date.startsWith(dStr));
    if (daySlots.length === 0) return 'empty';
    if (daySlots.every((s) => s.isBlocked)) return 'blocked';
    
    const hasBookings = daySlots.some(s => s.currentBookings > 0);
    return hasBookings ? 'booked' : 'active';
  };

  const handleBlockDay = async (date: Date, isBlocked: boolean) => {
    const dStr = format(date, 'yyyy-MM-dd');
    if (!confirm(`Are you sure you want to ${isBlocked ? 'block' : 'unblock'} ${dStr}?`)) return;

    setBlockingDate(dStr);

    // Optimistic update — flip all slots for that day
    setSlots((prev) =>
      prev.map((s) => (s.date.startsWith(dStr) ? { ...s, isBlocked } : s)),
    );

    try {
      await api.patch('/admin/availability', { date: dStr, isBlocked });
    } catch (e: unknown) {
      // Rollback on error
      setSlots((prev) =>
        prev.map((s) => (s.date.startsWith(dStr) ? { ...s, isBlocked: !isBlocked } : s)),
      );
      alert((e as Error).message);
    } finally {
      setBlockingDate(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Availability</h1>
        <p className="text-slate-500 text-sm">Manage schedule, capacity, and block days</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-lg flex items-center gap-2">
              {format(currentMonth, 'MMMM yyyy')}
              {loading && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 border rounded-lg hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 border rounded-lg hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-slate-400 py-2">{d}</div>
            ))}

            {/* Offset first day */}
            {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {days.map((day) => {
              const status = getDayStatus(day);
              const isSelected = selectedDate && format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'h-20 border rounded-xl p-2 flex flex-col items-start transition-all',
                    isSelected ? 'ring-2 ring-brand-500 border-transparent bg-brand-50' : 'hover:border-brand-300',
                    status === 'blocked' && 'bg-red-50 border-red-100',
                    status === 'empty' && 'bg-slate-50 opacity-50',
                  )}
                >
                  <span className={cn('text-sm font-semibold', status === 'blocked' && 'text-red-600', status === 'booked' && 'text-brand-700')}>
                    {format(day, 'd')}
                  </span>
                  {status === 'blocked' && <Ban className="w-4 h-4 text-red-400 mt-auto mx-auto" />}
                  {status === 'active' && <div className="w-2 h-2 rounded-full bg-emerald-400 mt-auto" />}
                  {status === 'booked' && (
                    <div className="mt-auto flex items-center justify-center w-full">
                       <span className="bg-brand-100 text-brand-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap overflow-hidden">
                         Booked
                       </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day detail panel */}
        <div>
          {selectedDate ? (
            <div className="card p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg">{formatDateLocal(selectedDate)}</h3>
                {getDayStatus(selectedDate) === 'blocked' ? (
                  <button
                    onClick={() => handleBlockDay(selectedDate, false)}
                    disabled={blockingDate === format(selectedDate, 'yyyy-MM-dd')}
                    className="btn-secondary btn-sm text-emerald-600 disabled:opacity-50"
                  >
                    {blockingDate ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Unblock Day'}
                  </button>
                ) : getDayStatus(selectedDate) === 'active' ? (
                  <button
                    onClick={() => handleBlockDay(selectedDate, true)}
                    disabled={blockingDate === format(selectedDate, 'yyyy-MM-dd')}
                    className="btn-secondary btn-sm text-red-600 disabled:opacity-50"
                  >
                    {blockingDate ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Block Day'}
                  </button>
                ) : null}
              </div>

              <div className="space-y-3">
                {slots.filter((s) => s.date.startsWith(format(selectedDate, 'yyyy-MM-dd'))).length === 0 ? (
                  <p className="text-sm text-slate-500">No slots configured for this day.</p>
                ) : (
                  slots
                    .filter((s) => s.date.startsWith(format(selectedDate, 'yyyy-MM-dd')))
                    .map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-3 border border-slate-100 rounded-lg bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-700">{slot.time}</span>
                          {slot.isBlocked && <span className="badge badge-rejected">Blocked</span>}
                        </div>
                        <div className={cn(
                          "text-xs font-semibold px-2 py-1 rounded-lg",
                          slot.currentBookings > 0 
                            ? slot.currentBookings >= slot.maxCapacity 
                              ? "bg-red-100 text-red-700" 
                              : "bg-amber-100 text-amber-700"
                            : "text-slate-500"
                        )}>
                          {slot.currentBookings} / {slot.maxCapacity} booked
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          ) : (
            <div className="card p-6 text-center text-slate-500 flex flex-col items-center justify-center h-full min-h-[300px]">
              <Settings2 className="w-8 h-8 mb-3 text-slate-300" />
              <p>Select a date to view or modify its availability.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
