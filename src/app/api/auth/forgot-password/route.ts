import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { sendPasswordResetEmail } from '@/lib/mail';
import crypto from 'crypto';
import { withRateLimit } from '@/lib/with-rate-limit';

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
            return NextResponse.json(
                { message: 'Vui lòng nhập email' },
                { status: 400 }
            );
        }

        // Check if user exists
        const users = await executeQuery(
            'SELECT id, first_name, last_name FROM users WHERE email = ?',
            [email]
        ) as any[];

        if (users.length === 0) {
            // Don't reveal that user does not exist
            return NextResponse.json({
                success: true,
                message: 'Nếu email tồn tại, chúng tôi sẽ gửi hướng dẫn đến bạn.'
            });
        }

        // Generate token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 3600000); // 1 hour

        // Save token to DB
        await executeQuery(
            `INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)`,
            [email, token, expiresAt]
        );

        // Send email
        const fullName = [users[0].first_name, users[0].last_name].filter(Boolean).join(' ') || 'bạn';
        sendPasswordResetEmail(email, fullName, token).catch(console.error);

        return NextResponse.json({
            success: true,
            message: 'Đã gửi hướng dẫn đến email của bạn.'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { message: 'Có lỗi xảy ra. Vui lòng thử lại sau.' },
            { status: 500 }
        );
    }
}

export const POST = withRateLimit(forgotPasswordHandler, {
    tag: 'auth',
    limit: 3,
    windowMs: 60 * 1000,
});
