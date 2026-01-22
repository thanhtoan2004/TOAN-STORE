import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { executeQuery } from '@/lib/db/mysql';
import { createErrorResponse, createSuccessResponse, validateRequiredFields, withErrorHandling } from '@/lib/api-utils';
import { User, UserWithoutPassword, LoginRequest, AuthResponse } from '@/types/auth';

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
  
  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    return createErrorResponse('Email hoặc mật khẩu không chính xác', 401, 'INVALID_CREDENTIALS');
  }
  
  // Generate JWT token
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET is not set');
    return createErrorResponse('Cấu hình server không hợp lệ', 500, 'SERVER_CONFIG_ERROR');
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    jwtSecret,
    { expiresIn: '7d' }
  );
  
  // Set cookie with token
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    path: '/',
    secure: false, // Tắt secure trong development
    maxAge: 60 * 60 * 24 * 7, // 7 days
    sameSite: 'lax'
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
      isVerified: user.is_verified
    } as any
  };
  
  return NextResponse.json(response);
}

export const POST = withErrorHandling(loginHandler); 