const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'toan_store',
};

async function verifyPhase11() {
  const connection = await mysql.createConnection(dbConfig);
  console.log('🧪 Verifying Phase 11 Structural Fixes...');

  try {
    // 1. Orders Table
    const [orderCols] = await connection.execute('DESCRIBE orders');
    const fields = orderCols.map((c) => c.Field);
    console.log(
      fields.includes('promotion_code') ? '✅ promotion_code exists' : '❌ promotion_code missing'
    );
    console.log(
      fields.includes('promotion_type') ? '✅ promotion_type exists' : '❌ promotion_type missing'
    );
    console.log(fields.includes('total') ? '✅ total exists' : '❌ total missing');

    // 2. Settings Table
    const [siteName] = await connection.execute('SELECT * FROM settings WHERE `key` = "site_name"');
    console.log(siteName.length === 0 ? '✅ site_name removed' : '❌ site_name still exists');

    // 3. Inventory Warehouse 2
    const [inv2] = await connection.execute(
      'SELECT COUNT(*) as count FROM inventory WHERE warehouse_id = 2'
    );
    console.log(
      inv2[0].count > 0
        ? `✅ Warehouse 2 has ${inv2[0].count} inventory rows`
        : '❌ Warehouse 2 empty'
    );

    // 4. Trigger test
    console.log('Testing daily_metrics trigger...');
    const todayStr = new Date().toISOString().split('T')[0];
    const [metricsBefore] = await connection.execute(
      'SELECT revenue, orders_count FROM daily_metrics WHERE date = ?',
      [todayStr]
    );
    const revBefore = metricsBefore[0]?.revenue || 0;
    const ordBefore = metricsBefore[0]?.orders_count || 0;

    // Find an order to update
    const [testOrders] = await connection.execute(
      'SELECT id, total FROM orders WHERE status NOT IN ("delivered", "paid") LIMIT 1'
    );
    if (testOrders.length > 0) {
      const orderId = testOrders[0].id;
      const orderTotal = testOrders[0].total;
      console.log(`Updating order ${orderId} status to 'delivered'...`);
      await connection.execute(
        'UPDATE orders SET status = "delivered", updated_at = NOW() WHERE id = ?',
        [orderId]
      );

      const [metricsAfter] = await connection.execute(
        'SELECT revenue, orders_count FROM daily_metrics WHERE date = ?',
        [todayStr]
      );
      const revAfter = metricsAfter[0]?.revenue || 0;
      const ordAfter = metricsAfter[0]?.orders_count || 0;

      if (Number(revAfter) > Number(revBefore) && Number(ordAfter) > Number(ordBefore)) {
        console.log('✅ Trigger active: daily_metrics updated automatically.');
      } else {
        console.log('❌ Trigger failed or metrics did not change correctly.');
      }
    } else {
      console.log('⚠️ No test order found to verify trigger.');
    }

    // 5. User Full Name
    const [testUser] = await connection.execute(
      'SELECT full_name, first_name, last_name FROM users WHERE first_name IS NOT NULL LIMIT 1'
    );
    if (testUser.length > 0) {
      const expected = `${testUser[0].last_name} ${testUser[0].first_name}`;
      console.log(
        testUser[0].full_name.includes(testUser[0].first_name)
          ? `✅ full_name standardized: ${testUser[0].full_name}`
          : `❌ full_name mismatch: ${testUser[0].full_name}`
      );
    }

    // 6. JSON PII Masking
    const [testPII] = await connection.execute(
      'SELECT shipping_address_snapshot FROM orders WHERE is_encrypted = TRUE AND id < 15 LIMIT 1'
    );
    if (testPII.length > 0) {
      const snap = testPII[0].shipping_address_snapshot;
      const phone = snap.phone;
      console.log(
        phone === '***HIDDEN***'
          ? '✅ Old PII masked in JSON'
          : '❌ Old PII still visible or already encrypted'
      );
    }
  } catch (err) {
    console.error('❌ Verification Error:', err);
  } finally {
    await connection.end();
  }
}

verifyPhase11();
