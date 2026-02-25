import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getRedisConnection } from '@/lib/redis';

/**
 * GET /api/account/sessions
 * Trả về danh sách các phiên đăng nhập (thiết bị) đang hoạt động của người dùng.
 * Dữ liệu được lưu trong Redis hash: sessions:{userId} với key là sessionId.
 */
export async function GET(req: NextRequest) {
    const session = await verifyAuth();
    if (!session) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const redis = getRedisConnection();
        const sessionsKey = `sessions:${session.userId}`;
        const raw = await redis.hgetall(sessionsKey);

        if (!raw) {
            return NextResponse.json({ success: true, sessions: [] });
        }

        const sessions = Object.entries(raw).map(([id, val]) => {
            try {
                return { id, ...JSON.parse(val as string) };
            } catch {
                return null;
            }
        }).filter(Boolean);

        // Sắp xếp mới nhất lên đầu
        sessions.sort((a: any, b: any) => (b.loginAt || 0) - (a.loginAt || 0));

        return NextResponse.json({ success: true, sessions });
    } catch (error) {
        console.error('Get sessions error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/account/sessions
 * Thu hồi một phiên đăng nhập cụ thể theo sessionId.
 * Nếu sessionId = 'all' thì thu hồi tất cả (ngoại trừ phiên hiện tại).
 */
export async function DELETE(req: NextRequest) {
    const session = await verifyAuth();
    if (!session) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { sessionId } = await req.json();
        const redis = getRedisConnection();
        const sessionsKey = `sessions:${session.userId}`;

        if (sessionId === 'all') {
            await redis.del(sessionsKey);
            // Cũng đá token refresh để buộc đăng nhập lại
            await redis.del(`refresh_token:${session.userId}`);
            return NextResponse.json({ success: true, message: 'Đã đăng xuất khỏi tất cả thiết bị' });
        }

        if (!sessionId) {
            return NextResponse.json({ success: false, message: 'Thiếu sessionId' }, { status: 400 });
        }

        await redis.hdel(sessionsKey, sessionId);
        return NextResponse.json({ success: true, message: 'Đã thu hồi phiên đăng nhập' });

    } catch (error) {
        console.error('Delete session error:', error);
        return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
    }
}
