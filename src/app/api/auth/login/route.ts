import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { db } from '@/lib/db/drizzle';
import { users as usersTable } from '@/lib/db/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { validateRequiredFields, withErrorHandling } from '@/lib/api/api-utils';
import { User, LoginRequest, AuthResponse } from '@/types/auth';
import {
  AUTH_TOKEN,
  REFRESH_TOKEN,
  generateAccessToken,
  generateRefreshToken,
} from '@/lib/auth/auth';
import { withRateLimit } from '@/lib/api/with-rate-limit';
import { logSecurityEvent } from '@/lib/db/repositories/audit';
import { getRedisConnection } from '@/lib/redis/redis';
import { decrypt, hashEmail } from '@/lib/security/encryption';
import { IpBlocklistRepository } from '@/lib/db/repositories/ip-blocklist';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Xử lý Đăng nhập người dùng.
 * Quy trình bảo mật 5 lớp:
 * 1. Validate định dạng Email/Password.
 * 2. Rate Limit: Giới hạn 10 request/phút mỗi IP để chống brute-force.
 * 3. Redis Account Lockout: Khóa tài khoản 15 phút nếu sai mật khẩu 5 lần.
 * 4. Kiểm tra trạng thái: Banned (Bị chặn), Active (Kích hoạt), Deleted (Đã xóa).
 * 5. Check 2FA: Nếu bật, yêu cầu xác thực OTP trước khi cấp Token.
 */
async function loginHandler(req: Request): Promise<NextResponse> {
  let body: Partial<LoginRequest>;
  try {
    body = await req.json();
  } catch (err) {
    return ResponseWrapper.error('Dữ liệu yêu cầu không hợp lệ.', 400);
  }
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

  // 0. Check if IP is blocked
  const isIpBlocked = await IpBlocklistRepository.isBlocked(ip);
  if (isIpBlocked) {
    return ResponseWrapper.forbidden('Địa chỉ IP của bạn tạm thời bị chặn do hoạt động nghi vấn.');
  }

  // Validate required fields
  const validation = validateRequiredFields(body, ['email', 'password']);
  if (!validation.isValid) {
    return ResponseWrapper.error(validation.error, 400);
  }

  const { email, password } = body as LoginRequest;

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return ResponseWrapper.error('Email không hợp lệ', 400);
  }

  // Validate password length
  if (password.length < 6) {
    return ResponseWrapper.error('Mật khẩu phải có ít nhất 6 ký tự', 400);
  }

  // Find user by email hash (Blind Index)
  const emailHash = hashEmail(email);
  const users = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.emailHash, emailHash), isNull(usersTable.deletedAt)));

  if (users.length === 0) {
    await logSecurityEvent('login_failed', ip, null, { emailHash, reason: 'User not found' });
    return ResponseWrapper.unauthorized('Email hoặc mật khẩu không chính xác');
  }

  const user = users[0];
  const realEmail =
    user.isEncrypted && user.emailEncrypted ? decrypt(user.emailEncrypted) : (user.email ?? '');

  // Account lockout check (Redis-backed, 5 attempts, 15 min lockout)
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_SECONDS = 15 * 60; // 15 minutes
  const lockoutKey = `login_attempts:${user.id}`;
  let currentAttempts = 0;

  try {
    const redis = getRedisConnection();
    const attempts = await redis.get(lockoutKey);
    currentAttempts = parseInt(attempts || '0');

    if (
      currentAttempts >= MAX_ATTEMPTS ||
      (user.lockoutUntil && new Date(user.lockoutUntil) > new Date())
    ) {
      const ttl = await redis.ttl(lockoutKey);
      const minutesLeft = Math.ceil(ttl / 60) || 15;
      await logSecurityEvent('login_failed', ip, user.id, {
        emailHash,
        attempts: currentAttempts,
        reason: 'Account locked',
      });
      return ResponseWrapper.error(
        `Tài khoản tạm khóa do đăng nhập sai quá nhiều. Vui lòng thử lại sau ${minutesLeft} phút.`,
        429
      );
    }
  } catch (e) {
    // Redis unavailable — skip lockout check (fail-open for login)
  }

  // Check if user is banned
  const isBanned =
    user.isBanned === 1 || (user.isBanned as any) === '1' || user.isBanned === (true as any);

  if (isBanned) {
    await logSecurityEvent('login_failed', ip, user.id, { emailHash, reason: 'Account banned' });
    return ResponseWrapper.forbidden(
      'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin để được hỗ trợ.'
    );
  }

  // Check if user is active
  const isActive =
    user.isActive === 1 || (user.isActive as any) === '1' || user.isActive === (true as any);
  if (!isActive) {
    await logSecurityEvent('login_failed', ip, user.id, { emailHash, reason: 'Account inactive' });
    return ResponseWrapper.forbidden(
      'Tài khoản của bạn chưa được kích hoạt. Vui lòng kiểm tra email hoặc liên hệ admin.'
    );
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password ?? '');

  if (!isPasswordValid) {
    // Increment failed attempts in Redis
    try {
      const redis = getRedisConnection();
      const newAttempts = await redis.incr(lockoutKey);
      if (newAttempts === 1) {
        await redis.expire(lockoutKey, LOCKOUT_SECONDS);
      }

      // PERSISTENT LOCKOUT in DB
      if (newAttempts >= MAX_ATTEMPTS) {
        await db
          .update(usersTable)
          .set({
            failedLoginAttempts: newAttempts,
            lockoutUntil: sql`DATE_ADD(NOW(), INTERVAL 15 MINUTE)`,
          })
          .where(eq(usersTable.id, user.id));
      } else {
        await db
          .update(usersTable)
          .set({ failedLoginAttempts: newAttempts })
          .where(eq(usersTable.id, user.id));
      }

      const remaining = MAX_ATTEMPTS - newAttempts;
      await logSecurityEvent('login_failed', ip, user.id, {
        emailHash,
        reason: 'Invalid password',
        attempts: newAttempts,
      });
      if (newAttempts >= MAX_ATTEMPTS) {
        // Automatically block IP if they reach MAX_ATTEMPTS on a single account
        // Higher threshold for IP block vs account lockout
        if (newAttempts >= MAX_ATTEMPTS * 2) {
          await IpBlocklistRepository.blockIp(ip, `Brute-force attempt on account: ${email}`, 120); // Block for 2 hours
        }
        return ResponseWrapper.error(
          `Tài khoản tạm khóa do đăng nhập sai quá nhiều. Vui lòng thử lại sau 15 phút.`,
          429
        );
      }
    } catch (e) {
      await logSecurityEvent('login_failed', ip, user.id, {
        emailHash,
        reason: 'Invalid password',
      });
      return ResponseWrapper.unauthorized('Email hoặc mật khẩu không chính xác');
    }
  }

  // Clear failed attempts on successful login
  try {
    const redis = getRedisConnection();
    await redis.del(lockoutKey);
    await db
      .update(usersTable)
      .set({ failedLoginAttempts: 0, lockoutUntil: null })
      .where(eq(usersTable.id, user.id));
  } catch (e) {
    /* ignore */
  }

  // Check 2FA
  const userAny = user as any;
  const is2FAEnabled =
    userAny.two_factor_enabled === 1 ||
    userAny.two_factor_enabled === '1' ||
    userAny.two_factor_enabled === true;

  if (is2FAEnabled) {
    return ResponseWrapper.success(
      {
        requires2FA: true,
        email: realEmail,
      },
      'Vui lòng xác thực 2 bước'
    );
  }

  // Generate Tokens
  const payload = {
    userId: user.id,
    email: realEmail,
    tv: user.tokenVersion ?? 1, // Token Version
  };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store Refresh Token in Redis (for revocation and blacklist)
  try {
    const redis = getRedisConnection();
    const userAgent = (req as any).headers?.get('user-agent') || 'Unknown';
    const sessionId = crypto.randomUUID();

    // Phân tích trình duyệt và hệ điều hành từ User-Agent
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
    const browser =
      userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/)?.[0] || 'Unknown Browser';
    const os =
      userAgent.match(/(Windows NT|Mac OS X|Linux|Android|iOS)[\s\/]?[\d._]*/)?.[0] || 'Unknown OS';

    // Key: refresh_token:user_id, Value: token — Expires in 7 days
    await redis.set(`refresh_token:${user.id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);

    // Lưu metadata phiên đăng nhập (Device Management)
    const sessionData = JSON.stringify({
      sessionId,
      ip,
      device: isMobile ? 'Mobile' : 'Desktop',
      browser,
      os,
      loginAt: Date.now(),
    });
    const sessionsKey = `sessions:${user.id}`;
    await redis.hset(sessionsKey, sessionId, sessionData);
    await redis.expire(sessionsKey, 7 * 24 * 60 * 60); // 7 days

    // Giới hạn tối đa 10 phiên, xóa phiên cũ nhất nếu vượt quá
    const allSessions = await redis.hgetall(sessionsKey);
    if (allSessions && Object.keys(allSessions).length > 10) {
      const entries = Object.entries(allSessions).map(([id, val]) => ({
        id,
        loginAt: (() => {
          try {
            return JSON.parse(val as string).loginAt || 0;
          } catch {
            return 0;
          }
        })(),
      }));
      entries.sort((a, b) => a.loginAt - b.loginAt);
      await redis.hdel(sessionsKey, entries[0].id);
    }
  } catch (error) {
    console.error('Error storing session in Redis:', error);
    // Continue even if Redis fails (fallback to stateless JWT)
  }

  // Set cookies
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === 'production';

  // Access Token Cookie
  cookieStore.set(AUTH_TOKEN, accessToken, {
    httpOnly: true,
    path: '/',
    secure: isProd,
    maxAge: 15 * 60, // 15 minutes
    sameSite: 'strict',
  });

  // Refresh Token Cookie
  cookieStore.set(REFRESH_TOKEN, refreshToken, {
    httpOnly: true,
    path: '/',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60, // 7 days
    sameSite: 'strict',
  });

  // Map snake_case to camelCase for frontend
  const authUser = {
    id: user.id,
    email: realEmail,
    firstName: user.firstName,
    lastName: user.lastName,
    phone:
      (user as any).isEncrypted && (user as any).phoneEncrypted
        ? decrypt((user as any).phoneEncrypted)
        : (user as any).phone !== '***'
          ? (user as any).phone
          : '',
    dateOfBirth:
      (user as any).isEncrypted && (user as any).dateOfBirthEncrypted
        ? decrypt((user as any).dateOfBirthEncrypted)
        : user.dateOfBirth,
    gender: user.gender,
    isActive: user.isActive,
    isVerified: user.isVerified,
  };

  // Success
  // Fire and forget security event logging (non-blocking)
  logSecurityEvent('login_success', ip, user.id, { emailHash }).catch((err) =>
    console.error('Failed to log login success:', err)
  );

  // Gửi Email Cảnh báo Đăng nhập Mới (Chạy ngầm hoàn toàn không block request)
  (async () => {
    try {
      const { sendNewLoginEmail } = await import('@/lib/mail/email-templates');
      const device = req.headers.get('user-agent') || 'Thiết bị không xác định';
      const time = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      await sendNewLoginEmail(
        realEmail,
        user.firstName || 'bạn',
        time,
        ip,
        'Theo địa chỉ IP (Vietnam)',
        device
      );
    } catch (error) {
      console.warn('Could not send login alert email:', error);
    }
  })();

  return ResponseWrapper.success({ user: authUser }, 'Đăng nhập thành công');
}

// Apply Rate Limit and Error Handling
export const POST = withRateLimit(withErrorHandling(loginHandler), {
  tag: 'auth',
  limit: 10,
  windowMs: 60 * 1000,
});
