import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, withErrorHandling } from '@/lib/api-utils';
import { executeQuery } from '@/lib/db/mysql';
import { getCache, setCache } from '@/lib/cache';

/**
 * API Lấy danh sách các mã giảm giá (Coupons) công khai đang có hiệu lực.
 * Kết quả được lưu vào Redis Cache trong 10 phút để tối ưu hiệu năng.
 */
async function listCouponsHandler(req: NextRequest): Promise<NextResponse> {
  const CACHE_KEY = 'promo-codes:available';

  // Try to get from cache
  const cachedData = await getCache<any[]>(CACHE_KEY);
  if (cachedData) {
    return createSuccessResponse(cachedData, 'Lấy danh sách voucher từ cache thành công');
  }

  // Get all active coupons — only return public-safe fields
  const coupons = await executeQuery<any[]>(
    `SELECT 
      c.id,
      c.code,
      c.description,
      c.discount_type,
      c.discount_value,
      c.starts_at,
      c.ends_at,
      c.usage_limit,
      (SELECT COUNT(*) FROM coupon_usage WHERE coupon_id = c.id) as times_used
     FROM coupons c
     WHERE (c.ends_at IS NULL OR c.ends_at > NOW()) 
       AND (c.starts_at IS NULL OR c.starts_at <= NOW())
       AND (c.usage_limit IS NULL OR (SELECT COUNT(*) FROM coupon_usage WHERE coupon_id = c.id) < c.usage_limit)
     ORDER BY c.created_at DESC`
  );

  // Cache for 10 minutes
  await setCache(CACHE_KEY, coupons, 600);

  return createSuccessResponse(coupons, 'Lấy danh sách voucher thành công');
}

export const GET = withErrorHandling(listCouponsHandler);
