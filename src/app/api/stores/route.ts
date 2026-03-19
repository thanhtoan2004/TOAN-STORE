import { NextRequest, NextResponse } from 'next/server';
import { getStores } from '@/lib/db/mysql';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Lấy danh sách hệ thống cửa hàng TOAN Store.
 * Hỗ trợ lọc theo thành phố (City) để khách hàng tìm kiếm địa điểm gần nhất.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city') || undefined;

    const stores = await getStores(city);

    return ResponseWrapper.success(stores);
  } catch (error) {
    console.error('Error fetching stores:', error);
    return ResponseWrapper.serverError('Không thể lấy danh sách cửa hàng', error);
  }
}
