import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db/mysql';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { JWTPayload } from '@/types/auth';

// Middleware kiểm tra admin
async function checkAdminAuth() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) return null;

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'fallback_secret'
        ) as JWTPayload;

        const users = await executeQuery(
            'SELECT is_admin FROM users WHERE id = ?',
            [decoded.userId]
        ) as any[];

        if (users.length === 0 || users[0].is_admin !== 1) return null;

        return { isAdmin: true, userId: decoded.userId };
    } catch {
        return null;
    }
}

// PATCH - Cập nhật trạng thái đơn hàng (Admin)
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

        // Get current order status
        const orders = await executeQuery(
            'SELECT status FROM orders WHERE id = ?',
            [parseInt(id)]
        ) as any[];

        if (orders.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Order not found' },
                { status: 404 }
            );
        }

        const currentStatus = orders[0].status;

        // Validate state transitions
        // Cancelled orders cannot be changed
        if (currentStatus === 'cancelled') {
            return NextResponse.json(
                { success: false, message: 'Đơn hàng đã hủy không thể thay đổi trạng thái' },
                { status: 400 }
            );
        }

        // Delivered orders cannot be changed
        if (currentStatus === 'delivered') {
            return NextResponse.json(
                { success: false, message: 'Đơn hàng đã giao không thể thay đổi trạng thái' },
                { status: 400 }
            );
        }

        // Prevent going backwards (except to cancelled)
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
        await executeQuery(
            'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
            [status, parseInt(id)]
        );

        // Deduct gift card balance when order is delivered
        if (status === 'delivered') {
            const orderDetailsResult = await executeQuery(
                'SELECT giftcard_number, giftcard_discount FROM orders WHERE id = ?',
                [parseInt(id)]
            ) as any[];

            if (orderDetailsResult && orderDetailsResult.length > 0) {
                const orderDetails = orderDetailsResult[0];

                if (orderDetails.giftcard_number && orderDetails.giftcard_discount > 0) {
                    await executeQuery(
                        `UPDATE gift_cards 
               SET current_balance = current_balance - ?
               WHERE card_number = ?`,
                        [orderDetails.giftcard_discount, orderDetails.giftcard_number]
                    );

                    // Verify the update
                    const verifyResult = await executeQuery(
                        'SELECT current_balance FROM gift_cards WHERE card_number = ?',
                        [orderDetails.giftcard_number]
                    ) as any[];
                    const newBalance = parseFloat(verifyResult[0]?.current_balance || '0');

                    // Update status to 'used' if balance is 0 or less
                    if (newBalance <= 0) {
                        await executeQuery(
                            `UPDATE gift_cards SET status = 'used' WHERE card_number = ?`,
                            [orderDetails.giftcard_number]
                        );
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Order status updated successfully'
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
