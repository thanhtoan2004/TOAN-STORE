import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth';

export async function GET() {
    try {
        const session = await checkAdminAuth();

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Lấy thông tin người dùng từ CSDL
        const users = await executeQuery(
            'SELECT id, email, first_name, last_name, phone, is_active, is_admin FROM users WHERE id = ?',
            [session.userId]
        ) as any[];

        if (users.length === 0) {
            return NextResponse.json(
                { error: 'Không tìm thấy người dùng' },
                { status: 404 }
            );
        }

        const user = users[0];

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                phone: user.phone,
                isActive: user.is_active,
                is_admin: user.is_admin
            }
        });
    } catch (error) {
        console.error('Lỗi xác thực admin:', error);
        return NextResponse.json(
            { error: 'Phiên đăng nhập không hợp lệ' },
            { status: 401 }
        );
    }
}
