import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db/drizzle';
import { adminUsers as adminUsersTable } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { LoginRequest, AuthResponse } from '@/types/auth';
import { ADMIN_TOKEN, getJwtSecret } from '@/lib/auth/auth';
import { hashEmail } from '@/lib/security/encryption';
import { getRedisConnection } from '@/lib/redis/redis';
import crypto from 'crypto';
import { sendEmail } from '@/lib/mail/mail';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Đăng nhập dành riêng cho quản trị viên (Admin).
 * Đặc điểm:
 * - Truy vấn từ bảng `admin_users` riêng biệt để tách bạch quyền hạn.
 * - Cơ chế bảo vệ Brute-force: Tự động khóa tài khoản sau 5 lần nhập sai trong 15 phút.
 * - Hỗ trợ Xác thực 2 bước (2FA) qua Email hoặc TOTP.
 * - Cấp phát Token quản trị (ADMIN_TOKEN) thời hạn 7 ngày.
 */
export async function POST(req: Request) {
  try {
    const { email, password }: LoginRequest = await req.json();

    // Hăm email để tìm kiếm (PII Blind Index)
    const emailHash = hashEmail(email);

    // Tìm người dùng theo email_hash trong bảng admin_users sử dụng Drizzle ORM
    const [user] = await db
      .select()
      .from(adminUsersTable)
      .where(and(eq(adminUsersTable.emailHash, emailHash), eq(adminUsersTable.isActive, 1)))
      .limit(1);

    if (!user) {
      return ResponseWrapper.unauthorized('Email hoặc mật khẩu không chính xác');
    }

    // 1. Kiểm tra Lockout
    if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
      const waitMins = Math.ceil((new Date(user.lockoutUntil).getTime() - Date.now()) / 60000);
      return ResponseWrapper.forbidden(
        `Tài khoản tạm khóa. Vui lòng thử lại sau ${waitMins} phút.`
      );
    }

    // 2. Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.password || '');

    if (!isPasswordValid) {
      // Tăng số lần sai
      const newAttempts = (user.failedLoginAttempts || 0) + 1;
      const updateData: any = { failedLoginAttempts: newAttempts };

      if (newAttempts >= 5) {
        updateData.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // Khóa 15p
      }

      await db.update(adminUsersTable).set(updateData).where(eq(adminUsersTable.id, user.id));

      return ResponseWrapper.unauthorized('Email hoặc mật khẩu không chính xác', {
        attemptsLeft: Math.max(0, 5 - newAttempts),
      });
    }

    // 3. Reset failed attempts khi đúng pass
    if (user.failedLoginAttempts && user.failedLoginAttempts > 0) {
      await db
        .update(adminUsersTable)
        .set({ failedLoginAttempts: 0, lockoutUntil: null })
        .where(eq(adminUsersTable.id, user.id));
    }

    // 4. Kiểm tra 2FA
    if (user.twoFactorEnabled) {
      // Tạo mã OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      const redis = getRedisConnection();
      await redis.set(`otp:admin_login:${user.id}`, otp, 'EX', 300); // 5 phút

      // Gửi Email OTP
      const html = `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px; max-width: 500px;">
          <h2 style="color: #111;">Mã xác thực Admin</h2>
          <p>Xin chào <strong>${user.fullName}</strong>,</p>
          <p>Bạn vừa thực hiện đăng nhập vào trang Quản trị. Đây là mã xác thực 2 bước của bạn:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px;">
            ${otp}
          </div>
          <p style="color: #666; font-size: 13px;">Mã này có hiệu lực trong 5 phút. Nếu không phải bạn, hãy đổi mật khẩu ngay lập tức.</p>
        </div>
      `;

      await sendEmail({
        to: email,
        subject: `[Security] Mã xác thực Admin: ${otp}`,
        html,
      }).catch(console.error);

      const mfaState = {
        requires2FA: true,
        twoFactorType: user.twoFactorType === 'totp' ? 'totp' : 'email',
        adminId: user.id,
        email: email,
      };

      return ResponseWrapper.success(mfaState, 'Yêu cầu xác thực 2 bước');
    }

    // 5. Nếu không có 2FA, cấp token như cũ
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

    const authUser = {
      ...userWithoutPassword,
      firstName: user.fullName?.split(' ')[0] || '',
      lastName: user.fullName?.split(' ').slice(1).join(' ') || '',
    };

    return ResponseWrapper.success({ user: authUser }, 'Đăng nhập thành công');
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    return ResponseWrapper.serverError('Đã xảy ra lỗi khi đăng nhập', error);
  }
}
