import { NextRequest, NextResponse } from 'next/server';
import {
  getSupportChat,
  getSupportMessages,
  createSupportMessage,
  markMessagesAsRead,
} from '@/lib/db/supportChat';
import { verifyAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

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
      return ResponseWrapper.notFound('Chat not found');
    }

    // Ownership check for registered users
    if (chat.user_id) {
      const session = await verifyAuth();
      if (!session || Number(session.userId) !== chat.user_id) {
        return ResponseWrapper.forbidden('Unauthorized access to chat');
      }
    } else {
      // Guest check via Token
      const token = request.headers.get('x-chat-token');
      if (!token || token !== chat.access_token) {
        return ResponseWrapper.forbidden('Unauthorized access (missing or invalid token)');
      }
    }

    // Get messages
    const messages = await getSupportMessages(chatId, {
      since: since ? new Date(since) : undefined,
      limit,
    });

    // Mark admin messages as read
    await markMessagesAsRead(chatId, 'admin');

    return ResponseWrapper.success({
      messages,
      chatStatus: chat.status,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return ResponseWrapper.serverError('Failed to get messages', error);
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
      return ResponseWrapper.error('Message or image is required', 400);
    }

    // Verify chat exists
    const chat = await getSupportChat(chatId);
    if (!chat) {
      return ResponseWrapper.notFound('Chat not found');
    }

    // Ownership check
    if (chat.user_id) {
      if (!userId || userId !== chat.user_id) {
        return ResponseWrapper.forbidden('Unauthorized');
      }
    } else {
      // Guest check via Token
      const token = request.headers.get('x-chat-token');
      if (!token || token !== chat.access_token) {
        return ResponseWrapper.forbidden('Unauthorized access (missing or invalid token)');
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

    return ResponseWrapper.success({ messageId });
  } catch (error) {
    console.error('Send message error:', error);
    return ResponseWrapper.serverError('Failed to send message', error);
  }
}
