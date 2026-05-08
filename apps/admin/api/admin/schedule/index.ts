import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { prisma } from '@ragenda/db';
import { setCors, setSecurityHeaders, ok, err } from '../../_lib/security.js';
import { requireAdmin } from '../../_middleware/adminAuth.js';

const TIME_REGEX = /^\d{2}:\d{2}$/;

const ScheduleSchema = z.object({
  workDays:         z.array(z.number().int().min(0).max(6)).min(1).max(7),
  startTime:        z.string().regex(TIME_REGEX, 'Invalid time format HH:MM'),
  endTime:          z.string().regex(TIME_REGEX, 'Invalid time format HH:MM'),
  intervalMinutes:  z.number().int().refine((v) => [15, 20, 30, 45, 60].includes(v), {
    message: 'Interval must be 15, 20, 30, 45 or 60 minutes',
  }),
  maxCapacity:      z.number().int().min(1).max(50),
  bookingWindowDays: z.number().int().min(1).max(365),
  breakStart:       z.string().regex(TIME_REGEX).nullable().optional(),
  breakEnd:         z.string().regex(TIME_REGEX).nullable().optional(),
}).refine((d) => {
  const [sh, sm] = d.startTime.split(':').map(Number);
  const [eh, em] = d.endTime.split(':').map(Number);
  return eh * 60 + em > sh * 60 + sm;
}, { message: 'endTime must be after startTime' })
.refine((d) => {
  if (!d.breakStart || !d.breakEnd) return true;
  const [bsh, bsm] = d.breakStart.split(':').map(Number);
  const [beh, bem] = d.breakEnd.split(':').map(Number);
  return beh * 60 + bem > bsh * 60 + bsm;
}, { message: 'breakEnd must be after breakStart' });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);
  if (setCors(req, res)) return;

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  // ── GET: return current config ─────────────────────────────────────────────
  if (req.method === 'GET') {
    const config = await prisma.scheduleConfig.upsert({
      where:  { id: 'default' },
      update: {},
      create: {
        id: 'default',
        workDays: [1, 2, 3, 4, 5],
        startTime: '09:00',
        endTime: '18:00',
        intervalMinutes: 30,
        maxCapacity: 1,
        bookingWindowDays: 60,
        breakStart: '13:00',
        breakEnd: '14:00',
      },
    });
    return ok(res, config);
  }

  // ── PUT: update config + regenerate future slots ────────────────────────────
  if (req.method === 'PUT') {
    const parsed = ScheduleSchema.safeParse(req.body);
    if (!parsed.success) return err(res, 'Validation failed', 422, parsed.error.flatten());

    const data = parsed.data;

    // 1. Persist config
    const config = await prisma.scheduleConfig.upsert({
      where:  { id: 'default' },
      update: {
        workDays:          data.workDays,
        startTime:         data.startTime,
        endTime:           data.endTime,
        intervalMinutes:   data.intervalMinutes,
        maxCapacity:       data.maxCapacity,
        bookingWindowDays: data.bookingWindowDays,
        breakStart:        data.breakStart ?? null,
        breakEnd:          data.breakEnd ?? null,
      },
      create: {
        id: 'default',
        workDays:          data.workDays,
        startTime:         data.startTime,
        endTime:           data.endTime,
        intervalMinutes:   data.intervalMinutes,
        maxCapacity:       data.maxCapacity,
        bookingWindowDays: data.bookingWindowDays,
        breakStart:        data.breakStart ?? null,
        breakEnd:          data.breakEnd ?? null,
      },
    });

    // 2. Regenerate future slots (only future dates, never touch past)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    // Delete future slots that have NO bookings (safe to remove)
    await prisma.availableSlot.deleteMany({
      where: {
        date: { gte: tomorrow },
        currentBookings: 0,
      },
    });

    // Build new slots
    const windowDays = data.bookingWindowDays;
    const [startH, startM] = data.startTime.split(':').map(Number);
    const [endH, endM] = data.endTime.split(':').map(Number);
    const breakStartMin = data.breakStart
      ? (() => { const [h, m] = data.breakStart.split(':').map(Number); return h * 60 + m; })()
      : null;
    const breakEndMin = data.breakEnd
      ? (() => { const [h, m] = data.breakEnd.split(':').map(Number); return h * 60 + m; })()
      : null;

    const workDays = data.workDays as number[];
    const slots: { date: Date; time: string; maxCapacity: number; currentBookings: number; isBlocked: boolean }[] = [];

    for (let d = 1; d <= windowDays; d++) {
      const date = new Date(today);
      date.setUTCDate(today.getUTCDate() + d);
      const dayOfWeek = date.getUTCDay();
      if (!workDays.includes(dayOfWeek)) continue;

      let minutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      while (minutes < endMinutes) {
        // Skip break time
        if (
          breakStartMin !== null &&
          breakEndMin !== null &&
          minutes >= breakStartMin &&
          minutes < breakEndMin
        ) {
          minutes += data.intervalMinutes;
          continue;
        }
        const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
        const mm = String(minutes % 60).padStart(2, '0');
        slots.push({
          date,
          time: `${hh}:${mm}`,
          maxCapacity: data.maxCapacity,
          currentBookings: 0,
          isBlocked: false,
        });
        minutes += data.intervalMinutes;
      }
    }

    // Upsert new slots (skip ones that already have bookings)
    for (const slot of slots) {
      await prisma.availableSlot.upsert({
        where: { date_time: { date: slot.date, time: slot.time } },
        update: { maxCapacity: slot.maxCapacity },   // preserve existing bookings
        create: slot,
      });
    }

    return ok(res, { config, slotsGenerated: slots.length });
  }

  return err(res, 'Method not allowed', 405);
}
