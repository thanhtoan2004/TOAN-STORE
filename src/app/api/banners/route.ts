import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { banners as bannersTable } from '@/lib/db/schema';
import { eq, and, or, isNull, sql, lte, gte, asc, desc, inArray } from 'drizzle-orm';
import { getCache, setCache } from '@/lib/redis/cache';
import { ResponseWrapper } from '@/lib/api/api-response';

const BANNERS_CACHE_PREFIX = 'global:banners:';
const CACHE_TTL = 3600; // 1 hour

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
        const bannerIds = cachedData.map((b) => b.id);
        db.update(bannersTable)
          .set({ impressionCount: sql`${bannersTable.impressionCount} + 1` })
          .where(inArray(bannersTable.id, bannerIds))
          .catch((e) => console.error('Error logging banner impressions (Background):', e));
      }

      return ResponseWrapper.success(cachedData, undefined, 200, { cached: true });
    }

    // 2. Fallback to Database using Drizzle ORM
    const filters = [eq(bannersTable.position, position)];

    if (activeOnly) {
      const now = new Date();
      filters.push(eq(bannersTable.isActive, 1));

      const startFilter = or(isNull(bannersTable.startDate), lte(bannersTable.startDate, now));
      const endFilter = or(isNull(bannersTable.endDate), gte(bannersTable.endDate, now));

      if (startFilter) filters.push(startFilter);
      if (endFilter) filters.push(endFilter);
    }

    const banners = await db
      .select()
      .from(bannersTable)
      .where(and(...filters))
      .orderBy(asc(bannersTable.displayOrder), desc(bannersTable.createdAt));

    // 3. Save to cache
    await setCache(BANNERS_CACHE_PREFIX + cacheKey, banners, CACHE_TTL);

    // 4. Update impression count asynchronously
    if (activeOnly && banners.length > 0) {
      const bannerIds = banners.map((b) => b.id);
      db.update(bannersTable)
        .set({ impressionCount: sql`${bannersTable.impressionCount} + 1` })
        .where(inArray(bannersTable.id, bannerIds))
        .catch((e) => console.error('Error logging banner impressions:', e));
    }

    return ResponseWrapper.success(banners, undefined, 200, { cached: false });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}
