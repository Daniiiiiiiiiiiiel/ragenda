import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL;
const isMock = !url || url.includes('your-upstash');

export const redis = isMock ? null : new Redis({
  url: url!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// ─── Rate Limiting ────────────────────────────────────────────────────────────

export const RATE_LIMIT_WINDOW = 15 * 60; // 15 minutes in seconds
export const RATE_LIMIT_MAX = 5;

export async function checkRateLimit(key: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
}> {
  const redisKey = `rl:${key}`;
  const now = Math.floor(Date.now() / 1000);

  if (isMock || !redis) return { allowed: true, remaining: 99, resetAt: now + 60 };

  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.expire(redisKey, RATE_LIMIT_WINDOW);
  }
  const ttl = await redis.ttl(redisKey);
  const resetAt = now + ttl;
  const remaining = Math.max(0, RATE_LIMIT_MAX - count);

  return {
    allowed: count <= RATE_LIMIT_MAX,
    remaining,
    resetAt,
  };
}

// ─── Token Blacklist (for real logout) ───────────────────────────────────────

export async function blacklistToken(jti: string, expiresInSeconds: number): Promise<void> {
  if (isMock || !redis) return;
  await redis.set(`bl:${jti}`, '1', { ex: expiresInSeconds });
}

export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  if (isMock || !redis) return false;
  const val = await redis.get(`bl:${jti}`);
  return val !== null;
}

// ─── Refresh Token Storage ────────────────────────────────────────────────────

export async function storeRefreshToken(
  userId: string,
  tokenHash: string,
  ttlSeconds: number,
): Promise<void> {
  if (isMock || !redis) return;
  await redis.set(`rt:${tokenHash}`, userId, { ex: ttlSeconds });
}

export async function getRefreshTokenUserId(tokenHash: string): Promise<string | null> {
  if (isMock || !redis) return 'mock-user-id'; // Fallback to DB check in consumer
  return redis.get<string>(`rt:${tokenHash}`);
}

export async function revokeRefreshToken(tokenHash: string): Promise<void> {
  if (isMock || !redis) return;
  await redis.del(`rt:${tokenHash}`);
}
