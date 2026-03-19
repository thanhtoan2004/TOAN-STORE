import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import {
  orders as ordersTable,
  users as usersTable,
  orderItems,
  productImages,
} from '@/lib/db/schema';
import { eq, and, or, isNull, sql, desc } from 'drizzle-orm';
import { hashEmail } from '@/lib/security/encryption';
import { ResponseWrapper } from '@/lib/api/api-response';

async function performLookup(orderNumber: string, email: string) {
  const emailHash = hashEmail(email);

  // 1. Query order basic info with Drizzle ORM
  // Complex WHERE clause for email matching (PII protection)
  const [order] = await db
    .select()
    .from(ordersTable)
    .leftJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .where(
      and(
        eq(ordersTable.orderNumber, orderNumber),
        or(
          eq(ordersTable.emailHash, emailHash),
          and(isNull(ordersTable.emailHash), eq(ordersTable.email, email)),
          and(eq(ordersTable.userId, usersTable.id), eq(usersTable.emailHash, emailHash))
        )
      )
    )
    .limit(1);

  if (!order) {
    return null;
  }

  // 2. Query order items with main image subquery
  const items = await db
    .select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      productName: orderItems.productName,
      sku: orderItems.sku,
      size: orderItems.size,
      quantity: orderItems.quantity,
      unitPrice: orderItems.unitPrice,
      totalPrice: orderItems.totalPrice,
      imageUrl: sql<string>`(SELECT url FROM ${productImages} WHERE ${productImages.productId} = ${orderItems.productId} AND ${productImages.isMain} = 1 LIMIT 1)`,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, order.orders.id));

  return {
    ...order.orders,
    items,
  };
}

/**
 * API Tra cứu đơn hàng dành cho khách vãng lai và người dùng chưa đăng nhập.
 * Chế độ bảo vệ PII: Yêu cầu cả Mã đơn hàng và Email trùng khớp (Email được hash để so khớp).
 */
export async function POST(request: NextRequest) {
  try {
    const { orderNumber, email } = await request.json();

    if (!orderNumber || !email) {
      return ResponseWrapper.error('Vui lòng nhập Mã đơn hàng và Email', 400);
    }

    const orderDetails = await performLookup(orderNumber, email);

    if (!orderDetails) {
      return ResponseWrapper.notFound('Không tìm thấy đơn hàng phù hợp');
    }

    return ResponseWrapper.success(orderDetails);
  } catch (error) {
    console.error('Order lookup error:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('orderNumber');
    const email = searchParams.get('email');

    if (!orderNumber || !email) {
      return ResponseWrapper.error('Vui lòng cung cấp orderNumber và email qua query params', 400);
    }

    const orderDetails = await performLookup(orderNumber, email);

    if (!orderDetails) {
      return ResponseWrapper.notFound('Không tìm thấy đơn hàng phù hợp');
    }

    return ResponseWrapper.success(orderDetails);
  } catch (error) {
    console.error('Order lookup GET error:', error);
    return ResponseWrapper.serverError('Lỗi server nội bộ', error);
  }
}
