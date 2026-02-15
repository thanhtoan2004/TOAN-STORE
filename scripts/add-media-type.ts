
import { executeQuery, pool } from '../src/lib/db/mysql';

async function migrate() {
    try {
        console.log('Adding media_type column to product_images...');
        await executeQuery(
            "ALTER TABLE product_images ADD COLUMN media_type ENUM('image', 'video') NOT NULL DEFAULT 'image' AFTER url"
        );
        console.log('Migration successful');
    } catch (error: any) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Column media_type already exists. Skipping.');
        } else {
            console.error('Migration failed:', error);
            process.exit(1);
        }
    } finally {
        await pool.end();
    }
}

migrate();
