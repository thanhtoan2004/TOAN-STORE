import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth/auth';
import { hasPermission } from './rbac';

/**
 * Higher-order function to protect API routes with granular permissions
 */
export function withPermission<T extends Request>(
  permissionName: string,
  handler: (req: T, context: any) => Promise<NextResponse> | NextResponse
) {
  return async (req: T, context: any) => {
    const session = await checkAdminAuth();

    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const allowed = await hasPermission(session.userId, permissionName);

    // Super Admin with 'all' permission should also pass
    const isSuperAdmin = await hasPermission(session.userId, 'all');

    if (!allowed && !isSuperAdmin) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      );
    }

    return handler(req, context);
  };
}
