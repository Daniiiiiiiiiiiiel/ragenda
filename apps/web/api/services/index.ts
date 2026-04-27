import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '@ragenda/db';
import { setCors, setSecurityHeaders, ok, err } from '../_lib/security.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);
  if (setCors(req, res)) return;
  if (req.method !== 'GET') return err(res, 'Method not allowed', 405);

  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, duration: true, description: true, price: true, color: true },
  });

  // Cache for 5 minutes
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
  return ok(res, services);
}
