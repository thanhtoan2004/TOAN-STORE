import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { verifyAuth } from '@/lib/auth/auth';
import { encrypt } from '@/lib/security/encryption';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * PUT - Cập nhật địa chỉ giao hàng cho một đơn hàng cụ thể.
 * Chế độ bảo mật:
 * 1. Yêu cầu đăng nhập.
 * 2. Chỉ chủ sở hữu mới có quyền sửa đổi.
 * 3. Chỉ được thay đổi nếu đơn hàng chưa được giao (Trạng thái: pending, pending_payment, paid).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized();
    }

    const resolvedParams = await params;
    const { orderNumber } = resolvedParams;
    const body = await request.json();
    const { name, phone, address, city, district, ward } = body;

    if (!name || !phone || !address || !city || !district || !ward) {
      return ResponseWrapper.error('Thiếu thông tin địa chỉ giao hàng cần thiết', 400);
    }

    // Prepare address snapshot object
    const newAddressSnapshot = JSON.stringify({
      name,
      phone,
      address,
      city,
      district,
      ward,
    });

    // 1. Fetch order to verify ownership and status
    const orders = await executeQuery<any[]>(
      `SELECT id, user_id, status FROM orders WHERE order_number = ? LIMIT 1`,
      [orderNumber]
    );

    if (!orders || orders.length === 0) {
      return ResponseWrapper.notFound('Không tìm thấy đơn hàng');
    }

    const order = orders[0];

    // 2. Security checks
    if (order.user_id !== Number(session.userId)) {
      return ResponseWrapper.forbidden();
    }

    // Only allow updating if not shipped yet
    const allowedStatuses = ['pending', 'pending_payment', 'paid'];
    if (!allowedStatuses.includes(order.status)) {
      return ResponseWrapper.error(
        'Không thể cập nhật địa chỉ. Đơn hàng đã được xử lý hoặc đang giao.',
        400
      );
    }

    // 3. Encrypt the PII fields (phone) just like createOrder
    const phoneEncrypted = encrypt(phone);

    // 4. Update the order
    await executeQuery(
      `UPDATE orders 
       SET 
          shipping_address_snapshot = ?, 
          phone_encrypted = ? 
       WHERE id = ?`,
      [newAddressSnapshot, phoneEncrypted, order.id]
    );

    return ResponseWrapper.success(null, 'Cập nhật địa chỉ giao hàng thành công');
  } catch (error) {
    console.error('Lỗi khi cập nhật địa chỉ đơn hàng:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}
