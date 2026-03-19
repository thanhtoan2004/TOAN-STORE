import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { sendPasswordResetEmail } from '@/lib/mail/mail';
import crypto from 'crypto';
import { withRateLimit } from '@/lib/api/with-rate-limit';
import { hashEmail } from '@/lib/security/encryption';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Yêu cầu khôi phục mật khẩu.
 * Bảo mật:
 * - Áp dụng Rate Limit để chống spam email.
 * - Không tiết lộ email có tồn tại trong hệ thống hay không để tránh bị dò quét tài khoản (Information Exposure).
 */
async function forgotPasswordHandler(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return ResponseWrapper.error('Vui lòng nhập email', 400);
    }

    // Check if user exists (Sử dụng Blind Index)
    const emailHash = hashEmail(email);
    const users = (await executeQuery(
      'SELECT id, first_name, last_name FROM users WHERE email_hash = ?',
      [emailHash]
    )) as any[];

    if (users.length === 0) {
      // Don't reveal that user does not exist
      return ResponseWrapper.success(
        null,
        'Nếu email tồn tại, chúng tôi sẽ gửi hướng dẫn đến bạn.'
      );
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');

    // Save token to DB (Mask email, lưu hash, expires in 1 hour)
    await executeQuery(
      `INSERT INTO password_resets (email, email_hash, token, expires_at) VALUES ("***", ?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))`,
      [emailHash, token]
    );

    // Send email
    const fullName = [users[0].first_name, users[0].last_name].filter(Boolean).join(' ') || 'bạn';
    sendPasswordResetEmail(email, fullName, token).catch(console.error);

    return ResponseWrapper.success(null, 'Đã gửi hướng dẫn đến email của bạn.');
  } catch (error) {
    console.error('Forgot password error:', error);
    return ResponseWrapper.serverError('Có lỗi xảy ra. Vui lòng thử lại sau.', error);
  }
}

export const POST = withRateLimit(forgotPasswordHandler, {
  tag: 'auth',
  limit: 3,
  windowMs: 60 * 1000,
});
