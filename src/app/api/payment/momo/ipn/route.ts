import { NextRequest, NextResponse } from 'next/server';
import { verifyMomoSignature } from '@/lib/payment/momo';
import { db } from '@/lib/db/drizzle';
import { orders as ordersTable, transactions as transactionsTable } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { updateOrderStatus } from '@/lib/db/repositories/order';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Xử lý thông báo kết quả giao dịch từ MoMo (Instant Payment Notification).
 * Chức năng:
 * 1. Xác thực chữ ký (Signature) để đảm bảo dữ liệu đến từ MoMo.
 * 2. Kiểm tra Idempotency (Chống xử lý lặp) sử dụng SELECT FOR UPDATE.
 * 3. Cập nhật trạng thái Giao dịch và Đơn hàng đồng bộ trong Database Transaction.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify Signature
    const isValid = verifyMomoSignature(body);
    if (!isValid) {
      console.error('Momo IPN Signature Verification Failed');
      return ResponseWrapper.error('Invalid signature', 400);
    }

    const { orderId, resultCode } = body;
    const numericOrderId = Number(orderId);

    return await db.transaction(async (tx) => {
      // 1. Idempotency check with FOR UPDATE
      const [existingTx] = await (
        tx
          .select({ status: transactionsTable.status })
          .from(transactionsTable)
          .where(
            and(
              eq(transactionsTable.orderId, numericOrderId),
              eq(transactionsTable.paymentProvider, 'momo')
            )
          ) as any
      ).forUpdate();

      if (existingTx && (existingTx.status === 'success' || existingTx.status === 'failed')) {
        return ResponseWrapper.success(null, 'Transaction already processed');
      }

      // 2. Check Order
      const [order] = await (
        tx
          .select({
            id: ordersTable.id,
            orderNumber: ordersTable.orderNumber,
            status: ordersTable.status,
          })
          .from(ordersTable)
          .where(eq(ordersTable.id, numericOrderId)) as any
      ).forUpdate();

      if (!order) {
        return ResponseWrapper.notFound('Order not found');
      }

      if (resultCode === 0) {
        // Success
        await tx
          .update(transactionsTable)
          .set({
            status: 'success',
            responseData: body,
          })
          .where(
            and(
              eq(transactionsTable.orderId, numericOrderId),
              eq(transactionsTable.paymentProvider, 'momo')
            )
          );

        // Use State Machine to update order status
        if (order.status === 'pending_payment' || order.status === 'pending') {
          // Pass 'tx' to prevent deadlock
          await updateOrderStatus(order.orderNumber, 'payment_received', tx);
        }
      } else {
        // Failed
        await tx
          .update(transactionsTable)
          .set({
            status: 'failed',
            responseData: body,
          })
          .where(
            and(
              eq(transactionsTable.orderId, numericOrderId),
              eq(transactionsTable.paymentProvider, 'momo')
            )
          );
      }

      return ResponseWrapper.success(null, 'IPN received');
    });
  } catch (error: any) {
    console.error('Momo IPN Error:', error);
    return ResponseWrapper.serverError('Internal Server Error', error);
  }
}
