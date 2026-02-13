import { executeQuery, pool } from '../mysql';
import { encrypt } from '@/lib/encryption';

/**
 * Migration Utility: Encrypt existing plain text PII data
 */
export async function migrateExistingDataToEncryption() {
    console.log('[Migration] Starting PII encryption migration...');
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Migrate Users Phone
        const [users]: any = await connection.execute('SELECT id, phone FROM users WHERE phone IS NOT NULL AND phone NOT LIKE "%:%"');
        console.log(`[Migration] Found ${users.length} users to migrate.`);
        for (const user of users) {
            await connection.execute('UPDATE users SET phone = ? WHERE id = ?', [encrypt(user.phone), user.id]);
        }

        // 2. Migrate User Addresses
        const [addresses]: any = await connection.execute('SELECT id, phone, address_line FROM user_addresses WHERE phone NOT LIKE "%:%" OR address_line NOT LIKE "%:%"');
        console.log(`[Migration] Found ${addresses.length} addresses to migrate.`);
        for (const addr of addresses) {
            await connection.execute(
                'UPDATE user_addresses SET phone = ?, address_line = ? WHERE id = ?',
                [encrypt(addr.phone), encrypt(addr.address_line), addr.id]
            );
        }

        // 3. Migrate Orders
        const [orders]: any = await connection.execute('SELECT id, phone, email, shipping_address_snapshot FROM orders WHERE phone NOT LIKE "%:%" OR email NOT LIKE "%:%"');
        console.log(`[Migration] Found ${orders.length} orders to migrate.`);
        for (const order of orders) {
            let encryptedSnapshot = order.shipping_address_snapshot;
            if (order.shipping_address_snapshot) {
                try {
                    const snapshot = typeof order.shipping_address_snapshot === 'string'
                        ? JSON.parse(order.shipping_address_snapshot)
                        : order.shipping_address_snapshot;

                    // Only encrypt if not already encrypted (simple check)
                    if (snapshot.phone && !snapshot.phone.includes(':')) {
                        snapshot.phone = encrypt(snapshot.phone);
                        snapshot.address = encrypt(snapshot.address);
                        if (snapshot.address_line) snapshot.address_line = encrypt(snapshot.address_line);
                        encryptedSnapshot = JSON.stringify(snapshot);
                    }
                } catch (e) {
                    console.error(`[Migration] Error processing snapshot for order ${order.id}`, e);
                }
            }

            await connection.execute(
                'UPDATE orders SET phone = ?, email = ?, shipping_address_snapshot = ? WHERE id = ?',
                [encrypt(order.phone), encrypt(order.email), encryptedSnapshot, order.id]
            );
        }

        await connection.commit();
        console.log('[Migration] PII encryption migration completed successfully.');
        return { success: true, migrated: { users: users.length, addresses: addresses.length, orders: orders.length } };
    } catch (error) {
        await connection.rollback();
        console.error('[Migration] PII migration failed:', error);
        throw error;
    } finally {
        connection.release();
    }
}
