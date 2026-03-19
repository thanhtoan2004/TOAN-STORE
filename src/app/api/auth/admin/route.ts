import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Lấy thông tin chi tiết của tài khoản Admin hiện tại.
 * Quy trình:
 * 1. Xác thực phiên đăng nhập của Admin (kiểm tra JWT cookie).
 * 2. Truy vấn thông tin từ bảng `admin_users` dựa trên ID trong session.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await checkAdminAuth();

    if (!session) {
      return ResponseWrapper.unauthorized();
    }

    // Lấy thông tin người dùng từ CSDL admin_users kèm Role Name (Unified Point 1)
    const admins = (await executeQuery(
      `SELECT au.id, au.email, au.full_name, au.is_active, au.role_id, r.name as role 
             FROM admin_users au
             LEFT JOIN roles r ON au.role_id = r.id
             WHERE au.id = ?`,
      [session.userId]
    )) as any[];

    if (admins.length === 0) {
      return ResponseWrapper.notFound('Không tìm thấy tài khoản admin');
    }

    const admin = admins[0];

    const authAdmin = {
      id: admin.id,
      email: admin.email,
      fullName: admin.full_name,
      isActive: admin.is_active === 1,
      role: admin.role || 'admin',
      roleId: admin.role_id || null,
    };

    return ResponseWrapper.success({ user: authAdmin });
  } catch (error) {
    console.error('Lỗi xác thực admin:', error);
    return ResponseWrapper.unauthorized('Phiên đăng nhập không hợp lệ');
  }
}
