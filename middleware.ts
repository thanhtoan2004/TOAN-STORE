import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

function verifyIsAdmin(token: string): boolean {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded?.is_admin === 1 || decoded?.is_admin === true;
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

  const token = req.cookies.get('nike_admin_session')?.value;
  const isAdmin = token ? verifyIsAdmin(token) : false;

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
