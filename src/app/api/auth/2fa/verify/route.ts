import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { getRedisConnection } from '@/lib/redis/redis';
import { cookies } from 'next/headers';
import {
  AUTH_TOKEN,
  REFRESH_TOKEN,
  generateAccessToken,
  generateRefreshToken,
} from '@/lib/auth/auth';
import { logSecurityEvent } from '@/lib/db/repositories/audit';
import { decrypt, hashEmail } from '@/lib/security/encryption';
import { ResponseWrapper } from '@/lib/api/api-response';

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
      return ResponseWrapper.error('Email and OTP are required', 400);
    }

    // Find user (Sử dụng Blind Index bằng email_hash)
    const emailHash = hashEmail(email);
    const users = await executeQuery<any[]>(
      'SELECT * FROM users WHERE email_hash = ? AND is_active = 1 AND is_banned = 0 AND deleted_at IS NULL',
      [emailHash]
    );

    if (users.length === 0) {
      return ResponseWrapper.unauthorized('Invalid credentials');
    }

    const user = users[0];
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

    // Verify OTP from Redis
    const redis = getRedisConnection();
    const key = `otp:login:${user.id}`;
    const storedOtp = await redis.get(key);

    if (!storedOtp || storedOtp !== otp.toString()) {
      await logSecurityEvent('login_failed', ip, user.id, {
        emailHash,
        reason: 'Invalid OTP for 2FA',
      });
      return ResponseWrapper.unauthorized('Mã OTP không hợp lệ hoặc đã hết hạn');
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

    await logSecurityEvent('login_success', ip, user.id, { emailHash, method: '2fa_email' });

    const authUser = {
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
    };

    return ResponseWrapper.success({ user: authUser }, 'Đăng nhập thành công');
  } catch (error) {
    console.error('2FA verify error:', error);
    return ResponseWrapper.serverError('OTP verification failed', error);
  }
}
