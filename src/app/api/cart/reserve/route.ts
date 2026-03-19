import { NextRequest, NextResponse } from 'next/server';
import { reserveStock } from '@/lib/inventory/reservation';
import { verifyAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Đặt chỗ sản phẩm (Inventory Reservation).
 * Mục đích:
 * - Tạm giữ hàng trong kho khi người dùng chuyển đến bước Thanh toán (Checkout).
 * - Tránh tình trạng "Overselling" (Bán quá số lượng thực tế).
 * - Thời gian đặt chỗ mặc định là 15 phút.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized();
    }
    const body = await request.json();
    const { sessionId, items } = body;

    if (!sessionId || !items || !Array.isArray(items)) {
      return ResponseWrapper.error('Session ID và danh sách sản phẩm là bắt buộc', 400);
    }

    // Validate items format
    for (const item of items) {
      if (!item.productVariantId || !item.quantity || item.quantity <= 0) {
        return ResponseWrapper.error('Thông tin sản phẩm không hợp lệ', 400);
      }
    }

    const result = await reserveStock(sessionId, items);

    if (!result.success) {
      return ResponseWrapper.error(result.message || 'Không thể đặt chỗ sản phẩm', 400, result);
    }

    const responseData = {
      expiresIn: 15 * 60, // 15 minutes in seconds
    };

    return ResponseWrapper.success(responseData, 'Đã đặt chỗ sản phẩm thành công');
  } catch (error) {
    console.error('Reserve stock API error:', error);
    return ResponseWrapper.serverError('Lỗi server khi đặt chỗ sản phẩm', error);
  }
}
