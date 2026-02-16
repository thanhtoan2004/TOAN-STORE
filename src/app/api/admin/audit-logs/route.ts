import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { db } from '@/lib/db/drizzle';
import { adminActivityLogs, adminUsers } from '@/lib/db/schema';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import { ResponseWrapper } from '@/lib/api-response';

export async function GET(request: NextRequest) {
    try {
        const admin = await checkAdminAuth();
        if (!admin) return ResponseWrapper.unauthorized();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        const adminUserId = searchParams.get('adminUserId');
        const entityType = searchParams.get('entityType');
        const action = searchParams.get('action');

        const filters = [];
        if (adminUserId) filters.push(eq(adminActivityLogs.adminUserId, parseInt(adminUserId)));
        if (entityType) filters.push(eq(adminActivityLogs.entityType, entityType));
        if (action) filters.push(eq(adminActivityLogs.action, action));

        const data = await db.select({
            id: adminActivityLogs.id,
            adminUserId: adminActivityLogs.adminUserId,
            adminName: adminUsers.fullName,
            adminUsername: adminUsers.username,
            action: adminActivityLogs.action,
            entityType: adminActivityLogs.entityType,
            entityId: adminActivityLogs.entityId,
            oldValues: adminActivityLogs.oldValues,
            newValues: adminActivityLogs.newValues,
            ipAddress: adminActivityLogs.ipAddress,
            userAgent: adminActivityLogs.userAgent,
            createdAt: adminActivityLogs.createdAt,
        })
            .from(adminActivityLogs)
            .leftJoin(adminUsers, eq(adminActivityLogs.adminUserId, adminUsers.id))
            .where(and(...filters))
            .orderBy(desc(adminActivityLogs.createdAt))
            .limit(limit)
            .offset(offset);

        const [countResult] = await db.select({ value: count() })
            .from(adminActivityLogs)
            .where(and(...filters));

        const total = countResult?.value || 0;

        return ResponseWrapper.success(data, undefined, 200, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return ResponseWrapper.serverError('Internal server error', error);
    }
}
