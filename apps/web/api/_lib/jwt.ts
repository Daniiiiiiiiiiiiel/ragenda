import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import crypto from 'crypto';

const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const REFRESH_SECRET = new TextEncoder().encode(process.env.REFRESH_TOKEN_SECRET!);

export const ACCESS_TOKEN_TTL = 15 * 60; // 15 minutes
export const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60; // 7 days

export interface TokenPayload extends JWTPayload {
  sub: string; // userId
  role: 'CLIENT' | 'ADMIN';
  jti: string;
}

// ─── Access Token ─────────────────────────────────────────────────────────────

export async function signAccessToken(userId: string, role: 'CLIENT' | 'ADMIN'): Promise<string> {
  const jti = crypto.randomUUID();
  return new SignJWT({ role, jti })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL}s`)
    .setJti(jti)
    .sign(ACCESS_SECRET);
}

export async function verifyAccessToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, ACCESS_SECRET);
  return payload as TokenPayload;
}

// ─── Refresh Token ────────────────────────────────────────────────────────────

export async function signRefreshToken(userId: string): Promise<string> {
  const jti = crypto.randomUUID();
  return new SignJWT({ jti })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TOKEN_TTL}s`)
    .setJti(jti)
    .sign(REFRESH_SECRET);
}

export async function verifyRefreshToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, REFRESH_SECRET);
  return payload as TokenPayload;
}

// ─── Hash (for storing refresh tokens in Redis) ───────────────────────────────

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ─── Extract token from Authorization header ───────────────────────────────────

export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}
