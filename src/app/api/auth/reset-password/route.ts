
import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
    try {
        const { token, password } = await req.json();

        if (!token || !password) {
            return NextResponse.json(
                { message: 'Thiếu thông tin' },
                { status: 400 }
            );
        }

        // Validate token
        const resets = await executeQuery(
            `SELECT * FROM password_resets 
       WHERE token = ? AND used = 0 AND expires_at > NOW()`,
            [token]
        ) as any[];

        if (resets.length === 0) {
            return NextResponse.json(
                { message: 'Token không hợp lệ hoặc đã hết hạn' },
                { status: 400 }
            );
        }

        const resetRecord = resets[0];
        const email = resetRecord.email;

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user password
        await executeQuery(
            'UPDATE users SET password = ? WHERE email = ?',
            [hashedPassword, email]
        );

        // Mark token as used
        await executeQuery(
            'UPDATE password_resets SET used = 1 WHERE id = ?',
            [resetRecord.id]
        );

        return NextResponse.json({
            success: true,
            message: 'Đặt lại mật khẩu thành công'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { message: 'Có lỗi xảy ra. Vui lòng thử lại sau.' },
            { status: 500 }
        );
    }
}
