import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Security Headers ──────────────────────────────────────────────────────────

export function setSecurityHeaders(res: VercelResponse): void {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com;",
  );
}

// ─── CORS ─────────────────────────────────────────────────────────────────────

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

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true; // preflight handled
  }
  return false;
}

// ─── Standard Response Helpers ────────────────────────────────────────────────

export function ok(res: VercelResponse, data: unknown, status = 200): void {
  res.status(status).json({ success: true, data });
}

export function err(res: VercelResponse, message: string, status = 400, details?: unknown): void {
  res.status(status).json({ success: false, error: message, ...(details ? { details } : {}) });
}

// ─── IP Extraction ────────────────────────────────────────────────────────────

export function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress ?? 'unknown';
}
