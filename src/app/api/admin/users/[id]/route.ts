import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

import { checkAdminAuth } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/encryption';
import { logAdminAction } from '@/lib/audit';

// PATCH /api/admin/users/[id] - Update user (admin role, status, etc.)
/**
 * API Cập nhật thông tin người dùng (Quyền admin, Trạng thái, Chặn người dùng).
 * Tự động mã hóa số điện thoại nếu có thay đổi.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ success: false, message: 'Invalid user ID' }, { status: 400 });
    }

    const body = await request.json();
    const updates: string[] = [];
    const values: any[] = [];

    // Build dynamic update query based on provided fields
    if (body.is_active !== undefined) {
      updates.push('is_active = ?', 'token_version = token_version + 1');
      values.push(body.is_active ? 1 : 0);
    }

    if (body.first_name !== undefined) {
      updates.push('first_name = ?');
      values.push(body.first_name);
    }

    if (body.last_name !== undefined) {
      updates.push('last_name = ?');
      values.push(body.last_name);
    }

    if (body.phone !== undefined) {
      updates.push('phone = ?', 'phone_encrypted = ?', 'is_encrypted = TRUE');
      values.push('***', encrypt(body.phone));
    }

    if (body.is_banned !== undefined) {
      updates.push('is_banned = ?', 'token_version = token_version + 1');
      values.push(body.is_banned ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, message: 'No fields to update' }, { status: 400 });
    }

    // Add userId to values array
    values.push(userId);

    // Execute update query
    await executeQuery(
      `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    await logAdminAction(admin.userId, 'PATCH_USER', 'users', userId, null, body, request);

    const [user]: any = (await executeQuery(
      'SELECT id, email, first_name, last_name, phone, is_active, is_banned, created_at FROM users WHERE id = ?',
      [userId]
    )) as any[];

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    user.phone = decrypt(user.phone);

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ success: false, message: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] - Delete user (optional, for future use)
/**
 * API Xóa người dùng (Soft Delete).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return NextResponse.json({ success: false, message: 'Invalid user ID' }, { status: 400 });
    }

    // Soft delete
    await executeQuery(
      'UPDATE users SET deleted_at = CURRENT_TIMESTAMP, is_active = 0, token_version = token_version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );

    await logAdminAction(
      admin.userId,
      'SOFT_DELETE_USER',
      'users',
      userId,
      null,
      { deleted: true },
      request
    );

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete user' }, { status: 500 });
  }
}
