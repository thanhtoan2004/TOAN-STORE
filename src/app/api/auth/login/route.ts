import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { executeQuery } from '@/lib/db/mysql';
import { createErrorResponse, validateRequiredFields, withErrorHandling } from '@/lib/api-utils';
import { User, LoginRequest, AuthResponse } from '@/types/auth';
import { AUTH_TOKEN, REFRESH_TOKEN, generateAccessToken, generateRefreshToken } from '@/lib/auth';
import { withRateLimit } from '@/lib/with-rate-limit';
import { logSecurityEvent } from '@/lib/audit';
import { getRedisConnection } from '@/lib/redis';
import { decrypt } from '@/lib/encryption';

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
  const body: Partial<LoginRequest> = await req.json();

  // Validate required fields
  const validation = validateRequiredFields(body, ['email', 'password']);
  if (!validation.isValid) {
    return createErrorResponse(validation.error, 400, 'VALIDATION_ERROR');
  }

  const { email, password } = body as LoginRequest;

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return createErrorResponse('Email không hợp lệ', 400, 'INVALID_EMAIL');
  }

  // Validate password length
  if (password.length < 6) {
    return createErrorResponse('Mật khẩu phải có ít nhất 6 ký tự', 400, 'INVALID_PASSWORD');
  }

  // Find user by email
  const users = await executeQuery(
    'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL',
    [email]
  ) as User[];

  if (users.length === 0) {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logSecurityEvent('login_failed', ip, null, { email, reason: 'User not found' });
    return createErrorResponse('Email hoặc mật khẩu không chính xác', 401, 'INVALID_CREDENTIALS');
  }

  const user = users[0];
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

  // Account lockout check (Redis-backed, 5 attempts, 15 min lockout)
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_SECONDS = 15 * 60; // 15 minutes
  const lockoutKey = `login_attempts:${user.id}`;
  let currentAttempts = 0;

  try {
    const redis = getRedisConnection();
    const attempts = await redis.get(lockoutKey);
    currentAttempts = parseInt(attempts || '0');

    if (currentAttempts >= MAX_ATTEMPTS) {
      const ttl = await redis.ttl(lockoutKey);
      const minutesLeft = Math.ceil(ttl / 60);
      await logSecurityEvent('login_failed', ip, user.id, { email, attempts: currentAttempts, reason: 'Account locked' });
      return createErrorResponse(
        `Tài khoản tạm khóa do đăng nhập sai quá nhiều. Vui lòng thử lại sau ${minutesLeft} phút.`,
        429,
        'ACCOUNT_LOCKED'
      );
    }
  } catch (e) {
    // Redis unavailable — skip lockout check (fail-open for login)
  }

  // Check if user is banned
  const isBanned = user.is_banned === 1 || user.is_banned === '1' || user.is_banned === true;

  if (isBanned) {
    await logSecurityEvent('login_failed', ip, user.id, { email, reason: 'Account banned' });
    return createErrorResponse(
      'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin để được hỗ trợ.',
      403,
      'ACCOUNT_BANNED'
    );
  }

  // Check if user is active
  const isActive = user.is_active === 1 || user.is_active === '1' || user.is_active === true;
  if (!isActive) {
    await logSecurityEvent('login_failed', ip, user.id, { email, reason: 'Account inactive' });
    return createErrorResponse(
      'Tài khoản của bạn chưa được kích hoạt. Vui lòng kiểm tra email hoặc liên hệ admin.',
      403,
      'ACCOUNT_INACTIVE'
    );
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    // Increment failed attempts in Redis
    try {
      const redis = getRedisConnection();
      const newAttempts = await redis.incr(lockoutKey);
      if (newAttempts === 1) {
        await redis.expire(lockoutKey, LOCKOUT_SECONDS);
      }
      const remaining = MAX_ATTEMPTS - newAttempts;
      await logSecurityEvent('login_failed', ip, user.id, { email, reason: 'Invalid password', attempts: newAttempts });
      if (remaining > 0) {
        return createErrorResponse(
          `Email hoặc mật khẩu không chính xác. Còn ${remaining} lần thử.`,
          401,
          'INVALID_CREDENTIALS'
        );
      } else {
        return createErrorResponse(
          `Tài khoản tạm khóa do đăng nhập sai quá nhiều. Vui lòng thử lại sau 15 phút.`,
          429,
          'ACCOUNT_LOCKED'
        );
      }
    } catch (e) {
      await logSecurityEvent('login_failed', ip, user.id, { email, reason: 'Invalid password' });
      return createErrorResponse('Email hoặc mật khẩu không chính xác', 401, 'INVALID_CREDENTIALS');
    }
  }

  // Clear failed attempts on successful login
  try {
    const redis = getRedisConnection();
    await redis.del(lockoutKey);
  } catch (e) { /* ignore */ }

  // Check 2FA
  const userAny = user as any;
  const is2FAEnabled = userAny.two_factor_enabled === 1 || userAny.two_factor_enabled === '1' || userAny.two_factor_enabled === true;

  if (is2FAEnabled) {
    return NextResponse.json({
      success: true,
      requires2FA: true,
      email: user.email,
      message: 'Vui lòng xác thực 2 bước'
    });
  }

  // Generate Tokens
  const payload = {
    userId: user.id,
    email: user.email,
    is_admin: user.is_admin === 1 || user.is_admin === '1' || user.is_admin === true,
    tv: user.token_version // Token Version
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
    const browser = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/)?.[0] || 'Unknown Browser';
    const os = userAgent.match(/(Windows NT|Mac OS X|Linux|Android|iOS)[\s\/]?[\d._]*/)?.[0] || 'Unknown OS';

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
        loginAt: (() => { try { return JSON.parse(val as string).loginAt || 0; } catch { return 0; } })()
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
    sameSite: 'strict'
  });

  // Refresh Token Cookie
  cookieStore.set(REFRESH_TOKEN, refreshToken, {
    httpOnly: true,
    path: '/',
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60, // 7 days
    sameSite: 'strict'
  });

  // Map snake_case to camelCase for frontend
  const response: AuthResponse = {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: decrypt(user.phone || ''),
      dateOfBirth: user.date_of_birth,
      gender: user.gender,
      isActive: user.is_active,
      isVerified: user.is_verified,
      is_admin: user.is_admin
    } as any
  };

  // Success
  // Fire and forget security event logging (non-blocking)
  logSecurityEvent('login_success', ip, user.id, { email }).catch(err => console.error('Failed to log login success:', err));

  // Gửi Email Cảnh báo Đăng nhập Mới (Chạy ngầm hoàn toàn không block request)
  (async () => {
    try {
      const { sendNewLoginEmail } = await import('@/lib/email-templates');
      const device = req.headers.get('user-agent') || 'Thiết bị không xác định';
      const time = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      await sendNewLoginEmail(
        user.email,
        user.first_name || 'bạn',
        time,
        ip,
        'Theo địa chỉ IP (Vietnam)',
        device
      );
    } catch (error) {
      console.warn('Could not send login alert email:', error);
    }
  })();

  return NextResponse.json(response);
}

// Apply Rate Limit and Error Handling
export const POST = withRateLimit(withErrorHandling(loginHandler), {
  tag: 'auth',
  limit: 10,
  windowMs: 60 * 1000,
});
