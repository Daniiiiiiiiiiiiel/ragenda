import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '@ragenda/db';
import { setCors, setSecurityHeaders, ok, err } from '../_lib/security.js';
import { requireAuth } from '../_middleware/auth.js';
import { blacklistToken, revokeRefreshToken } from '../_lib/redis.js';
import { verifyRefreshToken, hashToken, ACCESS_TOKEN_TTL } from '../_lib/jwt.js';

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

  // Blacklist the access token if present
  const user = await requireAuth(req, res);
  if (!user) return; // Already responded with 401

  const remainingTTL = Math.max(0, Math.floor((user.exp! * 1000 - Date.now()) / 1000));
  await blacklistToken(user.jti!, remainingTTL || ACCESS_TOKEN_TTL);

  // Revoke refresh token from cookie
  const cookies = parseCookies(req.headers.cookie);
  const refreshToken = cookies['refresh_token'];
  if (refreshToken) {
    try {
      const payload = await verifyRefreshToken(refreshToken);
      const hash = hashToken(refreshToken);
      await revokeRefreshToken(hash);
      await prisma.session.deleteMany({ where: { userId: payload.sub! } });
    } catch {
      // Token already invalid — that's fine
    }
  }

  // Clear the httpOnly cookie
  res.setHeader('Set-Cookie', [
    'refresh_token=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/api/auth',
  ]);

  return ok(res, { message: 'Logged out successfully' });
}
