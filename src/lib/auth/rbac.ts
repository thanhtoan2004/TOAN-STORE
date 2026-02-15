import { db } from '@/lib/db/drizzle';
import { adminUsers, roles, permissions, rolePermissions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Check if an admin user has a specific permission
 */
export async function hasPermission(adminId: number, permissionName: string) {
    // 1. Get the user's role and associated permissions
    const result = await db.select({
        name: permissions.name
    })
        .from(adminUsers)
        .innerJoin(roles, eq(adminUsers.roleId, roles.id))
        .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(
            and(
                eq(adminUsers.id, adminId),
                eq(permissions.name, permissionName)
            )
        )
        .limit(1);

    return result.length > 0;
}

/**
 * Get all permissions for an admin user
 */
export async function getAdminPermissions(adminId: number) {
    const result = await db.select({
        name: permissions.name
    })
        .from(adminUsers)
        .innerJoin(roles, eq(adminUsers.roleId, roles.id))
        .innerJoin(rolePermissions, eq(roles.id, rolePermissions.roleId))
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(adminUsers.id, adminId));

    return result.map(p => p.name);
}
