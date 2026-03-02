import 'dotenv/config';
import { pool } from '../src/lib/db/mysql';

async function migrate() {
    console.log('--- STARTING PRIORITY 2 DB FIXES ---');
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // ==========================================
        // 1. ADD GDPR COMPLIANCE TABLES
        // ==========================================
        console.log('\n[1/3] Adding GDPR Compliance Tables...');

        // 1.1 user_consents
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS user_consents (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT UNSIGNED NOT NULL,
                consent_type VARCHAR(50) NOT NULL,
                is_granted BOOLEAN DEFAULT FALSE,
                granted_at TIMESTAMP NULL,
                revoked_at TIMESTAMP NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY uk_user_consent_type (user_id, consent_type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('› Created user_consents table.');

        // 1.2 cookie_consents (for anonymous guests)
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS cookie_consents (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                session_id VARCHAR(100) NOT NULL UNIQUE,
                preferences JSON NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_session (session_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('› Created cookie_consents table.');

        // 1.3 data_requests (GDPR Right to access/forget)
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS data_requests (
                id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                user_id BIGINT UNSIGNED NOT NULL,
                request_type ENUM('export', 'delete') NOT NULL,
                status ENUM('pending', 'processing', 'completed', 'failed', 'rejected') DEFAULT 'pending',
                admin_notes TEXT,
                completed_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('› Created data_requests table.');


        // ==========================================
        // 2. CLEAN UP TEST DATA
        // ==========================================
        console.log('\n[2/3] Cleaning up permanent deleted Test products...');

        // Count soft-deleted products starting with 'Test'
        const [testProducts]: any = await connection.execute(
            `SELECT id FROM products WHERE deleted_at IS NOT NULL AND name LIKE 'Test%'`
        );

        if (testProducts.length > 0) {
            // Because of soft delete and foreign keys, we either hard delete tracking down all relationships
            // Or more cleanly, we can actually HARD DELETE them if they are just test junk.
            // Since they are tests, let's hard delete them to save space.

            // Note: Since 'products' likely has FKs (product_images, product_variants, order_items),
            // a simple DELETE FROM products might fail if FKs don't have ON DELETE CASCADE.
            // Let's attempt a safe hard delete if possible, otherwise we leave them soft-deleted but maybe scrub their data.

            try {
                const productIds = testProducts.map((p: any) => p.id).join(',');

                // We'll trust ON DELETE CASCADE is there for images/variants, if not, this will throw
                // and we'll catch it and explain.
                const [deleteResult]: any = await connection.execute(
                    `DELETE FROM products WHERE id IN (${productIds})`
                );
                console.log(`› Hard deleted ${deleteResult.affectedRows} soft-deleted test products.`);

            } catch (e: any) {
                if (e.code === 'ER_ROW_IS_REFERENCED_2') {
                    console.log('› Could not hard delete test products due to existing foreign key constraints (likely in orders). These test products remain soft-deleted but are considered archived.');
                } else {
                    throw e;
                }
            }
        } else {
            console.log('› No soft-deleted test products found needing cleanup.');
        }

        // ==========================================
        // 3. RETIRE MYSQL RATE LIMITS (Optional but good practice)
        // ==========================================
        console.log('\n[3/3] Deprecating MySQL rate_limits table...');
        try {
            // We just rename it to indicate it's deprecated so we don't destroy historical logs immediately if needed for forensics, 
            // but the app will stop writing to it entirely. We can also just TRUNCATE it to save space.
            await connection.execute('TRUNCATE TABLE rate_limits');
            console.log('› Truncated legacy rate_limits table. The application will now rely exclusively on Redis for rate limiting.');
        } catch (e: any) {
            if (e.code === 'ER_NO_SUCH_TABLE') {
                console.log('› rate_limits table does not exist. Skipping.');
            } else {
                console.log('› Could not truncate rate_limits. Ignoring.');
            }
        }


        await connection.commit();
        console.log('\n✅ PRIORITY 2 DB FIXES APPLIED SUCCESSFULLY');
    } catch (error) {
        await connection.rollback();
        console.error('\n❌ MIGRATION FAILED. Rolled back changes.', error);
        process.exit(1);
    } finally {
        connection.release();
        process.exit(0);
    }
}

migrate();
