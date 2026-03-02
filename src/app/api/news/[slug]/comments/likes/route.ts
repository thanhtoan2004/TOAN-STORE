import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, transaction } from '@/lib/db/mysql';
import { verifyAuth } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

// POST - Toggle like/unlike a comment
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const session = await verifyAuth();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { commentId } = await request.json();
        const userId = Number(session.userId);

        if (!commentId) {
            return NextResponse.json({ success: false, message: 'Missing commentId' }, { status: 400 });
        }

        const result = await transaction(async (connection) => {
            // Check if already liked
            const [likes]: any = await connection.query(
                'SELECT id FROM news_comment_likes WHERE comment_id = ? AND user_id = ?',
                [commentId, userId]
            );

            let liked = false;
            if (likes.length > 0) {
                // Unlike
                await connection.query(
                    'DELETE FROM news_comment_likes WHERE comment_id = ? AND user_id = ?',
                    [commentId, userId]
                );
                await connection.query(
                    'UPDATE news_comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?',
                    [commentId]
                );
                liked = false;
            } else {
                // Like
                await connection.query(
                    'INSERT INTO news_comment_likes (comment_id, user_id) VALUES (?, ?)',
                    [commentId, userId]
                );
                await connection.query(
                    'UPDATE news_comments SET likes_count = likes_count + 1 WHERE id = ?',
                    [commentId]
                );
                liked = true;
            }

            // Get updated likes count
            const [updated]: any = await connection.query(
                'SELECT likes_count FROM news_comments WHERE id = ?',
                [commentId]
            );

            return { liked, likesCount: updated[0]?.likes_count || 0 };
        });

        // --- NEW: Trigger Notification if it's a LIKE ---
        if (result.liked) {
            try {
                const { slug } = await params;
                // Get the author of the comment
                const commentData = await executeQuery<any[]>(
                    'SELECT user_id, comment FROM news_comments WHERE id = ?',
                    [commentId]
                );

                if (commentData.length > 0 && Number(commentData[0].user_id) !== userId) {
                    const recipientId = Number(commentData[0].user_id);
                    // Get liker name
                    const liker = await executeQuery<any[]>(
                        'SELECT first_name, last_name FROM users WHERE id = ?',
                        [userId]
                    );
                    const likerName = liker.length > 0
                        ? `${liker[0].first_name} ${liker[0].last_name}`
                        : 'Ai đó';

                    await createNotification(
                        recipientId,
                        'social',
                        'Lượt thích mới',
                        `${likerName} đã thích bình luận của bạn: "${commentData[0].comment.substring(0, 50)}${commentData[0].comment.length > 50 ? '...' : ''}"`,
                        `/news/${slug}`
                    );
                }
            } catch (notifyErr) {
                console.error('Failed to send like notification:', notifyErr);
            }
        }

        return NextResponse.json({
            success: true,
            liked: result.liked,
            likesCount: result.likesCount
        });
    } catch (error) {
        console.error('Error toggling comment like:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
