import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { getRedisConnection } from '@/lib/redis';
import { cookies } from 'next/headers';
import { AUTH_TOKEN, REFRESH_TOKEN, generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { logSecurityEvent } from '@/lib/audit';
import { decrypt } from '@/lib/encryption';

/**
 * API Xác thực mã OTP và hoàn tất đăng nhập.
 * Chốt chặn bảo mật:
 * - So khớp mã OTP từ Redis.
 * - Nếu khớp, tiến hành xóa mã OTP ngay lập tức (Single Use).
 * - Cấp phát bộ đôi JWT (Access & Refresh Token) tương tự luồng login thông thường.
 * - Ghi nhật ký sự kiện bảo mật (Security Event) để theo dõi lịch sử truy cập.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Find user
    const users = await executeQuery<any[]>(
      'SELECT * FROM users WHERE email = ? AND is_active = 1 AND is_banned = 0 AND deleted_at IS NULL',
      [email]
    );

    if (users.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
    }

    const user = users[0];
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

    // Verify OTP from Redis
    const redis = getRedisConnection();
    const key = `otp:login:${user.id}`;
    const storedOtp = await redis.get(key);

    if (!storedOtp || storedOtp !== otp.toString()) {
      await logSecurityEvent('login_failed', ip, user.id, { email, reason: 'Invalid OTP for 2FA' });
      return NextResponse.json(
        { success: false, message: 'Mã OTP không hợp lệ hoặc đã hết hạn' },
        { status: 401 }
      );
    }

    // OTP verified — delete it
    await redis.del(key);

    // Generate tokens (same as login route)
    const payload = {
      userId: user.id,
      email: user.email,
      tv: user.token_version,
    };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store refresh token in Redis
    try {
      await redis.set(`refresh_token:${user.id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);
    } catch (e) {
      /* continue */
    }

    // Set cookies
    const cookieStore = await cookies();
    const isProd = process.env.NODE_ENV === 'production';

    cookieStore.set(AUTH_TOKEN, accessToken, {
      httpOnly: true,
      path: '/',
      secure: isProd,
      maxAge: 15 * 60,
      sameSite: 'strict',
    });

    cookieStore.set(REFRESH_TOKEN, refreshToken, {
      httpOnly: true,
      path: '/',
      secure: isProd,
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'strict',
    });

    await logSecurityEvent('login_success', ip, user.id, { email, method: '2fa_email' });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone:
          user.is_encrypted && user.phone_encrypted
            ? decrypt(user.phone_encrypted)
            : user.phone !== '***'
              ? user.phone || ''
              : '',
        dateOfBirth: user.date_of_birth,
        gender: user.gender,
        isActive: user.is_active,
        isVerified: user.is_verified,
      },
    });
  } catch (error) {
    console.error('2FA verify error:', error);
    return NextResponse.json(
      { success: false, message: 'OTP verification failed' },
      { status: 500 }
    );
  }
}
