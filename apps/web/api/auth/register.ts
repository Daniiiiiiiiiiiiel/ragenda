import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '@ragenda/db';
import { setCors, setSecurityHeaders, ok, err, getClientIp } from '../_lib/security.js';
import { checkRateLimit } from '../_lib/redis.js';
import { signAccessToken, signRefreshToken, hashToken, REFRESH_TOKEN_TTL } from '../_lib/jwt.js';
import { sendVerificationEmail } from '../_lib/email.js';

const RegisterSchema = z.object({
  name: z.string().min(2).max(80).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z
    .string()
    .min(8)
    .max(72)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain a number'),
  phone: z.string().max(20).optional(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);
  if (setCors(req, res)) return;
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405);

  const ip = getClientIp(req);
  const { allowed, remaining } = await checkRateLimit(`register:${ip}`);
  res.setHeader('X-RateLimit-Remaining', remaining);
  if (!allowed) return err(res, 'Too many requests. Please wait 15 minutes.', 429);

  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) return err(res, 'Validation failed', 422, parsed.error.flatten());

  const { name, email, password, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return err(res, 'Email already registered', 409);

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, passwordHash, phone: phone || null, role: 'CLIENT' },
    select: { id: true, email: true, name: true, role: true },
  });

  // Create email verification token
  const verifyToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  await prisma.emailVerification.create({
    data: { userId: user.id, token: verifyToken, expiresAt },
  });

  await sendVerificationEmail(email, name, verifyToken).catch(console.error);

  // Issue tokens immediately (user can use app; email verification is async)
  const accessToken = await signAccessToken(user.id, user.role as 'CLIENT' | 'ADMIN');
  const refreshToken = await signRefreshToken(user.id);
  const refreshHash = hashToken(refreshToken);

  await prisma.session.create({
    data: {
      userId: user.id,
      token: refreshHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL * 1000),
      ipAddress: ip,
      userAgent: req.headers['user-agent'] || null,
    },
  });

  res.setHeader('Set-Cookie', [
    `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Lax; Max-Age=${REFRESH_TOKEN_TTL}; Path=/api/auth`,
  ]);

  return ok(res, { user, accessToken }, 201);
}
