import { NextRequest, NextResponse } from 'next/server';
import { getSupportChat, markMessagesAsRead } from '@/lib/db/supportChat';
import { verifyAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId: chatIdStr } = await params;
    const chatId = parseInt(chatIdStr);
    const session = await verifyAuth();
    const userId = session?.userId ? Number(session.userId) : null;
    const isAdmin =
      session?.role === 'admin' || session?.role === 'super_admin' || session?.role === 'support';

    // Verify chat exists
    const chat = await getSupportChat(chatId);
    if (!chat) {
      return ResponseWrapper.notFound('Chat not found');
    }

    // Ownership/Permission check
    if (!isAdmin) {
      if (chat.user_id) {
        if (!userId || userId !== chat.user_id) {
          return ResponseWrapper.forbidden('Unauthorized');
        }
      } else {
        const token = request.headers.get('x-chat-token');
        if (!token || token !== chat.access_token) {
          return ResponseWrapper.forbidden('Unauthorized');
        }
      }
    }

    // If admin is marking as read, they are reading customer messages
    // If customer is marking as read, they are reading admin messages
    const targetSenderType = isAdmin ? 'customer' : 'admin';

    await markMessagesAsRead(chatId, targetSenderType);

    return ResponseWrapper.success();
  } catch (error) {
    console.error('Mark read error:', error);
    return ResponseWrapper.serverError('Internal server error', error);
  }
}
