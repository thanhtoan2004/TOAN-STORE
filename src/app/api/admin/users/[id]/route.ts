import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

// Check if user is admin
async function checkAdminAuth(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization') || request.headers.get('cookie')?.match(/auth_token=([^;]+)/)?.[1];
        if (!authHeader) return null;
        const token = authHeader.replace('Bearer ', '');
        const decoded: any = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        const result = await executeQuery('SELECT is_admin FROM users WHERE id = ?', [decoded.userId]) as any[];
        return result.length > 0 && (result[0] as any).is_admin === 1 ? result[0] : null;
    } catch {
        return null;
    }
}

// PATCH /api/admin/users/[id] - Update user (admin role, status, etc.)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await checkAdminAuth(request);
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
        if (body.is_admin !== undefined) {
            updates.push('is_admin = ?');
            values.push(body.is_admin ? 1 : 0);
        }

        if (body.is_active !== undefined) {
            updates.push('is_active = ?');
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
            updates.push('phone = ?');
            values.push(body.phone);
        }

        if (body.is_banned !== undefined) {
            updates.push('is_banned = ?');
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

        // Fetch updated user
        const updatedUser = await executeQuery(
            'SELECT id, email, first_name, last_name, phone, is_admin, is_active, is_banned, created_at FROM users WHERE id = ?',
            [userId]
        ) as any[];

        if (updatedUser.length === 0) {
            return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser[0]
        });

    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update user' },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/users/[id] - Delete user (optional, for future use)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await checkAdminAuth(request);
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const userId = parseInt(id);
        if (isNaN(userId)) {
            return NextResponse.json({ success: false, message: 'Invalid user ID' }, { status: 400 });
        }

        // Soft delete by setting is_active to 0
        await executeQuery(
            'UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [userId]
        );

        return NextResponse.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete user' },
            { status: 500 }
        );
    }
}
