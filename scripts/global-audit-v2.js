const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function globalAuditV2() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'toan_store',
  });

  console.log('=== GLOBAL PROJECT AUDIT V2 ===\n');

  try {
    const dbName = process.env.DB_NAME || 'toan_store';

    // 1. Check coupon_usage for UK
    const [couponUsageSchema] = await connection.query(`SHOW CREATE TABLE coupon_usage`);
    const cuCreateSql = couponUsageSchema[0]['Create Table'];
    console.log('--- coupon_usage UK Check ---');
    if (cuCreateSql.includes('UNIQUE KEY `uk_user_coupon`')) {
      console.log('✅ UNIQUE KEY `uk_user_coupon`: FOUND');
    } else {
      console.warn('⚠️  UNIQUE KEY `uk_user_coupon`: MISSING (Race condition risk!)');
    }

    // 2. Check news for author FK
    const [newsSchema] = await connection.query(`SHOW CREATE TABLE news`);
    const newsCreateSql = newsSchema[0]['Create Table'];
    console.log('\n--- news FK Check ---');
    if (
      newsCreateSql.includes('CONSTRAINT') &&
      newsCreateSql.includes('FOREIGN KEY (`author_id`) REFERENCES `admin_users` (`id`)')
    ) {
      console.log('✅ News Author FK: FOUND');
    } else {
      console.warn('⚠️  News Author FK: MISSING (Orphan risk!)');
    }

    // 3. Check flash_sale_items for CHECK
    const [fsiSchema] = await connection.query(`SHOW CREATE TABLE flash_sale_items`);
    const fsiCreateSql = fsiSchema[0]['Create Table'];
    console.log('\n--- flash_sale_items CHECK Check ---');
    if (fsiCreateSql.includes('CONSTRAINT `chk_flash_sold_not_exceed` CHECK')) {
      console.log('✅ flash_sale_items Check Constraint: FOUND');
    } else {
      console.warn('⚠️  flash_sale_items Check Constraint: MISSING (Overselling risk!)');
    }

    // 4. Check for trg_enforce_flash_sale_limit
    const [triggers] = await connection.query(
      `SELECT TRIGGER_NAME FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = ?`,
      [dbName]
    );
    const triggerNames = triggers.map((t) => t.TRIGGER_NAME);
    console.log('\n--- Global Trigger Check ---');
    const criticalTriggers = [
      'trg_enforce_flash_sale_limit',
      'trg_inventory_before_insert',
      'trg_daily_metrics_sync',
    ];
    for (const t of criticalTriggers) {
      console.log(
        `${triggerNames.includes(t) ? '✅' : '❌'} Trigger ${t}: ${triggerNames.includes(t) ? 'OK' : 'MISSING'}`
      );
    }

    console.log('\n=== AUDIT V2 COMPLETE ===');
  } catch (error) {
    console.error('Audit V2 Failed:', error);
  } finally {
    await connection.end();
  }
}

globalAuditV2();
