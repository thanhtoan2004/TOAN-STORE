import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { news as newsTable, newsComments, newsCommentLikes, users } from '@/lib/db/schema';
import { eq, and, sql, desc, or } from 'drizzle-orm';
import { verifyAuth, checkAdminAuth } from '@/lib/auth/auth';
import { withRateLimit } from '@/lib/api/with-rate-limit';
import { createNotification } from '@/lib/notifications/notifications';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * GET - Lấy danh sách bình luận của bài viết news.
 * Hỗ trợ:
 * - Hiển thị tên và ID người dùng, ảnh đại diện.
 * - Kiểm tra trạng thái "Liked" của người dùng hiện tại đối với từng bình luận.
 * - Chỉ trả về các bình luận có trạng thái 'approved'.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const session = await verifyAuth();
    const currentUserId = session?.userId ? Number(session.userId) : null;

    // Lấy news_id từ slug
    const [news] = await db
      .select({ id: newsTable.id })
      .from(newsTable)
      .where(eq(newsTable.slug, slug))
      .limit(1);

    if (!news) {
      return ResponseWrapper.notFound('Bài viết không tồn tại');
    }

    const newsId = news.id;

    // Lấy danh sách comment approved
    // Kiểm tra xem user hiện tại đã like comment chưa
    const comments = await db
      .select({
        id: newsComments.id,
        comment: newsComments.comment,
        createdAt: newsComments.createdAt,
        updatedAt: newsComments.updatedAt,
        parentId: newsComments.parentId,
        likesCount: newsComments.likesCount,
        isEdited: newsComments.isEdited,
        userName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        avatarUrl: users.avatarUrl,
        userId: users.id,
        isLiked: currentUserId
          ? sql<number>`(SELECT COUNT(*) FROM news_comment_likes WHERE comment_id = ${newsComments.id} AND user_id = ${currentUserId})`
          : sql<number>`0`,
      })
      .from(newsComments)
      .leftJoin(users, eq(newsComments.userId, users.id))
      .where(and(eq(newsComments.newsId, newsId), eq(newsComments.status, 'approved')))
      .orderBy(desc(newsComments.createdAt));

    return ResponseWrapper.success(comments);
  } catch (error) {
    console.error('Error fetching news comments:', error);
    return ResponseWrapper.serverError('Lỗi khi tải bình luận', error);
  }
}

/**
 * POST - Gửi bình luận mới hoặc phản hồi.
 * Bảo mật:
 * - Yêu cầu đăng nhập.
 * - Rate Limit: tối đa 3 bình luận/phút.
 * - Kiểm tra độ dài bình luận tối thiểu (2 ký tự).
 * - Gửi thông báo cho chủ sở hữu bình luận gốc nếu là phản hồi (Reply).
 */
async function postCommentHandler(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized('Vui lòng đăng nhập để bình luận');
    }

    const userId = Number(session.userId);
    const { slug } = await params;
    const { comment, parent_id } = await request.json();

    if (!comment || comment.trim().length < 2) {
      return ResponseWrapper.error('Bình luận quá ngắn', 400);
    }

    // Lấy news_id từ slug
    const [news] = await db
      .select({ id: newsTable.id, title: newsTable.title })
      .from(newsTable)
      .where(eq(newsTable.slug, slug))
      .limit(1);

    if (!news) {
      return ResponseWrapper.notFound('Bài viết không tồn tại');
    }

    const newsId = news.id;

    // Lưu bình luận
    const [result] = await db.insert(newsComments).values({
      newsId,
      userId,
      comment,
      status: 'approved',
      parentId: parent_id ? Number(parent_id) : null,
    });

    const insertId = result.insertId;

    // --- Trigger Notification if it's a reply ---
    if (parent_id) {
      try {
        // Get the author of the parent comment
        const [parentComment] = await db
          .select({ userId: newsComments.userId })
          .from(newsComments)
          .where(eq(newsComments.id, Number(parent_id)))
          .limit(1);

        if (parentComment && parentComment.userId !== userId) {
          const recipientId = parentComment.userId;
          // Get replier name
          const [replier] = await db
            .select({ firstName: users.firstName, lastName: users.lastName })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

          const replierName = replier ? `${replier.firstName} ${replier.lastName}` : 'Ai đó';

          await createNotification(
            recipientId,
            'social',
            'Phản hồi mới',
            `${replierName} đã phản hồi bình luận của bạn trong bài viết: ${news.title}`,
            `/news/${slug}`
          );
        }
      } catch (notifyErr) {
        console.error('Failed to send reply notification:', notifyErr);
      }
    }

    // Lấy thông tin user để trả về
    const [userData] = await db
      .select({ firstName: users.firstName, lastName: users.lastName, avatarUrl: users.avatarUrl })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const name = userData ? `${userData.firstName} ${userData.lastName}` : 'User';

    return ResponseWrapper.success(
      {
        id: insertId,
        comment,
        parent_id: parent_id || null,
        is_edited: 0,
        created_at: new Date().toISOString(),
        user_name: name,
        avatar_url: userData?.avatarUrl,
      },
      'Bình luận của bạn đã được gửi thành công',
      201
    );
  } catch (error) {
    console.error('Error posting news comment:', error);
    return ResponseWrapper.serverError('Lỗi khi gửi bình luận', error);
  }
}

/**
 * PATCH - Chỉnh sửa nội dung bình luận.
 * Bảo mật: Chỉ người tạo bình luận mới có quyền chỉnh sửa.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized();
    }

    const { commentId, comment } = await request.json();

    // Kiểm tra quyền sở hữu
    const [existing] = await db
      .select({ userId: newsComments.userId })
      .from(newsComments)
      .where(eq(newsComments.id, Number(commentId)))
      .limit(1);

    if (!existing) {
      return ResponseWrapper.notFound('Bình luận không tồn tại');
    }

    if (existing.userId !== Number(session.userId)) {
      return ResponseWrapper.forbidden('Không có quyền chỉnh sửa');
    }

    await db
      .update(newsComments)
      .set({
        comment,
        isEdited: 1,
        updatedAt: new Date(),
      })
      .where(eq(newsComments.id, Number(commentId)));

    return ResponseWrapper.success(null, 'Cập nhật thành công');
  } catch (error) {
    return ResponseWrapper.serverError('Internal Server Error', error);
  }
}

/**
 * DELETE - Xóa bình luận.
 * Bảo mật: Chỉ người tạo bình luận hoặc Admin mới có quyền xóa.
 * Chức năng: Xóa bình luận gốc và toàn bộ các phản hồi (Replies) liên quan.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized();
    }

    const { commentId } = await request.json();

    // Kiểm tra quyền sở hữu (hoặc admin)
    const [existing] = await db
      .select({ userId: newsComments.userId })
      .from(newsComments)
      .where(eq(newsComments.id, Number(commentId)))
      .limit(1);

    if (!existing) {
      return ResponseWrapper.notFound('Bình luận không tồn tại');
    }

    const adminSession = await checkAdminAuth();

    if (existing.userId !== Number(session.userId) && !adminSession) {
      return ResponseWrapper.forbidden('Không có quyền xóa');
    }

    await db
      .delete(newsComments)
      .where(
        or(eq(newsComments.id, Number(commentId)), eq(newsComments.parentId, Number(commentId)))
      );

    return ResponseWrapper.success(null, 'Xóa bình luận thành công');
  } catch (error) {
    return ResponseWrapper.serverError('Internal Server Error', error);
  }
}

// Rate limit: 3 comments per minute per IP
export const POST = withRateLimit(postCommentHandler, {
  tag: 'news_comment',
  limit: 3,
  windowMs: 60000,
});
