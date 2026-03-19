import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { coupons as couponsTable, couponUsage } from '@/lib/db/schema';
import { and, sql, desc } from 'drizzle-orm';
import { getCache, setCache } from '@/lib/redis/cache';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Lấy danh sách các mã giảm giá (Coupons) công khai đang có hiệu lực.
 * Kết quả được lưu vào Redis Cache trong 10 phút để tối ưu hiệu năng.
 */
export async function GET(req: NextRequest) {
  try {
    const CACHE_KEY = 'promo-codes:available';

    // Try to get from cache
    const cachedData = await getCache<any[]>(CACHE_KEY);
    if (cachedData) {
      return ResponseWrapper.success(cachedData, 'Lấy danh sách voucher từ cache thành công');
    }

    // Get all active coupons — only return public-safe fields
    const coupons = await db
      .select({
        id: couponsTable.id,
        code: couponsTable.code,
        description: couponsTable.description,
        discountType: couponsTable.discountType,
        discountValue: couponsTable.discountValue,
        startsAt: couponsTable.startsAt,
        endsAt: couponsTable.endsAt,
        usageLimit: couponsTable.usageLimit,
        timesUsed: sql<number>`(SELECT COUNT(*) FROM ${couponUsage} WHERE coupon_id = ${couponsTable.id})`,
      })
      .from(couponsTable)
      .where(
        and(
          sql`(${couponsTable.endsAt} IS NULL OR ${couponsTable.endsAt} > NOW())`,
          sql`(${couponsTable.startsAt} IS NULL OR ${couponsTable.startsAt} <= NOW())`,
          sql`(${couponsTable.usageLimit} IS NULL OR (SELECT COUNT(*) FROM ${couponUsage} WHERE coupon_id = ${couponsTable.id}) < ${couponsTable.usageLimit})`
        )
      )
      .orderBy(desc(couponsTable.createdAt));

    // Cache for 10 minutes
    await setCache(CACHE_KEY, coupons, 600);

    return ResponseWrapper.success(coupons, 'Lấy danh sách voucher thành công');
  } catch (error) {
    console.error('List coupons error:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}
