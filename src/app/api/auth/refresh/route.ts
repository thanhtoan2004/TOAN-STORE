import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  AUTH_TOKEN,
  REFRESH_TOKEN,
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} from '@/lib/auth/auth';
import { getRedisConnection } from '@/lib/redis/redis';
import { createErrorResponse } from '@/lib/api/api-utils';
import { executeQuery } from '@/lib/db/mysql';

/**
 * API Làm mới Token (Token Refresh).
 * Cơ chế bảo mật nâng cao:
 * 1. Token Rotation: Mỗi lần refresh sẽ cấp một cặp Token mới và thu hồi token cũ.
 * 2. Theft Detection: Nếu Refresh Token cũ được dùng lại, hệ thống sẽ coi là bị tấn công và hủy toàn bộ các phiên đăng nhập của người dùng đó.
 * 3. Token Versioning: Kiểm tra phiên bản token (tv) trong DB để hỗ trợ đăng xuất từ xa trên mọi thiết bị.
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(REFRESH_TOKEN)?.value;

    if (!refreshToken) {
      return createErrorResponse('No refresh token provided', 401, 'MISSING_REFRESH_TOKEN');
    }

    // 1. Verify JWT signature and expiration
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return createErrorResponse('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    // 2. Check against Redis (for revocation/rotation)
    let redisToken = null;
    try {
      const redis = getRedisConnection();
      redisToken = await redis.get(`refresh_token:${decoded.userId}`);
    } catch (error) {
      console.error('Redis error during token refresh:', error);
      // Fallback: If Redis is down, we trust the valid JWT for now
      redisToken = refreshToken;
    }

    if (redisToken !== refreshToken) {
      // Potential theft or reused token (Rotation breach)
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
      console.warn(`[SECURITY] Refresh token mismatch for user ${decoded.userId} from IP ${ip}`);

      // Revoke all tokens for this user as a precaution if Redis is up
      try {
        const redis = getRedisConnection();
        await redis.del(`refresh_token:${decoded.userId}`);
      } catch (e) {}

      return createErrorResponse('Token security breach detected', 401, 'SECURITY_BREACH');
    }

    // 3. Verify User and Token Version in Database
    const users = (await executeQuery(
      'SELECT id, email, is_active, token_version FROM users WHERE id = ? AND deleted_at IS NULL',
      [decoded.userId]
    )) as any[];

    if (users.length === 0 || !users[0].is_active) {
      return createErrorResponse('User not found or inactive', 401, 'USER_INACTIVE');
    }

    const user = users[0];

    // Security check: Verify token version matches database
    if (decoded.tv !== user.token_version) {
      return createErrorResponse('Session expired. Please log in again.', 401, 'SESSION_EXPIRED');
    }

    // 4. Generate New Tokens (Rotation)
    const payload = {
      userId: user.id,
      email: user.email,
      tv: user.token_version,
    };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    // 4. Update Redis
    try {
      const redis = getRedisConnection();
      await redis.set(`refresh_token:${decoded.userId}`, newRefreshToken, 'EX', 7 * 24 * 60 * 60);
    } catch (error) {}

    // 5. Set Cookies
    const isProd = process.env.NODE_ENV === 'production';

    cookieStore.set(AUTH_TOKEN, newAccessToken, {
      httpOnly: true,
      path: '/',
      secure: isProd,
      maxAge: 15 * 60,
      sameSite: 'strict',
    });

    cookieStore.set(REFRESH_TOKEN, newRefreshToken, {
      httpOnly: true,
      path: '/',
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'strict',
    });

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    console.error('Error in token refresh:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
