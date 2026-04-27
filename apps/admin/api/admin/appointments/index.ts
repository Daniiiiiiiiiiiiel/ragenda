import type { VercelRequest, VercelResponse } from '@vercel/node';

import { prisma } from '@ragenda/db';
import { setCors, setSecurityHeaders, ok, err } from '../../_lib/security.js';
import { requireAdmin } from '../../_middleware/adminAuth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);
  if (setCors(req, res)) return;

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (req.method === 'GET') {
    // GET with filtering, search, pagination
    const { page = '1', limit = '10', status, service, date, search } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = Math.min(parseInt(limit), 50);

    const where: Record<string, unknown> = {};
    if (status) where['status'] = status;
    if (date)   where['date'] = new Date(date + 'T00:00:00Z');
    if (search) {
      where['user'] = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }
    if (service) where['serviceId'] = service;

    const [total, appointments] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        skip,
        take,
        orderBy: [{ date: 'desc' }, { timeSlot: 'asc' }],
        include: {
          user:    { select: { id: true, name: true, email: true, phone: true } },
          service: { select: { id: true, name: true, duration: true, color: true } },
        },
      }),
    ]);

    return ok(res, { appointments, total, page: parseInt(page), totalPages: Math.ceil(total / take) });
  }

  return err(res, 'Method not allowed', 405);
}
