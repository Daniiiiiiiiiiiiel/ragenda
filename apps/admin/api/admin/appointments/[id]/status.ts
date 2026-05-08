import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { prisma } from '@ragenda/db';
import { setCors, setSecurityHeaders, ok, err } from '../../../_lib/security.js';
import { requireAdmin } from '../../../_middleware/adminAuth.js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

const StatusSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
  adminNotes: z.string().max(500).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);
  if (setCors(req, res)) return;
  if (req.method !== 'PATCH') return err(res, 'Method not allowed', 405);

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { id } = req.query as { id: string };
  if (!id) return err(res, 'Appointment ID required', 400);

  const parsed = StatusSchema.safeParse(req.body);
  if (!parsed.success) return err(res, 'Validation failed', 422, parsed.error.flatten());

  const { status, adminNotes } = parsed.data;

  const existing = await prisma.appointment.findUnique({
    where: { id },
    include: {
      user:    { select: { name: true, email: true } },
      service: { select: { name: true } },
    },
  });

  if (!existing) return err(res, 'Appointment not found', 404);
  if (existing.status !== 'PENDING') return err(res, 'Only pending appointments can be updated', 400);

  // Use a transaction to update appointment + adjust slot count atomically
  const [updated] = await prisma.$transaction(async (tx) => {
    const appt = await tx.appointment.update({
      where: { id },
      data: { status, adminNotes: adminNotes?.trim() || null, updatedAt: new Date() },
    });

    // If rejected, free up the slot
    if (status === 'REJECTED') {
      await tx.availableSlot.updateMany({
        where: {
          date: existing.date,
          time: existing.timeSlot,
          currentBookings: { gt: 0 },
        },
        data: { currentBookings: { decrement: 1 } },
      });
    }

    return [appt];
  });

  // Send email notification (fire-and-forget)
  const dateStr = existing.date.toISOString().split('T')[0];
  const statusLabel = status === 'ACCEPTED' ? 'confirmed' : 'rejected';
  const statusColor = status === 'ACCEPTED' ? '#4ade80' : '#f87171';

  resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'RaGenda <no-reply@ragenda.app>',
    to: existing.user.email,
    subject: `RaGenda — Appointment ${status === 'ACCEPTED' ? 'Confirmed' : 'Rejected'}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px 24px; background: #f9f9f9; border-radius: 12px;">
        <h2 style="color: #1a1918; margin-bottom: 8px;">Appointment ${status === 'ACCEPTED' ? 'Confirmed ✓' : 'Rejected'}</h2>
        <p style="color: #555;">Hi <strong>${existing.user.name}</strong>,</p>
        <p style="color: #555;">Your appointment for <strong>${existing.service.name}</strong> on <strong>${dateStr}</strong> at <strong>${existing.timeSlot}</strong> has been <span style="color: ${statusColor}; font-weight: bold;">${statusLabel}</span>.</p>
        ${adminNotes ? `<div style="background: #eee; border-radius: 8px; padding: 12px; margin-top: 16px;"><p style="margin: 0; color: #333; font-size: 14px;"><strong>Note:</strong> ${adminNotes}</p></div>` : ''}
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #ddd;" />
        <p style="font-size: 12px; color: #999;">RaGenda — Scheduling System</p>
      </div>
    `,
  }).catch(console.error);

  return ok(res, updated);
}
