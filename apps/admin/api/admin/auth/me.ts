import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '@ragenda/db';
import { setCors, setSecurityHeaders, ok, err } from '../../_lib/security.js';
import { requireAdmin } from '../../_middleware/adminAuth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);
  if (setCors(req, res)) return;
  if (req.method !== 'GET') return err(res, 'Method not allowed', 405);

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const user = await prisma.user.findUnique({
    where: { id: admin.sub! },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) return err(res, 'User not found or inactive', 404);

  return ok(res, { id: user.id, email: user.email, name: user.name, role: user.role });
}
