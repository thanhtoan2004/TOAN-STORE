import { db } from '@/lib/db/drizzle';
import { dailyMetrics, orders, orderItems, users } from '@/lib/db/schema';
import { eq, and, sql, gte, lte, count, sum } from 'drizzle-orm';

/**
 * Aggregates financial metrics for a specific date range
 */
export async function aggregateDailyMetrics(startDate: Date, endDate: Date = startDate) {
  const dates = [];
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  const finish = new Date(endDate);
  finish.setHours(23, 59, 59, 999);

  while (current <= finish) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  for (const date of dates) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    console.log(`Aggregating metrics for ${dayStart.toISOString().split('T')[0]}...`);

    // 1. Calculate Revenue from successful orders
    const [revenueData] = await db
      .select({
        totalRevenue: sum(orders.totalAmount),
        ordersCount: count(orders.id),
      })
      .from(orders)
      .where(
        and(
          gte(orders.placedAt, dayStart),
          lte(orders.placedAt, dayEnd),
          sql`${orders.status} NOT IN ('cancelled', 'refunded')`
        )
      );

    // 2. Calculate Total Cost from order items of successful orders
    const [costData] = await db
      .select({
        totalCost: sum(sql`${orderItems.quantity} * ${orderItems.costPrice}`),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(
        and(
          gte(orders.placedAt, dayStart),
          lte(orders.placedAt, dayEnd),
          sql`${orders.status} NOT IN ('cancelled', 'refunded')`
        )
      );

    // 3. Count unique customers who placed orders today
    const [customerData] = await db
      .select({
        count: count(sql`DISTINCT ${orders.userId}`),
      })
      .from(orders)
      .where(and(gte(orders.placedAt, dayStart), lte(orders.placedAt, dayEnd)));

    // 4. Count cancelled orders
    const [cancelledData] = await db
      .select({
        count: count(orders.id),
      })
      .from(orders)
      .where(
        and(
          gte(orders.placedAt, dayStart),
          lte(orders.placedAt, dayEnd),
          eq(orders.status, 'cancelled')
        )
      );

    const revenue = parseFloat(revenueData?.totalRevenue || '0');
    const cost = parseFloat(costData?.totalCost || '0');
    const profit = revenue - cost;

    // 5. Update or Insert into daily_metrics
    await db
      .insert(dailyMetrics)
      .values({
        date: dayStart,
        revenue: revenue.toFixed(2),
        ordersCount: revenueData?.ordersCount || 0,
        customersCount: Number(customerData?.count) || 0,
        cancelledCount: Number(cancelledData?.count) || 0,
        totalCost: cost.toFixed(2),
        netProfit: profit.toFixed(2),
        updatedAt: new Date(),
      })
      .onDuplicateKeyUpdate({
        set: {
          revenue: revenue.toFixed(2),
          ordersCount: revenueData?.ordersCount || 0,
          customersCount: Number(customerData?.count) || 0,
          cancelledCount: Number(cancelledData?.count) || 0,
          totalCost: cost.toFixed(2),
          netProfit: profit.toFixed(2),
          updatedAt: new Date(),
        },
      });
  }

  return { success: true, processedDays: dates.length };
}
