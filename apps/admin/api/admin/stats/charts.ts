import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '@ragenda/db';
import { setCors, setSecurityHeaders, ok, err } from '../../_lib/security.js';
import { requireAdmin } from '../../_middleware/adminAuth.js';
import { format, subDays, eachDayOfInterval } from 'date-fns';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);
  if (setCors(req, res)) return;
  if (req.method !== 'GET') return err(res, 'Method not allowed', 405);

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);

  // Fetch only the fields we need for aggregation — avoids loading full records
  const appointments = await prisma.appointment.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: {
      createdAt: true,
      date: true,
      serviceId: true,
      service: { select: { name: true } },
    },
  });

  // Line chart: appointments per day (last 30 days) — built with a date-indexed map
  const days = eachDayOfInterval({ start: thirtyDaysAgo, end: now });
  const countByDay = new Map<string, number>();
  for (const a of appointments) {
    const key = format(new Date(a.createdAt), 'yyyy-MM-dd');
    countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
  }
  const dailyCounts = days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return { date: dateStr, count: countByDay.get(dateStr) ?? 0 };
  });

  // Bar chart: by day of week — use UTC day from stored date column
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dowCounts = new Array(7).fill(0);
  for (const a of appointments) {
    dowCounts[new Date(a.date).getUTCDay()]++;
  }
  const byDayOfWeek = dayNames.map((name, idx) => ({ day: name, count: dowCounts[idx] }));

  // Donut chart: by service — aggregate with a Map
  const serviceMap = new Map<string, { name: string; count: number }>();
  for (const a of appointments) {
    if (!a.service) continue;
    const entry = serviceMap.get(a.serviceId) ?? { name: a.service.name, count: 0 };
    entry.count++;
    serviceMap.set(a.serviceId, entry);
  }
  const byService = Array.from(serviceMap.values()).sort((a, b) => b.count - a.count);

  // Cache for 5 minutes — chart data is not real-time critical
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  return ok(res, { dailyCounts, byDayOfWeek, byService });
}
