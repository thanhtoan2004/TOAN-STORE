import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/auth';
import { executeQuery } from '@/lib/db/mysql';
import { createMomoPayment } from '@/lib/payment/momo';
import { withRateLimit } from '@/lib/api/with-rate-limit';

async function createMomoHandler(request: Request) {
  try {
    const auth = await verifyAuth();
    if (!auth) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, amount } = body;

    if (!orderId || !amount) {
      return NextResponse.json({ message: 'Missing required parameters' }, { status: 400 });
    }

    const [orders]: any = await executeQuery(
      'SELECT id, total FROM orders WHERE id = ? AND user_id = ?',
      [orderId, auth.userId]
    );

    if (orders.length === 0) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // Create transaction record
    await executeQuery(
      'INSERT INTO transactions (order_id, user_id, payment_provider, amount, status) VALUES (?, ?, ?, ?, ?)',
      [orderId, auth.userId, 'momo', amount, 'pending']
    );

    const orderInfo = `Thanh TOAN Store don hang #${orderId} qua MoMo`;
    const result = await createMomoPayment(orderId, amount, orderInfo);

    if (result && result.payUrl) {
      return NextResponse.json({ payUrl: result.payUrl });
    } else {
      return NextResponse.json(
        { message: 'Failed to create Momo payment', details: result },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Momo Create Payment Error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export const POST = withRateLimit(createMomoHandler as any, {
  tag: 'payment',
  limit: 10,
  windowMs: 60 * 60 * 1000, // 10 payment attempts per hour
});
