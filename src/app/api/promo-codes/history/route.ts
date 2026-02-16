import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse, createSuccessResponse, withErrorHandling } from '@/lib/api-utils';
import { executeQuery } from '@/lib/db/mysql';

// GET - Lấy lịch sử sử dụng voucher (theo user hoặc theo voucher code)
async function voucherHistoryHandler(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const voucherCode = searchParams.get('code');

  if (!userId && !voucherCode) {
    return createErrorResponse('Cần userId hoặc voucher code', 400);
  }

  let query = '';
  let params: any[] = [];

  if (userId) {
    // Get user's coupon usage history
    query = `
      SELECT 
        cu.id,
        cu.coupon_id,
        c.code,
        c.description,
        c.discount_type,
        c.discount_value,
        cu.order_id,
        o.order_number,
        cu.used_at,
        o.total as order_total
      FROM coupon_usage cu
      JOIN coupons c ON cu.coupon_id = c.id
      LEFT JOIN orders o ON cu.order_id = o.id
      WHERE cu.user_id = ?
      ORDER BY cu.used_at DESC
    `;
    params = [userId];
  } else if (voucherCode) {
    // Get specific coupon usage history
    query = `
      SELECT 
        cu.id,
        cu.user_id,
        cu.order_id,
        o.order_number,
        cu.used_at,
        c.code,
        c.description,
        c.discount_type,
        c.discount_value,
        c.usage_limit,
        o.total as order_total
      FROM coupon_usage cu
      JOIN coupons c ON cu.coupon_id = c.id
      LEFT JOIN orders o ON cu.order_id = o.id
      WHERE c.code = ?
      ORDER BY cu.used_at DESC
    `;
    params = [voucherCode.toUpperCase()];
  }

  const usageHistory = await executeQuery<any[]>(query, params);

  // Get usage count if searching by code
  let usageStats = null;
  if (voucherCode) {
    const coupon = await executeQuery<any[]>(
      `SELECT id, code, description, discount_type, discount_value, usage_limit,
       (SELECT COUNT(*) FROM coupon_usage WHERE coupon_id = coupons.id) as times_used
       FROM coupons WHERE code = ?`,
      [voucherCode.toUpperCase()]
    );

    if (coupon && coupon.length > 0) {
      usageStats = {
        code: coupon[0].code,
        description: coupon[0].description,
        discountType: coupon[0].discount_type,
        discountValue: coupon[0].discount_value,
        usageLimit: coupon[0].usage_limit,
        timesUsed: coupon[0].times_used
      };
    }
  }

  // Calculate discount amount from discount_type and discount_value
  const calculateDiscountAmount = (item: any) => {
    if (!item.discount_type || !item.discount_value) return 0;

    if (item.discount_type === 'percent' && item.order_total) {
      // Calculate percentage discount from order total
      return Math.round((item.order_total * item.discount_value) / 100);
    } else if (item.discount_type === 'fixed') {
      // Fixed amount discount
      return item.discount_value;
    }
    return 0;
  };

  return createSuccessResponse(
    {
      usageHistory: usageHistory.map((u: any) => ({
        id: u.id,
        userId: u.user_id,
        orderId: u.order_id,
        orderNumber: u.order_number,
        code: u.code,
        description: u.description,
        discountAmount: calculateDiscountAmount(u),
        usedAt: u.used_at
      })),
      stats: usageStats
    },
    'Lấy lịch sử thành công'
  );
}

export const GET = withErrorHandling(voucherHistoryHandler);
