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

        console.log('--- Tables ---');
        const [tables] = await connection.query('SHOW TABLES');
        console.log(tables.map(t => Object.values(t)[0]));

        console.log('\n--- Checking user_addresses ---');
        try {
            const [columns] = await connection.query('DESCRIBE user_addresses');
            console.log(columns.map(c => `${c.Field} (${c.Type})`));
        } catch (e) {
            console.log('user_addresses does not exist or error:', e.message);
        }

        console.log('\n--- Checking addresses ---');
        try {
            const [columns] = await connection.query('DESCRIBE addresses');
            console.log(columns.map(c => `${c.Field} (${c.Type})`));
        } catch (e) {
            console.log('addresses does not exist or error:', e.message);
        }

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

check();
