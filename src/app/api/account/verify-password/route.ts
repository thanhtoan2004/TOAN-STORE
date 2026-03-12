import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { verifyAuth } from '@/lib/auth/auth';
import { executeQuery } from '@/lib/db/mysql';

/**
 * API route to verify user's password for sensitive actions like:
 * - GDPR Data Export
 * - Account Deletion
 */
/**
 * API Xác thực mật khẩu (Password Verification).
 * Đóng vai trò lớp bảo mật bổ sung (Confirmation Step) trước khi người dùng
 * thực hiện các hành động nhạy cảm như Xóa tài khoản hoặc Xuất dữ liệu cá nhân.
 */
export async function POST(req: Request) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { password } = await req.json();
    if (!password) {
      return NextResponse.json(
        { success: false, message: 'Mật khẩu là bắt buộc' },
        { status: 400 }
      );
    }

    const userId = session.userId;

    // Fetch user from DB to get the hashed password
    const users = await executeQuery<any[]>(
      'SELECT password FROM users WHERE id = ? AND deleted_at IS NULL',
      [userId]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy người dùng' },
        { status: 404 }
      );
    }

    const user = users[0];

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Mật khẩu không chính xác' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, message: 'Xác thực thành công' });
  } catch (error: any) {
    console.error('Error verifying password:', error);
    return NextResponse.json(
      { success: false, message: 'Có lỗi xảy ra khi xác thực mật khẩu', error: error.message },
      { status: 500 }
    );
  }
}
