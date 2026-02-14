import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse, createSuccessResponse, withErrorHandling } from '@/lib/api-utils';
import { executeQuery } from '@/lib/db/mysql';

import { verifyAuth } from '@/lib/auth';

async function validateCouponHandler(req: NextRequest): Promise<NextResponse> {
  const body: any = await req.json();
  const { code, orderAmount, items } = body; // items is optional but recommended for category checks

  // Get trusted user session
  const auth = await verifyAuth();
  const userId = auth?.userId;

  if (!code) {
    return createErrorResponse('Thiếu mã voucher', 400);
  }

  if (!orderAmount || orderAmount <= 0) {
    return createErrorResponse('Số tiền đơn hàng không hợp lệ', 400);
  }

  // Helper to validate categories
  const isCategoryValid = (applicableCategories: string | null, cartItems: any[]) => {
    if (!applicableCategories) return true;
    try {
      const allowedIds = JSON.parse(applicableCategories);
      if (!Array.isArray(allowedIds) || allowedIds.length === 0) return true;

      if (!cartItems || !Array.isArray(cartItems)) return false; // Allowed categories set but no items provided

      return cartItems.some(item => allowedIds.includes(Number(item.categoryId)));
    } catch (e) {
      return true; // JSON parse error, fail-safe
    }
  };

  // Get coupon from database
  const coupons = await executeQuery<any[]>(
    `SELECT * FROM coupons WHERE code = ? AND (ends_at IS NULL OR ends_at > NOW()) AND (starts_at IS NULL OR starts_at <= NOW())`,
    [code.toUpperCase()]
  );

  if (!coupons || coupons.length === 0) {
    // Try to find in vouchers table (personal/gift vouchers)
    const vouchers = await executeQuery<any[]>(
      `SELECT * FROM vouchers WHERE code = ? AND status = 'active' AND (valid_until IS NULL OR valid_until > NOW())`,
      [code.toUpperCase()]
    );

    if (!vouchers || vouchers.length === 0) {
      return createErrorResponse('Mã giảm giá không tồn tại hoặc đã hết hạn', 404);
    }

    const voucher = vouchers[0];

    // Check ownership if it's a personal voucher
    if (voucher.recipient_user_id) {
      if (!userId || Number(userId) !== Number(voucher.recipient_user_id)) {
        return createErrorResponse('Mã này không dành cho bạn hoặc bạn chưa đăng nhập', 403);
      }
    }

    // Check minimum order amount for voucher
    if (voucher.min_order_value && orderAmount < voucher.min_order_value) {
      return createErrorResponse(`Mã này yêu cầu đơn hàng tối thiểu ${new Intl.NumberFormat('vi-VN').format(voucher.min_order_value)}đ`, 400);
    }

    // Check category restriction
    if (!isCategoryValid(voucher.applicable_categories, items)) {
      return createErrorResponse('Mã này không áp dụng cho các sản phẩm trong giỏ hàng của bạn', 400);
    }

    return createSuccessResponse(
      {
        voucherId: voucher.id,
        code: voucher.code,
        description: voucher.description || 'Mã giảm giá cá nhân',
        discountType: voucher.discount_type,
        discountValue: voucher.value,
        discountAmount: voucher.discount_type === 'percent'
          ? Math.min(Math.round((orderAmount * voucher.value) / 100), orderAmount)
          : Math.min(voucher.value, orderAmount)
      },
      'Áp dụng mã giảm giá thành công'
    );
  }

  const coupon = coupons[0];

  // Check minimum order amount
  if (coupon.min_order_amount && orderAmount < coupon.min_order_amount) {
    return createErrorResponse(`Đơn hàng tối thiểu ${new Intl.NumberFormat('vi-VN').format(coupon.min_order_amount)}đ để áp dụng mã này`, 400);
  }

  // Check category restriction
  if (!isCategoryValid(coupon.applicable_categories, items)) {
    return createErrorResponse('Mã này không áp dụng cho các sản phẩm trong giỏ hàng của bạn', 400);
  }

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
