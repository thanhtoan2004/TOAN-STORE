const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

async function applyPhase15() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'toan_store',
    multipleStatements: false, // Run one by one for better error handling
  });

  console.log('Connected to database.');

  try {
    const migrationPath = path.join(
      __dirname,
      '../src/lib/db/migrations/2026_03_09_0000_phase15_full_fix.sql'
    );
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying Phase 15 migration...');

    // Custom parser to handle statements and triggers
    const lines = sql.split('\n');
    let statements = [];
    let currentStatement = '';
    let inTrigger = false;

    for (let line of lines) {
      let trimmed = line.trim();
      if (trimmed.startsWith('--') || trimmed === '') continue;

      if (trimmed.startsWith('DELIMITER $$')) {
        inTrigger = true;
        continue;
      }
      if (trimmed.startsWith('DELIMITER ;')) {
        inTrigger = false;
        continue;
      }

      if (inTrigger) {
        currentStatement += line + '\n';
        if (trimmed.endsWith('$$')) {
          statements.push(currentStatement.replace('$$', '').trim());
          currentStatement = '';
        }
      } else {
        currentStatement += line + '\n';
        if (trimmed.endsWith(';')) {
          statements.push(currentStatement.trim());
          currentStatement = '';
        }
      }
    }

    for (let stmt of statements) {
      if (!stmt) continue;
      try {
        console.log(`Executing: ${stmt.substring(0, 50)}...`);
        await connection.query(stmt);
      } catch (err) {
        // Ignore "Duplicate" errors for idempotency
        if (
          err.code === 'ER_DUP_KEYNAME' ||
          err.code === 'ER_DUP_FIELDNAME' ||
          err.code === 'ER_FK_DUP_NAME' ||
          err.code === 'ER_TABLE_EXISTS_ERROR'
        ) {
          console.warn(`  ⚠️  Skipping (already exists): ${err.code}`);
        } else {
          throw err;
        }
      }
    }

    console.log('Phase 15 migration applied successfully.');
  } catch (error) {
    console.error('Error applying Phase 15 migration:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

applyPhase15();
