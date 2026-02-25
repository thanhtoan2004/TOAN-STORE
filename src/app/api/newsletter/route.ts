import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { withRateLimit } from '@/lib/with-rate-limit';

/**
 * API Đăng ký bản tin (Newsletter Subscription).
 * Chức năng:
 * 1. Lưu email/tên khách hàng muốn nhận tin khuyến mãi.
 * 2. Tự động kích hoạt lại nếu email đã từng Unsubscribe.
 * 3. Bảo vệ bằng Rate Limit: Tối đa 5 lần thử/phút để tránh spam bots.
 */
async function newsletterHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const { email, name } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Email không hợp lệ' },
        { status: 400 }
      );
    }

    // Kiểm tra email đã đăng ký chưa
    const existing = await executeQuery<any[]>(
      'SELECT id, status FROM newsletter_subscriptions WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      if (existing[0].status === 'subscribed') {
        return NextResponse.json(
          { success: false, message: 'Email này đã đăng ký nhận tin' },
          { status: 400 }
        );
      } else {
        // Reactive subscription
        await executeQuery(
          'UPDATE newsletter_subscriptions SET status = ?, unsubscribed_at = NULL WHERE email = ?',
          ['subscribed', email]
        );
        return NextResponse.json({
          success: true,
          message: 'Đã kích hoạt lại đăng ký nhận tin!'
        });
      }
    }

    // Thêm subscription mới
    await executeQuery(
      'INSERT INTO newsletter_subscriptions (email, name, status) VALUES (?, ?, ?)',
      [email, name || null, 'subscribed']
    );

    return NextResponse.json({
      success: true,
      message: 'Đăng ký nhận tin thành công!'
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Không thể đăng ký nhận tin'
      },
      { status: 500 }
    );
  }
}

// Rate limit: 5 requests per 60 seconds per IP to prevent spam
export const POST = withRateLimit(newsletterHandler, {
  tag: 'newsletter',
  limit: 5,
  windowMs: 60_000
});
