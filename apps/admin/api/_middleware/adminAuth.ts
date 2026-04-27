import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAccessToken, extractBearerToken, type TokenPayload } from '../_lib/jwt.js';
import { isTokenBlacklisted } from '../_lib/redis.js';
import { err } from '../_lib/security.js';

export async function requireAdmin(
  req: VercelRequest,
  res: VercelResponse,
): Promise<TokenPayload | null> {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) { err(res, 'Authentication required', 401); return null; }

  try {
    const payload = await verifyAccessToken(token);
    if (payload.role !== 'ADMIN') { err(res, 'Admin access required', 403); return null; }

    const blacklisted = await isTokenBlacklisted(payload.jti!);
    if (blacklisted) { err(res, 'Token revoked', 401); return null; }

    return payload;
  } catch {
    err(res, 'Invalid or expired token', 401);
    return null;
  }
}
