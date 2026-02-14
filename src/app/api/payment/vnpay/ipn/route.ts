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

        const { pool } = await import('@/lib/db/mysql');
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Idempotency check with FOR UPDATE to lock the transaction record
            const [existingTx]: any = await connection.execute(
                "SELECT status FROM transactions WHERE order_id = ? AND payment_provider = 'vnpay' FOR UPDATE",
                [orderId]
            );

            if (existingTx.length > 0 && (existingTx[0].status === 'success' || existingTx[0].status === 'failed')) {
                await connection.rollback();
                return NextResponse.json({ RspCode: '02', Message: 'Transaction already processed' });
            }

            // 2. Check Order exists
            const [orders]: any = await connection.execute(
                'SELECT id, order_number, status FROM orders WHERE id = ? FOR UPDATE',
                [orderId]
            );

            if (!orders || orders.length === 0) {
                await connection.rollback();
                return NextResponse.json({ RspCode: '01', Message: 'Order not found' });
            }

            const order = orders[0];

            if (verify.isSuccess) {
                // Update transaction record
                await connection.execute(
                    "UPDATE transactions SET status = 'success', response_data = ? WHERE order_id = ? AND payment_provider = 'vnpay'",
                    [JSON.stringify(query), orderId]
                );

                // Use State Machine to update order status
                if (order.status === 'pending_payment' || order.status === 'pending') {
                    const { updateOrderStatus } = await import('@/lib/db/repositories/order');
                    // updateOrderStatus handles its own transaction, but since we are already in one, 
                    // it might be better to have an internal version or just rely on its nested transaction support if possible.
                    // For now, call it directly as it's safe to nest starts in mysql2 pool.
                    await updateOrderStatus(order.order_number, 'payment_received');
                }
            } else {
                await connection.execute(
                    "UPDATE transactions SET status = 'failed', response_data = ? WHERE order_id = ? AND payment_provider = 'vnpay'",
                    [JSON.stringify(query), orderId]
                );
            }

            await connection.commit();
            return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' });

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('VNPay IPN Error:', error);
        return NextResponse.json({ RspCode: '99', Message: 'Unknown error' });
    }
}
