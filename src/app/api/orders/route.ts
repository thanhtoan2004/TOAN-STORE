import { NextRequest } from 'next/server';
import { db } from '@/lib/db/drizzle';
import {
  orders as ordersTable,
  orderItems,
  productImages,
  users as usersTable,
  coupons,
  vouchers,
  couponUsage,
  giftCards,
  giftCardLockouts,
} from '@/lib/db/schema';
import { eq, and, or, sql, desc, count, isNull, gt, lte, gte } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth/auth';
import { withRateLimit } from '@/lib/api/with-rate-limit';
import { findVariantBySize } from '@/lib/db/variants';
import { getActiveFlashSale } from '@/lib/db/repositories/flash_sale';
import { getSettings } from '@/lib/db/settings';
import { createOrder } from '@/lib/db/repositories/order';
import { ResponseWrapper } from '@/lib/api/api-response';
import { hashGiftCard } from '@/lib/security/encryption';

// GET - Lấy danh sách đơn hàng
export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) return ResponseWrapper.unauthorized();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50); // Cap at 50
    const userId = session.userId;
    console.log('[DEBUG] Fetching orders for userId:', userId, 'status:', status);
    const offset = (page - 1) * limit;

    const conditions = [eq(ordersTable.userId, Number(userId))];
    if (status && status !== 'all') {
      conditions.push(eq(ordersTable.status, status as any));
    }

    const [countResult] = await db
      .select({ total: count() })
      .from(ordersTable)
      .where(and(...conditions));

    console.log('[DEBUG] Order count result:', countResult);

    const orders = await db
      .select()
      .from(ordersTable)
      .where(and(...conditions))
      .orderBy(desc(ordersTable.placedAt))
      .limit(limit)
      .offset(offset);

    console.log('[DEBUG] Fetched orders length:', orders.length);

    const total = countResult?.total || 0;
    const totalPages = Math.ceil(total / limit);

    const enrichedOrders = await Promise.all(
      orders.map(async (order: any) => {
        const items = await db
          .select({
            id: orderItems.id,
            order_id: orderItems.orderId,
            product_id: orderItems.productId,
            product_name: orderItems.productName,
            sku: orderItems.sku,
            size: orderItems.size,
            quantity: orderItems.quantity,
            unit_price: orderItems.unitPrice,
            total_price: orderItems.totalPrice,
            image_url: sql<string>`(SELECT url FROM product_images WHERE product_id = ${orderItems.productId} AND is_main = 1 LIMIT 1)`,
          })
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id));

        return {
          id: order.id,
          order_number: order.orderNumber,
          user_id: order.userId,
          total: order.total,
          status: order.status,
          placed_at: order.placedAt,
          updated_at: order.updatedAt,
          payment_method: order.paymentMethod,
          payment_status: order.paymentStatus,
          preview_image: items[0]?.image_url || '/placeholder.png',
          item_count: items.length,
          items,
        };
      })
    );

    return ResponseWrapper.success(enrichedOrders, undefined, 200, {
      page,
      limit,
      total,
      totalPages,
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đơn hàng:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}

// POST Handler logic
async function createOrderHandler(request: NextRequest) {
  try {
    const session = await verifyAuth();
    // Use session ID if logged in
    const userId = session?.userId || null;

    const body = await request.json();
    const {
      items,
      shippingAddress,
      phone,
      email,
      paymentMethod,
      notes,
      shippingFee,
      discount,
      voucherCode,
      voucherDiscount,
      giftcardNumber,
      giftcardDiscount,
      has_gift_wrapping,
      gift_wrap_cost,
    } = body;

    // Validate
    if (!items || items.length === 0) {
      return ResponseWrapper.error('Giỏ hàng trống', 400);
    }

    if (!shippingAddress || !phone || !email) {
      return ResponseWrapper.error('Thiếu thông tin giao hàng', 400);
    }

    // Get Store Settings & Flash Sales once
    const settings = await getSettings();
    const activeFlashSale = await getActiveFlashSale();
    const flashSaleItems = activeFlashSale?.items || [];

    const validatedItems: any[] = [];

    const validationPromises = items.map(async (item: any) => {
      const productId = parseInt(item.productId || item.product_id);
      const size = item.size;
      const quantity = parseInt(item.quantity) || 1;

      // 1. Find Variant
      const variant = await findVariantBySize(productId, size);
      if (!variant) {
        throw new Error(`Sản phẩm ${item.productName || productId} size ${size} không tồn tại`);
      }

      // 2. Check Inventory (already included in findVariantBySize)
      if (Number(variant.available) < quantity) {
        throw new Error(`Sản phẩm ${item.productName || variant.productName || 'này'} hết hàng`);
      }

      // 3. Determine Price (Base vs Flash Sale)
      let finalPrice = parseFloat(variant.price.toString());
      const flashSaleItem = flashSaleItems.find((f: any) => f.productId === productId);

      if (flashSaleItem) {
        // Check flash sale stock
        if (
          Number(flashSaleItem.quantitySold || 0) + quantity <=
          Number(flashSaleItem.quantityLimit || 0)
        ) {
          finalPrice = parseFloat(flashSaleItem.flashPrice.toString());
        }
      }

      return {
        productId,
        productName: variant.productName || item.productName || item.name,
        productImage: item.productImage || item.image || item.image_url,
        size,
        quantity,
        price: finalPrice,
        productVariantId: variant.id,
        sku: variant.sku,
        costPrice: variant.costPrice || 0,
        flashSaleItemId: flashSaleItem?.id || null,
      };
    });

    try {
      const results = await Promise.all(validationPromises);
      for (const res of results) {
        validatedItems.push(res);
      }
    } catch (e: any) {
      return ResponseWrapper.error(e.message, 400);
    }

    // Generate secure order number
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `NK${Date.now()}_${randomSuffix}`;

    const subtotal = validatedItems.reduce((sum: number, item: any) => {
      return sum + item.price * item.quantity;
    }, 0);

    // Shipping Fee
    let finalShippingFee = subtotal >= 500000 ? 0 : 30000;

    // Discount Calculation
    let finalDiscount = 0;
    let appliedVoucherCode = null;
    let appliedVoucherDiscount = 0;
    let membershipDiscount = 0;

    // 1. Membership Discount
    if (userId) {
      const users = await db
        .select({ membershipTier: usersTable.membershipTier })
        .from(usersTable)
        .where(eq(usersTable.id, Number(userId)))
        .limit(1);

      if (users.length > 0) {
        const tier = users[0].membershipTier;
        if (tier === 'platinum') membershipDiscount = Math.round(subtotal * 0.15);
        else if (tier === 'gold') membershipDiscount = Math.round(subtotal * 0.1);
        else if (tier === 'silver') membershipDiscount = Math.round(subtotal * 0.05);

        if (tier === 'platinum' || tier === 'gold' || tier === 'silver') {
          finalShippingFee = 0;
        }
      }
    }
    finalDiscount += membershipDiscount;

    // 2. Voucher Validation
    if (voucherCode) {
      let coupon: any = null;
      const couponsArr = await db
        .select()
        .from(coupons)
        .where(
          and(
            eq(coupons.code, voucherCode),
            or(isNull(coupons.endsAt), gt(coupons.endsAt, new Date()))!,
            or(isNull(coupons.startsAt), lte(coupons.startsAt, new Date()))!
          )
        )
        .limit(1);

      if (couponsArr && couponsArr.length > 0) {
        coupon = couponsArr[0];
        if (coupon.usageLimit !== null) {
          const [usage] = await db
            .select({ count: count() })
            .from(couponUsage)
            .where(eq(couponUsage.couponId, coupon.id));

          if (usage && usage.count >= coupon.usageLimit) coupon = null;
        }

        // Check usage limit per user
        if (coupon && userId && coupon.usageLimitPerUser !== null) {
          const [userUsage] = await db
            .select({ count: count() })
            .from(couponUsage)
            .where(
              and(eq(couponUsage.couponId, coupon.id), eq(couponUsage.userId, Number(userId)))
            );
          if (userUsage && userUsage.count >= coupon.usageLimitPerUser) coupon = null;
        }
      } else {
        const vouchersArr = await db
          .select()
          .from(vouchers)
          .where(
            and(
              eq(vouchers.code, voucherCode),
              eq(vouchers.status, 'active'),
              sql`(${vouchers.validUntil} IS NULL OR ${vouchers.validUntil} > NOW())`
            )
          )
          .limit(1);

        if (vouchersArr && vouchersArr.length > 0) {
          coupon = vouchersArr[0];
          if (coupon.recipientUserId && Number(userId) !== Number(coupon.recipientUserId)) {
            coupon = null;
          }

          // Check usage limit per user for vouchers
          if (coupon && userId && coupon.usageLimitPerUser !== null) {
            const [userUsage] = await db
              .select({ count: count() })
              .from(couponUsage)
              .where(
                and(eq(couponUsage.couponId, coupon.id), eq(couponUsage.userId, Number(userId)))
              );
            if (userUsage && userUsage.count >= coupon.usageLimitPerUser) coupon = null;
          }
        }
      }

      if (coupon) {
        const minOrder = Number(coupon.minOrderAmount || coupon.minOrderValue || 0);
        if (subtotal >= minOrder) {
          const val = Number(coupon.discountValue || coupon.value);
          const type = coupon.discountType;
          let vDiscount = type === 'percent' ? Math.round((subtotal * val) / 100) : val;

          // Apply max discount amount cap if applicable (for coupons)
          const maxDiscountCap = Number(coupon.maxDiscountAmount || 0);
          if (type === 'percent' && maxDiscountCap > 0 && vDiscount > maxDiscountCap) {
            vDiscount = maxDiscountCap;
          }

          vDiscount = Math.min(vDiscount, subtotal);
          appliedVoucherCode = coupon.code;
          appliedVoucherDiscount = vDiscount;
          finalDiscount += vDiscount;
        }
      }
    }

    if (finalDiscount > subtotal) finalDiscount = subtotal;

    // Automatic 10% VAT calculation (for consistency with backend repository)
    const calculatedTax = body.tax !== undefined ? Number(body.tax) : Math.round(subtotal * 0.1);

    let totalAmount =
      subtotal +
      finalShippingFee +
      calculatedTax -
      finalDiscount +
      (has_gift_wrapping ? gift_wrap_cost || 0 : 0);
    if (totalAmount < 0) totalAmount = 0;

    // 3. Gift Card Validation
    let appliedGiftCardNumber = null;
    let appliedGiftCardDiscount = 0;

    if (giftcardNumber) {
      const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
      const ipTarget = clientIp.split(',')[0].trim();

      const [lockout] = await db
        .select()
        .from(giftCardLockouts)
        .where(
          and(
            eq(giftCardLockouts.ipAddress, ipTarget),
            or(
              isNull(giftCardLockouts.lockoutUntil),
              gt(giftCardLockouts.lockoutUntil, new Date())
            )!,
            gte(giftCardLockouts.lastAttempt, sql`NOW() - INTERVAL 30 MINUTE`)
          )
        )
        .limit(1);

      if (lockout && lockout.lockoutUntil && new Date(lockout.lockoutUntil) > new Date()) {
        return ResponseWrapper.error('Bạn đã nhập thẻ quá nhiều lần. Thử lại sau 30 phút.', 429);
      }

      const hashedCard = hashGiftCard(giftcardNumber);

      const [card] = await db
        .select()
        .from(giftCards)
        .where(and(eq(giftCards.cardNumberHash, hashedCard), eq(giftCards.status, 'active')))
        .limit(1);

      if (card) {
        const balance = parseFloat(card.currentBalance);
        const deduction = Math.min(balance, totalAmount);
        if (deduction > 0) {
          appliedGiftCardNumber = hashedCard; // Store hash in order
          appliedGiftCardDiscount = deduction;
          totalAmount -= deduction;
        }
      }
    }

    // Create Order
    const orderId = await createOrder({
      userId: userId ? Number(userId) : undefined,
      orderNumber,
      totalAmount,
      shippingFee: finalShippingFee,
      discount: finalDiscount,
      tax: calculatedTax,
      voucherCode: appliedVoucherCode,
      voucherDiscount: appliedVoucherDiscount,
      giftcardNumber: appliedGiftCardNumber,
      giftcardDiscount: appliedGiftCardDiscount,
      membershipDiscount: membershipDiscount,
      shippingAddress:
        typeof shippingAddress === 'string' ? shippingAddress : JSON.stringify(shippingAddress),
      phone,
      email,
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: body.paymentStatus || 'pending',
      hasGiftWrapping: has_gift_wrapping || false,
      giftWrapCost: has_gift_wrapping ? settings.gift_wrap_fee || 25000 : 0,
      items: validatedItems,
      notes: notes || null,
    });

    return ResponseWrapper.success(
      {
        orderId,
        orderNumber,
        totalAmount,
        membershipDiscount,
      },
      'Đặt hàng thành công'
    );
  } catch (error) {
    console.error('Lỗi khi tạo đơn hàng:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}

export const POST = withRateLimit(createOrderHandler, {
  tag: 'order',
  limit: 100,
  windowMs: 60 * 60 * 1000,
});
