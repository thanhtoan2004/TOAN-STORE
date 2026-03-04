import { NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { getAllRefunds } from '@/lib/db/repositories/refund';

/**
 * API Lấy danh sách các yêu cầu Hoàn tiền (Refund Requests).
 * Dành cho Admin kiểm duyệt và xử lý tài chính.
 */
export async function GET(request: Request) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // M2: Cap limit
    const status = searchParams.get('status') || undefined;

    const result = await getAllRefunds(page, limit, status);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Admin Get Refunds Error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
