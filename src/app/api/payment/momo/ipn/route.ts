import { NextResponse } from 'next/server';
import { verifyMomoSignature } from '@/lib/payment/momo';
import { executeQuery } from '@/lib/db/mysql';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Verify Signature
        const isValid = verifyMomoSignature(body);
        if (!isValid) {
            console.error('Momo IPN Signature Verification Failed');
            return NextResponse.json({ message: 'Invalid signature' }, { status: 400 });
        }

        const { orderId, resultCode } = body;

        // Idempotency check: Skip if transaction already processed
        const existingTx = await executeQuery(
            "SELECT status FROM transactions WHERE order_id = ? AND payment_provider = 'momo' LIMIT 1",
            [orderId]
        ) as any[];

        if (existingTx.length > 0 && (existingTx[0].status === 'success' || existingTx[0].status === 'failed')) {
            return NextResponse.json({ message: 'Transaction already processed' }, { status: 200 });
        }

        // Check Order
        const orders = await executeQuery(
            'SELECT id, order_number, status FROM orders WHERE id = ?',
            [orderId]
        ) as any[];

        if (!orders || orders.length === 0) {
            return NextResponse.json({ message: 'Order not found' }, { status: 404 });
        }
        const order = orders[0];

        if (resultCode === 0) {
            // Success
            await executeQuery(
                "UPDATE transactions SET status = 'success', response_data = ? WHERE order_id = ? AND payment_provider = 'momo'",
                [JSON.stringify(body), orderId]
            );

            // Use State Machine to update order status
            if (order.status === 'pending_payment' || order.status === 'pending') {
                const { updateOrderStatus } = await import('@/lib/db/repositories/order');
                await updateOrderStatus(order.order_number, 'payment_received');
            }
        } else {
            // Failed
            await executeQuery(
                "UPDATE transactions SET status = 'failed', response_data = ? WHERE order_id = ? AND payment_provider = 'momo'",
                [JSON.stringify(body), orderId]
            );
        }

        return NextResponse.json({ message: 'IPN received' }, { status: 200 });

    } catch (error: any) {
        console.error('Momo IPN Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
