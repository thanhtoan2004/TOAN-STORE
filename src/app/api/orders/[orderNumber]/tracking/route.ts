import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { sendShippingNotificationEmail } from '@/lib/mail/email-templates';

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
      return NextResponse.json(
        {
          success: false,
          message: 'Tracking number and carrier are required',
        },
        { status: 400 }
      );
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
      return NextResponse.json(
        {
          success: false,
          message: 'Order not found',
        },
        { status: 404 }
      );
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
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Tracking information updated successfully',
      data: {
        orderNumber,
        trackingNumber,
        carrier,
        shippedAt,
      },
    });
  } catch (error) {
    console.error('Update tracking error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update tracking information',
      },
      { status: 500 }
    );
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
      return NextResponse.json(
        {
          success: false,
          message: 'Order not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Get tracking error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to get tracking information',
      },
      { status: 500 }
    );
  }
}
