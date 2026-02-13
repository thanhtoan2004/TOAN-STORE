import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProd = process.env.NODE_ENV === 'production';
  const response = NextResponse.next();

  // --- 1. Security Headers (Apply to ALL responses, including API) ---
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https: blob:;
    font-src 'self' https://fonts.gstatic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    ${isProd ? 'upgrade-insecure-requests;' : ''}
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

  if (isProd) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // --- 2. CSRF Protection for API (Mutating Methods) ---
  if (pathname.startsWith('/api')) {
    const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (mutatingMethods.includes(req.method)) {
      // Stateless CSRF Protection: Check for custom header
      // Browsers don't allow cross-origin requests to add custom headers without CORS preflight
      const requestedWith = req.headers.get('x-requested-with');
      const origin = req.headers.get('origin');
      const host = req.headers.get('host');

      // Simple check: Must have X-Requested-With OR Origin must match Host
      const isSafe = requestedWith === 'XMLHttpRequest' || (origin && origin.includes(host || ''));

      if (!isSafe && isProd) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Potential CSRF attack detected' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
  }

  // --- 3. Admin Authentication Logic ---
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get('nike_admin_session')?.value;

    // FIX H2: Actually verify the JWT instead of just checking existence
    let isAdmin = false;
    if (token) {
      try {
        const jwt = await import('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'dev_fallback_secret_not_for_production';
        jwt.default.verify(token, JWT_SECRET);
        isAdmin = true;
      } catch {
        // Invalid/expired token - treat as unauthenticated
        isAdmin = false;
      }
    }

    // Already logged in admin -> redirect to dashboard
    if (pathname.startsWith('/admin/login') && isAdmin) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/dashboard';
      return NextResponse.redirect(url);
    }

    // Not logged in -> redirect to login (Only for non-login pages)
    if (!pathname.startsWith('/admin/login') && !isAdmin) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
