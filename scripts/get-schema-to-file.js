const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function check() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'nike_clone',
        });

        const [columns] = await connection.query('DESCRIBE user_addresses');
        const output = columns.map(c => `${c.Field} (${c.Type})`).join('\n');

        fs.writeFileSync('user_addresses_schema.txt', output);
        console.log('Schema written to user_addresses_schema.txt');

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
        fs.writeFileSync('user_addresses_schema.txt', 'Error: ' + error.message);
    }
}

check();
