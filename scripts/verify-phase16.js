const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function verifyPhase16() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'toan_store',
  });

  console.log('--- Phase 16 Verification ---');

  try {
    // 1. Price Variance
    const [variant1] = await connection.query('SELECT price FROM product_variants WHERE id = 1');
    console.log(
      'Variant 1 Price:',
      variant1[0].price === '3829000.00' ? '✅ 3,829,000' : '❌ ' + variant1[0].price
    );

    const [product1] = await connection.query('SELECT price_cache FROM products WHERE id = 1');
    console.log(
      'Product 1 Price Cache:',
      product1[0].price_cache === '3829000.00' ? '✅ 3,829,000' : '❌ ' + product1[0].price_cache
    );

    // 2. Order Total
    const [order3] = await connection.query('SELECT total FROM orders WHERE id = 3');
    console.log(
      'Order 3 Total:',
      order3[0].total === '2928840.00' ? '✅ 2,928,840' : '❌ ' + order3[0].total
    );

    // 3. Voucher FK
    const [ordersCols] = await connection.query(
      `
      SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'voucher_id'
    `,
      [process.env.DB_NAME || 'toan_store']
    );
    const fkExists = ordersCols.some((c) => c.CONSTRAINT_NAME === 'fk_orders_voucher_id');
    console.log('Orders voucher_id FK:', fkExists ? '✅ Found' : '❌ Missing');

    // 4. Payment Provider ENUM
    const [txCols] = await connection.query(
      `
      SELECT COLUMN_TYPE FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'payment_provider'
    `,
      [process.env.DB_NAME || 'toan_store']
    );
    const enumVal = txCols[0].COLUMN_TYPE;
    console.log(
      'Transactions Provider ENUM:',
      enumVal.includes('zalopay') && enumVal.includes('bank_transfer') && enumVal.includes('cod')
        ? '✅ Expanded'
        : '❌ ' + enumVal
    );

    // 5. Cleanup checks
    const [activeExpiredFS] = await connection.query(
      `SELECT COUNT(*) as count FROM flash_sales WHERE end_time < NOW() AND is_active = 1`
    );
    console.log(
      'Active Expired Flash Sales:',
      activeExpiredFS[0].count === 0 ? '✅ 0' : '❌ ' + activeExpiredFS[0].count
    );

    const [expiredCoupons] = await connection.query(
      `SELECT COUNT(*) as count FROM coupons WHERE ends_at < NOW() AND deleted_at IS NULL`
    );
    console.log(
      'Expired Active Coupons:',
      expiredCoupons[0].count === 0 ? '✅ 0' : '❌ ' + expiredCoupons[0].count
    );

    console.log('--- Verification Complete ---');
  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await connection.end();
  }
}

verifyPhase16();
