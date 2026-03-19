import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { adminUsers as adminUsersTable, roles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getRedisConnection } from '@/lib/redis/redis';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { ADMIN_TOKEN, getJwtSecret } from '@/lib/auth/auth';
import { logSecurityEvent } from '@/lib/db/repositories/audit';
import { verifyTOTPToken } from '@/lib/auth/totp';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Xác thực bước 2 cho nhân viên quản trị (Admin 2FA).
 * Hỗ trợ hai phương thức xác thực:
 * 1. TOTP: Sử dụng mã 6 số từ ứng dụng lưu khóa (Google Authenticator).
 * 2. Email OTP: Sử dụng mã 6 số được gửi qua email (Lưu trữ tạm thời trong Redis).
 */
export async function POST(request: NextRequest) {
  try {
    const { adminId, otp } = await request.json();

    if (!adminId || !otp) {
      return ResponseWrapper.error('Admin ID and OTP are required', 400);
    }

    // Find admin user
    const [user] = await db
      .select({
        id: adminUsersTable.id,
        email: adminUsersTable.email,
        isActive: adminUsersTable.isActive,
        fullName: adminUsersTable.fullName,
        twoFactorSecret: adminUsersTable.twoFactorSecret,
        twoFactorType: adminUsersTable.twoFactorType,
      })
      .from(adminUsersTable)
      .where(eq(adminUsersTable.id, Number(adminId)))
      .limit(1);

    if (!user || user.isActive === 0) {
      return ResponseWrapper.unauthorized('Invalid administrative account');
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

    let isTokenValid = false;

    if (user.twoFactorType === 'totp') {
      // 1. Verify TOTP (Authenticator App)
      if (user.twoFactorSecret) {
        isTokenValid = verifyTOTPToken(otp, user.twoFactorSecret);
      }
    } else {
      // 2. Verify Email OTP (Redis)
      const redis = getRedisConnection();
      const key = `otp:admin_login:${user.id}`;
      const storedOtp = await redis.get(key);

      if (storedOtp && storedOtp === otp.toString()) {
        isTokenValid = true;
        await redis.del(key);
      }
    }

    if (!isTokenValid) {
      await logSecurityEvent(
        'admin_2fa_failed',
        ip,
        null,
        {
          reason: 'Invalid Admin 2FA Code',
          method: user.twoFactorType,
        },
        user.id
      );
      return ResponseWrapper.unauthorized('Mã xác thực không hợp lệ hoặc đã hết hạn');
    }

    // Generate Admin Token
    const token = jwt.sign({ userId: user.id, email: user.email }, getJwtSecret(), {
      expiresIn: '7d',
      issuer: 'toan-store',
      audience: 'admin',
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_TOKEN, token, {
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'strict',
    });

    await logSecurityEvent(
      'admin_login_success',
      ip,
      null,
      { method: user.twoFactorType },
      user.id
    );

    const adminData = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      firstName: user.fullName?.split(' ')[0] || '',
      lastName: user.fullName?.split(' ').slice(1).join(' ') || '',
    };

    return ResponseWrapper.success({ user: adminData });
  } catch (error) {
    console.error('Admin 2FA verify error:', error);
    return ResponseWrapper.serverError('Internal server error during 2FA verification', error);
  }
}
