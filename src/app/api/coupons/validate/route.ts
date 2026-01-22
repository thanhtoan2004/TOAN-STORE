import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';

// POST - Validate và lấy thông tin coupon
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, userId, orderAmount } = body;

    if (!code || !orderAmount) {
      return NextResponse.json(
        { success: false, message: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    // Get coupon info
    const coupons = await executeQuery<any[]>(
      'SELECT * FROM coupons WHERE code = ?',
      [code.toUpperCase()]
    );

    if (!coupons || coupons.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Mã giảm giá không tồn tại' },
        { status: 404 }
      );
    }

    const couponData = coupons[0];
    const now = new Date();

    // Check if coupon is within valid date range
    if (couponData.starts_at && new Date(couponData.starts_at) > now) {
      return NextResponse.json(
        { success: false, message: 'Mã giảm giá chưa có hiệu lực' },
        { status: 400 }
      );
    }

    if (couponData.ends_at && new Date(couponData.ends_at) < now) {
      return NextResponse.json(
        { success: false, message: 'Mã giảm giá đã hết hạn' },
        { status: 400 }
      );
    }

    // Check minimum order amount
    if (couponData.min_order_amount && orderAmount < couponData.min_order_amount) {
      return NextResponse.json(
        {
          success: false,
          message: `Đơn hàng phải từ ${couponData.min_order_amount.toLocaleString('vi-VN')}₫ trở lên`
        },
        { status: 400 }
      );
    }

    // Check total usage limit
    if (couponData.usage_limit !== null) {
      const usageCount = await executeQuery<any[]>(
        'SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ?',
        [couponData.id]
      );

      if (usageCount && usageCount[0] && usageCount[0].count >= couponData.usage_limit) {
        return NextResponse.json(
          { success: false, message: 'Mã giảm giá đã hết lượt sử dụng' },
          { status: 400 }
        );
      }
    }

    // Check per-user usage limit
    if (userId && couponData.usage_limit_per_user !== null) {
      const userUsageCount = await executeQuery<any[]>(
        'SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND user_id = ?',
        [couponData.id, userId]
      );

      if (userUsageCount && userUsageCount[0] && userUsageCount[0].count >= couponData.usage_limit_per_user) {
        return NextResponse.json(
          { success: false, message: 'Bạn đã sử dụng hết lượt cho mã này' },
          { status: 400 }
        );
      }
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (couponData.discount_type === 'fixed') {
      discountAmount = couponData.discount_value;
    } else if (couponData.discount_type === 'percent') {
      discountAmount = (orderAmount * couponData.discount_value) / 100;
    }

    // Apply max discount cap if exists
    if (couponData.max_discount_amount && discountAmount > couponData.max_discount_amount) {
      discountAmount = couponData.max_discount_amount;
    }

    // Ensure discount doesn't exceed order amount
    discountAmount = Math.min(discountAmount, orderAmount);

    return NextResponse.json({
      success: true,
      data: {
        id: couponData.id,
        code: couponData.code,
        description: couponData.description,
        discount_type: couponData.discount_type,
        discount_value: couponData.discount_value,
        discountAmount: Math.round(discountAmount),
        finalAmount: Math.round(orderAmount - discountAmount)
      }
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server nội bộ' },
      { status: 500 }
    );
  }
}
