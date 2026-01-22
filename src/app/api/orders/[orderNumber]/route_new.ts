import { NextRequest, NextResponse } from 'next/server';
import { getOrderByNumber, updateOrderStatus, cancelOrder } from '@/lib/db/mysql';

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

    // Lấy order từ database
    const order = await getOrderByNumber(orderNumber);

    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy đơn hàng' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Lỗi khi lấy đơn hàng:', error);
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

    if (!status) {
      return NextResponse.json(
        { success: false, message: 'Thiếu trạng thái mới' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Trạng thái không hợp lệ' },
        { status: 400 }
      );
    }

    // Cập nhật status trong database
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

    // Hủy order trong database (chỉ được hủy khi status = pending)
    await cancelOrder(orderNumber);

    return NextResponse.json({
      success: true,
      message: 'Đã hủy đơn hàng thành công'
    });
  } catch (error: any) {
    console.error('Lỗi khi hủy đơn hàng:', error);
    
    if (error.message === 'Order not found') {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy đơn hàng' },
        { status: 404 }
      );
    }

    if (error.message === 'Can only cancel pending orders') {
      return NextResponse.json(
        { success: false, message: 'Chỉ có thể hủy đơn hàng đang chờ xác nhận' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Lỗi server nội bộ' },
      { status: 500 }
    );
  }
}
