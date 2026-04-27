import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '@ragenda/db';
import { setCors, setSecurityHeaders, ok, err } from '../_lib/security.js';
import { requireAuth } from '../_middleware/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);
  if (setCors(req, res)) return;
  if (req.method !== 'GET') return err(res, 'Method not allowed', 405);

  const user = await requireAuth(req, res);
  if (!user) return;

  const appointments = await prisma.appointment.findMany({
    where: { userId: user.sub! },
    include: { service: { select: { id: true, name: true, duration: true, color: true } } },
    orderBy: [{ date: 'desc' }, { timeSlot: 'asc' }],
  });

  return ok(res, appointments);
}
