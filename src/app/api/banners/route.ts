import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { getCache, setCache } from '@/lib/cache';

const BANNERS_CACHE_PREFIX = 'global:banners:';
const CACHE_TTL = 3600; // 1 hour

// GET - Lấy danh sách banners
/**
 * API Lấy danh sách Banner quảng cáo theo vị trí.
 * Cơ chế: 
 * 1. Lấy dữ liệu từ Redis Cache nếu có.
 * 2. Chỉ lấy các banner đang hoạt động và trong thời hạn cho phép.
 * 3. Tự động cộng dồn lượt hiển thị (Impression count) chạy ngầm (Asynchronous).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position') || 'homepage';
    const activeOnly = searchParams.get('activeOnly') !== 'false'; // default true

    const cacheKey = `${position}:${activeOnly}`;

    // 1. Try to get from cache first
    const cachedData = await getCache<any[]>(BANNERS_CACHE_PREFIX + cacheKey);
    if (cachedData) {
      // Background: Update impression count for active banners even if cached
      if (activeOnly && cachedData.length > 0) {
        const bannerIds = cachedData.map(b => b.id);
        executeQuery(
          `UPDATE banners SET impression_count = impression_count + 1 WHERE id IN (${bannerIds.join(',')})`,
          []
        ).catch(e => console.error('Error logging banner impressions (Background):', e));
      }

      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // 2. Fallback to Database
    let query = 'SELECT * FROM banners WHERE position = ?';
    const params: any[] = [position];

    if (activeOnly) {
      const now = new Date().toISOString();
      query += ' AND is_active = 1 AND (start_date IS NULL OR start_date <= ?) AND (end_date IS NULL OR end_date >= ?)';
      params.push(now, now);
    }

    query += ' ORDER BY display_order ASC, created_at DESC';

    const banners = await executeQuery<any[]>(query, params);

    // 3. Save to cache
    await setCache(BANNERS_CACHE_PREFIX + cacheKey, banners, CACHE_TTL);

    // 4. Update impression count asynchronously
    if (activeOnly && banners.length > 0) {
      const bannerIds = banners.map(b => b.id);
      executeQuery(
        `UPDATE banners SET impression_count = impression_count + 1 WHERE id IN (${bannerIds.join(',')})`,
        []
      ).catch(e => console.error('Error logging banner impressions:', e));
    }

    return NextResponse.json({
      success: true,
      data: banners,
      cached: false
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server nội bộ' },
      { status: 500 }
    );
  }
}

