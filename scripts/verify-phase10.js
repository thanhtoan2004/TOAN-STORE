const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'toan_store',
};

async function verify() {
  const connection = await mysql.createConnection(dbConfig);
  console.log('--- FINAL PHASE 10 VERIFICATION REPORT ---');

  try {
    // 1. Financials
    const [costPriceRows] = await connection.execute(
      'SELECT COUNT(*) as count FROM order_items WHERE cost_price = 0.00'
    );
    console.log(`Zero cost items remaining: ${costPriceRows[0].count}`);

    const [addressRows] = await connection.execute(
      'SELECT id FROM orders WHERE id BETWEEN 3 AND 13 AND (shipping_address_snapshot IS NULL OR shipping_address_snapshot = CAST("{}" AS JSON))'
    );
    console.log(`Orders missing address snapshot (3-13): ${addressRows.length}`);

    // 2. Gift Cards
    const [gcRows] = await connection.execute(
      'SELECT id, expires_at FROM gift_cards WHERE id = 11'
    );
    if (gcRows.length > 0) {
      console.log(`Gift Card 11 expiry year: ${gcRows[0].expires_at.getFullYear()}`);
    }

    const [gc13Rows] = await connection.execute(
      'SELECT current_balance, status FROM gift_cards WHERE id = 13'
    );
    if (gc13Rows.length > 0) {
      console.log(
        `Gift Card 13 Reconciliation: Balance=${gc13Rows[0].current_balance}, Status=${gc13Rows[0].status}`
      );
    }

    // 3. Triggers Test (Price Cache)
    const [variant] = await connection.execute(
      'SELECT product_id, price FROM product_variants WHERE id = 1'
    );
    if (variant.length > 0) {
      const productId = variant[0].product_id;
      const originalPrice = variant[0].price;
      console.log(`Testing Price Cache Trigger for Product ${productId}...`);

      await connection.execute('UPDATE product_variants SET price = price + 1000 WHERE id = 1');
      const [product] = await connection.execute('SELECT price_cache FROM products WHERE id = ?', [
        productId,
      ]);
      console.log(`Price Cache after update: ${product[0].price_cache}`);

      // Revert
      await connection.execute('UPDATE product_variants SET price = ? WHERE id = 1', [
        originalPrice,
      ]);
      const [revertedProduct] = await connection.execute(
        'SELECT price_cache FROM products WHERE id = ?',
        [productId]
      );
      console.log(`Price Cache after revert: ${revertedProduct[0].price_cache}`);
    }

    // 4. Schema Consolidation
    const [tables] = await connection.execute("SHOW TABLES LIKE 'system_config'");
    console.log(`system_config table dropped?: ${tables.length === 0}`);

    const [settingsCount] = await connection.execute('SELECT COUNT(*) as count FROM settings');
    console.log(`Total settings count: ${settingsCount[0].count}`);

    // 5. Metrics
    const [metricRows] = await connection.execute(
      'SELECT date, updated_at FROM daily_metrics WHERE date = "2026-03-08"'
    );
    if (metricRows.length > 0) {
      const updated = new Date(metricRows[0].updated_at);
      const now = new Date();
      console.log(`2026-03-08 metric updated recently?: ${now - updated < 3600000}`); // Less than 1 hour
    }

    console.log('--- END OF REPORT ---');
  } catch (err) {
    console.error('❌ Verification Error:', err);
  } finally {
    await connection.end();
  }
}

verify().catch(console.error);
