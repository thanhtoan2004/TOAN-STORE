import { NextResponse } from 'next/server';
import { testConnection, initDb } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth';

/**
 * API Khởi tạo cấu trúc Cơ sở dữ liệu (Database Initialization).
 * Chỉ dành cho môi trường Development/Staging để thiết lập bảng ban đầu.
 * Bị chặn hoàn toàn ở môi trường Production để bảo vệ dữ liệu.
 */
export async function GET() {
  try {
    // Block in production — this route should only be used during setup
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, message: 'Not available in production' }, { status: 403 });
    }

    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    // Kiểm tra kết nối database
    const connected = await testConnection();
    if (!connected) {
      return NextResponse.json(
        { error: 'Không thể kết nối đến MySQL' },
        { status: 500 }
      );
    }

    // Khởi tạo bảng users
    const initialized = await initDb();
    if (!initialized) {
      return NextResponse.json(
        { error: 'Không thể khởi tạo cơ sở dữ liệu' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cơ sở dữ liệu đã được khởi tạo thành công'
    });
  } catch (error) {
    console.error('Lỗi khởi tạo cơ sở dữ liệu:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi khởi tạo cơ sở dữ liệu' },
      { status: 500 }
    );
  }
} 