import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter } from './rate-limit';
import { logSecurityEvent } from './audit';

/**
 * Higher-order function to wrap API route handlers with Rate Limiting
 */
export function withRateLimit(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>,
  config: { tag: string; limit: number; windowMs: number }
) {
  return async (req: NextRequest, ...args: any[]) => {
    // 1. Get identifier (UserId if available, fallback to IP)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    let identifier = ip;
    const authCookie = req.cookies.get('token')?.value || req.cookies.get('admin_token')?.value;
    if (authCookie) {
      try {
        // Quick decode of JWT payload (middle part)
        const payload = JSON.parse(Buffer.from(authCookie.split('.')[1], 'base64').toString());
        if (payload.userId) identifier = `user:${payload.userId}`;
        else if (payload.id) identifier = `user:${payload.id}`;
      } catch (e) {
        // Fallback to IP if decoding fails
      }
    }

    // 2. Check rate limit
    const res = await RateLimiter.getInstance(config.tag).check(
      identifier,
      config.limit,
      config.windowMs
    );

    if (!res.success) {
      // Log rate limit hit
      await logSecurityEvent('rate_limit_hit', ip, null, {
        tag: config.tag,
        limit: config.limit,
        windowMs: config.windowMs,
      });

      const retryAfter = Math.ceil((res.reset - Date.now()) / 1000);
      return NextResponse.json(
        {
          success: false,
          message: 'Too many requests. Please try again later.',
          retryAfterSeconds: retryAfter > 0 ? retryAfter : 1,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter > 0 ? retryAfter : 1),
          },
        }
      );
    }

    // 3. Call original handler
    const response = await handler(req, ...args);

    // 4. Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', String(res.limit));
    response.headers.set('X-RateLimit-Remaining', String(res.remaining));
    response.headers.set('X-RateLimit-Reset', String(res.reset));

    return response;
  };
}
