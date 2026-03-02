import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { verifyAuth } from '@/lib/auth';

/**
 * GET: Fetch notifications for the current user
 */
export async function GET(req: NextRequest) {
    try {
        const user = await verifyAuth();
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const notifications = await executeQuery(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            [user.userId]
        );

        return NextResponse.json({ success: true, notifications });
    } catch (error) {
        console.error('Fetch notifications error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PATCH: Mark notification(s) as read
 */
export async function PATCH(req: NextRequest) {
    try {
        const user = await verifyAuth();
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { notificationId, all } = await req.json();

        if (all) {
            await executeQuery(
                'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
                [user.userId]
            );
        } else if (notificationId) {
            await executeQuery(
                'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
                [notificationId, user.userId]
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update notification error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE: Remove notification(s)
 */
export async function DELETE(req: NextRequest) {
    try {
        const user = await verifyAuth();
        if (!user) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { notificationId, all } = await req.json();

        if (all) {
            await executeQuery(
                'DELETE FROM notifications WHERE user_id = ?',
                [user.userId]
            );
        } else if (notificationId) {
            await executeQuery(
                'DELETE FROM notifications WHERE id = ? AND user_id = ?',
                [notificationId, user.userId]
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete notification error:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}
