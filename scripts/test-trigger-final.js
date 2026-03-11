const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'toan_store',
};

async function testTrigger() {
  const connection = await mysql.createConnection(dbConfig);
  console.log('Testing trigger with order 4...');
  try {
    const [m1] = await connection.execute(
      'SELECT date, revenue, orders_count FROM daily_metrics WHERE date = "2025-12-07"'
    );
    console.log('Metrics before:', m1[0]);

    console.log('Setting order 4 to pending (reset)...');
    await connection.execute('UPDATE orders SET status = "pending" WHERE id = 4');

    console.log('Setting order 4 to delivered (trigger fire!)...');
    await connection.execute('UPDATE orders SET status = "delivered" WHERE id = 4');

    const [m2] = await connection.execute(
      'SELECT date, revenue, orders_count FROM daily_metrics WHERE date = "2025-12-07"'
    );
    console.log('Metrics after:', m2[0]);

    if (m1.length === 0 || m2[0].orders_count > (m1[0]?.orders_count || 0)) {
      console.log('✅ Success: Metrics updated via trigger.');
    } else {
      console.log('❌ Failure: Metrics did not change.');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await connection.end();
  }
}

testTrigger();
