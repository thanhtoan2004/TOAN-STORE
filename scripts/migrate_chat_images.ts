import { pool } from '../src/lib/db/mysql';

async function migrate() {
    try {
        console.log('Adding image_url column to support_messages table...');

        await pool.execute(`
            ALTER TABLE support_messages
            ADD COLUMN image_url VARCHAR(255) NULL AFTER message
        `);

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit();
    }
}

migrate();
