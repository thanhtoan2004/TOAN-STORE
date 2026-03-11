const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

async function applyPhase16() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'toan_store',
    multipleStatements: false,
  });

  console.log('Connected to database for Phase 16 Fixes.');

  try {
    const migrationPath = path.join(
      __dirname,
      '../src/lib/db/migrations/2026_03_09_1000_phase16_audit_fixes.sql'
    );
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying Phase 16 Audit Fixes...');

    const lines = sql.split('\n');
    let statements = [];
    let currentStatement = '';

    for (let line of lines) {
      let trimmed = line.trim();
      if (trimmed.startsWith('--') || trimmed === '') continue;

      currentStatement += line + '\n';
      if (trimmed.endsWith(';')) {
        statements.push(currentStatement.trim());
        currentStatement = '';
      }
    }

    for (let stmt of statements) {
      if (!stmt) continue;
      try {
        console.log(`Executing: ${stmt.substring(0, 50)}...`);
        await connection.query(stmt);
      } catch (err) {
        if (
          err.code === 'ER_DUP_KEYNAME' ||
          err.code === 'ER_DUP_FIELDNAME' ||
          err.code === 'ER_FK_DUP_NAME' ||
          err.code === 'ER_TABLE_EXISTS_ERROR'
        ) {
          console.warn(`  ⚠️  Skipping: ${err.code}`);
        } else {
          throw err;
        }
      }
    }

    console.log('Phase 16 Audit Fixes applied successfully.');
  } catch (error) {
    console.error('Error applying Phase 16 Audit Fixes:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

applyPhase16();
