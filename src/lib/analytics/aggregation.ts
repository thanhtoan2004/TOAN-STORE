import { db } from '@/lib/db/drizzle';
import { orders, users, dailyMetrics } from '@/lib/db/schema';
import { eq, sql, and, gte, lt } from 'drizzle-orm';
import { logger } from '@/lib/logger';

/**
 * Aggregates business metrics for a specific date and stores them in daily_metrics.
 * Date format: YYYY-MM-DD
 */
export async function aggregateDailyMetrics(dateString: string) {
    const targetDate = new Date(dateString);
    const nextDate = new Date(targetDate);
    nextDate.setDate(targetDate.getDate() + 1);

    try {
        logger.info(`Aggregating metrics for ${dateString}...`);

        // 1. Calculate Revenue and Order Counts
        // We only count non-cancelled orders for revenue
        const orderStats = await db.select({
            totalRevenue: sql<string>`SUM(CASE WHEN ${orders.status} != 'cancelled' THEN ${orders.total} ELSE 0 END)`,
            ordersCount: sql<number>`COUNT(*)`,
            cancelledCount: sql<number>`SUM(CASE WHEN ${orders.status} = 'cancelled' THEN 1 ELSE 0 END)`
        })
            .from(orders)
            .where(
                and(
                    gte(orders.createdAt, targetDate),
                    lt(orders.createdAt, nextDate)
                )
            );

        const stats = orderStats[0] || { totalRevenue: '0', ordersCount: 0, cancelledCount: 0 };

        // 2. Calculate New Customers
        const customerStats = await db.select({
            count: sql<number>`COUNT(*)`
        })
            .from(users)
            .where(
                and(
                    gte(users.createdAt, targetDate),
                    lt(users.createdAt, nextDate)
                )
            );

        const newCustomers = customerStats[0]?.count || 0;

        // 3. Upsert into daily_metrics
        await db.insert(dailyMetrics).values({
            date: targetDate,
            revenue: stats.totalRevenue || '0.00',
            ordersCount: stats.ordersCount || 0,
            customersCount: newCustomers,
            cancelledCount: stats.cancelledCount || 0,
            updatedAt: new Date()
        }).onDuplicateKeyUpdate({
            set: {
                revenue: stats.totalRevenue || '0.00',
                ordersCount: stats.ordersCount || 0,
                customersCount: newCustomers,
                cancelledCount: stats.cancelledCount || 0,
                updatedAt: new Date()
            }
        });

        logger.info(`Successfully aggregated metrics for ${dateString}.`);
        return true;
    } catch (error) {
        logger.error(error, `Failed to aggregate metrics for ${dateString}`);
        throw error;
    }
}
