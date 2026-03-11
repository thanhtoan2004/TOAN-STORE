const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'toan_store',
    multipleStatements: true,
  });

  console.log('--- Phase 17 Migration Starting ---');

  try {
    const migrationPath = path.join(
      __dirname,
      '..',
      'src',
      'lib',
      'db',
      'migrations',
      '2026_03_09_1100_phase17_logic_hardening.sql'
    );
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying Phase 17 SQL...');
    await connection.query(sql);
    console.log('✅ SQL Migration applied successfully.');

    // Record migration
    await connection.execute('INSERT INTO _migrations (name) VALUES (?)', [
      '2026_03_09_1100_phase17_logic_hardening.sql',
    ]);
    console.log('✅ Migration record added.');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.message.includes('Duplicate column name')) {
      console.log('ℹ️ Some parts already applied, continuing...');
    } else {
      process.exit(1);
    }
  } finally {
    await connection.end();
    console.log('--- Phase 17 Migration Finished ---');
  }
}

runMigration();
