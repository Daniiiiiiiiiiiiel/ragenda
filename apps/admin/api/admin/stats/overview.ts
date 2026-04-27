import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '@ragenda/db';
import { setCors, setSecurityHeaders, ok, err } from '../../_lib/security.js';
import { requireAdmin } from '../../_middleware/adminAuth.js';
import { startOfMonth, endOfMonth } from 'date-fns';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);
  if (setCors(req, res)) return;
  if (req.method !== 'GET') return err(res, 'Method not allowed', 405);

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd   = endOfMonth(now);

  const [[total, pending, accepted, cancelled, totalClients], recent] = await Promise.all([
    Promise.all([
      prisma.appointment.count({ where: { date: { gte: monthStart, lte: monthEnd } } }),
      prisma.appointment.count({ where: { status: 'PENDING', date: { gte: monthStart } } }),
      prisma.appointment.count({ where: { status: 'ACCEPTED', date: { gte: monthStart, lte: monthEnd } } }),
      prisma.appointment.count({ where: { status: 'CANCELLED', date: { gte: monthStart, lte: monthEnd } } }),
      prisma.user.count({ where: { role: 'CLIENT' } }),
    ]),
    prisma.appointment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user:    { select: { name: true, email: true } },
        service: { select: { name: true, color: true } },
      },
    }),
  ]);

  const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;

  // Cache for 60 seconds at the CDN / serverless edge
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

  return ok(res, {
    kpis: { total, pending, accepted, cancelled, cancellationRate, totalClients },
    recent,
  });
}
