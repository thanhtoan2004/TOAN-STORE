const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function checkOrdersSchema() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'nike_clone',
        });

        const [columns] = await connection.query('DESCRIBE orders');
        console.log(columns.map(c => `${c.Field}`).join('\n'));
        fs.writeFileSync('orders_schema_utf8.txt', columns.map(c => `${c.Field} (${c.Type}) Null: ${c.Null}`).join('\n'), 'utf8');

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkOrdersSchema();
