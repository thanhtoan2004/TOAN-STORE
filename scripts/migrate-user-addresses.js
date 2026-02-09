const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'nike_clone',
        });

        console.log('Checking user_addresses columns...');
        const [columns] = await connection.query('DESCRIBE user_addresses');
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('ward')) {
            console.log('Adding ward column...');
            await connection.query('ALTER TABLE user_addresses ADD COLUMN ward VARCHAR(100) AFTER address_line');
        } else {
            console.log('ward column already exists.');
        }

        if (!columnNames.includes('district')) {
            console.log('Adding district column...');
            await connection.query('ALTER TABLE user_addresses ADD COLUMN district VARCHAR(100) AFTER ward');
        } else {
            console.log('district column already exists.');
        }

        console.log('Migration completed.');
        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

migrate();
