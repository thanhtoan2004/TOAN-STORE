import { NextResponse } from 'next/server';
import { verifyReturnUrl } from '@/lib/payment/vnpay';
import { db } from '@/lib/db/drizzle';
import { orders as ordersTable, transactions as transactionsTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { updateOrderStatus } from '@/lib/db/repositories/order';

/**
 * API Xử lý thông báo thanh toán tức thời (Instant Payment Notification - IPN).
 * Đây là đầu cuối Server-to-Server từ VNPAY.
 * Luồng bảo mật tối đa:
 * 1. Verify Checksum: Chống giả mạo dữ liệu.
 * 2. Database Transaction: Đảm bảo tính nhất quán (Atomicity).
 * 3. Idempotency Check (FOR UPDATE): Chống việc xử lý trùng lặp giao dịch (Double spending).
 * 4. State Machine: Cập nhật trạng thái đơn hàng và kích hoạt log hậu cần.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = Object.fromEntries(searchParams.entries());

  try {
    const verify = verifyReturnUrl(query);

    if (!verify) {
      return NextResponse.json({ RspCode: '97', Message: 'Checksum failed' });
    }

    const orderId = Number(verify.orderId);

    return await db.transaction(async (tx) => {
      // 1. Idempotency check with FOR UPDATE to lock the transaction record
      const [existingTx] = await (
        tx
          .select({ status: transactionsTable.status })
          .from(transactionsTable)
          .where(
            and(
              eq(transactionsTable.orderId, orderId),
              eq(transactionsTable.paymentProvider, 'vnpay')
            )
          ) as any
      ).forUpdate();

      if (existingTx && (existingTx.status === 'success' || existingTx.status === 'failed')) {
        return NextResponse.json({ RspCode: '02', Message: 'Transaction already processed' });
      }

      // 2. Check Order exists
      const [order] = await (
        tx
          .select({
            id: ordersTable.id,
            orderNumber: ordersTable.orderNumber,
            status: ordersTable.status,
          })
          .from(ordersTable)
          .where(eq(ordersTable.id, orderId)) as any
      ).forUpdate();

      if (!order) {
        return NextResponse.json({ RspCode: '01', Message: 'Order not found' });
      }

      if (verify.isSuccess) {
        // Update transaction record
        await tx
          .update(transactionsTable)
          .set({
            status: 'success',
            responseData: query,
          })
          .where(
            and(
              eq(transactionsTable.orderId, orderId),
              eq(transactionsTable.paymentProvider, 'vnpay')
            )
          );

        // Use State Machine to update order status
        if (order.status === 'pending_payment' || order.status === 'pending') {
          // Pass 'tx' to prevent deadlock (nested transaction on same connection)
          await updateOrderStatus(order.orderNumber, 'payment_received', tx);
        }
      } else {
        await tx
          .update(transactionsTable)
          .set({
            status: 'failed',
            responseData: query,
          })
          .where(
            and(
              eq(transactionsTable.orderId, orderId),
              eq(transactionsTable.paymentProvider, 'vnpay')
            )
          );
      }

      return NextResponse.json({ RspCode: '00', Message: 'Confirm Success' });
    });
  } catch (error) {
    console.error('VNPay IPN Error:', error);
    return NextResponse.json({ RspCode: '99', Message: 'Unknown error' });
  }
}
