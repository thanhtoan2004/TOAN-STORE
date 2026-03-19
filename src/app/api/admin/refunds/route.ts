import { NextRequest, NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth/auth';
import { getAllRefunds } from '@/lib/db/repositories/refund';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Lấy danh sách các yêu cầu Hoàn tiền (Refund Requests).
 * Dành cho Admin kiểm duyệt và xử lý tài chính.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const status = searchParams.get('status') || undefined;

    const result = await getAllRefunds(page, limit, status);

    return ResponseWrapper.success(result);
  } catch (error: any) {
    console.error('Admin Get Refunds Error:', error);
    return ResponseWrapper.serverError(error.message || 'Lỗi khi tải danh sách hoàn tiền', error);
  }
}
