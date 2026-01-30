import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

function isAdminToken(token: string): boolean {
  try {
    // JWT dùng base64url nên cần chuyển sang base64 trước khi atob
    const base64Url = token.split('.')[1] || '';
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(base64Url.length / 4) * 4, '=');
    const payload = JSON.parse(atob(base64));
    return payload?.is_admin === 1 || payload?.is_admin === true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Bỏ qua API và static
  if (pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.startsWith('/static')) {
    return NextResponse.next();
  }

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const token = req.cookies.get('auth_token')?.value;
  const isAdmin = token ? isAdminToken(token) : false;

  // Đã đăng nhập admin mà truy cập /admin/login => chuyển sang dashboard
  if (pathname.startsWith('/admin/login')) {
    if (isAdmin) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/dashboard';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Các trang admin khác cần admin
  if (!isAdmin) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
