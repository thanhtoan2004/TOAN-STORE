import { NextRequest, NextResponse } from 'next/server';
import { getOrderByNumber, updateOrderStatus } from '@/lib/db/mysql';

// GET - Lấy chi tiết đơn hàng theo orderNumber
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;

    if (!orderNumber) {
      return NextResponse.json(
        { success: false, message: 'Mã đơn hàng không hợp lệ' },
        { status: 400 }
      );
    }

    // Get order from database
    const order = await getOrderByNumber(orderNumber) as any;

    if (!order || order.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy đơn hàng' },
        { status: 404 }
      );
    }

    // Get order items with product details
    const { pool } = await import('@/lib/db/mysql');
    const [items] = await pool.execute(
      `SELECT 
        oi.id,
        oi.product_name as name,
        oi.unit_price,
        oi.quantity,
        oi.total_price,
        oi.size,
        (SELECT url FROM product_images WHERE product_id = oi.product_id AND is_main = 1 LIMIT 1) as image_url
      FROM order_items oi
      WHERE oi.order_id = ?`,
      [order[0].id]
    ) as any[];

    // Enrich items with proper fields
    const enrichedItems = items.map((item: any) => ({
      ...item,
      color: item.color || 'N/A',
      image: item.image_url || '/placeholder-product.png'
    }));

    return NextResponse.json({
      success: true,
      order: {
        ...order[0],
        items: enrichedItems
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết đơn hàng:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server nội bộ' },
      { status: 500 }
    );
  }
}

// PUT - Cập nhật trạng thái đơn hàng
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    const body = await request.json();
    const { status } = body;

    if (!orderNumber) {
      return NextResponse.json(
        { success: false, message: 'Mã đơn hàng không hợp lệ' },
        { status: 400 }
      );
    }

    // Validate trạng thái hợp lệ
    const validStatuses = ['pending', 'pending_payment_confirmation', 'payment_received', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Trạng thái không hợp lệ' },
        { status: 400 }
      );
    }

    // Update order status in database
    await updateOrderStatus(orderNumber, status);

    return NextResponse.json({
      success: true,
      message: 'Đã cập nhật trạng thái đơn hàng'
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật đơn hàng:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server nội bộ' },
      { status: 500 }
    );
  }
}

// DELETE - Hủy đơn hàng
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;

    if (!orderNumber) {
      return NextResponse.json(
        { success: false, message: 'Mã đơn hàng không hợp lệ' },
        { status: 400 }
      );
    }

    // Get order to check status
    const order = await getOrderByNumber(orderNumber) as any;

    if (!order || order.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy đơn hàng' },
        { status: 404 }
      );
    }

    // Only allow cancelling pending orders
    if (order[0].status !== 'pending') {
      return NextResponse.json(
        { success: false, message: 'Không thể hủy đơn hàng đã được xác nhận' },
        { status: 400 }
      );
    }

    // Cancel order in database
    await updateOrderStatus(orderNumber, 'cancelled');

    return NextResponse.json({
      success: true,
      message: 'Đã hủy đơn hàng thành công'
    });
  } catch (error) {
    console.error('Lỗi khi hủy đơn hàng:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi server nội bộ' },
      { status: 500 }
    );
  }
}