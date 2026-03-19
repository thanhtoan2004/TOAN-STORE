import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { orders as ordersTable, orderItems } from '@/lib/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { verifyAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Kiểm tra xem người dùng đã mua sản phẩm này chưa.
 * Dùng để xác thực quyền đánh giá sản phẩm (Verified Purchase).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await verifyAuth();
    if (!session) {
      return ResponseWrapper.unauthorized();
    }
    const userId = Number(session.userId);

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return ResponseWrapper.error('Missing productId', 400);
    }

    // Check if user has purchased this product
    const purchaseResult = await db
      .select({
        id: ordersTable.id,
        orderNumber: ordersTable.orderNumber,
        placedAt: ordersTable.placedAt,
      })
      .from(ordersTable)
      .innerJoin(orderItems, eq(ordersTable.id, orderItems.orderId))
      .where(
        and(
          eq(ordersTable.userId, userId),
          eq(orderItems.productId, parseInt(productId)),
          sql`${ordersTable.status} NOT IN ('cancelled', 'failed')`
        )
      )
      .orderBy(desc(ordersTable.placedAt))
      .limit(1);

    const hasPurchased = purchaseResult.length > 0;

    return ResponseWrapper.success({
      hasPurchased,
      purchaseInfo: hasPurchased ? purchaseResult[0] : null,
    });
  } catch (error) {
    console.error('Error checking purchase status:', error);
    return ResponseWrapper.serverError('Internal server error', error);
  }
}
