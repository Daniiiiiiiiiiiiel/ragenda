import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { prisma } from '@ragenda/db';
import { setCors, setSecurityHeaders, ok, err } from '../_lib/security.js';
import { requireAuth } from '../_middleware/auth.js';

const CreateSchema = z.object({
  serviceId: z.string().cuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeSlot: z.string().regex(/^\d{2}:\d{2}$/),
  notes: z.string().max(500).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);
  if (setCors(req, res)) return;
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405);

  const user = await requireAuth(req, res);
  if (!user) return;

  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) return err(res, 'Validation failed', 422, parsed.error.flatten());

  const { serviceId, date, timeSlot, notes } = parsed.data;

  // Parse and validate date is not in the past
  const appointmentDate = new Date(date + 'T00:00:00Z');
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (appointmentDate < today) return err(res, 'Cannot book appointments in the past', 400);

  // Verify service exists and is active
  const service = await prisma.service.findUnique({ where: { id: serviceId, isActive: true } });
  if (!service) return err(res, 'Service not found or inactive', 404);

  // Check slot availability
  const slot = await prisma.availableSlot.findUnique({
    where: { date_time: { date: appointmentDate, time: timeSlot } },
  });

  if (!slot) return err(res, 'Time slot not available', 400);
  if (slot.isBlocked) return err(res, 'This slot is blocked', 400);
  if (slot.currentBookings >= slot.maxCapacity) return err(res, 'Time slot is fully booked', 409);

  // Check for duplicate booking
  const existing = await prisma.appointment.findFirst({
    where: {
      userId: user.sub!,
      date: appointmentDate,
      timeSlot,
      status: { in: ['PENDING', 'ACCEPTED'] },
    },
  });
  if (existing) return err(res, 'You already have an appointment at this time', 409);

  // Create appointment + update slot count atomically
  const [appointment] = await prisma.$transaction([
    prisma.appointment.create({
      data: {
        userId: user.sub!,
        serviceId,
        date: appointmentDate,
        timeSlot,
        notes: notes || null,
        status: 'PENDING',
      },
      include: { service: { select: { name: true, duration: true } } },
    }),
    prisma.availableSlot.update({
      where: { id: slot.id },
      data: { currentBookings: { increment: 1 } },
    }),
  ]);

  return ok(res, appointment, 201);
}
