import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse, createSuccessResponse, withErrorHandling } from '@/lib/api-utils';
import { executeQuery } from '@/lib/db/mysql';

async function validateCouponHandler(req: NextRequest): Promise<NextResponse> {
  const body: any = await req.json();
  const { code, orderAmount } = body;

  if (!code) {
    return createErrorResponse('Thiếu mã voucher', 400);
  }

  if (!orderAmount || orderAmount <= 0) {
    return createErrorResponse('Số tiền đơn hàng không hợp lệ', 400);
  }

  // Get coupon from database
  const coupons = await executeQuery<any[]>(
    `SELECT * FROM coupons WHERE code = ? AND (ends_at IS NULL OR ends_at > NOW()) AND (starts_at IS NULL OR starts_at <= NOW())`,
    [code.toUpperCase()]
  );

  if (!coupons || coupons.length === 0) {
    return createErrorResponse('Mã voucher không tồn tại hoặc đã hết hạn', 404);
  }

  const coupon = coupons[0];

  // Check if coupon has started
  if (coupon.starts_at && new Date(coupon.starts_at) > new Date()) {
    return createErrorResponse('Mã voucher chưa có hiệu lực', 400);
  }

  // Check usage limit
  if (coupon.usage_limit !== null) {
    const usageCount = await executeQuery<any[]>(
      `SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ?`,
      [coupon.id]
    );
    
    if (usageCount[0].count >= coupon.usage_limit) {
      return createErrorResponse('Mã voucher đã hết lượt sử dụng', 400);
    }
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discount_type === 'fixed') {
    discountAmount = coupon.discount_value;
  } else if (coupon.discount_type === 'percent') {
    discountAmount = Math.round((orderAmount * coupon.discount_value) / 100);
  }

  // Ensure discount doesn't exceed order amount
  discountAmount = Math.min(discountAmount, orderAmount);

  return createSuccessResponse(
    {
      couponId: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      discountAmount
    },
    'Áp dụng mã giảm giá thành công'
  );
}

export const POST = withErrorHandling(validateCouponHandler);
