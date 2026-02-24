import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/auth';
import { decrypt } from '@/lib/encryption';
import { db } from '@/lib/db/drizzle';
import { orders as ordersSchema, users, orderItems } from '@/lib/db/schema';
import { eq, and, sql, desc, countDistinct } from 'drizzle-orm';
import { ResponseWrapper } from '@/lib/api-response';
import { logger } from '@/lib/logger';

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
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const offset = (page - 1) * limit;

    const filters = [];
    if (status && status !== 'all') {
      filters.push(eq(ordersSchema.status, status as any));
    }

    if (search) {
      // Note: Encryption search is limited to exact matches or we need to handle it differently.
      // For now, we follow the existing pattern which was searching on encrypted fields (which usually doesn't work well unless it's deterministic).
      // However, we maintain compatibility with the original logic.
      filters.push(sql`(${ordersSchema.orderNumber} LIKE ${`%%${search}%%`} OR ${users.email} LIKE ${`%%${search}%%`} OR ${users.phone} LIKE ${`%%${search}%%`})`);
    }

    const data = await db.select({
      id: ordersSchema.id,
      orderNumber: ordersSchema.orderNumber,
      status: ordersSchema.status,
      total: ordersSchema.total,
      placedAt: ordersSchema.placedAt,
      customerName: users.firstName, // Mapping to full_name logic or firstName for now
      customerEmail: users.email,
      itemCount: sql<number>`count(${orderItems.id})`,
      phone: ordersSchema.phone,
      email: ordersSchema.email,
    })
      .from(ordersSchema)
      .leftJoin(users, eq(ordersSchema.userId, users.id))
      .leftJoin(orderItems, eq(ordersSchema.id, orderItems.id))
      .where(and(...filters))
      .groupBy(ordersSchema.id)
      .orderBy(desc(ordersSchema.placedAt))
      .limit(limit)
      .offset(offset);

    // Decrypt PII data
    const decryptedOrders = data.map(order => ({
      ...order,
      phone: order.phone ? decrypt(order.phone) : null,
      email: order.email ? decrypt(order.email) : null,
      customerName: order.customerName // users table might also have encrypted fields in some implementations, but here we follow ordersSchema
    }));

    // Get total count
    const [countResult] = await db.select({ count: countDistinct(ordersSchema.id) })
      .from(ordersSchema)
      .leftJoin(users, eq(ordersSchema.userId, users.id))
      .where(and(...filters));

    const total = countResult?.count || 0;

    return ResponseWrapper.success(decryptedOrders, undefined, 200, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    logger.error(error, 'Error fetching orders:');
    return ResponseWrapper.serverError('Internal server error', error);
  }
}
