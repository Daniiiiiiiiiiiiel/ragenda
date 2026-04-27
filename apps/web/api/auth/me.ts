import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '@ragenda/db';
import { setCors, setSecurityHeaders, ok, err } from '../_lib/security.js';
import { requireAuth } from '../_middleware/auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);
  if (setCors(req, res)) return;
  if (req.method !== 'GET') return err(res, 'Method not allowed', 405);

  const payload = await requireAuth(req, res);
  if (!payload) return;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub! },
    select: { id: true, email: true, name: true, phone: true, role: true, emailVerified: true, isActive: true, createdAt: true },
  });

  if (!user || !user.isActive) return err(res, 'User not found', 404);
  return ok(res, user);
}
