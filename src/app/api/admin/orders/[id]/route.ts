import { NextRequest, NextResponse } from 'next/server';
import { executeQuery, cancelOrder, getOrderById } from '@/lib/db/mysql';
import { checkAdminAuth } from '@/lib/auth';
import { sendDeliveryConfirmationEmail, sendOrderCancelledEmail, sendShippingNotificationEmail } from '@/lib/email-templates';
import { getShipmentsByOrderId } from '@/lib/db/repositories/shipment';
import { decrypt } from '@/lib/encryption';
import { createAuditLog } from '@/lib/db/repositories/audit';
import { createNotification } from '@/lib/notifications';

// GET - Lấy chi tiết đơn hàng (Admin)
/**
 * API Lấy chi tiết một đơn hàng kèm theo lịch sử lô hàng (Shipments).
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await checkAdminAuth();
        if (!admin) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const orderId = parseInt(id);

        if (isNaN(orderId)) {
            return NextResponse.json({ success: false, message: 'Invalid Order ID' }, { status: 400 });
        }

        const order = await getOrderById(orderId);

        if (!order) {
            return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        }

        // Lấy danh sách lô hàng (shipments)
        const shipments = await getShipmentsByOrderId(orderId);

        return NextResponse.json({
            success: true,
            data: {
                ...order,
                shipments
            }
        });
    } catch (error) {
        console.error('Error fetching order detail:', error);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

// PATCH - Cập nhật trạng thái đơn hàng (Admin)
/**
 * API Cập nhật trạng thái đơn hàng (Order State Machine).
 * Luồng xử lý:
 * 1. Kiểm tra tính hợp lệ của bước chuyển trạng thái (Ví dụ: Không thể quay lại từ Delivered về Processing).
 * 2. Cập nhật DB & Ghi log Audit.
 * 3. Tự động gửi Email thông báo (Giao hàng, Hoàn tất, Hủy đơn) cho khách hàng.
 * 4. Nếu Hủy đơn: Tự động hoàn trả (Restock) số lượng sản phẩm về kho.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await checkAdminAuth();
        if (!admin) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'Order ID is required' },
                { status: 400 }
            );
        }

        // Validate status
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!status || !validStatuses.includes(status)) {
            return NextResponse.json(
                { success: false, message: 'Invalid status' },
                { status: 400 }
            );
        }

        // Get current order status and User info for Email
        const orders = await executeQuery(
            `SELECT o.status, o.order_number, o.user_id, o.email as order_email, o.phone as order_phone, 
                    u.email as user_email, u.full_name as user_name, ua.recipient_name, o.tracking_number, o.carrier 
             FROM orders o
             LEFT JOIN users u ON o.user_id = u.id
             LEFT JOIN user_addresses ua ON o.shipping_address_id = ua.id
             WHERE o.id = ?`,
            [parseInt(id)]
        ) as any[];

        if (orders.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Order not found' },
                { status: 404 }
            );
        }

        const order = orders[0];

        // Decrypt email for notifications. Prefer encrypted order_email, fallback to user_email
        const rawEmail = order.order_email || order.user_email;
        const targetEmail = rawEmail ? decrypt(rawEmail) : null;
        const targetName = order.user_name || order.recipient_name || 'Khách hàng';

        const currentStatus = order.status;

        // Validate state transitions
        if (currentStatus === 'cancelled') {
            return NextResponse.json(
                { success: false, message: 'Đơn hàng đã hủy không thể thay đổi trạng thái' },
                { status: 400 }
            );
        }

        if (currentStatus === 'delivered') {
            return NextResponse.json(
                { success: false, message: 'Đơn hàng đã giao không thể thay đổi trạng thái' },
                { status: 400 }
            );
        }

        const statusOrder: { [key: string]: number } = {
            'pending': 1,
            'processing': 2,
            'shipped': 3,
            'delivered': 4,
            'cancelled': 0
        };
        if (status !== 'cancelled' && statusOrder[status] < statusOrder[currentStatus]) {
            return NextResponse.json(
                { success: false, message: 'Không thể quay về trạng thái trước đó' },
                { status: 400 }
            );
        }

        // Update order status
        if (status === 'cancelled') {
            await cancelOrder(order.order_number, true); // true = force (admin)

            if (targetEmail) {
                sendOrderCancelledEmail(targetEmail, targetName, order.order_number).catch(console.error);
            }

            // Notification Bell
            if (order.user_id) {
                await createNotification(
                    order.user_id,
                    'order',
                    'Đơn hàng đã hủy',
                    `Đơn hàng #${order.order_number} của bạn đã bị hủy.`,
                    `/orders/${order.order_number}`
                );
            }

        } else {
            // FIX C2: Use updateOrderStatus to go through State Machine, stock, loyalty, gift card logic
            const { updateOrderStatus } = await import('@/lib/db/repositories/order');
            await updateOrderStatus(order.order_number, status);

            // Update timestamps separately (updateOrderStatus doesn't handle these)
            let timestampUpdate = '';
            if (status === 'processing' || status === 'confirmed') {
                timestampUpdate = 'payment_confirmed_at = COALESCE(payment_confirmed_at, NOW())';
            } else if (status === 'shipped') {
                timestampUpdate = 'shipped_at = COALESCE(shipped_at, NOW())';
            } else if (status === 'delivered') {
                timestampUpdate = 'delivered_at = COALESCE(delivered_at, NOW())';
            }

            if (timestampUpdate) {
                await executeQuery(
                    `UPDATE orders SET ${timestampUpdate} WHERE id = ?`,
                    [parseInt(id)]
                );
            }

        }

        // Notification Bell for other status changes
        if (order.user_id && status !== 'cancelled') {
            let title = '';
            let message = '';

            switch (status) {
                case 'processing':
                case 'confirmed':
                    title = 'Đơn hàng đã xác nhận';
                    message = `Đơn hàng #${order.order_number} của bạn đã được xác nhận và đang xử lý.`;
                    break;
                case 'shipped':
                    title = 'Đơn hàng đang giao';
                    message = `Đơn hàng #${order.order_number} đang trên đường đến với bạn.`;
                    break;
                case 'delivered':
                    title = 'Giao hàng thành công';
                    message = `Đơn hàng #${order.order_number} đã được giao thành công. Cảm ơn bạn!`;
                    break;
            }

            if (title) {
                await createNotification(
                    order.user_id,
                    'order',
                    title,
                    message,
                    `/orders/${order.order_number}`
                );
            }
        }

        // Log Admin Action
        await createAuditLog({
            adminId: admin.userId,
            action: 'UPDATE_ORDER_STATUS',
            targetType: 'order',
            targetId: id,
            details: { oldStatus: currentStatus, newStatus: status, orderNumber: order.order_number },
            ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
        });

        // FIX C3: Gift Card deduction is now handled by updateOrderStatus (when status = 'delivered')
        // Removed duplicate gift card logic that was here previously

        return NextResponse.json({
            success: true,
            message: status === 'cancelled' ? 'Order cancelled and stock restored' : 'Order status updated successfully'
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
