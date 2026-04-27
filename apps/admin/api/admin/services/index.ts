import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { prisma } from '@ragenda/db';
import { setCors, setSecurityHeaders, ok, err } from '../../_lib/security.js';
import { requireAdmin } from '../../_middleware/adminAuth.js';

const ServiceSchema = z.object({
  name: z.string().min(1).max(80),
  duration: z.number().int().min(5).max(480),
  description: z.string().max(500).optional(),
  price: z.number().positive().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  isActive: z.boolean().optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);
  if (setCors(req, res)) return;

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { id } = req.query as Record<string, string>;

  if (req.method === 'GET' && !id) {
    const services = await prisma.service.findMany({ orderBy: { name: 'asc' } });
    return ok(res, services);
  }

  if (req.method === 'POST') {
    const parsed = ServiceSchema.safeParse(req.body);
    if (!parsed.success) return err(res, 'Validation failed', 422, parsed.error.flatten());
    const svc = await prisma.service.create({ data: parsed.data as any });
    return ok(res, svc, 201);
  }

  if (!id) return err(res, 'Service ID required', 400);

  if (req.method === 'PATCH') {
    const parsed = ServiceSchema.partial().safeParse(req.body);
    if (!parsed.success) return err(res, 'Validation failed', 422, parsed.error.flatten());
    const svc = await prisma.service.update({ where: { id }, data: parsed.data as any });
    return ok(res, svc);
  }

  if (req.method === 'DELETE') {
    await prisma.service.update({ where: { id }, data: { isActive: false } });
    return ok(res, { message: 'Service deactivated' });
  }

  return err(res, 'Method not allowed', 405);
}
