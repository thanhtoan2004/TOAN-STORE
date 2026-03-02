import { NextRequest, NextResponse } from 'next/server';
import { getSupportChat, markMessagesAsRead } from '@/lib/db/supportChat';
import { verifyAuth } from '@/lib/auth';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ chatId: string }> }
) {
    try {
        const { chatId: chatIdStr } = await params;
        const chatId = parseInt(chatIdStr);
        const session = await verifyAuth();
        const userId = session?.userId ? Number(session.userId) : null;
        const isAdmin = session?.role === 'admin' || session?.role === 'super_admin';

        // Verify chat exists
        const chat = await getSupportChat(chatId);
        if (!chat) {
            return NextResponse.json({ success: false, error: 'Chat not found' }, { status: 404 });
        }

        // Ownership/Permission check
        if (!isAdmin) {
            if (chat.user_id) {
                if (!userId || userId !== chat.user_id) {
                    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
                }
            } else {
                const token = request.headers.get('x-chat-token');
                if (!token || token !== chat.access_token) {
                    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
                }
            }
        }

        // If admin is marking as read, they are reading customer messages
        // If customer is marking as read, they are reading admin messages
        const targetSenderType = isAdmin ? 'customer' : 'admin';

        await markMessagesAsRead(chatId, targetSenderType);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Mark read error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
