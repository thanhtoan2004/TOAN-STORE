import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth, AUTH_TOKEN, REFRESH_TOKEN } from '@/lib/auth/auth';
import { executeQuery } from '@/lib/db/mysql';
import { getRedisConnection } from '@/lib/redis/redis';

/**
 * API Đăng xuất khỏi tất cả các thiết bị.
 * Cơ chế:
 * 1. Tăng `token_version` trong Database để vô hiệu hóa toàn bộ Access Token và Refresh Token cũ ngay lập tức.
 * 2. Xóa Refresh Token trong Redis.
 */
export async function POST() {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.userId;

    // 1. Increment token_version in Database
    // This invalidates ALL existing tokens (both access and refresh)
    await executeQuery('UPDATE users SET token_version = token_version + 1 WHERE id = ?', [userId]);

    // 2. Clear Redis Refresh Token
    try {
      const redis = getRedisConnection();
      await redis.del(`refresh_token:${userId}`);
    } catch (e) {
      console.error('Redis error during logout-all:', e);
    }

    // 3. Clear Cookies for the current device
    const cookieStore = await cookies();
    cookieStore.delete(AUTH_TOKEN);
    cookieStore.delete(REFRESH_TOKEN);

    return NextResponse.json({
      success: true,
      message: 'Đã đăng xuất khỏi tất cả các thiết bị thành công.',
    });
  } catch (error) {
    console.error('Error in logout-all:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
