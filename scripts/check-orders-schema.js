const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function checkOrdersSchema() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'nike_clone',
        });

        console.log('--- ORDERS TABLE ---');
        const [columns] = await connection.query('DESCRIBE orders');
        columns.forEach(c => console.log(`${c.Field} (${c.Type}) Null: ${c.Null}`));

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkOrdersSchema();
