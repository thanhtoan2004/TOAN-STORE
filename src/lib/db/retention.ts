import { executeQuery } from './mysql';

/**
 * Data Retention Service
 * Handles purging of old or soft-deleted data to comply with privacy policies
 */

const RETENTION_DAYS = 30;

export async function purgeSoftDeletedRecords() {
    console.log(`[Retention] Starting purge for records soft-deleted more than ${RETENTION_DAYS} days ago...`);

    try {
        // 1. Purge deleted Users
        const usersResult: any = await executeQuery(
            `DELETE FROM users WHERE deleted_at IS NOT NULL AND deleted_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
            [RETENTION_DAYS]
        );
        console.log(`[Retention] Purged ${usersResult.affectedRows || 0} deleted users.`);

        // 2. Purge deleted Categories
        const categoriesResult: any = await executeQuery(
            `DELETE FROM categories WHERE deleted_at IS NOT NULL AND deleted_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
            [RETENTION_DAYS]
        );
        console.log(`[Retention] Purged ${categoriesResult.affectedRows || 0} deleted categories.`);

        // 3. Purge deleted Products
        const productsResult: any = await executeQuery(
            `DELETE FROM products WHERE deleted_at IS NOT NULL AND deleted_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
            [RETENTION_DAYS]
        );
        console.log(`[Retention] Purged ${productsResult.affectedRows || 0} deleted products.`);

        // 4. Purge deleted Coupons/Vouchers
        const couponsResult: any = await executeQuery(
            `DELETE FROM coupons WHERE deleted_at IS NOT NULL AND deleted_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
            [RETENTION_DAYS]
        );
        console.log(`[Retention] Purged ${couponsResult.affectedRows || 0} deleted coupons.`);

        return {
            success: true,
            details: {
                users: usersResult.affectedRows,
                categories: categoriesResult.affectedRows,
                products: productsResult.affectedRows,
                coupons: couponsResult.affectedRows
            }
        };
    } catch (error) {
        console.error('[Retention] Purge failed:', error);
        throw error;
    }
}
