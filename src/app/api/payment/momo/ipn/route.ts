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

        const { pool } = await import('@/lib/db/mysql');
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Idempotency check with FOR UPDATE
            const [existingTx]: any = await connection.execute(
                "SELECT status FROM transactions WHERE order_id = ? AND payment_provider = 'momo' FOR UPDATE",
                [orderId]
            );

            if (existingTx.length > 0 && (existingTx[0].status === 'success' || existingTx[0].status === 'failed')) {
                await connection.rollback();
                return NextResponse.json({ message: 'Transaction already processed' }, { status: 200 });
            }

            // 2. Check Order
            const [orders]: any = await connection.execute(
                'SELECT id, order_number, status FROM orders WHERE id = ? FOR UPDATE',
                [orderId]
            );

            if (!orders || orders.length === 0) {
                await connection.rollback();
                return NextResponse.json({ message: 'Order not found' }, { status: 404 });
            }
            const order = orders[0];

            if (resultCode === 0) {
                // Success
                await connection.execute(
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
                await connection.execute(
                    "UPDATE transactions SET status = 'failed', response_data = ? WHERE order_id = ? AND payment_provider = 'momo'",
                    [JSON.stringify(body), orderId]
                );
            }

            await connection.commit();
            return NextResponse.json({ message: 'IPN received' }, { status: 200 });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error: any) {
        console.error('Momo IPN Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
