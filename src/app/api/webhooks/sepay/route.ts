import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { orders, sepayTransactions } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { updateOrderStatus } from '@/lib/db/repositories/order';
import { logger } from '@/lib/utils/logger';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * Webhook handler for SePay (Auto-confirmation of bank transfers)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Verify Request
    const authHeader = request.headers.get('authorization');
    const apiKey = authHeader?.replace('Bearer ', '');

    if (process.env.SEPAY_WEBHOOK_SECRET && apiKey !== process.env.SEPAY_WEBHOOK_SECRET) {
      logger.warn(`[SePay Webhook] Unauthorized attempt with API Key: ${apiKey}`);
      return ResponseWrapper.unauthorized();
    }

    const {
      transferAmount,
      content,
      id: sepayId,
      gateway,
      transactionDate,
      accountNumber,
      transferType,
      accumulated,
      referenceCode,
      description,
    } = body;

    if (!content) {
      return ResponseWrapper.error('No content found', 400);
    }

    // 2. Extract Order Number
    const orderNumberRegex = /NK\d+_[A-Z0-9]+/;
    const match = content.match(orderNumberRegex);
    const orderNumber = match ? match[0] : null;

    // 3. Save Transaction History (Even if order not found, for audit)
    try {
      await db
        .insert(sepayTransactions)
        .values({
          sepayId: Number(sepayId),
          gateway,
          transactionDate: new Date(transactionDate),
          accountNumber,
          transferType,
          transferAmount: String(transferAmount),
          accumulated: String(accumulated),
          content,
          code: orderNumber || 'UNKNOWN',
          referenceCode,
          description,
        })
        .onDuplicateKeyUpdate({
          set: { createdAt: sql`NOW()` }, // Keep it simple for retries
        });
    } catch (dbError) {
      logger.error({ err: dbError }, '[SePay Webhook] Failed to save transaction log');
      // We continue with order processing even if logging fails
    }

    if (!orderNumber) {
      logger.info(`[SePay Webhook] Could not find order number in content: "${content}"`);
      return ResponseWrapper.success(
        { orderNumberNotFound: true },
        'Order number not found, logged'
      );
    }

    logger.info(`[SePay Webhook] Processing transaction ${sepayId} for Order ${orderNumber}`);

    // 4. Process Order Payment within a Transaction
    return await db.transaction(async (tx) => {
      // Find Order in DB with lock
      const [order] = await (
        tx
          .select({
            id: orders.id,
            total: orders.total,
            status: orders.status,
            paymentStatus: orders.paymentStatus,
          })
          .from(orders)
          .where(eq(orders.orderNumber, orderNumber))
          .limit(1) as any
      ).forUpdate();

      if (!order) {
        logger.warn(
          `[SePay Webhook] Order ${orderNumber} not found but transaction ${sepayId} logged.`
        );
        return ResponseWrapper.success(
          { orderNotFound: true },
          'Order not found, but transaction logged'
        );
      }

      // 5. Validate and Update
      if (order.status === 'payment_received' || order.paymentStatus === 'paid') {
        return ResponseWrapper.success(null, 'Order already marked as paid');
      }

      const amountReceived = parseFloat(transferAmount);
      const orderTotal = parseFloat(order.total);

      if (amountReceived < orderTotal) {
        logger.warn(
          `[SePay Webhook] Partial payment for ${orderNumber}: Received ${amountReceived}, Expected ${orderTotal}`
        );
        return ResponseWrapper.success({ partialPayment: true }, 'Partial payment received');
      }

      // 6. Update Order Status through Repository (passes tx to prevent deadlocks)
      await updateOrderStatus(orderNumber, 'payment_received', tx);

      // Additional updates specific to SePay
      await tx
        .update(orders)
        .set({
          paymentStatus: 'paid',
          paymentConfirmedAt: new Date(),
          notes: sql`CONCAT(IFNULL(${orders.notes}, ""), "\n[SePay] Giao dịch ${sepayId} - Số tiền: ${transferAmount}")`,
        })
        .where(eq(orders.id, order.id));

      logger.info(`[SePay Webhook] Successfully confirmed payment for Order ${orderNumber}`);

      return ResponseWrapper.success(null, 'Payment confirmed');
    });
  } catch (error) {
    logger.error({ err: error }, '[SePay Webhook] Error');
    return ResponseWrapper.serverError('Internal Server Error', error);
  }
}
