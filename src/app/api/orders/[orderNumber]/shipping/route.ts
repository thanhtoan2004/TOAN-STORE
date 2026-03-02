import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import { verifyAuth } from '@/lib/auth';
import { encrypt } from '@/lib/encryption';

/**
 * PUT - Update Shipping Address for a specific order
 * Restrictions:
 * 1. User must be authenticated
 * 2. User must own the order
 * 3. Order status must be 'pending', 'pending_payment', or 'paid' (not shipped yet)
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { orderNumber: string } }
) {
    try {
        const session = await verifyAuth();
        if (!session) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }

        const { orderNumber } = params;
        const body = await request.json();
        const { name, phone, address, city, district, ward } = body;

        if (!name || !phone || !address || !city || !district || !ward) {
            return NextResponse.json(
                { success: false, message: 'Thiếu thông tin địa chỉ giao hàng cần thiết' },
                { status: 400 }
            );
        }

        // Prepare address snapshot object
        const newAddressSnapshot = JSON.stringify({
            name,
            phone,
            address,
            city,
            district,
            ward
        });

        // 1. Fetch order to verify ownership and status
        const orders = await executeQuery<any[]>(
            `SELECT id, user_id, status FROM orders WHERE order_number = ? LIMIT 1`,
            [orderNumber]
        );

        if (!orders || orders.length === 0) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy đơn hàng' }, { status: 404 });
        }

        const order = orders[0];

        // 2. Security checks
        if (order.user_id !== Number(session.userId)) {
            return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
        }

        // Only allow updating if not shipped yet
        const allowedStatuses = ['pending', 'pending_payment', 'paid'];
        if (!allowedStatuses.includes(order.status)) {
            return NextResponse.json(
                { success: false, message: 'Không thể cập nhật địa chỉ. Đơn hàng đã được xử lý hoặc đang giao.' },
                { status: 400 }
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

        return NextResponse.json({
            success: true,
            message: 'Cập nhật địa chỉ giao hàng thành công',
        });

    } catch (error) {
        console.error('Lỗi khi cập nhật địa chỉ đơn hàng:', error);
        return NextResponse.json(
            { success: false, message: 'Lỗi server nội bộ' },
            { status: 500 }
        );
    }
}
