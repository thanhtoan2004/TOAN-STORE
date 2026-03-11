const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function verifyPhase15() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'toan_store',
  });

  console.log('--- Phase 15 Verification ---');

  try {
    // 1. Triggers
    const [triggers] = await connection.query(
      `
      SELECT TRIGGER_NAME FROM information_schema.TRIGGERS 
      WHERE TRIGGER_SCHEMA = ? AND EVENT_OBJECT_TABLE = 'inventory'
    `,
      [process.env.DB_NAME || 'toan_store']
    );
    const triggerNames = triggers.map((t) => t.TRIGGER_NAME);
    console.log('Inventory Triggers:', triggerNames.join(', '));
    if (
      triggerNames.includes('trg_inventory_before_insert') &&
      triggerNames.includes('trg_inventory_before_update')
    ) {
      console.log('✅ Inventory triggers restored.');
    } else {
      console.error('❌ Missing inventory triggers!');
    }

    // 2. Orders FK & Index
    const [ordersCols] = await connection.query(
      `
      SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'coupon_id'
    `,
      [process.env.DB_NAME || 'toan_store']
    );
    const fkExists = ordersCols.some((c) => c.CONSTRAINT_NAME === 'fk_orders_coupon_id');
    console.log('Orders coupon_id FK:', fkExists ? '✅ Found' : '❌ Missing');

    // 3. User Encryption Rename & Type
    const [userCols] = await connection.query(
      `
      SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME IN ('is_encrypted', 'is_email_encrypted', 'email_encrypted')
    `,
      [process.env.DB_NAME || 'toan_store']
    );

    const isEncryptedCol = userCols.find((c) => c.COLUMN_NAME === 'is_encrypted');
    const emailEncryptedCol = userCols.find((c) => c.COLUMN_NAME === 'email_encrypted');
    const isEmailEncryptedCol = userCols.find((c) => c.COLUMN_NAME === 'is_email_encrypted');

    console.log('Users is_encrypted flag:', isEncryptedCol ? '✅ Verified' : '❌ Missing');
    console.log(
      'Users is_email_encrypted (old):',
      isEmailEncryptedCol ? '❌ Still exists (Remove manually)' : '✅ Removed'
    );
    console.log(
      'Users email_encrypted type:',
      emailEncryptedCol && emailEncryptedCol.DATA_TYPE === 'text'
        ? '✅ Changed to TEXT'
        : '❌ Still ' + (emailEncryptedCol ? emailEncryptedCol.DATA_TYPE : 'Missing')
    );

    // 4. COD Payment status backfill
    const [pendingCOD] = await connection.query(`
      SELECT COUNT(*) as count FROM orders 
      WHERE status = 'delivered' AND payment_method IN ('cod', 'Thanh toán khi nhận hàng') AND payment_status = 'pending'
    `);
    console.log(
      'Delivered COD orders with pending payment:',
      pendingCOD[0].count === 0 ? '✅ 0 (Fixed)' : '❌ ' + pendingCOD[0].count + ' remaining'
    );

    // 5. Collation
    const [collation] = await connection.query(
      `
      SELECT TABLE_COLLATION FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'product_embeddings'
    `,
      [process.env.DB_NAME || 'toan_store']
    );
    console.log(
      'product_embeddings collation:',
      collation[0].TABLE_COLLATION === 'utf8mb4_0900_ai_ci'
        ? '✅ Synced'
        : '❌ Still ' + collation[0].TABLE_COLLATION
    );

    // 6. Lockout Standardization
    const [lockoutCols] = await connection.query(
      `
        SELECT COLUMN_NAME FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'gift_card_lockouts' AND COLUMN_NAME = 'lockout_until'
    `,
      [process.env.DB_NAME || 'toan_store']
    );
    console.log(
      'Gift Card Lockouts Naming:',
      lockoutCols.length > 0 ? '✅ Standardized' : '❌ Still locked_until'
    );

    console.log('--- Verification Complete ---');
  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await connection.end();
  }
}

verifyPhase15();
