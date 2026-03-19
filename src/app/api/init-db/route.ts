import { NextRequest, NextResponse } from 'next/server';
import { testConnection, initDb } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Khởi tạo cấu trúc Cơ sở dữ liệu (Database Initialization).
 * Chỉ dành cho môi trường Development/Staging để thiết lập bảng ban đầu.
 * Bị chặn hoàn toàn ở môi trường Production để bảo vệ dữ liệu.
 */
export async function GET() {
  try {
    // Block in production — this route should only be used during setup
    if (process.env.NODE_ENV === 'production') {
      return ResponseWrapper.forbidden('Not available in production');
    }

    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }
    // Kiểm tra kết nối database
    const connected = await testConnection();
    if (!connected) {
      return ResponseWrapper.error('Không thể kết nối đến MySQL', 500);
    }

    // Khởi tạo bảng users và các thành phần cốt lõi
    await initDb();

    return ResponseWrapper.success(null, 'Cơ sở dữ liệu đã được khởi tạo thành công');
  } catch (error) {
    console.error('Lỗi khởi tạo cơ sở dữ liệu:', error);
    return ResponseWrapper.serverError('Đã xảy ra lỗi khi khởi tạo cơ sở dữ liệu', error);
  }
}
