import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { hashEmail } from '@/lib/encryption';

export async function POST(request: NextRequest) {
  try {
    const { orderNumber, email } = await request.json();

    if (!orderNumber || !email) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập Mã đơn hàng và Email' },
        { status: 400 }
      );
    }

    // Query order basic info
    const emailHash = hashEmail(email);
    const orders = (await executeQuery(
      `SELECT o.* FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.order_number = ? AND (
           o.email_hash = ? OR 
           (o.email_hash IS NULL AND o.email = ?) OR
           (o.user_id IS NOT NULL AND u.email_hash = ?)
       )
       LIMIT 1`,
      [orderNumber, emailHash, email, emailHash]
    )) as any[];

    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy đơn hàng phù hợp' },
        { status: 404 }
      );
    }

    const order = orders[0];

    // Query order items
    const items = (await executeQuery(
      `SELECT 
        oi.*,
        (SELECT url FROM product_images WHERE product_id = oi.product_id AND is_main = 1 LIMIT 1) as image_url
       FROM order_items oi
       WHERE oi.order_id = ?`,
      [order.id]
    )) as any[];

    const orderDetails = {
      ...order,
      items: items,
    };

    return NextResponse.json({
      success: true,
      order: orderDetails,
    });
  } catch (error) {
    console.error('Order lookup error:', error);
    return NextResponse.json({ success: false, message: 'Lỗi server nội bộ' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('orderNumber');
    const email = searchParams.get('email');

    if (!orderNumber || !email) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng cung cấp orderNumber và email qua query params' },
        { status: 400 }
      );
    }

    // Query order basic info
    const emailHash = hashEmail(email);
    const orders = (await executeQuery(
      `SELECT o.* FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       WHERE o.order_number = ? AND (
           o.email_hash = ? OR 
           (o.email_hash IS NULL AND o.email = ?) OR
           (o.user_id IS NOT NULL AND u.email_hash = ?)
       )
       LIMIT 1`,
      [orderNumber, emailHash, email, emailHash]
    )) as any[];

    if (orders.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy đơn hàng phù hợp' },
        { status: 404 }
      );
    }

    const order = orders[0];

    // Query order items
    const items = (await executeQuery(
      `SELECT 
        oi.*,
        (SELECT url FROM product_images WHERE product_id = oi.product_id AND is_main = 1 LIMIT 1) as image_url
       FROM order_items oi
       WHERE oi.order_id = ?`,
      [order.id]
    )) as any[];

    const orderDetails = {
      ...order,
      items: items,
    };

    return NextResponse.json({
      success: true,
      order: orderDetails,
    });
  } catch (error) {
    console.error('Order lookup GET error:', error);
    return NextResponse.json({ success: false, message: 'Lỗi server nội bộ' }, { status: 500 });
  }
}
