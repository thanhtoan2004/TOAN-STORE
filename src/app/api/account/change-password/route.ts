import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { db } from '@/lib/db/drizzle';
import { users as usersTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
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

    // Get current user using Drizzle
    const [user] = await db
      .select({
        id: usersTable.id,
        password: usersTable.password,
        email: usersTable.email,
        firstName: usersTable.firstName,
      })
      .from(usersTable)
      .where(eq(usersTable.id, session.userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy người dùng' },
        { status: 404 }
      );
    }

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
    await db
      .update(usersTable)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(usersTable.id, session.userId));

    // Gửi email thông báo đổi mật khẩu (Chạy ngầm)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const time = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    try {
      const { sendPasswordChangedEmail } = await import('@/lib/mail/email-templates');
      await sendPasswordChangedEmail(user.email, user.firstName || 'bạn', time, ip);
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
