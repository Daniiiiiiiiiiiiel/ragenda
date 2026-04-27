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

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status, adminNotes: adminNotes?.trim() || null, updatedAt: new Date() },
  });

  // Send email notification (fire-and-forget)
  const dateStr = existing.date.toISOString().split('T')[0];
  resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'RaGenda <no-reply@ragenda.app>',
    to: existing.user.email,
    subject: `RaGenda — Appointment ${status}`,
    html: `<p>Hi ${existing.user.name}, your appointment for <b>${existing.service.name}</b> on <b>${dateStr}</b> at <b>${existing.timeSlot}</b> has been <b>${status.toLowerCase()}</b>. ${adminNotes ? `<br/>Note: ${adminNotes}` : ''}</p>`,
  }).catch(console.error);

  return ok(res, updated);
}
