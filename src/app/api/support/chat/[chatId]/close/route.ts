import { NextRequest, NextResponse } from 'next/server';
import { getSupportChat, updateChatStatus } from '@/lib/db/supportChat';
import { verifyAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Kết thúc phiên hỗ trợ.
 * Bảo mật: Chỉ chủ sở hữu phiên chat (khớp UserId hoặc Guest Token) mới có quyền đóng chat.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId: chatIdStr } = await params;
    const chatId = parseInt(chatIdStr);

    // Verify chat exists
    const chat = await getSupportChat(chatId);
    if (!chat) {
      return ResponseWrapper.notFound('Chat not found');
    }

    // Ownership check
    if (chat.user_id) {
      const session = await verifyAuth();
      if (!session || Number(session.userId) !== chat.user_id) {
        return ResponseWrapper.forbidden('Unauthorized');
      }
    } else {
      // Guest check via Token
      const token = request.headers.get('x-chat-token');
      if (!token || token !== chat.access_token) {
        return ResponseWrapper.forbidden('Unauthorized access (missing or invalid token)');
      }
    }

    // Update status to closed
    await updateChatStatus(chatId, 'closed');

    return ResponseWrapper.success(null, 'Chat closed successfully');
  } catch (error) {
    console.error('Close chat error:', error);
    return ResponseWrapper.serverError('Failed to close chat', error);
  }
}
