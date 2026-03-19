import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { coupons as couponsTable, couponUsage, orders as ordersTable } from '@/lib/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { verifyAuth, checkAdminAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Lấy lịch sử sử dụng mã giảm giá.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized();
    }

    const admin = await checkAdminAuth();
    const { searchParams } = new URL(req.url);

    const userId = admin
      ? searchParams.get('userId')
        ? Number(searchParams.get('userId'))
        : Number(session.userId)
      : Number(session.userId);
    const voucherCode = searchParams.get('code');

    if (!userId && !voucherCode) {
      return ResponseWrapper.error('Cần userId hoặc voucher code', 400);
    }

    if (voucherCode && !admin) {
      return ResponseWrapper.forbidden();
    }

    console.log('Fetching promo history for:', { userId, voucherCode });

    let usageHistory: any[] = [];

    if (voucherCode) {
      console.log('Querying by voucher code');
      usageHistory = await db
        .select({
          id: couponUsage.id,
          userId: couponUsage.userId,
          orderId: couponUsage.orderId,
          orderNumber: ordersTable.orderNumber,
          usedAt: couponUsage.usedAt,
          code: couponsTable.code,
          description: couponsTable.description,
          discountType: couponsTable.discountType,
          discountValue: couponsTable.discountValue,
          usageLimit: couponsTable.usageLimit,
          orderTotal: ordersTable.totalAmount,
        })
        .from(couponUsage)
        .innerJoin(couponsTable, eq(couponUsage.couponId, couponsTable.id))
        .leftJoin(ordersTable, eq(couponUsage.orderId, ordersTable.id))
        .where(eq(couponsTable.code, voucherCode.toUpperCase()))
        .orderBy(desc(couponUsage.usedAt));
    } else if (userId) {
      console.log('Querying by user ID:', userId);
      usageHistory = await db
        .select({
          id: couponUsage.id,
          userId: couponUsage.userId,
          orderId: couponUsage.orderId,
          orderNumber: ordersTable.orderNumber,
          usedAt: couponUsage.usedAt,
          code: couponsTable.code,
          description: couponsTable.description,
          discountType: couponsTable.discountType,
          discountValue: couponsTable.discountValue,
          orderTotal: ordersTable.totalAmount,
        })
        .from(couponUsage)
        .innerJoin(couponsTable, eq(couponUsage.couponId, couponsTable.id))
        .leftJoin(ordersTable, eq(couponUsage.orderId, ordersTable.id))
        .where(eq(couponUsage.userId, userId))
        .orderBy(desc(couponUsage.usedAt));
    }

    console.log('Usage history count:', usageHistory.length);

    let usageStats: any = null;
    if (voucherCode) {
      console.log('Fetching stats for code:', voucherCode);
      const [coupon] = await db
        .select({
          id: couponsTable.id,
          code: couponsTable.code,
          description: couponsTable.description,
          discountType: couponsTable.discountType,
          discountValue: couponsTable.discountValue,
          usageLimit: couponsTable.usageLimit,
          timesUsed: sql<number>`(SELECT COUNT(*) FROM ${couponUsage} WHERE coupon_id = ${couponsTable.id})`,
        })
        .from(couponsTable)
        .where(eq(couponsTable.code, voucherCode.toUpperCase()))
        .limit(1);

      if (coupon) {
        usageStats = {
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          usageLimit: coupon.usageLimit,
          timesUsed: coupon.timesUsed,
        };
      }
    }

    const calculateDiscountAmount = (item: any) => {
      if (!item.discountType || !item.discountValue) return 0;
      try {
        if (item.discountType === 'percent' && item.orderTotal) {
          const total = parseFloat(item.orderTotal.toString());
          const value = parseFloat(item.discountValue.toString());
          return Math.round((total * value) / 100);
        } else if (item.discountType === 'fixed') {
          return parseFloat(item.discountValue.toString());
        }
      } catch (err) {
        return 0;
      }
      return 0;
    };

    console.log('Mapping final response...');
    const result = {
      usageHistory: Array.isArray(usageHistory)
        ? usageHistory.map((u: any) => ({
            id: u?.id,
            userId: u?.userId,
            orderId: u?.orderId,
            orderNumber: u?.orderNumber,
            code: u?.code,
            description: u?.description,
            discountAmount: calculateDiscountAmount(u),
            usedAt: u?.usedAt,
          }))
        : [],
      stats: usageStats,
    };

    console.log('Response prepared.');
    return ResponseWrapper.success(result, 'Lấy lịch sử thành công');
  } catch (error) {
    console.error('List voucher history error debug:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}
