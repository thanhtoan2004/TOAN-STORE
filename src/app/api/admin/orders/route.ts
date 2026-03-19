import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/auth/auth';
import { decrypt } from '@/lib/security/encryption';
import { db } from '@/lib/db/drizzle';
import { orders as ordersSchema, users, orderItems } from '@/lib/db/schema';
import { eq, and, or, like, sql, desc, countDistinct } from 'drizzle-orm';
import { ResponseWrapper } from '@/lib/api/api-response';
import { logger } from '@/lib/utils/logger';

// GET - Lấy danh sách đơn hàng (Admin)
/**
 * API Lấy danh sách toàn bộ đơn hàng (Dành cho Admin).
 * Tính năng:
 * 1. Phân quyền: Chỉ Admin mới có quyền truy cập.
 * 2. Giải mã (PII Decrypt): Tự động giải mã Số điện thoại và Email khách hàng để hiển thị trên UI quản trị.
 * 3. Tìm kiếm: Hỗ trợ tìm theo Mã đơn hàng hoặc thông tin khách hàng.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // M2: Cap limit
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const offset = (page - 1) * limit;

    const filters = [];
    if (status && status !== 'all') {
      filters.push(eq(ordersSchema.status, status as any));
    }

    if (search) {
      const searchConditions = [
        like(ordersSchema.orderNumber, `%${search}%`),
        like(users.fullName, `%${search}%`),
      ];

      // If search looks like email, try matching hash
      if (search.includes('@')) {
        const { hashEmail } = await import('@/lib/security/encryption');
        searchConditions.push(eq(ordersSchema.emailHash, hashEmail(search)));
      }

      filters.push(or(...searchConditions)!);
    }

    const data = await db
      .select({
        id: ordersSchema.id,
        order_number: ordersSchema.orderNumber,
        status: ordersSchema.status,
        total: ordersSchema.total,
        placed_at: ordersSchema.placedAt,
        customer_name: users.firstName,
        customer_email: users.email,
        item_count: sql<number>`count(${orderItems.id})`,
        phone: ordersSchema.phone,
        email: ordersSchema.email,
      })
      .from(ordersSchema)
      .leftJoin(users, eq(ordersSchema.userId, users.id))
      .leftJoin(orderItems, eq(ordersSchema.id, orderItems.orderId)) // FIX H1: was orderItems.id
      .where(and(...filters))
      .groupBy(ordersSchema.id)
      .orderBy(desc(ordersSchema.placedAt))
      .limit(limit)
      .offset(offset);

    // Decrypt PII data
    const decryptedOrders = data.map((order) => ({
      ...order,
      phone: order.phone ? decrypt(order.phone) : null,
      email: order.email ? decrypt(order.email) : null,
      customer_name: order.customer_name,
    }));

    // Get total count
    const [countResult] = await db
      .select({ count: countDistinct(ordersSchema.id) })
      .from(ordersSchema)
      .leftJoin(users, eq(ordersSchema.userId, users.id))
      .where(and(...filters));

    const total = countResult?.count || 0;

    return ResponseWrapper.success(decryptedOrders, undefined, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    logger.error(error, 'Error fetching orders:');
    return ResponseWrapper.serverError('Internal server error', error);
  }
}
