import { verifyAuth } from '@/lib/auth/auth';
import { db } from '@/lib/db/drizzle';
import { orders as ordersTable, transactions as transactionsTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { ResponseWrapper } from '@/lib/api/api-response';
import { buildPaymentUrl } from '@/lib/payment/vnpay';
import { withRateLimit } from '@/lib/api/with-rate-limit';

/**
 * API Khởi tạo liên kết thanh toán VNPAY.
 */
async function createVNPayUrlHandler(request: Request) {
  try {
    const auth = await verifyAuth();
    if (!auth) return ResponseWrapper.unauthorized();

    const body = await request.json();
    const { orderId, amount } = body;

    if (!orderId || !amount) {
      return ResponseWrapper.error('Missing required parameters', 400);
    }

    // 1. Verify Order Ownership and AMOUNT Match
    const [order] = await db
      .select({ id: ordersTable.id, total: ordersTable.total })
      .from(ordersTable)
      .where(and(eq(ordersTable.id, Number(orderId)), eq(ordersTable.userId, auth.userId)))
      .limit(1);

    if (!order) {
      return ResponseWrapper.error('Order not found', 404);
    }

    // SECURITY CHECK: Ensure client amount matches server order total
    if (Math.round(parseFloat(amount)) !== Math.round(parseFloat(order.total))) {
      return ResponseWrapper.error('Payment amount mismatch', 400);
    }

    // 2. Create transaction record
    await db.insert(transactionsTable).values({
      orderId: Number(orderId),
      userId: auth.userId,
      paymentProvider: 'vnpay',
      amount: String(amount),
      status: 'pending',
    });

    const ipAddr = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const paymentUrl = buildPaymentUrl(
      orderId,
      amount,
      `Thanh TOAN Store don hang #${orderId}`,
      ipAddr
    );

    return ResponseWrapper.success({ paymentUrl });
  } catch (error: any) {
    console.error('VNPay Create URL Error:', error);
    return ResponseWrapper.serverError('Lỗi khởi tạo thanh toán', error);
  }
}

export const POST = withRateLimit(createVNPayUrlHandler as any, {
  tag: 'payment',
  limit: 10,
  windowMs: 60 * 60 * 1000, // 10 payment attempts per hour
});
