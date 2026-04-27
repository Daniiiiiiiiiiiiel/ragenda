import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { prisma } from '@ragenda/db';
import { setCors, setSecurityHeaders, ok, err } from '../_lib/security.js';

const Schema = z.object({ token: z.string().length(64) });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);
  if (setCors(req, res)) return;
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405);

  const parsed = Schema.safeParse(req.body);
  if (!parsed.success) return err(res, 'Invalid token', 400);

  const verification = await prisma.emailVerification.findUnique({
    where: { token: parsed.data.token },
  });

  if (!verification) return err(res, 'Invalid or expired verification token', 400);
  if (verification.expiresAt < new Date()) {
    await prisma.emailVerification.delete({ where: { id: verification.id } });
    return err(res, 'Verification token expired. Please request a new one.', 410);
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: verification.userId }, data: { emailVerified: true } }),
    prisma.emailVerification.delete({ where: { id: verification.id } }),
  ]);

  return ok(res, { message: 'Email verified successfully' });
}
