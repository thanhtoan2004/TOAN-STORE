import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/auth';
import { db } from '@/lib/db/drizzle';
import { orders as ordersTable, transactions as transactionsTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createMomoPayment } from '@/lib/payment/momo';
import { withRateLimit } from '@/lib/api/with-rate-limit';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Khởi tạo thanh toán qua ví điện tử MoMo.
 * Bao gồm: Xác thực quyền sở hữu đơn hàng, tạo bản ghi giao dịch và lấy URL thanh toán từ MoMo.
 * Áp dụng Rate Limit để ngăn chặn spam yêu cầu thanh toán.
 */
async function createMomoHandler(request: NextRequest) {
  try {
    const auth = await verifyAuth();
    if (!auth) {
      return ResponseWrapper.unauthorized();
    }

    const body = await request.json();
    const { orderId, amount } = body;

    if (!orderId || !amount) {
      return ResponseWrapper.error('Missing required parameters', 400);
    }

    // Verify Order Ownership using Drizzle ORM
    const [order] = await db
      .select({ id: ordersTable.id, total: ordersTable.total })
      .from(ordersTable)
      .where(and(eq(ordersTable.id, Number(orderId)), eq(ordersTable.userId, auth.userId)))
      .limit(1);

    if (!order) {
      return ResponseWrapper.notFound('Order not found');
    }

    // Create transaction record
    await db.insert(transactionsTable).values({
      orderId: Number(orderId),
      userId: auth.userId,
      paymentProvider: 'momo',
      amount: String(amount),
      status: 'pending',
    });

    const orderInfo = `Thanh TOAN Store don hang #${orderId} qua MoMo`;
    const result = await createMomoPayment(orderId, amount, orderInfo);

    if (result && result.payUrl) {
      return ResponseWrapper.success({ payUrl: result.payUrl });
    } else {
      return ResponseWrapper.serverError('Failed to create Momo payment', result);
    }
  } catch (error: any) {
    console.error('Momo Create Payment Error:', error);
    return ResponseWrapper.serverError('Internal Server Error', error);
  }
}

export const POST = withRateLimit(createMomoHandler as any, {
  tag: 'payment',
  limit: 10,
  windowMs: 60 * 60 * 1000, // 10 payment attempts per hour
});
