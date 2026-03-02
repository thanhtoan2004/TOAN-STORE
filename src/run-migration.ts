import { pool } from './lib/db/connection';
import { migratePIIData } from './lib/db/migrations/pii-migration';

async function main() {
    try {
        await migratePIIData();
        console.log('Migration finished.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

main();
