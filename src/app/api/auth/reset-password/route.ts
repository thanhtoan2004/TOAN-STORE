import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { executeQuery } from '@/lib/db/mysql';
import { createErrorResponse, createSuccessResponse, validateRequiredFields, withErrorHandling } from '@/lib/api-utils';

async function resetPasswordHandler(req: Request): Promise<NextResponse> {
    const body: { token?: string; password?: string } = await req.json();

    // Validate required fields
    const validation = validateRequiredFields(body, ['token', 'password']);
    if (!validation.isValid) {
        return createErrorResponse(validation.error, 400, 'VALIDATION_ERROR');
    }

    const { token, password } = body as { token: string; password: string };

    // Validate password length
    if (password.length < 6) {
        return createErrorResponse('Mật khẩu phải có ít ít nhất 6 ký tự', 400, 'INVALID_PASSWORD');
    }

    try {
        // Find reset token in database (using UTC_TIMESTAMP for correct timezone comparison)
        const resetTokens = await executeQuery(
            'SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > UTC_TIMESTAMP()',
            [token]
        ) as any[];

        if (resetTokens.length === 0) {
            // Check if token exists at all
            const tokenExists = await executeQuery(
                'SELECT token, expires_at, used FROM password_resets WHERE token = ?',
                [token]
            ) as any[];

            return createErrorResponse(
                'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu link mới.',
                400,
                'INVALID_TOKEN'
            );
        }
        const resetRecord = resetTokens[0];
        const email = resetRecord.email;

        // Check if user still exists
        const users = await executeQuery(
            'SELECT id FROM users WHERE email = ?',
            [email]
        ) as any[];

        if (users.length === 0) {
            return createErrorResponse(
                'Tài khoản không tồn tại.',
                404,
                'USER_NOT_FOUND'
            );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user password
        await executeQuery(
            'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?',
            [hashedPassword, email]
        );

        // Mark token as used
        await executeQuery(
            'UPDATE password_resets SET used = 1 WHERE token = ?',
            [token]
        );

        console.log(`Password successfully reset for: ${email}`);

        return NextResponse.json(
            createSuccessResponse({
                message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập với mật khẩu mới.'
            })
        );
    } catch (error) {
        console.error('Reset password error:', error);
        return createErrorResponse(
            'Có lỗi xảy ra. Vui lòng thử lại sau.',
            500,
            'SERVER_ERROR'
        );
    }
}

export const POST = withErrorHandling(resetPasswordHandler);
