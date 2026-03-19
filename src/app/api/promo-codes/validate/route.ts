import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import {
  coupons as couponsTable,
  vouchers as vouchersTable,
  users as usersTable,
  couponUsage,
} from '@/lib/db/schema';
import { eq, and, sql, count } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Kiểm tra tính hợp lệ của mã giảm giá (Voucher/Coupon).
 */
export async function POST(req: NextRequest) {
  try {
    const body: any = await req.json();
    const { code, orderAmount, items } = body;

    const auth = await verifyAuth();
    const userId = auth?.userId;

    if (!code) {
      return ResponseWrapper.error('Thiếu mã voucher', 400);
    }

    if (!orderAmount || orderAmount <= 0) {
      return ResponseWrapper.error('Số tiền đơn hàng không hợp lệ', 400);
    }

    // Helper to validate categories
    const isCategoryValid = (applicableCategories: any, cartItems: any[]) => {
      if (!applicableCategories) return true;
      try {
        let allowedIds: number[] = [];
        if (typeof applicableCategories === 'string') {
          allowedIds = JSON.parse(applicableCategories);
        } else if (Array.isArray(applicableCategories)) {
          allowedIds = applicableCategories;
        }

        if (!Array.isArray(allowedIds) || allowedIds.length === 0) return true;
        if (!cartItems || !Array.isArray(cartItems)) return false;
        return cartItems.some((item) => allowedIds.includes(Number(item.categoryId)));
      } catch (e) {
        return true;
      }
    };

    // Tier ranking
    const TIER_RANK: Record<string, number> = {
      bronze: 0,
      silver: 1,
      gold: 2,
      platinum: 3,
    };

    const isTierValid = (userTier: string | undefined, applicableTier: string | null) => {
      if (!applicableTier) return true;
      const userRank = TIER_RANK[userTier || 'bronze'] || 0;
      const requiredRank = TIER_RANK[applicableTier] || 0;
      return userRank >= requiredRank;
    };

    // Get user tier
    let userTier = 'bronze';
    if (userId) {
      const userResult = await db
        .select({ membershipTier: usersTable.membershipTier })
        .from(usersTable)
        .where(eq(usersTable.id, Number(userId)))
        .limit(1);
      if (userResult.length > 0 && userResult[0].membershipTier) {
        userTier = userResult[0].membershipTier;
      }
    }

    // Get coupon from database
    const coupons = await db
      .select()
      .from(couponsTable)
      .where(
        and(
          eq(couponsTable.code, code.toUpperCase()),
          sql`(${couponsTable.endsAt} IS NULL OR ${couponsTable.endsAt} > NOW())`,
          sql`(${couponsTable.startsAt} IS NULL OR ${couponsTable.startsAt} <= NOW())`
        )
      )
      .limit(1);

    if (coupons.length === 0) {
      // Try to find in vouchers table
      const vouchers = await db
        .select()
        .from(vouchersTable)
        .where(
          and(
            eq(vouchersTable.code, code.toUpperCase()),
            eq(vouchersTable.status, 'active'),
            sql`(${vouchersTable.validUntil} IS NULL OR ${vouchersTable.validUntil} > NOW())`
          )
        )
        .limit(1);

      if (vouchers.length === 0) {
        return ResponseWrapper.error('Mã giảm giá không tồn tại hoặc đã hết hạn', 404);
      }

      const voucher = vouchers[0];

      // Check ownership
      if (voucher.recipientUserId) {
        if (!userId || Number(userId) !== Number(voucher.recipientUserId)) {
          return ResponseWrapper.forbidden('Mã này không dành cho bạn hoặc bạn chưa đăng nhập');
        }
      }

      // Check membership tier
      if (!isTierValid(userTier, voucher.applicableTier)) {
        return ResponseWrapper.error(
          `Mã này yêu cầu hạng thành viên từ ${voucher.applicableTier?.toUpperCase()} trở lên`,
          400
        );
      }

      // Check minimum order amount
      const minOrder = Number(voucher.minOrderValue || 0);
      if (minOrder > 0 && orderAmount < minOrder) {
        return ResponseWrapper.error(
          `Mã này yêu cầu đơn hàng tối thiểu ${new Intl.NumberFormat('vi-VN').format(minOrder)}đ`,
          400
        );
      }

      // Check category restriction
      if (!isCategoryValid(voucher.applicableCategories, items)) {
        return ResponseWrapper.error(
          'Mã này không áp dụng cho các sản phẩm trong giỏ hàng của bạn',
          400
        );
      }

      // Check usage limit per user
      if (userId && voucher.usageLimitPerUser !== null) {
        const [userUsageResult] = await db
          .select({ count: count() })
          .from(couponUsage)
          .where(and(eq(couponUsage.couponId, voucher.id), eq(couponUsage.userId, Number(userId))));

        if (userUsageResult && userUsageResult.count >= voucher.usageLimitPerUser) {
          return ResponseWrapper.error('Bạn đã hết lượt sử dụng mã này', 400);
        }
      }

      const discVal = Number(voucher.value || 0);
      return ResponseWrapper.success(
        {
          voucherId: voucher.id,
          code: voucher.code,
          description: voucher.description || 'Mã giảm giá cá nhân',
          discountType: voucher.discountType,
          discountValue: discVal,
          discountAmount:
            voucher.discountType === 'percent'
              ? Math.min(Math.round((orderAmount * discVal) / 100), orderAmount)
              : Math.min(discVal, orderAmount),
          expirationDate: voucher.validUntil,
        },
        'Áp dụng mã giảm giá thành công'
      );
    }

    const coupon = coupons[0];

    // Check membership tier
    if (!isTierValid(userTier, coupon.applicableTier)) {
      return ResponseWrapper.error(
        `Mã này yêu cầu hạng thành viên từ ${coupon.applicableTier?.toUpperCase()} trở lên`,
        400
      );
    }

    // Check minimum order amount
    const couponMinOrder = Number(coupon.minOrderAmount || 0);
    if (couponMinOrder > 0 && orderAmount < couponMinOrder) {
      return ResponseWrapper.error(
        `Đơn hàng tối thiểu ${new Intl.NumberFormat('vi-VN').format(couponMinOrder)}đ để áp dụng mã này`,
        400
      );
    }

    // Check category restriction
    if (!isCategoryValid(coupon.applicableCategories, items)) {
      return ResponseWrapper.error(
        'Mã này không áp dụng cho các sản phẩm trong giỏ hàng của bạn',
        400
      );
    }

    // Check if coupon has started
    if (coupon.startsAt && new Date(coupon.startsAt) > new Date()) {
      return ResponseWrapper.error('Mã voucher chưa có hiệu lực', 400);
    }

    // Check usage limit
    if (coupon.usageLimit !== null) {
      const [usageResult] = await db
        .select({ count: count() })
        .from(couponUsage)
        .where(eq(couponUsage.couponId, coupon.id));

      if (usageResult && usageResult.count >= coupon.usageLimit) {
        return ResponseWrapper.error('Mã voucher đã hết lượt sử dụng', 400);
      }
    }

    // Check usage limit per user
    if (userId && coupon.usageLimitPerUser !== null) {
      const [userUsageResult] = await db
        .select({ count: count() })
        .from(couponUsage)
        .where(and(eq(couponUsage.couponId, coupon.id), eq(couponUsage.userId, Number(userId))));

      if (userUsageResult && userUsageResult.count >= coupon.usageLimitPerUser) {
        return ResponseWrapper.error('Bạn đã hết lượt sử dụng mã này', 400);
      }
    }

    // Calculate discount
    let discountAmount = 0;
    const cDiscVal = Number(coupon.discountValue || 0);
    if (coupon.discountType === 'fixed') {
      discountAmount = cDiscVal;
    } else if (coupon.discountType === 'percent') {
      discountAmount = Math.round((orderAmount * cDiscVal) / 100);

      // Apply max discount amount cap
      const maxDiscount = Number(coupon.maxDiscountAmount || 0);
      if (maxDiscount > 0 && discountAmount > maxDiscount) {
        discountAmount = maxDiscount;
      }
    }

    discountAmount = Math.min(discountAmount, orderAmount);

    return ResponseWrapper.success(
      {
        couponId: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: cDiscVal,
        discountAmount,
        expirationDate: coupon.endsAt,
      },
      'Áp dụng mã giảm giá thành công'
    );
  } catch (error) {
    console.error('Error validating promo code:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}
