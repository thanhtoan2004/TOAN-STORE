import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { sendShippingNotificationEmail } from '@/lib/mail/email-templates';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * Update order tracking information
 * PATCH /api/orders/[orderNumber]/tracking
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    const body = await request.json();
    const { trackingNumber, carrier, status } = body;

    if (!trackingNumber || !carrier) {
      return ResponseWrapper.error('Tracking number and carrier are required', 400);
    }

    // Update order with tracking info
    const shippedAt = status === 'shipped' ? new Date() : null;

    await query(
      `UPDATE orders 
       SET tracking_number = ?,
           carrier = ?,
           shipped_at = COALESCE(shipped_at, ?),
           status = COALESCE(?, status),
           updated_at = NOW()
       WHERE order_number = ?`,
      [trackingNumber, carrier, shippedAt, status, orderNumber]
    );

    // Get order details for email
    const [order] = await query(
      `SELECT o.*, u.email, u.first_name, u.last_name
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.order_number = ?`,
      [orderNumber]
    );

    if (!order) {
      return ResponseWrapper.notFound('Order not found');
    }

    // Send shipping notification email if status is shipped
    if (status === 'shipped' && order.email) {
      const customerName =
        order.first_name && order.last_name
          ? `${order.first_name} ${order.last_name}`
          : order.email;

      await sendShippingNotificationEmail(
        order.email,
        customerName,
        orderNumber,
        trackingNumber,
        carrier
      ).catch((err) => console.error('Error sending shipping email:', err));
    }

    return ResponseWrapper.success(
      {
        orderNumber,
        trackingNumber,
        carrier,
        shippedAt,
      },
      'Tracking information updated successfully'
    );
  } catch (error) {
    console.error('Update tracking error:', error);
    return ResponseWrapper.serverError('Failed to update tracking information', error);
  }
}

/**
 * Get order tracking information
 * GET /api/orders/[orderNumber]/tracking
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;

    const [order] = await query(
      `SELECT order_number, status, tracking_number, carrier, 
              shipped_at, delivered_at, placed_at as created_at
       FROM orders
       WHERE order_number = ?`,
      [orderNumber]
    );

    if (!order) {
      return ResponseWrapper.notFound('Order not found');
    }

    return ResponseWrapper.success(order);
  } catch (error) {
    console.error('Get tracking error:', error);
    return ResponseWrapper.serverError('Failed to get tracking information', error);
  }
}
