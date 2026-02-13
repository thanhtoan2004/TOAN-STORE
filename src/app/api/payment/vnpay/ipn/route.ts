import { NextResponse } from 'next/server';
import { verifyReturnUrl } from '@/lib/payment/vnpay';
import { executeQuery } from '@/lib/db/mysql';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());

    try {
        const verify = verifyReturnUrl(query);

        if (!verify) {
            return NextResponse.json({ RspCode: '97', Message: 'Checksum failed' });
        }

        const orderId = verify.orderId;

        // Idempotency check: Skip if transaction already processed
        const existingTx = await executeQuery(
            "SELECT status FROM transactions WHERE order_id = ? AND payment_provider = 'vnpay' LIMIT 1",
            [orderId]
        ) as any[];

        if (existingTx.length > 0 && (existingTx[0].status === 'success' || existingTx[0].status === 'failed')) {
            return NextResponse.json({ RspCode: '02', Message: 'Transaction already processed' });
        }

        // Check Order exists
        const orders = await executeQuery(
            'SELECT id, order_number, total_price, status FROM orders WHERE id = ?',
            [orderId]
        ) as any[];

        if (!orders || orders.length === 0) {
            return NextResponse.json({ RspCode: '01', Message: 'Order not found' });
        }

        const order = orders[0];

        if (verify.isSuccess) {
            // Update transaction record
            await executeQuery(
                "UPDATE transactions SET status = 'success', response_data = ? WHERE order_id = ? AND payment_provider = 'vnpay'",
                [JSON.stringify(query), orderId]
            );

            // Use State Machine to update order status
            if (order.status === 'pending_payment' || order.status === 'pending') {
                const { updateOrderStatus } = await import('@/lib/db/repositories/order');
                await updateOrderStatus(order.order_number, 'payment_received');
            }
        } else {
            await executeQuery(
                "UPDATE transactions SET status = 'failed', response_data = ? WHERE order_id = ? AND payment_provider = 'vnpay'",
                [JSON.stringify(query), orderId]
            );
        }

        return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' });

    } catch (error) {
        console.error('VNPay IPN Error:', error);
        return NextResponse.json({ RspCode: '99', Message: 'Unknown error' });
    }
}
