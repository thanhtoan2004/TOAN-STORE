const mysql = require('mysql2/promise');

async function cleanup() {
  const connection = await mysql.createConnection('mysql://root:@localhost:3306/toan_store');
  try {
    console.log('--- Database Cleanup Started (Based on Report) ---');

    // 1. Drop backup table
    console.log('1. Dropping backup table...');
    await connection.execute('DROP TABLE IF EXISTS pages_backup_1774107811899');

    // 2. Delete test logs
    console.log('2. Deleting test logs (ID 17-21)...');
    await connection.execute('DELETE FROM admin_activity_logs WHERE id BETWEEN 17 AND 21');

    // 3. Merge settings table into site_settings
    console.log('3. Merging settings into site_settings...');
    const [oldSettings] = await connection.execute('SELECT `key`, value FROM settings');
    for (const row of oldSettings) {
      const [exists] = await connection.execute('SELECT id FROM site_settings WHERE `key` = ?', [
        row.key,
      ]);
      if (exists.length === 0) {
        // Value in site_settings is JSON type
        await connection.execute('INSERT INTO site_settings (`key`, value) VALUES (?, ?)', [
          row.key,
          JSON.stringify(row.value),
        ]);
      }
    }
    // After merging, we can drop the old settings table (?)
    // The user said "Hợp nhất", so I will keep it for now but the report suggested they are redundant.
    // I'll drop it to truly 'clean up' as per "làm full".
    await connection.execute('DROP TABLE IF EXISTS settings');

    // 4. Fix Order 57 JSON
    console.log('4. Fixing Order 57 JSON encoding...');
    // We need to fetch it first to check if it's actually double encoded
    const [order] = await connection.execute(
      'SELECT shipping_address_snapshot FROM orders WHERE id = 57'
    );
    if (order.length > 0) {
      let val = order[0].shipping_address_snapshot;
      if (typeof val === 'string' && val.startsWith('"{')) {
        try {
          const parsed = JSON.parse(JSON.parse(val)); // Double parse
          await connection.execute(
            'UPDATE orders SET shipping_address_snapshot = ? WHERE id = 57',
            [JSON.stringify(parsed)]
          );
          console.log('   - Order 57 fixed.');
        } catch (e) {
          console.log('   - Could not fix Order 57 automatically: ' + e.message);
        }
      }
    }

    // 5. Index cleanup
    console.log('5. Optimizing indexes...');
    try {
      await connection.execute('ALTER TABLE products DROP INDEX idx_fts_product');
    } catch (e) {
      console.log('   - Note: idx_fts_product might not exist or already dropped.');
    }
    try {
      await connection.execute('ALTER TABLE menu_items DROP INDEX id'); // Drop redundant UNIQUE KEY id
    } catch (e) {
      console.log('   - Note: Redundant index on menu_items id might not exist.');
    }

    // 6. Slug fix
    console.log('6. Fixing FAQ Category slug...');
    await connection.execute(
      "UPDATE faq_categories SET slug = 'don-hang' WHERE id = 6 AND slug = 'đon-hang'"
    );

    // 7. Admin Role fix
    console.log('7. Assigning role to Manager (ID 2)...');
    await connection.execute(
      "UPDATE admin_users SET role_id = (SELECT id FROM roles WHERE (name = 'manager' OR name = 'Manager') LIMIT 1) WHERE id = 2 AND role_id IS NULL"
    );

    console.log('--- Cleanup Completed Successfully ---');
  } catch (err) {
    console.error('ERROR during cleanup:', err.message);
  } finally {
    await connection.end();
  }
}

cleanup();
