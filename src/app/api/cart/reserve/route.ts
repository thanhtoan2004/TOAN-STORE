import { NextRequest, NextResponse } from 'next/server';
import { reserveStock } from '@/lib/inventory/reservation';
import { verifyAuth } from '@/lib/auth/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { sessionId, items } = body;

    if (!sessionId || !items || !Array.isArray(items)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Session ID và danh sách sản phẩm là bắt buộc',
        },
        { status: 400 }
      );
    }

    // Validate items format
    for (const item of items) {
      if (!item.productVariantId || !item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          {
            success: false,
            message: 'Thông tin sản phẩm không hợp lệ',
          },
          { status: 400 }
        );
      }
    }

    const result = await reserveStock(sessionId, items);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Đã đặt chỗ sản phẩm thành công',
      expiresIn: 15 * 60, // 15 minutes in seconds
    });
  } catch (error) {
    console.error('Reserve stock API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Lỗi server khi đặt chỗ sản phẩm',
      },
      { status: 500 }
    );
  }
}
