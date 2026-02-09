const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function cleanup() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'nike_clone',
        });

        console.log('Dropping temporary addresses table...');
        await connection.query('DROP TABLE IF EXISTS addresses');
        console.log('Temporary addresses table dropped.');

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

cleanup();
