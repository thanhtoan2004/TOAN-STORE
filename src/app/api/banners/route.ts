import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

// GET - Lấy danh sách banners
/**
 * API Lấy danh sách Banner quảng cáo theo vị trí.
 * Cơ chế: 
 * 1. Chỉ lấy các banner đang hoạt động và trong thời hạn cho phép.
 * 2. Tự động cộng dồn lượt hiển thị (Impression count) cho các banner được trả về.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position') || 'homepage';
    const activeOnly = searchParams.get('activeOnly') !== 'false'; // default true

    let query = 'SELECT * FROM banners WHERE position = ?';
    const params: any[] = [position];

    if (activeOnly) {
      const now = new Date().toISOString();
      query += ' AND is_active = 1 AND (start_date IS NULL OR start_date <= ?) AND (end_date IS NULL OR end_date >= ?)';
      params.push(now, now);
    }

    query += ' ORDER BY display_order ASC, created_at DESC';

    const banners = await executeQuery<any[]>(query, params);

    // Update impression count for active banners
    if (activeOnly && banners.length > 0) {
      const bannerIds = banners.map(b => b.id);
      await executeQuery(
        `UPDATE banners SET impression_count = impression_count + 1 WHERE id IN (${bannerIds.join(',')})`,
        []
      );
    }

    return NextResponse.json({
      success: true,
      data: banners
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server nội bộ' },
      { status: 500 }
    );
  }
}

