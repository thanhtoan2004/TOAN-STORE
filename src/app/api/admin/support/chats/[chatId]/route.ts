import { NextRequest, NextResponse } from 'next/server';
import {
  getSupportChat,
  assignChatToAdmin,
  createSupportMessage,
  updateChatStatus,
  markMessagesAsRead,
} from '@/lib/db/supportChat';
import { checkAdminAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Lấy chi tiết lịch sử trò chuyện (Messages) của một phiên chat.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }
    const { chatId: chatIdStr } = await params;
    const chatId = parseInt(chatIdStr);

    const chat = await getSupportChat(chatId);
    if (!chat) {
      return ResponseWrapper.notFound('Chat not found');
    }

    return ResponseWrapper.success(chat);
  } catch (error) {
    console.error('Get chat details error:', error);
    return ResponseWrapper.serverError('Failed to get chat details', error);
  }
}

/**
 * API Xử lý hành động trong phiên Chat.
 * Hành động:
 * 1. `assign`: Gán phiên chat cho một nhân viên hỗ trợ.
 * 2. `send_message`: Gửi tin nhắn trả lời từ Admin (kèm ảnh nếu có).
 * 3. `resolve`: Đóng phiên chat sau khi hỗ trợ xong.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }
    const { chatId: chatIdStr } = await params;
    const chatId = parseInt(chatIdStr);
    const body = await request.json();
    const { action, adminId, message } = body;

    const chat = await getSupportChat(chatId);
    if (!chat) {
      return ResponseWrapper.notFound('Chat not found');
    }

    switch (action) {
      case 'assign':
        if (!adminId) {
          return ResponseWrapper.error('Admin ID is required', 400);
        }
        await assignChatToAdmin(chatId, adminId);
        await markMessagesAsRead(chatId, 'customer');
        return ResponseWrapper.success(null, 'Chat assigned successfully');

      case 'send_message':
        if ((!message || !message.trim()) && !body.imageUrl && !adminId) {
          return ResponseWrapper.error('Message or image and admin ID are required', 400);
        }
        const messageId = await createSupportMessage({
          chatId,
          senderType: 'admin',
          senderId: adminId,
          message: message?.trim() || '',
          imageUrl: body.imageUrl,
        });
        return ResponseWrapper.success({ messageId }, 'Message sent successfully');

      case 'resolve':
        await updateChatStatus(chatId, 'resolved');
        return ResponseWrapper.success(null, 'Chat resolved successfully');

      default:
        return ResponseWrapper.error('Invalid action', 400);
    }
  } catch (error) {
    console.error('Admin chat action error:', error);
    return ResponseWrapper.serverError('Failed to perform action', error);
  }
}
