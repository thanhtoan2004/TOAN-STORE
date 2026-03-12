import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { executeQuery } from '@/lib/db/mysql';
import { verifyAuth } from '@/lib/auth/auth';

/**
 * API Đổi mật khẩu người dùng (Change Password).
 * Quy trình:
 * 1. Xác thực Session người dùng.
 * 2. So sánh mật khẩu hiện tại (currentPassword) với bản hash trong DB.
 * 3. Nếu khớp, thực hiện Hash mật khẩu mới và cập nhật vào Database.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Get current user
    const users = (await executeQuery(
      'SELECT id, password, email, first_name FROM users WHERE id = ?',
      [session.userId]
    )) as any[];

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy người dùng' },
        { status: 404 }
      );
    }

    const user = users[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Mật khẩu hiện tại không đúng' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await executeQuery(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, session.userId]
    );

    // Gửi email thông báo đổi mật khẩu (Chạy ngầm)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const time = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    try {
      const { sendPasswordChangedEmail } = await import('@/lib/mail/email-templates');
      await sendPasswordChangedEmail(user.email, user.first_name || 'bạn', time, ip);
    } catch (error) {
      console.warn('Could not load email templates:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Đổi mật khẩu thành công',
    });
  } catch (error) {
    console.error('Lỗi đổi mật khẩu:', error);
    return NextResponse.json(
      { success: false, message: 'Có lỗi xảy ra khi đổi mật khẩu' },
      { status: 500 }
    );
  }
}
