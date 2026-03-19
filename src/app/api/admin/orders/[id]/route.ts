import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { orders as ordersTable, users, userAddresses } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';
import { sendOrderCancelledEmail } from '@/lib/mail/email-templates';
import { getShipmentsByOrderId } from '@/lib/db/repositories/shipment';
import { decrypt } from '@/lib/security/encryption';
import { logAdminAction } from '@/lib/db/repositories/audit';
import { createNotification } from '@/lib/notifications/notifications';
import { getOrderById, cancelOrder, updateOrderStatus } from '@/lib/db/repositories/order';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * GET - Lấy chi tiết đơn hàng (Admin).
 * Chức năng:
 * - Truy vấn thông tin đơn hàng bao gồm: Sản phẩm, Khách hàng, Thanh toán.
 * - Tích hợp danh sách các lô hàng (Shipments) liên quan.
 * Bảo mật: Yêu cầu quyền Admin.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return ResponseWrapper.error('ID đơn hàng không hợp lệ', 400);
    }

    const order = await getOrderById(id);

    if (!order) {
      return ResponseWrapper.notFound('Không tìm thấy đơn hàng');
    }

    // Lấy danh sách lô hàng (shipments)
    const shipments = await getShipmentsByOrderId(id);

    const result = {
      ...order,
      shipments,
    };

    return ResponseWrapper.success(result);
  } catch (error) {
    console.error('Error fetching order detail:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}

/**
 * PATCH - Cập nhật trạng thái đơn hàng (Admin).
 * Quy trình:
 * 1. Kiểm tra quyền Admin.
 * 2. Xác thực trạng thái chuyển đổi (State Transition Validation) - Không cho phép quay lại trạng thái cũ hoặc sửa đơn đã hủy/giao.
 * 3. Cập nhật Database.
 * 4. Tự động gửi Email thông báo (nếu là Hủy đơn).
 * 5. Tự động đẩy thông báo Push (Bell Notification) cho User.
 * 6. Lưu Audit Log cho hành động của Admin.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }

    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return ResponseWrapper.error('ID đơn hàng không hợp lệ', 400);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return ResponseWrapper.error(
        'Yêu cầu không hợp lệ: Thiếu dữ liệu hoặc JSON sai định dạng',
        400
      );
    }
    const { status } = body;

    // Validate status
    const validStatuses = [
      'pending',
      'pending_payment_confirmation',
      'payment_received',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
    ];
    if (!status || !validStatuses.includes(status)) {
      return ResponseWrapper.error('Trạng thái không hợp lệ', 400);
    }

    // Get current order status and User info for Email
    const [order] = await db
      .select({
        id: ordersTable.id,
        status: ordersTable.status,
        orderNumber: ordersTable.orderNumber,
        userId: ordersTable.userId,
        orderEmail: ordersTable.email,
        orderPhone: ordersTable.phone,
        userEmail: users.email,
        userName: users.fullName,
        trackingNumber: ordersTable.trackingNumber,
        carrier: ordersTable.carrier,
        shippingAddressSnapshot: ordersTable.shippingAddressSnapshot,
      })
      .from(ordersTable)
      .leftJoin(users, eq(ordersTable.userId, users.id))
      .where(eq(ordersTable.id, id))
      .limit(1);

    if (!order) {
      return ResponseWrapper.notFound('Không tìm thấy đơn hàng');
    }

    // Decrypt email for notifications. Prefer encrypted orderEmail, fallback to userEmail
    const rawEmail = order.orderEmail || order.userEmail;
    const targetEmail = rawEmail ? decrypt(rawEmail) : null;

    // Extract recipient name from snapshot if available
    let recipientName = 'Khách hàng';
    if (order.shippingAddressSnapshot) {
      try {
        const snapshot =
          typeof order.shippingAddressSnapshot === 'string'
            ? JSON.parse(order.shippingAddressSnapshot)
            : order.shippingAddressSnapshot;
        recipientName = snapshot.recipientName || snapshot.fullName || 'Khách hàng';
      } catch (e) {}
    }

    const targetName = order.userName || recipientName;

    const currentStatus = order.status;

    // Validate state transitions
    if (currentStatus === 'cancelled') {
      return ResponseWrapper.error('Đơn hàng đã hủy không thể thay đổi trạng thái', 400);
    }

    if (currentStatus === 'delivered') {
      return ResponseWrapper.error('Đơn hàng đã giao không thể thay đổi trạng thái', 400);
    }

    const statusOrder: { [key: string]: number } = {
      pending: 1,
      pending_payment_confirmation: 2,
      payment_received: 3,
      confirmed: 4,
      processing: 5,
      shipped: 6,
      delivered: 7,
      cancelled: 0,
    };

    if (status !== 'cancelled' && statusOrder[status] < statusOrder[currentStatus as string]) {
      return ResponseWrapper.error('Không thể quay về trạng thái trước đó', 400);
    }

    // Update order status
    if (status === 'cancelled') {
      await cancelOrder(order.orderNumber, true); // true = force (admin)

      if (targetEmail) {
        sendOrderCancelledEmail(targetEmail, targetName, order.orderNumber).catch(console.error);
      }

      // Notification Bell
      if (order.userId) {
        await createNotification(
          order.userId,
          'order',
          'Đơn hàng đã hủy',
          `Đơn hàng #${order.orderNumber} của bạn đã bị hủy.`,
          `/orders/${order.orderNumber}`
        );
      }
    } else {
      await updateOrderStatus(order.orderNumber, status);
    }

    // Notification Bell for other status changes
    if (order.userId && status !== 'cancelled') {
      let title = '';
      let message = '';

      switch (status) {
        case 'processing':
        case 'confirmed':
          title = 'Đơn hàng đã xác nhận';
          message = `Đơn hàng #${order.orderNumber} của bạn đã được xác nhận và đang xử lý.`;
          break;
        case 'shipped':
          title = 'Đơn hàng đang giao';
          message = `Đơn hàng #${order.orderNumber} đang trên đường đến với bạn.`;
          break;
        case 'delivered':
          title = 'Giao hàng thành công';
          message = `Đơn hàng #${order.orderNumber} đã được giao thành công. Cảm ơn bạn!`;
          break;
      }

      if (title) {
        await createNotification(
          order.userId,
          'order',
          title,
          message,
          `/orders/${order.orderNumber}`
        );
      }
    }

    // Log Admin Action
    await logAdminAction(
      admin.userId,
      'UPDATE_ORDER_STATUS',
      'order',
      id,
      { oldStatus: currentStatus },
      { status: status, orderNumber: order.orderNumber },
      request
    );

    return ResponseWrapper.success(
      null,
      status === 'cancelled'
        ? 'Order cancelled and stock restored'
        : 'Order status updated successfully'
    );
  } catch (error) {
    console.error('Error updating order status:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}
