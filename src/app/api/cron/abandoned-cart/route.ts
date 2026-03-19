import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { carts, cartItems, users, products } from '@/lib/db/schema';
import { eq, and, sql, isNull, gt, lt } from 'drizzle-orm';
import { sendAbandonedCartEmail } from '@/lib/mail/email-templates';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * Cron Job: Gửi Email nhắc nhở giỏ hàng bị bỏ quên (Abandoned Cart).
 * Tần suất: Chạy định kỳ (ví dụ: mỗi 1 giờ).
 * Logic: Tìm các giỏ hàng không hoạt động từ 24h - 72h và gửi email khuyến khích hoàn tất đơn hàng.
 * Bảo mật: Yêu cầu CRON_SECRET trong Header Authorization.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Security: ALWAYS require CRON_SECRET
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return ResponseWrapper.unauthorized('Unauthorized cron target access');
    }

    // Find carts inactive for > 24 hours that have items and belong to active users
    const abandonedCarts = await db
      .select({
        cartId: carts.id,
        userId: carts.userId,
        updatedAt: carts.updatedAt,
        email: users.email,
        firstName: users.firstName,
        itemCount: sql<number>`COUNT(${cartItems.id})`.as('item_count'),
        cartTotal: sql<number>`SUM(${cartItems.quantity} * ${cartItems.price})`.as('cart_total'),
        productNames:
          sql<string>`GROUP_CONCAT(CONCAT(${products.name}, ' (', ${cartItems.quantity}, ')') ORDER BY ${cartItems.addedAt} DESC SEPARATOR ', ')`.as(
            'product_names'
          ),
      })
      .from(carts)
      .innerJoin(cartItems, eq(cartItems.cartId, carts.id))
      .innerJoin(users, eq(users.id, carts.userId))
      .innerJoin(products, eq(products.id, cartItems.productId))
      .where(
        and(
          lt(carts.updatedAt, sql`DATE_SUB(NOW(), INTERVAL 24 HOUR)`),
          gt(carts.updatedAt, sql`DATE_SUB(NOW(), INTERVAL 72 HOUR)`),
          eq(users.isActive, 1),
          eq(users.isBanned, 0),
          isNull(users.deletedAt)
        )
      )
      .groupBy(carts.id, carts.userId, carts.updatedAt, users.email, users.firstName)
      .having(sql`item_count > 0`)
      .limit(50);

    let sentCount = 0;

    for (const cart of abandonedCarts) {
      try {
        if (cart.email) {
          await sendAbandonedCartEmail(
            cart.email,
            cart.firstName || 'Bạn',
            Number(cart.itemCount),
            Number(cart.cartTotal),
            cart.productNames || ''
          );
          sentCount++;
        }
      } catch (emailErr) {
        console.error(`Failed to send abandoned cart email to ${cart.email}:`, emailErr);
      }
    }

    const result = {
      sentCount,
      totalFound: abandonedCarts.length,
      timestamp: new Date().toISOString(),
    };

    return ResponseWrapper.success(
      result,
      `Sent ${sentCount} abandoned cart emails out of ${abandonedCarts.length} found.`
    );
  } catch (error) {
    console.error('Abandoned cart cron error:', error);
    return ResponseWrapper.serverError('Abandoned cart cron failed', error);
  }
}
