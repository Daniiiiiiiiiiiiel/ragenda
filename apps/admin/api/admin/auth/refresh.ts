import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '@ragenda/db';
import { setCors, setSecurityHeaders, ok, err } from '../../_lib/security.js';
import { verifyRefreshToken, signAccessToken, signRefreshToken, hashToken, REFRESH_TOKEN_TTL } from '../../_lib/jwt.js';
import { revokeRefreshToken } from '../../_lib/redis.js';

function parseCookies(h?: string): Record<string, string> {
  if (!h) return {};
  return Object.fromEntries(h.split(';').map((c) => { const [k, ...v] = c.trim().split('='); return [k.trim(), v.join('=').trim()]; }));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);
  if (setCors(req, res)) return;
  if (req.method !== 'POST') return err(res, 'Method not allowed', 405);

  const cookies = parseCookies(req.headers.cookie);
  const oldToken = cookies['admin_refresh'];
  if (!oldToken) return err(res, 'No refresh token', 401);

  let payload;
  try { payload = await verifyRefreshToken(oldToken); } catch { return err(res, 'Invalid refresh token', 401); }

  const oldHash = hashToken(oldToken);
  const session = await prisma.session.findFirst({
    where: { token: oldHash, userId: payload.sub! },
    include: { user: { select: { id: true, role: true, isActive: true } } },
  });

  if (!session || session.user.role !== 'ADMIN' || !session.user.isActive) {
    await prisma.session.deleteMany({ where: { userId: payload.sub! } });
    return err(res, 'Session invalid', 401);
  }

  await prisma.session.delete({ where: { id: session.id } });
  await revokeRefreshToken(oldHash);

  const newAccess = await signAccessToken(session.user.id, 'ADMIN');
  const newRefresh = await signRefreshToken(session.user.id);
  const newHash = hashToken(newRefresh);

  await prisma.session.create({
    data: { userId: session.user.id, token: newHash, expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL * 1000) },
  });

  res.setHeader('Set-Cookie', [`admin_refresh=${newRefresh}; HttpOnly; Secure; SameSite=Strict; Max-Age=${REFRESH_TOKEN_TTL}; Path=/api/admin/auth`]);
  return ok(res, { accessToken: newAccess });
}
