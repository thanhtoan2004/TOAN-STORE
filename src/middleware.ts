/**
 * Next.js Edge Middleware.
 * Lớp phòng thủ ngoài cùng (First Line of Defense) của toàn bộ hệ thống.
 * Chạy Độc Lập ở server Edge Vercel TRƯỚC khi Request chạm vào Code API hay DB.
 */
import { NextResponse, NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProd = process.env.NODE_ENV === 'production';
  const response = NextResponse.next();

  /**
   * 1. Content-Security-Policy (CSP)
   * Ngăn chặn mã độc XSS (Cross-Site Scripting).
   * Cấm gọi script/ảnh/font từ các nguồn lạ ngoại trừ Google Fonts, Maps và CDN hợp lệ.
   */
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

  /**
   * 2. CSRF (Cross-Site Request Forgery) Protection cho các tác vụ thay đổi CSDL (POST, PUT, DELETE)
   * Sử dụng kĩ thuật Stateless: Bắt buộc request phải có Header `X-Requested-With: XMLHttpRequest`
   * hoặc Origin/Referer phải khớp chuẩn với Domain trang web. Các domain giả thư mục sẽ bị chặn đứng (Status 403).
   */
  if (pathname.startsWith('/api')) {
    const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (mutatingMethods.includes(req.method)) {
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
        console.log('[Middleware] Checking Admin Token...');
        const { jwtVerify } = await import('jose');
        const JWT_SECRET = process.env.JWT_SECRET || 'dev_fallback_secret_not_for_production';
        const secret = new TextEncoder().encode(JWT_SECRET);

        await jwtVerify(token, secret);
        console.log('[Middleware] Admin Token Verified ✅');
        isAdmin = true;
      } catch (e) {
        console.error('[Middleware] JWT Verify Error:', e);
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
