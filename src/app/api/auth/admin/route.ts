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

        // Lấy thông tin người dùng từ CSDL admin_users
        const admins = await executeQuery(
            'SELECT id, email, full_name, is_active, role FROM admin_users WHERE id = ?',
            [session.userId]
        ) as any[];

        if (admins.length === 0) {
            return NextResponse.json(
                { error: 'Không tìm thấy tài khoản admin' },
                { status: 404 }
            );
        }

        const admin = admins[0];

        return NextResponse.json({
            user: {
                id: admin.id,
                email: admin.email,
                fullName: admin.full_name,
                isActive: admin.is_active,
                is_admin: 1, // Explicitly set for frontend check
                role: admin.role
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
