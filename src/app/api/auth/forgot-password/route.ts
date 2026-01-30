import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { executeQuery } from '@/lib/db/mysql';
import { sendPasswordResetEmail } from '@/lib/email';
import { createErrorResponse, createSuccessResponse, validateRequiredFields, withErrorHandling } from '@/lib/api-utils';

async function forgotPasswordHandler(req: Request): Promise<NextResponse> {
    const body: { email?: string } = await req.json();

    // Validate required fields
    const validation = validateRequiredFields(body, ['email']);
    if (!validation.isValid) {
        return createErrorResponse(validation.error, 400, 'VALIDATION_ERROR');
    }

    const { email } = body as { email: string };

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return createErrorResponse('Email không hợp lệ', 400, 'INVALID_EMAIL');
    }

    try {
        // Check if user exists
        const users = await executeQuery(
            'SELECT id, email FROM users WHERE email = ?',
            [email]
        ) as any[];

        if (users.length > 0) {
            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
            const expiresAtString = expiresAt.toISOString().slice(0, 19).replace('T', ' '); // MySQL datetime format

            // Delete any existing reset tokens for this email
            await executeQuery(
                'DELETE FROM password_resets WHERE email = ?',
                [email]
            );

            // Store reset token in database
            await executeQuery(
                'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)',
                [email, resetToken, expiresAtString]
            );

            // Send reset email
            try {
                await sendPasswordResetEmail(email, resetToken);
                console.log(`Password reset email sent to: ${email}`);
            } catch (emailError) {
                console.error('Failed to send email:', emailError);
                // Delete the token if email failed
                await executeQuery('DELETE FROM password_resets WHERE token = ?', [resetToken]);
                return createErrorResponse(
                    'Không thể gửi email. Vui lòng kiểm tra lại địa chỉ email hoặc thử lại sau.',
                    500,
                    'EMAIL_SEND_FAILED'
                );
            }
        }

        // Always return success message (security: don't reveal if email exists)
        return NextResponse.json(
            createSuccessResponse({
                message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu trong vài phút.'
            })
        );
    } catch (error) {
        console.error('Forgot password error:', error);
        return createErrorResponse(
            'Có lỗi xảy ra. Vui lòng thử lại sau.',
            500,
            'SERVER_ERROR'
        );
    }
}

export const POST = withErrorHandling(forgotPasswordHandler);
