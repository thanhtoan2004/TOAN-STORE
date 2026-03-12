import { NextRequest } from 'next/server';
import { checkAdminAuth } from '@/lib/auth/auth';
import { decrypt } from '@/lib/security/encryption';
import { db } from '@/lib/db/drizzle';
import { orders as ordersSchema, users, orderItems } from '@/lib/db/schema';
import { eq, and, sql, desc, countDistinct } from 'drizzle-orm';
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
      // FIX P5 (TODO): Search trên email/phone đã được mã hóa AES-256 sẽ KHÔNG bao giờ khớp.
      // Giải pháp tương lai: Tạo blind index (hash email/phone) để search.
      // Hiện tại chỉ search theo orderNumber hoạt động chính xác.
      filters.push(
        sql`(${ordersSchema.orderNumber} LIKE ${`%%${search}%%`} OR ${users.email} LIKE ${`%%${search}%%`} OR ${users.phone} LIKE ${`%%${search}%%`})`
      );
    }

    const data = await db
      .select({
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
      customerName: order.customerName, // users table might also have encrypted fields in some implementations, but here we follow ordersSchema
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
