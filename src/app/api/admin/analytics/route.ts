import { NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import {
  orders as ordersTable,
  orderItems,
  products,
  productImages,
  users,
  inventory,
  productVariants,
  categories,
} from '@/lib/db/schema';
import { eq, and, inArray, gte, sql, desc, asc, count, sum, avg } from 'drizzle-orm';
import { ResponseWrapper } from '@/lib/api/api-response';

/**
 * API Lấy dữ liệu phân tích (Analytics) cho Dashboard.
 */
export async function GET(request: Request) {
  try {
    const admin = await checkAdminAuth();
    if (!admin) return ResponseWrapper.unauthorized();
    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get('period') || '30'); // days
    const interval = sql`INTERVAL ${period} DAY`;

    const [
      overview,
      ordersByStatus,
      revenueByDay,
      topProducts,
      newCustomers,
      lowStock,
      categoryPerformance,
    ] = await Promise.all([
      // 1. Total revenue
      db
        .select({
          totalRevenue: sum(ordersTable.total),
          totalOrders: count(ordersTable.id),
          avgOrderValue: avg(ordersTable.total),
        })
        .from(ordersTable)
        .where(
          and(
            inArray(ordersTable.status, ['delivered']),
            gte(ordersTable.placedAt, sql`DATE_SUB(NOW(), ${interval})`)
          )
        ),

      // 2. Orders by status
      db
        .select({
          status: ordersTable.status,
          count: count(ordersTable.id),
        })
        .from(ordersTable)
        .where(gte(ordersTable.placedAt, sql`DATE_SUB(NOW(), ${interval})`))
        .groupBy(ordersTable.status),

      // 3. Revenue by day
      db
        .select({
          date: sql<string>`DATE(${ordersTable.placedAt})`.as('date'),
          revenue: sum(ordersTable.total),
          orders: count(ordersTable.id),
        })
        .from(ordersTable)
        .where(
          and(
            inArray(ordersTable.status, ['delivered']),
            gte(ordersTable.placedAt, sql`DATE_SUB(NOW(), ${interval})`)
          )
        )
        .groupBy(sql`date`)
        .orderBy(asc(sql`date`)),

      // 4. Top selling products
      db
        .select({
          id: products.id,
          name: products.name,
          imageUrl: sql<string>`(SELECT ${productImages.url} FROM ${productImages} WHERE ${productImages.productId} = ${products.id} AND ${productImages.isMain} = 1 LIMIT 1)`,
          totalSold: sum(orderItems.quantity),
          revenue: sum(sql`${orderItems.quantity} * ${orderItems.unitPrice}`),
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .innerJoin(ordersTable, eq(orderItems.orderId, ordersTable.id))
        .where(
          and(
            inArray(ordersTable.status, ['delivered']),
            gte(ordersTable.placedAt, sql`DATE_SUB(NOW(), ${interval})`)
          )
        )
        .groupBy(products.id)
        .orderBy(desc(sql`totalSold`))
        .limit(10),

      // 5. New customers
      db
        .select({ count: count() })
        .from(users)
        .where(gte(users.createdAt, sql`DATE_SUB(NOW(), ${interval})`)),

      // 6. Low stock products
      db
        .select({
          id: products.id,
          name: products.name,
          imageUrl: sql<string>`(SELECT ${productImages.url} FROM ${productImages} WHERE ${productImages.productId} = ${products.id} AND ${productImages.isMain} = 1 LIMIT 1)`,
          quantity: inventory.quantity,
          reserved: inventory.reserved,
        })
        .from(inventory)
        .innerJoin(productVariants, eq(inventory.productVariantId, productVariants.id))
        .innerJoin(products, eq(productVariants.productId, products.id))
        .where(sql`${inventory.quantity} - ${inventory.reserved} <= 10`)
        .orderBy(sql`${inventory.quantity} - ${inventory.reserved}`)
        .limit(10),

      // 7. Category performance
      db
        .select({
          category: categories.name,
          orders: count(sql`DISTINCT ${orderItems.orderId}`),
          itemsSold: sum(orderItems.quantity),
          revenue: sum(sql`${orderItems.quantity} * ${orderItems.unitPrice}`),
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .innerJoin(categories, eq(products.categoryId, categories.id))
        .innerJoin(ordersTable, eq(orderItems.orderId, ordersTable.id))
        .where(
          and(
            inArray(ordersTable.status, ['delivered']),
            gte(ordersTable.placedAt, sql`DATE_SUB(NOW(), ${interval})`)
          )
        )
        .groupBy(categories.id)
        .orderBy(desc(sql`revenue`))
        .limit(10),
    ]);

    return ResponseWrapper.success({
      overview: {
        totalRevenue: Number(overview[0]?.totalRevenue) || 0,
        totalOrders: Number(overview[0]?.totalOrders) || 0,
        avgOrderValue: Number(overview[0]?.avgOrderValue) || 0,
        newCustomers: Number(newCustomers[0]?.count) || 0,
      },
      ordersByStatus: ordersByStatus.map((item) => ({
        status: item.status,
        count: Number(item.count),
      })),
      revenueByDay: revenueByDay.map((item) => ({
        date: item.date,
        revenue: Number(item.revenue),
        orders: Number(item.orders),
      })),
      topProducts: topProducts.map((item) => ({
        id: item.id,
        name: item.name,
        imageUrl: item.imageUrl,
        totalSold: Number(item.totalSold),
        revenue: Number(item.revenue),
      })),
      lowStock: lowStock.map((item) => ({
        id: item.id,
        name: item.name,
        imageUrl: item.imageUrl,
        available: Number(item.quantity) - Number(item.reserved),
      })),
      categoryPerformance: categoryPerformance.map((item) => ({
        category: item.category,
        orders: Number(item.orders),
        itemsSold: Number(item.itemsSold),
        revenue: Number(item.revenue),
      })),
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return ResponseWrapper.serverError('Failed to fetch analytics', error);
  }
}
