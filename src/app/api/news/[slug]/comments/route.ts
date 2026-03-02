import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { verifyAuth } from '@/lib/auth';
import { withRateLimit } from '@/lib/with-rate-limit';
import { createNotification } from '@/lib/notifications';

// GET - Lấy danh sách bình luận của bài viết news
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const session = await verifyAuth();
        const currentUserId = session?.userId ? Number(session.userId) : null;

        // Lấy news_id từ slug
        const news = await executeQuery<any[]>(
            'SELECT id FROM news WHERE slug = ?',
            [slug]
        );

        if (news.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Bài viết không tồn tại' },
                { status: 404 }
            );
        }

        const newsId = news[0].id;

        // Lấy danh sách comment approved
        // Kiểm tra xem user hiện tại đã like comment chưa
        const comments = await executeQuery<any[]>(
            `SELECT 
                c.id, c.comment, c.created_at, c.updated_at, c.parent_id, c.likes_count, c.is_edited,
                u.full_name as user_name, u.avatar_url, u.id as user_id,
                CONCAT(u.first_name, ' ', u.last_name) as user_name,
                (SELECT COUNT(*) FROM news_comment_likes WHERE comment_id = c.id AND user_id = ?) as is_liked
             FROM news_comments c
             LEFT JOIN users u ON c.user_id = u.id
             WHERE c.news_id = ? AND c.status = 'approved'
             ORDER BY c.created_at DESC`,
            [currentUserId, newsId]
        );

        return NextResponse.json({
            success: true,
            data: comments
        });
    } catch (error) {
        console.error('Error fetching news comments:', error);
        return NextResponse.json(
            { success: false, message: 'Lỗi khi tải bình luận' },
            { status: 500 }
        );
    }
}

// POST - Gửi bình luận mới hoặc phản hồi
async function postCommentHandler(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const session = await verifyAuth();
        if (!session) {
            return NextResponse.json(
                { success: false, message: 'Vui lòng đăng nhập để bình luận' },
                { status: 401 }
            );
        }

        const userId = Number(session.userId);
        const { slug } = await params;
        const { comment, parent_id } = await request.json();

        if (!comment || comment.trim().length < 2) {
            return NextResponse.json(
                { success: false, message: 'Bình luận quá ngắn' },
                { status: 400 }
            );
        }

        // Lấy news_id từ slug
        const news = await executeQuery<any[]>(
            'SELECT id, title FROM news WHERE slug = ?',
            [slug]
        );

        if (news.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Bài viết không tồn tại' },
                { status: 404 }
            );
        }

        const newsId = news[0].id;

        // Lưu bình luận
        const result = await executeQuery<any>(
            `INSERT INTO news_comments (news_id, user_id, comment, status, parent_id)
             VALUES (?, ?, ?, 'approved', ?)`,
            [newsId, userId, comment, parent_id || null]
        );

        // --- NEW: Trigger Notification if it's a reply ---
        if (parent_id) {
            try {
                // Get the author of the parent comment
                const parentComment = await executeQuery<any[]>(
                    'SELECT user_id FROM news_comments WHERE id = ?',
                    [parent_id]
                );

                if (parentComment.length > 0 && Number(parentComment[0].user_id) !== userId) {
                    const recipientId = Number(parentComment[0].user_id);
                    // Get replier name
                    const replier = await executeQuery<any[]>(
                        'SELECT first_name, last_name FROM users WHERE id = ?',
                        [userId]
                    );
                    const replierName = replier.length > 0
                        ? `${replier[0].first_name} ${replier[0].last_name}`
                        : 'Ai đó';

                    await createNotification(
                        recipientId,
                        'social',
                        'Phản hồi mới',
                        `${replierName} đã phản hồi bình luận của bạn trong bài viết: ${news[0].title}`,
                        `/news/${slug}`
                    );
                }
            } catch (notifyErr) {
                console.error('Failed to send reply notification:', notifyErr);
            }
        }

        // Lấy thông tin user để trả về
        const userData = await executeQuery<any[]>(
            'SELECT first_name, last_name, avatar_url FROM users WHERE id = ?',
            [userId]
        );
        const name = userData.length > 0
            ? `${userData[0].first_name} ${userData[0].last_name}`
            : 'User';

        return NextResponse.json({
            success: true,
            message: 'Bình luận của bạn đã được gửi thành công',
            data: {
                id: result.insertId,
                comment,
                parent_id: parent_id || null,
                is_edited: 0,
                created_at: new Date().toISOString(),
                user_name: name,
                avatar_url: userData[0]?.avatar_url
            }
        });
    } catch (error) {
        console.error('Error posting news comment:', error);
        return NextResponse.json(
            { success: false, message: 'Lỗi khi gửi bình luận' },
            { status: 500 }
        );
    }
}

// PATCH - Chỉnh sửa bình luận
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const session = await verifyAuth();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { commentId, comment } = await request.json();

        // Kiểm tra quyền sở hữu
        const existing = await executeQuery<any[]>(
            'SELECT user_id FROM news_comments WHERE id = ?',
            [commentId]
        );

        if (existing.length === 0) {
            return NextResponse.json({ success: false, message: 'Bình luận không tồn tại' }, { status: 404 });
        }

        if (Number(existing[0].user_id) !== Number(session.userId)) {
            return NextResponse.json({ success: false, message: 'Không có quyền chỉnh sửa' }, { status: 403 });
        }

        await executeQuery(
            'UPDATE news_comments SET comment = ?, is_edited = 1, updated_at = NOW() WHERE id = ?',
            [comment, commentId]
        );

        return NextResponse.json({ success: true, message: 'Cập nhật thành công' });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE - Xóa bình luận
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const session = await verifyAuth();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { commentId } = await request.json();

        // Kiểm tra quyền sở hữu (hoặc admin)
        const existing = await executeQuery<any[]>(
            'SELECT user_id FROM news_comments WHERE id = ?',
            [commentId]
        );

        if (existing.length === 0) {
            return NextResponse.json({ success: false, message: 'Bình luận không tồn tại' }, { status: 404 });
        }

        if (Number(existing[0].user_id) !== Number(session.userId) && !session.is_admin) {
            return NextResponse.json({ success: false, message: 'Không có quyền xóa' }, { status: 403 });
        }

        await executeQuery('DELETE FROM news_comments WHERE id = ? OR parent_id = ?', [commentId, commentId]);

        return NextResponse.json({ success: true, message: 'Xóa bình luận thành công' });
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}

// Rate limit: 3 comments per minute per IP
export const POST = withRateLimit(postCommentHandler, {
    tag: 'news_comment',
    limit: 3,
    windowMs: 60000
});
