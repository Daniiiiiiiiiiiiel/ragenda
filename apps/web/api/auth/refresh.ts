import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '@ragenda/db';
import { setCors, setSecurityHeaders, ok, err } from '../_lib/security.js';
import { verifyRefreshToken, signAccessToken, signRefreshToken, hashToken, REFRESH_TOKEN_TTL } from '../_lib/jwt.js';
import { revokeRefreshToken } from '../_lib/redis.js';

function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k.trim(), v.join('=').trim()];
    }),
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);
  if (setCors(req, res)) return;
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405);

  const cookies = parseCookies(req.headers.cookie);
  const oldRefreshToken = cookies['refresh_token'];
  if (!oldRefreshToken) return err(res, 'No refresh token', 401);

  let payload;
  try {
    payload = await verifyRefreshToken(oldRefreshToken);
  } catch {
    return err(res, 'Invalid refresh token', 401);
  }

  const oldHash = hashToken(oldRefreshToken);

  // Verify token exists in DB (not already rotated)
  const session = await prisma.session.findFirst({
    where: { token: oldHash, userId: payload.sub! },
    include: { user: { select: { id: true, role: true, isActive: true } } },
  });

  if (!session || !session.user.isActive) {
    // Possible token reuse attack — revoke all sessions
    await prisma.session.deleteMany({ where: { userId: payload.sub! } });
    return err(res, 'Refresh token reuse detected', 401);
  }

  // Rotate: delete old, create new
  await prisma.session.delete({ where: { id: session.id } });
  await revokeRefreshToken(oldHash);

  const newAccessToken = await signAccessToken(session.user.id, session.user.role as 'CLIENT' | 'ADMIN');
  const newRefreshToken = await signRefreshToken(session.user.id);
  const newHash = hashToken(newRefreshToken);

  await prisma.session.create({
    data: {
      userId: session.user.id,
      token: newHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL * 1000),
      userAgent: req.headers['user-agent'] || null,
    },
  });

  res.setHeader('Set-Cookie', [
    `refresh_token=${newRefreshToken}; HttpOnly; Secure; SameSite=Lax; Max-Age=${REFRESH_TOKEN_TTL}; Path=/api/auth`,
  ]);

  return ok(res, { accessToken: newAccessToken });
}
