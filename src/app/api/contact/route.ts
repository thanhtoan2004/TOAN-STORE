import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse, createSuccessResponse, validateRequiredFields, withErrorHandling } from '@/lib/api-utils';
import { saveContactMessage } from '@/lib/db/mysql';

interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
  userId?: number;
}

async function contactHandler(req: NextRequest): Promise<NextResponse> {
  const body: Partial<ContactRequest> = await req.json();
  
  const validation = validateRequiredFields(body, ['name', 'email', 'subject', 'message']);
  if (!validation.isValid) {
    return createErrorResponse(validation.error, 400);
  }

  const { name, email, subject, message, userId } = body as ContactRequest;

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return createErrorResponse('Email không hợp lệ', 400);
  }

  // Validate message length
  if (message.length < 10) {
    return createErrorResponse('Tin nhắn phải có ít nhất 10 ký tự', 400);
  }

  try {
    // Lưu tin nhắn vào database
    await saveContactMessage({ name, email, subject, message, userId });

    // Log the contact form submission
    console.log('Contact form submission:', { name, email, subject, message });

    return createSuccessResponse(
      null,
      'Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong vòng 24 giờ.'
    );
  } catch (error) {
    console.error('Error saving contact message:', error);
    return createErrorResponse('Không thể gửi tin nhắn. Vui lòng thử lại sau.', 500);
  }
}

export const POST = withErrorHandling(contactHandler);
