import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import {
  orders as ordersTable,
  orderItems,
  productImages,
  productVariants,
  productColors,
} from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth/auth';
import { sendOrderCancelledEmail } from '@/lib/mail/email-templates';
import { createNotification } from '@/lib/notifications/notifications';
import { getOrderByNumber } from '@/lib/db/repositories/order';
import { decrypt } from '@/lib/security/encryption';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Lấy chi tiết đơn hàng cho trang Order Detail (User).
 */

// GET - Lấy chi tiết đơn hàng theo orderNumber
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;

    // 1. Get order from database
    const orders = await getOrderByNumber(orderNumber);
    const order = orders[0];

    if (!order) {
      console.warn(`[API Orders] Order not found: ${orderNumber}`);
      return ResponseWrapper.notFound('Không tìm thấy đơn hàng');
    }

    // 2. Check ownership
    if (order.userId) {
      const session = await verifyAuth();
      if (!session) {
        console.warn(
          `[API Orders] No session found for order: ${orderNumber}, userId: ${order.userId}`
        );
        return ResponseWrapper.forbidden('Bạn không có quyền xem đơn hàng này hoặc cần đăng nhập');
      }
      if (Number(order.userId) !== Number(session.userId)) {
        console.warn(
          `[API Orders] User mismatch: Order owned by ${order.userId}, but session is user ${session.userId}`
        );
        return ResponseWrapper.forbidden('Bạn không có quyền xem đơn hàng này hoặc cần đăng nhập');
      }
    }
    // If guest order (order.userId is null), allow access by orderNumber alone
    // (Standard practice for order success pages)

    // 3. Get order items with product details using Drizzle
    const items = await db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        name: orderItems.productName,
        unit_price: orderItems.unitPrice,
        quantity: orderItems.quantity,
        total_price: orderItems.totalPrice,
        size: orderItems.size,
        color: sql<string>`(SELECT ${productColors.colorName} FROM ${productColors} AS pc JOIN ${productVariants} AS pv ON pc.${productColors.id} = pv.${productVariants.colorId} WHERE pv.${productVariants.id} = ${orderItems.productVariantId} LIMIT 1)`,
        imageUrl: sql<string>`(SELECT url FROM ${productImages} WHERE product_id = ${orderItems.productId} AND is_main = 1 LIMIT 1)`,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    // 4. Enrich items with UI fields
    const enrichedItems = items.map((item: any) => ({
      ...item,
      image: item.imageUrl || '/placeholder.png',
    }));

    // 5. Flatten shipping address for UI
    const shipping =
      typeof order.shippingAddressSnapshot === 'string'
        ? JSON.parse(order.shippingAddressSnapshot)
        : order.shippingAddressSnapshot;

    const orderData = {
      id: order.id,
      order_number: order.orderNumber,
      status: order.status,
      subtotal: order.subtotal,
      shipping_fee: order.shippingFee,
      discount: order.discount,
      tax: order.tax,
      total: order.total,
      placed_at: order.placedAt,
      updated_at: order.updatedAt,
      payment_method: order.paymentMethod,
      payment_status: order.paymentStatus,
      tracking_number: order.trackingNumber,
      carrier: order.carrier,
      shipped_at: order.shippedAt,
      delivered_at: order.deliveredAt,
      payment_confirmed_at: order.paymentConfirmedAt,
      cancelled_at: order.cancelledAt,
      voucher_discount: order.voucherDiscount,
      giftcard_discount: order.giftcardDiscount,
      membership_discount: order.membershipDiscount,
      has_gift_wrapping: order.hasGiftWrapping,
      gift_wrap_cost: order.giftWrapCost,
      delivery_name: shipping?.name || '',
      delivery_phone: decrypt(shipping?.phone || ''),
      delivery_address: decrypt(shipping?.address || ''),
      delivery_city: shipping?.city || '',
      delivery_district: shipping?.district || '',
      delivery_ward: shipping?.ward || '',
      items: enrichedItems,
      user_id: order.userId,
    };

    return ResponseWrapper.success(orderData);
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết đơn hàng:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}

// PUT - Cập nhật trạng thái đơn hàng (CHỈ HỦY)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized();
    }
    const { orderNumber } = await params;
    const body = await request.json();
    const { status } = body;

    // Security: Only allow user to cancel their own pending order
    const orders = await getOrderByNumber(orderNumber);
    const order = orders[0];

    if (!order) {
      return ResponseWrapper.notFound('Order not found');
    }

    if (order.userId !== session.userId) {
      return ResponseWrapper.forbidden();
    }

    if (status !== 'cancelled' || order.status !== 'pending') {
      return ResponseWrapper.error('Invalid action', 400);
    }

    // Update order status in database
    // Use cancelOrder to ensure stock is restored
    const { cancelOrder } = await import('@/lib/db/repositories/order');
    await cancelOrder(orderNumber);

    // Send Cancelled Email
    const userSession = session as any;
    if (userSession.email) {
      sendOrderCancelledEmail(userSession.email, userSession.name || 'Bạn', orderNumber).catch(
        console.error
      );
    }

    // Notification Bell
    await createNotification(
      session.userId,
      'order',
      'Đơn hàng đã hủy',
      `Bạn đã hủy đơn hàng #${orderNumber}.`,
      `/orders/${orderNumber}`
    );

    return ResponseWrapper.success(null, 'Đã cập nhật trạng thái đơn hàng');
  } catch (error) {
    console.error('Lỗi khi cập nhật đơn hàng:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}

// DELETE - Hủy đơn hàng
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized();
    }
    const { orderNumber } = await params;

    if (!orderNumber) {
      return ResponseWrapper.error('Mã đơn hàng không hợp lệ', 400);
    }

    // Get order to check status and ownership
    const orders = await getOrderByNumber(orderNumber);
    const order = orders[0];

    if (!order) {
      return ResponseWrapper.notFound('Không tìm thấy đơn hàng');
    }

    if (order.userId !== session.userId) {
      return ResponseWrapper.forbidden();
    }

    // Only allow cancelling pending orders
    if (order.status !== 'pending') {
      return ResponseWrapper.error('Không thể hủy đơn hàng đã được xác nhận', 400);
    }

    // Cancel order in database (use cancelOrder to properly release stock)
    const { cancelOrder: cancelOrderFn } = await import('@/lib/db/repositories/order');
    await cancelOrderFn(orderNumber);

    // Send Cancelled Email
    const userSession = session as any;
    if (userSession.email) {
      sendOrderCancelledEmail(userSession.email, userSession.name || 'Bạn', orderNumber).catch(
        console.error
      );
    }

    return ResponseWrapper.success(null, 'Đã hủy đơn hàng thành công');
  } catch (error) {
    console.error('Lỗi khi hủy đơn hàng:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}
