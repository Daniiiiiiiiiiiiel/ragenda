import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { Calendar, Clock, Package, Plus, AlertTriangle } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';
import i18n from '@/i18n';

interface Appointment {
  id: string;
  date: string;
  timeSlot: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  notes?: string;
  adminNotes?: string;
  service: { id: string; name: string; duration: number; color: string };
  createdAt: string;
}

export default function Portal() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get<Appointment[]>('/appointments/my');
      setAppointments(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async () => {
    if (!cancelId) return;
    setCancelling(true);
    try {
      await api.patch(`/appointments/${cancelId}/cancel`);
      setAppointments((prev) =>
        prev.map((a) => (a.id === cancelId ? { ...a, status: 'CANCELLED' as const } : a)),
      );
      setCancelId(null);
    } catch (e: unknown) {
      alert((e as Error).message);
    } finally {
      setCancelling(false);
    }
  };

  const upcoming = appointments.filter((a) => ['PENDING', 'ACCEPTED'].includes(a.status));
  const past     = appointments.filter((a) => ['REJECTED', 'CANCELLED'].includes(a.status));

  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="page-container py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900">
              {t('portal.title')}
            </h1>
            <p className="text-slate-500 mt-1">
              {i18n.language.startsWith('es') ? `Hola, ${user?.name}` : `Hello, ${user?.name}`}
            </p>
          </div>
          <Link to="/agendar">
            <Button icon={<Plus className="w-4 h-4" />}>{t('portal.bookNow')}</Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : appointments.length === 0 ? (
          <div className="card text-center py-16 animate-fade-in">
            <Calendar className="w-14 h-14 text-slate-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-700 mb-2">{t('portal.empty')}</h2>
            <p className="text-slate-400 mb-6">{t('portal.emptyDesc')}</p>
            <Link to="/agendar"><Button>{t('portal.bookNow')}</Button></Link>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                  {i18n.language.startsWith('es') ? 'Próximas' : 'Upcoming'}
                </h2>
                <div className="space-y-4">
                  {upcoming.map((a) => (
                    <AppointmentCard
                      key={a.id}
                      appointment={a}
                      onCancel={() => setCancelId(a.id)}
                      t={t}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Past */}
            {past.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                  {i18n.language.startsWith('es') ? 'Historial' : 'History'}
                </h2>
                <div className="space-y-4 opacity-75">
                  {past.map((a) => (
                    <AppointmentCard key={a.id} appointment={a} t={t} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* Cancel modal */}
      <Modal open={!!cancelId} onClose={() => setCancelId(null)} title={t('portal.confirmCancel')}>
        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-slate-600 text-sm">{t('portal.confirmCancelDesc')}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setCancelId(null)}>
            {t('portal.keepIt')}
          </Button>
          <Button variant="danger" className="flex-1" loading={cancelling} onClick={handleCancel}>
            {cancelling ? t('portal.cancelling') : t('portal.confirm')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function AppointmentCard({
  appointment: a,
  onCancel,
  t,
}: {
  appointment: Appointment;
  onCancel?: () => void;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  return (
    <div className="card hover:shadow-md transition-shadow animate-slide-up">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        {/* Service color indicator */}
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
            style={{ backgroundColor: a.service.color }}
          >
            {a.service.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-1">{a.service.name}</h3>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(a.date, i18n.language)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {formatTime(a.timeSlot)}
              </span>
              <span className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" />
                {a.service.duration} min
              </span>
            </div>
            {a.notes && (
              <p className="text-xs text-slate-400 mt-2 italic">"{a.notes}"</p>
            )}
            {a.adminNotes && a.status === 'REJECTED' && (
              <div className="mt-2 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5 text-xs text-red-700">
                <strong>Note:</strong> {a.adminNotes}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 ml-auto">
          <StatusBadge status={a.status} label={t(`status.${a.status}`)} />
          {a.status === 'PENDING' && onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel} className="text-red-500 hover:bg-red-50">
              {t('portal.cancel')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
