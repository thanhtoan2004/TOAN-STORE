import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { verifyAuth } from '@/lib/auth';
import bcrypt from 'bcrypt';

/**
 * API Kiểm tra trạng thái bảo mật 2 lớp (2FA).
 * Cơ chế: Tự động đảm bảo cột `two_factor_enabled` tồn tại trong bảng `users` (Auto-migration).
 */
export async function GET() {
    try {
        const session = await verifyAuth();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }


        const [user] = await executeQuery<any[]>(
            'SELECT COALESCE(two_factor_enabled, 0) as two_factor_enabled FROM users WHERE id = ?',
            [session.userId]
        );

        return NextResponse.json({
            success: true,
            enabled: user?.two_factor_enabled === 1
        });
    } catch (error) {
        console.error('2FA status error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

/**
 * API Bật/Tắt bảo mật 2 lớp cho tài khoản người dùng.
 */
export async function POST(request: NextRequest) {
    try {
        const session = await verifyAuth();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { enabled, password } = await request.json();

        if (!password) {
            return NextResponse.json({ success: false, message: 'Vui lòng nhập mật khẩu để xác nhận' }, { status: 400 });
        }

        const users = await executeQuery<any[]>(
            'SELECT password FROM users WHERE id = ?',
            [session.userId]
        );

        if (!users || users.length === 0) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy người dùng' }, { status: 404 });
        }

        const isValid = await bcrypt.compare(password, users[0].password);
        if (!isValid) {
            return NextResponse.json({ success: false, message: 'Mật khẩu không chính xác' }, { status: 400 });
        }

        await executeQuery(
            'UPDATE users SET two_factor_enabled = ? WHERE id = ?',
            [enabled ? 1 : 0, session.userId]
        );

        return NextResponse.json({
            success: true,
            message: enabled ? 'Đã bật xác thực 2 bước' : 'Đã tắt xác thực 2 bước',
            enabled: !!enabled
        });
    } catch (error) {
        console.error('2FA toggle error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
