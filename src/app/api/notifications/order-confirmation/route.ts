import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/mail/email-templates';
import { checkAdminAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Gửi lại Email xác nhận đơn hàng (Manual Trigger).
 * Sử dụng khi:
 * 1. Khách hàng báo không nhận được email tự động.
 * 2. Admin muốn kiểm tra lại nội dung hiển thị của email đơn hàng.
 * Bảo mật: Yêu cầu quyền Admin để ngăn chặn việc spam email hàng loạt.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }
    const body = await request.json();
    const { orderDetails } = body;

    if (!orderDetails) {
      return ResponseWrapper.error('Order details are required', 400);
    }

    // Validate required fields
    const required = [
      'orderNumber',
      'customerEmail',
      'customerName',
      'items',
      'total',
      'shippingAddress',
    ];
    for (const field of required) {
      if (!orderDetails[field]) {
        return ResponseWrapper.error(`Missing required field: ${field}`, 400);
      }
    }

    // Send email
    const sent = await sendOrderConfirmationEmail(orderDetails);

    if (sent) {
      return ResponseWrapper.success(null, 'Order confirmation email sent successfully');
    } else {
      return ResponseWrapper.serverError(
        'Failed to send email (SMTP not configured or error occurred)'
      );
    }
  } catch (error) {
    console.error('Send order email API error:', error);
    return ResponseWrapper.serverError('Internal server error', error);
  }
}
