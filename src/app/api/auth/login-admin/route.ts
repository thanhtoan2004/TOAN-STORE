import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { executeQuery } from '@/lib/db/mysql';
import { cookies } from 'next/headers';
import { User, UserWithoutPassword, LoginRequest, AuthResponse } from '@/types/auth';

export async function POST(req: Request) {
  try {
    const { email, password }: LoginRequest = await req.json();
    
    // Tìm người dùng theo email
    const users = await executeQuery(
      'SELECT * FROM admin WHERE email = ?',
      [email]
    ) as User[];
    
    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }
    
    const user = users[0];
    
    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không chính xác' },
        { status: 401 }
      );
    }
    
    // Tạo token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );
    
    // Lưu token vào cookie
    // Lưu token vào cookie (ĐÚNG)
    const cookieStore = await cookies(); // Thêm await
    cookieStore.set('auth_token', token, {
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 ngày
    sameSite: 'strict'});

    
      // Trả về thông tin người dùng (không bao gồm mật khẩu)
    const { password: _, ...userWithoutPassword } = user;
    
    const response: AuthResponse = { 
      success: true, 
      user: userWithoutPassword as UserWithoutPassword
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi đăng nhập' },
      { status: 500 }
    );
  }
} 