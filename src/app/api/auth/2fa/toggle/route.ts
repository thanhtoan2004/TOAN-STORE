import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { verifyAuth } from '@/lib/auth';

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

        // Ensure column exists (auto-migrate)
        try {
            await executeQuery('ALTER TABLE users ADD COLUMN two_factor_enabled TINYINT(1) DEFAULT 0');
        } catch (e: any) {
            // Ignore error if column already exists (ER_DUP_FIELDNAME / 1060)
            if (e.errno !== 1060) {
                console.error('Column check error:', e);
            }
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

        const { enabled } = await request.json();

        // Ensure column exists (auto-migrate)
        try {
            await executeQuery('ALTER TABLE users ADD COLUMN two_factor_enabled TINYINT(1) DEFAULT 0');
        } catch (e: any) {
            // Ignore error if column already exists
            if (e.errno !== 1060) {
                console.error('Column check error:', e);
            }
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
