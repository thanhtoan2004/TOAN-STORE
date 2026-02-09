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
        console.log('Columns:', columns.map(c => c.Field).join(', '));

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

check();
