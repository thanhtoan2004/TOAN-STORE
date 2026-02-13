const { initDb } = require('./src/lib/db/init');
require('dotenv').config();

async function runInit() {
    console.log('Running database initialization and migrations...');
    const success = await initDb();
    if (success) {
        console.log('Database migration completed successfully!');
        process.exit(0);
    } else {
        console.error('Database migration failed.');
        process.exit(1);
    }
}

runInit();
