import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { executeQuery } from '@/lib/db/mysql';
import { buildPaymentUrl } from '@/lib/payment/vnpay';
import { withRateLimit } from '@/lib/with-rate-limit';

/**
 * API Khởi tạo liên kết thanh toán VNPAY.
 * Bảo mật:
 * 1. Xác thực người sở hữu đơn hàng (Ownership check).
 * 2. Rate Limiting: Giới hạn tối đa 10 lần tạo link/giờ để tránh tấn công từ chối dịch vụ (DDoS) vào cổng thanh toán.
 * 3. Transactions Trace: Lưu lại vết giao dịch ở trạng thái `pending`.
 */
async function createVNPayUrlHandler(request: Request) {
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
      [orderId, auth.userId, 'vnpay', amount, 'pending']
    );

    const ipAddr = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const paymentUrl = buildPaymentUrl(
      orderId,
      amount,
      `Thanh TOAN Store don hang #${orderId}`,
      ipAddr
    );

    return NextResponse.json({ paymentUrl });
  } catch (error: any) {
    console.error('VNPay Create URL Error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export const POST = withRateLimit(createVNPayUrlHandler as any, {
  tag: 'payment',
  limit: 10,
  windowMs: 60 * 60 * 1000, // 10 payment attempts per hour
});
