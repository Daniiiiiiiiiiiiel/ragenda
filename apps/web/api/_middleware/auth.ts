import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAccessToken, extractBearerToken, type TokenPayload } from '../_lib/jwt.js';
import { isTokenBlacklisted } from '../_lib/redis.js';
import { err } from '../_lib/security.js';

export interface AuthedRequest extends VercelRequest {
  user: TokenPayload;
}

export async function requireAuth(
  req: VercelRequest,
  res: VercelResponse,
): Promise<TokenPayload | null> {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    err(res, 'Authentication required', 401);
    return null;
  }

  try {
    const payload = await verifyAccessToken(token);

    // Check blacklist (real logout)
    const blacklisted = await isTokenBlacklisted(payload.jti!);
    if (blacklisted) {
      err(res, 'Token has been revoked', 401);
      return null;
    }

    return payload;
  } catch {
    err(res, 'Invalid or expired token', 401);
    return null;
  }
}

export async function requireRole(
  req: VercelRequest,
  res: VercelResponse,
  role: 'CLIENT' | 'ADMIN',
): Promise<TokenPayload | null> {
  const payload = await requireAuth(req, res);
  if (!payload) return null;

  if (payload.role !== role) {
    err(res, 'Insufficient permissions', 403);
    return null;
  }
  return payload;
}
