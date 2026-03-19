import { NextRequest, NextResponse } from 'next/server';
import { getAdminChats } from '@/lib/db/supportChat';
import { checkAdminAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Lấy danh sách các phiên Chat hỗ trợ (Support Sessions).
 * Phân trang và lọc theo trạng thái (Đang chờ, Đang xử lý, Đã đóng).
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // M2: Cap limit

    const { chats, total } = await getAdminChats({
      status,
      search,
      page,
      limit,
    });

    const result = {
      chats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return ResponseWrapper.success(result);
  } catch (error) {
    console.error('Get admin chats error:', error);
    return ResponseWrapper.serverError('Failed to get chats', error);
  }
}
