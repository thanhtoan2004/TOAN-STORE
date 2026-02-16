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

  // Check if user is banned
  const isBanned = user.is_banned === 1 || user.is_banned === '1' || user.is_banned === true;

  if (isBanned) {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
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
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
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
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    await logSecurityEvent('login_failed', ip, user.id, { email, reason: 'Invalid password' });
    return createErrorResponse('Email hoặc mật khẩu không chính xác', 401, 'INVALID_CREDENTIALS');
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
    // Key: refresh_token:user_id, Value: token
    // Expires in 7 days (matching JWT expiration)
    await redis.set(`refresh_token:${user.id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);
  } catch (error) {
    console.error('Error storing refresh token in Redis:', error);
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
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  await logSecurityEvent('login_success', ip, user.id, { email });

  return NextResponse.json(response);
}

// Apply Rate Limit and Error Handling
export const POST = withRateLimit(withErrorHandling(loginHandler), {
  tag: 'auth',
  limit: 10,
  windowMs: 60 * 1000,
});