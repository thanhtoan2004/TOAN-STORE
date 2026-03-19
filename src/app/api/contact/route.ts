import { NextRequest, NextResponse } from 'next/server';
import { saveContactMessage } from '@/lib/db/mysql';
import { verifyAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
  userId?: number;
}

/**
 * API Gửi tin nhắn liên hệ từ khách hàng.
 * Bảo mật:
 * - Tự động liên kết tin nhắn với UserId nếu người dùng đã đăng nhập.
 * - Chống UserId Spoofing: Bỏ qua ID do client gửi lên nếu không có session hợp lệ.
 * - Kiểm tra định dạng Email và độ dài tối thiểu của tin nhắn (Cơ chế chống spam cơ bản).
 */
export async function POST(req: NextRequest) {
  try {
    const session = await verifyAuth();
    const body: Partial<ContactRequest> = await req.json();

    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return ResponseWrapper.error('Thiếu thông tin bắt buộc', 400);
    }

    let userId: number | undefined;

    // Security: If user is logged in, use their real ID.
    // If not logged in but they sent an ID, ignore the ID (prevent spoofing).
    if (session) {
      userId = session.userId;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ResponseWrapper.error('Email không hợp lệ', 400);
    }

    // Validate message length
    if (message.length < 10) {
      return ResponseWrapper.error('Tin nhắn phải có ít nhất 10 ký tự', 400);
    }

    // Lưu tin nhắn vào database
    await saveContactMessage({ name, email, subject, message, userId });

    return ResponseWrapper.success(
      null,
      'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong vòng 24 giờ.'
    );
  } catch (error) {
    console.error('Error saving contact message:', error);
    return ResponseWrapper.serverError('Không thể gửi tin nhắn. Vui lòng thử lại sau.', error);
  }
}
