import { db } from './drizzle';
import { users, categories, products, coupons } from './schema';
import { sql, and, isNotNull, lt } from 'drizzle-orm';

/**
 * Data Retention Service
 * Handles purging of old or soft-deleted data to comply with privacy policies
 */

const RETENTION_DAYS = 30;

export async function purgeSoftDeletedRecords() {
  console.log(
    `[Retention] Starting purge for records soft-deleted more than ${RETENTION_DAYS} days ago...`
  );

  try {
    // 1. Purge deleted Users
    const usersResult = await db
      .delete(users)
      .where(
        and(
          isNotNull(users.deletedAt),
          lt(users.deletedAt, sql`DATE_SUB(NOW(), INTERVAL ${RETENTION_DAYS} DAY)`)
        )
      );
    console.log(`[Retention] Purged ${usersResult[0].affectedRows || 0} deleted users.`);

    // 2. Purge deleted Categories
    const categoriesResult = await db
      .delete(categories)
      .where(
        and(
          isNotNull(categories.deletedAt),
          lt(categories.deletedAt, sql`DATE_SUB(NOW(), INTERVAL ${RETENTION_DAYS} DAY)`)
        )
      );
    console.log(`[Retention] Purged ${categoriesResult[0].affectedRows || 0} deleted categories.`);

    // 3. Purge deleted Products
    const productsResult = await db
      .delete(products)
      .where(
        and(
          isNotNull(products.deletedAt),
          lt(products.deletedAt, sql`DATE_SUB(NOW(), INTERVAL ${RETENTION_DAYS} DAY)`)
        )
      );
    console.log(`[Retention] Purged ${productsResult[0].affectedRows || 0} deleted products.`);

    // 4. Purge deleted Coupons/Vouchers
    const couponsResult = await db
      .delete(coupons)
      .where(
        and(
          isNotNull(coupons.deletedAt),
          lt(coupons.deletedAt, sql`DATE_SUB(NOW(), INTERVAL ${RETENTION_DAYS} DAY)`)
        )
      );
    console.log(`[Retention] Purged ${couponsResult[0].affectedRows || 0} deleted coupons.`);

    return {
      success: true,
      details: {
        users: usersResult[0].affectedRows,
        categories: categoriesResult[0].affectedRows,
        products: productsResult[0].affectedRows,
        coupons: couponsResult[0].affectedRows,
      },
    };
  } catch (error) {
    console.error('[Retention] Purge failed:', error);
    throw error;
  }
}
