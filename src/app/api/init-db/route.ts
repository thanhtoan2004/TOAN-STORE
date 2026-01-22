import { NextResponse } from 'next/server';
import { testConnection, initDb } from '@/lib/db/mysql';

export async function GET() {
  try {
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