import { NextRequest, NextResponse } from 'next/server';
import { getSupportChat, updateChatStatus } from '@/lib/db/supportChat';
import { verifyAuth } from '@/lib/auth/auth';

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
      return NextResponse.json(
        {
          success: false,
          error: 'Chat not found',
        },
        { status: 404 }
      );
    }

    // Ownership check
    if (chat.user_id) {
      const session = await verifyAuth();
      if (!session || Number(session.userId) !== chat.user_id) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
      }
    } else {
      // Guest check via Token
      const token = request.headers.get('x-chat-token');
      if (!token || token !== chat.access_token) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized access (missing or invalid token)' },
          { status: 403 }
        );
      }
    }

    // Update status to closed
    await updateChatStatus(chatId, 'closed');

    return NextResponse.json({
      success: true,
      message: 'Chat closed successfully',
    });
  } catch (error) {
    console.error('Close chat error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to close chat',
      },
      { status: 500 }
    );
  }
}
