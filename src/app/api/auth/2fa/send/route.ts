import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { verifyAuth } from '@/lib/auth/auth';
import { getRedisConnection } from '@/lib/redis/redis';
import { sendEmail, wrapEmailHtml } from '@/lib/mail/mail';
import crypto from 'crypto';
import { hashEmail } from '@/lib/security/encryption';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Tạo và gửi mã OTP (One-Time Password) qua Email.
 * Quy trình:
 * 1. Kiểm tra sự tồn tại của người dùng.
 * 2. Tạo mã số ngẫu nhiên 6 chữ số.
 * 3. Lưu trữ mã OTP vào Redis với thời gian hết hạn (TTL) là 5 phút.
 * 4. Gửi email chứa mã OTP thông qua hệ thống Mailer.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, purpose } = await request.json();

    if (!email) {
      return ResponseWrapper.error('Email is required', 400);
    }

    // Verify user exists (Sử dụng Blind Index)
    const emailHash = hashEmail(email);
    const users = await executeQuery<any[]>(
      'SELECT id, first_name, last_name, email FROM users WHERE email_hash = ? AND is_active = 1 AND is_banned = 0 AND deleted_at IS NULL',
      [emailHash]
    );

    if (users.length === 0) {
      // Don't reveal user doesn't exist
      return ResponseWrapper.success(null, 'OTP sent if email exists');
    }

    const user = users[0];
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'bạn';

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Store in Redis with 5-minute TTL
    const redis = getRedisConnection();
    const key = `otp:${purpose || 'login'}:${user.id}`;
    await redis.set(key, otp, 'EX', 300); // 5 minutes

    // Send OTP email
    const html = wrapEmailHtml(
      'Mã xác thực',
      'lock',
      `
      <p>Xin chào&nbsp;<strong class="text-highlight">${fullName},</strong></p>
      <p>Đây là mã xác thực hai bước (2FA) của bạn:</p>
      <div class="box">
        <p>Mã xác thực</p>
        <h2 style="letter-spacing: 8px;">${otp}</h2>
      </div>
      <div class="note-box">
        <p class="note-title">Lưu ý:</p>
        <ul class="note-list">
          <li>Mã có hiệu lực trong <strong>5 phút</strong></li>
          <li>Nếu bạn không yêu cầu mã này, hãy bỏ qua email này</li>
        </ul>
      </div>
    `
    );

    await sendEmail({
      to: email,
      subject: `Mã xác thực: ${otp} - TOAN Store`,
      html,
    });

    return ResponseWrapper.success(null, 'OTP sent');
  } catch (error) {
    console.error('2FA send error:', error);
    return ResponseWrapper.serverError('Failed to send OTP', error);
  }
}
