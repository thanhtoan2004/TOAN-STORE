import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { verifyAuth } from '@/lib/auth/auth';
import { db } from '@/lib/db/drizzle';
import { users as usersTable } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Xác thực mật khẩu (Password Verification).
 * Đóng vai trò lớp bảo mật bổ sung (Confirmation Step) trước khi người dùng
 * thực hiện các hành động nhạy cảm như Xóa tài khoản hoặc Xuất dữ liệu cá nhân.
 *
 * Các trường hợp sử dụng:
 * - GDPR Data Export
 * - Account Deletion
 * - Changing sensitive account settings
 */
export async function POST(req: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized();
    }

    const { password } = await req.json();
    if (!password) {
      return ResponseWrapper.error('Mật khẩu là bắt buộc', 400);
    }

    const userId = session.userId;

    // Fetch user from DB to get the hashed password using Drizzle
    const [user] = await db
      .select({ password: usersTable.password })
      .from(usersTable)
      .where(and(eq(usersTable.id, userId), isNull(usersTable.deletedAt)))
      .limit(1);

    if (!user) {
      return ResponseWrapper.notFound('Không tìm thấy người dùng');
    }

    // Compare password
    const isPasswordValid = user.password ? await bcrypt.compare(password, user.password) : false;

    if (!isPasswordValid) {
      return ResponseWrapper.unauthorized('Mật khẩu không chính xác');
    }

    return ResponseWrapper.success(null, 'Xác thực thành công');
  } catch (error: any) {
    console.error('Error verifying password:', error);
    return ResponseWrapper.serverError('Có lỗi xảy ra khi xác thực mật khẩu', error);
  }
}
