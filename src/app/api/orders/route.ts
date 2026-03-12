import { NextRequest, NextResponse } from 'next/server';
import { getOrdersByUserId, createOrder, executeQuery } from '@/lib/db/mysql';
import { verifyAuth } from '@/lib/auth/auth';
import { formatCurrency } from '@/lib/utils/date-utils';
import { withRateLimit } from '@/lib/api/with-rate-limit';

// GET - Lấy danh sách đơn hàng
/**
 * API Lấy lịch sử đơn hàng của người dùng.
 * Yêu cầu: Xác thực tài khoản (verifyAuth).
 * Tính năng:
 * 1. Filtering: Lọc theo trạng thái đơn (Chờ duyệt, Đang giao, Đã hủy, v.v.).
 * 2. Pagination: Phân trang để tối ưu tốc độ load.
 * 3. Enrichment: Tự động query thêm ảnh đại diện của sản phẩm đầu tiên để hiển thị ở List View.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50); // Cap at 50
    const userId = session.userId;
    const offset = (page - 1) * limit;

    // SQL-level filtering + pagination (thay vì fetch ALL rồi .slice())
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE user_id = ?';
    let dataQuery = `SELECT * FROM orders WHERE user_id = ?`;
    const params: any[] = [Number(userId)];
    const countParams: any[] = [Number(userId)];

    if (status && status !== 'all') {
      countQuery += ' AND status = ?';
      dataQuery += ' AND status = ?';
      params.push(status);
      countParams.push(status);
    }

    dataQuery += ' ORDER BY placed_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [countResult, orders] = await Promise.all([
      executeQuery<any[]>(countQuery, countParams),
      executeQuery<any[]>(dataQuery, params),
    ]);

    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // Enrich with order items
    const enrichedOrders = await Promise.all(
      orders.map(async (order: any) => {
        const items = await executeQuery<any[]>(
          'SELECT oi.*, pi.url as image_url FROM order_items oi LEFT JOIN product_images pi ON pi.product_id = oi.product_id AND pi.is_main = 1 WHERE oi.order_id = ? LIMIT 5',
          [order.id]
        );
        return {
          ...order,
          items,
          item_count: items.length,
          preview_image: items[0]?.image_url || '/placeholder-product.png',
        };
      })
    );

    return NextResponse.json({
      success: true,
      orders: enrichedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đơn hàng:', error);
    return NextResponse.json({ success: false, message: 'Lỗi server nội bộ' }, { status: 500 });
  }
}

// POST Handler logic
/**
 * API Khởi tạo đơn hàng (Checkout Flow).
 * Quy trình xử lý bảo mật & nghiệp vụ cực kỳ chặt chẽ:
 * 1. Kiểm tra tồn kho (Inventory) theo từng Size.
 * 2. Phân loại giá: Kiểm tra xem sản phẩm có đang trong Flash Sale không để áp giá khuyến mãi.
 * 3. Voucher & Giftcard: Khấu trừ số dư và kiểm tra tính hợp lệ của mã giảm giá.
 * 4. Transaction: Đảm bảo nếu lưu đơn lỗi thì hoàn trả (Rollback) lại số lượng kho đã trừ.
 */
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
      return NextResponse.json({ success: false, message: 'Giỏ hàng trống' }, { status: 400 });
    }

    if (!shippingAddress || !phone || !email) {
      return NextResponse.json(
        { success: false, message: 'Thiếu thông tin giao hàng' },
        { status: 400 }
      );
    }

    // Validate Items & Prices (Security Fix + Flash Sale Integration)
    const { findVariantBySize, checkStock } = await import('@/lib/db/variants');
    const { getActiveFlashSaleItem, updateFlashSaleSoldQuantity } = await import(
      '@/lib/db/repositories/flash_sale'
    );
    const { getSettings } = await import('@/lib/db/settings');

    // Get Store Settings
    const settings = await getSettings();
    const domesticShippingFee = settings.shipping_cost_domestic || 30000;

    // Override shipping fee from client with server config (Security)
    // Note: If logic depends on address (International vs Domestic), implement here.
    // For now assuming domestic.
    // const secureShippingFee = domesticShippingFee;
    // Actually, createOrder accepts shippingFee as input? It should be calculated server side.
    // But currently we validate it or just use it?
    // The current logic doesn't seem to RE-CALCULATE shipping fee in lines 103+.
    // It uses `shippingFee` from body in `orderData`.
    // We should enforce it.

    const validatedItems: any[] = [];
    const flashSaleUpdates: { id: number; quantity: number }[] = [];

    // TỐI ƯU HÓA: Validate các items song song (Promise.all) thay vì tuần tự (N+1 queries)
    const validationPromises = items.map(async (item: any) => {
      const productId = parseInt(item.productId || item.product_id);
      const size = item.size;
      const quantity = parseInt(item.quantity) || 1;

      // 1. Find Variant
      const variant = await findVariantBySize(productId, size);
      if (!variant) {
        throw new Error(`Sản phẩm ${item.productName || productId} size ${size} không tồn tại`);
      }

      // 2. Check Inventory
      const hasStock = await checkStock(variant.id, quantity);
      if (!hasStock) {
        throw new Error(`Sản phẩm ${item.productName || variant.product_name || 'này'} hết hàng`);
      }

      // 3. Determine Price (Base vs Flash Sale)
      let finalPrice = parseFloat(variant.price.toString());
      const flashSaleItem = await getActiveFlashSaleItem(productId);
      let fsUpdate: { id: number; quantity: number } | null = null;

      if (flashSaleItem) {
        // Check flash sale stock
        if (flashSaleItem.sold_quantity + quantity <= flashSaleItem.total_quantity) {
          finalPrice = parseFloat(flashSaleItem.sale_price.toString());
          fsUpdate = { id: flashSaleItem.id, quantity };
        }
      }

      return {
        item: {
          productId,
          productName: variant.product_name || item.productName || item.name,
          productImage: item.productImage || item.image || item.image_url,
          size,
          quantity,
          price: finalPrice,
          productVariantId: variant.id,
        },
        fsUpdate,
      };
    });

    try {
      const results = await Promise.all(validationPromises);
      for (const res of results) {
        validatedItems.push(res.item);
        if (res.fsUpdate) {
          flashSaleUpdates.push(res.fsUpdate);
        }
      }
    } catch (e: any) {
      return NextResponse.json({ success: false, message: e.message }, { status: 400 });
    }

    // Generate secure order number (Prefix + Timestamp + Random suffix)
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `NK${Date.now()}_${randomSuffix}`;

    // Tính tổng tiền từ validatedItems (NOT from body)
    const subtotal = validatedItems.reduce((sum: number, item: any) => {
      return sum + item.price * item.quantity;
    }, 0);

    // SECURITY FIX: Server-side Shipping Fee Calculation
    // Free shipping for orders >= 500,000 VND, otherwise 30,000 VND
    let finalShippingFee = subtotal >= 500000 ? 0 : 30000;

    // SECURITY FIX: Server-side Discount Calculation
    let finalDiscount = 0;
    let appliedVoucherCode = null;
    let appliedVoucherDiscount = 0;

    // 1. Membership Discount
    let membershipDiscount = 0;
    if (userId) {
      const users = (await executeQuery('SELECT membership_tier FROM users WHERE id = ?', [
        userId,
      ])) as any[];

      if (users.length > 0) {
        const tier = users[0].membership_tier;
        // Tier Discount
        if (tier === 'platinum')
          membershipDiscount = Math.round(subtotal * 0.15); // 15%
        else if (tier === 'gold')
          membershipDiscount = Math.round(subtotal * 0.1); // 10%
        else if (tier === 'silver') membershipDiscount = Math.round(subtotal * 0.05); // 5%

        // Tier Free Shipping (Silver and above)
        if (tier === 'platinum' || tier === 'gold' || tier === 'silver') {
          finalShippingFee = 0;
        }
      }
    }
    finalDiscount += membershipDiscount;

    // 2. Voucher Validation (Restore functionality safely)
    if (voucherCode) {
      // Check Coupons Table
      let coupon: any = null;
      const couponsArr = await executeQuery<any[]>(
        `SELECT * FROM coupons WHERE code = ? AND (ends_at IS NULL OR ends_at > NOW()) AND (starts_at IS NULL OR starts_at <= NOW())`,
        [voucherCode]
      );

      if (couponsArr && couponsArr.length > 0) {
        coupon = couponsArr[0];
        // Check Usage Limit
        if (coupon.usage_limit !== null) {
          const usageCount = await executeQuery<any[]>(
            `SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ?`,
            [coupon.id]
          );
          if (usageCount[0].count >= coupon.usage_limit) coupon = null; // Exceeded
        }
      } else {
        // Check Personal Vouchers
        const vouchersArr = await executeQuery<any[]>(
          `SELECT * FROM vouchers WHERE code = ? AND status = 'active' AND (valid_until IS NULL OR valid_until > NOW())`,
          [voucherCode]
        );
        if (vouchersArr && vouchersArr.length > 0) {
          coupon = vouchersArr[0];
          if (
            coupon.recipient_user_id &&
            (!userId || Number(userId) !== Number(coupon.recipient_user_id))
          ) {
            coupon = null; // Not owner
          }
        }
      }

      if (coupon) {
        // Check Min Order
        const minOrder = coupon.min_order_amount || coupon.min_order_value || 0;
        if (subtotal >= minOrder) {
          // Calculate Discount
          const val = coupon.discount_value || coupon.value;
          const type = coupon.discount_type; // 'percent' or 'fixed'

          let vDiscount = 0;
          if (type === 'percent') {
            vDiscount = Math.round((subtotal * val) / 100);
          } else {
            vDiscount = val;
          }
          // Cap at subtotal
          vDiscount = Math.min(vDiscount, subtotal);

          appliedVoucherCode = coupon.code;
          appliedVoucherDiscount = vDiscount;
          finalDiscount += vDiscount;
        }
      }
    }

    // Recalculate Total (Before Gift Card)
    if (finalDiscount > subtotal) finalDiscount = subtotal;

    let totalAmount =
      subtotal + finalShippingFee - finalDiscount + (has_gift_wrapping ? gift_wrap_cost || 0 : 0);
    if (totalAmount < 0) totalAmount = 0;

    // 3. Gift Card Validation
    let appliedGiftCardNumber = null;
    let appliedGiftCardDiscount = 0;

    if (giftcardNumber) {
      // Security: Check IP Lockout before trying to validate
      const clientIp =
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const ipTarget = clientIp.includes(',') ? clientIp.split(',')[0].trim() : clientIp;

      const ipLockouts = await executeQuery<any[]>(
        `SELECT attempt_count, locked_until, id FROM gift_card_lockouts 
         WHERE ip_address = ? AND (locked_until IS NULL OR locked_until > NOW()) 
         AND last_attempt >= NOW() - INTERVAL 30 MINUTE`,
        [ipTarget]
      );

      let currentIpAttempts = 0;
      let lockoutId = null;

      if (ipLockouts && ipLockouts.length > 0) {
        const lockout = ipLockouts[0];
        if (lockout.locked_until && new Date(lockout.locked_until) > new Date()) {
          return NextResponse.json(
            { success: false, message: 'Bạn đã nhập thẻ quá nhiều lần. Thử lại sau 30 phút.' },
            { status: 429 }
          );
        }
        currentIpAttempts = lockout.attempt_count;
        lockoutId = lockout.id;
      }

      const cardsArr = await executeQuery<any[]>(
        `SELECT id, current_balance, status, failed_attempts, expires_at, pin as encrypted_pin FROM gift_cards WHERE card_number = ?`,
        [giftcardNumber]
      );

      if (cardsArr && cardsArr.length > 0) {
        const card = cardsArr[0];

        // Anti Brute Force Check
        if (card.status === 'locked' || card.failed_attempts >= 5) {
          return NextResponse.json(
            { success: false, message: 'Thẻ đã bị khóa do nhập sai nhiều lần.' },
            { status: 403 }
          );
        }

        // Must verify PIN if provided in the checkout flow (Assume body.giftcardPin exists or we just rely on Card Number?? Wait, original logic didn't ask for PIN during checkout? If no PIN, anyone can use the card number!)
        // SECURITY FIX: Checkout MUST provide PIN.
        const providedPin = body.giftcardPin;
        if (!providedPin) {
          return NextResponse.json(
            { success: false, message: 'Vui lòng cung cấp mã PIN của thẻ quà tặng' },
            { status: 400 }
          );
        }

        const { decrypt } = await import('@/lib/security/encryption');
        if (decrypt(card.encrypted_pin) !== providedPin) {
          // Penalty IP
          const newAttempts = currentIpAttempts + 1;
          let lockedUntil = null;
          if (newAttempts >= 8) {
            lockedUntil = new Date(Date.now() + 30 * 60000); // 30 mins
          }
          if (lockoutId) {
            await executeQuery(
              'UPDATE gift_card_lockouts SET attempt_count = ?, locked_until = ?, last_attempt = NOW() WHERE id = ?',
              [
                newAttempts,
                lockedUntil ? lockedUntil.toISOString().slice(0, 19).replace('T', ' ') : null,
                lockoutId,
              ]
            );
          } else {
            await executeQuery(
              'INSERT INTO gift_card_lockouts (ip_address, attempt_count, locked_until) VALUES (?, ?, ?)',
              [
                ipTarget,
                newAttempts,
                lockedUntil ? lockedUntil.toISOString().slice(0, 19).replace('T', ' ') : null,
              ]
            );
          }

          // Penalty Card
          const newFailed = (card.failed_attempts || 0) + 1;
          if (newFailed >= 5) {
            await executeQuery(
              'UPDATE gift_cards SET failed_attempts = ?, status = ? WHERE id = ?',
              [newFailed, 'locked', card.id]
            );
            return NextResponse.json(
              { success: false, message: 'Thẻ đã bị khóa do nhập sai mã PIN quá 5 lần.' },
              { status: 403 }
            );
          } else {
            await executeQuery('UPDATE gift_cards SET failed_attempts = ? WHERE id = ?', [
              newFailed,
              card.id,
            ]);
            return NextResponse.json(
              { success: false, message: 'Mã PIN thẻ quà tặng không chính xác.' },
              { status: 400 }
            );
          }
        }

        if (
          card.status === 'active' &&
          (!card.expires_at || new Date(card.expires_at) > new Date())
        ) {
          // Success Path - Reset attempts
          if (lockoutId)
            await executeQuery('DELETE FROM gift_card_lockouts WHERE id = ?', [lockoutId]);
          if (card.failed_attempts > 0)
            await executeQuery('UPDATE gift_cards SET failed_attempts = 0 WHERE id = ?', [card.id]);

          const balance = parseFloat(card.current_balance);
          const deduction = Math.min(balance, totalAmount);

          if (deduction > 0) {
            appliedGiftCardNumber = giftcardNumber;
            appliedGiftCardDiscount = deduction;
          }
        } else {
          return NextResponse.json(
            { success: false, message: 'Thẻ quà tặng không hợp lệ hoặc đã hết hạn.' },
            { status: 400 }
          );
        }
      } else {
        // Did not even find the card -> Penalty IP
        const newAttempts = currentIpAttempts + 1;
        let lockedUntil = null;
        if (newAttempts >= 8) lockedUntil = new Date(Date.now() + 30 * 60000);
        if (lockoutId) {
          await executeQuery(
            'UPDATE gift_card_lockouts SET attempt_count = ?, locked_until = ?, last_attempt = NOW() WHERE id = ?',
            [
              newAttempts,
              lockedUntil ? lockedUntil.toISOString().slice(0, 19).replace('T', ' ') : null,
              lockoutId,
            ]
          );
        } else {
          await executeQuery(
            'INSERT INTO gift_card_lockouts (ip_address, attempt_count, locked_until) VALUES (?, ?, ?)',
            [
              ipTarget,
              newAttempts,
              lockedUntil ? lockedUntil.toISOString().slice(0, 19).replace('T', ' ') : null,
            ]
          );
        }
        return NextResponse.json(
          { success: false, message: 'Thẻ quà tặng không tồn tại.' },
          { status: 404 }
        );
      }
    }

    // Tạo order trong database
    const orderId = await createOrder({
      userId: userId ? Number(userId) : undefined,
      orderNumber,
      totalAmount,
      shippingFee: finalShippingFee,
      discount: finalDiscount,
      tax: body.tax || 0,
      voucherCode: appliedVoucherCode,
      voucherDiscount: appliedVoucherDiscount,
      giftcardNumber: appliedGiftCardNumber,
      giftcardDiscount: appliedGiftCardDiscount,
      shippingAddress:
        typeof shippingAddress === 'string' ? shippingAddress : JSON.stringify(shippingAddress),
      phone,
      email,
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: body.paymentStatus || 'pending',
      has_gift_wrapping: has_gift_wrapping || false,
      giftWrapCost: gift_wrap_cost || 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: validatedItems.map((item: any) => ({
        productId: item.productId,
        productVariantId: item.productVariantId, // Đã thêm vào để truyền sang DB function update nhanh hơn
        productName: item.productName,
        productImage: item.productImage,
        size: item.size,
        quantity: item.quantity,
        price: item.price, // Verified Price
      })),
      notes: notes || null,
    });

    // BUGS FIXED: Flash Sale Stock Update is ALREADY handled SECURELY inside `createOrder` (src/lib/db/repositories/order.ts) with `FOR UPDATE` transaction and Redis Lock.
    // The previous code here caused a double-decrement bug and delayed response times by doing redundant queries.
    // Removed the `for (const update of flashSaleUpdates)` loop.

    // Email sending is now handled by Event Worker listening to 'order.created'

    return NextResponse.json({
      success: true,
      message: 'Đặt hàng thành công',
      data: {
        orderId,
        orderNumber,
        totalAmount,
        membershipDiscount,
      },
    });
  } catch (error) {
    console.error('Lỗi khi tạo đơn hàng:', error);
    return NextResponse.json({ success: false, message: 'Lỗi server nội bộ' }, { status: 500 });
  }
}

// Export wrapped POST handler
export const POST = withRateLimit(createOrderHandler, {
  tag: 'order',
  limit: 100,
  windowMs: 60 * 60 * 1000, // 100 orders per hour
});
