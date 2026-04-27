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

  const { page = '1', search } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * 20;

  const where = search
    ? { role: 'CLIENT' as const, OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }] }
    : { role: 'CLIENT' as const };

  const [total, clients] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, phone: true,
        isActive: true, emailVerified: true, createdAt: true,
        _count: { select: { appointments: true } },
      },
    }),
  ]);

  return ok(res, { clients, total, page: parseInt(page) });
}
