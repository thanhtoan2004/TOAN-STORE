import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { verifyAuth } from '@/lib/auth/auth';
import { getRedisConnection } from '@/lib/redis/redis';
import { sendEmail } from '@/lib/mail/mail';
import crypto from 'crypto';
import { hashEmail } from '@/lib/security/encryption';

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
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    // Verify user exists (Sử dụng Blind Index)
    const emailHash = hashEmail(email);
    const users = await executeQuery<any[]>(
      'SELECT id, first_name, last_name, email FROM users WHERE email_hash = ? AND is_active = 1 AND is_banned = 0 AND deleted_at IS NULL',
      [emailHash]
    );

    if (users.length === 0) {
      // Don't reveal user doesn't exist
      return NextResponse.json({ success: true, message: 'OTP sent if email exists' });
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
    const html = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; background-color: white;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #111;">
                        <tr>
                            <td align="center" style="padding: 32px 20px;">
                                <img src="https://img.icons8.com/ios-filled/100/ffffff/lock.png" width="48" height="48" alt="Lock" style="display: block; margin-bottom: 12px;">
                                <h1 style="margin: 0; color: white; font-size: 24px; font-family: Arial, sans-serif;">Mã xác thực</h1>
                            </td>
                        </tr>
                    </table>
                    <div style="padding: 40px 20px; text-align: center;">
                        <p style="color: #666; line-height: 1.6;">
                            Xin chào <strong>${fullName}</strong>,<br>
                            Đây là mã xác thực hai bước (2FA) của bạn:
                        </p>
                        <div style="background-color: #f9f9f9; padding: 30px; border-radius: 12px; margin: 20px 0;">
                            <p style="margin: 0; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #111;">
                                ${otp}
                            </p>
                        </div>
                        <p style="color: #999; font-size: 13px;">
                            Mã có hiệu lực trong <strong>5 phút</strong>.<br>
                            Nếu bạn không yêu cầu mã này, hãy bỏ qua email này.
                        </p>
                    </div>
                    <div style="background-color: #f5f5f5; padding: 20px; text-align: center; color: #666; font-size: 12px;">
                        <p style="margin: 5px 0;">© 2026 TOAN Store. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

    await sendEmail({
      to: email,
      subject: `Mã xác thực: ${otp} - TOAN Store`,
      html,
    });

    return NextResponse.json({ success: true, message: 'OTP sent' });
  } catch (error) {
    console.error('2FA send error:', error);
    return NextResponse.json({ success: false, message: 'Failed to send OTP' }, { status: 500 });
  }
}
