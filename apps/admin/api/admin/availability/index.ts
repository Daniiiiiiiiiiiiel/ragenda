import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { prisma } from '@ragenda/db';
import { setCors, setSecurityHeaders, ok, err } from '../../_lib/security.js';
import { requireAdmin } from '../../_middleware/adminAuth.js';

const SlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  maxCapacity: z.number().int().min(1).max(50).optional(),
  isBlocked: z.boolean().optional(),
});

const BlockDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isBlocked: z.boolean(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);
  if (setCors(req, res)) return;

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (req.method === 'GET') {
    const { month } = req.query as { month?: string };
    if (!month) return err(res, 'month query required (YYYY-MM)', 400);

    const [year, m] = month.split('-').map(Number);
    const start = new Date(Date.UTC(year, m - 1, 1));
    const end   = new Date(Date.UTC(year, m, 0));

    const slots = await prisma.availableSlot.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });

    return ok(res, slots);
  }

  if (req.method === 'POST') {
    const parsed = SlotSchema.safeParse(req.body);
    if (!parsed.success) return err(res, 'Validation failed', 422, parsed.error.flatten());

    const { date, time, maxCapacity = 1, isBlocked = false } = parsed.data;
    const targetDate = new Date(date + 'T00:00:00Z');

    const slot = await prisma.availableSlot.upsert({
      where: { date_time: { date: targetDate, time } },
      update: { maxCapacity, isBlocked },
      create: { date: targetDate, time, maxCapacity, isBlocked },
    });
    return ok(res, slot, 201);
  }

  if (req.method === 'PATCH') {
    // Block/unblock entire day
    const parsed = BlockDaySchema.safeParse(req.body);
    if (!parsed.success) return err(res, 'Validation failed', 422, parsed.error.flatten());

    const { date, isBlocked } = parsed.data;
    const targetDate = new Date(date + 'T00:00:00Z');

    await prisma.availableSlot.updateMany({
      where: { date: targetDate },
      data: { isBlocked },
    });

    return ok(res, { message: `All slots on ${date} ${isBlocked ? 'blocked' : 'unblocked'}` });
  }

  return err(res, 'Method not allowed', 405);
}
