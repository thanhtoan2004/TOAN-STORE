import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, withErrorHandling } from '@/lib/api-utils';
import { executeQuery } from '@/lib/db/mysql';
import { getCache, setCache } from '@/lib/cache';

async function listCouponsHandler(req: NextRequest): Promise<NextResponse> {
  const CACHE_KEY = 'promo-codes:available';

  // Try to get from cache
  const cachedData = await getCache<any[]>(CACHE_KEY);
  if (cachedData) {
    return createSuccessResponse(cachedData, 'Lấy danh sách voucher từ cache thành công');
  }

  // Get all active coupons that still have available uses
  const coupons = await executeQuery<any[]>(
    `SELECT 
      c.*,
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
