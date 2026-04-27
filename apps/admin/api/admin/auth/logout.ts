import type { VercelRequest, VercelResponse } from '@vercel/node';
import { prisma } from '@ragenda/db';
import { setCors, setSecurityHeaders, ok } from '../../_lib/security.js';
import { verifyRefreshToken, hashToken, extractBearerToken, verifyAccessToken } from '../../_lib/jwt.js';
import { blacklistToken, revokeRefreshToken } from '../../_lib/redis.js';

function parseCookies(h?: string): Record<string, string> {
  if (!h) return {};
  return Object.fromEntries(
    h.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k.trim(), v.join('=').trim()];
    }),
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setSecurityHeaders(res);
  if (setCors(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  // Revoke access token (blacklist its JTI)
  const accessToken = extractBearerToken(req.headers.authorization);
  if (accessToken) {
    try {
      const payload = await verifyAccessToken(accessToken);
      if (payload.jti) await blacklistToken(payload.jti, 15 * 60); // 15 min TTL
    } catch { /* already expired — ignore */ }
  }

  // Revoke refresh token session
  const cookies = parseCookies(req.headers.cookie);
  const refreshToken = cookies['admin_refresh'];
  if (refreshToken) {
    try {
      await verifyRefreshToken(refreshToken);
      const tokenHash = hashToken(refreshToken);
      await Promise.all([
        prisma.session.deleteMany({ where: { token: tokenHash } }),
        revokeRefreshToken(tokenHash),
      ]);
    } catch { /* already invalid — ignore */ }
  }

  // Clear the refresh cookie
  res.setHeader('Set-Cookie', [
    'admin_refresh=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/api/admin/auth',
  ]);

  return ok(res, { message: 'Logged out' });
}
