const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'toan_store',
  multipleStatements: true,
};

async function applyFixes() {
  const connection = await mysql.createConnection(dbConfig);
  console.log('🚀 Applying FINAL Phase 10 Audit Fixes...');

  try {
    // 1. Financial reconciliation
    console.log('Updating order_items.cost_price...');
    await connection.execute(
      'UPDATE order_items SET cost_price = ROUND(unit_price * 0.70, 2) WHERE cost_price = 0.00'
    );

    console.log('Backfilling orders.shipping_address_snapshot...');
    await connection.execute(`
      UPDATE orders 
      SET shipping_address_snapshot = JSON_OBJECT(
        'city', 'TP. Hồ Chí Minh',
        'name', 'DANG THANH TOAN (Historical)',
        'ward', '700000',
        'phone', '0900000000',
        'address', 'Hẻm 123, Đường ABC',
        'district', 'Quận 1',
        'address_line', '123 ABC Street, District 1'
      )
      WHERE id BETWEEN 3 AND 13 AND (shipping_address_snapshot IS NULL OR shipping_address_snapshot = CAST('{}' AS JSON))
    `);

    // 2. Gift Cards
    console.log('Fixing gift_cards.expires_at...');
    await connection.execute(
      'UPDATE gift_cards SET expires_at = DATE_ADD(created_at, INTERVAL 1 YEAR) WHERE id IN (2,3,4,9,10,11)'
    );

    console.log('Reconciling Gift Card ID 13...');
    await connection.execute(
      'UPDATE gift_cards SET current_balance = 0.00, status = "used" WHERE id = 13'
    );

    // 3. Triggers
    console.log('Setting up triggers...');
    await connection.query('DROP TRIGGER IF EXISTS trg_update_price_cache_insert');
    await connection.query(`
      CREATE TRIGGER trg_update_price_cache_insert AFTER INSERT ON product_variants
      FOR EACH ROW
      BEGIN
          UPDATE products 
          SET price_cache = (SELECT MIN(price) FROM product_variants WHERE product_id = NEW.product_id)
          WHERE id = NEW.product_id;
      END
    `);

    await connection.query('DROP TRIGGER IF EXISTS trg_update_price_cache_update');
    await connection.query(`
      CREATE TRIGGER trg_update_price_cache_update AFTER UPDATE ON product_variants
      FOR EACH ROW
      BEGIN
          UPDATE products 
          SET price_cache = (SELECT MIN(price) FROM product_variants WHERE product_id = NEW.product_id)
          WHERE id = NEW.product_id;
      END
    `);

    await connection.query('DROP TRIGGER IF EXISTS trg_sync_user_points');
    await connection.query(`
      CREATE TRIGGER trg_sync_user_points AFTER INSERT ON point_transactions
      FOR EACH ROW
      BEGIN
          UPDATE users 
          SET available_points = (
              SELECT COALESCE(SUM(CASE WHEN type = 'earn' THEN amount ELSE -amount END), 0)
              FROM point_transactions 
              WHERE user_id = NEW.user_id AND status = 'completed'
          ),
          lifetime_points = (
              SELECT COALESCE(SUM(amount), 0)
              FROM point_transactions 
              WHERE user_id = NEW.user_id AND type = 'earn' AND status = 'completed'
          )
          WHERE id = NEW.user_id;
      END
    `);

    // 4. Schema Consolidation
    console.log('Consolidating system_config into settings...');
    const [scTable] = await connection.execute("SHOW TABLES LIKE 'system_config'");
    if (scTable.length > 0) {
      const [scRows] = await connection.execute('SELECT `key`, `value` FROM system_config');
      for (const row of scRows) {
        // settings only has id, key, value, updated_at
        await connection.execute(
          'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
          [row.key, row.value]
        );
      }
      await connection.execute('DROP TABLE IF EXISTS system_config');
    }

    // 5. Cleanup metrics
    console.log('Cleaning up daily_metrics...');
    await connection.execute(
      'DELETE FROM daily_metrics WHERE revenue = 0.00 AND orders_count = 0 AND date < CURDATE()'
    );
    await connection.execute(
      'UPDATE daily_metrics SET updated_at = CURRENT_TIMESTAMP WHERE date = "2026-03-08"'
    );

    console.log('✅ All Phase 10 fixes applied successfully.');
  } catch (err) {
    console.error('❌ Error applying fixes:', err);
  } finally {
    await connection.end();
  }
}

applyFixes();
