import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { executeQuery } from '@/lib/db/mysql';
import { RegisterRequest, User } from '@/types/auth';
import { sendWelcomeEmail } from '@/lib/mail';

export async function POST(req: Request) {
  try {
    const { email, password, firstName, lastName, dateOfBirth, gender, phone } = await req.json();

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await executeQuery(
      'SELECT * FROM users WHERE email = ?',
      [email]
    ) as User[];

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email đã được sử dụng' },
        { status: 400 }
      );
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Thêm người dùng mới vào CSDL
    await executeQuery(
      'INSERT INTO users (email, password, first_name, last_name, phone, date_of_birth, gender) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, firstName || null, lastName || null, phone || null, dateOfBirth || null, gender || null]
    );

    // Gửi email chào mừng
    // Chạy background để không chặn response
    sendWelcomeEmail(email, firstName || 'Member').catch(console.error);

    return NextResponse.json(
      { success: true, message: 'Đăng ký thành công' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi đăng ký' },
      { status: 500 }
    );
  }
} 