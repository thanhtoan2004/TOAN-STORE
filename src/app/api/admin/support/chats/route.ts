import { NextRequest, NextResponse } from 'next/server';
import { getAdminChats } from '@/lib/db/supportChat';
import { checkAdminAuth } from '@/lib/auth/auth';

/**
 * API Lấy danh sách các phiên Chat hỗ trợ (Support Sessions).
 * Phân trang và lọc theo trạng thái (Đang chờ, Đang xử lý, Đã đóng).
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // M2: Cap limit

    const { chats, total } = await getAdminChats({
      status,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      chats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get admin chats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get chats',
      },
      { status: 500 }
    );
  }
}
