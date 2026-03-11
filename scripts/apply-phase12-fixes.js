const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'toan_store',
  multipleStatements: true,
};

async function applyPhase12Fixes() {
  const connection = await mysql.createConnection(dbConfig);
  console.log('🚀 Applying Refined Phase 12 Database Hardening...');

  try {
    const migrationPath = path.join(
      __dirname,
      '../src/lib/db/migrations/2026_03_08_2300_step17_final_hardening.sql'
    );
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Split by DELIMITER if present, otherwise run as is
    if (sql.includes('DELIMITER //')) {
      // Basic splitting for this specific migration
      const parts = sql.split('DELIMITER //');
      const firstPart = parts[0];
      const middlePart = parts[1].split('//')[0];
      const lastPart = parts[1].split('DELIMITER ;')[1];

      console.log('Running main schema changes...');
      await connection.query(firstPart);

      console.log('Running trigger with custom delimiter...');
      await connection.query(middlePart);

      console.log('Running final cleanup...');
      await connection.query(lastPart);
    } else {
      await connection.query(sql);
    }

    console.log('✅ Phase 12 Migration Applied Successfully.');

    // 4. Backfill Costs in Products (Secondary check/Logic)
    console.log('Syncing product cost_price averages...');
    await connection.execute(`
            UPDATE products p
            SET p.cost_price = (
                SELECT COALESCE(AVG(pv.price * 0.7), 0) 
                FROM product_variants pv 
                WHERE pv.product_id = p.id
            )
            WHERE p.cost_price = 0.00 OR p.cost_price IS NULL
        `);

    // 5. Final Metrics Correction for 2026 Feb/March
    console.log('Re-aggregating metrics for 2026...');
    await connection.execute(`
            INSERT INTO daily_metrics (date, revenue, orders_count, total_cost, net_profit, updated_at)
            SELECT 
                DATE(placed_at) as d,
                SUM(total) as rev,
                COUNT(*) as ord,
                SUM((SELECT SUM(cost_price * quantity) FROM order_items WHERE order_id = orders.id)) as cost,
                SUM(total - (SELECT SUM(cost_price * quantity) FROM order_items WHERE order_id = orders.id)) as profit,
                NOW()
            FROM orders
            WHERE status IN ('delivered', 'paid') AND placed_at >= '2026-01-01'
            GROUP BY d
            ON DUPLICATE KEY UPDATE 
                revenue = VALUES(revenue),
                orders_count = VALUES(orders_count),
                total_cost = VALUES(total_cost),
                net_profit = VALUES(net_profit),
                updated_at = NOW()
        `);
  } catch (err) {
    console.error('❌ Error applying Phase 12 fixes:', err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

applyPhase12Fixes();
