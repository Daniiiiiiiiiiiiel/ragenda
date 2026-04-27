import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@ragenda/db';
import { setCors, setSecurityHeaders, ok, err, getClientIp } from '../_lib/security.js';
import { checkRateLimit } from '../_lib/redis.js';
import { signAccessToken, signRefreshToken, hashToken, REFRESH_TOKEN_TTL } from '../_lib/jwt.js';

const LoginSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(1).max(72),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);
  if (setCors(req, res)) return;
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405);

  const ip = getClientIp(req);
  const { allowed, remaining } = await checkRateLimit(`login:${ip}`);
  res.setHeader('X-RateLimit-Remaining', remaining);
  if (!allowed) return err(res, 'Too many failed attempts. Try again in 15 minutes.', 429);

  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return err(res, 'Invalid credentials', 401);

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, role: true, passwordHash: true, isActive: true, emailVerified: true },
  });

  // Constant-time comparison to prevent timing attacks
  const dummyHash = '$2b$12$invalidhashforpreventingtimingattacks000000000000000000000';
  const valid = await bcrypt.compare(password, user?.passwordHash ?? dummyHash);

  if (!user || !valid) return err(res, 'Invalid email or password', 401);
  if (!user.isActive) return err(res, 'Account deactivated. Contact support.', 403);

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

  const { passwordHash: _p, ...safeUser } = user;
  return ok(res, { user: safeUser, accessToken });
}
