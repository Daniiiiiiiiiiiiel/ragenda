import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { prisma } from '@ragenda/db';
import { setCors, setSecurityHeaders, ok, err } from '../_lib/security.js';

const QuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);
  if (setCors(req, res)) return;
  if (req.method !== 'GET') return err(res, 'Method not allowed', 405);

  const parsed = QuerySchema.safeParse(req.query);
  if (!parsed.success) return err(res, 'Invalid month format. Use YYYY-MM', 400);

  const { month } = parsed.data;
  
  // Construct start and end of month
  const startDate = new Date(`${month}-01T00:00:00Z`);
  const endDate = new Date(startDate);
  endDate.setUTCMonth(endDate.getUTCMonth() + 1);

  const slots = await prisma.availableSlot.findMany({
    where: { 
      date: {
        gte: startDate,
        lt: endDate
      }
    },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
    select: {
      id: true,
      date: true,
      time: true,
      maxCapacity: true,
      currentBookings: true,
      isBlocked: true,
    },
  });

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const allSlots = slots.map((s) => {
    const isPast = s.date < today;
    const isAvailable = !isPast && !s.isBlocked && s.currentBookings < s.maxCapacity;

    return {
      id: s.id,
      date: s.date.toISOString().split('T')[0], // YYYY-MM-DD
      time: s.time,
      availableCount: s.maxCapacity - s.currentBookings,
      isAvailable,
      isBlocked: s.isBlocked,
    };
  });

  // Cache at the edge for 60 seconds
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
  
  return ok(res, allSlots);
}
