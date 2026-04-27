import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { cn, formatDate, formatTime } from '@/lib/utils';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isToday, isBefore,
  startOfDay, isSameDay, addMonths, subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Clock, Check, Calendar } from 'lucide-react';
import i18n from '@/i18n';
import { getDateLocale } from '@/lib/utils';

interface Service { id: string; name: string; duration: number; description?: string; price?: number; color: string; }
interface Slot { id: string; date: string; time: string; availableCount: number; isAvailable: boolean; isBlocked: boolean; }

type Step = 'service' | 'date' | 'time' | 'confirm';

export default function BookAppointment() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const locale = getDateLocale(i18n.language);

  const [step, setStep] = useState<Step>('service');
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [monthSlots, setMonthSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Service[]>('/services').then(setServices).catch(() => {});
  }, []);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { locale });
    const gridEnd = endOfWeek(monthEnd, { locale });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth, locale]);

  useEffect(() => {
    const loadMonthSlots = async () => {
      setSlotsLoading(true);
      try {
        const m = format(currentMonth, 'yyyy-MM');
        const data = await api.get<Slot[]>(`/slots/available?month=${m}`);
        setMonthSlots(data);
      } catch {
        setMonthSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    };
    loadMonthSlots();
  }, [currentMonth]);

  const handleSelectDate = (day: Date) => {
    if (isBefore(startOfDay(day), startOfDay(new Date()))) return;
    setSelectedDate(day);
    setSelectedSlot(null);
    setStep('time');
  };

  const handleConfirm = async () => {
    if (!selectedService || !selectedDate || !selectedSlot) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post('/appointments/create', {
        serviceId: selectedService.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        timeSlot: selectedSlot.time,
        notes: notes.trim() || undefined,
      });
      setSuccess(true);
    } catch (e: unknown) {
      setError((e as Error).message ?? t('errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 pt-16 px-4">
        <div className="text-center animate-slide-up max-w-md">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">{t('booking.success')}</h1>
          <p className="text-slate-500 mb-8">{t('booking.successDesc')}</p>
          <Button onClick={() => navigate('/portal')} size="lg">
            {t('booking.goToPortal')}
          </Button>
        </div>
      </div>
    );
  }

  const steps: { key: Step; label: string }[] = [
    { key: 'service', label: t('booking.selectService') },
    { key: 'date',    label: t('booking.selectDate') },
    { key: 'time',    label: t('booking.selectTime') },
    { key: 'confirm', label: t('booking.summary') },
  ];

  const stepIdx = steps.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="page-container py-10 max-w-4xl">
        <h1 className="text-3xl font-black text-slate-900 mb-8">{t('booking.title')}</h1>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-10 flex-wrap">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <button
                onClick={() => i < stepIdx && setStep(s.key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all',
                  i === stepIdx && 'bg-brand-600 text-white shadow',
                  i < stepIdx && 'bg-brand-50 text-brand-600 cursor-pointer hover:bg-brand-100',
                  i > stepIdx && 'bg-slate-100 text-slate-400 cursor-not-allowed',
                )}
              >
                <span className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
                  i === stepIdx && 'bg-white/20 text-white',
                  i < stepIdx && 'bg-brand-200 text-brand-700',
                  i > stepIdx && 'bg-slate-200 text-slate-400',
                )}>
                  {i < stepIdx ? <Check className="w-3 h-3" /> : i + 1}
                </span>
                {s.label}
              </button>
              {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300" />}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="animate-fade-in">
          {/* STEP 1: Service */}
          {step === 'service' && (
            <div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => { setSelectedService(svc); setStep('date'); }}
                    className={cn(
                      'card text-left hover:shadow-md hover:-translate-y-0.5 transition-all duration-200',
                      selectedService?.id === svc.id && 'ring-2 ring-brand-500 shadow-md',
                    )}
                  >
                    <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center text-white font-bold" style={{ backgroundColor: svc.color }}>
                      {svc.name.charAt(0)}
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">{svc.name}</h3>
                    {svc.description && <p className="text-xs text-slate-500 mb-3">{svc.description}</p>}
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {t('booking.duration', { min: svc.duration })}</span>
                      {svc.price && <span className="font-semibold text-brand-600">{t('booking.price', { price: svc.price })}</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Date */}
          {step === 'date' && (
            <div className="card max-w-md">
              {/* Month navigation */}
              <div className="flex items-center justify-between mb-6">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="font-bold text-slate-900 capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale })}
                </h2>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                  const isPast     = isBefore(startOfDay(day), startOfDay(new Date()));
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isThisMonth = isSameMonth(day, currentMonth);
                  const isSun     = day.getDay() === 0;

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => !isPast && !isSun && handleSelectDate(day)}
                      disabled={isPast || isSun || !isThisMonth}
                      className={cn(
                        'h-9 w-full rounded-lg text-sm font-medium transition-all duration-150',
                        !isThisMonth && 'opacity-0 pointer-events-none',
                        isThisMonth && !isPast && !isSun && 'hover:bg-brand-50 text-slate-700',
                        isPast && 'text-slate-300 cursor-not-allowed',
                        isSun && 'text-red-300 cursor-not-allowed',
                        isToday(day) && !isSelected && 'bg-brand-50 text-brand-600 font-bold',
                        isSelected && 'bg-brand-600 text-white font-bold shadow-sm',
                      )}
                    >
                      {format(day, 'd')}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Time slot */}
          {step === 'time' && selectedDate && (
            <div>
              <div className="flex items-center gap-2 mb-6 text-slate-600">
                <Calendar className="w-5 h-5" />
                <span className="font-semibold">{formatDate(selectedDate, i18n.language)}</span>
              </div>
              {slotsLoading ? (
                <div className="flex justify-center py-12"><Spinner /></div>
              ) : monthSlots.filter(s => s.date === format(selectedDate, 'yyyy-MM-dd')).length === 0 ? (
                <div className="card text-center py-10">
                  <p className="text-slate-400">{t('booking.noSlots')}</p>
                  <Button variant="secondary" className="mt-4" onClick={() => setStep('date')}>
                    {i18n.language.startsWith('es') ? 'Cambiar fecha' : 'Choose another date'}
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {monthSlots.filter(s => s.date === format(selectedDate, 'yyyy-MM-dd')).map((slot) => (
                      <button
                        key={slot.id}
                        disabled={!slot.isAvailable}
                        onClick={() => { setSelectedSlot(slot); setStep('confirm'); }}
                        className={cn(
                          'py-3 rounded-xl text-sm font-semibold border transition-all duration-150 relative overflow-hidden',
                          !slot.isAvailable && 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed opacity-75',
                          slot.isAvailable && selectedSlot?.id === slot.id
                            ? 'bg-brand-600 text-white border-brand-600 shadow'
                            : slot.isAvailable && 'bg-white text-slate-700 border-slate-200 hover:border-brand-400 hover:text-brand-600',
                        )}
                      >
                        {formatTime(slot.time)}
                        {!slot.isAvailable && (
                           <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50 backdrop-blur-[1px]">
                             <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                               {slot.isBlocked ? 'Blocked' : 'Full'}
                             </span>
                           </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Confirm */}
          {step === 'confirm' && selectedService && selectedDate && selectedSlot && (
            <div className="max-w-lg">
              <div className="card mb-6">
                <h2 className="font-bold text-slate-900 mb-5">{t('booking.summary')}</h2>
                <div className="space-y-4">
                  {[
                    { label: t('portal.service'), value: selectedService.name },
                    { label: t('portal.date'), value: formatDate(selectedDate, i18n.language) },
                    { label: t('portal.time'), value: formatTime(selectedSlot.time) },
                    { label: 'Duration', value: `${selectedService.duration} min` },
                  ].map((r) => (
                    <div key={r.label} className="flex justify-between text-sm py-2 border-b border-slate-100 last:border-0">
                      <span className="text-slate-500 font-medium">{r.label}</span>
                      <span className="font-bold text-slate-900">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{t('booking.notes')}</label>
                <textarea
                  rows={3}
                  maxLength={500}
                  className="input-field resize-none"
                  placeholder={t('booking.notesPlaceholder')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 mb-4">{error}</div>
              )}

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setStep('time')} className="flex-1">
                  {i18n.language.startsWith('es') ? 'Atrás' : 'Back'}
                </Button>
                <Button loading={submitting} onClick={handleConfirm} className="flex-1" size="lg">
                  {submitting ? t('booking.confirming') : t('booking.confirm')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
