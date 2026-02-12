import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { executeQuery } from '@/lib/db/mysql';
import { createErrorResponse, createSuccessResponse, validateRequiredFields, withErrorHandling } from '@/lib/api-utils';
import { User, UserWithoutPassword, LoginRequest, AuthResponse } from '@/types/auth';
import { AUTH_TOKEN } from '@/lib/auth';

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
    'SELECT * FROM users WHERE email = ?',
    [email]
  ) as User[];

  if (users.length === 0) {
    return createErrorResponse('Email hoặc mật khẩu không chính xác', 401, 'INVALID_CREDENTIALS');
  }

  const user = users[0];

  // Check if user is banned (handle different types: 1, "1", true)
  const isBanned = user.is_banned === 1 || user.is_banned === '1' || user.is_banned === true;


  if (isBanned) {
    return createErrorResponse(
      'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin để được hỗ trợ.',
      403,
      'ACCOUNT_BANNED'
    );
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return createErrorResponse('Email hoặc mật khẩu không chính xác', 401, 'INVALID_CREDENTIALS');
  }

  // Generate JWT token
  const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';

  const token = jwt.sign(
    { userId: user.id, email: user.email, is_admin: user.is_admin },
    jwtSecret,
    { expiresIn: '7d' }
  );

  // Set cookie with token
  const cookieStore = await cookies();
  cookieStore.set(AUTH_TOKEN, token, {
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'strict'
  });

  // Return user info without password
  const { password: _, ...userWithoutPassword } = user;

  // Map snake_case to camelCase for frontend
  const response: AuthResponse = {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      dateOfBirth: user.date_of_birth,
      gender: user.gender,
      isActive: user.is_active,
      isVerified: user.is_verified,
      is_admin: user.is_admin
    } as any
  };

  return NextResponse.json(response);
}

export const POST = withErrorHandling(loginHandler); 