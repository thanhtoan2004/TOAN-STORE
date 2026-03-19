import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { users as usersTable } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';
import { encrypt, decrypt } from '@/lib/security/encryption';
import { logAdminAction } from '@/lib/db/repositories/audit';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * PATCH /api/admin/users/[id] - Update user (admin role, status, etc.)
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return ResponseWrapper.error('Invalid user ID', 400);
    }

    const body = await request.json();
    const updateData: any = {};
    let shouldRevokeTokens = false;

    if (body.is_active !== undefined) {
      updateData.isActive = body.is_active ? 1 : 0;
      shouldRevokeTokens = true;
    }

    if (body.first_name !== undefined) {
      updateData.firstName = body.first_name;
    }

    if (body.last_name !== undefined) {
      updateData.lastName = body.last_name;
    }

    if (body.phone !== undefined) {
      updateData.phone = '***';
      updateData.phoneEncrypted = encrypt(body.phone);
      updateData.isEncrypted = 1;
    }

    if (body.is_banned !== undefined) {
      updateData.isBanned = body.is_banned ? 1 : 0;
      shouldRevokeTokens = true;
    }

    if (body.membership_tier !== undefined) {
      updateData.membershipTier = body.membership_tier;
    }

    if (Object.keys(updateData).length === 0) {
      return ResponseWrapper.error('No fields to update', 400);
    }

    if (shouldRevokeTokens) {
      updateData.tokenVersion = sql`${usersTable.tokenVersion} + 1`;
    }

    updateData.updatedAt = new Date();

    await db.update(usersTable).set(updateData).where(eq(usersTable.id, userId));

    await logAdminAction(admin.userId, 'PATCH_USER', 'users', userId, null, body, request);

    const [user] = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        firstName: usersTable.firstName,
        lastName: usersTable.lastName,
        phone: usersTable.phone,
        phoneEncrypted: usersTable.phoneEncrypted,
        isEncrypted: usersTable.isEncrypted,
        isActive: usersTable.isActive,
        isBanned: usersTable.isBanned,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    if (!user) {
      return ResponseWrapper.notFound('User not found');
    }

    if (user.isEncrypted && user.phoneEncrypted) {
      user.phone = decrypt(user.phoneEncrypted);
    }

    return ResponseWrapper.success(user, 'User updated successfully');
  } catch (error) {
    console.error('Error updating user:', error);
    return ResponseWrapper.serverError('Failed to update user', error);
  }
}

/**
 * DELETE /api/admin/users/[id] - Delete user (Soft Delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return ResponseWrapper.error('Invalid user ID', 400);
    }

    await db
      .update(usersTable)
      .set({
        deletedAt: new Date(),
        isActive: 0,
        tokenVersion: sql`${usersTable.tokenVersion} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, userId));

    await logAdminAction(
      admin.userId,
      'SOFT_DELETE_USER',
      'users',
      userId,
      null,
      { deleted: true },
      request
    );

    return ResponseWrapper.success(null, 'User deleted successfully');
  } catch (error) {
    console.error('Error deleting user:', error);
    return ResponseWrapper.serverError('Failed to delete user', error);
  }
}
