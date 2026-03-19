import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { notifications as notificationsTable } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * GET: Fetch notifications for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return ResponseWrapper.unauthorized();
    }

    const notificationData = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, user.userId))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);

    const mappedNotifications = notificationData.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      is_read: !!n.isRead,
      link: n.linkUrl,
      created_at: n.createdAt,
    }));

    return ResponseWrapper.success(mappedNotifications);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return ResponseWrapper.serverError('Internal server error', error);
  }
}

/**
 * PATCH: Mark notification(s) as read
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return ResponseWrapper.unauthorized();
    }

    const { notificationId, all } = await req.json();

    if (all) {
      await db
        .update(notificationsTable)
        .set({ isRead: 1 })
        .where(eq(notificationsTable.userId, user.userId));
    } else if (notificationId) {
      await db
        .update(notificationsTable)
        .set({ isRead: 1 })
        .where(
          and(
            eq(notificationsTable.id, Number(notificationId)),
            eq(notificationsTable.userId, user.userId)
          )
        );
    }

    return ResponseWrapper.success();
  } catch (error) {
    console.error('Update notification error:', error);
    return ResponseWrapper.serverError('Internal server error', error);
  }
}

/**
 * DELETE: Remove notification(s)
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await verifyAuth();
    if (!user) {
      return ResponseWrapper.unauthorized();
    }

    const { notificationId, all } = await req.json();

    if (all) {
      await db.delete(notificationsTable).where(eq(notificationsTable.userId, user.userId));
    } else if (notificationId) {
      await db
        .delete(notificationsTable)
        .where(
          and(
            eq(notificationsTable.id, Number(notificationId)),
            eq(notificationsTable.userId, user.userId)
          )
        );
    }

    return ResponseWrapper.success();
  } catch (error) {
    console.error('Delete notification error:', error);
    return ResponseWrapper.serverError('Internal server error', error);
  }
}
