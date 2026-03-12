import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_TOKEN, REFRESH_TOKEN, verifyAuth, verifyRefreshToken } from '@/lib/auth/auth';
import { getRedisConnection } from '@/lib/redis/redis';

/**
 * API Đăng xuất người dùng.
 * Quy trình:
 * 1. Thu hồi (revoke) Refresh Token trong Redis để ngăn chặn việc tái sử dụng.
 * 2. Xóa các Cookie định danh (Access Token, Refresh Token, Admin Session).
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(REFRESH_TOKEN)?.value;

    // Attempt to identify user to revoke in Redis
    let userId = null;
    if (refreshToken) {
      const decoded = verifyRefreshToken(refreshToken);
      if (decoded) userId = decoded.userId;
    }

    if (!userId) {
      const auth = await verifyAuth();
      if (auth) userId = auth.userId;
    }

    // 1. Revoke in Redis
    if (userId) {
      try {
        const redis = getRedisConnection();
        await redis.del(`refresh_token:${userId}`);
        console.log(`[AUTH] Refresh token revoked for user ${userId}`);
      } catch (error) {}
    }

    // 2. Clear Cookies
    cookieStore.delete(AUTH_TOKEN);
    cookieStore.delete(REFRESH_TOKEN);
    cookieStore.delete('toan_admin_session');

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
