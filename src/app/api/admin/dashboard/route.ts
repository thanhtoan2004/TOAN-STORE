import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import {
  users,
  orders as ordersTable,
  products,
  giftCards,
  dailyMetrics,
  orderItems,
  inventory,
  productVariants,
  productImages,
} from '@/lib/db/schema';
import { eq, and, ne, gte, sql, desc, asc, isNull, count, sum, avg, gt, lt } from 'drizzle-orm';
import { checkAdminAuth } from '@/lib/auth/auth';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Tổng hợp Dữ liệu cho Dashboard Admin (Trang Quản Trị).
 * Chức năng:
 * - Thống kê cơ bản (Doanh thu, Đơn hàng, Sản phẩm, Người dùng).
 * - Phân tích doanh thu theo trạng thái và xu hướng (Trend).
 * - Chỉ số tài chính (VAT, Chiết khấu, Phí vận chuyển, Lợi nhuận).
 * - Cảnh báo tồn kho (Sắp hết hàng, Hết hàng).
 * - Thông tin khách hàng (Khách mới, Khách quay lại, Top khách hàng).
 * - So sánh doanh thu hôm nay vs hôm qua.
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const admin = await checkAdminAuth();
    if (!admin) {
      return ResponseWrapper.unauthorized();
    }
    const searchParams = new URL(request.url).searchParams;
    const days = parseInt(searchParams.get('days') || '7');

    const [
      basicCountStats,
      revenueByStatus,
      revenueTrend,
      financialStats,
      inventorySummary,
      lowStockProducts,
      newCustomersMonth,
      returningCustomersCount,
      topCustomers,
      recentOrders,
      topProducts,
      todayRevenue,
      yesterdayRevenue,
    ] = await Promise.all([
      // 1. Basic statistics
      db
        .select({
          totalUsers: sql<number>`(SELECT COUNT(*) FROM ${users})`,
          totalOrders: sql<number>`(SELECT COUNT(*) FROM ${ordersTable})`,
          totalProducts: sql<number>`(SELECT COUNT(*) FROM ${products} WHERE ${products.isActive} = 1)`,
          totalRevenue: sql<number>`(SELECT COALESCE(SUM(${ordersTable.total}), 0) FROM ${ordersTable} WHERE ${ordersTable.status} != 'cancelled' AND ${ordersTable.status} != 'refunded')`,
          averageOrderValue: sql<number>`(SELECT COALESCE(AVG(${ordersTable.total}), 0) FROM ${ordersTable} WHERE ${ordersTable.status} = 'delivered')`,
          activeGiftCards: sql<number>`(SELECT COUNT(*) FROM ${giftCards} WHERE ${giftCards.status} = 'active' AND ${giftCards.currentBalance} > 0)`,
        })
        .from(sql`dual`),

      // 2. Revenue by status
      db
        .select({
          status: ordersTable.status,
          count: count(ordersTable.id),
          revenue: sum(ordersTable.total),
        })
        .from(ordersTable)
        .groupBy(ordersTable.status),

      // 3. Revenue trend
      db
        .select({
          date: dailyMetrics.date,
          revenue: dailyMetrics.revenue,
          profit: dailyMetrics.netProfit,
          orderCount: dailyMetrics.ordersCount,
        })
        .from(dailyMetrics)
        .where(gte(dailyMetrics.date, sql`DATE_SUB(CURDATE(), INTERVAL ${days} DAY)`))
        .orderBy(asc(dailyMetrics.date)),

      // 4. Financial metrics
      db
        .select({
          totalVat: sum(ordersTable.tax),
          totalDiscounts: sql<number>`SUM(${ordersTable.discount} + ${ordersTable.voucherDiscount} + ${ordersTable.giftcardDiscount})`,
          totalShipping: sum(ordersTable.shippingFee),
          netRevenue: sql<number>`SUM(${ordersTable.subtotal}) - SUM(${ordersTable.discount} + ${ordersTable.voucherDiscount} + ${ordersTable.giftcardDiscount})`,
          totalCost: sql<number>`(SELECT COALESCE(SUM(oi.${orderItems.costPrice} * oi.${orderItems.quantity}), 0) FROM ${orderItems} oi JOIN ${ordersTable} o ON oi.${orderItems.orderId} = o.${ordersTable.id} WHERE o.${ordersTable.status} = 'delivered')`,
        })
        .from(ordersTable)
        .where(eq(ordersTable.status, 'delivered')),

      // 5. Inventory alerts
      db
        .select({
          lowStockCount: sql<number>`(SELECT COUNT(DISTINCT pv.${productVariants.productId}) FROM ${productVariants} pv JOIN ${inventory} i ON pv.${productVariants.id} = i.${inventory.productVariantId} WHERE (i.${inventory.quantity} - i.${inventory.reserved}) > 0 AND (i.${inventory.quantity} - i.${inventory.reserved}) < 10)`,
          outOfStockCount: sql<number>`(SELECT COUNT(DISTINCT pv.${productVariants.productId}) FROM ${productVariants} pv JOIN ${inventory} i ON pv.${productVariants.id} = i.${inventory.productVariantId} WHERE (i.${inventory.quantity} - i.${inventory.reserved}) = 0)`,
        })
        .from(sql`dual`),

      // 6. Low stock products
      db
        .select({
          id: products.id,
          name: products.name,
          totalQuantity: sql<number>`SUM(${inventory.quantity} - ${inventory.reserved})`.as(
            'total_quantity'
          ),
          imageUrl: sql<string>`(SELECT ${productImages.url} FROM ${productImages} WHERE ${productImages.productId} = ${products.id} ORDER BY ${productImages.isMain} DESC, ${productImages.position} ASC LIMIT 1)`,
        })
        .from(inventory)
        .innerJoin(productVariants, eq(inventory.productVariantId, productVariants.id))
        .innerJoin(products, eq(productVariants.productId, products.id))
        .where(
          and(
            gt(sql`${inventory.quantity} - ${inventory.reserved}`, 0),
            lt(sql`${inventory.quantity} - ${inventory.reserved}`, 10)
          )
        )
        .groupBy(products.id, products.name)
        .orderBy(asc(sql`total_quantity`))
        .limit(5),

      // 7. Customer insights (New customers)
      db
        .select({ count: count() })
        .from(users)
        .where(gte(users.createdAt, sql`DATE_FORMAT(NOW(), '%Y-%m-01')`)),

      // 7b. Returning customers
      db
        .select({
          count: sql<number>`(SELECT COUNT(DISTINCT user_id) FROM orders WHERE user_id IN (SELECT user_id FROM orders GROUP BY user_id HAVING COUNT(*) > 1))`,
        })
        .from(sql`dual`),

      // 8. Top customers
      db
        .select({
          id: users.id,
          email: users.email,
          membershipTier: users.membershipTier,
          fullName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
          totalSpent: sum(ordersTable.total),
          orderCount: count(ordersTable.id),
        })
        .from(users)
        .innerJoin(ordersTable, eq(users.id, ordersTable.userId))
        .where(eq(ordersTable.status, 'delivered'))
        .groupBy(users.id)
        .orderBy(desc(sum(ordersTable.total)))
        .limit(5),

      // 9. Recent orders
      db
        .select({
          order: ordersTable,
          customerName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
          customerEmail: users.email,
        })
        .from(ordersTable)
        .leftJoin(users, eq(ordersTable.userId, users.id))
        .orderBy(desc(ordersTable.placedAt))
        .limit(10),

      // 10. Top selling products
      db
        .select({
          id: products.id,
          name: products.name,
          primary_image: sql<string>`(SELECT ${productImages.url} FROM ${productImages} WHERE ${productImages.productId} = ${products.id} ORDER BY ${productImages.isMain} DESC, ${productImages.position} ASC LIMIT 1)`,
          price: products.priceCache,
          sold: sum(orderItems.quantity),
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .groupBy(products.id)
        .orderBy(desc(sum(orderItems.quantity)))
        .limit(10),

      // 11. Today Revenue
      db
        .select({ revenue: sum(ordersTable.total) })
        .from(ordersTable)
        .where(sql`DATE(${ordersTable.placedAt}) = CURDATE()`),

      // 12. Yesterday Revenue
      db
        .select({ revenue: sum(ordersTable.total) })
        .from(ordersTable)
        .where(sql`DATE(${ordersTable.placedAt}) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)`),
    ]);

    const stats = basicCountStats[0];
    const fin = financialStats[0];
    const inv = inventorySummary[0];

    const result = {
      // Basic stats
      totalRevenue: Number(stats.totalRevenue) || 0,
      totalOrders: Number(stats.totalOrders) || 0,
      totalProducts: Number(stats.totalProducts) || 0,
      totalUsers: Number(stats.totalUsers) || 0,
      averageOrderValue: Number(stats.averageOrderValue) || 0,
      activeGiftCards: Number(stats.activeGiftCards) || 0,

      // Revenue by status
      revenueByStatus: revenueByStatus.map((r) => ({
        status: r.status,
        count: Number(r.count),
        revenue: Number(r.revenue) || 0,
      })),

      // Revenue trend
      revenueTrend: revenueTrend.map((r) => ({
        date: r.date,
        revenue: Number(r.revenue) || 0,
        profit: Number(r.profit) || 0,
        orderCount: Number(r.orderCount),
      })),

      // Financial metrics
      totalVAT: Number(fin.totalVat) || 0,
      totalDiscounts: Number(fin.totalDiscounts) || 0,
      totalShipping: Number(fin.totalShipping) || 0,
      netRevenue: Number(fin.netRevenue) || 0,
      totalCost: Number(fin.totalCost) || 0,
      totalProfit: (Number(fin.netRevenue) || 0) - (Number(fin.totalCost) || 0),
      profitMargin:
        Number(fin.netRevenue) > 0
          ? ((Number(fin.netRevenue) - Number(fin.totalCost)) / Number(fin.netRevenue)) * 100
          : 0,

      // Inventory
      lowStockCount: Number(inv.lowStockCount) || 0,
      outOfStockCount: Number(inv.outOfStockCount) || 0,
      lowStockProducts: lowStockProducts.map((p) => ({
        id: p.id,
        name: p.name,
        quantity: Number(p.totalQuantity),
        image: p.imageUrl,
      })),

      // Customer insights
      newCustomersMonth: Number(newCustomersMonth[0].count) || 0,
      returningCustomers: Number(returningCustomersCount[0].count) || 0,
      topCustomers: topCustomers.map((c) => ({
        id: c.id,
        email: c.email,
        name: c.fullName,
        membershipTier: c.membershipTier,
        totalSpent: Number(c.totalSpent) || 0,
        orderCount: Number(c.orderCount),
      })),

      // Today vs Yesterday
      todayRevenue: Number(todayRevenue[0]?.revenue) || 0,
      yesterdayRevenue: Number(yesterdayRevenue[0]?.revenue) || 0,

      // Existing data
      recentOrders: recentOrders.map((r) => ({
        ...r.order,
        order_number: r.order.orderNumber,
        customer_name: r.customerName,
        customer_email: r.customerEmail,
      })),
      topProducts: topProducts.map((p) => ({ ...p, sold: Number(p.sold) })),
    };

    return ResponseWrapper.success(result);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return ResponseWrapper.serverError('Internal server error', error);
  }
}
