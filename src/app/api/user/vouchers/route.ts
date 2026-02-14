import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const auth = await verifyAuth();
        if (!auth) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const vouchers = await executeQuery<any[]>(
            `SELECT code, value, discount_type, description, valid_until, status
       FROM vouchers 
       WHERE recipient_user_id = ? 
       AND status = 'active'
       AND (valid_until IS NULL OR valid_until > NOW())
       AND deleted_at IS NULL
       ORDER BY created_at DESC`,
            [auth.userId]
        );

        return NextResponse.json({
            success: true,
            data: vouchers
        });
    } catch (error) {
        console.error('Error fetching user vouchers:', error);
        return NextResponse.json(
            { success: false, message: 'Lỗi server nội bộ' },
            { status: 500 }
        );
    }
}
