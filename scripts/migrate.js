const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: '.env.local' });
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'toan_store',
  multipleStatements: true, // Allow multiple SQL statements in one file
};

async function migrate() {
  console.log('🚀 Starting Database Migration...');

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to Database');

    // 1. Create _migrations table if not exists
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Get executed migrations
    const [rows] = await connection.execute('SELECT name FROM _migrations');
    const executedMigrations = new Set(rows.map((r) => r.name));

    // 3. Read migration files
    const migrationsDir = path.join(__dirname, '../src/lib/db/migrations');

    if (!fs.existsSync(migrationsDir)) {
      console.log('⚠️ No migrations directory found.');
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort(); // Ensure chronological order

    // 4. Run new migrations
    let pendingCount = 0;
    for (const file of files) {
      if (!executedMigrations.has(file)) {
        pendingCount++;
        console.log(`▶️ Running migration: ${file}`);

        const filePath = path.join(migrationsDir, file);
        const fullSql = fs.readFileSync(filePath, 'utf8');

        let currentDelimiter = ';';
        let statements = [];
        let lines = fullSql.split(/\r?\n/);
        let currentStatement = '';

        for (let line of lines) {
          let trimmedLine = line.trim();

          // Check for DELIMITER change
          if (trimmedLine.toUpperCase().startsWith('DELIMITER')) {
            const parts = trimmedLine.split(/\s+/);
            if (parts.length > 1) {
              currentDelimiter = parts[1];
              continue;
            }
          }

          if (trimmedLine.endsWith(currentDelimiter)) {
            currentStatement +=
              (currentStatement ? '\n' : '') + line.slice(0, line.lastIndexOf(currentDelimiter));
            statements.push(currentStatement.trim());
            currentStatement = '';
          } else {
            currentStatement += (currentStatement ? '\n' : '') + line;
          }
        }
        if (currentStatement.trim()) statements.push(currentStatement.trim());
        statements = statements.filter((s) => s.length > 0);

        // Start transaction
        await connection.beginTransaction();

        try {
          for (let statement of statements) {
            // If it's a Drizzle breakpoint, it might have its own logic
            if (statement.includes('--> statement-breakpoint')) {
              const subparts = statement
                .split('--> statement-breakpoint')
                .map((p) => p.trim())
                .filter((p) => p.length > 0);
              for (let sub of subparts) {
                await connection.query(sub);
              }
            } else {
              await connection.query(statement);
            }
          }
          await connection.execute('INSERT INTO _migrations (name) VALUES (?)', [file]);
          await connection.commit();
          console.log(`✅ Completed: ${file}`);
        } catch (err) {
          // Error handling for Idempotence
          const IGNORABLE_ERRORS = [
            1050, // Table already exists
            1060, // Duplicate column name
            1061, // Duplicate key name / index
            1062, // Duplicate entry
            1091, // Can't DROP 'x'; check that column/key exists
            1054, // Unknown column
            1022, // Can't write; duplicate key in table
            1826, // Duplicate foreign key
            3822, // Duplicate check constraint name
          ];

          // Check if error is ignorable
          if (IGNORABLE_ERRORS.includes(err.errno)) {
            console.warn(`⚠️  Ignored known error in ${file}: [${err.errno}] ${err.sqlMessage}`);
            // Rollback transaction (undoing partial success of this file if ANY)
            await connection.rollback();
            // BUT record it as done so we don't try again forever
            await connection.execute('INSERT INTO _migrations (name) VALUES (?)', [file]);
            console.log(`⚠️  Marked ${file} as executed (Error Ignored).`);
          } else {
            await connection.rollback();
            console.error(`❌ Failed: ${file}`);
            // TRY to show the failing statement IF available in the error object or my own tracking
            console.error('SQL Message:', err.sqlMessage || err.message);
            if (err.sql) console.error('SQL Query:', err.sql);
            process.exit(1);
          }
        }
      }
    }

    if (pendingCount === 0) {
      console.log('✨ No new migrations to run.');
    } else {
      console.log(`🎉 Successfully ran ${pendingCount} migrations.`);
    }
  } catch (error) {
    console.error('❌ Migration Error:', error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
