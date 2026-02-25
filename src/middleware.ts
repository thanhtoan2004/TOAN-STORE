/**
 * Next.js Edge Middleware.
 * Lớp phòng thủ ngoài cùng (First Line of Defense) của toàn bộ hệ thống.
 * Chạy Độc Lập ở server Edge Vercel TRƯỚC khi Request chạm vào Code API hay DB.
 */
import { NextResponse, NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProd = process.env.NODE_ENV === 'production';
  const response = NextResponse.next();

  /**
   * 1. Content-Security-Policy (CSP) - Enterprise Hardened
   * Loại bỏ unsafe-eval ở Production để chống XSS tuyệt đối.
   * Chỉ cho phép unsafe-inline ở Next.js dev mode hoặc style.
   */
  const cspHeader = `
    default-src 'self';
    script-src 'self' ${isProd ? '' : "'unsafe-inline' 'unsafe-eval'"} https://maps.googleapis.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: https: blob:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://maps.googleapis.com https://api.toanstore.com;
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

  // Anti Spectre-type attacks
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless'); // Dùng credentialless thay vì require-corp để Next.js load ảnh ngoài bình thường
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  if (isProd) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // --- IP Logging System (Edge) ---
  // @ts-ignore: req.ip is available in Vercel Edge environment even if TS misses it
  const clientIp = req.ip || req.headers.get('x-forwarded-for')?.split(',')[0] || 'Unknown IP';
  if (pathname.startsWith('/api/') && !isProd) {
    // Chỉ log ở Dev để tránh tràn RAM Edge ở Production
    // console.log(`[Edge] Request IP: ${clientIp} -> ${req.method} ${pathname}`);
  }

  /**
   * 2. CSRF (Cross-Site Request Forgery) Protection - Strict Target
   * Chặn tuyệt đối các domain giả mạo chữ ký. (Ví dụ: evil-toanstore.com)
   */
  if (pathname.startsWith('/api')) {
    const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (mutatingMethods.includes(req.method)) {
      const requestedWith = req.headers.get('x-requested-with');
      const origin = req.headers.get('origin');

      // Lấy domain gốc chuẩn từ biến môi trường
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      // So sánh Tuyệt Đối (===) thay vì includes() để tránh lách luật bằng tên miền phụ
      const isOriginSafe = origin === appUrl;

      // CSRF Enterprise Hardened: Chỉ dựa vào Origin + SameSite cookie ở Production
      // BỎ bypass bằng X-Requested-With (isAjaxCheck) vì header này dễ bị fake
      if (isProd) {
        if (!origin || origin !== appUrl) {
          return new NextResponse(
            JSON.stringify({ success: false, message: 'Strict CSRF protection triggered' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
    }
  }

  // --- 3. Admin Authentication Logic ---
  // Rất quan trọng: Bỏ qua các route /admin/api để tránh gây lỗi Redirect loop trên API trả về JSON
  // Trick tối ưu Edge CPU: Chỉ Parse/Verify JWT nếu request yêu cầu nhận HTML (Người dùng duyệt web).
  // Các file ảnh, css, js tĩnh bên trong /admin sẽ không kích hoạt hàm bảo mật nặng nề này.
  const acceptHeader = req.headers.get('accept') || '';
  const isHtmlRequest = req.method === 'GET' && acceptHeader.includes('text/html');
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/api') && isHtmlRequest) {
    const token = req.cookies.get('nike_admin_session')?.value;

    // IP Whitelisting for Admin panel
    const ipWhitelist = process.env.ADMIN_IP_WHITELIST;
    if (ipWhitelist) {
      const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || req.headers.get('x-real-ip')
        || '127.0.0.1';
      const allowedIps = ipWhitelist.split(',').map(ip => ip.trim());
      if (!allowedIps.includes(clientIp) && clientIp !== '127.0.0.1' && clientIp !== '::1') {
        return new NextResponse('Access Denied: Your IP is not whitelisted for admin access.', { status: 403 });
      }
    }

    // Verify the JWT rigidly with Issuers
    let isAdmin = false;
    if (token) {
      try {
        const secretKey = process.env.JWT_SECRET;
        if (!secretKey && isProd) {
          throw new Error('JWT_SECRET is missing in production');
        }

        const JWT_SECRET = secretKey || 'dev_fallback_secret_not_for_production';
        const secret = new TextEncoder().encode(JWT_SECRET);

        await jwtVerify(token, secret, {
          issuer: 'toan-store',
          audience: 'admin',
          maxTokenAge: '1d'
        });

        isAdmin = true;
      } catch (e) {
        // Tắt console.log lỗi ở Edge server production để tiết kiệm CPU/RAM
        if (!isProd) {
          console.error('[Middleware] Admin JWT Verify Error:', e);
        }
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

  // --- 4. User Authentication Logic ---
  // A. Chặn người dùng đã đăng nhập truy cập lại các trang Auth
  const authRoutes = ['/sign-in', '/sign-up', '/forgot-password', '/reset-password'];
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
  const userSession = req.cookies.get('nike_auth_session')?.value;

  if (isAuthRoute && userSession) {
    // Đã có cookie đăng nhập -> Cưỡng chế đá về trang chủ
    const url = req.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // B. Bảo vệ các trang Cá nhân (Private Routes) - Yêu cầu phải đăng nhập
  const privateRoutes = ['/account', '/checkout', '/orders', '/wishlist'];
  const isPrivateRoute = privateRoutes.some(route => pathname.startsWith(route));

  if (isPrivateRoute && !userSession) {
    // Chưa đăng nhập mà cố vào trang cá nhân -> Đá ra trang login
    const url = req.nextUrl.clone();
    url.pathname = '/sign-in';
    // Lưu lại trang đích để sau khi login xong quay lại (tuỳ chọn)
    url.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(url);
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
