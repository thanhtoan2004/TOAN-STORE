import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

export async function POST(request: NextRequest) {
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
      if (existing[0].status === 'active') {
        return NextResponse.json(
          { success: false, message: 'Email này đã đăng ký nhận tin' },
          { status: 400 }
        );
      } else {
        // Reactive subscription
        await executeQuery(
          'UPDATE newsletter_subscriptions SET status = ?, unsubscribed_at = NULL WHERE email = ?',
          ['active', email]
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
      [email, name || null, 'active']
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
