import { db } from '../drizzle';
import { pointTransactions, users } from '../schema';
import { eq, and, lt, sql, sum } from 'drizzle-orm';
import { logger } from '@/lib/utils/logger';

/**
 * Handles expiration of points that have passed their expiry date.
 * This should be run daily via a cron job.
 */
export async function cleanupExpiredPoints() {
  return await db.transaction(async (tx) => {
    // 1. Find all unexpired 'earn' transactions that have reached their expiry date
    const now = new Date();

    // This is a simplified logic:
    // We look for users who have points expiring today and sum them up.
    // In a production system, you'd need to track which specific points were used vs earned.
    // For this implementation, we'll look at the point_transactions table's expiresAt field.

    const expiredTransactions = await tx
      .select({
        userId: pointTransactions.userId,
        expiredPoints: sum(pointTransactions.points),
      })
      .from(pointTransactions)
      .where(
        and(
          eq(pointTransactions.type, 'earn'),
          lt(pointTransactions.expiresAt, now),
          sql`${pointTransactions.points} > 0` // Only transactions with remaining points (simplified)
        )
      )
      .groupBy(pointTransactions.userId);

    let count = 0;

    for (const record of expiredTransactions) {
      const userId = record.userId;
      const pointsToExpire = Number(record.expiredPoints);

      if (pointsToExpire > 0) {
        // Get current available points
        const [user] = await tx
          .select({ availablePoints: users.availablePoints })
          .from(users)
          .where(eq(users.id, userId))
          .for('update');

        if (user && user.availablePoints > 0) {
          const actualToExpire = Math.min(user.availablePoints, pointsToExpire);

          if (actualToExpire > 0) {
            const newBalance = user.availablePoints - actualToExpire;

            // Update user balance
            await tx.update(users).set({ availablePoints: newBalance }).where(eq(users.id, userId));

            // Log expiration transaction
            await tx.insert(pointTransactions).values({
              userId,
              points: actualToExpire,
              type: 'expire',
              description: 'Điểm thưởng hết hạn sử dụng',
              balanceAfter: newBalance,
              createdAt: now,
            });

            count++;
          }
        }
      }
    }

    logger.info(`[Points Cron] Expired points for ${count} users.`);
    return count;
  });
}
