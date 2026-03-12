import { NextRequest, NextResponse } from 'next/server';
import {
  getSupportChat,
  getSupportMessages,
  createSupportMessage,
  markMessagesAsRead,
} from '@/lib/db/supportChat';
import { verifyAuth } from '@/lib/auth/auth';

/**
 * API Lấy danh sách tin nhắn trong phiên chat.
 * Tính năng: Tự động đánh dấu các tin nhắn từ Admin là "Đã đọc" khi khách hàng truy xuất tin nhắn mới.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId: chatIdStr } = await params;
    const chatId = parseInt(chatIdStr);
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get chat to verify it exists
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

    // Ownership check for registered users
    if (chat.user_id) {
      const session = await verifyAuth();
      if (!session || Number(session.userId) !== chat.user_id) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized access to chat' },
          { status: 403 }
        );
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

    // Get messages
    const messages = await getSupportMessages(chatId, {
      since: since ? new Date(since) : undefined,
      limit,
    });

    // Mark admin messages as read
    await markMessagesAsRead(chatId, 'admin');

    return NextResponse.json({
      success: true,
      messages,
      chatStatus: chat.status,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get messages',
      },
      { status: 500 }
    );
  }
}

/**
 * API Gửi tin nhắn mới từ phía khách hàng lên hệ thống hỗ trợ.
 * Hỗ trợ gửi văn bản kèm theo hình ảnh minh họa (imageUrl).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId: chatIdStr } = await params;
    const chatId = parseInt(chatIdStr);
    const session = await verifyAuth();
    const body = await request.json();
    const { message, imageUrl } = body;
    const userId = session?.userId ? Number(session.userId) : null;

    if ((!message || !message.trim()) && !imageUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Message or image is required',
        },
        { status: 400 }
      );
    }

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
      if (!userId || userId !== chat.user_id) {
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

    // Create message
    const messageId = await createSupportMessage({
      chatId,
      senderType: 'customer',
      senderId: userId || undefined,
      message: message?.trim() || '',
      imageUrl,
    });

    return NextResponse.json({
      success: true,
      messageId,
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send message',
      },
      { status: 500 }
    );
  }
}
