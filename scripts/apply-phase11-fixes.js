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

async function applyPhase11() {
  const connection = await mysql.createConnection(dbConfig);
  console.log('🚀 Applying Phase 11 Structural Fixes (v2)...');

  try {
    // 1. Promotion & Order Integrity
    console.log('Renaming voucher_code to promotion_code...');
    try {
      await connection.execute(
        'ALTER TABLE `orders` RENAME COLUMN `voucher_code` TO `promotion_code`'
      );
    } catch (e) {
      console.log(' promotion_code already exists or error');
    }

    try {
      await connection.execute(
        "ALTER TABLE `orders` ADD COLUMN `promotion_type` ENUM('voucher', 'coupon', 'none') DEFAULT 'none' AFTER `promotion_code`"
      );
    } catch (e) {
      console.log(' promotion_type already exists or error');
    }

    console.log('Updating promotion types...');
    await connection.execute(
      "UPDATE `orders` SET `promotion_type` = 'voucher' WHERE `promotion_code` IS NOT NULL AND `voucher_discount` > 0"
    );

    // 2. Schema Normalization
    console.log('Dropping redundant coupon_code...');
    try {
      await connection.execute('ALTER TABLE \`coupon_usage\` DROP COLUMN \`coupon_code\`');
    } catch (e) {
      console.log(' coupon_code already dropped or error');
    }

    // 3. Settings Consolidation
    console.log('Consolidating settings metadata...');
    await connection.execute(
      "DELETE FROM `settings` WHERE `key` IN ('site_name', 'site_email', 'site_phone', 'currency')"
    );
    await connection.execute(
      "INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('store_currency', 'VND')"
    );

    // 4. Triggers
    console.log('Creating daily metrics trigger...');
    await connection.query('DROP TRIGGER IF EXISTS trg_daily_metrics_sync');
    await connection.query(`
        CREATE TRIGGER trg_daily_metrics_sync AFTER UPDATE ON orders
        FOR EACH ROW
        BEGIN
            IF (NEW.status = 'delivered' OR NEW.status = 'paid') AND (OLD.status != 'delivered' AND OLD.status != 'paid') THEN
                INSERT INTO daily_metrics (date, revenue, orders_count, total_cost, net_profit, updated_at)
                VALUES (DATE(NEW.placed_at), NEW.total, 1, 
                       (SELECT COALESCE(SUM(cost_price * quantity), 0) FROM order_items WHERE order_id = NEW.id),
                       NEW.total - (SELECT COALESCE(SUM(cost_price * quantity), 0) FROM order_items WHERE order_id = NEW.id),
                       CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE 
                    revenue = revenue + NEW.total,
                    orders_count = orders_count + 1,
                    total_cost = total_cost + (SELECT COALESCE(SUM(cost_price * quantity), 0) FROM order_items WHERE order_id = NEW.id),
                    net_profit = net_profit + (NEW.total - (SELECT COALESCE(SUM(cost_price * quantity), 0) FROM order_items WHERE order_id = NEW.id)),
                    updated_at = CURRENT_TIMESTAMP;
            END IF;
        END
    `);

    // 5. Full Name Standardization
    console.log('Standardizing full names...');
    await connection.execute(`
        UPDATE \`users\` 
        SET \`full_name\` = CONCAT(COALESCE(\`last_name\`, ''), ' ', COALESCE(\`first_name\`, ''))
        WHERE \`full_name\` IS NULL OR \`full_name\` = '' OR \`full_name\` NOT LIKE CONCAT('%', COALESCE(\`first_name\`, ''))
    `);

    // 6. Inventory Backfill
    console.log('Backfilling warehouse 2 inventory...');
    await connection.execute(`
        INSERT IGNORE INTO \`inventory\` (product_variant_id, warehouse_id, quantity, reserved)
        SELECT id, 2, 0, 0 FROM product_variants
    `);

    // 7. PII Masking
    console.log('Masking PII in old snapshots...');
    await connection.execute(`
        UPDATE \`orders\` 
        SET \`shipping_address_snapshot\` = JSON_SET(\`shipping_address_snapshot\`, '$.phone', '***HIDDEN***')
        WHERE JSON_EXTRACT(\`shipping_address_snapshot\`, '$.phone') NOT LIKE '%:%' AND \`is_encrypted\` = TRUE
    `);

    console.log('✅ Phase 11 Fixes Applied.');
  } catch (err) {
    console.error('❌ Phase 11 Failed:', err);
  } finally {
    await connection.end();
  }
}

applyPhase11();
