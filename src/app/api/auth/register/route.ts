import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { db } from '@/lib/db/drizzle';
import { users as usersTable } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { RegisterRequest, User } from '@/types/auth';
import { sendWelcomeEmail } from '@/lib/mail/mail';
import { withRateLimit } from '@/lib/api/with-rate-limit';
import { encrypt, hashEmail } from '@/lib/security/encryption';
import { ResponseWrapper } from '@/lib/api/api-response';

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
      return ResponseWrapper.error('Email và mật khẩu là bắt buộc', 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ResponseWrapper.error('Email không hợp lệ', 400);
    }

    if (password.length < 6) {
      return ResponseWrapper.error('Mật khẩu phải có ít nhất 6 ký tự', 400);
    }

    // Sanitize text inputs (strip HTML tags)
    const sanitize = (str: string | null) => (str ? str.replace(/<[^>]*>/g, '').trim() : null);

    // Check if email hash already exists
    const emailHash = hashEmail(email);
    const existingUsers = await db
      .select()
      .from(usersTable)
      .where(and(eq(usersTable.emailHash, emailHash), isNull(usersTable.deletedAt)));

    if (existingUsers.length > 0) {
      return ResponseWrapper.error('Email đã được sử dụng', 400);
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user with email_hash and email_encrypted
    await db.insert(usersTable).values({
      email: '***',
      emailHash,
      emailEncrypted: encrypt(email.toLowerCase().trim()),
      password: hashedPassword,
      firstName: sanitize(firstName),
      lastName: sanitize(lastName),
      phone: '***',
      phoneEncrypted: encrypt(phone || null),
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      isActive: 1,
      isEncrypted: 1,
    });

    // Gửi email chào mừng
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Member';
    sendWelcomeEmail(email, fullName).catch(console.error);

    return ResponseWrapper.success(null, 'Đăng ký thành công', 201);
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    return ResponseWrapper.serverError('Đã xảy ra lỗi khi đăng ký', error);
  }
}

export const POST = withRateLimit(registerHandler as any, {
  tag: 'auth',
  limit: 5,
  windowMs: 60 * 1000,
});
