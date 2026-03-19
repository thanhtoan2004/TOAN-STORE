import { NextRequest, NextResponse } from 'next/server';
import { releaseStock } from '@/lib/inventory/reservation';
import { verifyAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Giải phóng tài nguyên đặt chỗ (Release Reservation).
 * Tác dụng:
 * - Được gọi khi người dùng HỦY thanh toán hoặc quay lại giỏ hàng.
 * - Giải phóng số lượng sản phẩm được tạm giữ để người khác có thể mua.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized();
    }
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return ResponseWrapper.error('Session ID là bắt buộc', 400);
    }

    const result = await releaseStock(sessionId);

    if (!result.success) {
      return ResponseWrapper.error(result.message || 'Lỗi khi giải phóng sản phẩm', 400);
    }

    return ResponseWrapper.success(null, 'Đã giải phóng sản phẩm thành công');
  } catch (error) {
    console.error('Release stock API error:', error);
    return ResponseWrapper.serverError('Lỗi server khi giải phóng sản phẩm', error);
  }
}
