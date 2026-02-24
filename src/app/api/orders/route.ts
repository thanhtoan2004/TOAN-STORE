import { NextRequest, NextResponse } from 'next/server';
import { getOrdersByUserId, createOrder, executeQuery } from '@/lib/db/mysql';
import { verifyAuth } from '@/lib/auth';
import { formatCurrency } from '@/lib/date-utils';
import { withRateLimit } from '@/lib/with-rate-limit';

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
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const userId = session.userId;

    // Lấy orders từ database
    let orders = await getOrdersByUserId(Number(userId)) as any[];

    // Filter by status nếu có
    if (status && status !== 'all') {
      orders = orders.filter(o => o.status === status);
    }

    // Enrich orders with item count and preview image
    const enrichedOrders = await Promise.all(orders.map(async (order: any) => {
      // Get order items to count and get preview image
      const { pool } = await import('@/lib/db/mysql');
      const [items]: any = await pool.execute(
        `SELECT 
          oi.*,
          (SELECT url FROM product_images WHERE product_id = oi.product_id AND is_main = 1 LIMIT 1) as image_url
         FROM order_items oi
         WHERE oi.order_id = ?
         LIMIT 1`,
        [order.id]
      );

      return {
        ...order,
        item_count: order.item_count || 0,
        preview_image: items[0]?.image_url || null
      };
    }));

    // Pagination
    const total = enrichedOrders.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedOrders = enrichedOrders.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách đơn hàng:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server nội bộ' },
      { status: 500 }
    );
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
    const { items, shippingAddress, phone, email, paymentMethod, notes, shippingFee, discount, voucherCode, voucherDiscount, giftcardNumber, giftcardDiscount } = body;

    // Validate
    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Giỏ hàng trống' },
        { status: 400 }
      );
    }

    if (!shippingAddress || !phone || !email) {
      return NextResponse.json(
        { success: false, message: 'Thiếu thông tin giao hàng' },
        { status: 400 }
      );
    }

    // Validate Items & Prices (Security Fix + Flash Sale Integration)
    const { findVariantBySize, checkStock } = await import('@/lib/db/variants');
    const { getActiveFlashSaleItem, updateFlashSaleSoldQuantity } = await import('@/lib/db/repositories/flash_sale');
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

    for (const item of items) {
      const productId = parseInt(item.productId || item.product_id);
      const size = item.size;
      const quantity = parseInt(item.quantity) || 1;

      // 1. Find Variant
      const variant = await findVariantBySize(productId, size);
      if (!variant) {
        return NextResponse.json({ success: false, message: `Sản phẩm ${item.productName || productId} size ${size} không tồn tại` }, { status: 400 });
      }

      // 2. Check Inventory
      const hasStock = await checkStock(variant.id, quantity);
      if (!hasStock) {
        return NextResponse.json({ success: false, message: `Sản phẩm ${item.productName} hết hàng` }, { status: 400 });
      }

      // 3. Determine Price (Base vs Flash Sale)
      let finalPrice = parseFloat(variant.price.toString());
      const flashSaleItem = await getActiveFlashSaleItem(productId);

      if (flashSaleItem) {
        // Check flash sale stock
        // Note: This is an optimistic check. Concurrency might be an issue but acceptable for now.
        if (flashSaleItem.sold_quantity + quantity <= flashSaleItem.total_quantity) {
          finalPrice = parseFloat(flashSaleItem.sale_price.toString());
          flashSaleUpdates.push({ id: flashSaleItem.id, quantity });
        }
      }

      validatedItems.push({
        productId,
        productName: variant.product_name || item.productName || item.name, // Use DB name preferrably
        productImage: item.productImage || item.image || item.image_url,
        size,
        quantity,
        price: finalPrice,
        productVariantId: variant.id
      });
    }

    // Generate secure order number (Prefix + Timestamp + Random suffix)
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `NK${Date.now()}_${randomSuffix}`;

    // Tính tổng tiền từ validatedItems (NOT from body)
    const subtotal = validatedItems.reduce((sum: number, item: any) => {
      return sum + (item.price * item.quantity);
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
      const users = await executeQuery(
        'SELECT membership_tier FROM users WHERE id = ?',
        [userId]
      ) as any[];

      if (users.length > 0) {
        const tier = users[0].membership_tier;
        // Tier Discount
        if (tier === 'platinum') membershipDiscount = Math.round(subtotal * 0.15); // 15%
        else if (tier === 'gold') membershipDiscount = Math.round(subtotal * 0.10); // 10%
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
          const usageCount = await executeQuery<any[]>(`SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ?`, [coupon.id]);
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
          if (coupon.recipient_user_id && (!userId || Number(userId) !== Number(coupon.recipient_user_id))) {
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

    let totalAmount = subtotal + finalShippingFee - finalDiscount;
    if (totalAmount < 0) totalAmount = 0;

    // 3. Gift Card Validation
    let appliedGiftCardNumber = null;
    let appliedGiftCardDiscount = 0;

    if (giftcardNumber) {
      const cardsArr = await executeQuery<any[]>(
        `SELECT id, current_balance, status, expires_at FROM gift_cards WHERE card_number = ?`,
        [giftcardNumber]
      );

      if (cardsArr && cardsArr.length > 0) {
        const card = cardsArr[0];
        if (card.status === 'active' && (!card.expires_at || new Date(card.expires_at) > new Date())) {
          const balance = parseFloat(card.current_balance);
          const deduction = Math.min(balance, totalAmount);

          if (deduction > 0) {
            appliedGiftCardNumber = giftcardNumber;
            appliedGiftCardDiscount = deduction;
          }
        }
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
      shippingAddress: typeof shippingAddress === 'string' ? shippingAddress : JSON.stringify(shippingAddress),
      phone,
      email,
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: body.paymentStatus || 'pending',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: validatedItems.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        size: item.size,
        quantity: item.quantity,
        price: item.price // Verified Price
      })),
      notes: notes ? `${notes} (Membership Discount: ${formatCurrency(membershipDiscount)})` : `Membership Discount: ${formatCurrency(membershipDiscount)}`
    });

    // Update Flash Sale Stock
    for (const update of flashSaleUpdates) {
      await updateFlashSaleSoldQuantity(update.id, update.quantity);
    }

    // Email sending is now handled by Event Worker listening to 'order.created'

    return NextResponse.json({
      success: true,
      message: 'Đặt hàng thành công',
      data: {
        orderId,
        orderNumber,
        totalAmount,
        membershipDiscount
      }
    });
  } catch (error) {
    console.error('Lỗi khi tạo đơn hàng:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server nội bộ' },
      { status: 500 }
    );
  }
}

// Export wrapped POST handler
export const POST = withRateLimit(createOrderHandler, {
  tag: 'order',
  limit: 100,
  windowMs: 60 * 60 * 1000, // 100 orders per hour
});