import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '@ragenda/db';
import { setCors, setSecurityHeaders, ok, err } from '../../_lib/security.js';
import { requireAuth } from '../../_middleware/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);
  if (setCors(req, res)) return;
  if (req.method !== 'PATCH') return err(res, 'Method not allowed', 405);

  const user = await requireAuth(req, res);
  if (!user) return;

  const { id } = req.query as { id: string };
  if (!id) return err(res, 'Appointment ID required', 400);

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true, date: true, timeSlot: true },
  });

  if (!appointment) return err(res, 'Appointment not found', 404);

  // Ownership check — clients can only cancel their own appointments
  if (appointment.userId !== user.sub) return err(res, 'Forbidden', 403);

  if (appointment.status !== 'PENDING') {
    return err(res, 'Only pending appointments can be cancelled', 400);
  }

  const [updated] = await prisma.$transaction([
    prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED', updatedAt: new Date() },
    }),
    prisma.availableSlot.updateMany({
      where: { date: appointment.date, time: appointment.timeSlot },
      data: { currentBookings: { decrement: 1 } },
    }),
  ]);

  return ok(res, updated);
}
