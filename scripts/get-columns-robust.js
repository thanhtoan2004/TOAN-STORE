const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function check() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'nike_clone',
        });

        console.log('Fetching columns...');
        const [columns] = await connection.query('DESCRIBE user_addresses');

        for (const col of columns) {
            console.log(`Column: ${col.Field} (${col.Type})`);
        }

        // Wait to ensure output is flushed
        await new Promise(resolve => setTimeout(resolve, 1000));

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

check();
