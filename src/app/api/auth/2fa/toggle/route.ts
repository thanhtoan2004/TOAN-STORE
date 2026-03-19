import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { verifyAuth } from '@/lib/auth/auth';
import bcrypt from 'bcrypt';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Kiểm tra trạng thái bảo mật 2 lớp (2FA).
 * Cơ chế: Tự động đảm bảo cột `two_factor_enabled` tồn tại trong bảng `users` (Auto-migration).
 */
export async function GET() {
  try {
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized();
    }

    const [user] = await executeQuery<any[]>(
      'SELECT COALESCE(two_factor_enabled, 0) as two_factor_enabled FROM users WHERE id = ?',
      [session.userId]
    );

    return ResponseWrapper.success({
      enabled: user?.two_factor_enabled === 1,
    });
  } catch (error) {
    console.error('2FA status error:', error);
    return ResponseWrapper.serverError('Server error', error);
  }
}

/**
 * API Bật/Tắt bảo mật 2 lớp cho tài khoản người dùng.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized();
    }

    const { enabled, password } = await request.json();

    if (!password) {
      return ResponseWrapper.error('Vui lòng nhập mật khẩu để xác nhận', 400);
    }

    const users = await executeQuery<any[]>('SELECT password FROM users WHERE id = ?', [
      session.userId,
    ]);

    if (!users || users.length === 0) {
      return ResponseWrapper.notFound('Không tìm thấy người dùng');
    }

    const isValid = await bcrypt.compare(password, users[0].password);
    if (!isValid) {
      return ResponseWrapper.error('Mật khẩu không chính xác', 400);
    }

    await executeQuery('UPDATE users SET two_factor_enabled = ? WHERE id = ?', [
      enabled ? 1 : 0,
      session.userId,
    ]);

    return ResponseWrapper.success(
      {
        enabled: !!enabled,
      },
      enabled ? 'Đã bật xác thực 2 bước' : 'Đã tắt xác thực 2 bước'
    );
  } catch (error) {
    console.error('2FA toggle error:', error);
    return ResponseWrapper.serverError('Server error', error);
  }
}
