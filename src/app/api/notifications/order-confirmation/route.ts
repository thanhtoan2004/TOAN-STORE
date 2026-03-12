import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/mail/email-templates';
import { checkAdminAuth } from '@/lib/auth/auth';

/**
 * API endpoint to send order confirmation email
 * Called after successful order placement (Admin/System only)
 */
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
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { orderDetails } = body;

    if (!orderDetails) {
      return NextResponse.json(
        {
          success: false,
          message: 'Order details are required',
        },
        { status: 400 }
      );
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
        return NextResponse.json(
          {
            success: false,
            message: `Missing required field: ${field}`,
          },
          { status: 400 }
        );
      }
    }

    // Send email
    const sent = await sendOrderConfirmationEmail(orderDetails);

    if (sent) {
      return NextResponse.json({
        success: true,
        message: 'Order confirmation email sent successfully',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send email (SMTP not configured or error occurred)',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Send order email API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
