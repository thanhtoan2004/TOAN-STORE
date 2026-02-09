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

        const [tables] = await connection.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);
        console.log('Tables:', JSON.stringify(tableNames));

        if (tableNames.includes('user_addresses')) {
            const [columns] = await connection.query('DESCRIBE user_addresses');
            console.log('user_addresses schema:', JSON.stringify(columns));
        } else {
            console.log('user_addresses table NOT found.');
        }

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

check();
