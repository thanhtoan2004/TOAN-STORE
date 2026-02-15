import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { getAdminPermissions } from '@/lib/auth/rbac';
import { ResponseWrapper } from '@/lib/api-response';

export async function GET(request: NextRequest) {
    try {
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
            permissions: permissions
        });
    } catch (error: any) {
        return ResponseWrapper.serverError(error.message);
    }
}
