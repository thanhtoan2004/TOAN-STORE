import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { executeQuery } from '@/lib/db/mysql';
import { RegisterRequest, User } from '@/types/auth';
import { sendWelcomeEmail } from '@/lib/mail';
import { withRateLimit } from '@/lib/with-rate-limit';
import { encrypt } from '@/lib/encryption';

/**
 * API Đăng ký tài khoản người mới.
 * Quy trình xử lý và bảo mật:
 * 1. Chống trùng lặp: Kiểm tra tính duy nhất của Email (cần chưa bị xóa mềm).
 * 2. Bảo vệ XSS: Tự động lọc sạch (sanitize) các thẻ HTML trong Họ và Tên.
 * 3. Bảo mật PII: Mã hóa Số điện thoại bằng AES-256 trước khi lưu vào CSDL.
 * 4. Password Hashing: Sử dụng Bcrypt (Salt rounds = 10).
 * 5. Tương tác người dùng: Gửi Email chào mừng thông qua Background Queue (không chặn luồng đăng ký).
 */
async function registerHandler(req: Request) {
  try {
    const { email, password, firstName, lastName, dateOfBirth, gender, phone } = await req.json();

    // FIX H1: Validate input
    if (!email || !password) {
      return NextResponse.json({ error: 'Email và mật khẩu là bắt buộc' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email không hợp lệ' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' }, { status: 400 });
    }

    // Sanitize text inputs (strip HTML tags)
    const sanitize = (str: string | null) => str ? str.replace(/<[^>]*>/g, '').trim() : null;

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await executeQuery(
      'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL',
      [email.toLowerCase().trim()]
    ) as User[];

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email đã được sử dụng' },
        { status: 400 }
      );
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Thêm người dùng mới vào CSDL (Mặc định is_active = 1)
    await executeQuery(
      'INSERT INTO users (email, password, first_name, last_name, phone, date_of_birth, gender, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
      [email.toLowerCase().trim(), hashedPassword, sanitize(firstName), sanitize(lastName), encrypt(phone || null), dateOfBirth || null, gender || null]
    );

    // Gửi email chào mừng
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Member';
    sendWelcomeEmail(email, fullName).catch(console.error);

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

export const POST = withRateLimit(registerHandler as any, {
  tag: 'auth',
  limit: 5,
  windowMs: 60 * 1000,
});
