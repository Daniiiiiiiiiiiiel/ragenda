import type { VercelRequest, VercelResponse } from '@vercel/node';

export function setSecurityHeaders(res: VercelResponse): void {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

export function setCors(req: VercelRequest, res: VercelResponse): boolean {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '').split(',').map((o) => o.trim());
  const origin = req.headers.origin ?? '';
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  return false;
}

export function ok(res: VercelResponse, data: unknown, status = 200): void {
  res.status(status).json({ success: true, data });
}

export function err(res: VercelResponse, message: string, status = 400, details?: unknown): void {
  res.status(status).json({ success: false, error: message, ...(details ? { details } : {}) });
}

export function getClientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string') return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress ?? 'unknown';
}
