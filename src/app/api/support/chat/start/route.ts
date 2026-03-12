import { NextRequest, NextResponse } from 'next/server';
import { createSupportChat, getUserActiveChat, getGuestActiveChat } from '@/lib/db/supportChat';
import { verifyAuth } from '@/lib/auth/auth';

/**
 * API Bắt đầu phiên hỗ trợ trực tuyến (Support Chat).
 * Chức năng:
 * 1. Tạo phiên chat mới hoặc khôi phục phiên chat cũ (Resume) nếu còn hoạt động.
 * 2. Hỗ trợ cả thành viên và khách vãng lai (Guest).
 * 3. Cấp Access Token cho khách để bảo mật phiên chat mà không cần login.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuth();
    const body = await request.json();
    const { guestEmail, guestName, initialMessage } = body;
    const userId = session?.userId ? Number(session.userId) : null;

    // Validation
    if (!userId && (!guestEmail || !guestName)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Login or guest information is required',
        },
        { status: 400 }
      );
    }

    // Check if user already has an active chat
    let existingChat;
    if (userId) {
      existingChat = await getUserActiveChat(userId);
    } else if (guestEmail) {
      existingChat = await getGuestActiveChat(guestEmail);
    }

    if (existingChat) {
      return NextResponse.json({
        success: true,
        chatId: existingChat.id,
        status: existingChat.status,
        message: 'Resumed existing chat session',
      });
    }

    const { chatId, accessToken } = await createSupportChat({
      userId: userId || undefined,
      guestEmail,
      guestName,
      initialMessage,
    });

    return NextResponse.json({
      success: true,
      chatId,
      accessToken,
      status: 'waiting',
      message: 'Chat session created',
    });
  } catch (error) {
    console.error('Start chat error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to start chat',
      },
      { status: 500 }
    );
  }
}
