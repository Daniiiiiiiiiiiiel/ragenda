import { useEffect, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { formatDateLocal } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import {
  Calendar, Users, XCircle, Clock,
  TrendingUp, TrendingDown, ArrowUpRight,
} from 'lucide-react';

interface KPIData {
  total: number;
  pending: number;
  accepted: number;
  cancelled: number;
  cancellationRate: number;
  totalClients: number;
}

interface RecentAppointment {
  id: string;
  createdAt: string;
  user: { name: string; email: string };
  service: { name: string; color: string };
}

interface ChartData {
  dailyCounts: { date: string; count: number }[];
  byDayOfWeek: { day: string; count: number }[];
  byService: { name: string; count: number }[];
}

const CHART_COLORS = ['#c9b162', '#a3843a', '#7c7872', '#5e5a55', '#dccb8a', '#866a31'];

const ACTIVE_DOT = { r: 5, fill: '#c9b162', stroke: '#121110', strokeWidth: 2 };

// Custom Tooltip
function CustomTooltip({ active, payload, label, formatter }: {
  active?: boolean; payload?: { value: number }[]; label?: string;
  formatter?: (v: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-4 py-3 text-sm"
      style={{
        background: '#1e1d1a',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}
    >
      <p className="mb-1 text-xs" style={{ color: '#5e5a55' }}>
        {formatter ? formatter(label ?? '') : label}
      </p>
      <p className="font-medium" style={{ color: '#f7f7f6' }}>
        {payload[0].value} appointments
      </p>
    </div>
  );
}

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [recent, setRecent] = useState<RecentAppointment[]>([]);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ kpis: KPIData; recent: RecentAppointment[] }>('/admin/stats/overview'),
      api.get<ChartData>('/admin/stats/charts'),
    ]).then(([overview, chartsData]) => {
      setKpis(overview.kpis);
      setRecent(overview.recent);
      setCharts(chartsData);
      setLoading(false);
    }).catch(console.error);
  }, []);

  if (loading || !kpis || !charts) return (
    <div className="flex justify-center items-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-9 h-9 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'rgba(201,177,98,0.3)', borderTopColor: 'transparent' }}
        />
        <p className="text-sm" style={{ color: '#5e5a55' }}>Loading data…</p>
      </div>
    </div>
  );

  const acceptanceRate = kpis.total > 0
    ? Math.round((kpis.accepted / kpis.total) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-slide-up">

      {/* Welcome banner */}
      <div
        className="rounded-xl p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1a1918 0%, #1e1d1a 50%, #1a1918 100%)',
          border: '1px solid rgba(201,177,98,0.1)',
        }}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 30%, rgba(201,177,98,0.12) 0%, transparent 50%)' }}
        />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm mb-1" style={{ color: '#5e5a55', fontWeight: 400 }}>Welcome back</p>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '1.75rem',
                fontWeight: 500,
                color: '#f7f7f6',
              }}
            >
              Dashboard Overview
            </h2>
            <p className="text-sm mt-1" style={{ color: '#7c7872' }}>
              Here's what's happening with your appointments.
            </p>
          </div>
          <div className="flex gap-3">
            {[
              { label: 'Total', value: kpis.total },
              { label: 'Pending', value: kpis.pending },
              { label: 'Accepted', value: `${acceptanceRate}%` },
            ].map((item) => (
              <div
                key={item.label}
                className="glass rounded-lg px-4 py-3 text-center min-w-[80px]"
              >
                <p className="text-xl font-medium" style={{ color: '#f7f7f6' }}>{item.value}</p>
                <p className="text-xs mt-0.5" style={{ color: '#5e5a55' }}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <StatCard
          title="Total Bookings" value={kpis.total}
          trend={{ label: 'This month', up: true }}
          icon={<Calendar className="w-4 h-4" />} color="gold"
        />
        <StatCard
          title="Pending" value={kpis.pending}
          trend={{ label: 'Requires action', up: false }}
          icon={<Clock className="w-4 h-4" />} color="amber"
        />
        <StatCard
          title="Total Clients" value={kpis.totalClients}
          trend={{ label: 'All time', up: true }}
          icon={<Users className="w-4 h-4" />} color="green"
        />
        <StatCard
          title="Cancellation Rate" value={`${kpis.cancellationRate}%`}
          trend={{ label: `${kpis.cancelled} cancelled`, up: false }}
          icon={<XCircle className="w-4 h-4" />} color="red"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Area chart */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <div>
              <h3 className="font-medium" style={{ fontSize: '1.1rem' }}>Appointments Trend</h3>
              <p className="text-xs mt-0.5" style={{ color: '#5e5a55' }}>Last 30 days</p>
            </div>
            <span className="badge" style={{ background: 'rgba(201,177,98,0.08)', color: '#c9b162', border: '1px solid rgba(201,177,98,0.15)' }}>
              <TrendingUp className="w-3 h-3" /> Live
            </span>
          </div>
          <div className="card-body pt-2">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.dailyCounts} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#c9b162" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#c9b162" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => v.split('-').slice(1).join('/')}
                    stroke="#48453f" fontSize={10} tickLine={false} axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis stroke="#48453f" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    content={<CustomTooltip formatter={(v) => formatDateLocal(v)} />}
                    cursor={{ stroke: '#c9b162', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone" dataKey="count" stroke="#c9b162" strokeWidth={1.5}
                    fill="url(#areaGrad)" dot={false} activeDot={ACTIVE_DOT}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Donut */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="font-medium" style={{ fontSize: '1.1rem' }}>By Service</h3>
              <p className="text-xs mt-0.5" style={{ color: '#5e5a55' }}>Distribution</p>
            </div>
          </div>
          <div className="card-body pt-2">
            {charts.byService.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm" style={{ color: '#5e5a55' }}>No data yet</div>
            ) : (
              <>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.byService} innerRadius={50} outerRadius={68}
                        paddingAngle={3} dataKey="count" nameKey="name" strokeWidth={0}
                      >
                        {charts.byService.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)',
                          background: '#1e1d1a', fontSize: 12, color: '#c5c3c0',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                        }}
                        itemStyle={{ color: '#f7f7f6' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-2">
                  {charts.byService.slice(0, 5).map((s, i) => (
                    <div key={s.name} className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="flex-1 truncate" style={{ color: '#a09d98' }}>{s.name}</span>
                      <span className="font-medium" style={{ color: '#dedddb' }}>{s.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Bar chart */}
        <div className="card lg:col-span-2">
          <div className="card-header">
            <div>
              <h3 className="font-medium" style={{ fontSize: '1.1rem' }}>By Day of Week</h3>
              <p className="text-xs mt-0.5" style={{ color: '#5e5a55' }}>Appointment distribution</p>
            </div>
          </div>
          <div className="card-body pt-2">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.byDayOfWeek} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#c9b162" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#a3843a" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" stroke="#48453f" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#48453f" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.02)', radius: 6 }}
                    contentStyle={{
                      borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)',
                      background: '#1e1d1a', fontSize: 12, color: '#c5c3c0',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    }}
                  />
                  <Bar dataKey="count" fill="url(#barGrad)" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent bookings */}
        <div className="card">
          <div className="card-header">
            <h3 className="font-medium" style={{ fontSize: '1.1rem' }}>Recent Bookings</h3>
            <ArrowUpRight className="w-4 h-4" style={{ color: '#48453f' }} />
          </div>
          <div className="card-body pt-2">
            <div className="space-y-2">
              {recent.length === 0 ? (
                <p className="text-sm text-center py-6" style={{ color: '#5e5a55' }}>No recent bookings</p>
              ) : (
                recent.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 py-2.5"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                      style={{
                        backgroundColor: a.service.color || '#c9b162',
                        color: '#fff',
                        fontWeight: 500,
                        fontSize: '0.75rem',
                      }}
                    >
                      {a.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm truncate" style={{ color: '#dedddb', fontWeight: 500 }}>{a.user.name}</p>
                      <p className="text-xs truncate" style={{ color: '#5e5a55' }}>{a.service.name}</p>
                    </div>
                    <div className="text-xs shrink-0" style={{ color: '#48453f', fontWeight: 500 }}>
                      {formatDateLocal(a.createdAt).slice(0, 6)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── StatCard ──────────────────────────────────────────────────────── */
type ColorKey = 'gold' | 'amber' | 'green' | 'red';

const colorMap: Record<ColorKey, { bg: string; icon: string; accent: string }> = {
  gold:  { bg: 'rgba(201,177,98,0.06)',  icon: '#c9b162', accent: 'rgba(201,177,98,0.12)' },
  amber: { bg: 'rgba(245,158,11,0.06)',  icon: '#f5c842', accent: 'rgba(245,158,11,0.12)' },
  green: { bg: 'rgba(16,185,129,0.06)',  icon: '#4ade80', accent: 'rgba(16,185,129,0.12)' },
  red:   { bg: 'rgba(239,68,68,0.06)',   icon: '#f87171', accent: 'rgba(239,68,68,0.12)' },
};

function StatCard({
  title, value, trend, icon, color,
}: {
  title: string;
  value: string | number;
  trend: { label: string; up: boolean };
  icon: ReactNode;
  color: ColorKey;
}) {
  const c = colorMap[color];
  return (
    <div className="card p-5 relative overflow-hidden animate-slide-up transition-all duration-200 hover:-translate-y-0.5" style={{ cursor: 'default' }}>
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-8 translate-x-8" style={{ background: c.accent }} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: '#5e5a55', fontWeight: 600, letterSpacing: '0.08em' }}>{title}</p>
          <p className="text-2xl tracking-tight" style={{ color: '#f7f7f6', fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 500 }}>{value}</p>
          <div className={`flex items-center gap-1.5 mt-2 text-xs`} style={{ color: trend.up ? '#4ade80' : '#5e5a55', fontWeight: 500 }}>
            {trend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.label}
          </div>
        </div>
        <div className="p-2.5 rounded-lg flex-shrink-0" style={{ background: c.bg, color: c.icon }}>
          {icon}
        </div>
      </div>
    </div>
  );
}
