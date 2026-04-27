import { useEffect, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { formatDateLocal } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { Calendar, Users, Activity, XCircle, Clock, TrendingUp } from 'lucide-react';

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

const COLORS = ['#6366f1', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPIData | null>(null);
  const [recent, setRecent] = useState<RecentAppointment[]>([]);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ kpis: KPIData; recent: RecentAppointment[] }>('/admin/stats/overview'),
      api.get<ChartData>('/admin/stats/charts')
    ]).then(([overview, chartsData]) => {
      setKpis(overview.kpis);
      setRecent(overview.recent);
      setCharts(chartsData);
      setLoading(false);
    }).catch(console.error);
  }, []);

  if (loading || !kpis || !charts) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500 text-sm">Key metrics for the current month.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Appointments" value={kpis.total} icon={<Calendar className="w-5 h-5 text-brand-600" />} trend="This month" />
        <StatCard title="Pending Requests" value={kpis.pending} icon={<Clock className="w-5 h-5 text-amber-600" />} trend="Requires action" />
        <StatCard title="Total Clients" value={kpis.totalClients} icon={<Users className="w-5 h-5 text-emerald-600" />} trend="All time" />
        <StatCard title="Cancellation Rate" value={`${kpis.cancellationRate}%`} icon={<XCircle className="w-5 h-5 text-red-600" />} trend={`${kpis.cancelled} cancelled`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="card lg:col-span-2">
          <div className="card-body">
            <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" />
              Appointments (Last 30 Days)
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.dailyCounts}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tickFormatter={(v) => v.split('-').slice(1).join('/')} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    labelFormatter={(v) => formatDateLocal(v)}
                  />
                  <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="card">
          <div className="card-body">
            <h3 className="font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              By Service
            </h3>
            <div className="h-64 w-full">
              {charts.byService.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={charts.byService} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="count" nameKey="name">
                      {charts.byService.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-3 justify-center">
              {charts.byService.slice(0, 4).map((s, i) => (
                <div key={s.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {s.name} ({s.count})
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="card lg:col-span-2">
          <div className="card-body">
            <h3 className="font-semibold text-slate-900 mb-6">By Day of Week</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.byDayOfWeek}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Appointments */}
        <div className="card">
          <div className="card-body">
            <h3 className="font-semibold text-slate-900 mb-6">Recent Bookings</h3>
            <div className="space-y-4">
              {recent.length === 0 ? (
                <p className="text-slate-400 text-sm">No recent bookings</p>
              ) : (
                recent.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: a.service.color || '#6366f1' }}>
                      {a.user.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 text-sm truncate">{a.user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{a.service.name}</p>
                    </div>
                    <div className="text-xs text-slate-400 shrink-0">
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

function StatCard({ title, value, icon, trend }: { title: string; value: string | number; icon: ReactNode; trend: string }) {
  return (
    <div className="card">
      <div className="card-body flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-400 mt-2">{trend}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl">{icon}</div>
      </div>
    </div>
  );
}
