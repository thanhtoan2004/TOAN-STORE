import { db } from '../drizzle';
import { refundRequests, refunds, users, orders } from '../schema';
import { eq, and, desc, sql, count } from 'drizzle-orm';

/**
 * Repository xử lý Yêu cầu Hoàn tiền (Refund Requests).
 */

export interface RefundRequest {
  id: number;
  orderId: number;
  userId: number;
  amount: number;
  reason: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tạo mới một yêu cầu hoàn tiền.
 */
export async function createRefundRequest(
  userId: number,
  orderId: number,
  amount: number,
  reason: string,
  images: string[]
): Promise<number> {
  const [result] = await db.insert(refundRequests).values({
    userId,
    orderId,
    amount: String(amount),
    reason,
    images: JSON.stringify(images),
    status: 'pending',
  });
  return result.insertId;
}

/**
 * Note: I need to verify the columns for refundRequests in schema.ts.
 * Based on step 10724:
 * refundRequests: id, orderId, userId, reason, status, adminNotes, createdAt, updatedAt.
 * There is NO 'amount' or 'images' in that specific schema snippet.
 * However, the repository used them. This means the DB might have them but schema.ts is missing them
 * OR I need to update schema.ts.
 * Let's check the actually used columns in the repository vs schema.
 */

export async function getRefundByOrder(orderId: number): Promise<any | null> {
  const [row] = await db
    .select()
    .from(refundRequests)
    .where(eq(refundRequests.orderId, orderId))
    .limit(1);
  return row || null;
}

export async function getRefundById(id: number): Promise<any | null> {
  const [row] = await db
    .select({
      id: refundRequests.id,
      order_id: refundRequests.orderId,
      user_id: refundRequests.userId,
      amount: refundRequests.amount,
      reason: refundRequests.reason,
      images: refundRequests.images,
      status: refundRequests.status,
      admin_response: refundRequests.adminResponse,
      created_at: refundRequests.createdAt,
      updated_at: refundRequests.updatedAt,
      user_name: sql<string>`COALESCE(TRIM(CONCAT(COALESCE(${users.firstName}, ''), ' ', COALESCE(${users.lastName}, ''))), ${users.fullName}, 'User')`,
      user_email: users.email,
      order_number: orders.orderNumber,
    })
    .from(refundRequests)
    .innerJoin(users, eq(refundRequests.userId, users.id))
    .innerJoin(orders, eq(refundRequests.orderId, orders.id))
    .where(eq(refundRequests.id, id))
    .limit(1);
  return row || null;
}

export async function getUserRefunds(userId: number): Promise<any[]> {
  return await db
    .select({
      id: refundRequests.id,
      orderId: refundRequests.orderId,
      reason: refundRequests.reason,
      status: refundRequests.status,
      createdAt: refundRequests.createdAt,
      orderNumber: orders.orderNumber,
    })
    .from(refundRequests)
    .innerJoin(orders, eq(refundRequests.orderId, orders.id))
    .where(eq(refundRequests.userId, userId))
    .orderBy(desc(refundRequests.createdAt));
}

export async function getAllRefunds(
  page: number = 1,
  limit: number = 20,
  status?: string
): Promise<{ refunds: any[]; total: number }> {
  const offset = (page - 1) * limit;
  const conditions = [];
  if (status) {
    conditions.push(eq(refundRequests.status, status as any));
  }

  let baseQuery = db
    .select({
      id: refundRequests.id,
      user_id: refundRequests.userId,
      order_id: refundRequests.orderId,
      amount: refundRequests.amount,
      reason: refundRequests.reason,
      images: refundRequests.images,
      status: refundRequests.status,
      created_at: refundRequests.createdAt,
      user_name: sql<string>`COALESCE(TRIM(CONCAT(COALESCE(${users.firstName}, ''), ' ', COALESCE(${users.lastName}, ''))), ${users.fullName}, 'User')`,
      user_email: users.email,
      order_number: orders.orderNumber,
    })
    .from(refundRequests)
    .innerJoin(users, eq(refundRequests.userId, users.id))
    .innerJoin(orders, eq(refundRequests.orderId, orders.id));

  let countQuery = db
    .select({ total: count() })
    .from(refundRequests)
    .innerJoin(users, eq(refundRequests.userId, users.id))
    .innerJoin(orders, eq(refundRequests.orderId, orders.id));

  if (conditions.length > 0) {
    const whereClause = and(...conditions);
    baseQuery.where(whereClause);
    countQuery.where(whereClause);
  }

  const refundsResult = await baseQuery
    .orderBy(desc(refundRequests.createdAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await countQuery;

  return {
    refunds: refundsResult,
    total: countResult?.total || 0,
  };
}

/**
 * Cập nhật trạng thái yêu cầu hoàn tiền.
 */
export async function updateRefundStatus(
  id: number,
  status: string,
  response: string
): Promise<boolean> {
  const [result] = await db
    .update(refundRequests)
    .set({
      status: status as any,
      adminResponse: response,
      updatedAt: new Date(),
    })
    .where(eq(refundRequests.id, id));

  if (result.affectedRows > 0 && status === 'approved') {
    try {
      const [request] = await db
        .select({
          orderId: refundRequests.orderId,
          reason: refundRequests.reason,
          amount: refundRequests.amount,
        })
        .from(refundRequests)
        .where(eq(refundRequests.id, id))
        .limit(1);

      if (request) {
        // Log to refunds table
        await db.insert(refunds).values({
          orderId: request.orderId,
          amount: request.amount || '0',
          reason: request.reason,
          status: 'completed',
        });

        const [order] = await db
          .select({ orderNumber: orders.orderNumber })
          .from(orders)
          .where(eq(orders.id, request.orderId))
          .limit(1);

        if (order) {
          const { updateOrderStatus } = await import('./order');
          await updateOrderStatus(order.orderNumber, 'refunded');
        }
      }
    } catch (error) {
      console.error('[Refund] Error processing approval logic:', error);
    }
  }

  return result.affectedRows > 0;
}
