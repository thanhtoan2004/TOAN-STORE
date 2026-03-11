const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function globalAudit() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'toan_store',
  });

  console.log('=== GLOBAL PROJECT AUDIT (PHASES 1-15) ===\n');

  try {
    const dbName = process.env.DB_NAME || 'toan_store';

    // --- 1. TRIGGERS CHECK ---
    console.log('[1] VERIFYING CRITICAL TRIGGERS...');
    const [triggers] = await connection.query(
      `
      SELECT TRIGGER_NAME, EVENT_OBJECT_TABLE, ACTION_TIMING, EVENT_MANIPULATION 
      FROM information_schema.TRIGGERS 
      WHERE TRIGGER_SCHEMA = ?
    `,
      [dbName]
    );

    const requiredTriggers = [
      'trg_inventory_before_insert',
      'trg_inventory_before_update', // Phase 15/14
      'trg_daily_metrics_sync', // Phase 11
      'trg_sync_user_points', // Phase 10
      'trg_update_price_cache', // Phase 10
      'trg_check_variant_product', // Phase 13
      'trg_enforce_flash_sale_limit', // Phase 10/13
    ];

    const foundTriggers = triggers.map((t) => t.TRIGGER_NAME);
    for (const rt of requiredTriggers) {
      if (foundTriggers.includes(rt)) {
        console.log(`  ✅ Trigger ${rt}: FOUND`);
      } else {
        console.error(`  ❌ Trigger ${rt}: MISSING`);
      }
    }

    // --- 2. FOREIGN KEYS & INDEXES ---
    console.log('\n[2] VERIFYING FOREIGN KEYS & INDEXES...');
    const [constraints] = await connection.query(
      `
      SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = ? AND CONSTRAINT_NAME != 'PRIMARY'
    `,
      [dbName]
    );

    const requiredFKs = [
      { table: 'orders', fk: 'fk_orders_coupon_id' }, // Phase 15
      { table: 'coupon_usage', fk: 'coupon_usage_ibfk_1' }, // Phase 13/Audit
      { table: 'archive_admin_activity_logs', fk: 'fk_archive_admin_user_id' }, // Phase 15
      { table: 'news', fk: 'fk_news_admin_author' }, // Phase 11
    ];

    for (const rfk of requiredFKs) {
      const found = constraints.some(
        (c) => c.TABLE_NAME === rfk.table && c.CONSTRAINT_NAME === rfk.fk
      );
      console.log(
        `  ${found ? '✅' : '❌'} FK ${rfk.fk} on ${rfk.table}: ${found ? 'OK' : 'MISSING'}`
      );
    }

    // --- 3. UNIQUE & CHECK CONSTRAINTS ---
    console.log('\n[3] VERIFYING CONSTRAINTS (UNIQUE/CHECK)...');

    // Unique
    const [uniques] = await connection.query(
      `
      SELECT CONSTRAINT_NAME, TABLE_NAME 
      FROM information_schema.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = ? AND CONSTRAINT_TYPE = 'UNIQUE'
    `,
      [dbName]
    );

    const requiredUniques = [
      { table: 'coupon_usage', name: 'uk_user_coupon' }, // Phase 13
      { table: 'transactions', name: 'uk_provider_tx' }, // Phase 14
    ];
    // Check if they exist (MySQL 8+ might use different naming for UNIQUE indices vs constraints)
    // Note: uk_user_coupon might be an index name.

    // Check constraints (MySQL 8.0.16+)
    const [checks] = await connection.query(
      `
        SELECT CONSTRAINT_NAME, CHECK_CLAUSE 
        FROM information_schema.CHECK_CONSTRAINTS 
        WHERE CONSTRAINT_SCHEMA = ?
    `,
      [dbName]
    );

    const requiredChecks = [
      'chk_available_points_non_negative', // Phase 12
      'chk_flash_sold_not_exceed', // Phase 13
    ];

    for (const rc of requiredChecks) {
      const found = checks.find((c) => c.CONSTRAINT_NAME === rc);
      console.log(`  ${found ? '✅' : '❌'} CHECK ${rc}: ${found ? 'FOUND' : 'MISSING'}`);
    }

    // --- 4. SCHEMA CONSISTENCY & NAMING ---
    console.log('\n[4] VERIFYING SCHEMA CONSISTENCY & NAMING...');

    const [userCols] = await connection.query(
      `
        SELECT COLUMN_NAME, DATA_TYPE, COLUMN_COMMENT 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
    `,
      [dbName]
    );

    const isEncrypted = userCols.find((c) => c.COLUMN_NAME === 'is_encrypted');
    const isEmailEncrypted = userCols.find((c) => c.COLUMN_NAME === 'is_email_encrypted');
    const emailEncrypted = userCols.find((c) => c.COLUMN_NAME === 'email_encrypted');

    console.log(
      `  ${isEncrypted ? '✅' : '❌'} users.is_encrypted: ${isEncrypted ? 'FOUND' : 'MISSING'}`
    );
    console.log(
      `  ${!isEmailEncrypted ? '✅' : '❌'} users.is_email_encrypted (Redundant): ${!isEmailEncrypted ? 'CLEANED' : 'STILL EXISTS'}`
    );
    console.log(
      `  ${emailEncrypted && emailEncrypted.DATA_TYPE === 'text' ? '✅' : '❌'} users.email_encrypted is TEXT: ${emailEncrypted ? emailEncrypted.DATA_TYPE : 'MISSING'}`
    );

    const [lockoutCols] = await connection.query(
      `
        SELECT COLUMN_NAME FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'gift_card_lockouts' AND COLUMN_NAME = 'lockout_until'
    `,
      [dbName]
    );
    console.log(
      `  ${lockoutCols.length > 0 ? '✅' : '❌'} gift_card_lockouts.lockout_until: ${lockoutCols.length > 0 ? 'CORRECT' : 'WRONG NAME (locked_until?)'}`
    );

    // --- 5. DATA QUALITY ---
    console.log('\n[5] VERIFYING DATA QUALITY...');

    const [pendingCOD] = await connection.query(`
      SELECT COUNT(*) as count FROM orders 
      WHERE status = 'delivered' AND payment_method IN ('cod', 'Thanh toán khi nhận hàng') AND payment_status = 'pending'
    `);
    console.log(
      `  ${pendingCOD[0].count === 0 ? '✅' : '❌'} Delivered COD orders with pending payment: ${pendingCOD[0].count}`
    );

    const [zeroCost] = await connection.query(`
        SELECT COUNT(*) as count FROM order_items WHERE cost_price = 0
    `);
    console.log(
      `  ${zeroCost[0].count === 0 ? '✅' : '❌'} Order items with zero cost: ${zeroCost[0].count}`
    );

    const [wh2Inventory] = await connection.query(`
        SELECT COUNT(*) as count FROM inventory WHERE warehouse_id = 2
    `);
    console.log(
      `  ${wh2Inventory[0].count > 0 ? '✅' : '❌'} Warehouse ID 2 Inventory Rows: ${wh2Inventory[0].count}`
    );

    console.log('\n=== AUDIT COMPLETE ===');
  } catch (error) {
    console.error('\n❌ AUDIT FAILED:', error);
  } finally {
    await connection.end();
  }
}

globalAudit();
