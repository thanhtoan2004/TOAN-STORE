import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { executeQuery } from '@/lib/db/mysql';
import { cookies } from 'next/headers';
import { User, UserWithoutPassword, LoginRequest, AuthResponse } from '@/types/auth';
import { ADMIN_TOKEN, getJwtSecret } from '@/lib/auth';
import { hashEmail } from '@/lib/encryption';

/**
 * API Đăng nhập dành riêng cho quản trị viên (Admin).
 * Đặc điểm: Truy vấn từ bảng `admin_users` riêng biệt để tách bạch quyền hạn và tăng cường bảo mật.
 */
export async function POST(req: Request) {
  try {
    const { email, password }: LoginRequest = await req.json();

    // Hăm email để tìm kiếm (PII Blind Index)
    const emailHash = hashEmail(email);

    // Tìm người dùng theo email_hash trong bảng admin_users
    const users = (await executeQuery(
      'SELECT * FROM admin_users WHERE email_hash = ? AND is_active = 1',
      [emailHash]
    )) as any[];

    if (users.length === 0) {
      return NextResponse.json({ error: 'Email hoặc mật khẩu không chính xác' }, { status: 401 });
    }

    const user = users[0];

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Email hoặc mật khẩu không chính xác' }, { status: 401 });
    }

    // Tạo token JWT
    const token = jwt.sign({ userId: user.id, email: user.email }, getJwtSecret(), {
      expiresIn: '7d',
      issuer: 'toan-store',
      audience: 'admin',
    });

    // Lưu token vào cookie
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_TOKEN, token, {
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 ngày
      sameSite: 'strict',
    });

    // Trả về thông tin người dùng (không bao gồm mật khẩu)
    const { password: _, ...userWithoutPassword } = user;

    const response: AuthResponse = {
      success: true,
      user: {
        ...userWithoutPassword,
        firstName: user.full_name?.split(' ')[0] || '',
        lastName: user.full_name?.split(' ').slice(1).join(' ') || '',
      } as any,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi khi đăng nhập' }, { status: 500 });
  }
}
