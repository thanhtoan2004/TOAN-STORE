import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth/auth';

/**
 * API Lấy thông tin chi tiết của tài khoản Admin hiện tại.
 * Quy trình:
 * 1. Xác thực phiên đăng nhập của Admin (kiểm tra JWT cookie).
 * 2. Truy vấn thông tin từ bảng `admin_users` dựa trên ID trong session.
 */
export async function GET() {
  try {
    const session = await checkAdminAuth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Lấy thông tin người dùng từ CSDL admin_users kèm Role Name (Unified Point 1)
    const admins = (await executeQuery(
      `SELECT au.id, au.email, au.full_name, au.is_active, r.name as role 
             FROM admin_users au
             LEFT JOIN roles r ON au.role_id = r.id
             WHERE au.id = ?`,
      [session.userId]
    )) as any[];

    if (admins.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy tài khoản admin' }, { status: 404 });
    }

    const admin = admins[0];

    return NextResponse.json({
      user: {
        id: admin.id,
        email: admin.email,
        fullName: admin.full_name,
        isActive: admin.is_active,
        role: admin.role || 'admin',
      },
    });
  } catch (error) {
    console.error('Lỗi xác thực admin:', error);
    return NextResponse.json({ error: 'Phiên đăng nhập không hợp lệ' }, { status: 401 });
  }
}
