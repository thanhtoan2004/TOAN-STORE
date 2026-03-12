import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth/auth';
import { getAdminPermissions } from '@/lib/auth/rbac';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Debug: Kiểm tra phân quyền Admin (RBAC Diagnostic).
 * Được sử dụng để kiểm kê danh sách quyền (permissions) thực tế của một Admin user.
 * Chỉ hỗ trợ trong môi trường Development.
 */
export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'production') {
      return ResponseWrapper.notFound();
    }

    const session = await checkAdminAuth();

    if (!session) {
      return ResponseWrapper.unauthorized();
    }

    const permissions = await getAdminPermissions(session.userId);

    return ResponseWrapper.success({
      userId: session.userId,
      email: session.email,
      role: session.role,
      roleId: session.roleId,
      permissions: permissions,
    });
  } catch (error: any) {
    return ResponseWrapper.serverError(error.message);
  }
}
