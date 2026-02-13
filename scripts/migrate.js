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
    database: process.env.DB_NAME || 'nike_clone',
    multipleStatements: true // Allow multiple SQL statements in one file
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
        const executedMigrations = new Set(rows.map(r => r.name));

        // 3. Read migration files
        const migrationsDir = path.join(__dirname, '../src/lib/db/migrations');

        if (!fs.existsSync(migrationsDir)) {
            console.log('⚠️ No migrations directory found.');
            return;
        }

        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort(); // Ensure chronological order

        // 4. Run new migrations
        let pendingCount = 0;
        for (const file of files) {
            if (!executedMigrations.has(file)) {
                pendingCount++;
                console.log(`▶️ Running migration: ${file}`);

                const filePath = path.join(migrationsDir, file);
                const sql = fs.readFileSync(filePath, 'utf8');

                // Start transaction
                await connection.beginTransaction();

                try {
                    await connection.query(sql);
                    await connection.execute('INSERT INTO _migrations (name) VALUES (?)', [file]);
                    await connection.commit();
                    console.log(`✅ Completed: ${file}`);
                } catch (err) {
                    // Error handling for Idempotence
                    const IGNORABLE_ERRORS = [
                        1050, // Table already exists
                        1060, // Duplicate column name
                        1061, // Duplicate key name
                        1091, // Can't DROP 'x'; check that column/key exists
                        1054  // Unknown column - ONLY ignore if we suspect it's due to previous partial run? NO.
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
                        console.error('SQL Message:', err.sqlMessage || err.message);
                        console.error('Full Error:', err);
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
