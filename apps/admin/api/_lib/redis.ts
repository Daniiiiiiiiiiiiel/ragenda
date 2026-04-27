import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL;
const isMock = !url || url.includes('your-upstash');

export const redis = isMock ? null : new Redis({
  url: url!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const RATE_LIMIT_WINDOW = 15 * 60;
export const RATE_LIMIT_MAX = 5;

export async function checkRateLimit(key: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Math.floor(Date.now() / 1000);
  if (isMock || !redis) return { allowed: true, remaining: 99, resetAt: now + 60 };

  const redisKey = `rl:${key}`;
  const count = await redis.incr(redisKey);
  if (count === 1) await redis.expire(redisKey, RATE_LIMIT_WINDOW);
  const ttl = await redis.ttl(redisKey);
  return { allowed: count <= RATE_LIMIT_MAX, remaining: Math.max(0, RATE_LIMIT_MAX - count), resetAt: now + ttl };
}

export async function blacklistToken(jti: string, expiresInSeconds: number): Promise<void> {
  if (isMock || !redis) return;
  await redis.set(`bl:${jti}`, '1', { ex: expiresInSeconds });
}

export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  if (isMock || !redis) return false;
  return (await redis.get(`bl:${jti}`)) !== null;
}

export async function revokeRefreshToken(tokenHash: string): Promise<void> {
  if (isMock || !redis) return;
  await redis.del(`rt:${tokenHash}`);
}
