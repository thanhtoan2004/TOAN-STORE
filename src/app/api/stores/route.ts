import { NextRequest, NextResponse } from 'next/server';
import { getStores } from '@/lib/db/mysql';

/**
 * API Lấy danh sách hệ thống cửa hàng Nike Store.
 * Hỗ trợ lọc theo thành phố (City) để khách hàng tìm kiếm địa điểm gần nhất.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city') || undefined;

    const stores = await getStores(city);

    return NextResponse.json({
      success: true,
      data: stores
    });
  } catch (error) {
    console.error('Error fetching stores:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Không thể lấy danh sách cửa hàng'
      },
      { status: 500 }
    );
  }
}
