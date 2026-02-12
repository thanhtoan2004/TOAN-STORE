import { NextRequest, NextResponse } from 'next/server';
import { getOrdersByUserId, createOrder, executeQuery } from '@/lib/db/mysql';
import { sendOrderConfirmation } from '@/lib/mail';
import { verifyAuth } from '@/lib/auth';
import { formatCurrency } from '@/lib/date-utils';

// GET - Lấy danh sách đơn hàng
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
      const [items] = await pool.execute(
        `SELECT 
          oi.*,
          (SELECT url FROM product_images WHERE product_id = oi.product_id AND is_main = 1 LIMIT 1) as image_url
         FROM order_items oi
         WHERE oi.order_id = ?
         LIMIT 1`,
        [order.id]
      ) as any[];

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

// POST - Tạo đơn hàng mới
export async function POST(request: NextRequest) {
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

    // Generate order number
    const orderNumber = `NK${Date.now()}`;

    // Tính tổng tiền
    const subtotal = items.reduce((sum: number, item: any) => {
      return sum + (item.price * item.quantity);
    }, 0);

    let finalShippingFee = shippingFee || (subtotal >= 500000 ? 0 : 30000);
    let finalDiscount = discount || 0;

    // Membership logic
    let membershipDiscount = 0;
    if (userId) {
      const users = await executeQuery(
        'SELECT membership_tier FROM users WHERE id = ?',
        [userId]
      ) as any[];

      if (users.length > 0) {
        const tier = users[0].membership_tier;

        // Tier Discount
        if (tier === 'gold') {
          membershipDiscount = Math.round(subtotal * 0.10); // 10%
        } else if (tier === 'silver') {
          membershipDiscount = Math.round(subtotal * 0.05); // 5%
        }

        // Tier Free Shipping
        if (tier === 'gold' || tier === 'silver') {
          finalShippingFee = 0;
        }
      }
    }

    finalDiscount += membershipDiscount;
    const totalAmount = subtotal + finalShippingFee - finalDiscount;

    // Tạo order trong database
    const orderId = await createOrder({
      userId: userId ? Number(userId) : undefined,
      orderNumber,
      totalAmount,
      shippingFee: finalShippingFee,
      discount: finalDiscount,
      tax: body.tax || 0,
      voucherCode: voucherCode || null,
      voucherDiscount: voucherDiscount || 0,
      giftcardNumber: giftcardNumber || null,
      giftcardDiscount: giftcardDiscount || 0,
      shippingAddress: typeof shippingAddress === 'string' ? shippingAddress : JSON.stringify(shippingAddress),
      phone,
      email,
      paymentMethod: paymentMethod || 'cod',
      paymentStatus: body.paymentStatus || 'pending',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: items.map((item: any) => ({
        productId: item.productId || item.product_id,
        productName: item.productName || item.name,
        productImage: item.productImage || item.image || item.image_url,
        size: item.size,
        quantity: item.quantity,
        price: item.price
      })),
      notes: notes ? `${notes} (Membership Discount: ${formatCurrency(membershipDiscount)})` : `Membership Discount: ${formatCurrency(membershipDiscount)}`
    });

    // Gửi email xác nhận đơn hàng
    sendOrderConfirmation(email, orderNumber, totalAmount).catch(console.error);

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