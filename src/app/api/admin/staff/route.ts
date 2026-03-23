import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { adminUsers, roles } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    // SECURITY: Only Super Admins can view the full administrator list
    if (admin.role !== 'super_admin') {
      return ResponseWrapper.forbidden('Only Super Admins can access administrative user data');
    }

    const admins = await db
      .select({
        id: adminUsers.id,
        username: adminUsers.username,
        email: adminUsers.email,
        fullName: adminUsers.fullName,
        full_name: adminUsers.fullName,
        isActive: adminUsers.isActive,
        is_active: adminUsers.isActive,
        roleId: adminUsers.roleId,
        role_id: adminUsers.roleId,
        roleName: roles.name,
        twoFactorEnabled: adminUsers.twoFactorEnabled,
        two_factor_enabled: adminUsers.twoFactorEnabled,
      })
      .from(adminUsers)
      .leftJoin(roles, eq(adminUsers.roleId, roles.id));

    return ResponseWrapper.success(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    return ResponseWrapper.serverError('Internal server error');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    // SECURITY: Only Super Admins can manage other admins
    if (admin.role !== 'super_admin') {
      return ResponseWrapper.forbidden('Only Super Admins can manage administrative users');
    }

    const body = await request.json();
    const { id, role_id, is_active, two_factor_enabled } = body;

    if (!id) return ResponseWrapper.error('Admin ID required', 400);

    // SECURITY: Prevent deactivating self to avoid lockout
    if (id === admin.userId && is_active === false) {
      return ResponseWrapper.error('You cannot deactivate your own administrative account', 400);
    }

    const updates: any = {};
    if (role_id !== undefined) updates.roleId = role_id;
    if (is_active !== undefined) updates.isActive = is_active ? 1 : 0;
    if (two_factor_enabled !== undefined) updates.twoFactorEnabled = two_factor_enabled ? 1 : 0;

    if (Object.keys(updates).length === 0) {
      return ResponseWrapper.error('No fields to update', 400);
    }

    await db.update(adminUsers).set(updates).where(eq(adminUsers.id, id));

    return ResponseWrapper.success(null, 'Admin updated successfully');
  } catch (error) {
    console.error('Error updating admin:', error);
    return ResponseWrapper.serverError('Internal server error');
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    // SECURITY: Only Super Admins can create new admins
    if (admin.role !== 'super_admin') {
      return ResponseWrapper.forbidden('Only Super Admins can create administrative users');
    }

    const body = await request.json();
    const { username, email, fullName, password, roleId } = body;

    // VALIDATION
    if (!username || !email || !fullName || !password || !roleId) {
      return ResponseWrapper.error('All fields are required', 400);
    }

    // Check existing
    const existing = await db
      .select({ id: adminUsers.id })
      .from(adminUsers)
      .where(sql`${adminUsers.username} = ${username} OR ${adminUsers.email} = ${email}`)
      .limit(1);

    if (existing.length > 0) {
      return ResponseWrapper.error('Username or Email already exists', 400);
    }

    // Hash Password
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert
    await db.insert(adminUsers).values({
      username,
      email,
      fullName,
      passwordHash,
      roleId: parseInt(roleId),
      isActive: 1,
    });

    return ResponseWrapper.success(null, 'Admin user created successfully', 201);
  } catch (error) {
    console.error('Error creating admin:', error);
    return ResponseWrapper.serverError('Internal server error');
  }
}
