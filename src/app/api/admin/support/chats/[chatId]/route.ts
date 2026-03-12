import { NextRequest, NextResponse } from 'next/server';
import {
  getSupportChat,
  assignChatToAdmin,
  createSupportMessage,
  updateChatStatus,
  markMessagesAsRead,
} from '@/lib/db/supportChat';
import { checkAdminAuth } from '@/lib/auth/auth';

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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { chatId: chatIdStr } = await params;
    const chatId = parseInt(chatIdStr);

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

    return NextResponse.json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error('Get chat details error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get chat details',
      },
      { status: 500 }
    );
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
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { chatId: chatIdStr } = await params;
    const chatId = parseInt(chatIdStr);
    const body = await request.json();
    const { action, adminId, message } = body;

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

    switch (action) {
      case 'assign':
        if (!adminId) {
          return NextResponse.json(
            {
              success: false,
              error: 'Admin ID is required',
            },
            { status: 400 }
          );
        }
        await assignChatToAdmin(chatId, adminId);
        await markMessagesAsRead(chatId, 'customer');
        return NextResponse.json({
          success: true,
          message: 'Chat assigned successfully',
        });

      case 'send_message':
        if ((!message || !message.trim()) && !body.imageUrl && !adminId) {
          return NextResponse.json(
            {
              success: false,
              error: 'Message or image and admin ID are required',
            },
            { status: 400 }
          );
        }
        const messageId = await createSupportMessage({
          chatId,
          senderType: 'admin',
          senderId: adminId,
          message: message?.trim() || '',
          imageUrl: body.imageUrl,
        });
        return NextResponse.json({
          success: true,
          messageId,
        });

      case 'resolve':
        await updateChatStatus(chatId, 'resolved');
        return NextResponse.json({
          success: true,
          message: 'Chat resolved successfully',
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Admin chat action error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform action',
      },
      { status: 500 }
    );
  }
}
