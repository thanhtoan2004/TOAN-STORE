import 'dotenv/config';
import { executeQuery, pool } from '../src/lib/db/mysql';
import { encrypt } from '../src/lib/encryption';

async function migrate() {
    console.log('--- STARTING PRIORITY 1 DB FIXES ---');
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // ==========================================
        // 1. INVENTORY FIX
        // ==========================================
        console.log('\n[1/4] Fixing Negative Inventory...');
        const [invUpdateResult]: any = await connection.execute('UPDATE inventory SET quantity = 0 WHERE quantity < 0');
        console.log(`› Reset negative quantities to 0. Rows affected: ${invUpdateResult.affectedRows || 0}`);

        console.log('[2/4] Adding Inventory Constraint...');
        try {
            await connection.execute('ALTER TABLE inventory ADD CONSTRAINT chk_inventory_non_negative CHECK (quantity >= 0)');
            console.log('› Added CHECK constraint successfully.');
        } catch (e: any) {
            if (e.code === 'ER_DUP_CONSTRAINT_NAME') {
                console.log('› CHECK constraint already exists, skipping.');
            } else {
                throw e;
            }
        }

        // ==========================================
        // 2. SCHEMA UPDATE FOR ENCRYPTION (orders & user_addresses)
        // ==========================================
        console.log('\n[3/4] Updating Schemas for PII Data (orders, user_addresses)...');

        const addColumnSafe = async (table: string, col: string, definition: string) => {
            try {
                // Check if exists first to be idempotent
                const [check]: any = await connection.execute(`SHOW COLUMNS FROM ${table} LIKE '${col}'`);
                if (check && check.length === 0) {
                    await connection.execute(`ALTER TABLE ${table} ADD COLUMN ${col} ${definition}`);
                    console.log(`› Added ${col} to ${table}`);
                } else {
                    console.log(`› Column ${col} already exists in ${table}, skipping creation.`);
                }
            } catch (e) {
                console.error(`Error adding column ${col} to ${table}`, e);
                throw e;
            }
        };

        await addColumnSafe('user_addresses', 'phone_encrypted', 'TEXT AFTER phone');
        await addColumnSafe('user_addresses', 'address_encrypted', 'TEXT AFTER address_line');
        await addColumnSafe('user_addresses', 'is_encrypted', 'BOOLEAN DEFAULT FALSE');

        await addColumnSafe('orders', 'phone_encrypted', 'TEXT AFTER phone');
        await addColumnSafe('orders', 'email_encrypted', 'TEXT AFTER email');
        await addColumnSafe('orders', 'is_encrypted', 'BOOLEAN DEFAULT FALSE');

        console.log('\n[4/4] Migrating Encrypted Data to New Columns...');

        // 2.1 Migrate Addresses
        const [addresses]: any = await connection.execute('SELECT id, phone, address_line FROM user_addresses');
        let addrMigrated = 0;
        for (const addr of addresses) {
            let pEnc = null;
            let aEnc = null;
            let shouldUpdate = false;

            // Check if existing phone is encrypted (contains ':')
            if (addr.phone && addr.phone.includes(':')) {
                pEnc = addr.phone;
                shouldUpdate = true;
            } else if (addr.phone) {
                // Encrypting raw data
                pEnc = encrypt(addr.phone);
                shouldUpdate = true;
            }

            if (addr.address_line && addr.address_line.includes(':')) {
                aEnc = addr.address_line;
                shouldUpdate = true;
            } else if (addr.address_line) {
                // Encrypting raw data
                aEnc = encrypt(addr.address_line);
                shouldUpdate = true;
            }

            if (shouldUpdate) {
                // Move encrypted data to new column, clear original column to protect raw data
                await connection.execute(
                    'UPDATE user_addresses SET phone_encrypted = ?, address_encrypted = ?, phone = "***", address_line = "***", is_encrypted = TRUE WHERE id = ?',
                    [pEnc, aEnc, addr.id]
                );
                addrMigrated++;
            }
        }
        console.log(`› Migrated ${addrMigrated} addresses.`);

        // 2.2 Migrate Orders
        const [orders]: any = await connection.execute('SELECT id, phone, email, shipping_address_snapshot FROM orders');
        let orderMigrated = 0;
        for (const order of orders) {
            let pEnc = null;
            let eEnc = null;
            let shouldUpdate = false;

            if (order.phone && order.phone.includes(':')) {
                pEnc = order.phone;
                shouldUpdate = true;
            } else if (order.phone) {
                pEnc = encrypt(order.phone);
                shouldUpdate = true;
            }

            if (order.email && order.email.includes(':')) {
                eEnc = order.email;
                shouldUpdate = true;
            } else if (order.email) {
                eEnc = encrypt(order.email);
                shouldUpdate = true;
            }

            // Handle snapshot encryption if not done yet
            let updatedSnapshotStr = order.shipping_address_snapshot;
            if (order.shipping_address_snapshot) {
                try {
                    const snap = typeof order.shipping_address_snapshot === 'string'
                        ? JSON.parse(order.shipping_address_snapshot) : order.shipping_address_snapshot;

                    let snapChanged = false;
                    if (snap.phone && !snap.phone.includes(':')) {
                        snap.phone = encrypt(snap.phone);
                        snapChanged = true;
                    }
                    if (snap.address_line && !snap.address_line.includes(':')) {
                        snap.address_line = encrypt(snap.address_line);
                        snapChanged = true;
                    }
                    if (snap.address && !snap.address.includes(':')) {
                        snap.address = encrypt(snap.address);
                        snapChanged = true;
                    }

                    if (snapChanged) {
                        updatedSnapshotStr = JSON.stringify(snap);
                        shouldUpdate = true;
                    }

                } catch (err) {
                    console.error('Failed to parse order snapshot for ID', order.id);
                }
            }

            if (shouldUpdate) {
                await connection.execute(
                    'UPDATE orders SET phone_encrypted = ?, email_encrypted = ?, phone = "***", email = "***", shipping_address_snapshot = ?, is_encrypted = TRUE WHERE id = ?',
                    [pEnc, eEnc, updatedSnapshotStr, order.id]
                );
                orderMigrated++;
            }
        }
        console.log(`› Migrated ${orderMigrated} orders.`);

        await connection.commit();
        console.log('\n✅ ALL DB FIXES APPLIED SUCCESSFULLY');
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
